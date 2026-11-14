'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Code2, Loader2, Pencil, RefreshCw, Save, Trash2, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { allIcons, IconDef, iconSvgMarkup, parseSvgMarkup } from '@/lib/studio/packs/icons';
import { allComponents, COMPONENT_CODE_EXAMPLE, componentKinds, ComponentDef, drawComponent, parseComponentCode } from '@/lib/studio/packs/components';
import { allTransitions, drawTransition, parseTransitionCode, TRANSITION_CODE_EXAMPLE, TransitionSpec } from '@/lib/studio/packs/transitions';
import { allAnimations, ANIMATION_CODE_EXAMPLE, AnimSpec, evalIn, evalLoop, parseAnimationCode } from '@/lib/studio/packs/animations';
import { TEMPLATES, THEMES } from '@/lib/studio/packs/templates';
import { allEffects, EFFECT_CODE_EXAMPLE, effectKinds, EffectSpec, parseEffectCode } from '@/lib/studio/packs/effects';
import { EffectThumb } from '@/components/studio/Thumbs';
import { applyRow, loadTraining, removeRow, TrainingRow } from '@/lib/studio/training';
import { canvasFamily, ensureFonts } from '@/lib/studio/fonts';
import { EASINGS } from '@/lib/studio/easing';
import { cx, Logo, Segmented } from '@/components/studio/ui';

type Tab = 'icon_pack' | 'component_pack' | 'transition_pack' | 'animation_pack' | 'effect_pack' | 'teks';

const TABS: Array<{ id: Tab; label: string; short: string }> = [
  { id: 'icon_pack', label: 'Input SVG Ikon', short: 'Ikon' },
  { id: 'component_pack', label: 'Input Kode Komponen', short: 'Komponen' },
  { id: 'transition_pack', label: 'Input Kode Transisi', short: 'Transisi' },
  { id: 'animation_pack', label: 'Input Kode Animasi', short: 'Animasi' },
  { id: 'effect_pack', label: 'Input Kode Efek', short: 'Efek' },
  { id: 'teks', label: 'Bank Teks (Hook/CTA)', short: 'Teks' },
];

const ICON_EXAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
  <line x1="6" x2="6" y1="2" y2="4"/>
  <line x1="10" x2="10" y1="2" y2="4"/>
  <line x1="14" x2="14" y1="2" y2="4"/>
