/**
 * Alat desain bebas: vektor (gaya Illustrator), grup & komponen (gaya Figma),
 * keyframe (gaya After Effects / Alight Motion) dan potong scene (gaya CapCut).
 * Semua fungsi murni (tanpa React) supaya bisa dipakai renderer, editor, dan tes.
 */
import type { Aspect, ContentPlan, GroupLayer, Keyframe, Layer, PathLayer, PathPoint, ProjectDoc, Scene, ShapeLayer, SymbolDef, TextLayer } from './types';
import { canvasSize, uid } from './types';
import { ease } from './easing';

/* ------------------------------------------------------------------ */
/* keyframe                                                            */
/* ------------------------------------------------------------------ */

export interface Pose2 {
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scale: number;
}

export const KEY_EASES: Array<{ id: string; label: string }> = [
  { id: 'inOutCubic', label: 'Halus' },
  { id: 'linear', label: 'Rata' },
  { id: 'outCubic', label: 'Melambat' },
  { id: 'inCubic', label: 'Mempercepat' },
  { id: 'outBack', label: 'Membal' },
  { id: 'outElastic', label: 'Kenyal' },
  { id: 'outBounce', label: 'Pantul' },
  { id: 'snap', label: 'Loncat' },
];

const KEY_TOL = 0.04;

export function hasKeys(l: Layer): boolean {
  return !!l.keyframes && l.keyframes.length > 0;
}

/** Pose layer pada waktu t (detik sejak awal scene), memperhitungkan keyframe. */
export function poseAt(l: Layer, t: number): Pose2 {
  const ks = l.keyframes;
  if (!ks || !ks.length) return { x: l.x, y: l.y, rotation: l.rotation, opacity: l.opacity, scale: 1 };
  if (t <= ks[0].t) return pick(ks[0]);
  const last = ks[ks.length - 1];
  if (t >= last.t) return pick(last);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / Math.max(1e-4, b.t - a.t);
      const p = a.ease === 'snap' ? 0 : a.ease === 'custom' && a.bez ? cubicBezier(a.bez, u) : ease(a.ease, u);
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        rotation: a.rotation + (b.rotation - a.rotation) * p,
        opacity: Math.max(0, Math.min(1, a.opacity + (b.opacity - a.opacity) * p)),
        scale: Math.max(0.001, a.scale + (b.scale - a.scale) * p),
      };
    }
  }
  return pick(last);
}

/** cubic-bezier(x1, y1, x2, y2) seperti CSS / After Effects. */
export function cubicBezier(b: [number, number, number, number], x: number): number {
  const [x1, y1, x2, y2] = b;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const cy = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 24; i++) {
    const v = cx(t);
    if (Math.abs(v - x) < 1e-5) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return cy(t);
}

/** Kurva bezier perkiraan untuk easing bernama (untuk ditampilkan di graph editor). */
export const EASE_BEZ: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  inOutCubic: [0.65, 0, 0.35, 1],
  outCubic: [0.33, 1, 0.68, 1],
  inCubic: [0.32, 0, 0.67, 0],
  outBack: [0.34, 1.56, 0.64, 1],
  inOutSine: [0.37, 0, 0.63, 1],
  outQuad: [0.5, 1, 0.89, 1],
  outExpo: [0.16, 1, 0.3, 1],
};

function pick(k: Keyframe): Pose2 {
  return { x: k.x, y: k.y, rotation: k.rotation, opacity: k.opacity, scale: k.scale };
}

/** Layer dengan pose keyframe diterapkan (skala dikembalikan terpisah). */
export function posed<T extends Layer>(l: T, t: number): { layer: T; scale: number } {
  if (!hasKeys(l)) return { layer: l, scale: 1 };
  const p = poseAt(l, t);
  return { layer: { ...l, x: p.x, y: p.y, rotation: p.rotation, opacity: p.opacity }, scale: p.scale };
}

