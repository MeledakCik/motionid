/** Bagian bersama importer (After Effects / Lottie, Alight Motion, CapCut). */
import type { Aspect, Keyframe, ProjectDoc } from '../types';
import { canvasSize } from '../types';
import { blankDoc } from '../vector';

export interface ImportResult {
  doc: ProjectDoc;
  /** ringkasan yang ditampilkan ke user */
  summary: string;
  notes: string[];
}

export class ImportError extends Error {}

/** Rasio MotionKu terdekat dengan ukuran sumber. */
export function nearestAspect(w: number, h: number): Aspect {
  const r = w / Math.max(1, h);
  const opts: Array<[Aspect, number]> = [
    ['9:16', 9 / 16],
    ['4:5', 4 / 5],
    ['1:1', 1],
    ['16:9', 16 / 9],
  ];
  return opts.reduce((best, o) => (Math.abs(Math.log(o[1] / r)) < Math.abs(Math.log(best[1] / r)) ? o : best))[0];
}

/** Pemetaan koordinat sumber → kanvas MotionKu (skala seragam, di tengah). */
export interface Fit {
  aspect: Aspect;
  W: number;
  H: number;
  s: number;
  ox: number;
  oy: number;
}
export function fitFor(w: number, h: number): Fit {
  const aspect = nearestAspect(w, h);
  const { w: W, h: H } = canvasSize(aspect);
  const s = Math.min(W / w, H / h);
  return { aspect, W, H, s, ox: (W - w * s) / 2, oy: (H - h * s) / 2 };
}

export function newImportDoc(fit: Fit, title: string, from: NonNullable<ProjectDoc['imported']>['from'], file: string): ProjectDoc {
  const d = blankDoc(fit.aspect);
  return { ...d, title: title.slice(0, 60) || 'Proyek impor', imported: { from, file, notes: [] }, scenes: [] };
}

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** [r,g,b(,a)] 0..1 → warna CSS. */
export function rgbaFrom01(c: number[] | undefined, alpha = 1): string {
  if (!c || c.length < 3) return '#000000';
  const a = (c.length > 3 ? c[3] : 1) * alpha;
  if (a >= 0.999) return `#${hex2(c[0] * 255)}${hex2(c[1] * 255)}${hex2(c[2] * 255)}`.toUpperCase();
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${+a.toFixed(3)})`;
}

/** "#AARRGGBB" (Alight Motion / Android) → warna CSS. */
export function argbHex(v: string | undefined, fallback = '#FFFFFF'): string {
  if (!v) return fallback;
  const m = /^#?([0-9a-f]{8})$/i.exec(v.trim());
  if (!m) return /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toUpperCase() : fallback;
  const n = m[1];
  const a = parseInt(n.slice(0, 2), 16) / 255;
  const r = parseInt(n.slice(2, 4), 16);
  const g = parseInt(n.slice(4, 6), 16);
  const b = parseInt(n.slice(6, 8), 16);
  return a >= 0.999 ? `#${n.slice(2).toUpperCase()}` : `rgba(${r},${g},${b},${+a.toFixed(3)})`;
}

/** Rapikan keyframe: urut, buang duplikat waktu, bulatkan. */
export function tidyKeys(ks: Keyframe[]): Keyframe[] | undefined {
  const out: Keyframe[] = [];
  [...ks]
    .sort((a, b) => a.t - b.t)
    .forEach((k) => {
      const r: Keyframe = { ...k, t: Math.round(k.t * 100) / 100, x: Math.round(k.x * 10) / 10, y: Math.round(k.y * 10) / 10, rotation: Math.round(k.rotation * 10) / 10, opacity: Math.round(k.opacity * 1000) / 1000, scale: Math.round(k.scale * 1000) / 1000 };
      const last = out[out.length - 1];
      if (last && Math.abs(last.t - r.t) < 0.01) out[out.length - 1] = r;
      else out.push(r);
    });
  if (out.length < 2) return undefined;
  // semua keyframe sama → tidak perlu animasi
  const same = out.every((k) => k.x === out[0].x && k.y === out[0].y && k.rotation === out[0].rotation && k.opacity === out[0].opacity && k.scale === out[0].scale);
  return same ? undefined : out;
}

/* ------------------------------------------------------------------ */
/* parser XML kecil (tanpa DOM, jalan di browser & Node)               */
/* ------------------------------------------------------------------ */

export interface XNode {
  tag: string;
  attrs: Record<string, string>;
  children: XNode[];
  text: string;
}

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e.toLowerCase()] ?? m;
  });

export function parseXml(src: string): XNode {
  const root: XNode = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack: XNode[] = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<\/\s*([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) {
      // tutup tag (toleran terhadap tag yang tidak cocok)
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === m[2]) {
          stack.length = i;
          break;
        }
      }
    } else if (m[3]) {
      const attrs: Record<string, string> = {};
      const ar = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a: RegExpExecArray | null;
      while ((a = ar.exec(m[4] || ''))) attrs[a[1]] = decode(a[2] ?? a[3] ?? '');
      const node: XNode = { tag: m[3], attrs, children: [], text: '' };
      top.children.push(node);
      if (!m[5]) stack.push(node);
    } else if (m[6] !== undefined) top.text += decode(m[6]);
  }
  return root;
}

export const kids = (n: XNode, tag?: string) => (tag ? n.children.filter((c) => c.tag === tag) : n.children);
export const kid = (n: XNode, tag: string) => n.children.find((c) => c.tag === tag);
