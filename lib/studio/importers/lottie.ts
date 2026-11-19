/**
 * Impor animasi After Effects lewat format Lottie / Bodymovin (.json).
 * Hasilnya layer MotionKu yang bisa diedit: vektor, teks, gambar, grup (precomp),
 * dengan keyframe + kurva gerak asli AE, sehingga cara pembuatannya terlihat.
 */
import type { FontId, GroupLayer, ImageLayer, Keyframe, Layer, PathLayer, Scene, ShapeLayer, TextLayer } from '../types';
import { uid } from '../types';
import { AbsPoint, pathFromContours } from '../vector';
import { Fit, fitFor, ImportError, ImportResult, newImportDoc, rgbaFrom01, tidyKeys } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;
type M = [number, number, number, number, number, number];

const I: M = [1, 0, 0, 1, 0, 0];
const mul = (m: M, n: M): M => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m: M, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });
const applyV = (m: M, x: number, y: number) => ({ x: m[0] * x + m[2] * y, y: m[1] * x + m[3] * y });
const arr = (v: Any): number[] => (Array.isArray(v) ? v.map(Number) : v === undefined || v === null ? [] : [Number(v)]);
const first = (v: Any, d = 0): number => (Array.isArray(v) ? Number(v[0] ?? d) : v === undefined ? d : Number(v));

function isKeyed(p: Any): boolean {
  return !!p && (p.a === 1 || (Array.isArray(p.k) && p.k.length > 0 && typeof p.k[0] === 'object' && p.k[0] !== null && 't' in p.k[0]));
}

/** Nilai properti Lottie pada frame f (dengan interpolasi bezier asli AE). */
function valueAt(p: Any, f: number): number[] {
  if (!p) return [];
  if (p.s === true && p.x && p.y) return [first(valueAt(p.x, f)), first(valueAt(p.y, f))];
  if (!isKeyed(p)) return arr(p.k);
  const ks: Any[] = p.k;
  if (f <= ks[0].t) return arr(ks[0].s);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (f < b.t) {
      const v0 = arr(a.s);
      const v1 = arr(a.e ?? b.s);
      if (a.h === 1 || !v1.length) return v0;
      const u = (f - a.t) / Math.max(1e-6, b.t - a.t);
      const e = bezOf(a);
      const k = e ? bez(e, u) : u;
      return v0.map((v, j) => v + ((v1[j] ?? v) - v) * k);
    }
  }
  const last = ks[ks.length - 1];
  return arr(last.s ?? ks[ks.length - 2]?.e);
}

function bezOf(k: Any): [number, number, number, number] | null {
  if (!k?.o || !k?.i) return null;
  return [first(k.o.x), first(k.o.y), first(k.i.x, 1), first(k.i.y, 1)];
}

function bez(b: [number, number, number, number], x: number): number {
  const [x1, y1, x2, y2] = b;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let n = 0; n < 22; n++) {
    const v = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    if (Math.abs(v - x) < 1e-5) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}

function keyFrames(p: Any): Any[] {
  if (!p) return [];
  if (p.s === true && p.x && p.y) return [...keyFrames(p.x), ...keyFrames(p.y)];
  return isKeyed(p) ? (p.k as Any[]) : [];
}

/* -------------------------------------------------------------------------- */

interface Ctx {
  fr: number;
  /** frame komposisi → detik di scene */
  sec: (f: number) => number;
  fit: Fit;
  /** layer berada di dalam grup (precomp): koordinat lokal tanpa skala kanvas */
  local: boolean;
  assets: Map<string, Any>;
  out: { notes: Set<string>; images: Record<string, string>; counts: Record<string, number> };
  sceneDur: number;
}

function localMatrix(L: Any, f: number): M {
  const ks = L.ks || {};
  const a = valueAt(ks.a, f);
  const p = valueAt(ks.p, f);
  const s = valueAt(ks.s, f);
  const r = first(valueAt(ks.r ?? ks.rz, f));
  const rad = (r * Math.PI) / 180;
  const sx = (s[0] ?? 100) / 100;
  const sy = (s[1] ?? s[0] ?? 100) / 100;
  const T: M = [1, 0, 0, 1, p[0] || 0, p[1] || 0];
  const R: M = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  const S: M = [sx, 0, 0, sy, 0, 0];
  const A: M = [1, 0, 0, 1, -(a[0] || 0), -(a[1] || 0)];
  return mul(mul(mul(T, R), S), A);
}

