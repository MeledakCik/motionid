/**
 * Operasi boolean bentuk (gaya Illustrator Pathfinder / Figma):
 * gabung, kurangi, irisan, eksklusi. Bentuk diratakan jadi poligon,
 * diproses dengan polygon-clipping, lalu dikembalikan sebagai satu vektor.
 */
import polygonClipping, { type MultiPolygon, type Polygon, type Ring } from 'polygon-clipping';
import type { Layer, PathLayer, PathPoint, ShapeLayer } from './types';
import { uid } from './types';

export type BoolOp = 'union' | 'subtract' | 'intersect' | 'exclude';

export const BOOL_LABEL: Record<BoolOp, string> = {
  union: 'Gabung',
  subtract: 'Kurangi',
  intersect: 'Irisan',
  exclude: 'Eksklusi',
};

type Pt = [number, number];

function bezierPts(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** Ratakan kontur path (koordinat lokal layer). */
function flattenContour(pts: PathPoint[], w: number, h: number): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  if (!n) return out;
  out.push([pts[0].x * w, pts[0].y * h]);
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const A: Pt = [a.x * w, a.y * h];
    const B: Pt = [b.x * w, b.y * h];
    const curved = a.ox !== undefined || b.ix !== undefined;
    if (curved) out.push(...bezierPts(A, [A[0] + (a.ox || 0) * w, A[1] + (a.oy || 0) * h], [B[0] + (b.ix || 0) * w, B[1] + (b.iy || 0) * h], B, 16));
    else out.push(B);
  }
  return out;
}

function ellipsePts(cx: number, cy: number, rx: number, ry: number, n = 72): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });
}

function roundRectPts(w: number, h: number, r: number): Pt[] {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r < 0.5) return [[0, 0], [w, 0], [w, h], [0, h]];
  const out: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 8; k++) {
      const a = a0 + (k / 8) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(w - r, r, -Math.PI / 2);
  corner(w - r, h - r, 0);
  corner(r, h - r, Math.PI / 2);
  corner(r, r, Math.PI);
  return out;
}

/** Kontur lokal (0..w, 0..h) sebuah layer. Teks/foto/video memakai kotaknya. */
function localRings(l: Layer): Pt[][] {
  const { w, h } = l;
  if (l.kind === 'shape') {
    const s = l as ShapeLayer;
    switch (s.shape) {
      case 'circle':
      case 'blob':
        return [ellipsePts(w / 2, h / 2, w / 2, h / 2)];
      case 'triangle':
        return [[[w / 2, 0], [w, h], [0, h]]];
      case 'star':
        return [
          Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 ? 0.42 : 1;
            return [w / 2 + (Math.cos(a) * w * r) / 2, h / 2 + (Math.sin(a) * h * r) / 2] as Pt;
          }),
        ];
      case 'arrow':
        return [[[0, h * 0.35], [w * 0.6, h * 0.35], [w * 0.6, 0], [w, h / 2], [w * 0.6, h], [w * 0.6, h * 0.65], [0, h * 0.65]]];
      case 'line':
        return [[[0, h / 2 - 2], [w, h / 2 - 2], [w, h / 2 + 2], [0, h / 2 + 2]]];
      default:
        return [roundRectPts(w, h, s.radius)];
    }
  }
  if (l.kind === 'path') return [l.points, ...(l.extra || [])].map((c) => flattenContour(c, w, h)).filter((r) => r.length >= 3);
  return [[[0, 0], [w, 0], [w, h], [0, h]]];
}

/** Kontur dalam koordinat kanvas (rotasi diperhitungkan). */
export function worldRings(l: Layer): Pt[][] {
  const a = (l.rotation * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const cx = l.x + l.w / 2;
  const cy = l.y + l.h / 2;
  return localRings(l).map((ring) =>
    ring.map(([x, y]) => {
      const dx = x - l.w / 2;
      const dy = y - l.h / 2;
      return [cx + dx * c - dy * s, cy + dx * s + dy * c] as Pt;
    })
  );
}

function close(r: Pt[]): Ring {
  const f = r[0];
  const l = r[r.length - 1];
  return (f[0] === l[0] && f[1] === l[1] ? r : [...r, f]) as Ring;
}

/** Satu layer → MultiPolygon (kontur ganda digabung dengan aturan evenodd lewat xor). */
function layerGeom(l: Layer): MultiPolygon {
  const rings = worldRings(l).map(close);
  if (rings.length <= 1) return [[rings[0]] as Polygon];
  return polygonClipping.xor(...(rings.map((r) => [[r]] as MultiPolygon) as [MultiPolygon, ...MultiPolygon[]]));
}

/** Buang titik yang segaris supaya hasil ringan diedit. */
function prune(r: Pt[]): Pt[] {
  if (r.length < 4) return r;
  const out: Pt[] = [];
  for (let i = 0; i < r.length; i++) {
    const p = r[(i - 1 + r.length) % r.length];
    const q = r[i];
    const n = r[(i + 1) % r.length];
    const cross = (q[0] - p[0]) * (n[1] - q[1]) - (q[1] - p[1]) * (n[0] - q[0]);
    if (Math.abs(cross) > 0.05) out.push(q);
  }
  return out.length >= 3 ? out : r;
}

/**
 * Jalankan operasi boolean. Layer paling bawah = bentuk utama (untuk Kurangi: dikurangi semua layer di atasnya).
 * Mengembalikan null bila hasil kosong.
 */
export function booleanLayers(layers: Layer[], op: BoolOp): PathLayer | null {
  if (layers.length < 2) return null;
  const geoms = layers.map(layerGeom);
  const [first, ...rest] = geoms;
  let res: MultiPolygon;
  if (op === 'union') res = polygonClipping.union(first, ...rest);
  else if (op === 'subtract') res = polygonClipping.difference(first, ...rest);
  else if (op === 'intersect') res = polygonClipping.intersection(first, ...rest);
  else res = polygonClipping.xor(first, ...rest);
  const rings: Pt[][] = [];
  res.forEach((poly) => poly.forEach((ring) => rings.push(prune((ring as Pt[]).slice(0, -1)))));
  const usable = rings.filter((r) => r.length >= 3);
  if (!usable.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  usable.forEach((r) =>
    r.forEach(([x, y]) => {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    })
  );
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);
  const norm = (r: Pt[]): PathPoint[] => r.map(([x, y]) => ({ x: (x - x0) / w, y: (y - y0) / h }));
  const base = layers[0];
  const fill = base.kind === 'shape' ? base.fill : base.kind === 'path' ? base.fill || '#7B50FF' : '#7B50FF';
  const stroke = base.kind === 'shape' || base.kind === 'path' ? base.stroke : null;
  return {
    id: uid('ly'),
    kind: 'path',
    name: `${BOOL_LABEL[op]} bentuk`,
    x: x0,
    y: y0,
    w,
    h,
    rotation: 0,
    opacity: base.opacity,
    start: Math.min(...layers.map((l) => l.start)),
    end: null,
    points: norm(usable[0]),
    extra: usable.slice(1).map(norm),
    closed: true,
    fill,
    gradient: base.kind === 'path' ? base.gradient ?? null : null,
    stroke: stroke ? { ...stroke } : null,
    animIn: base.animIn,
    keyframes: undefined,
  };
}
