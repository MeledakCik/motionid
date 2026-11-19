/**
 * Impor proyek / preset Alight Motion (.xml) — EKSPERIMENTAL.
 * Format XML Alight Motion tidak dipublikasikan resmi; struktur yang dibaca:
 * <scene width height totalTime bgcolor> berisi <shape>, <text>, <embedScene> dengan
 * <transform><location|scale|rotation|opacity value=".."> atau <kf t="0..1" v=".." e="cubicBezier ..">,
 * <fillColor value="#AARRGGBB">, <property name="size" type="vec2" value="w,h">.
 */
import type { GroupLayer, Keyframe, Layer, MediaInfo, Scene, ShapeLayer, TextLayer, VideoLayer } from '../types';
import { uid } from '../types';
import { argbHex, Fit, fitFor, ImportError, ImportResult, kid, kids, newImportDoc, parseXml, tidyKeys, XNode } from './common';

interface Track {
  stat: number[] | null;
  keys: Array<{ t: number; v: number[]; e?: string }>;
}

const nums = (s: string | undefined) => (s || '').split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => !isNaN(n));

function readProp(n: XNode | undefined, t0: number, dur: number): Track {
  if (!n) return { stat: null, keys: [] };
  const ks = kids(n, 'kf').map((k) => ({ t: t0 + Number(k.attrs.t || 0) * dur, v: nums(k.attrs.v), e: k.attrs.e }));
  return { stat: n.attrs.value !== undefined ? nums(n.attrs.value) : ks[0]?.v || null, keys: ks };
}

function easeOf(e?: string): { ease: string; bez?: [number, number, number, number] } {
  if (!e) return { ease: 'linear' };
  const m = /cubicBezier\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i.exec(e);
  if (m) return { ease: 'custom', bez: [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] };
  if (/hold|step/i.test(e)) return { ease: 'snap' };
  if (/ease.?in.?out|inout/i.test(e)) return { ease: 'inOutCubic' };
  if (/ease.?out|decel/i.test(e)) return { ease: 'outCubic' };
  if (/ease.?in|accel/i.test(e)) return { ease: 'inCubic' };
  return { ease: 'linear' };
}

function valAt(tr: Track, t: number, d: number[]): number[] {
  if (!tr.keys.length) return tr.stat?.length ? tr.stat : d;
  const ks = tr.keys;
  if (t <= ks[0].t) return ks[0].v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t < b.t) {
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      const e = easeOf(a.e);
      let k = u;
      if (e.ease === 'snap') k = 0;
      else if (e.bez) {
        const [x1, y1, x2, y2] = e.bez;
        let lo = 0;
        let hi = 1;
        let s = u;
        for (let n = 0; n < 20; n++) {
          const v = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
          if (v < u) lo = s;
          else hi = s;
          s = (lo + hi) / 2;
        }
        k = 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
      }
      return a.v.map((v, j) => v + ((b.v[j] ?? v) - v) * k);
    }
  }
  return ks[ks.length - 1].v;
}

interface Ctx {
  fit: Fit | { s: number; ox: number; oy: number };
  sceneDur: number;
  offset: number;
  notes: Set<string>;
  media: Record<string, MediaInfo>;
  counts: Record<string, number>;
}

function sizeOf(n: XNode, t0: number, dur: number): number[] {
  const p = kids(n, 'property').find((q) => q.attrs.name === 'size');
  return p ? valAt(readProp(p, t0, dur), t0, [100, 100]) : [100, 100];
}

function guessShape(n: XNode): ShapeLayer['shape'] {
  const sig = JSON.stringify(n.attrs) + n.children.map((c) => c.tag + JSON.stringify(c.attrs)).join(' ');
  if (/ellipse|circle|oval/i.test(sig)) return 'circle';
  if (/triangle/i.test(sig)) return 'triangle';
  if (/star/i.test(sig)) return 'star';
  return 'rect';
}