function worldMatrix(L: Any, f: number, byInd: Map<number, Any>, depth = 0): M {
  const m = localMatrix(L, f);
  const par = L.parent !== undefined ? byInd.get(L.parent) : undefined;
  return par && depth < 20 ? mul(worldMatrix(par, f, byInd, depth + 1), m) : m;
}

/** Semua waktu keyframe transform (milik layer + induknya). */
function transformKeyTimes(L: Any, byInd: Map<number, Any>, depth = 0): number[] {
  const ks = L.ks || {};
  const t = [ks.a, ks.p, ks.s, ks.r ?? ks.rz, ks.o].flatMap((p) => keyFrames(p).map((k) => Number(k.t)));
  const par = L.parent !== undefined ? byInd.get(L.parent) : undefined;
  return par && depth < 20 ? [...t, ...transformKeyTimes(par, byInd, depth + 1).filter((x) => x !== undefined)] : t;
}

/** Easing keyframe yang dimulai di frame f (prioritas: posisi, skala, rotasi, opacity). */
function easeAt(L: Any, f: number, byInd: Map<number, Any>): { ease: string; bez?: [number, number, number, number] } {
  let cur: Any = L;
  for (let d = 0; cur && d < 20; d++) {
    const ks = cur.ks || {};
    for (const p of [ks.p, ks.s, ks.r ?? ks.rz, ks.o, ks.a]) {
      const k = keyFrames(p).find((q) => Math.abs(Number(q.t) - f) < 0.5);
      if (k) {
        if (k.h === 1) return { ease: 'snap' };
        const b = bezOf(k);
        if (!b) return { ease: 'linear' };
        if (Math.abs(b[0] - b[1]) < 0.01 && Math.abs(b[2] - b[3]) < 0.01) return { ease: 'linear' };
        return { ease: 'custom', bez: b.map((v) => Math.round(v * 1000) / 1000) as [number, number, number, number] };
      }
    }
    cur = cur.parent !== undefined ? byInd.get(cur.parent) : undefined;
  }
  return { ease: 'linear' };
}

/** Kotak isi (ruang layer) → posisi, ukuran, keyframe MotionKu. */
function place<T extends Layer>(L: Any, base: T, box: { x: number; y: number; w: number; h: number }, ctx: Ctx, byInd: Map<number, Any>, scaleContent?: (l: T, k: number) => T): T {
  const ip = Number(L.ip ?? 0);
  const op = Number(L.op ?? ip + 1);
  const fit = ctx.local ? { s: 1, ox: 0, oy: 0 } : ctx.fit;
  const poseAtF = (f: number) => {
    const m = worldMatrix(L, f, byInd);
    const c = apply(m, box.x + box.w / 2, box.y + box.h / 2);
    const sx = Math.hypot(m[0], m[1]);
    const sy = Math.hypot(m[2], m[3]) * Math.sign(m[0] * m[3] - m[1] * m[2] || 1);
    return { cx: fit.ox + c.x * fit.s, cy: fit.oy + c.y * fit.s, sx, sy: Math.abs(sy), rot: (Math.atan2(m[1], m[0]) * 180) / Math.PI, op: first(valueAt((L.ks || {}).o, f), 100) / 100 };
  };
  const p0 = poseAtF(ip);
  const bs = (p0.sx + p0.sy) / 2 || 1;
  const w = Math.max(1, box.w * p0.sx * fit.s);
  const h = Math.max(1, box.h * p0.sy * fit.s);
  let out = { ...base, x: p0.cx - w / 2, y: p0.cy - h / 2, w, h, rotation: Math.round(p0.rot * 10) / 10, opacity: Math.max(0, Math.min(1, p0.op)) } as T;
  if (scaleContent) out = scaleContent(out, bs * fit.s);
  const start = Math.max(0, ctx.sec(ip));
  const endS = ctx.sec(op);
  out.start = Math.round(start * 100) / 100;
  out.end = endS >= ctx.sceneDur - 0.02 ? null : Math.round(endS * 100) / 100;
  const times = Array.from(new Set(transformKeyTimes(L, byInd).filter((t) => t >= ip - 0.5 && t <= op + 0.5).map((t) => Math.round(t * 100) / 100))).sort((a, b) => a - b);
  if (times.length >= 2) {
    const ks: Keyframe[] = times.map((f) => {
      const p = poseAtF(f);
      const e = easeAt(L, f, byInd);
      return { t: Math.max(0, ctx.sec(f)), x: p.cx - w / 2, y: p.cy - h / 2, rotation: p.rot, opacity: Math.max(0, Math.min(1, p.op)), scale: (p.sx + p.sy) / 2 / bs, ease: e.ease, ...(e.bez ? { bez: e.bez } : {}) };
    });
    // rotasi berurutan (hindari lompatan 359° → 0°)
    for (let i = 1; i < ks.length; i++) {
      while (ks[i].rotation - ks[i - 1].rotation > 180) ks[i].rotation -= 360;
      while (ks[i].rotation - ks[i - 1].rotation < -180) ks[i].rotation += 360;
    }
    out.keyframes = tidyKeys(ks);
    if (out.keyframes) ctx.out.counts.keys = (ctx.out.counts.keys || 0) + out.keyframes.length;
  }
  return out;
}

