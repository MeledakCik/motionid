'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Film,
  FlaskConical,
  FolderOpen,
  Home,
  LayoutGrid,
  LayoutTemplate,
  Lightbulb,
  List,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plug,
  Plus,
  Search,
  Send,
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
    <section className="mk-card space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold">{tab === 'home' ? 'Proyek terbaru' : 'Semua proyek'}</h2>
        <div className="flex items-center gap-1 rounded-full bg-mk-mist p-1" role="group" aria-label="Saring jenis">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cx('rounded-full px-3 py-1.5 text-xs font-semibold transition', filter === f.id ? 'bg-mk-deep text-white' : 'text-mk-muted hover:text-mk-cream')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-mk-mist p-1">
          <button type="button" onClick={() => changeView('grid')} className={cx('rounded-full p-1.5 transition', view === 'grid' ? 'bg-white text-mk-coral' : 'text-mk-dim hover:text-mk-cream')} aria-label="Tampilan grid">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => changeView('list')} className={cx('rounded-full p-1.5 transition', view === 'list' ? 'bg-white text-mk-coral' : 'text-mk-dim hover:text-mk-cream')} aria-label="Tampilan daftar">
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
            <div key={i} className="aspect-[9/14] animate-mk-pulse rounded-2xl bg-mk-mist" />
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
            className="group flex aspect-[9/14] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-mk-line-2 bg-mk-mist/40 text-mk-muted transition hover:border-mk-coral hover:bg-mk-coral/5 hover:text-mk-coral"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mk-panel-3 transition group-hover:bg-mk-coral group-hover:text-white">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-bold">Video baru</span>
          </Link>
          {recent.map((p) => (
            <div key={p.id} className="group relative min-w-0">
              <Link href={`/editor/${p.id}`} className="block">
                <div className="relative aspect-[9/14] overflow-hidden rounded-2xl bg-mk-mist transition group-hover:border-mk-coral/70 group-hover:ring-2 group-hover:ring-mk-coral/30">
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
                  <span className="absolute bottom-2 left-2 flex translate-y-2 items-center gap-1 rounded-lg bg-mk-coral px-2.5 py-1 text-[11px] font-extrabold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
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
        <div className="-mx-4 overflow-hidden sm:-mx-6">
          <div className="hidden grid-cols-[1fr_140px_140px_44px] gap-3 border-b border-mk-line px-4 py-2 sm:px-6 text-[11px] font-bold uppercase tracking-wider text-mk-dim sm:grid">
            <span>Nama</span>
            <span>Jenis</span>
            <span>Diubah</span>
            <span />
          </div>
          {recent.map((p) => (
            <div key={p.id} className="group grid grid-cols-[1fr_44px] items-center gap-3 border-b border-mk-line px-4 py-2.5 last:border-0 hover:bg-mk-mist/50 sm:px-6 sm:grid-cols-[1fr_140px_140px_44px]">
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
        <h2 className="mr-auto text-lg font-semibold">{full ? 'Template' : 'Template populer'}</h2>
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

  /* ---------- Data kartu bento (semua dari data asli, tanpa angka karangan) ---------- */
  const published = projects.filter((p) => p.status === 'published').length;
  const intents = new Set(projects.map((p) => p.style_json?.intent || p.category)).size;
  const steps = [
    { label: 'Buat video pertama', done: projects.length >= 1, act: () => router.push('/create') },
    { label: 'Coba 2 jenis video', done: intents >= 2, act: () => go('5 tips hemat buat anak kos') },
    { label: 'Kumpulkan 3 video', done: projects.length >= 3, act: () => router.push('/create') },
    { label: 'Terbitkan 1 video', done: published >= 1, act: () => projects[0] && router.push(`/editor/${projects[0].id}`) },
  ];
  const doneCount = steps.filter((x) => x.done).length;
  const showSteps = !loading && doneCount < steps.length;

  const checklist = (dark: boolean) => (
    <div className={cx('rounded-[20px] p-4', dark ? 'bg-white/[0.06] ring-1 ring-white/10' : 'mk-card')}>
      <div className="flex items-center justify-between">
        <span className={cx('text-sm font-semibold', dark ? 'text-white' : 'text-mk-cream')}>Mulai di sini</span>
        <span className={cx('text-xs font-medium', dark ? 'text-white/60' : 'text-mk-dim')}>
          {doneCount} dari {steps.length}
        </span>
      </div>
      <div className={cx('mt-2.5 h-1.5 overflow-hidden rounded-full', dark ? 'bg-white/10' : 'bg-mk-mist')}>
        <div className="h-full rounded-full bg-mk-lime transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-0.5">
        {steps.map((st) => (
          <li key={st.label}>
            <button
              type="button"
              disabled={st.done}
              onClick={st.act}
              className={cx(
                'flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-[13px] transition disabled:cursor-default',
                dark ? 'text-white/80 hover:bg-white/[0.06] disabled:hover:bg-transparent' : 'text-mk-muted hover:bg-mk-mist disabled:hover:bg-transparent'
              )}
            >
              {st.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-mk-lime" />
              ) : (
                <Circle className={cx('h-4 w-4 shrink-0', dark ? 'text-white/35' : 'text-mk-line-2')} />
              )}
              <span className={cx(st.done && 'line-through opacity-60')}>{st.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const navBtn = (active: boolean) =>
    cx(
      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
    );

  return (
    <div className="min-h-screen text-mk-cream lg:flex lg:gap-4 lg:p-4">
      {/* ---------- Sidebar (desktop): panel Midnight DepUp ---------- */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col rounded-[28px] bg-mk-deep p-3 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 px-2 pb-1 pt-1.5 text-white">
          <Logo className="[&_.text-mk-coral]:text-mk-lime" />
        </Link>
        <Link href="/create" className="mk-btn-lime mt-4 w-full">
          <Plus className="h-4 w-4" /> Buat video
        </Link>

        <div className="mk-noscroll mt-4 min-h-0 flex-1 overflow-y-auto">
          <nav className="space-y-0.5" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => setTab(n.id)} className={navBtn(tab === n.id)} aria-current={tab === n.id ? 'page' : undefined}>
                <n.icon className={cx('h-[18px] w-[18px]', tab === n.id && 'text-mk-lime')} />
                {n.label}
                {n.id === 'projects' && projects.length > 0 && <span className="ml-auto rounded-full bg-white/10 px-2 text-[11px] font-semibold text-white/80">{projects.length}</span>}
              </button>
            ))}
          </nav>

          {isAdmin && (
            <>
              <div className="mt-5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Admin</div>
              <div className="mt-1.5 space-y-0.5">
                <Link href="/admin" className={navBtn(false)}>
                  <Brain className="h-[18px] w-[18px]" /> Training Studio
                </Link>
                <Link href="/admin/research" className={navBtn(false)}>
                  <FlaskConical className="h-[18px] w-[18px]" /> Motion Lab
                </Link>
                <Link href="/admin/mcp" className={navBtn(false)}>
                  <Plug className="h-[18px] w-[18px]" /> MCP Connector
                </Link>
              </div>
            </>
          )}

          {projects.length > 0 && (
            <>
              <div className="mt-5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Terakhir dibuka</div>
              <div className="mt-1.5 space-y-0.5">
                {projects.slice(0, 5).map((p) => (
                  <Link key={p.id} href={`/editor/${p.id}`} className="block truncate rounded-xl px-3 py-2 text-[13px] text-white/70 transition hover:bg-white/[0.06] hover:text-white" title={p.title}>
                    {p.title}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {showSteps && <div className="mt-3">{checklist(true)}</div>}

        <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-white/[0.06] p-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mk-lime text-sm font-bold text-mk-deep">{initial}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{name || 'Akun saya'}</div>
            <div className="truncate text-[11px] text-white/50">{email}</div>
          </div>
          <button type="button" onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white" title="Keluar" aria-label="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ---------- Area utama ---------- */}
      <div className="min-w-0 flex-1">
        {/* Topbar: sapaan + cari + aksi (pola Coinview / Calescence) */}
        <header className="mk-glass mk-bar sticky top-0 z-30 border-b border-mk-line lg:static lg:border-0 lg:!bg-transparent lg:!bg-none lg:!shadow-none">
          <div className="flex h-16 items-center gap-3 px-4 lg:h-auto lg:px-2 lg:pb-5 lg:pt-2">
            <Link href="/" className="lg:hidden" aria-label="Beranda MotionKu">
              <Logo />
            </Link>
            <div className="hidden min-w-0 lg:block">
              <h1 className="truncate text-[28px] font-bold leading-tight">{tab === 'home' ? (name ? `Halo, ${name}` : 'Beranda') : tab === 'projects' ? 'Proyek' : 'Template'}</h1>
              <p className="text-sm text-mk-dim">{tab === 'home' ? 'Tulis satu kalimat, videonya langsung tersusun.' : tab === 'projects' ? `${projects.length} video tersimpan` : 'Klik salah satu, langsung bisa diedit.'}</p>
            </div>
            <div className="relative ml-auto w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-dim" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (e.target.value && tab !== 'projects') setTab('projects');
                }}
                placeholder="Cari proyek"
                aria-label="Cari proyek"
                className="h-10 w-full rounded-full border border-mk-line bg-white pl-10 pr-4 text-sm placeholder:text-mk-dim focus:border-mk-coral focus:outline-none focus:ring-4 focus:ring-mk-coral/15"
              />
            </div>
            <Link href="/create" className="mk-btn-primary hidden shrink-0 lg:inline-flex">
              <Plus className="h-4 w-4" /> Video baru
            </Link>
            <button type="button" onClick={logout} className="mk-btn-icon shrink-0 lg:hidden" aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-8 px-4 pb-32 pt-5 lg:px-2 lg:pb-10 lg:pt-0">
          {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</div>}

          {tab === 'home' && (
            <>
              <h1 className="text-2xl font-bold lg:hidden">{name ? `Halo, ${name}` : 'Halo'}</h1>
              {/* ---------- Bento ---------- */}
              <section className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-12">
                {/* Kolom ide (ungu DepUp) */}
                <div className="mk-tile-violet relative flex flex-col overflow-hidden p-6 sm:p-8 lg:col-span-7 lg:row-span-2">
                  <svg className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-white/[0.07]" viewBox="0 0 100 100" aria-hidden>
                    <path fill="currentColor" d="M50 4 96 50H70v46H30V50H4z" />
                  </svg>
                  <div className="relative">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mk-lime">Buat video</span>
                    <h2 className="mt-2 max-w-md text-[28px] font-bold leading-[1.1] sm:text-[36px]">
                      Mau bikin video apa <span className="text-mk-lime">hari ini?</span>
                    </h2>
                    <form onSubmit={submitPrompt} className="mt-6 flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 focus-within:ring-4 focus-within:ring-mk-lime/50">
                      <Wand2 className="h-5 w-5 shrink-0 text-mk-coral" aria-hidden />
                      <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Promo kopi susu gula aren 18rb"
                        aria-label="Ide video"
                        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-mk-cream placeholder:text-mk-dim focus:outline-none"
                      />
                      <button type="submit" className="mk-btn-lime shrink-0 px-4 sm:px-5">
                        <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Buat</span>
                      </button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {QUICK.map((qq) => (
                        <button key={qq} type="button" onClick={() => go(qq)} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/25 active:scale-[0.96]">
                          {qq}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="relative mt-6 flex items-start gap-2 border-t border-white/15 pt-4 text-[13px] leading-relaxed text-white/75 lg:mt-auto">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-mk-lime" aria-hidden />
                    <span>
                      Sebut harga, lokasi, jadwal, dan nomor WA di kalimatmu. Semuanya langsung terbaca dan jadi scene, tidak perlu diisi ulang.
                    </span>
                  </p>
                </div>

                {/* Angka (dari proyek asli) */}
                <div className="grid grid-cols-2 gap-4 lg:col-span-5">
                  <div className="mk-tile-lime flex flex-col justify-between">
                    <FolderOpen className="h-5 w-5" aria-hidden />
                    <div className="mt-6">
                      <div className="text-[40px] font-bold leading-none tracking-[-0.03em]">{loading ? '–' : projects.length}</div>
                      <div className="mt-1 text-sm font-medium">Video tersimpan</div>
                    </div>
                  </div>
                  <div className="mk-tile-night flex flex-col justify-between">
                    <Send className="h-5 w-5 text-mk-lime" aria-hidden />
                    <div className="mt-6">
                      <div className="text-[40px] font-bold leading-none tracking-[-0.03em]">{loading ? '–' : published}</div>
                      <div className="mt-1 text-sm font-medium text-white/70">Sudah terbit</div>
                    </div>
                  </div>
                </div>

                {/* Format cepat */}
                <div className="mk-card p-5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Mulai dari format</h2>
                    <span className="text-xs text-mk-dim">Ukuran kanvas populer</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-7 lg:grid-cols-4">
                    {FORMATS.map((f) => (
                      <button key={f.label} type="button" onClick={() => go(f.prompt)} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 transition hover:bg-mk-mist active:scale-[0.96]">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mk-mist text-mk-coral transition group-hover:bg-mk-coral group-hover:text-white">
                          <span className="rounded-[3px] border-2 border-current" style={{ width: f.w * 0.7, height: f.h * 0.7 }} />
                        </span>
                        <span className="text-xs font-semibold">{f.label}</span>
                        <span className="-mt-1 text-[10px] text-mk-dim">{f.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {showSteps && <div className="lg:hidden">{checklist(false)}</div>}

              {projectSection}
              {templateSection(false)}
            </>
          )}

          {tab === 'projects' && projectSection}
          {tab === 'templates' && templateSection(true)}
        </main>
      </div>

      {/* ---------- Navigasi bawah (HP): kapsul kaca melayang ---------- */}
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