function convert(nodes: XNode[], ctx: Ctx): Layer[] {
  const out: Layer[] = [];
  for (const n of nodes) {
    if (!['shape', 'text', 'embedScene'].includes(n.tag)) {
      if (['audio', 'sound'].includes(n.tag)) ctx.notes.add('Audio Alight Motion tidak ikut. Tambahkan lewat menu Musik.');
      continue;
    }
    if (n.attrs.hidden === 'true') continue;
    const st = Number(n.attrs.startTime || 0) / 1000 + ctx.offset;
    const en = n.attrs.endTime !== undefined ? Number(n.attrs.endTime) / 1000 + ctx.offset : ctx.sceneDur;
    const dur = Math.max(0.01, en - st);
    const name = n.attrs.label || n.attrs.name || (n.tag === 'text' ? 'Teks' : 'Layer');
    if (kids(n, 'effect').length) ctx.notes.add('Efek Alight Motion (blur, glow, wipe, dll) tidak ikut diimpor.');
    const tf = kid(n, 'transform');
    const loc = readProp(tf && kid(tf, 'location'), st, dur);
    const sca = readProp(tf && kid(tf, 'scale'), st, dur);
    const rot = readProp(tf && (kid(tf, 'rotation') || kid(tf, 'orientation')), st, dur);
    const opa = readProp(tf && kid(tf, 'opacity'), st, dur);
    const size = sizeOf(n, st, dur);
    const fill = argbHex(kid(n, 'fillColor')?.attrs.value, '#FFFFFF');
    const poseAt = (t: number) => {
      const l = valAt(loc, t, [0, 0]);
      const s = valAt(sca, t, [1, 1]);
      const sx = s[0] ?? 1;
      const sy = s[1] ?? sx;
      return { cx: ctx.fit.ox + (l[0] || 0) * ctx.fit.s, cy: ctx.fit.oy + (l[1] || 0) * ctx.fit.s, sx, sy, r: valAt(rot, t, [0])[0] || 0, o: Math.max(0, Math.min(1, valAt(opa, t, [1])[0] ?? 1)) };
    };
    const p0 = poseAt(st);
    let w = Math.max(1, Math.abs(size[0] * p0.sx) * ctx.fit.s);
    let h = Math.max(1, Math.abs(size[1] * p0.sy) * ctx.fit.s);
    let layer: Layer;
    if (n.tag === 'text') {
      const fontAttr = n.attrs.font || '';
      const fam = /name=([^&]+)/.exec(fontAttr)?.[1] || '';
      const weight = Number(/weight=(\d+)/.exec(fontAttr)?.[1] || 600);
      const textNode = kid(n, 'content') || kid(n, 'string') || kid(n, 'text');
      const text = (textNode?.text || n.attrs.text || n.text || name).trim() || name;
      const sizePx = Number(n.attrs.size || 48) * Math.abs(p0.sy) * ctx.fit.s;
      const lines = text.split('\n');
      w = Math.max(w > 2 ? w : 0, Math.max(...lines.map((l) => l.length)) * sizePx * 0.6 + sizePx * 0.4);
      h = Math.max(h > 2 ? Math.min(h, sizePx * lines.length * 1.6) : 0, sizePx * lines.length * 1.25);
      const font: TextLayer['font'] = /bebas/i.test(fam) ? 'Bebas Neue' : /anton/i.test(fam) ? 'Anton' : /playfair|serif/i.test(fam) ? 'Playfair Display' : /montserrat/i.test(fam) ? 'Montserrat' : /poppins/i.test(fam) ? 'Poppins' : 'Plus Jakarta Sans';
      layer = { id: uid('ly'), kind: 'text', name, x: 0, y: 0, w, h, rotation: 0, opacity: 1, start: 0, end: null, text, font, size: Math.max(8, sizePx), weight: weight >= 700 ? 800 : weight >= 500 ? 600 : 400, color: fill, align: 'center', lineHeight: 1.15, letterSpacing: 0, stroke: null, highlight: null };
      ctx.counts.teks = (ctx.counts.teks || 0) + 1;
      if (!fam) ctx.notes.add('Font teks Alight Motion diganti font terdekat yang tersedia.');
    } else if (n.tag === 'embedScene') {
      const ew = Number(n.attrs.width || size[0] || 100);
      const eh = Number(n.attrs.height || size[1] || 100);
      const inner = convert(n.children, { ...ctx, fit: { s: 1, ox: 0, oy: 0 }, offset: st });
      if (!inner.length) continue;
      w = Math.max(1, ew * Math.abs(p0.sx) * ctx.fit.s);
      h = Math.max(1, eh * Math.abs(p0.sy) * ctx.fit.s);
      const g: GroupLayer = { id: uid('ly'), kind: 'group', name, x: 0, y: 0, w, h, cw: ew, ch: eh, rotation: 0, opacity: 1, start: 0, end: null, children: inner };
      layer = g;
      ctx.counts.grup = (ctx.counts.grup || 0) + 1;
    } else if (n.attrs.fillType === 'media') {
      const mid = uid('vid');
      ctx.media[mid] = { id: mid, name, kind: 'video', mime: 'video/mp4', duration: dur, w: size[0], h: size[1], size: 0, missing: true };
      const v: VideoLayer = { id: uid('ly'), kind: 'video', name, x: 0, y: 0, w, h, rotation: 0, opacity: 1, start: 0, end: null, mediaId: mid, trimIn: 0, trimOut: dur, speed: 1, volume: 1, fit: 'cover', radius: 0 };
      layer = v;
      ctx.counts.media = (ctx.counts.media || 0) + 1;
    } else {
      const grad = kid(n, 'gradient');
      const sh: ShapeLayer = { id: uid('ly'), kind: 'shape', name, x: 0, y: 0, w, h, rotation: 0, opacity: 1, start: 0, end: null, shape: guessShape(n), fill: grad ? argbHex(grad.attrs.startColor, fill) : fill, stroke: null, radius: 0 };
      if (grad) ctx.notes.add('Gradien Alight Motion diganti warna awalnya (ubah jadi vektor bila perlu gradien).');
      layer = sh;
      ctx.counts.bentuk = (ctx.counts.bentuk || 0) + 1;
    }
    const base = { ...layer, x: p0.cx - w / 2, y: p0.cy - h / 2, rotation: p0.r, opacity: p0.o } as Layer;
    base.start = Math.max(0, Math.round(st * 100) / 100);
    base.end = en >= ctx.sceneDur - 0.02 ? null : Math.round(en * 100) / 100;
    const times = Array.from(new Set([loc, sca, rot, opa].flatMap((tr) => tr.keys.map((k) => Math.round(k.t * 100) / 100)))).sort((a, b) => a - b);
    if (times.length >= 2) {
      const bs = (Math.abs(p0.sx) + Math.abs(p0.sy)) / 2 || 1;
      const ks: Keyframe[] = times.map((t) => {
        const p = poseAt(t);
        const src = [loc, sca, rot, opa].map((tr) => tr.keys.find((k) => Math.abs(k.t - t) < 0.006)).find(Boolean);
        const e = easeOf(src?.e);
        return { t, x: p.cx - w / 2, y: p.cy - h / 2, rotation: p.r, opacity: p.o, scale: (Math.abs(p.sx) + Math.abs(p.sy)) / 2 / bs, ease: e.ease, ...(e.bez ? { bez: e.bez } : {}) };
      });
      base.keyframes = tidyKeys(ks);
      if (base.keyframes) ctx.counts.keys = (ctx.counts.keys || 0) + base.keyframes.length;
    }
    out.push(base);
  }
  return out;
}