/* ----------------------------- shape layer ----------------------------- */

const KAPPA = 0.5522847498;

interface Geo {
  contours: AbsPoint[][];
  closed: boolean;
  fill: string | null;
  gradient: { to: string; angle: number } | null;
  stroke: { color: string; width: number; cap: 'round' | 'butt' | 'square' } | null;
  drawOn: number;
  name: string;
}

function xfContour(m: M, pts: AbsPoint[]): AbsPoint[] {
  return pts.map((p) => {
    const q = apply(m, p.x, p.y);
    const o: AbsPoint = { x: q.x, y: q.y };
    if (p.ix !== undefined || p.iy !== undefined) {
      const v = applyV(m, p.ix || 0, p.iy || 0);
      (o.ix = v.x), (o.iy = v.y);
    }
    if (p.ox !== undefined || p.oy !== undefined) {
      const v = applyV(m, p.ox || 0, p.oy || 0);
      (o.ox = v.x), (o.oy = v.y);
    }
    return o;
  });
}

function ellipse(cx: number, cy: number, rx: number, ry: number): AbsPoint[] {
  const kx = rx * KAPPA;
  const ky = ry * KAPPA;
  return [
    { x: cx, y: cy - ry, ix: -kx, iy: 0, ox: kx, oy: 0 },
    { x: cx + rx, y: cy, ix: 0, iy: -ky, ox: 0, oy: ky },
    { x: cx, y: cy + ry, ix: kx, iy: 0, ox: -kx, oy: 0 },
    { x: cx - rx, y: cy, ix: 0, iy: ky, ox: 0, oy: -ky },
  ];
}

function rect(cx: number, cy: number, w: number, h: number, r: number): AbsPoint[] {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r < 0.5) return [{ x: x0, y: y0 }, { x: x0 + w, y: y0 }, { x: x0 + w, y: y0 + h }, { x: x0, y: y0 + h }];
  const k = r * KAPPA;
  return [
    { x: x0 + r, y: y0, ix: -k, iy: 0 },
    { x: x0 + w - r, y: y0, ox: k, oy: 0 },
    { x: x0 + w, y: y0 + r, ix: 0, iy: -k },
    { x: x0 + w, y: y0 + h - r, ox: 0, oy: k },
    { x: x0 + w - r, y: y0 + h, ix: k, iy: 0 },
    { x: x0 + r, y: y0 + h, ox: -k, oy: 0 },
    { x: x0, y: y0 + h - r, ix: 0, iy: k },
    { x: x0, y: y0 + r, ox: 0, oy: -k },
  ];
}

function groupMatrix(tr: Any, f: number): { m: M; o: number } {
  if (!tr) return { m: I, o: 1 };
  return { m: localMatrix({ ks: tr }, f), o: first(valueAt(tr.o, f), 100) / 100 };
}

