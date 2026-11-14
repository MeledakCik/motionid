'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Minus, Plus, RefreshCw, Sparkles, Wand2, X } from 'lucide-react';
import type { Aspect, ContentPlan, Intent, ProjectDoc } from '@/lib/studio/types';
import { docDuration, uid } from '@/lib/studio/types';
import { analyzePrompt, INTENT_LABELS } from '@/lib/studio/prompt';
import { buildDoc } from '@/lib/studio/builder';
import { getLayout, rankTemplates, TEMPLATES } from '@/lib/studio/packs/templates';
import { compressImage, saveProject } from '@/lib/studio/persist';
import { loadTraining } from '@/lib/studio/training';
import { allIcons } from '@/lib/studio/packs/icons';
import { allComponents } from '@/lib/studio/packs/components';
import { allTransitions } from '@/lib/studio/packs/transitions';
import { allAnimations } from '@/lib/studio/packs/animations';
import { allEffects } from '@/lib/studio/packs/effects';
import { cx, LazyVisible, Logo } from '@/components/studio/ui';
import { TemplateThumb } from '@/components/studio/Thumbs';
import LivePreview from '@/components/studio/LivePreview';
import ExportDialog from '@/components/studio/ExportDialog';

const EXAMPLES = [
  'Promo kopi susu gula aren 18rb di Kopi Senja, diskon 30% khusus hari ini',
  '5 tips hemat buat anak kos biar uang cukup sampai akhir bulan',
  'Tutorial bikin CV ATS dalam 4 langkah',
  'Kata-kata semangat buat yang lagi capek kerja',
  'Menu: nasi goreng 15rb, mie ayam 12rb, es teh 5rb di Warung Bu Sri',
  'Flash sale sneakers 199rb dari 350rb, buruan @sneakid',
  'Lowongan kerja barista di Kopi Kita, kirim CV sekarang',
  'Webinar gratis belajar desain 20 Agustus via Zoom',
  '3 fakta unik tentang kucing yang jarang diketahui',
  'Selamat hari raya Idul Fitri dari Toko Berkah',
];