export function isAlightXml(text: string): boolean {
  return /Alight Motion/i.test(text.slice(0, 600)) || (/<scene[\s>]/.test(text) && /<(shape|text|embedScene)[\s>]/.test(text));
}

export function importAlight(text: string, file: string): ImportResult {
  const root = parseXml(text);
  const scene = root.children.find((c) => c.tag === 'scene');
  if (!scene) throw new ImportError('File XML ini bukan proyek Alight Motion.');
  const sw = Number(scene.attrs.width || 1080);
  const sh = Number(scene.attrs.height || 1920);
  const fit = fitFor(sw, sh);
  const ends = scene.children.map((c) => Number(c.attrs.endTime || 0) / 1000);
  const total = Number(scene.attrs.totalTime || 0) / 1000 || Math.max(3, ...ends);
  const dur = Math.min(60, Math.max(0.5, total));
  const ctx: Ctx = { fit, sceneDur: dur, offset: 0, notes: new Set<string>(), media: {}, counts: {} };
  ctx.notes.add('Impor Alight Motion masih eksperimental: format XML-nya tidak dipublikasikan resmi, jadi sebagian properti bisa meleset.');
  if (total > 60) ctx.notes.add('Durasi dipotong jadi 60 detik.');
  // urutan XML: elemen pertama digambar paling bawah
  const layers = convert(scene.children, ctx);
  if (!layers.length) throw new ImportError('Tidak ada layer yang bisa dibaca dari XML ini.');
  if (ctx.counts.media) ctx.notes.add(`${ctx.counts.media} klip media perlu disambungkan ulang (pilih klip, lalu "Pilih file").`);
  const doc = newImportDoc(fit, scene.attrs.title || file.replace(/\.xml$/i, ''), 'alight-motion', file);
  const sc: Scene = {
    id: uid('sc'),
    name: scene.attrs.title || 'Alight Motion',
    role: 'info',
    duration: Math.round(dur * 100) / 100,
    background: { type: 'solid', color: argbHex(scene.attrs.bgcolor, '#000000') },
    layers,
    transition: { id: 'cut', duration: 0.01 },
  };
  const c = ctx.counts;
  const notes = [...ctx.notes];
  const parts = [c.bentuk && `${c.bentuk} bentuk`, c.teks && `${c.teks} teks`, c.grup && `${c.grup} grup`, c.media && `${c.media} media`, c.keys && `${c.keys} keyframe`].filter(Boolean);
  return {
    doc: { ...doc, scenes: [sc], media: ctx.media, imported: { from: 'alight-motion', file, notes } },
    summary: `Alight Motion: ${parts.join(', ')} · ${dur.toFixed(1)} dtk · ${sw}×${sh}`,
    notes,
  };
}
