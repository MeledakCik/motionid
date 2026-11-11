'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Trash2, Film, Sparkles, ArrowRight, LogOut, Brain } from 'lucide-react';

interface ProjectRow {
  id: string;
  title: string;
  topic: string;
  category: 'quote' | 'promo' | 'edukasi';
  template_id: string;
  status: 'draft' | 'published';
  updated_at: string;
}

/**
 * Halaman Dashboard (/dashboard)
 * Menampilkan daftar semua project milik user, fitur pencarian, buat video baru, dan hapus project.
 */
export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'promo' | 'quote' | 'edukasi'>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data, error: fetchErr }, userRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, topic, category, template_id, status, updated_at')
          .order('updated_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);

      const adminEmail = (
        process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com'
      ).toLowerCase();
      setIsAdmin((userRes.data.user?.email || '').toLowerCase() === adminEmail);

      if (fetchErr) {
        setError(
          /does not exist|schema cache/i.test(fetchErr.message)
            ? 'Tabel projects belum ada. Jalankan supabase/migration.sql di SQL Editor Supabase.'
            : fetchErr.message
        );
      } else if (data) {
        setProjects(data as ProjectRow[]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    const supabase = createClient();
    const { error: delErr } = await supabase.from('projects').delete().eq('id', id);
    setConfirmId(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.title.toLowerCase().includes(q) ||
      p.topic.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchQuery && (filter === 'all' || p.category === filter);
  });

  const CATEGORY_STYLE: Record<string, { label: string; chip: string; bar: string }> = {
    promo: { label: 'Promo', chip: 'bg-amber-500/15 text-amber-300', bar: 'from-amber-500 to-rose-500' },
    quote: { label: 'Quote', chip: 'bg-violet-500/15 text-violet-300', bar: 'from-violet-500 to-fuchsia-500' },
    edukasi: { label: 'Edukasi', chip: 'bg-cyan-500/15 text-cyan-300', bar: 'from-cyan-500 to-emerald-500' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Proyek Saya</h1>
            <p className="text-xs text-slate-400 mt-1">
              Video motion graphic TikTok, Reels, dan Shorts buatan Anda
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition"
              >
                <Brain className="w-4 h-4" />
                <span>Training</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Keluar"
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-sm text-white shadow-lg hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Video Baru</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Cari + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau topik..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'promo', 'quote', 'edukasi'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  filter === f
                    ? 'bg-violet-600/20 border-violet-500 text-white'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Semua' : CATEGORY_STYLE[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center">Memuat proyek...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-12 text-center space-y-4">
            <Film className="w-10 h-10 text-violet-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{projects.length === 0 ? 'Belum ada proyek' : 'Tidak ada yang cocok'}</h3>
              <p className="text-xs text-slate-400">
                Ketik topik, dapatkan video lengkap dengan caption dan hashtag.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-xs font-bold text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Video Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const cat = CATEGORY_STYLE[project.category] || CATEGORY_STYLE.promo;
              return (
                <div
                  key={project.id}
                  className="group rounded-2xl bg-slate-900 border border-white/10 overflow-hidden flex flex-col hover:border-violet-500/40 transition"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${cat.bar}`} />
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold ${cat.chip}`}>
                        {cat.label} · {project.template_id}
                      </span>
                      <span className="text-slate-500">
                        {new Date(project.updated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base line-clamp-1">{project.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{project.topic}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/10">
                    <Link
                      href={`/editor/${project.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                    >
                      <span>Buka editor</span>
                      <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                    </Link>
                    {confirmId === project.id ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(project.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Hapus proyek"
                        aria-label="Hapus proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