function shapeGeos(items: Any[], m: M, f: number, inherit: Omit<Geo, 'contours' | 'closed' | 'name'>, alpha: number, ctx: Ctx, name: string): Geo[] {
  const list = (items || []).filter((it: Any) => !it.hd);
  const tr = list.find((it: Any) => it.ty === 'tr');
  const g = groupMatrix(tr, f);
  const M2 = mul(m, g.m);
  const a2 = alpha * g.o;
  const fl = list.find((it: Any) => it.ty === 'fl' || it.ty === 'gf');
  const st = list.find((it: Any) => it.ty === 'st' || it.ty === 'gs');
  const tm = list.find((it: Any) => it.ty === 'tm');
  if (list.some((it: Any) => ['rp', 'mm', 'pb', 'tw', 'zz', 'op'].includes(it.ty))) ctx.out.notes.add('Sebagian efek shape AE (repeater, merge paths, pucker, offset) disederhanakan.');
  if (list.some((it: Any) => (it.ty === 'sh' && isKeyed(it.ks)) || (it.ty === 'rc' && (isKeyed(it.s) || isKeyed(it.p))) || (it.ty === 'el' && isKeyed(it.s)))) ctx.out.notes.add('Animasi bentuk (path morph / ukuran shape) diambil frame awalnya saja.');
  if (tr && [tr.p, tr.s, tr.r, tr.o].some(isKeyed)) ctx.out.notes.add('Animasi transform di dalam grup shape disederhanakan (memakai pose awal).');
  let style = { ...inherit };
  if (fl) {
    const op = first(valueAt(fl.o, f), 100) / 100;
    if (fl.ty === 'fl') style = { ...style, fill: rgbaFrom01(valueAt(fl.c, f), op * a2), gradient: null };
    else {
      const n = Number(fl.g?.p || 2);
      const stops = valueAt(fl.g?.k, f);
      const c0 = stops.slice(1, 4);
      const c1 = stops.slice((n - 1) * 4 + 1, (n - 1) * 4 + 4);
      const s0 = valueAt(fl.s, f);
      const e0 = valueAt(fl.e, f);
      style = { ...style, fill: rgbaFrom01(c0, op * a2), gradient: { to: rgbaFrom01(c1, op * a2), angle: Math.round((Math.atan2((e0[1] || 0) - (s0[1] || 0), (e0[0] || 1) - (s0[0] || 0)) * 180) / Math.PI) } };
    }
  }
  if (st) {
    const op = first(valueAt(st.o, f), 100) / 100;
    const scaleW = Math.sqrt(Math.abs(M2[0] * M2[3] - M2[1] * M2[2])) || 1;
    const color = st.ty === 'st' ? rgbaFrom01(valueAt(st.c, f), op * a2) : rgbaFrom01(valueAt(st.g?.k, f).slice(1, 4), op * a2);
    style = { ...style, stroke: { color, width: first(valueAt(st.w, f), 2) * scaleW, cap: st.lc === 1 ? 'butt' : st.lc === 3 ? 'square' : 'round' } };
  }
  if (tm && (isKeyed(tm.e) || isKeyed(tm.s))) {
    const ts = [...keyFrames(tm.e), ...keyFrames(tm.s)].map((k) => Number(k.t));
    const span = (Math.max(...ts) - Math.min(...ts)) / ctx.fr;
    style = { ...style, drawOn: Math.round(Math.min(10, Math.max(0.1, span)) * 10) / 10 };
    ctx.out.notes.add('Trim paths diterjemahkan jadi efek "gambar garis".');
  }
  const out: Geo[] = [];
  const contours: AbsPoint[][] = [];
  let closed = true;
  // urutan Lottie: item pertama = paling atas → proses dari bawah
  for (const it of [...list].reverse()) {
    if (it.ty === 'gr') out.push(...shapeGeos(it.it, M2, f, style, a2, ctx, it.nm || name));
    else if (it.ty === 'rc') {
      const p = valueAt(it.p, f);
      const s = valueAt(it.s, f);
      contours.push(xfContour(M2, rect(p[0] || 0, p[1] || 0, s[0] || 0, s[1] || 0, first(valueAt(it.r, f)))));
    } else if (it.ty === 'el') {
      const p = valueAt(it.p, f);
      const s = valueAt(it.s, f);
      contours.push(xfContour(M2, ellipse(p[0] || 0, p[1] || 0, (s[0] || 0) / 2, (s[1] || 0) / 2)));
    } else if (it.ty === 'sh') {
      const k = isKeyed(it.ks) ? it.ks.k[0].s?.[0] ?? it.ks.k[0].s : it.ks?.k;
      if (!k?.v?.length) continue;
      const pts: AbsPoint[] = k.v.map((v: number[], i: number) => {
        const q: AbsPoint = { x: v[0], y: v[1] };
        const ii = k.i?.[i];
        const oo = k.o?.[i];
        if (ii && (ii[0] || ii[1])) (q.ix = ii[0]), (q.iy = ii[1]);
        if (oo && (oo[0] || oo[1])) (q.ox = oo[0]), (q.oy = oo[1]);
        return q;
      });
      if (!k.c) closed = false;
      contours.push(xfContour(M2, pts));
    } else if (it.ty === 'sr') {
      const p = valueAt(it.p, f);
      const n = Math.max(3, Math.round(first(valueAt(it.pt, f), 5)));
      const or = first(valueAt(it.or, f), 50);
      const ir = it.sy === 1 ? first(valueAt(it.ir, f), 25) : or;
      const rot = (first(valueAt(it.r, f)) * Math.PI) / 180 - Math.PI / 2;
      const step = it.sy === 1 ? n * 2 : n;
      const pts: AbsPoint[] = Array.from({ length: step }, (_, i) => {
        const a = rot + (i / step) * Math.PI * 2;
        const r = it.sy === 1 && i % 2 ? ir : or;
        return { x: (p[0] || 0) + Math.cos(a) * r, y: (p[1] || 0) + Math.sin(a) * r };
      });
      contours.push(xfContour(M2, pts));
    }
  }
  if (contours.length && (style.fill || style.stroke)) out.unshift({ ...style, contours, closed, name });
  return out;
}

