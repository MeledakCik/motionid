import { ICON_DATA, ICON_GROUPS } from './icons.data';

export interface IconPart {
  d: string;
  mode: 'stroke' | 'fill';
}

export interface IconDef {
  id: string;
  name: string;
  group: string;
  tags: string[];
  viewBox: [number, number, number, number];
  parts: IconPart[];
  author: 'builtin' | 'admin';
}

const REGISTRY: IconDef[] = ICON_DATA.map(([id, name, group, tags, d]) => ({
  id,
  name,
  group,
  tags: tags.split(' '),
  viewBox: [0, 0, 24, 24],
  parts: [{ d, mode: 'stroke' }],
  author: 'builtin',
}));
const BY_ID = new Map(REGISTRY.map((i) => [i.id, i]));

export const ICON_GROUP_LIST: Array<{ id: string; label: string }> = [
  ...ICON_GROUPS.map(([id, label]) => ({ id, label })),
  { id: 'custom', label: 'Custom Admin' },
];

export function allIcons(): IconDef[] {
  return REGISTRY;
}
export function getIcon(id: string): IconDef | undefined {
  return BY_ID.get(id);
}
export function registerIcon(def: IconDef) {
  const idx = REGISTRY.findIndex((i) => i.id === def.id);
  if (idx >= 0) REGISTRY[idx] = def;
  else REGISTRY.unshift(def);
  BY_ID.set(def.id, def);
  pathCache.delete(def.id);
}
export function unregisterIcon(id: string) {
  const idx = REGISTRY.findIndex((i) => i.id === id);
  if (idx >= 0) REGISTRY.splice(idx, 1);
  BY_ID.delete(id);
  pathCache.delete(id);
}

/** Cari ikon paling cocok untuk kata kunci (dipakai prompt engine). */
export function findIconFor(words: string[], fallback = 'sparkles'): string {
  let best = '';
  let bestScore = 0;
  const ws = words.map((w) => w.toLowerCase()).filter((w) => w.length > 2);
  for (const ic of REGISTRY) {
    let s = 0;
    for (const w of ws) {
      if (ic.id === w) s += 6;
      else if (ic.id.startsWith(w)) s += 3;
      if (ic.tags.includes(w)) s += 4;
    }
    if (s > bestScore) {
      bestScore = s;
      best = ic.id;
    }
  }
  return best || (BY_ID.has(fallback) ? fallback : REGISTRY[0].id);
}

/* ------------------------------------------------------------------ */
/* Menggambar di kanvas                                                */
/* ------------------------------------------------------------------ */
const pathCache = new Map<string, Path2D[]>();

function pathsOf(icon: IconDef): Path2D[] {
  let hit = pathCache.get(icon.id);
  if (!hit) {
    hit = icon.parts.map((p) => new Path2D(p.d));
    pathCache.set(icon.id, hit);
  }
  return hit;
}

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  iconId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  strokeWidth = 2
) {
  const icon = BY_ID.get(iconId) || BY_ID.get('sparkles') || REGISTRY[0];
  if (!icon) return;
  const [vx, vy, vw, vh] = icon.viewBox;
  const s = Math.min(w / vw, h / vh);
  ctx.save();
  ctx.translate(x + (w - vw * s) / 2, y + (h - vh * s) / 2);
  ctx.scale(s, s);
  ctx.translate(-vx, -vy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth * (vw / 24);
  const paths = pathsOf(icon);
  icon.parts.forEach((p, i) => {
    if (p.mode === 'fill') ctx.fill(paths[i]);
    else ctx.stroke(paths[i]);
  });
  ctx.restore();
}

/** Markup SVG untuk thumbnail di panel (lebih ringan dari kanvas). */
export function iconSvgMarkup(icon: IconDef, color = 'currentColor', strokeWidth = 2): string {
  const [vx, vy, vw, vh] = icon.viewBox;
  const body = icon.parts
    .map((p) =>
      p.mode === 'fill'
        ? `<path d="${p.d}" fill="${color}"/>`
        : `<path d="${p.d}" fill="none" stroke="${color}" stroke-width="${strokeWidth * (vw / 24)}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}">${body}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Parser SVG untuk admin (aman: hanya elemen bentuk, tanpa script)    */
/* ------------------------------------------------------------------ */
const n = (v: string | null) => Number(v) || 0;

function elementToD(el: Element): string {
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case 'path':
      return el.getAttribute('d') || '';
    case 'circle': {
      const cx = n(el.getAttribute('cx'));
      const cy = n(el.getAttribute('cy'));
      const r = n(el.getAttribute('r'));
      return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    }
    case 'ellipse': {
      const cx = n(el.getAttribute('cx'));
      const cy = n(el.getAttribute('cy'));
      const rx = n(el.getAttribute('rx'));
      const ry = n(el.getAttribute('ry'));
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
    }
    case 'rect': {
      const x = n(el.getAttribute('x'));
      const y = n(el.getAttribute('y'));
      const w = n(el.getAttribute('width'));
      const h = n(el.getAttribute('height'));
      const r = Math.min(n(el.getAttribute('rx') || el.getAttribute('ry')), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`;
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
    }
    case 'line':
      return `M${n(el.getAttribute('x1'))} ${n(el.getAttribute('y1'))}L${n(el.getAttribute('x2'))} ${n(el.getAttribute('y2'))}`;
    case 'polyline':
    case 'polygon': {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      let d = '';
      for (let i = 0; i + 1 < nums.length; i += 2) d += `${i ? 'L' : 'M'}${nums[i]} ${nums[i + 1]}`;
      return tag === 'polygon' ? d + 'z' : d;
    }
    default:
      return '';
  }
}