const ASPECTS: Array<{ id: Aspect; label: string; sub: string }> = [
  { id: '9:16', label: '9:16', sub: 'TikTok · Reels · Shorts' },
  { id: '4:5', label: '4:5', sub: 'Feed Instagram' },
  { id: '1:1', label: '1:1', sub: 'Kotak' },
  { id: '16:9', label: '16:9', sub: 'YouTube' },
];

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<Aspect>('9:16');
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [busyImg, setBusyImg] = useState(false);
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [sceneCount, setSceneCount] = useState<number | null>(null);
  const [seed, setSeed] = useState(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [allLimit, setAllLimit] = useState(24);
  const [saving, setSaving] = useState(false);
  const [exportDoc, setExportDoc] = useState<ProjectDoc | null>(null);
  const [overrides, setOverrides] = useState<{ product?: string; price?: string; store?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTraining();
    try {
      const p = new URLSearchParams(window.location.search).get('prompt');
      if (p) setPrompt(p);
    } catch {
      // abaikan
    }
  }, []);

  const runAnalyze = (opts: { intent?: Intent | null; count?: number | null; seed?: number; scroll?: boolean; ov?: typeof overrides } = {}) => {
    if (!prompt.trim()) return;
    const it = opts.intent === undefined ? intent : opts.intent;
    const cnt = opts.count === undefined ? sceneCount : opts.count;
    const p = analyzePrompt(prompt, { seed: opts.seed ?? seed, intentOverride: it || undefined, sceneCount: cnt || undefined, ...(opts.ov || overrides) });
    setPlan(p);
    if (opts.intent !== undefined || !templateId || opts.scroll) setTemplateId(null);
    if (opts.scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const ranked = useMemo(
    () => (plan ? rankTemplates({ intent: plan.intent, mood: plan.mood, keywords: plan.keywords, hasPhotos: Object.keys(assets).length > 0 }, 12) : []),
    [plan, assets]
  );
  const activeTemplate = templateId || ranked[0]?.id || null;
  const doc = useMemo(() => (plan && activeTemplate ? buildDoc({ plan, templateId: activeTemplate, aspect, assets, seed }) : null), [plan, activeTemplate, aspect, assets, seed]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusyImg(true);
    const add: Record<string, string> = {};
    for (const f of Array.from(files).slice(0, 8)) {
      if (!f.type.startsWith('image/')) continue;
      try {
        add[uid('img')] = await compressImage(f);
      } catch {
        // lewati
      }
    }
    setAssets((a) => ({ ...a, ...add }));
    setBusyImg(false);
  };

  const goEditor = async () => {
    if (!doc) return;
    setSaving(true);
    const r = await saveProject({ ...doc, id: uid('local') });
    router.push(`/editor/${r.id}`);
  };

  const counts = { t: TEMPLATES.length, c: allComponents().length, i: allIcons().length, tr: allTransitions().length, a: allAnimations().length, e: allEffects().length };

  return (
    <div className="mk-page">
      <header className="sticky top-0 z-30 border-b border-mk-line bg-mk-ink/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/dashboard" className="mk-btn-icon" aria-label="Kembali ke dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo className="text-sm" />
          <span className="ml-auto hidden text-[11px] text-mk-dim sm:block">
            {counts.t} template · {counts.c} komponen · {counts.i} ikon · {counts.tr} transisi · {counts.a} animasi · {counts.e} efek
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:pt-10">
        {/* ---------------- langkah 1: prompt ---------------- */}
        <section className="mx-auto max-w-2xl">
          <h1 className="text-center text-2xl font-extrabold leading-tight sm:text-4xl">
            Mau bikin video <span className="mk-grad-text">apa hari ini?</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-mk-muted">Tulis bebas seperti chat. Jenis video, jumlah scene, warna, template, dan animasi disusun otomatis dari prompt-mu.</p>

          <div className="mk-card mt-6 p-3 sm:p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runAnalyze({ scroll: true, intent: null, count: null });
              }}
              rows={3}
              placeholder="Contoh: promo kopi susu gula aren 18rb di Kopi Senja, diskon 30% hari ini"
              className="w-full resize-none bg-transparent px-1 text-base leading-relaxed text-mk-cream placeholder:text-mk-dim focus:outline-none"
            />
            {Object.keys(assets).length > 0 && (
              <div className="mk-noscroll mb-2 flex gap-2 overflow-x-auto">
                {Object.entries(assets).map(([id, src]) => (
                  <div key={id} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    <button type="button" onClick={() => setAssets((a) => { const n = { ...a }; delete n[id]; return n; })} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mk-ink text-mk-cream ring-1 ring-mk-line" aria-label="Hapus foto">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-mk-line pt-3">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              <button type="button" onClick={() => fileRef.current?.click()} className="mk-chip" disabled={busyImg}>
                {busyImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Foto produk / latar (opsional)
              </button>
              <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
                {ASPECTS.map((a) => (
                  <button key={a.id} type="button" title={a.sub} onClick={() => setAspect(a.id)} className={cx('mk-chip shrink-0', aspect === a.id && 'mk-chip-on')}>
                    {a.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => runAnalyze({ scroll: true, intent: null, count: null })} disabled={!prompt.trim()} className="mk-btn-primary ml-auto w-full sm:w-auto">
                <Sparkles className="h-4 w-4" /> Buat Video
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mk-dim">Belum ada ide? Coba salah satu:</div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setPrompt(ex)} className="mk-chip text-left">
                  {ex.length > 46 ? `${ex.slice(0, 46)}…` : ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- langkah 2: hasil ---------------- */}
        {plan && doc && (
          <section ref={resultRef} className="mt-10 grid scroll-mt-20 gap-6 lg:grid-cols-[1fr_340px]">
            <div className="order-2 space-y-5 lg:order-1">
              <div className="mk-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                  <Wand2 className="h-4 w-4 text-mk-coral" /> Hasil baca prompt
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mk-label">Jenis video</span>
                    <select
                      value={plan.intent}
                      onChange={(e) => {
                        const v = e.target.value as Intent;
                        setIntent(v);
                        setSceneCount(null);
                        runAnalyze({ intent: v, count: null });
                      }}
                      className="mk-input py-2"
                    >
                      {(Object.keys(INTENT_LABELS) as Intent[]).map((k) => (
                        <option key={k} value={k}>
                          {INTENT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="mk-label">Jumlah scene</span>
                    <div className="flex items-center gap-2">
                      <button type="button" className="mk-btn-ghost h-10 w-10 p-0" onClick={() => { const n = Math.max(2, plan.items.length - 1); setSceneCount(n); runAnalyze({ count: n }); }} aria-label="Kurangi scene">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-lg font-extrabold">{plan.items.length}</span>
                      <button type="button" className="mk-btn-ghost h-10 w-10 p-0" onClick={() => { const n = Math.min(12, plan.items.length + 1); setSceneCount(n); runAnalyze({ count: n }); }} aria-label="Tambah scene">
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-mk-dim">{docDuration(doc).toFixed(0)} dtk</span>
                    </div>
                  </div>
                  <div>
                    <span className="mk-label">Variasi teks</span>
                    <button type="button" className="mk-btn-ghost w-full py-2" onClick={() => { const s = seed + 1; setSeed(s); runAnalyze({ seed: s }); }}>
                      <RefreshCw className="h-4 w-4" /> Acak kalimat
                    </button>
                  </div>
                </div>
                {plan.category === 'promo' && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        ['product', 'Nama produk', plan.product],
                        ['price', 'Harga', plan.price],
                        ['store', 'Nama toko', plan.store],
                      ] as const
                    ).map(([k, label, val]) => (
                      <label key={k} className="block">
                        <span className="mk-label">{label}</span>
                        <input
                          className="mk-input py-2"
                          defaultValue={val || ''}
                          placeholder="—"
                          onBlur={(e) => {
                            const ov = { ...overrides, [k]: e.target.value || undefined };
                            if (ov[k] === overrides[k]) return;
                            setOverrides(ov);
                            runAnalyze({ ov });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <ol className="mt-4 space-y-1.5">
                  {plan.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl bg-mk-ink px-3 py-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mk-coral/20 text-[10px] font-extrabold text-mk-coral">{i + 1}</span>
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        value={it.title}
                        onChange={(e) => setPlan((p) => (p ? { ...p, items: p.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) } : p))}
                      />
                      <span className="shrink-0 rounded bg-mk-panel-3 px-1.5 py-0.5 text-[10px] font-bold uppercase text-mk-dim">{it.role}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mk-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-extrabold">Template paling cocok</div>
                  <button type="button" className="text-xs font-bold text-mk-coral" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Tutup' : `Lihat semua ${TEMPLATES.length}`}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {(showAll ? TEMPLATES.slice(0, allLimit) : ranked).map((t) => (
                    <button key={t.id} type="button" onClick={() => setTemplateId(t.id)} className={cx('relative overflow-hidden rounded-xl border text-left', activeTemplate === t.id ? 'border-mk-coral ring-2 ring-mk-coral/40' : 'border-mk-line hover:border-mk-line-2')} title={`${t.name} — ${getLayout(t.layoutId).desc}`}>
                      <LazyVisible minH={110} className="aspect-[9/14] bg-mk-ink">
                        <TemplateThumb plan={plan} templateId={t.id} aspect={aspect} assets={assets} />
                      </LazyVisible>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-4 text-[9px] font-bold leading-tight">{t.name}</div>
                      {activeTemplate === t.id && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mk-coral text-mk-ink">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {showAll && allLimit < TEMPLATES.length && (
                  <button type="button" className="mk-btn-ghost mt-3 w-full text-xs" onClick={() => setAllLimit((l) => l + 36)}>
                    Tampilkan lagi
                  </button>
                )}
                {!showAll && ranked[0] && <p className="mt-2 text-[11px] text-mk-dim">Rekomendasi teratas: {ranked.find((r) => r.id === activeTemplate)?.reason || ranked[0].reason}</p>}
              </div>
            </div>

            <aside className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-20">
                <div className="flex justify-center">
                  <LivePreview doc={doc} width={aspect === '16:9' ? 340 : aspect === '1:1' ? 300 : 250} />
                </div>
                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={goEditor} disabled={saving} className="mk-btn-primary w-full py-3">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Edit di Studio
                  </button>
                  <button type="button" onClick={() => setExportDoc(doc)} className="mk-btn-ghost w-full">
                    Langsung export MP4
                  </button>
                </div>
                <p className="mt-3 text-center text-[11px] text-mk-dim">Di studio kamu bisa geser, ubah ukuran, ganti warna, teks, foto, dan animasi tiap elemen.</p>
              </div>
            </aside>
          </section>
        )}
      </main>
      {exportDoc && <ExportDialog doc={exportDoc} onClose={() => setExportDoc(null)} />}
    </div>
  );
}