</svg>`;

const GUIDE: Record<Exclude<Tab, 'teks'>, React.ReactNode> = {
  effect_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <b>kind</b>: {effectKinds().map((k) => k.kind).join(', ')}.
      </li>
      <li>
        <b>style</b> per kind, contoh hujan: lurus | miring-kiri | miring-kanan | neon | petir | malam; kaca-pecah: tengah | kiri-atas | kanan-bawah | hamburan | jatuh | layar-hp; pasir: badai-kanan | badai-kiri | jatuh | gurun | emas.
      </li>
      <li>
        <b>intensity</b> 0.1–4 (jumlah partikel / kekuatan). Untuk kind <code>emoji</code> isi <code>&quot;emoji&quot;: &quot;🧋&quot;</code>.
      </li>
      <li>
        <b>layer</b> (opsional): <code>under</code> (di belakang teks) atau <code>over</code> (di depan).
      </li>
    </ul>
  ),
  icon_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>Tempel SVG utuh (dari Figma/Illustrator/Lucide) atau hanya isi atribut <code>d</code>.</li>
      <li>Didukung: path, circle, rect, line, polyline, polygon, ellipse. Script, gambar, dan filter otomatis diabaikan (aman).</li>
      <li>Ikon garis (stroke) & isi (fill) dideteksi otomatis. Warna diatur user di editor.</li>
    </ul>
  ),
  component_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <b>layers</b>: daftar bentuk — <code>rect</code>, <code>pill</code>, <code>circle</code>, <code>line</code>, <code>text</code>, <code>icon</code>. Koordinat ≤ 1 = persen ukuran, &gt; 1 = piksel.
      </li>
      <li>
        Warna tema: <code>$primary</code>, <code>$secondary</code>, <code>$text</code>, <code>$surface</code> (ikut berubah saat user ganti tema).
      </li>
      <li>
        Teks dinamis: <code>{'{{title}}'}</code> diisi dari <b>props</b> dan bisa diedit user.
      </li>
      <li>
        Animasi internal per layer: <code>anim</code>: pulse | float | spin | blink | grow, plus <code>delay</code> (detik).
      </li>
      <li>
        Atau perluas komponen bawaan: <code>{'{"base": "price", "style": "neon"}'}</code> lalu tambah layers. Base: {componentKinds().map((k) => k.kind).join(', ')}.
      </li>
    </ul>
  ),
  transition_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <b>kind</b> bawaan + <b>params</b>, contoh <code>{'{"kind":"iris","params":{"origin":"tl"}}'}</code>. Kind: cut, fade, slide, push, wipe, iris, shape, zoom, blinds, grid, stripes, spin, flip, cube, whip, glitch, flash, blur, split, clock, pixelate, ink, slice, colorwipe, burst, shake, card, dolly.
      </li>
      <li>
        Mode <b>custom</b>: <code>outFrom/outTo</code> (scene lama) & <code>inFrom/inTo</code> (scene baru) berisi x, y, scale, rot, alpha + <code>mask</code>: none | circle | rect | diamond.
      </li>
      <li>
        <b>easing</b>: {Object.keys(EASINGS).join(', ')}. <b>energy</b> 1–3 dipakai prompt engine.
      </li>
    </ul>
  ),
  animation_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        <b>kind</b>: <code>in</code> (masuk/keluar) atau <code>loop</code>.
      </li>
      <li>
        Masuk: pakai <code>from</code> (pose awal → normal) atau <code>keyframes</code> (t 0..1). Pose: x, y, scale, sx, sy, rot, alpha, blur, skew.
      </li>
      <li>
        <code>clip</code>: left | right | up | down | center-h | center-v | circle | diagonal (efek wipe reveal).
      </li>
      <li>
        Teks per huruf/kata: <code>{'"text": {"mode":"word","from":{"y":60,"alpha":0},"overlap":0.4}'}</code>, opsi scramble / cursor / highlight.
      </li>
      <li>
        Loop: <code>{'"loop": {"wave":"sin","amp":{"y":20},"period":2}'}</code> — wave: sin, pulse, shake, bounce, spin, flash, heartbeat, wobble.
      </li>
    </ul>
  ),
};

function useAnimatedCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      draw(ctx, c.width, c.height, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function frame(label: string, bg: string, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 8; i++) x.fillRect(0, (i * h) / 8, w, 2);
  x.fillStyle = '#FFF3EA';
  x.font = `900 ${h * 0.12}px ${canvasFamily('Plus Jakarta Sans')}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(label, w / 2, h / 2);
  return c;
}

function PreviewIcon({ parts, viewBox }: { parts: IconDef['parts']; viewBox: IconDef['viewBox'] }) {
  const def: IconDef = { id: 'preview', name: '', group: '', tags: [], viewBox, parts, author: 'admin' };
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        ['#FF6A3D', '#120E0C'],
        ['#FFFFFF', '#FF6A3D'],
        ['#120E0C', '#FFB547'],
      ].map(([fg, bg], i) => (
        <div key={i} className="flex aspect-square items-center justify-center rounded-2xl p-6" style={{ background: bg, color: fg }} dangerouslySetInnerHTML={{ __html: iconSvgMarkup(def, 'currentColor', 2) }} />
      ))}
    </div>
  );
}

function PreviewComponent({ def }: { def: ComponentDef }) {
  const [themeIdx, setThemeIdx] = useState(0);
  const th = THEMES[themeIdx];
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, th.palette.bg);
      g.addColorStop(1, th.palette.bg2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const s = Math.min((W * 0.86) / def.size.w, (H * 0.8) / def.size.h);
      ctx.save();
      ctx.translate((W - def.size.w * s) / 2, (H - def.size.h * s) / 2);
      drawComponent(ctx, def, def.size.w * s, def.size.h * s, {}, { primary: th.palette.primary, secondary: th.palette.secondary, text: th.palette.text, surface: th.palette.surface }, { heading: canvasFamily(th.headingFont), body: canvasFamily(th.bodyFont), t: t % 4, allowBlur: true });
      ctx.restore();
    },
    [def, themeIdx]
  );
  return (
    <div className="space-y-2">
      <canvas ref={ref} width={640} height={420} className="w-full rounded-2xl" />
      <div className="mk-noscroll flex gap-1 overflow-x-auto">
        {THEMES.slice(0, 14).map((t, i) => (
          <button key={t.id} type="button" title={t.name} onClick={() => setThemeIdx(i)} className={cx('h-6 w-10 shrink-0 overflow-hidden rounded-md border-2', i === themeIdx ? 'border-mk-cream' : 'border-transparent')}>
            <span className="flex h-full">
              <span className="flex-1" style={{ background: t.palette.bg }} />
              <span className="flex-1" style={{ background: t.palette.primary }} />
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-mk-dim">Klik warna untuk mengecek komponen di berbagai tema.</p>
    </div>
  );
}

function PreviewTransition({ spec }: { spec: TransitionSpec }) {
  const frames = useMemo(() => (typeof document !== 'undefined' ? [frame('SCENE A', '#3A2A24', 360, 640), frame('SCENE B', '#FF6A3D', 360, 640)] : null), []);
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      if (!frames) return;
      const cycle = spec.duration + 1.2;
      const local = t % cycle;
      const p = Math.min(1, Math.max(0, (local - 0.6) / spec.duration));
      ctx.clearRect(0, 0, W, H);
      drawTransition(ctx, spec, p, frames[0], frames[1], W, H, { primary: '#FF6A3D', secondary: '#FFB547' }, true);
    },
    [spec, frames]
  );
  return <canvas ref={ref} width={360} height={640} className="mx-auto h-[420px] w-auto rounded-2xl bg-black" />;
}

