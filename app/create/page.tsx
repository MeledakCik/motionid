'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CategoryType,
  GeneratedScriptResult,
  generateScript,
} from '@/lib/smart-engine';
import { TemplateId, useEditorStore } from '@/store/useEditorStore';
import { createClient } from '@/lib/supabase/client';
import { loadTrainingIntoEngine } from '@/lib/training';
import { Sparkles, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Halaman Create Flow (/create) — TANPA AI API
 * 1. Pilih Kategori (Quote / Promo / Edukasi)
 * 2. Isi Topik Video + Opsional Harga, Nama Produk, Nama Toko (jika Promo)
 * 3. Klik "Buat Script Otomatis" -> Simulasi loading 800ms -> Panggil generateScript() lokal
 * 4. Tampilkan hasil script di preview kecil -> Klik "Lanjut ke Editor"
 */
export default function CreatePage() {
  const router = useRouter();
  const initProject = useEditorStore((s) => s.initProject);

  const [category, setCategory] = useState<CategoryType>('promo');
  const [templateId, setTemplateId] = useState<TemplateId>('P1');
  const [topic, setTopic] = useState('promo kopi susu gula aren 18rb');
  const [customPrice, setCustomPrice] = useState('Rp 18RB');
  const [customProductName, setCustomProductName] = useState('Kopi Susu Gula Aren');
  const [customStoreName, setCustomStoreName] = useState('Kopi Senja Kita');

  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<GeneratedScriptResult | null>(null);

  // Suntik data hasil training admin ke Smart Engine sebelum generate
  useEffect(() => {
    loadTrainingIntoEngine();
  }, []);

  const handleCategoryChange = (cat: CategoryType) => {
    setCategory(cat);
    if (cat === 'promo') {
      setTemplateId('P1');
      setTopic('promo kopi susu gula aren 18rb');
    } else if (cat === 'quote') {
      setTemplateId('Q1');
      setTopic('kata-kata galau capek kerja tapi harus tetap kuat');
    } else {
      setTemplateId('E1');
      setTopic('3 cara belajar mengatur keuangan di usia 20an');
    }
  };

  const handleGenerateLocalScript = () => {
    if (!topic.trim()) return;
    setIsSimulating(true);
    // Simulasi 800ms sesuai spesifikasi agar terasa responsif tanpa API eksternal
    setTimeout(() => {
      const generated = generateScript(topic, category, {
        customPrice: category === 'promo' ? customPrice : undefined,
        customProductName: category === 'promo' ? customProductName : undefined,
        customStoreName: category === 'promo' ? customStoreName : undefined,
      });
      setResult(generated);
      setIsSimulating(false);
    }, 800);
  };

  const handleContinueToEditor = async () => {
    const finalScript =
      result ||
      generateScript(topic, category, {
        customPrice,
        customProductName,
        customStoreName,
      });

    const projectId = `proj-${Date.now()}`;
    initProject({
      id: projectId,
      title: topic.slice(0, 50),
      topic,
      category,
      templateId,
      script: finalScript,
    });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: topic.slice(0, 60),
            topic,
            category,
            template_id: templateId,
            script_json: finalScript,
            style_json: {
              aspectRatio: '9:16',
              font: finalScript.suggestedStyle.font,
              colors: finalScript.suggestedColor,
              music: finalScript.suggestedMusic,
            },
            status: 'draft',
          })
          .select('id')
          .single();

        if (data?.id) {
          router.push(`/editor/${data.id}`);
          return;
        }
      }
    } catch {
      // Fallback ke editor lokal jika belum terhubung ke instance Supabase
    }

    router.push(`/editor/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-8">
        {/* Form Input Kiri */}
        <div className="lg:col-span-7 space-y-6 bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              Smart Template Engine • Zero AI API
            </span>
            <h1 className="text-2xl font-bold mt-1">Buat Script & Video Otomatis</h1>
          </div>

          {/* 1. Pilih Kategori */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              1. Pilih Kategori Konten
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'promo', label: 'Promo UMKM', desc: 'P1, P2, P3' },
                  { id: 'quote', label: 'Quote / Kata', desc: 'Q1, Q2, Q3' },
                  { id: 'edukasi', label: 'Edukasi / Hook', desc: 'E1, E2, E3' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryChange(item.id)}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    category === item.id
                      ? 'bg-violet-600/20 border-violet-500 text-white'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm">{item.label}</div>
                  <div className="text-[11px] opacity-75">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Input Topik */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">
              2. Topik Video
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: promo kopi susu gula aren 18rb"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* 3. Field Opsional Kategori Promo */}
          {category === 'promo' && (
            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Harga Promo (Opsional)
                </label>
                <input
                  type="text"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Rp 18RB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nama Produk (Opsional)
                </label>
                <input
                  type="text"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  placeholder="Kopi Susu Gula Aren"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nama Toko (Opsional)
                </label>
                <input
                  type="text"
                  value={customStoreName}
                  onChange={(e) => setCustomStoreName(e.target.value)}
                  placeholder="Kopi Senja Kita"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateLocalScript}
            disabled={isSimulating}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyusun script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Buat Script Otomatis</span>
              </>
            )}
          </button>
        </div>

        {/* Preview Hasil Script Kanan */}
        <div className="lg:col-span-5 bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-5">
          {!result ? (
            <div className="my-auto text-center space-y-2 py-12 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto text-violet-400 opacity-75" />
              <p className="text-sm font-semibold text-slate-200">
                Preview Script Otomatis
              </p>
              <p className="text-xs">
                Klik tombol &quot;Buat Script Otomatis&quot; untuk melihat hasil Hook, 4 Scene, Caption, dan rekomendasi Style.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Script Siap! ({result.suggestedStyle.moodLabel})</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">
                    Hook Terpilih
                  </span>
                  <p className="text-xs font-bold">{result.hook}</p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {result.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-violet-300">
                          Scene {scene.sceneNumber}: {scene.role}
                        </span>
                        <span>{scene.duration}s • {scene.animation}</span>
                      </div>
                      <p className="font-semibold text-slate-100">
                        {scene.emoji} {scene.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Caption & Hashtag TikTok
                  </span>
                  <p className="text-slate-300 text-[11px]">{result.caption}</p>
                  <p className="text-cyan-400 font-medium text-[11px]">
                    {result.hashtags.join(' ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueToEditor}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <span>Lanjut ke Editor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