function geoToPath(g: Geo): PathLayer {
  const p = pathFromContours(g.contours, g.closed, { fill: g.closed ? g.fill : null, stroke: g.stroke, gradient: g.gradient, drawOn: g.drawOn, name: g.name });
  if (!g.closed && !g.stroke && g.fill) p.stroke = { color: g.fill, width: 4, cap: 'round' };
  return p;
}

/* ----------------------------- konversi layer ----------------------------- */

const FONT_GUESS: Array<[RegExp, FontId]> = [
  [/bebas/i, 'Bebas Neue'],
  [/anton|impact|condensed/i, 'Anton'],
  [/playfair|serif|times|garamond|georgia/i, 'Playfair Display'],
  [/montserrat/i, 'Montserrat'],
  [/poppins/i, 'Poppins'],
  [/grotesk|mono/i, 'Space Grotesk'],
];

/** Mask AE (mode Add, tidak terbalik) → path mask di ruang layer. Null bila tidak didukung. */
function maskPath(L: Any, f: number, ctx: Ctx): PathLayer | null {
  const ms: Any[] = (L.masksProperties || []).filter((m: Any) => m.mode !== 'n');
  if (!ms.length) return null;
  if (ms.some((m) => m.mode !== 'a' || m.inv)) {
    ctx.out.notes.add('Mask AE mode Subtract/Intersect/terbalik belum didukung; layer tampil tanpa mask.');
    return null;
  }
  if (ms.some((m) => isKeyed(m.pt))) ctx.out.notes.add('Mask AE yang beranimasi memakai bentuk awalnya.');
  const contours: AbsPoint[][] = [];
  for (const m of ms) {
    const k = isKeyed(m.pt) ? m.pt.k[0].s?.[0] ?? m.pt.k[0].s : m.pt?.k;
    if (!k?.v?.length) continue;
    contours.push(
      k.v.map((v: number[], i: number) => {
        const q: AbsPoint = { x: v[0], y: v[1] };
        const ii = k.i?.[i];
        const oo = k.o?.[i];
        if (ii && (ii[0] || ii[1])) (q.ix = ii[0]), (q.iy = ii[1]);
        if (oo && (oo[0] || oo[1])) (q.ox = oo[0]), (q.oy = oo[1]);
        return q;
      })
    );
  }
  if (!contours.length) return null;
  void f;
  const p = pathFromContours(contours, true, { fill: '#000000', stroke: null, name: 'Mask' });
  // beberapa mask Add = gabungan; aturan nonzero
  return { ...p, extra: p.extra?.length ? p.extra : undefined };
}