/** Tambah / perbarui keyframe pada waktu t dengan pose saat ini + perubahan. */
export function upsertKey(l: Layer, t: number, patch: Partial<Pose2> = {}, easeId?: string): Keyframe[] {
  const ks = [...(l.keyframes || [])];
  const cur = poseAt(l, t);
  const i = ks.findIndex((k) => Math.abs(k.t - t) < KEY_TOL);
  const tt = Math.max(0, Math.round(t * 100) / 100);
  if (i >= 0) ks[i] = { ...ks[i], ...patch };
  else ks.push({ t: tt, ...cur, ...patch, ease: easeId || 'inOutCubic' });
  return ks.sort((a, b) => a.t - b.t);
}

export const POSE_KEYS = ['x', 'y', 'rotation', 'opacity'] as const;

/** Pisahkan patch editor menjadi bagian keyframe dan bagian biasa. */
export function splitPosePatch(patch: Partial<Layer>): { pose: Partial<Pose2>; rest: Partial<Layer> } {
  const pose: Partial<Pose2> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if ((POSE_KEYS as readonly string[]).includes(k)) (pose as Record<string, unknown>)[k] = v;
    else rest[k] = v;
  }
  return { pose, rest: rest as Partial<Layer> };
}

/** Preset gerak cepat: membuat 2 keyframe dari pose sekarang. */
export function presetKeys(l: Layer, kind: 'masuk-kiri' | 'masuk-bawah' | 'zoom' | 'putar' | 'muncul', t0: number, dur: number, W: number): Keyframe[] {
  const end: Keyframe = { t: Math.round((t0 + dur) * 100) / 100, x: l.x, y: l.y, rotation: l.rotation, opacity: l.opacity, scale: 1, ease: 'outCubic' };
  const start: Keyframe = { ...end, t: Math.round(t0 * 100) / 100, ease: 'outCubic' };
  if (kind === 'masuk-kiri') start.x = -l.w - 40;
  if (kind === 'masuk-bawah') (start.y = l.y + W * 0.35), (start.opacity = 0);
  if (kind === 'zoom') (start.scale = 0.2), (start.opacity = 0), (start.ease = 'outBack');
  if (kind === 'putar') (start.rotation = l.rotation - 180), (start.scale = 0.4), (start.ease = 'outBack');
  if (kind === 'muncul') start.opacity = 0;
  const rest = (l.keyframes || []).filter((k) => k.t < start.t - KEY_TOL || k.t > end.t + KEY_TOL);
  return [...rest, start, end].sort((a, b) => a.t - b.t);
}

/* ------------------------------------------------------------------ */
/* vektor                                                              */
/* ------------------------------------------------------------------ */

export interface AbsPoint {
  x: number;
  y: number;
  ix?: number;
  iy?: number;
  ox?: number;
  oy?: number;
}

/** Bangun path pada ctx (koordinat lokal layer, 0..w / 0..h). */
export function tracePath(ctx: CanvasRenderingContext2D | Path2D, pts: PathPoint[], closed: boolean, w: number, h: number) {
  if (!pts.length) return;
  const P = (p: PathPoint) => [p.x * w, p.y * h] as const;
  const [sx, sy] = P(pts[0]);
  ctx.moveTo(sx, sy);
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const [ax, ay] = P(a);
    const [bx, by] = P(b);
    const hasA = a.ox !== undefined || a.oy !== undefined;
    const hasB = b.ix !== undefined || b.iy !== undefined;
    if (hasA || hasB) ctx.bezierCurveTo(ax + (a.ox || 0) * w, ay + (a.oy || 0) * h, bx + (b.ix || 0) * w, by + (b.iy || 0) * h, bx, by);
    else ctx.lineTo(bx, by);
  }
  if (closed) ctx.closePath();
}

/** Panjang path (perkiraan) untuk efek gambar garis. */
export function pathLength(pts: PathPoint[], closed: boolean, w: number, h: number): number {
  let len = 0;
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const p0 = [a.x * w, a.y * h];
    const p1 = [p0[0] + (a.ox || 0) * w, p0[1] + (a.oy || 0) * h];
    const p3 = [b.x * w, b.y * h];
    const p2 = [p3[0] + (b.ix || 0) * w, p3[1] + (b.iy || 0) * h];
    let px = p0[0];
    let py = p0[1];
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      len += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
  }
  return len;
}