function inheritedAttr(el: Element, name: string): string | null {
  let cur: Element | null = el;
  while (cur) {
    const v = cur.getAttribute(name);
    if (v !== null) return v;
    const style = cur.getAttribute('style') || '';
    const m = new RegExp(`${name}\\s*:\\s*([^;]+)`).exec(style);
    if (m) return m[1].trim();
    cur = cur.parentElement;
  }
  return null;
}

export interface SvgParseResult {
  ok: boolean;
  error?: string;
  viewBox: [number, number, number, number];
  parts: IconPart[];
}

export function parseSvgMarkup(raw: string): SvgParseResult {
  const empty: SvgParseResult = { ok: false, viewBox: [0, 0, 24, 24], parts: [] };
  if (typeof DOMParser === 'undefined') return { ...empty, error: 'Parser SVG hanya tersedia di browser.' };
  const src = raw.trim();
  if (!src) return { ...empty, error: 'Kode SVG masih kosong.' };
  // path "d" polos tanpa tag <svg>
  if (!src.startsWith('<')) {
    try {
      new Path2D(src);
      return { ok: true, viewBox: [0, 0, 24, 24], parts: [{ d: src, mode: 'stroke' }] };
    } catch {
      return { ...empty, error: 'Isi bukan SVG maupun path "d" yang valid.' };
    }
  }
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return { ...empty, error: 'SVG tidak valid (cek tag penutup & tanda kutip).' };
  const svg = doc.querySelector('svg');
  if (!svg) return { ...empty, error: 'Tidak ditemukan tag <svg>.' };
  let vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) {
    const w = n(svg.getAttribute('width')) || 24;
    const h = n(svg.getAttribute('height')) || 24;
    vb = [0, 0, w, h];
  }
  const parts: IconPart[] = [];
  svg.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse').forEach((el) => {
    if (el.closest('defs,clipPath,mask,symbol')) return;
    const d = elementToD(el);
    if (!d) return;
    try {
      new Path2D(d);
    } catch {
      return;
    }
    const fill = (inheritedAttr(el, 'fill') || '').toLowerCase();
    const stroke = (inheritedAttr(el, 'stroke') || '').toLowerCase();
    const tag = el.tagName.toLowerCase();
    const isLine = tag === 'line' || tag === 'polyline';
    const fillNone = fill === 'none' || fill === 'transparent';
    const hasStroke = stroke !== '' && stroke !== 'none';
    const mode: IconPart['mode'] = isLine || (fillNone && hasStroke) || (fillNone && !hasStroke) ? 'stroke' : hasStroke && fill === '' ? 'stroke' : 'fill';
    parts.push({ d, mode });
  });
  if (!parts.length) return { ...empty, error: 'SVG tidak berisi bentuk (path/circle/rect/...).' };
  if (parts.length > 60) return { ...empty, error: 'Terlalu banyak bentuk (maks 60). Sederhanakan SVG.' };
  return { ok: true, viewBox: vb as [number, number, number, number], parts };
}