/** Bungkus isi (ruang layer) dengan grup mask. */
function wrap(children: Layer[], name: string, mask: boolean): { g: GroupLayer; box: { x: number; y: number; w: number; h: number } } {
  const x0 = Math.min(...children.map((c) => c.x));
  const y0 = Math.min(...children.map((c) => c.y));
  const x1 = Math.max(...children.map((c) => c.x + c.w));
  const y1 = Math.max(...children.map((c) => c.y + c.h));
  const shift = (c: Layer): Layer => ({ ...c, x: c.x - x0, y: c.y - y0, keyframes: c.keyframes?.map((k) => ({ ...k, x: k.x - x0, y: k.y - y0 })) });
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);
  return { g: { id: uid('ly'), kind: 'group', name, x: 0, y: 0, w, h, cw: w, ch: h, rotation: 0, opacity: 1, start: 0, end: null, mask, children: children.map(shift) }, box: { x: x0, y: y0, w, h } };
}

/** Satu layer Lottie → satu layer MotionKu (sudah diposisikan). */
function convertOne(L: Any, ctx: Ctx, byInd: Map<number, Any>): Layer | null {
  if (L.hd) return null;
  const ip = Number(L.ip ?? 0);
  const name = String(L.nm || 'Layer');
  if (L.ef && L.ef.length) ctx.out.notes.add('Efek AE (blur, glow, dll) tidak ikut diimpor.');
  // isi dalam ruang layer
  let content: Layer | null = null;
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let scaleFn: ((l: Layer, k: number) => Layer) | undefined;
  if (L.ty === 4) {
    const geos = shapeGeos(L.shapes || [], I, ip, { fill: null, gradient: null, stroke: null, drawOn: 0 }, 1, ctx, name);
    if (!geos.length) return null;
    const paths = geos.map(geoToPath);
    ctx.out.counts.vektor = (ctx.out.counts.vektor || 0) + paths.length;
    if (paths.length === 1) {
      content = { ...paths[0], name };
      box = { x: paths[0].x, y: paths[0].y, w: paths[0].w, h: paths[0].h };
      scaleFn = (l, k) => (l.kind === 'path' ? { ...l, stroke: l.stroke ? { ...l.stroke, width: l.stroke.width * k } : null } : l);
    } else {
      const wr = wrap(paths, name, false);
      content = wr.g;
      box = wr.box;
    }
  } else if (L.ty === 1) {
    const w = Number(L.sw || 100);
    const h = Number(L.sh || 100);
    const sh: ShapeLayer = { id: uid('ly'), kind: 'shape', name, x: 0, y: 0, w, h, rotation: 0, opacity: 1, start: 0, end: null, shape: 'rect', fill: L.sc || '#000000', stroke: null, radius: 0 };
    content = sh;
    box = { x: 0, y: 0, w, h };
    ctx.out.counts.bentuk = (ctx.out.counts.bentuk || 0) + 1;
  } else if (L.ty === 2) {
    const a = ctx.assets.get(L.refId);
    if (!a || !String(a.p || '').startsWith('data:')) {
      ctx.out.notes.add('Gambar yang tidak tertanam di file JSON dilewati (ekspor ulang dengan opsi "embed images").');
      return null;
    }
    const id = uid('img');
    ctx.out.images[id] = a.p;
    const w = Number(a.w || 100);
    const h = Number(a.h || 100);
    const im: ImageLayer = { id: uid('ly'), kind: 'image', name, x: 0, y: 0, w, h, rotation: 0, opacity: 1, start: 0, end: null, src: id, fit: 'cover', radius: 0 };
    content = im;
    box = { x: 0, y: 0, w, h };
    ctx.out.counts.gambar = (ctx.out.counts.gambar || 0) + 1;
  } else if (L.ty === 5) {
    const d = L.t?.d?.k?.[0]?.s || L.t?.d?.k?.s;
    if (!d?.t) return null;
    if (L.t?.a?.length) ctx.out.notes.add('Animator teks AE (per huruf) tidak ikut; teksnya tetap bisa diedit.');
    const text = String(d.t).replace(/\r/g, '\n');
    const size = Number(d.s || 48);
    const lines = text.split('\n');
    const w = Math.max(...lines.map((l) => l.length)) * size * 0.58 + size * 0.4;
    const h = lines.length * Number(d.lh || size * 1.2);
    const j = Number(d.j || 0);
    const bx = j === 2 ? -w / 2 : j === 1 ? -w : 0;
    const font = FONT_GUESS.find(([re]) => re.test(String(d.f || '')))?.[1] || 'Plus Jakarta Sans';
    const t: TextLayer = {
      id: uid('ly'),
      kind: 'text',
      name,
      x: bx,
      y: -size * 0.85,
      w,
      h,
      rotation: 0,
      opacity: 1,
      start: 0,
      end: null,
      text,
      font,
      size,
      weight: /black|heavy|extra ?bold/i.test(String(d.f)) ? 800 : /bold|semi/i.test(String(d.f)) ? 700 : 500,
      color: rgbaFrom01(d.fc),
      align: j === 2 ? 'center' : j === 1 ? 'right' : 'left',
      lineHeight: Math.max(0.8, Math.min(2, Number(d.lh || size * 1.2) / size)),
      letterSpacing: (Number(d.tr || 0) / 1000) * size,
      stroke: d.sc && d.sw ? { color: rgbaFrom01(d.sc), width: Number(d.sw) } : null,
      highlight: null,
    };
    content = t;
    box = { x: bx, y: -size * 0.85, w, h };
    scaleFn = (l, k) => (l.kind === 'text' ? { ...l, size: Math.max(8, l.size * k), letterSpacing: l.letterSpacing * k } : l);
    ctx.out.counts.teks = (ctx.out.counts.teks || 0) + 1;
  } else if (L.ty === 0) {
    const a = ctx.assets.get(L.refId);
    if (!a?.layers) return null;
    if (L.tm) ctx.out.notes.add('Time remap pada precomp diabaikan.');
    const st = Number(L.st || 0);
    const inner = convertLayers(a.layers, { ...ctx, local: true, sec: (f) => ctx.sec(f + st) });
    if (!inner.length) return null;
    const w = Number(L.w || a.w || 100);
    const h = Number(L.h || a.h || 100);
    const g: GroupLayer = { id: uid('ly'), kind: 'group', name, x: 0, y: 0, w, h, cw: w, ch: h, rotation: 0, opacity: 1, start: 0, end: null, children: inner };
    content = g;
    box = { x: 0, y: 0, w, h };
    ctx.out.counts.grup = (ctx.out.counts.grup || 0) + 1;
  } else {
    if (L.ty === 6) ctx.out.notes.add('Audio di dalam Lottie dilewati. Tambahkan musik dari menu Musik.');
    return null; // ty 3 (null) hanya induk
  }
  if (!content) return null;
  // mask AE → grup mask MotionKu (bentuk mask memotong isi layer)
  const mk = maskPath(L, ip, ctx);
  if (mk) {
    const wr = wrap([mk, { ...content, x: content.kind === 'path' || content.kind === 'text' ? content.x : box.x, y: content.kind === 'path' || content.kind === 'text' ? content.y : box.y }], `${name} (mask)`, true);
    content = wr.g;
    box = wr.box;
    scaleFn = undefined;
    ctx.out.counts.mask = (ctx.out.counts.mask || 0) + 1;
  }
  return place(L, { ...content, x: 0, y: 0 } as Layer, box, ctx, byInd, scaleFn);
}