/** Titik absolut (koordinat kanvas) → layer path ternormalisasi. */
export function pathFromAbs(abs: AbsPoint[], closed: boolean, style: Pick<PathLayer, 'fill' | 'stroke'> & Partial<PathLayer>): PathLayer {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const p of abs) {
    add(p.x, p.y);
    if (p.ix !== undefined) add(p.x + p.ix, p.y + (p.iy || 0));
    if (p.ox !== undefined) add(p.x + p.ox, p.y + (p.oy || 0));
  }
  let w = x1 - x0;
  let h = y1 - y0;
  // garis lurus datar/tegak: beri tinggi minimal supaya mudah dipilih
  if (w < 2) (x0 -= 1), (w = 2);
  if (h < 2) (y0 -= 1), (h = 2);
  const pts: PathPoint[] = abs.map((p) => {
    const o: PathPoint = { x: (p.x - x0) / w, y: (p.y - y0) / h };
    if (p.ix !== undefined || p.iy !== undefined) (o.ix = (p.ix || 0) / w), (o.iy = (p.iy || 0) / h);
    if (p.ox !== undefined || p.oy !== undefined) (o.ox = (p.ox || 0) / w), (o.oy = (p.oy || 0) / h);
    return o;
  });
  return {
    id: uid('ly'),
    kind: 'path',
    name: style.name || (closed ? 'Bentuk pena' : 'Garis'),
    x: Math.round(x0 * 10) / 10,
    y: Math.round(y0 * 10) / 10,
    w: Math.round(w * 10) / 10,
    h: Math.round(h * 10) / 10,
    rotation: 0,
    opacity: 1,
    start: 0,
    end: null,
    points: pts,
    closed,
    fill: style.fill,
    stroke: style.stroke,
    gradient: style.gradient ?? null,
    drawOn: style.drawOn ?? 0,
  };
}

/** Banyak kontur (koordinat kanvas) → satu layer path; kontur pertama utama, sisanya lubang/pulau. */
export function pathFromContours(contours: AbsPoint[][], closed: boolean, style: Pick<PathLayer, 'fill' | 'stroke'> & Partial<PathLayer>): PathLayer {
  const main = pathFromAbs(contours[0], closed, style);
  if (contours.length < 2 || !closed) return main;
  const all = pathFromAbs(contours.flat(), true, style);
  const norm = (c: AbsPoint[]): PathPoint[] =>
    c.map((p) => {
      const o: PathPoint = { x: (p.x - all.x) / all.w, y: (p.y - all.y) / all.h };
      if (p.ix !== undefined || p.iy !== undefined) (o.ix = (p.ix || 0) / all.w), (o.iy = (p.iy || 0) / all.h);
      if (p.ox !== undefined || p.oy !== undefined) (o.ox = (p.ox || 0) / all.w), (o.oy = (p.oy || 0) / all.h);
      return o;
    });
  return { ...main, x: all.x, y: all.y, w: all.w, h: all.h, points: norm(contours[0]), extra: contours.slice(1).map(norm) };
}

