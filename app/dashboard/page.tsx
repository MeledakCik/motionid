'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Trash2, Film, Sparkles, ExternalLink } from 'lucide-react';

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

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, topic, category, template_id, status, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setProjects(data as ProjectRow[]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard Proyek Video</h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola semua proyek motion graphic TikTok / Reels / Shorts milikmu
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-sm text-white shadow-lg hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Video Baru</span>
          </Link>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, topik, atau kategori proyek..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center">Memuat daftar proyek...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-12 text-center space-y-4">
            <Film className="w-10 h-10 text-violet-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Belum ada proyek yang cocok</h3>
              <p className="text-xs text-slate-400">
                Mulai buat video pertamamu dengan Smart Template Engine tanpa API Key.
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
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl bg-slate-900 border border-white/10 p-5 flex flex-col justify-between gap-4 hover:border-violet-500/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold uppercase">
                      {project.category} • {project.template_id}
                    </span>
                    <span className="text-slate-400">
                      {new Date(project.updated_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="font-bold text-base line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{project.topic}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <Link
                    href={`/editor/${project.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
                  >
                    <span>Buka di Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Hapus Proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