function PreviewAnimation({ spec }: { spec: AnimSpec }) {
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1B1512';
      ctx.fillRect(0, 0, W, H);
      const cycle = spec.kind === 'loop' ? 1e9 : spec.duration + 1;
      const local = t % cycle;
      const k = W / 1080;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      let alpha = 1;
      if (spec.kind === 'loop') {
        const ps = evalLoop(spec, local);
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        ctx.scale(ps.scale * ps.sx, ps.scale * ps.sy);
        alpha = ps.alpha;
      } else {
        const ev = evalIn(spec, Math.min(1, local / spec.duration));
        const ps = ev.pose;
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        if (ps.skew) ctx.transform(1, 0, Math.tan((ps.skew * Math.PI) / 180), 1, 0, 0);
        ctx.scale(ps.scale * ps.sx || 0.001, ps.scale * ps.sy || 0.001);
        if (ps.blur > 0.5) ctx.filter = `blur(${ps.blur * k}px)`;
        alpha = ps.alpha;
        if (ev.clip) {
          ctx.beginPath();
          ctx.rect(-W * 0.4, -H * 0.2, W * 0.8 * ev.clip.p, H * 0.4);
          ctx.clip();
        }
        if (ev.text) {
          const words = ['Animasi', 'teks', 'keren'];
          const n = words.length;
          ctx.font = `800 ${W * 0.08}px ${canvasFamily('Plus Jakarta Sans')}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const ov = ev.text.spec.overlap;
          const dur = 1 / (1 + (n - 1) * (1 - ov));
          words.forEach((w, i) => {
            const ip = Math.min(1, Math.max(0, (ev.text!.p - i * dur * (1 - ov)) / dur));
            const f = ev.text!.spec.from;
            ctx.save();
            ctx.globalAlpha = Math.max(0, (f.alpha ?? 1) + (1 - (f.alpha ?? 1)) * ip);
            ctx.translate((i - 1) * W * 0.27 + (f.x ?? 0) * k * (1 - ip), (f.y ?? 0) * k * (1 - ip));
            ctx.rotate((((f.rot ?? 0) * (1 - ip)) * Math.PI) / 180);
            const sc = (f.scale ?? 1) + (1 - (f.scale ?? 1)) * ip;
            ctx.scale(sc || 0.001, sc || 0.001);
            ctx.fillStyle = i === 1 ? '#FF6A3D' : '#FFF3EA';
            ctx.fillText(w, 0, 0);
            ctx.restore();
          });
          ctx.restore();
          return;
        }
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.roundRect(-W * 0.22, -H * 0.12, W * 0.44, H * 0.24, 28 * k * 3);
      const g = ctx.createLinearGradient(-W * 0.22, 0, W * 0.22, 0);
      g.addColorStop(0, '#FF6A3D');
      g.addColorStop(1, '#FFB547');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = '#120E0C';
      ctx.font = `900 ${W * 0.07}px ${canvasFamily('Plus Jakarta Sans')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MotionKu', 0, 2);
      ctx.restore();
    },
    [spec]
  );
  return <canvas ref={ref} width={640} height={420} className="w-full rounded-2xl" />;
}

interface Validation {
  ok: boolean;
  error?: string;
  icon?: { parts: IconDef['parts']; viewBox: IconDef['viewBox'] };
  comp?: ComponentDef;
  tr?: TransitionSpec;
  anim?: AnimSpec;
  fx?: EffectSpec;
}

function validate(tab: Tab, code: string, name: string): Validation {
  if (!code.trim()) return { ok: false, error: 'Kode masih kosong.' };
  switch (tab) {
    case 'icon_pack': {
      const r = parseSvgMarkup(code);
      return r.ok ? { ok: true, icon: { parts: r.parts, viewBox: r.viewBox } } : { ok: false, error: r.error };
    }
    case 'component_pack': {
      const r = parseComponentCode(code, name);
      return r.ok ? { ok: true, comp: r.def } : { ok: false, error: r.error };
    }
    case 'transition_pack': {
      const r = parseTransitionCode(code, name);
      return r.ok ? { ok: true, tr: r.spec } : { ok: false, error: r.error };
    }
    case 'animation_pack': {
      const r = parseAnimationCodeSafe(code, name);
      return r;
    }
    case 'effect_pack': {
      const r = parseEffectCode(code, name);
      return r.ok ? { ok: true, fx: r.spec } : { ok: false, error: r.error };
    }
    default:
      return { ok: true };
  }
}
function parseAnimationCodeSafe(code: string, name: string): Validation {
  const r = parseAnimationCode(code, name);
  return r.ok ? { ok: true, anim: r.spec } : { ok: false, error: r.error };
}

const EXAMPLES: Record<Exclude<Tab, 'teks'>, string> = {
  icon_pack: ICON_EXAMPLE,
  component_pack: COMPONENT_CODE_EXAMPLE,
  transition_pack: TRANSITION_CODE_EXAMPLE,
  animation_pack: ANIMATION_CODE_EXAMPLE,
  effect_pack: EFFECT_CODE_EXAMPLE,
};

export default function TrainingStudio() {
  const [tab, setTab] = useState<Tab>('icon_pack');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('all');
  const [tags, setTags] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [textType, setTextType] = useState<'hook' | 'cta'>('hook');
  const [, force] = useState(0);
  const [debounced, setDebounced] = useState({ code: '', name: '' });

  useEffect(() => {
    const id = setTimeout(() => setDebounced({ code, name }), 280);
    return () => clearTimeout(id);
  }, [code, name]);
  const v = useMemo(() => (tab === 'teks' ? { ok: !!debounced.code.trim() } : validate(tab, debounced.code, debounced.name || 'Preview')), [tab, debounced]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ai_training_data')
      .select('id,type,category,content_text,subtext,metadata_json,created_at')
      .in('type', ['icon_pack', 'component_pack', 'transition_pack', 'animation_pack', 'effect_pack', 'hook', 'cta'])
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) setNotice({ ok: false, text: /does not exist|schema/i.test(error.message) ? 'Tabel ai_training_data belum ada. Jalankan supabase/migration.sql.' : error.message });
    setRows((data || []) as TrainingRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
    loadTraining().then(() => force((n) => n + 1));
    ensureFonts(['Plus Jakarta Sans', 'Poppins', 'Montserrat', 'Anton', 'Playfair Display', 'Space Grotesk', 'Bebas Neue']).then(() => force((n) => n + 1));
  }, [fetchRows]);

  const reset = () => {
    setName('');
    setTags('');
    setCode('');
    setEditingId(null);
    setCategory('all');
  };

  const save = async () => {
    const type = tab === 'teks' ? textType : tab;
    if (!name.trim() && tab !== 'teks') return setNotice({ ok: false, text: 'Isi nama dulu.' });
    if (!v.ok) return setNotice({ ok: false, text: v.error || 'Kode belum valid.' });
    setSaving(true);
    const supabase = createClient();
    const payload = {
      type,
      category,
      content_text: code.trim(),
      subtext: tab === 'teks' ? null : name.trim(),
      metadata_json: { tags: tags.split(',').map((t) => t.trim()).filter(Boolean), engine: 'v6' },
    };
    const res = editingId ? await supabase.from('ai_training_data').update(payload).eq('id', editingId).select('*').single() : await supabase.from('ai_training_data').insert(payload).select('*').single();
    setSaving(false);
    if (res.error) return setNotice({ ok: false, text: res.error.message });
    const row = res.data as TrainingRow;
    applyRow(row);
    setNotice({ ok: true, text: editingId ? 'Perubahan tersimpan & langsung aktif di editor semua user.' : 'Tersimpan! Pack baru langsung muncul di editor semua user.' });
    reset();
    fetchRows();
    force((n) => n + 1);
  };

  const del = async (row: TrainingRow) => {
    if (!confirm(`Hapus "${row.subtext || row.content_text.slice(0, 30)}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await createClient().from('ai_training_data').delete().eq('id', row.id);
    if (error) return setNotice({ ok: false, text: error.message });
    removeRow(row);
    setRows((r) => r.filter((x) => x.id !== row.id));
    force((n) => n + 1);
  };

  const edit = (row: TrainingRow) => {
    setEditingId(row.id);
    setName(row.subtext || '');
    setCode(row.content_text);
    setCategory(row.category || 'all');
    setTags(((row.metadata_json?.tags as string[]) || []).join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatJson = () => {
    try {
      setCode(JSON.stringify(JSON.parse(code), null, 2));
    } catch (e) {
      setNotice({ ok: false, text: `Belum bisa dirapikan: ${(e as Error).message}` });
    }
  };

  const listForTab = rows.filter((r) => (tab === 'teks' ? r.type === 'hook' || r.type === 'cta' : r.type === tab));
  const counts = {
    icon_pack: allIcons().length,
    component_pack: allComponents().length,
    transition_pack: allTransitions().length,
    animation_pack: allAnimations().length,
    effect_pack: allEffects().length,
  };

  return (
    <div className="mk-page">
      <header className="sticky top-0 z-30 border-b border-mk-line bg-mk-ink/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/dashboard" className="mk-btn-icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo className="text-sm" />
          <span className="rounded-full bg-mk-coral/15 px-2 py-0.5 text-[11px] font-bold text-mk-coral">Admin Training</span>
          <Link href="/editor" className="mk-btn-ghost ml-auto px-3 py-1.5 text-xs">
            Buka editor uji
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            ['Template', TEMPLATES.length],
            ['Komponen', counts.component_pack],
            ['Ikon', counts.icon_pack],
            ['Transisi', counts.transition_pack],
            ['Animasi', counts.animation_pack],
            ['Efek', counts.effect_pack],
          ].map(([l, n]) => (
            <div key={l as string} className="mk-card px-4 py-3">
              <div className="text-xl font-extrabold">{n}</div>
              <div className="text-[11px] text-mk-dim">{l} tersedia</div>
            </div>
          ))}
        </div>

        <div className="mk-noscroll -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => (setTab(t.id), reset(), setNotice(null))} className={cx('mk-chip shrink-0 px-4 py-2 text-sm', tab === t.id && 'mk-chip-on')}>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>

        {notice && (
          <div className={cx('mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm', notice.ok ? 'bg-mk-mint/10 text-mk-mint' : 'bg-red-500/10 text-red-300')}>
            {notice.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {notice.text}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* -------- form -------- */}
          <div className="mk-card space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Code2 className="h-4 w-4 text-mk-coral" /> {TABS.find((t) => t.id === tab)?.label}
              {editingId && <span className="rounded bg-mk-amber/20 px-1.5 py-0.5 text-[10px] text-mk-amber">mengedit</span>}
            </div>

            {tab === 'teks' ? (
              <>
                <Segmented value={textType} onChange={setTextType} options={[{ value: 'hook', label: 'Hook pembuka' }, { value: 'cta', label: 'Ajakan (CTA)' }]} />
                <label className="block">
                  <span className="mk-label">Kalimat (boleh pakai {'{produk}'}, {'{harga}'}, {'{toko}'}, {'{topik}'}, {'{n}'})</span>
                  <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={3} className="mk-input" placeholder="Contoh: {produk} cuma {harga}? Gas sebelum kehabisan!" />
                </label>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mk-label">Nama</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="mk-input" placeholder="Misal: Kopi Cup Garis" />
                  </label>
                  <label className="block">
                    <span className="mk-label">Tag pencarian (pisah koma)</span>
                    <input value={tags} onChange={(e) => setTags(e.target.value)} className="mk-input" placeholder="kopi, minuman, cafe" />
                  </label>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="mk-label mb-0">{tab === 'icon_pack' ? 'Kode SVG' : 'Kode JSON'}</span>
                    <span className="flex gap-1.5">
                      <button type="button" className="mk-chip py-1" onClick={() => (setCode(EXAMPLES[tab]), !name && setName(tab === 'icon_pack' ? 'Kopi Custom' : 'Contoh'))}>
                        <Wand2 className="h-3 w-3" /> Isi contoh
                      </button>
                      {tab !== 'icon_pack' && (
                        <button type="button" className="mk-chip py-1" onClick={formatJson}>
                          Rapikan
                        </button>
                      )}
                    </span>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={14}
                    spellCheck={false}
                    className="mk-input font-mono text-[12px] leading-relaxed"
                    placeholder={tab === 'icon_pack' ? '<svg viewBox="0 0 24 24">…</svg>' : '{ "name": "…" }'}
                  />
                  <div className={cx('mt-1.5 text-[11px] font-semibold', !debounced.code ? 'text-mk-dim' : v.ok ? 'text-mk-mint' : 'text-red-300')}>
                    {!debounced.code ? 'Tempel kode lalu lihat preview langsung di kanan.' : v.ok ? '✓ Kode valid — preview aktif' : `✗ ${v.error}`}
                  </div>
                </div>
              </>
            )}

            <label className="block">
              <span className="mk-label">Kategori konten</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mk-input py-2">
                <option value="all">Semua</option>
                <option value="promo">Promo</option>
                <option value="edukasi">Edukasi</option>
                <option value="quote">Quote</option>
              </select>
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving || !v.ok} className="mk-btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editingId ? 'Simpan perubahan' : 'Simpan & aktifkan'}
              </button>
              {(editingId || code) && (
                <button type="button" onClick={reset} className="mk-btn-ghost">
                  Batal
                </button>
              )}
            </div>

            {tab !== 'teks' && (
              <details className="rounded-xl bg-mk-ink p-3 text-[12px] text-mk-muted">
                <summary className="flex cursor-pointer items-center gap-1.5 font-bold text-mk-cream">
                  <BookOpen className="h-3.5 w-3.5" /> Panduan format kode
                </summary>
                <div className="mt-2">{GUIDE[tab]}</div>
              </details>
            )}
          </div>

          {/* -------- preview -------- */}
          <div className="mk-card p-4 sm:p-5">
            <div className="mb-3 text-sm font-extrabold">Preview langsung</div>
            {tab === 'teks' ? (
              <div className="rounded-2xl bg-mk-ink p-6 text-center text-lg font-extrabold">{code ? code.replace('{produk}', 'Kopi Susu').replace('{harga}', 'Rp 18.000').replace('{toko}', 'Kopi Senja').replace('{topik}', 'keuangan').replace('{n}', '5') : 'Teks akan tampil di sini'}</div>
            ) : !v.ok ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-mk-line-2 text-sm text-mk-dim">Preview muncul saat kode valid</div>
            ) : v.icon ? (
              <PreviewIcon parts={v.icon.parts} viewBox={v.icon.viewBox} />
            ) : v.comp ? (
              <PreviewComponent def={v.comp} />
            ) : v.tr ? (
              <PreviewTransition spec={v.tr} />
            ) : v.anim ? (
              <PreviewAnimation spec={v.anim} />
            ) : v.fx ? (
              <div className="mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl">
                <EffectThumb spec={v.fx} primary="#FF6A3D" secondary="#FFB547" autoplay w={640} h={400} />
              </div>
            ) : null}
          </div>
        </div>

        {/* -------- daftar -------- */}
        <div className="mk-card mt-6 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-extrabold">Hasil training ({listForTab.length})</div>
            <button type="button" className="mk-btn-icon" onClick={fetchRows} title="Muat ulang">
              <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />
            </button>
          </div>
          {!loading && !listForTab.length && <p className="py-6 text-center text-sm text-mk-dim">Belum ada data untuk tab ini.</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {listForTab.map((r) => {
              let ok = true;
              let preview: React.ReactNode = null;
              if (r.type === 'icon_pack') {
                const p = parseSvgMarkup(r.content_text);
                ok = p.ok;
                if (p.ok) preview = <span className="h-8 w-8 text-mk-coral" dangerouslySetInnerHTML={{ __html: iconSvgMarkup({ id: '', name: '', group: '', tags: [], viewBox: p.viewBox, parts: p.parts, author: 'admin' }) }} />;
              }
              return (
                <div key={r.id} className="mk-card-2 flex items-center gap-3 p-3">
                  {preview || <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mk-panel-3 text-[10px] font-bold uppercase text-mk-muted">{r.type.slice(0, 3)}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{r.subtext || r.content_text}</div>
                    <div className="text-[10px] text-mk-dim">
                      {r.type} · {r.category} {!ok && <span className="text-red-300">· kode rusak</span>}
                    </div>
                  </div>
                  <button type="button" className="mk-btn-icon" onClick={() => edit(r)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="mk-btn-icon hover:!text-red-300" onClick={() => del(r)} title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