/** Titik path (ternormalisasi) → koordinat kanvas, memperhitungkan rotasi layer. */
export function pathToAbs(l: PathLayer): AbsPoint[] {
  const cx = l.x + l.w / 2;
  const cy = l.y + l.h / 2;
  const a = (l.rotation * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rot = (dx: number, dy: number) => [dx * c - dy * s, dx * s + dy * c] as const;
  return l.points.map((p) => {
    const [rx, ry] = rot(p.x * l.w - l.w / 2, p.y * l.h - l.h / 2);
    const o: AbsPoint = { x: cx + rx, y: cy + ry };
    if (p.ix !== undefined || p.iy !== undefined) {
      const [hx, hy] = rot((p.ix || 0) * l.w, (p.iy || 0) * l.h);
      (o.ix = hx), (o.iy = hy);
    }
    if (p.ox !== undefined || p.oy !== undefined) {
      const [hx, hy] = rot((p.ox || 0) * l.w, (p.oy || 0) * l.h);
      (o.ox = hx), (o.oy = hy);
    }
    return o;
  });
}

/** Ganti titik path dari koordinat kanvas; kotak layer dihitung ulang (rotasi dipertahankan). */
export function setPathAbs(l: PathLayer, abs: AbsPoint[]): PathLayer {
  if (l.extra?.length) {
    // kontur tambahan (hasil boolean) ikut dinormalisasi ulang ke kotak baru
    const absExtra = l.extra.map((c) => pathToAbs({ ...l, points: c }));
    const base = setPathAbs({ ...l, extra: undefined }, abs);
    const local = (q: AbsPoint): PathPoint => {
      const cx = base.x + base.w / 2;
      const cy = base.y + base.h / 2;
      const a = (-base.rotation * Math.PI) / 180;
      const dx = q.x - cx;
      const dy = q.y - cy;
      return { x: (dx * Math.cos(a) - dy * Math.sin(a) + base.w / 2) / base.w, y: (dx * Math.sin(a) + dy * Math.cos(a) + base.h / 2) / base.h };
    };
    return { ...base, extra: absExtra.map((c) => c.map(local)) };
  }
  if (!l.rotation) {
    const n = pathFromAbs(abs, l.closed, l);
    return { ...l, x: n.x, y: n.y, w: n.w, h: n.h, points: n.points };
  }
  // putar balik ke ruang lokal tanpa rotasi di sekitar pusat lama, normalisasi, lalu kembalikan pusat
  const cx = l.x + l.w / 2;
  const cy = l.y + l.h / 2;
  const a = (-l.rotation * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rot = (dx: number, dy: number) => [dx * c - dy * s, dx * s + dy * c] as const;
  const local = abs.map((p) => {
    const [x, y] = rot(p.x - cx, p.y - cy);
    const o: AbsPoint = { x: cx + x, y: cy + y };
    if (p.ix !== undefined || p.iy !== undefined) [o.ix, o.iy] = rot(p.ix || 0, p.iy || 0);
    if (p.ox !== undefined || p.oy !== undefined) [o.ox, o.oy] = rot(p.ox || 0, p.oy || 0);
    return o;
  });
  const n = pathFromAbs(local, l.closed, l);
  // pusat kotak baru (lokal) diputar kembali ke ruang kanvas
  const ncx = n.x + n.w / 2 - cx;
  const ncy = n.y + n.h / 2 - cy;
  const back = (dx: number, dy: number) => [dx * Math.cos(-a) - dy * Math.sin(-a), dx * Math.sin(-a) + dy * Math.cos(-a)] as const;
  const [gx, gy] = back(ncx, ncy);
  return { ...l, x: cx + gx - n.w / 2, y: cy + gy - n.h / 2, w: n.w, h: n.h, points: n.points };
}

/** Sederhanakan goresan pensil (Ramer–Douglas–Peucker). */
export function simplify(pts: Array<{ x: number; y: number }>, eps: number): Array<{ x: number; y: number }> {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let best = -1;
    let bestD = eps;
    const A = pts[a];
    const B = pts[b];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i].x - dx * pts[i].y + B.x * A.y - B.y * A.x) / L;
      if (d > bestD) (bestD = d), (best = i);
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Titik-titik → kurva halus (Catmull-Rom → Bezier). */
export function smoothPoints(pts: Array<{ x: number; y: number }>, closed: boolean, tension = 1): AbsPoint[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[i === 0 ? (closed ? n - 1 : 0) : i - 1];
    const next = pts[i === n - 1 ? (closed ? 0 : n - 1) : i + 1];
    const tx = ((next.x - prev.x) / 6) * tension;
    const ty = ((next.y - prev.y) / 6) * tension;
    if ((i === 0 || i === n - 1) && !closed) return { x: p.x, y: p.y, ...(i === 0 ? { ox: tx, oy: ty } : { ix: -tx, iy: -ty }) };
    return { x: p.x, y: p.y, ix: -tx, iy: -ty, ox: tx, oy: ty };
  });
}

/* ------------------------------------------------------------------ */
/* kotak, grup, komponen                                               */
/* ------------------------------------------------------------------ */

