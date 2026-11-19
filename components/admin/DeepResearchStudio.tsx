'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  buildResearchBrief,
  briefToMarkdown,
  MOTION_CATEGORIES,
  MOTION_RECIPES,
  MOTION_SOURCES,
  motionSource,
  PLATFORM_OPTIONS,
  recipeCode,
  type MotionCategory,
  type MotionRecipe,
  type MotionSourceId,
  type Platform,
  type ResearchBrief,
} from '@/lib/motion-lab';
import { cx, Logo, Segmented } from '@/components/studio/ui';
import AdminNav from './AdminNav';

type Tab = 'pustaka' | 'riset';

const EASE: Record<string, string> = {
  halus: 'cubic-bezier(.2,0,0,1)',
  tegas: 'cubic-bezier(.05,.7,.1,1)',
  membal: 'cubic-bezier(.34,1.56,.64,1)',
  kenyal: 'cubic-bezier(.22,1.4,.36,1)',
};

const LEVEL_STYLE: Record<string, string> = {
  pemula: 'bg-emerald-500/12 text-emerald-700',
  menengah: 'bg-amber-500/15 text-amber-700',
  lanjut: 'bg-pink-500/12 text-pink-700',
};

const CATEGORY_LABEL = Object.fromEntries(MOTION_CATEGORIES.map((c) => [c.id, c.label])) as Record<MotionCategory, string>;

function previewStyle(recipe: MotionRecipe): React.CSSProperties {
  const p = recipe.preview;
  return {
    '--rx': `${p.fromX || 0}px`,
    '--ry': `${p.fromY || 0}px`,
    '--rs': p.fromScale ?? 1,
    '--rr': `${p.fromRot || 0}deg`,
    '--ro': p.fromOpacity ?? 1,
    '--rb': `${p.fromBlur || 0}px`,
    '--rsk': `${p.fromSkew || 0}deg`,
    '--rd': `${p.duration}s`,
    '--re': EASE[p.easing] || EASE.halus,
  } as React.CSSProperties;
}

function CopyButton({ value, label = 'Salin', className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };
  return (
    <button type="button" onClick={copy} className={cx('mk-chip px-2.5 py-1.5 text-[11px]', className)}>
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Tersalin' : label}
    </button>
  );
}

function RecipePreview({ recipe, loop = false }: { recipe: MotionRecipe; loop?: boolean }) {
  return (
    <div className="mk-recipe-stage relative flex h-full min-h-[132px] items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-gradient-to-br from-white/85 via-mk-panel-2 to-mk-coral/10" tabIndex={0}>
      <div className="absolute inset-0 mk-dots opacity-50" />
      <div className={cx('mk-recipe-demo relative w-[58%] rounded-xl border border-white/80 bg-white/85 px-3 py-3 shadow-mk-card', loop && 'mk-recipe-demo-loop')} style={previewStyle(recipe)}>
        <div className="h-2 w-10 rounded-full bg-mk-coral/70" />
        <div className="mt-2 h-1.5 w-full rounded-full bg-mk-line" />
        <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-mk-line" />
        <div className="mt-2 flex gap-1">
          <span className="h-4 w-10 rounded bg-mk-coral/15" />
          <span className="h-4 w-6 rounded bg-mk-lime/40" />
        </div>
      </div>
      <span className="absolute right-2 top-2 rounded-full bg-black/5 p-1 text-mk-muted">
        <Play className="h-3 w-3" />
      </span>
      <span className="absolute bottom-2 left-2 rounded bg-white/80 px-1.5 py-0.5 text-[9.5px] font-bold text-mk-muted">
        {motionSource(recipe.source).short} · {CATEGORY_LABEL[recipe.category]}
      </span>
    </div>
  );
}