function convertLayers(layers: Any[], ctx: Ctx): Layer[] {
  const byInd = new Map<number, Any>();
  layers.forEach((l) => l.ind !== undefined && byInd.set(l.ind, l));
  const out: Layer[] = [];
  // Lottie: layer pertama = paling atas. MotionKu: indeks 0 = paling bawah.
  for (let i = layers.length - 1; i >= 0; i--) {
    const L = layers[i];
    if (L.td) continue; // layer matte dipakai oleh layer di bawahnya
    try {
      const matte = L.tt && i > 0 && layers[i - 1]?.td ? layers[i - 1] : null;
      if (matte && (L.tt === 2 || L.tt === 4)) ctx.out.notes.add('Track matte terbalik (inverted) belum didukung; layer tampil tanpa matte.');
      const self = convertOne(L, ctx, byInd);
      if (!self) continue;
      if (matte && (L.tt === 1 || L.tt === 3)) {
        const m = convertOne({ ...matte, td: 0, hd: false }, ctx, byInd);
        if (m) {
          // track matte → grup mask: bentuk matte memotong layer (ikut animasinya)
          const wr = wrap([m, self], `${self.name} (matte)`, true);
          out.push({ ...wr.g, x: wr.box.x, y: wr.box.y, start: self.start, end: self.end });
          ctx.out.counts.mask = (ctx.out.counts.mask || 0) + 1;
          if (L.tt === 3) ctx.out.notes.add('Luma matte diperlakukan seperti alpha matte.');
          continue;
        }
      }
      out.push(self);
    } catch {
      ctx.out.notes.add(`Layer "${String(L.nm || 'Layer')}" gagal diterjemahkan dan dilewati.`);
    }
  }
  return out;
}