/** Kotak pembatas sejajar sumbu (memperhitungkan rotasi). */
export function bounds(l: Pick<Layer, 'x' | 'y' | 'w' | 'h' | 'rotation'>): { x: number; y: number; w: number; h: number } {
  if (!l.rotation) return { x: l.x, y: l.y, w: l.w, h: l.h };
  const a = (l.rotation * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  const w = l.w * c + l.h * s;
  const h = l.w * s + l.h * c;
  return { x: l.x + l.w / 2 - w / 2, y: l.y + l.h / 2 - h / 2, w, h };
}

export function unionBounds(ls: Array<Pick<Layer, 'x' | 'y' | 'w' | 'h' | 'rotation'>>): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const l of ls) {
    const b = bounds(l);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  if (!isFinite(x0)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}

function shiftLayer<T extends Layer>(l: T, dx: number, dy: number): T {
  return { ...l, x: l.x + dx, y: l.y + dy, keyframes: l.keyframes?.map((k) => ({ ...k, x: k.x + dx, y: k.y + dy })) };
}

/** Salin layer (dan anak grup) dengan id baru. */
export function cloneLayer<T extends Layer>(l: T): T {
  const c = { ...l, id: uid('ly') } as T;
  if (c.kind === 'group') (c as GroupLayer).children = (c as GroupLayer).children.map(cloneLayer);
  return c;
}

/** Gabungkan beberapa layer menjadi satu grup (urutan lapisan dipertahankan). */
export function makeGroup(layers: Layer[], name = 'Grup'): GroupLayer {
  const b = unionBounds(layers);
  return {
    id: uid('ly'),
    kind: 'group',
    name,
    x: Math.round(b.x),
    y: Math.round(b.y),
    w: Math.round(b.w),
    h: Math.round(b.h),
    cw: Math.round(b.w),
    ch: Math.round(b.h),
    rotation: 0,
    opacity: 1,
    start: 0,
    end: null,
    children: layers.map((l) => shiftLayer(l, -Math.round(b.x), -Math.round(b.y))),
  };
}

/** Skalakan isi layer (dipakai saat lepas grup & ganti rasio). */
export function scaleLayer(l: Layer, sx: number, sy: number): Layer {
  const k = Math.sqrt(Math.abs(sx * sy)) || 1;
  const base = { ...l, w: l.w * sx, h: l.h * sy };
  switch (base.kind) {
    case 'text':
      return { ...base, size: Math.max(8, (l as TextLayer).size * Math.min(sx, sy)) } as Layer;
    case 'shape': {
      const s = l as ShapeLayer;
      return { ...base, radius: s.radius * k, stroke: s.stroke ? { ...s.stroke, width: s.stroke.width * k } : null } as Layer;
    }
    case 'path': {
      const p = l as PathLayer;
      return { ...base, stroke: p.stroke ? { ...p.stroke, width: p.stroke.width * k } : null } as Layer;
    }
    default:
      return base as Layer;
  }
}

/** Ubah koordinat lokal grup → koordinat kanvas. */
function groupToWorld(g: GroupLayer) {
  const sx = g.w / Math.max(1, g.cw);
  const sy = g.h / Math.max(1, g.ch);
  const a = (g.rotation * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const gcx = g.x + g.w / 2;
  const gcy = g.y + g.h / 2;
  return {
    sx,
    sy,
    center(x: number, y: number) {
      const lx = x * sx - g.w / 2;
      const ly = y * sy - g.h / 2;
      return { x: gcx + lx * c - ly * s, y: gcy + lx * s + ly * c };
    },
  };
}

/** Lepas grup: anak kembali menjadi layer biasa di posisi yang sama. */
export function ungroup(g: GroupLayer): Layer[] {
  const T = groupToWorld(g);
  return g.children.map((child) => {
    const sc = scaleLayer(child, T.sx, T.sy);
    const ctr = T.center(child.x + child.w / 2, child.y + child.h / 2);
    const out: Layer = {
      ...sc,
      x: ctr.x - sc.w / 2,
      y: ctr.y - sc.h / 2,
      rotation: child.rotation + g.rotation,
      opacity: child.opacity * g.opacity,
      keyframes: child.keyframes?.map((k) => {
        const p = T.center(k.x + child.w / 2, k.y + child.h / 2);
        return { ...k, x: p.x - sc.w / 2, y: p.y - sc.h / 2, rotation: k.rotation + g.rotation, opacity: k.opacity * g.opacity };
      }),
    };
    return out;
  });
}

/** Komponen utama dari grup. */
export function symbolFromGroup(g: GroupLayer, name: string): SymbolDef {
  return { id: uid('sym'), name, w: g.cw, h: g.ch, children: g.children };
}

/** Instance baru dari komponen, diletakkan di tengah kanvas. */
export function instanceOf(sym: SymbolDef, W: number, H: number): GroupLayer {
  const s = Math.min(1, (W * 0.8) / sym.w, (H * 0.6) / sym.h);
  const w = Math.round(sym.w * s);
  const h = Math.round(sym.h * s);
  return {
    id: uid('ly'),
    kind: 'group',
    name: sym.name,
    x: Math.round((W - w) / 2),
    y: Math.round((H - h) / 2),
    w,
    h,
    cw: sym.w,
    ch: sym.h,
    rotation: 0,
    opacity: 1,
    start: 0,
    end: null,
    symbolId: sym.id,
    children: sym.children.map(cloneLayer),
  };
}

/** Terapkan isi komponen utama ke semua instance di semua scene (ukuran instance tetap proporsional). */
export function syncSymbol(doc: ProjectDoc, sym: SymbolDef, exceptId?: string): ProjectDoc {
  const fix = (l: Layer): Layer => {
    if (l.kind !== 'group') return l;
    if (l.symbolId === sym.id && l.id !== exceptId) {
      const sx = l.w / Math.max(1, l.cw);
      const sy = l.h / Math.max(1, l.ch);
      return { ...l, name: sym.name, cw: sym.w, ch: sym.h, w: Math.round(sym.w * sx), h: Math.round(sym.h * sy), children: sym.children.map(cloneLayer) };
    }
    return { ...l, children: l.children.map(fix) };
  };
  return { ...doc, symbols: { ...(doc.symbols || {}), [sym.id]: sym }, scenes: doc.scenes.map((s) => ({ ...s, layers: s.layers.map(fix) })) };
}

export function countInstances(doc: ProjectDoc, symbolId: string): number {
  let n = 0;
  const walk = (l: Layer) => {
    if (l.kind !== 'group') return;
    if (l.symbolId === symbolId) n++;
    l.children.forEach(walk);
  };
  doc.scenes.forEach((s) => s.layers.forEach(walk));
  return n;
}

/* ------------------------------------------------------------------ */
/* perataan (gaya Figma)                                               */
/* ------------------------------------------------------------------ */

export type AlignOp = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom' | 'hdist' | 'vdist';

/** Ratakan layer. Satu layer → relatif ke kanvas; banyak → relatif ke kotak gabungan. */
export function alignLayers(ls: Layer[], op: AlignOp, W: number, H: number): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const ref = ls.length > 1 ? unionBounds(ls) : { x: 0, y: 0, w: W, h: H };
  if (op === 'hdist' || op === 'vdist') {
    if (ls.length < 3) return out;
    const hor = op === 'hdist';
    const sorted = [...ls].sort((a, b) => (hor ? bounds(a).x - bounds(b).x : bounds(a).y - bounds(b).y));
    const total = sorted.reduce((a, l) => a + (hor ? bounds(l).w : bounds(l).h), 0);
    const gap = ((hor ? ref.w : ref.h) - total) / (sorted.length - 1);
    let cur = hor ? ref.x : ref.y;
    for (const l of sorted) {
      const b = bounds(l);
      if (hor) out.set(l.id, { x: Math.round(l.x + (cur - b.x)), y: l.y });
      else out.set(l.id, { x: l.x, y: Math.round(l.y + (cur - b.y)) });
      cur += (hor ? b.w : b.h) + gap;
    }
    return out;
  }
  for (const l of ls) {
    const b = bounds(l);
    let dx = 0;
    let dy = 0;
    if (op === 'left') dx = ref.x - b.x;
    if (op === 'hcenter') dx = ref.x + ref.w / 2 - (b.x + b.w / 2);
    if (op === 'right') dx = ref.x + ref.w - (b.x + b.w);
    if (op === 'top') dy = ref.y - b.y;
    if (op === 'vcenter') dy = ref.y + ref.h / 2 - (b.y + b.h / 2);
    if (op === 'bottom') dy = ref.y + ref.h - (b.y + b.h);
    out.set(l.id, { x: Math.round(l.x + dx), y: Math.round(l.y + dy) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* scene: potong (gaya CapCut) & kanvas kosong                         */
/* ------------------------------------------------------------------ */

/** Potong scene di waktu t menjadi dua scene yang menyambung mulus. */
export function splitScene(scene: Scene, t: number): [Scene, Scene] | null {
  if (t < 0.3 || t > scene.duration - 0.3) return null;
  const at = Math.round(t * 100) / 100;
  const first: Scene = {
    ...scene,
    duration: at,
    layers: scene.layers.filter((l) => l.start < at).map((l) => ({ ...l, end: l.end !== null && l.end <= at ? l.end : null, animOut: l.end !== null && l.end <= at ? l.animOut : null })),
  };
  const second: Scene = {
    ...scene,
    id: uid('sc'),
    name: `${scene.name.replace(/ \(\d+\)$/, '')} (2)`,
    duration: Math.round((scene.duration - at) * 100) / 100,
    transition: { id: 'cut', duration: 0.01 },
    layers: scene.layers
      .filter((l) => l.end === null || l.end > at)
      .map((l) => ({
        ...cloneLayer(l),
        start: Math.max(0, Math.round((l.start - at) * 100) / 100),
        end: l.end === null ? null : Math.round((l.end - at) * 100) / 100,
        // sudah tampil sebelum potongan → jangan animasi masuk lagi
        animIn: l.start < at ? null : l.animIn,
        // klip video lanjut dari titik potong di file sumber
        ...(l.kind === 'video' && l.start < at ? { trimIn: Math.min(l.trimOut - 0.05, l.trimIn + (at - l.start) * (l.speed || 1)) } : {}),
        keyframes: l.keyframes?.map((k) => ({ ...k, t: Math.round((k.t - at) * 100) / 100 })),
      })),
  };
  return [first, second];
}

export const BLANK_TEMPLATE = 'kosong';

/** Proyek kanvas kosong: desain sendiri tanpa template. */
export function blankDoc(aspect: Aspect = '9:16'): ProjectDoc {
  const plan: ContentPlan = {
    prompt: '',
    intent: 'pengumuman',
    category: 'promo',
    mood: 'hangat',
    cta: '',
    keywords: [],
    items: [{ role: 'info', title: 'Desain bebas' }],
    caption: '',
    hashtags: [],
  };
  return {
    version: 6,
    id: uid('proj'),
    title: 'Desain tanpa judul',
    aspect,
    templateId: BLANK_TEMPLATE,
    theme: {
      palette: { bg: '#FFFFFF', bg2: '#EDE8FF', primary: '#7B50FF', secondary: '#C6F432', text: '#1E1150', muted: '#6B6390', surface: '#FFFFFF' },
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Plus Jakarta Sans',
    },
    scenes: [
      {
        id: uid('sc'),
        name: 'Scene 1',
        role: 'info',
        duration: 4,
        background: { type: 'solid', color: '#FFFFFF' },
        layers: [],
        transition: { id: 'cut', duration: 0.01 },
      },
    ],
    assets: {},
    music: { id: 'none', volume: 0.7 },
    plan,
    showProgress: false,
    symbols: {},
  };
}

/** Pindahkan layer ke rasio baru secara proporsional (untuk desain bebas). */
export function refitLayers(layers: Layer[], from: Aspect, to: Aspect): Layer[] {
  const A = canvasSize(from);
  const B = canvasSize(to);
  const s = Math.min(B.w / A.w, B.h / A.h);
  const mapPt = (x: number, y: number, w: number, h: number) => ({ x: ((x + w / 2) / A.w) * B.w - (w * s) / 2, y: ((y + h / 2) / A.h) * B.h - (h * s) / 2 });
  return layers.map((l) => {
    const sc = scaleLayer(l, s, s);
    const p = mapPt(l.x, l.y, l.w, l.h);
    return {
      ...sc,
      x: Math.round(p.x),
      y: Math.round(p.y),
      keyframes: l.keyframes?.map((k) => {
        const q = mapPt(k.x, k.y, l.w, l.h);
        return { ...k, x: Math.round(q.x), y: Math.round(q.y) };
      }),
    };
  });
}

/** Layer buatan user (vektor / grup) yang harus dipertahankan saat template dibangun ulang. */
export function isCustomLayer(l: Layer): boolean {
  return l.kind === 'path' || l.kind === 'group';
}
