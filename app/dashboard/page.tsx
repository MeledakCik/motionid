'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, Film, LogOut, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { INTENT_LABELS } from '@/lib/studio/prompt';
import type { Intent } from '@/lib/studio/types';
import { cx, Logo } from '@/components/studio/ui';

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

const QUICK = ['Promo produk baru', '5 tips hemat', 'Kata-kata motivasi', 'Menu warung', 'Lowongan kerja'];

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'promo' | 'quote' | 'edukasi'>('all');
  const [name, setName] = useState('');

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
      setName((u?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || '');
      if (err) setError(/does not exist|schema cache/i.test(err.message) ? 'Tabel projects belum ada. Jalankan supabase/migration.sql di SQL Editor Supabase.' : err.message);
      else setProjects((data || []) as ProjectRow[]);
      setLoading(false);
    })();
  }, []);

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

  const list = projects.filter((p) => {
    const s = q.toLowerCase();
    return (!s || p.title.toLowerCase().includes(s) || p.topic.toLowerCase().includes(s)) && (filter === 'all' || p.category === filter);
  });

  return (
    <div className="mk-page">
      <header className="sticky top-0 z-30 border-b border-mk-line bg-mk-ink/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            {isAdmin && (
              <Link href="/admin" className="mk-btn-ghost px-3 py-2 text-xs">
                <Brain className="h-4 w-4" /> <span className="hidden sm:inline">Admin Training</span>
              </Link>
            )}
            <button type="button" onClick={logout} className="mk-btn-icon" title="Keluar" aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </button>
            <Link href="/create" className="mk-btn-primary px-4 py-2 text-xs sm:text-sm">
              <Plus className="h-4 w-4" /> Video baru
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6">
        <section className="mk-card relative overflow-hidden p-5 sm:p-7">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-mk-coral/20 blur-3xl" />
          <h1 className="text-2xl font-extrabold sm:text-3xl">Halo{name ? `, ${name}` : ''}</h1>
          <p className="mt-1 text-sm text-mk-muted">Mau bikin video apa hari ini?</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {QUICK.map((qq) => (
              <Link key={qq} href={`/create?prompt=${encodeURIComponent(qq)}`} className="mk-chip">
                <Sparkles className="h-3 w-3 text-mk-coral" /> {qq}
              </Link>
            ))}
          </div>
        </section>

        {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari proyek…" className="mk-input pl-9" />
          </div>
          <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
            {(['all', 'promo', 'edukasi', 'quote'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cx('mk-chip shrink-0', filter === f && 'mk-chip-on')}>
                {f === 'all' ? 'Semua' : f === 'promo' ? 'Promo' : f === 'edukasi' ? 'Edukasi' : 'Quote'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[9/14] animate-mk-pulse rounded-2xl bg-mk-panel" />
            ))}
          </div>
        ) : !list.length ? (
          <div className="mk-card flex flex-col items-center gap-3 p-10 text-center">
            <Film className="h-8 w-8 text-mk-coral" />
            <p className="text-sm text-mk-muted">{projects.length ? 'Tidak ada proyek yang cocok.' : 'Belum ada video. Yuk bikin yang pertama!'}</p>
            <Link href="/create" className="mk-btn-primary">
              <Plus className="h-4 w-4" /> Buat video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link href="/create" className="flex aspect-[9/14] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-mk-line-2 text-mk-muted transition hover:border-mk-coral hover:text-mk-coral">
              <Plus className="h-6 w-6" />
              <span className="text-xs font-bold">Video baru</span>
            </Link>
            {list.map((p) => (
              <div key={p.id} className="group relative">
                <Link href={`/editor/${p.id}`} className="block overflow-hidden rounded-2xl border border-mk-line bg-mk-panel transition hover:border-mk-coral/60">
                  <div className="relative aspect-[9/14] bg-mk-ink">
                    {p.style_json?.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.style_json.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-mk-grad/20 p-3 text-center text-xs font-bold text-mk-muted">{p.title}</div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-mk-cream backdrop-blur">
                      {p.style_json?.intent ? INTENT_LABELS[p.style_json.intent] : p.category}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-xs font-bold">{p.title}</div>
                    <div className="text-[10px] text-mk-dim">{new Date(p.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{p.style_json?.scenes ? ` · ${p.style_json.scenes} scene` : ''}</div>
                  </div>
                </Link>
                <button type="button" onClick={() => setConfirmId(p.id)} className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-mk-cream backdrop-blur hover:bg-red-500 group-hover:flex" aria-label="Hapus proyek">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {confirmId === p.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/85 p-3 text-center">
                    <span className="text-xs font-semibold">Hapus proyek ini?</span>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => remove(p.id)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold">
                        Hapus
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg bg-mk-panel-3 px-3 py-1.5 text-xs font-bold">
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