function RecipeDetail({
  recipe,
  onSave,
  saving,
  saved,
}: {
  recipe: MotionRecipe;
  onSave: (r: MotionRecipe) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [showCode, setShowCode] = useState(true);
  const code = recipeCode(recipe);
  return (
    <div className="mk-card space-y-4 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mk-coral text-white">
          <Wand2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold leading-tight">{recipe.name}</h3>
            <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-extrabold', LEVEL_STYLE[recipe.level])}>{recipe.level}</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-mk-muted">{motionSource(recipe.source).name}</span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-mk-muted">{recipe.summary}</p>
        </div>
        <button type="button" onClick={() => onSave(recipe)} disabled={saving || saved} className="mk-btn-primary px-3.5 py-2 text-xs">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? 'Tersimpan' : 'Simpan ke training'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <RecipePreview recipe={recipe} loop />
        <div className="rounded-xl border border-mk-line bg-white/60 p-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-mk-dim">Kenapa gerak ini bekerja</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-mk-muted">{recipe.why}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.principles.map((p) => (
              <span key={p} className="mk-chip px-2 py-0.5 text-[10px]">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-mk-dim">Langkah produksi</div>
        <ol className="mt-2 space-y-1.5">
          {recipe.steps.map((s, i) => (
            <li key={s} className="flex gap-2 text-[12.5px] text-mk-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-mk-coral/10 text-[10px] font-extrabold text-mk-coral">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <button type="button" onClick={() => setShowCode((v) => !v)} className="flex w-full items-center gap-2 text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-mk-dim">Kode pack ({recipe.trainingType})</span>
          <ChevronRight className={cx('h-3.5 w-3.5 text-mk-dim transition', showCode && 'rotate-90')} />
          <span className="ml-auto flex items-center gap-1.5">
            <CopyButton value={code} label="Salin JSON" />
          </span>
        </button>
        {showCode && (
          <pre className="mk-scroll mt-2 max-h-64 overflow-auto rounded-xl border border-mk-line bg-[#160f33] p-3 text-[11px] leading-relaxed text-[#e7e0ff]">
            {code}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {recipe.tags.map((t) => (
          <span key={t} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-mk-muted">#{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function DeepResearchStudio() {
  const [tab, setTab] = useState<Tab>('pustaka');
  const [source, setSource] = useState<MotionSourceId | 'all'>('all');
  const [category, setCategory] = useState<MotionCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(MOTION_RECIPES[0].id);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [topic, setTopic] = useState('Kopi susu literan untuk anak kos');
  const [audience, setAudience] = useState('mahasiswa dan pekerja kantor muda');
  const [goal, setGoal] = useState('mendorong orang menyimpan video lalu pesan lewat WhatsApp');
  const [briefSource, setBriefSource] = useState<MotionSourceId | 'mix'>('mix');
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [duration, setDuration] = useState(24);
  const [tone, setTone] = useState('yakin, santai, tidak bertele-tele');
  const [keywords, setKeywords] = useState('praktis, hemat, cepat');
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [savingBrief, setSavingBrief] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTION_RECIPES.filter(
      (r) =>
        (source === 'all' || r.source === source) &&
        (category === 'all' || r.category === category) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.why.toLowerCase().includes(q) ||
          r.tags.some((t) => t.includes(q)))
    );
  }, [source, category, query]);

  const selected = MOTION_RECIPES.find((r) => r.id === selectedId) || filtered[0] || MOTION_RECIPES[0];

  const saveRecipes = async (recipes: MotionRecipe[]) => {
    if (!recipes.length) return;
    setSavingBrief(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const payloads = recipes.map((recipe) => ({
        type: recipe.trainingType,
        category: 'all',
        content_text: recipeCode(recipe),
        subtext: recipe.name,
        metadata_json: {
          tags: [...recipe.tags, recipe.source, 'motion-lab'],
          engine: 'v7',
          source: 'motion-lab',
          recipe: recipe.id,
        },
      }));
      const { data, error } = await supabase.from('ai_training_data').insert(payloads).select('id');
      if (error) throw error;
      setSavedIds((prev) => new Set([...prev, ...recipes.map((r) => r.id)]));
      setNotice({
        ok: true,
        text: `${data?.length || recipes.length} resep tersimpan. Semua user mendapatkannya saat editor dimuat ulang.`,
      });
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Gagal menyimpan. Pastikan akun admin.' });
    } finally {
      setSavingBrief(false);
      setSavingId(null);
    }
  };

  const saveOne = async (recipe: MotionRecipe) => {
    setSavingId(recipe.id);
    await saveRecipes([recipe]);
  };

  const generate = () => {
    const result = buildResearchBrief({
      topic,
      audience,
      goal,
      source: briefSource,
      platform,
      durationSec: duration,
      tone,
      keywords,
    });
    setBrief(result);
    setNotice(null);
  };

  const downloadBrief = (kind: 'md' | 'json') => {
    if (!brief) return;
    const body = kind === 'md' ? briefToMarkdown(brief) : JSON.stringify(brief, null, 2);
    const blob = new Blob([body], { type: kind === 'md' ? 'text/markdown' : 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `riset-${brief.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}.${kind}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mk-page">
      <header className="mk-glass mk-bar sticky top-0 z-30 border-b border-white/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/dashboard" className="mk-btn-icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo className="text-sm" />
          <span className="rounded-full bg-mk-lime/30 px-2 py-0.5 text-[11px] font-bold text-[#556b0a]">Motion Lab · Deep Research</span>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link href="/admin/mcp" className="mk-btn-ghost px-3 py-1.5 text-xs">
              MCP Connector <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/admin" className="mk-btn-ghost px-3 py-1.5 text-xs">
              Training Studio
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        <AdminNav className="mb-5" />

        <section className="mk-card relative overflow-hidden p-5 sm:p-6">
          <div className="mk-dots pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-mk-coral">
                <FlaskConical className="h-3.5 w-3.5" /> Riset gerak mendalam
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Dari referensi menjadi pack yang bisa dipakai</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mk-muted">
                {MOTION_RECIPES.length} resep dari CapCut, Illustrator, Figma, Alight Motion, Premiere, dan After Effects.
                Setiap resep berisi prinsip, langkah, dan kode pack yang sudah lolos parser studio — tinggal simpan ke bank training.
              </p>
            </div>
            <div className="flex gap-2">
              {[
                ['2D + 3D', MOTION_RECIPES.filter((r) => r.category === '2d' || r.category === '3d').length],
                ['Kinetic', MOTION_RECIPES.filter((r) => r.category === 'kinetic').length],
                ['Transisi', MOTION_RECIPES.filter((r) => r.category === 'transition').length],
              ].map(([label, n]) => (
                <div key={label as string} className="rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-center">
                  <div className="text-lg font-extrabold">{n}</div>
                  <div className="text-[10px] text-mk-dim">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mk-noscroll -mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4">
          {[
            { id: 'pustaka' as Tab, label: 'Pustaka Resep', icon: Layers },
            { id: 'riset' as Tab, label: 'Riset Mendalam', icon: Sparkles },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cx('mk-chip shrink-0 px-4 py-2 text-sm', tab === t.id && 'mk-chip-on')}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className={cx('mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm', notice.ok ? 'bg-emerald-500/10 text-emerald-800' : 'bg-red-500/10 text-red-700')}>
            {notice.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {notice.text}
          </div>
        )}

        {tab === 'pustaka' && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <section className="mk-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[180px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-dim" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari gerak, mis. flip, mask, kinetic…" className="mk-input pl-9" />
                  </div>
                  <button type="button" onClick={() => { setSource('all'); setCategory('all'); setQuery(''); }} className="mk-chip px-3 py-2 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
                <div className="mk-noscroll mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                  <button type="button" onClick={() => setSource('all')} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', source === 'all' && 'mk-chip-on')}>Semua aplikasi</button>
                  {MOTION_SOURCES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSource(s.id)} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', source === s.id && 'mk-chip-on')}>
                      <span className="h-2 w-2 rounded-full" style={{ background: s.accent === '#0f0f0f' ? '#7b50ff' : s.accent }} /> {s.short}
                    </button>
                  ))}
                </div>
                <div className="mk-noscroll mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                  <button type="button" onClick={() => setCategory('all')} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', category === 'all' && 'mk-chip-on')}>Semua kategori</button>
                  {MOTION_CATEGORIES.map((c) => (
                    <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', category === c.id && 'mk-chip-on')} title={c.hint}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-mk-dim">
                  <span>{filtered.length} resep cocok</span>
                  <span>Hover kartu untuk melihat gerak</span>
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => setSelectedId(recipe.id)}
                    className={cx('mk-card group overflow-hidden p-3 text-left transition hover:-translate-y-0.5', selectedId === recipe.id && 'ring-2 ring-mk-coral/50')}
                  >
                    <RecipePreview recipe={recipe} />
                    <div className="mt-2 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-extrabold">{recipe.name}</div>
                        <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-mk-muted">{recipe.summary}</div>
                      </div>
                      <span className={cx('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold', LEVEL_STYLE[recipe.level])}>{recipe.level}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {recipe.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9.5px] text-mk-muted">#{t}</span>
                      ))}
                      {savedIds.has(recipe.id) && <span className="ml-auto rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">tersimpan</span>}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="mk-card col-span-full p-8 text-center text-sm text-mk-muted">
                    Tidak ada resep untuk filter ini. Coba kata kunci lain atau reset filter.
                  </div>
                )}
              </div>
            </div>

            <div className="xl:sticky xl:top-20 xl:self-start">
              <RecipeDetail recipe={selected} onSave={saveOne} saving={savingId === selected.id} saved={savedIds.has(selected.id)} />
              <section className="mk-card mt-4 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <BookOpenCheck className="h-4 w-4 text-mk-coral" /> Cara memakai referensi dengan sehat
                </div>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-mk-muted">
                  <li>Ambil prinsip geraknya, bukan meniru karya utuh atau aset berhak cipta.</li>
                  <li>Istilah aplikasi dipakai sebagai bahasa bersama; tidak ada klaim afiliasi.</li>
                  <li>Setelah disimpan, buka editor dan uji di scene nyata sebelum dipakai massal.</li>
                  <li>Jaga maksimal 2 gerak dominan per video agar pesan tetap terbaca.</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        {tab === 'riset' && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="mk-card space-y-3 p-5 xl:sticky xl:top-20 xl:self-start">
              <div>
                <h2 className="text-base font-extrabold">Brief riset per detik</h2>
                <p className="text-[12.5px] text-mk-muted">Isi topik, lalu Motion Lab menyusun urutan beat, gerak, aset, sound, dan validasi.</p>
              </div>
              <div>
                <span className="mk-label">Topik / produk</span>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className="mk-input" placeholder="mis. kopi susu literan" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="mk-label">Audiens</span>
                  <input value={audience} onChange={(e) => setAudience(e.target.value)} className="mk-input" />
                </div>
                <div>
                  <span className="mk-label">Tujuan</span>
                  <input value={goal} onChange={(e) => setGoal(e.target.value)} className="mk-input" />
                </div>
              </div>
              <div>
                <span className="mk-label">Referensi gaya</span>
                <div className="mk-noscroll flex gap-1.5 overflow-x-auto pb-0.5">
                  <button type="button" onClick={() => setBriefSource('mix')} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', briefSource === 'mix' && 'mk-chip-on')}>Campuran</button>
                  {MOTION_SOURCES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setBriefSource(s.id)} className={cx('mk-chip shrink-0 px-3 py-1.5 text-[11px]', briefSource === s.id && 'mk-chip-on')}>{s.short}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mk-label">Platform</span>
                <Segmented value={platform} onChange={(v) => setPlatform(v as Platform)} options={PLATFORM_OPTIONS} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="mk-label mb-0">Durasi</span>
                  <span className="text-xs font-extrabold">{duration} detik</span>
                </div>
                <input type="range" min={12} max={60} step={2} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mk-range" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="mk-label">Nada</span>
                  <input value={tone} onChange={(e) => setTone(e.target.value)} className="mk-input" />
                </div>
                <div>
                  <span className="mk-label">Kata kunci</span>
                  <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mk-input" placeholder="pisahkan dengan koma" />
                </div>
              </div>
              <button type="button" onClick={generate} className="mk-btn-primary w-full justify-center py-2.5 text-sm">
                <Sparkles className="h-4 w-4" /> Susun brief riset
              </button>
              <p className="text-[11px] leading-relaxed text-mk-dim">
                Hasil deterministik dari bank pengetahuan lokal — tidak memanggil API AI eksternal.
              </p>
            </section>

            <div className="space-y-4">
              {!brief && (
                <section className="mk-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mk-coral/10 text-mk-coral">
                    <FlaskConical className="h-7 w-7" />
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold">Belum ada brief</h2>
                  <p className="mt-1 max-w-md text-sm text-mk-muted">
                    Isi topik di kiri lalu klik <b>Susun brief riset</b>. Kamu akan mendapat timeline per detik, pilihan hook,
                    CTA, checklist aset, dan resep gerak yang relevan.
                  </p>
                </section>
              )}

              {brief && (
                <>
                  <section className="mk-card p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-extrabold">{brief.title}</h2>
                        <p className="mt-1 text-[13px] leading-relaxed text-mk-muted">{brief.positioning}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CopyButton value={briefToMarkdown(brief)} label="Salin brief" />
                        <button type="button" onClick={() => downloadBrief('md')} className="mk-chip px-2.5 py-1.5 text-[11px]"><Download className="h-3.5 w-3.5" /> MD</button>
                        <button type="button" onClick={() => downloadBrief('json')} className="mk-chip px-2.5 py-1.5 text-[11px]"><Download className="h-3.5 w-3.5" /> JSON</button>
                        <button type="button" onClick={() => void saveRecipes(brief.recommendedRecipes)} disabled={savingBrief} className="mk-btn-primary px-3 py-1.5 text-[11px]">
                          {savingBrief ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan semua resep
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-mk-line bg-white/60 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Audiens</div>
                        <div className="mt-0.5 text-[12.5px] font-semibold">{brief.audience}</div>
                      </div>
                      <div className="rounded-xl border border-mk-line bg-white/60 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Gaya gerak</div>
                        <div className="mt-0.5 text-[12.5px] font-semibold">{brief.sourceLabel}</div>
                      </div>
                      <div className="rounded-xl border border-mk-line bg-white/60 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Durasi / platform</div>
                        <div className="mt-0.5 text-[12.5px] font-semibold">{brief.durationSec} dtk · {brief.platform}</div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl bg-mk-mesh-deep p-3 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">Ide besar</div>
                      <p className="mt-0.5 text-[13px] leading-relaxed">{brief.bigIdea}</p>
                    </div>
                  </section>

                  <section className="mk-card overflow-hidden">
                    <div className="border-b border-mk-line p-4">
                      <h3 className="text-sm font-extrabold">Timeline per beat</h3>
                      <p className="text-[12px] text-mk-muted">Klik resep untuk melihat detail geraknya.</p>
                    </div>
                    <div className="divide-y divide-mk-line/70">
                      {brief.beats.map((beat) => (
                        <div key={beat.index} className="grid gap-2 p-4 sm:grid-cols-[82px_1fr_1fr]">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Beat {beat.index}</div>
                            <div className="text-sm font-extrabold">{beat.start}–{beat.end}s</div>
                            <div className="mt-1 rounded-full bg-mk-coral/10 px-2 py-0.5 text-center text-[10px] font-bold text-mk-coral">{beat.role}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Di layar</div>
                            <p className="mt-0.5 text-[12.5px] leading-relaxed">{beat.onScreen}</p>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-mk-dim">Gerak & transisi</div>
                            <p className="mt-0.5 text-[12.5px] leading-relaxed text-mk-muted">{beat.motion}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {beat.recipeIds.map((id) => {
                                const r = MOTION_RECIPES.find((x) => x.id === id);
                                if (!r) return null;
                                return (
                                  <button key={id} type="button" onClick={() => { setSelectedId(id); setTab('pustaka'); }} className="mk-chip px-2 py-0.5 text-[10px]">
                                    {r.name} <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                );
                              })}
                              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-mk-muted">{beat.transition}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="mk-card p-4">
                      <h3 className="flex items-center gap-2 text-sm font-extrabold"><Sparkles className="h-4 w-4 text-mk-coral" /> Pilihan hook</h3>
                      <ul className="mt-2 space-y-1.5">
                        {brief.hookOptions.map((h) => (
                          <li key={h} className="flex items-start gap-2 rounded-lg bg-white/60 px-2.5 py-2 text-[12px] leading-relaxed">
                            <span className="min-w-0 flex-1">{h}</span>
                            <CopyButton value={h} label="" />
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="mk-card p-4">
                      <h3 className="flex items-center gap-2 text-sm font-extrabold"><Wand2 className="h-4 w-4 text-mk-coral" /> Pilihan CTA</h3>
                      <ul className="mt-2 space-y-1.5">
                        {brief.ctaOptions.map((c) => (
                          <li key={c} className="flex items-start gap-2 rounded-lg bg-white/60 px-2.5 py-2 text-[12px] leading-relaxed">
                            <span className="min-w-0 flex-1">{c}</span>
                            <CopyButton value={c} label="" />
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="mk-card p-4">
                      <h3 className="text-sm font-extrabold">Checklist aset</h3>
                      <ul className="mt-2 space-y-1">
                        {brief.assetChecklist.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[12px] text-mk-muted"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {a}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mk-card p-4">
                      <h3 className="text-sm font-extrabold">Sound design</h3>
                      <ul className="mt-2 space-y-1">
                        {brief.soundDesign.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[12px] text-mk-muted"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-coral" /> {a}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mk-card p-4">
                      <h3 className="text-sm font-extrabold">Pertanyaan riset</h3>
                      <ul className="mt-2 space-y-1">
                        {brief.researchQuestions.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[12px] text-mk-muted"><Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-coral" /> {a}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mk-card p-4">
                      <h3 className="text-sm font-extrabold">Validasi sebelum publish</h3>
                      <ul className="mt-2 space-y-1">
                        {brief.validationChecklist.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[12px] text-mk-muted"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {a}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <section className="mk-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="mr-auto text-sm font-extrabold">Resep rekomendasi ({brief.recommendedRecipes.length})</h3>
                      <CopyButton value={brief.recommendedRecipes.map((r) => `${r.name}\n${recipeCode(r)}`).join('\n\n')} label="Salin semua kode" />
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {brief.recommendedRecipes.map((r) => (
                        <button key={r.id} type="button" onClick={() => { setSelectedId(r.id); setTab('pustaka'); }} className="flex items-center gap-2 rounded-xl border border-mk-line bg-white/60 p-2.5 text-left transition hover:bg-white">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mk-coral/10 text-[10px] font-extrabold text-mk-coral">{r.level.slice(0, 3)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-bold">{r.name}</span>
                            <span className="block truncate text-[10.5px] text-mk-muted">{motionSource(r.source).short} · {CATEGORY_LABEL[r.category]}</span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-mk-dim" />
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        )}

        <footer className="mt-8 flex flex-wrap items-center gap-2 text-[11px] text-mk-dim">
          <Clipboard className="h-3.5 w-3.5" /> Resep bisa disimpan sebagai animation_pack / transition_pack.
          <span>·</span>
          <span>Semua kode melewati parser yang sama dengan Training Studio.</span>
        </footer>
      </main>
    </div>
  );
}
