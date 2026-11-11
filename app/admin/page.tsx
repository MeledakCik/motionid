'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TrainingRow,
  analyzeCreatorVideoReference,
  forgetTrainingRow,
  loadTrainingIntoEngine,
} from '@/lib/training';

export default function AdminVideoTrainingPage() {
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(
    'https://www.tiktok.com/@depup.web/video/7697972111469546753'
  );
  const [creatorHandle, setCreatorHandle] = useState('@depup.web');
  const [category, setCategory] = useState<TrainingRow['category']>('saas');
  const [title, setTitle] = useState('DepUp SaaS Step Workflow (Deploy Without Hassle)');
  const [subtext, setSubtext] = useState(
    'Gradien lavender pastel + aksen cahaya hijau/kuning lembut + 3 langkah UI SaaS & live terminal.'
  );
  const [filterCat, setFilterCat] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('ai_training_data')
        .select('*')
        .order('created_at', { ascending: false });
      setRows((data || []) as TrainingRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile = analyzeCreatorVideoReference(videoUrl, title, creatorHandle);
    const supabase = createClient();
    const { error } = await supabase.from('ai_training_data').insert([
      {
        type: 'video_motion',
        category,
        content_text: title,
        subtext,
        video_url: videoUrl,
        creator_handle: creatorHandle,
        motion_profile: profile,
        metadata_json: { motion_profile: profile },
      },
    ]);
    if (!error) {
      await loadData();
      await loadTrainingIntoEngine();
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('ai_training_data').delete().eq('id', id);
    forgetTrainingRow(id);
    await loadData();
  };

  const filtered = rows.filter((r) => filterCat === 'all' || r.category === filterCat);

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-2xl bg-[#12141c] border border-[#232634] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-lime-400/15 text-lime-300 border border-lime-400/30">
              Video-First Motion Graphic Training
            </span>
            <h1 className="text-2xl font-bold mt-2">
              Admin Studio — Latih dari Video Motion Graphic Kreator
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tempel URL video TikTok/Reels/Shorts hasil motion graphic kreator untuk mengekstrak kurva kamera, layout UI, dan palet warna ke Smart Engine.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 rounded-2xl bg-[#12141c] border border-[#232634] p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-white">Tambah Referensi Video Kreator</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1">URL Video Referensi</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-3 py-2 text-xs text-indigo-300 font-mono"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Handle Kreator</label>
                <input
                  type="text"
                  value={creatorHandle}
                  onChange={(e) => setCreatorHandle(e.target.value)}
                  className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TrainingRow['category'])}
                  className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-3 py-2 text-xs text-white"
                >
                  <option value="saas">SaaS & Web App UI</option>
                  <option value="promo">Promo Produk</option>
                  <option value="edukasi">Edukasi & Tutorial</option>
                  <option value="quote">Kinetic Quote</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Judul Preset Motion</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Deskripsi Blueprint</label>
              <textarea
                rows={2}
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] p-2.5 text-xs text-slate-200"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg"
            >
              + Latih & Suntikkan ke Smart Engine
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-[#12141c] border border-[#232634] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                Dataset Video Motion Terlatih ({filtered.length})
              </h2>
              <div className="flex gap-1.5">
                {['all', 'saas', 'promo', 'edukasi'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCat(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      filterCat === c ? 'bg-indigo-600 text-white' : 'bg-[#181b26] text-slate-400'
                    }`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-8 text-center">Memuat dataset video...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#171a26] border border-[#272c3f] flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-indigo-300 font-mono">
                        <span>{item.creator_handle || '@creator'}</span>
                        <span className="uppercase text-slate-400">{item.category}</span>
                      </div>
                      <h3 className="text-xs font-bold text-white mt-1">{item.content_text}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">{item.subtext}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#23283b]">
                      <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[180px]">
                        {item.video_url || 'Preset Aktif'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
