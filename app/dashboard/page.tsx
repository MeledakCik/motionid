'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  Clock,
  Film,
  FlaskConical,
  FolderOpen,
  Home,
  LayoutGrid,
  LayoutTemplate,
  List,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plug,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GlassTabBar } from '@/components/glass/GlassTabBar';
import { analyzePrompt, INTENT_LABELS } from '@/lib/studio/prompt';
import type { Intent } from '@/lib/studio/types';
import { cx, LazyVisible, Logo } from '@/components/studio/ui';
import { TemplateThumb } from '@/components/studio/Thumbs';
import ExampleGallery from '@/components/landing/ExampleGallery';

interface ProjectRow {
  id: string;
  title: string;
  topic: string;
  category: 'quote' | 'promo' | 'edukasi';
  template_id: string;
  status: 'draft' | 'published';
  updated_at: string;
  style_json: { thumb?: string | null; intent?: Intent; aspectRatio?: string; scenes?: number } | null;
}

type Tab = 'home' | 'projects' | 'templates';

const QUICK = ['Promo produk baru', '5 tips hemat', 'Kata-kata motivasi', 'Menu warung', 'Lowongan kerja'];

/** Pintasan format ala Canva/CapCut: ukuran kanvas populer */
const FORMATS = [
  { label: 'TikTok', sub: '9:16', w: 18, h: 32, color: 'from-[#FF3D7F] to-[#7B50FF]', prompt: 'Video TikTok promo produk baru' },
  { label: 'Reels', sub: '9:16', w: 18, h: 32, color: 'from-[#B04DFF] to-[#FF4D9D]', prompt: 'Reels tips singkat yang bermanfaat' },
  { label: 'Shorts', sub: '9:16', w: 18, h: 32, color: 'from-[#FF3D3D] to-[#FF8A3D]', prompt: 'Shorts fakta unik yang jarang diketahui' },
  { label: 'Story', sub: '9:16', w: 18, h: 32, color: 'from-[#7B50FF] to-[#C6F432]', prompt: 'Story pengumuman toko buka hari ini' },
  { label: 'Feed', sub: '1:1', w: 26, h: 26, color: 'from-[#3EE6B0] to-[#5AB8FF]', prompt: 'Postingan feed kata-kata motivasi' },
  { label: 'Portrait', sub: '4:5', w: 22, h: 28, color: 'from-[#5AB8FF] to-[#7A5CFF]', prompt: 'Poster promo flash sale akhir pekan' },
  { label: 'YouTube', sub: '16:9', w: 32, h: 18, color: 'from-[#FF4D4D] to-[#B21F1F]', prompt: 'Intro video tutorial langkah demi langkah' },
];

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'promo', label: 'Promo' },
  { id: 'edukasi', label: 'Edukasi' },
  { id: 'quote', label: 'Quote' },
] as const;

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Thumbnail proyek: pakai gambar tersimpan, kalau belum ada render frame pertama dari topik + template. */
function ProjectThumb({ p }: { p: ProjectRow }) {
  const plan = useMemo(() => {
    try {
      return analyzePrompt(p.topic || p.title, { seed: 4 });
    } catch {
      return null;
    }
  }, [p.topic, p.title]);
  if (p.style_json?.thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.style_json.thumb} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />;
  }
  if (!plan) return <div className="flex h-full items-center justify-center p-3 text-center text-xs font-bold text-mk-muted">{p.title}</div>;
  return (
    <LazyVisible minH={120} className="h-full w-full transition duration-300 group-hover:scale-[1.03]">
      <TemplateThumb plan={plan} templateId={p.template_id} aspect="9:16" assets={{}} />
    </LazyVisible>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'promo' | 'quote' | 'edukasi'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<Tab>('home');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data, error: err }, userRes] = await Promise.all([
        supabase.from('projects').select('id, title, topic, category, template_id, status, updated_at, style_json').order('updated_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com').toLowerCase();
      const u = userRes.data.user;
      setIsAdmin((u?.email || '').toLowerCase() === adminEmail);
      setEmail(u?.email || '');
      setName((u?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || '');
      if (err) setError(/does not exist|schema cache/i.test(err.message) ? 'Tabel projects belum ada. Jalankan supabase/migration.sql di SQL Editor Supabase.' : err.message);
      else setProjects((data || []) as ProjectRow[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem('mk-dash-view');
      if (v === 'grid' || v === 'list') setView(v);
    } catch {}
  }, []);
  const changeView = (v: 'grid' | 'list') => {
    setView(v);
    try {
      localStorage.setItem('mk-dash-view', v);
    } catch {}
  };

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuId]);

  const remove = async (id: string) => {
    const { error: e } = await createClient().from('projects').delete().eq('id', id);
    setConfirmId(null);
    if (e) return setError(e.message);
    setProjects((p) => p.filter((x) => x.id !== id));
  };

  const logout = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  const go = (text: string) => router.push(`/create?prompt=${encodeURIComponent(text)}&auto=1`);
  const submitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) go(prompt.trim());
    else router.push('/create');
  };

  const list = projects.filter((p) => {
    const s = q.toLowerCase();
    return (!s || p.title.toLowerCase().includes(s) || p.topic.toLowerCase().includes(s)) && (filter === 'all' || p.category === filter);
  });
  const recent = list.slice(0, tab === 'home' ? 9 : list.length);

  const NAV: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'projects', label: 'Proyek', icon: FolderOpen },
    { id: 'templates', label: 'Template', icon: LayoutTemplate },
  ];

  const initial = (name || email || 'M').charAt(0).toUpperCase();

  /* ---------- Bagian: daftar proyek ---------- */
  const projectSection = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-extrabold">{tab === 'home' ? 'Proyek terbaru' : 'Semua proyek'}</h2>
        <div className="flex items-center gap-1 rounded-xl border border-white/80 bg-white/70 p-1 shadow-mk-card">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cx('rounded-lg px-3 py-1.5 text-xs font-bold transition', filter === f.id ? 'bg-mk-coral text-white' : 'text-mk-dim hover:text-mk-cream')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/80 bg-white/70 p-1 shadow-mk-card">
          <button type="button" onClick={() => changeView('grid')} className={cx('rounded-lg p-1.5 transition', view === 'grid' ? 'bg-mk-coral text-white' : 'text-mk-dim hover:text-mk-cream')} aria-label="Tampilan grid">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => changeView('list')} className={cx('rounded-lg p-1.5 transition', view === 'list' ? 'bg-mk-coral text-white' : 'text-mk-dim hover:text-mk-cream')} aria-label="Tampilan daftar">
            <List className="h-4 w-4" />
          </button>
        </div>
        {tab === 'home' && list.length > 9 && (
          <button type="button" onClick={() => setTab('projects')} className="flex items-center gap-1 text-xs font-bold text-mk-coral hover:underline">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[9/14] animate-mk-pulse rounded-xl bg-white/60" />
          ))}
        </div>
      ) : !list.length ? (
        projects.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-mk-line-2 p-10 text-center">
            <Film className="h-8 w-8 text-mk-coral" />
            <p className="text-sm text-mk-muted">Tidak ada proyek yang cocok.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-mk-line-2 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mk-coral/15">
              <Film className="h-7 w-7 text-mk-coral" />
            </div>
            <div className="text-base font-extrabold">Belum ada video</div>
            <p className="max-w-sm text-sm text-mk-muted">Tulis ide di kolom atas, atau pilih salah satu template untuk mulai.</p>
            <Link href="/create" className="mk-btn-primary mt-1 px-4 py-2 text-sm">
              <Plus className="h-4 w-4" /> Buat video pertama
            </Link>
          </div>
        )
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Link
            href="/create"
            className="group flex aspect-[9/14] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-mk-line-2 bg-mk-panel/40 text-mk-muted transition hover:border-mk-coral hover:bg-mk-coral/5 hover:text-mk-coral"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mk-panel-3 transition group-hover:bg-mk-grad group-hover:text-white">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-bold">Video baru</span>
          </Link>
          {recent.map((p) => (
            <div key={p.id} className="group relative min-w-0">
              <Link href={`/editor/${p.id}`} className="block">
                <div className="relative aspect-[9/14] overflow-hidden rounded-xl border border-mk-line bg-mk-ink shadow-mk-card transition group-hover:border-mk-coral/70 group-hover:ring-2 group-hover:ring-mk-coral/30">
                  <ProjectThumb p={p} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 transition group-hover:opacity-100" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    {p.style_json?.intent ? INTENT_LABELS[p.style_json.intent] : p.category}
                  </span>
                  {p.style_json?.scenes ? (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Film className="h-3 w-3" /> {p.style_json.scenes}
                    </span>
                  ) : null}
                  <span className="absolute bottom-2 left-2 flex translate-y-2 items-center gap-1 rounded-lg bg-mk-grad px-2.5 py-1 text-[11px] font-extrabold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <Pencil className="h-3 w-3" /> Edit
                  </span>
                </div>
                <div className="px-0.5 pt-2">
                  <div className="truncate text-[13px] font-bold">{p.title}</div>
                  <div className="flex items-center gap-1 text-[11px] text-mk-dim">
                    <Clock className="h-3 w-3" /> {timeAgo(p.updated_at)}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId(menuId === p.id ? null : p.id);
                }}
                className={cx(
                  'absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/75',
                  menuId === p.id ? 'flex' : 'hidden group-hover:flex'
                )}
                aria-label="Menu proyek"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuId === p.id && (
                <div onClick={(e) => e.stopPropagation()} className="mk-glass mk-pop mk-float absolute right-2 top-10 z-20 w-40 animate-mk-up overflow-hidden rounded-xl border border-white/80 p-1">
                  <Link href={`/editor/${p.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-white">
                    <Pencil className="h-3.5 w-3.5" /> Buka di editor
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuId(null);
                      setConfirmId(p.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
              {confirmId === p.id && (
                <div className="absolute inset-x-0 top-0 flex aspect-[9/14] flex-col items-center justify-center gap-2 rounded-xl bg-mk-deep/90 p-3 text-center text-white">
                  <span className="text-xs font-semibold">Hapus proyek ini?</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => remove(p.id)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold">
                      Hapus
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold">
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mk-card overflow-hidden !rounded-xl">
          <div className="hidden grid-cols-[1fr_140px_140px_44px] gap-3 border-b border-mk-line bg-white/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-mk-dim sm:grid">
            <span>Nama</span>
            <span>Jenis</span>
            <span>Diubah</span>
            <span />
          </div>
          {recent.map((p) => (
            <div key={p.id} className="group grid grid-cols-[1fr_44px] items-center gap-3 border-b border-mk-line px-4 py-2.5 last:border-0 hover:bg-white/70 sm:grid-cols-[1fr_140px_140px_44px]">
              <Link href={`/editor/${p.id}`} className="flex min-w-0 items-center gap-3">
                <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded-md border border-mk-line bg-mk-ink">
                  <ProjectThumb p={p} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold group-hover:text-mk-coral">{p.title}</div>
                  <div className="truncate text-[11px] text-mk-dim sm:hidden">{timeAgo(p.updated_at)}</div>
                </div>
              </Link>
              <span className="hidden text-xs text-mk-muted sm:block">{p.style_json?.intent ? INTENT_LABELS[p.style_json.intent] : p.category}</span>
              <span className="hidden text-xs text-mk-muted sm:block">{timeAgo(p.updated_at)}</span>
              {confirmId === p.id ? (
                <button type="button" onClick={() => remove(p.id)} onBlur={() => setConfirmId(null)} className="rounded-md bg-red-500 px-1.5 py-1 text-[10px] font-bold" autoFocus>
                  Yakin?
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmId(p.id)} className="mk-btn-icon h-8 w-8 opacity-0 hover:text-red-400 group-hover:opacity-100" aria-label="Hapus proyek">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const templateSection = (full: boolean) => (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-lg font-extrabold">{full ? 'Template' : 'Template populer'}</h2>
        {!full && (
          <button type="button" onClick={() => setTab('templates')} className="flex items-center gap-1 text-xs font-bold text-mk-coral hover:underline">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="-mt-2 text-sm text-mk-muted">Klik salah satu, videonya langsung jadi dan bisa kamu ubah sesukamu.</p>
      <ExampleGallery />
    </section>
  );

  return (
    <div className="flex min-h-screen text-mk-cream">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="mk-glass sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-white/70 px-3 py-4 lg:flex">
        <Link href="/" className="px-2">
          <Logo />
        </Link>
        <Link href="/create" className="mk-btn-primary mt-5 w-full justify-center py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Buat video
        </Link>
        <nav className="mt-5 space-y-0.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                tab === n.id ? 'bg-mk-coral text-white shadow-mk-glow' : 'text-mk-muted hover:bg-white/80 hover:text-mk-cream'
              )}
            >
              <n.icon className="h-[18px] w-[18px]" />
              {n.label}
              {n.id === 'projects' && projects.length > 0 && <span className={cx('ml-auto rounded-md px-1.5 text-[10px] font-bold', tab === n.id ? 'bg-white/20 text-white' : 'bg-mk-panel-3 text-mk-dim')}>{projects.length}</span>}
            </button>
          ))}
          {isAdmin && (
            <div className="mt-2 space-y-0.5 rounded-xl border border-white/60 bg-white/40 p-1.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-mk-dim">Admin</div>
              <Link href="/admin" className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-mk-muted transition hover:bg-white/80 hover:text-mk-cream">
                <Brain className="h-[17px] w-[17px]" /> Training Studio
              </Link>
              <Link href="/admin/research" className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-mk-muted transition hover:bg-white/80 hover:text-mk-cream">
                <FlaskConical className="h-[17px] w-[17px]" /> Motion Lab
              </Link>
              <Link href="/admin/mcp" className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-mk-muted transition hover:bg-white/80 hover:text-mk-cream">
                <Plug className="h-[17px] w-[17px]" /> MCP Connector
              </Link>
            </div>
          )}
        </nav>

        <div className="mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-mk-dim">Ide cepat</div>
        <div className="mt-2 space-y-0.5">
          {QUICK.map((qq) => (
            <button key={qq} type="button" onClick={() => go(qq)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-mk-muted transition hover:bg-white/80 hover:text-mk-cream">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-mk-coral" /> <span className="truncate">{qq}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/70 p-2 shadow-mk-card">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mk-grad text-sm font-extrabold text-white">{initial}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold">{name || 'Akun saya'}</div>
            <div className="truncate text-[10px] text-mk-dim">{email}</div>
          </div>
          <button type="button" onClick={logout} className="mk-btn-icon h-8 w-8" title="Keluar" aria-label="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ---------- Area utama ---------- */}
      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <header className="mk-glass mk-bar sticky top-0 z-30 border-b border-white/60">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
            <Link href="/" className="lg:hidden">
              <Logo />
            </Link>
            <div className="relative ml-auto w-full max-w-md lg:ml-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-dim" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (e.target.value && tab === 'templates') setTab('projects');
                }}
                placeholder="Cari proyek…"
                className="w-full rounded-xl border border-mk-line bg-white/80 py-2 pl-9 pr-3 text-sm placeholder:text-mk-dim focus:border-mk-coral focus:outline-none focus:ring-2 focus:ring-mk-coral/20"
              />
            </div>
            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <Link href="/create" className="mk-btn-primary px-4 py-2 text-sm">
                <Plus className="h-4 w-4" /> Video baru
              </Link>
            </div>
            <button type="button" onClick={logout} className="mk-btn-icon lg:hidden" aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-10 px-4 pb-32 pt-6 lg:px-8 lg:pb-16">
          {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-600">{error}</div>}

          {tab === 'home' && (
            <>
              {/* Hero ala Canva: sapaan + kolom ide + pintasan format */}
              <section className="mk-mesh-deep relative overflow-hidden rounded-3xl px-5 py-8 text-center text-white shadow-[0_24px_60px_-28px_rgba(30,17,80,0.65)] sm:px-10 sm:py-12">
                <svg className="pointer-events-none absolute right-6 top-6 hidden h-12 w-44 sm:block" viewBox="0 0 208 56" fill="none" aria-hidden>
                  <path d="M3 40c12 0 14-34 28-34s14 44 28 44 14-38 28-38 14 32 28 32 14-26 28-26 14 18 28 18 14-30 35-34" stroke="#C6F432" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="relative">
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                    {name ? `Halo ${name}, ` : ''}mau bikin <span className="text-mk-lime">video apa</span> hari ini?
                  </h1>
                  <form onSubmit={submitPrompt} className="mk-glass-deep mx-auto mt-6 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/15 p-1.5 pl-4 focus-within:border-mk-lime/70 focus-within:ring-4 focus-within:ring-mk-lime/20">
                    <Wand2 className="h-5 w-5 shrink-0 text-mk-lime" />
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Tulis idemu… mis. Promo kopi susu gula aren 18rb"
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none sm:text-base"
                    />
                    <button type="submit" className="mk-btn-lime shrink-0 rounded-xl px-4 py-2.5 text-sm">
                      <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Buat</span>
                    </button>
                  </form>

                  {/* Pintasan format */}
                  <div className="mk-noscroll mx-auto mt-8 flex max-w-3xl gap-4 overflow-x-auto pb-1 sm:justify-center sm:gap-6">
                    {FORMATS.map((f) => (
                      <button key={f.label} type="button" onClick={() => go(f.prompt)} className="group flex w-16 shrink-0 flex-col items-center gap-2">
                        <span className={cx('flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-1 ring-white/20 transition group-hover:-translate-y-1 group-hover:ring-mk-lime/70', f.color)}>
                          <span className="rounded-[3px] border-2 border-white/90" style={{ width: f.w * 0.75, height: f.h * 0.75 }} />
                        </span>
                        <span className="text-xs font-semibold text-white/90">{f.label}</span>
                        <span className="-mt-1.5 text-[10px] text-white/55">{f.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Ide cepat (mobile; desktop ada di sidebar) */}
              <div className="mk-noscroll -mt-4 flex gap-2 overflow-x-auto lg:hidden">
                {QUICK.map((qq) => (
                  <button key={qq} type="button" onClick={() => go(qq)} className="mk-chip shrink-0">
                    <Sparkles className="h-3 w-3 text-mk-coral" /> {qq}
                  </button>
                ))}
              </div>

              {projectSection}
              {templateSection(false)}
            </>
          )}

          {tab === 'projects' && projectSection}
          {tab === 'templates' && templateSection(true)}
        </main>
      </div>

      {/* ---------- Navigasi bawah (HP): kapsul kaca melayang ala Depup Office ---------- */}
      <GlassTabBar
        className="lg:hidden"
        active={tab}
        action={{ href: '/create', label: 'Buat video', icon: Plus }}
        tabs={[
          { id: 'home', label: 'Beranda', icon: Home, onSelect: () => setTab('home') },
          { id: 'projects', label: 'Proyek', icon: FolderOpen, onSelect: () => setTab('projects') },
          { id: 'templates', label: 'Template', icon: LayoutTemplate, onSelect: () => setTab('templates') },
          isAdmin ? { id: 'admin', label: 'Admin', icon: Brain, href: '/admin' } : { id: 'logout', label: 'Keluar', icon: LogOut, onSelect: logout },
        ]}
      />
    </div>
  );
}