export function isLottie(j: Any): boolean {
  return !!j && typeof j === 'object' && Array.isArray(j.layers) && (j.fr !== undefined || j.v !== undefined) && j.w !== undefined;
}

export function importLottie(j: Any, file: string): ImportResult {
  if (!isLottie(j)) throw new ImportError('File ini bukan animasi Lottie / Bodymovin.');
  const fr = Number(j.fr || 30);
  const ip = Number(j.ip || 0);
  const op = Number(j.op || ip + fr * 3);
  const fit = fitFor(Number(j.w), Number(j.h));
  const dur = Math.min(60, Math.max(0.5, (op - ip) / fr));
  const assets = new Map<string, Any>();
  (j.assets || []).forEach((a: Any) => a?.id !== undefined && assets.set(String(a.id), a));
  const out = { notes: new Set<string>(), images: {} as Record<string, string>, counts: {} as Record<string, number> };
  if (JSON.stringify(j).includes('"x":"')) out.notes.add('Expression AE tidak dijalankan; nilai keyframe-nya yang dipakai.');
  if ((op - ip) / fr > 60) out.notes.add('Durasi dipotong jadi 60 detik.');
  const ctx: Ctx = { fr, sec: (f) => (f - ip) / fr, fit, local: false, assets, out, sceneDur: dur };
  const layers = convertLayers(j.layers, ctx);
  const doc = newImportDoc(fit, String(j.nm || file.replace(/\.json$/i, '')), 'after-effects', file);
  const scene: Scene = {
    id: uid('sc'),
    name: String(j.nm || 'Animasi AE'),
    role: 'info',
    duration: Math.round(dur * 100) / 100,
    background: { type: 'solid', color: '#FFFFFF' },
    layers,
    transition: { id: 'cut', duration: 0.01 },
  };
  const notes = [...out.notes];
  const c = out.counts;
  const parts = [c.mask && `${c.mask} mask/matte`, c.vektor && `${c.vektor} vektor`, c.teks && `${c.teks} teks`, c.gambar && `${c.gambar} gambar`, c.bentuk && `${c.bentuk} solid`, c.grup && `${c.grup} precomp → grup`, c.keys && `${c.keys} keyframe`].filter(Boolean);
  return {
    doc: { ...doc, scenes: [scene], assets: out.images, imported: { from: 'after-effects', file, notes } },
    summary: `After Effects (Lottie): ${parts.join(', ') || 'tidak ada layer yang bisa dibaca'} · ${dur.toFixed(1)} dtk · ${Math.round(Number(j.w))}×${Math.round(Number(j.h))}`,
    notes,
  };
}
