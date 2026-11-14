import { drawIcon } from './icons';
import { rgba, readableOn, shade } from '../color';
import { clamp, ease, hash01 } from '../easing';
import { drawFittedText, fitText, setSpacing } from '../text';

/**
 * Component Pack — 30 jenis komponen × 12 gaya = 360 komponen siap pakai,
 * ditambah komponen custom dari admin (DSL JSON berbasis layer).
 */

export interface CompColors {
  primary: string;
  secondary: string;
  text: string;
  surface: string;
}

export interface CompRenderCtx {
  heading: string;
  body: string;
  /** detik sejak layer muncul (untuk animasi internal: counter, ketik, progress) */
  t: number;
  allowBlur: boolean;
  /** resolver gambar (untuk komponen mockup HP) */
  image?: (src: string) => CanvasImageSource | null;
}

export interface CompField {
  key: string;
  label: string;
  multiline?: boolean;
  hint?: string;
}

export interface ComponentDef {
  id: string;
  name: string;
  kind: string;
  styleId: string;
  group: string;
  tags: string[];
  size: { w: number; h: number };
  defaults: Record<string, string>;
  fields: CompField[];
  author: 'builtin' | 'admin';
  custom?: CustomComponentSpec;
}

interface Tokens {
  bg: string | null;
  grad?: [string, string];
  fg: string;
  sub: string;
  accent: string;
  accentFg: string;
  border: string | null;
  borderW: number;
  radius: number;
  shadow: { x: number; y: number; blur: number; color: string } | null;
  glow: string | null;
  weight: number;
  upper: boolean;
  serif: boolean;
  tilt: number;
  sheen: boolean;
}

export const COMPONENT_STYLES: Array<{ id: string; label: string }> = [
  { id: 'kaca', label: 'Kaca' },
  { id: 'brutal', label: 'Brutal' },
  { id: 'neon', label: 'Neon' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'gelap', label: 'Gelap' },
  { id: 'gradien', label: 'Gradien' },
  { id: 'garis', label: 'Garis' },
  { id: 'retro', label: 'Retro' },
  { id: 'kertas', label: 'Kertas' },
  { id: 'soft', label: 'Soft' },
  { id: 'pop', label: 'Pop Kuning' },
  { id: 'elegan', label: 'Elegan Emas' },
];

function tokens(style: string, c: CompColors): Tokens {
  const base: Tokens = {
    bg: c.surface,
    fg: c.text,
    sub: rgba(c.text, 0.72),
    accent: c.primary,
    accentFg: readableOn(c.primary),
    border: null,
    borderW: 0,
    radius: 32,
    shadow: { x: 0, y: 18, blur: 40, color: 'rgba(0,0,0,0.35)' },
    glow: null,
    weight: 800,
    upper: false,
    serif: false,
    tilt: 0,
    sheen: false,
  };
  switch (style) {
    case 'kaca':
      return { ...base, bg: 'rgba(255,255,255,0.14)', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.75)', border: 'rgba(255,255,255,0.35)', borderW: 2, radius: 40, sheen: true };
    case 'brutal':
      return { ...base, bg: '#FFFFFF', fg: '#111111', sub: '#3A3A3A', border: '#111111', borderW: 7, radius: 18, shadow: { x: 16, y: 16, blur: 0, color: '#111111' }, weight: 900, upper: true, accentFg: readableOn(c.primary) };
    case 'neon':
      return { ...base, bg: 'rgba(6,6,12,0.72)', fg: '#FFFFFF', sub: rgba('#FFFFFF', 0.72), border: c.primary, borderW: 4, radius: 28, glow: c.primary, shadow: null };
    case 'minimal':
      return { ...base, bg: '#FFFFFF', fg: '#151515', sub: '#5C5C5C', radius: 24, shadow: { x: 0, y: 10, blur: 30, color: 'rgba(0,0,0,0.18)' }, weight: 700 };
    case 'gelap':
      return { ...base, bg: 'rgba(14,12,11,0.88)', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.7)', radius: 30 };
    case 'gradien':
      return { ...base, bg: null, grad: [c.primary, c.secondary], fg: readableOn(c.primary), sub: rgba(readableOn(c.primary), 0.8), accent: '#FFFFFF', accentFg: '#111111', radius: 44, sheen: true };
    case 'garis':
      return { ...base, bg: null, fg: c.text, border: c.text, borderW: 5, radius: 26, shadow: null, weight: 700 };
    case 'retro':
      return { ...base, bg: c.secondary, fg: readableOn(c.secondary), sub: rgba(readableOn(c.secondary), 0.8), border: '#1A1A1A', borderW: 5, radius: 40, shadow: { x: 12, y: 12, blur: 0, color: c.primary }, weight: 900 };
    case 'kertas':
      return { ...base, bg: '#FFF7EA', fg: '#2B2119', sub: '#6B5A4B', radius: 10, shadow: { x: 4, y: 14, blur: 26, color: 'rgba(40,20,0,0.3)' }, tilt: -1.6, accent: c.primary };
    case 'soft':
      return { ...base, bg: shade(c.surface, 0.06), radius: 64, shadow: { x: 0, y: 24, blur: 60, color: rgba(c.primary, 0.35) } };
    case 'pop':
      return { ...base, bg: '#FFE34D', fg: '#111111', sub: '#3B3200', border: '#111111', borderW: 5, radius: 999, shadow: { x: 0, y: 10, blur: 0, color: '#111111' }, accent: '#111111', accentFg: '#FFE34D', weight: 900, upper: true };
    case 'elegan':
      return { ...base, bg: 'rgba(10,8,6,0.55)', fg: '#F6EBD3', sub: 'rgba(246,235,211,0.75)', border: '#D9B86C', borderW: 2, radius: 6, shadow: null, accent: '#D9B86C', accentFg: '#1A1408', weight: 600, serif: true };
    default:
      return base;
  }
}

function pathRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, S: Tokens, R: CompRenderCtx, radius = S.radius) {
  ctx.save();
  pathRR(ctx, x, y, w, h, radius);
  if (S.shadow) {
    ctx.shadowColor = S.shadow.color;
    ctx.shadowBlur = S.shadow.blur;
    ctx.shadowOffsetX = S.shadow.x;
    ctx.shadowOffsetY = S.shadow.y;
  }
  if (S.glow && R.allowBlur) {
    ctx.shadowColor = S.glow;
    ctx.shadowBlur = 36;
  }
  if (S.grad) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, S.grad[0]);
    g.addColorStop(1, S.grad[1]);
    ctx.fillStyle = g;
    ctx.fill();
  } else if (S.bg) {
    ctx.fillStyle = S.bg;
    ctx.fill();
  } else if (S.shadow || S.glow) {
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    ctx.fill();
  }
  ctx.shadowColor = 'transparent';
  if (S.sheen) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (S.border && S.borderW) {
    ctx.lineWidth = S.borderW;
    ctx.strokeStyle = S.border;
    if (S.glow && R.allowBlur) {
      ctx.shadowColor = S.glow;
      ctx.shadowBlur = 18;
    }
    ctx.stroke();
  }
  ctx.restore();
}

function fam(S: Tokens, R: CompRenderCtx, heading = true) {
  if (S.serif) return R.heading.includes('Playfair') ? R.heading : `${R.heading}`;
  return heading ? R.heading : R.body;
}
function U(S: Tokens, s: string) {
  return S.upper ? s.toUpperCase() : s;
}
function items(v: string | undefined): string[] {
  return String(v || '')
    .split(/\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  pathRR(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

type KindRenderer = (ctx: CanvasRenderingContext2D, w: number, h: number, P: Record<string, string>, S: Tokens, R: CompRenderCtx, C: CompColors) => void;

interface KindDef {
  kind: string;
  label: string;
  group: string;
  tags: string[];
  size: { w: number; h: number };
  defaults: Record<string, string>;
  fields: CompField[];
  render: KindRenderer;
}

const F = (key: string, label: string, multiline = false, hint?: string): CompField => ({ key, label, multiline, hint });

const KINDS: KindDef[] = [
  {
    kind: 'card', label: 'Kartu Info', group: 'kartu', tags: ['kartu', 'info'], size: { w: 860, h: 320 },
    defaults: { title: 'Judul Menarik', subtitle: 'Penjelasan singkat di sini' }, fields: [F('title', 'Judul'), F('subtitle', 'Sub judul', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      ctx.fillStyle = S.accent;
      pathRR(ctx, 44, 44, 90, 12, 6);
      ctx.fill();
      drawFittedText(ctx, U(S, P.title), 44, 74, w - 88, h * 0.42, { family: fam(S, R), weight: S.weight, color: S.fg, size: 78, valign: 'top' });
      drawFittedText(ctx, P.subtitle, 44, 74 + h * 0.44, w - 88, h - 74 - h * 0.44 - 36, { family: R.body, weight: 500, color: S.sub, size: 40, valign: 'top' });
    },
  },
  {
    kind: 'price', label: 'Label Harga', group: 'jualan', tags: ['harga', 'promo', 'diskon'], size: { w: 760, h: 360 },
    defaults: { label: 'Harga Spesial', old: 'Rp 35.000', price: 'Rp 18.000' }, fields: [F('label', 'Label'), F('old', 'Harga coret'), F('price', 'Harga baru')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      drawFittedText(ctx, U(S, P.label), 48, 34, w - 96, 70, { family: R.body, weight: 700, color: S.sub, size: 40, upper: true });
      if (P.old) {
        ctx.font = `600 46px ${R.body}`;
        ctx.fillStyle = S.sub;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(P.old, 48, 136);
        const ow = ctx.measureText(P.old).width;
        ctx.strokeStyle = '#FF3B3B';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(40, 140);
        ctx.lineTo(56 + ow, 128);
        ctx.stroke();
      }
      const pop = 1 + 0.08 * Math.max(0, Math.sin(R.t * 5)) * clamp(1 - R.t / 2);
      ctx.save();
      ctx.translate(48, 250);
      ctx.scale(pop, pop);
      drawFittedText(ctx, P.price, 0, -70, w - 96, 140, { family: fam(S, R), weight: 900, color: S.accent === S.fg ? S.fg : S.accent, size: 130, valign: 'middle' });
      ctx.restore();
    },
  },
  {
    kind: 'discount', label: 'Badge Diskon', group: 'jualan', tags: ['diskon', 'sale', 'badge'], size: { w: 360, h: 360 },
    defaults: { value: '50%', label: 'OFF' }, fields: [F('value', 'Angka'), F('label', 'Teks')],
    render: (ctx, w, h, P, S, R, C) => {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2 - 10;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(R.t * 0.4);
      ctx.beginPath();
      const n = 16;
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const rr = i % 2 ? r * 0.84 : r;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      if (S.shadow) {
        ctx.shadowColor = S.shadow.color;
        ctx.shadowBlur = S.shadow.blur;
        ctx.shadowOffsetX = S.shadow.x;
        ctx.shadowOffsetY = S.shadow.y;
      }
      ctx.fillStyle = S.grad ? S.grad[0] : S.bg && S.bg !== C.surface ? S.bg : C.primary;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      if (S.border) {
        ctx.lineWidth = S.borderW || 4;
        ctx.strokeStyle = S.border;
        ctx.stroke();
      }
      ctx.restore();
      const fill = S.grad ? S.fg : S.bg && S.bg !== C.surface ? S.fg : readableOn(C.primary);
      drawFittedText(ctx, P.value, w * 0.15, h * 0.2, w * 0.7, h * 0.4, { family: fam(S, R), weight: 900, color: fill, size: 150, align: 'center' });
      drawFittedText(ctx, U(S, P.label), w * 0.2, h * 0.58, w * 0.6, h * 0.2, { family: R.body, weight: 800, color: fill, size: 60, align: 'center' });
    },
  },
  {
    kind: 'button', label: 'Tombol CTA', group: 'aksi', tags: ['tombol', 'cta', 'button'], size: { w: 640, h: 150 },
    defaults: { label: 'Pesan Sekarang' }, fields: [F('label', 'Teks tombol')],
    render: (ctx, w, h, P, S, R, C) => {
      const press = R.t > 0.9 && R.t < 1.15 ? 0.94 : 1;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(press, press);
      ctx.translate(-w / 2, -h / 2);
      const S2: Tokens = S.bg === C.surface ? { ...S, bg: C.primary, fg: readableOn(C.primary) } : S;
      panel(ctx, 0, 0, w, h, S2, R, Math.min(S2.radius, h / 2));
      drawFittedText(ctx, U(S2, P.label), 40, 0, w - 160, h, { family: fam(S2, R), weight: S2.weight, color: S2.fg, size: 60 });
      ctx.save();
      const ax = w - 80 + Math.sin(R.t * 6) * 6;
      ctx.strokeStyle = S2.fg;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - 30, h / 2);
      ctx.lineTo(ax + 14, h / 2);
      ctx.moveTo(ax - 6, h / 2 - 22);
      ctx.lineTo(ax + 16, h / 2);
      ctx.lineTo(ax - 6, h / 2 + 22);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    },
  },
  {
    kind: 'lowerthird', label: 'Lower Third', group: 'kartu', tags: ['nama', 'lower third', 'judul'], size: { w: 820, h: 190 },
    defaults: { title: 'Kopi Senja Kita', subtitle: 'Jl. Melati No. 12, Bandung' }, fields: [F('title', 'Nama'), F('subtitle', 'Keterangan')],
    render: (ctx, w, h, P, S, R) => {
      const grow = ease('outExpo', clamp(R.t / 0.6));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w * grow + 2, h);
      ctx.clip();
      panel(ctx, 24, 0, w - 24, h, S, R, Math.min(S.radius, 24));
      ctx.restore();
      ctx.fillStyle = S.accent;
      pathRR(ctx, 0, 0, 16, h, 8);
      ctx.fill();
      drawFittedText(ctx, U(S, P.title), 64, 18, w - 110, h * 0.5, { family: fam(S, R), weight: S.weight, color: S.fg, size: 66 });
      drawFittedText(ctx, P.subtitle, 64, h * 0.55, w - 110, h * 0.35, { family: R.body, weight: 500, color: S.sub, size: 38 });
    },
  },
  {
    kind: 'checklist', label: 'Checklist', group: 'daftar', tags: ['checklist', 'daftar', 'tips'], size: { w: 820, h: 420 },
    defaults: { items: 'Gratis ongkir|Bisa COD|Garansi 7 hari' }, fields: [F('items', 'Item (pisah dengan |)', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const list = items(P.items).slice(0, 6);
      const rowH = (h - 60) / Math.max(1, list.length);
      list.forEach((it, i) => {
        const appear = clamp((R.t - 0.15 - i * 0.28) / 0.3);
        const y = 30 + i * rowH;
        ctx.save();
        ctx.globalAlpha *= appear;
        ctx.translate((1 - appear) * 40, 0);
        const bs = Math.min(64, rowH * 0.6);
        pathRR(ctx, 40, y + (rowH - bs) / 2, bs, bs, bs * 0.3);
        ctx.fillStyle = S.accent;
        ctx.fill();
        ctx.strokeStyle = S.accentFg;
        ctx.lineWidth = bs * 0.13;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const ck = ease('outCubic', clamp((R.t - 0.3 - i * 0.28) / 0.25));
        const bx = 40;
        const by = y + (rowH - bs) / 2;
        ctx.moveTo(bx + bs * 0.25, by + bs * 0.52);
        const mx = bx + bs * 0.43;
        const my = by + bs * 0.7;
        if (ck < 0.5) ctx.lineTo(bx + bs * 0.25 + (mx - bx - bs * 0.25) * ck * 2, by + bs * 0.52 + (my - by - bs * 0.52) * ck * 2);
        else {
          ctx.lineTo(mx, my);
          ctx.lineTo(mx + (bs * 0.32) * (ck - 0.5) * 2, my - bs * 0.42 * (ck - 0.5) * 2);
        }
        ctx.stroke();
        drawFittedText(ctx, it, 40 + bs + 30, y, w - bs - 120, rowH, { family: R.body, weight: 700, color: S.fg, size: Math.min(52, rowH * 0.5) });
        ctx.restore();
      });
    },
  },
  {
    kind: 'step', label: 'Langkah Bernomor', group: 'daftar', tags: ['langkah', 'step', 'nomor', 'tutorial'], size: { w: 860, h: 260 },
    defaults: { number: '1', title: 'Langkah pertama', subtitle: 'Jelaskan singkat' }, fields: [F('number', 'Nomor'), F('title', 'Judul'), F('subtitle', 'Keterangan', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const d = h - 60;
      ctx.save();
      ctx.beginPath();
      ctx.arc(30 + d / 2, h / 2, d / 2, 0, Math.PI * 2);
      ctx.fillStyle = S.accent;
      ctx.fill();
      ctx.restore();
      drawFittedText(ctx, P.number, 30, 30, d, d, { family: fam(S, R), weight: 900, color: S.accentFg, size: d * 0.62, align: 'center' });
      drawFittedText(ctx, U(S, P.title), 60 + d, 30, w - d - 100, h * 0.48, { family: fam(S, R), weight: S.weight, color: S.fg, size: 62, valign: 'bottom' });
      drawFittedText(ctx, P.subtitle, 60 + d, h * 0.55, w - d - 100, h * 0.35, { family: R.body, weight: 500, color: S.sub, size: 38, valign: 'top' });
    },
  },
  {
    kind: 'progress', label: 'Progress Bar', group: 'data', tags: ['progress', 'persen', 'loading'], size: { w: 820, h: 170 },
    defaults: { label: 'Stok tersisa', value: '78' }, fields: [F('label', 'Label'), F('value', 'Persen (0-100)')],
    render: (ctx, w, h, P, S, R, C) => {
      panel(ctx, 0, 0, w, h, S, R, Math.min(S.radius, 30));
      const v = clamp((Number(P.value) || 0) / 100) * ease('outCubic', clamp(R.t / 1.4));
      drawFittedText(ctx, U(S, P.label), 40, 18, w * 0.6, 60, { family: R.body, weight: 700, color: S.fg, size: 40 });
      drawFittedText(ctx, `${Math.round(v * 100)}%`, w * 0.6, 18, w * 0.4 - 40, 60, { family: fam(S, R), weight: 900, color: S.accent, size: 44, align: 'right' });
      pill(ctx, 40, h - 70, w - 80, 34, rgba(S.fg, 0.15));
      pill(ctx, 40, h - 70, Math.max(34, (w - 80) * v), 34, S.accent === S.fg ? C.primary : S.accent);
    },
  },
  {
    kind: 'counter', label: 'Angka Naik', group: 'data', tags: ['angka', 'counter', 'statistik'], size: { w: 700, h: 300 },
    defaults: { prefix: '', value: '10000', suffix: '+', label: 'Pelanggan puas' }, fields: [F('prefix', 'Awalan'), F('value', 'Angka'), F('suffix', 'Akhiran'), F('label', 'Label')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const target = Number(String(P.value).replace(/[^\d.]/g, '')) || 0;
      const cur = Math.round(target * ease('outExpo', clamp(R.t / 1.6)));
      const txt = `${P.prefix || ''}${cur.toLocaleString('id-ID')}${P.suffix || ''}`;
      drawFittedText(ctx, txt, 36, 20, w - 72, h * 0.6, { family: fam(S, R), weight: 900, color: S.accent === S.fg ? S.fg : S.accent, size: 150, align: 'center' });
      drawFittedText(ctx, U(S, P.label), 36, h * 0.64, w - 72, h * 0.28, { family: R.body, weight: 600, color: S.sub, size: 44, align: 'center' });
    },
  },
  {
    kind: 'quote', label: 'Kotak Kutipan', group: 'kartu', tags: ['quote', 'kutipan', 'kata'], size: { w: 880, h: 520 },
    defaults: { text: 'Pelan-pelan saja, yang penting tidak berhenti.', author: '— MotionKu' }, fields: [F('text', 'Kutipan', true), F('author', 'Penulis')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      ctx.fillStyle = rgba(S.accent, 0.9);
      ctx.font = `900 220px ${R.heading}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('“', 36, -10);
      drawFittedText(ctx, P.text, 60, 120, w - 120, h - 220, { family: fam(S, R), weight: S.serif ? 600 : 700, color: S.fg, size: 64, lh: 1.25 });
      drawFittedText(ctx, P.author, 60, h - 90, w - 120, 56, { family: R.body, weight: 600, color: S.sub, size: 36, align: 'right' });
    },
  },
  {
    kind: 'chat', label: 'Bubble Chat', group: 'sosial', tags: ['chat', 'pesan', 'wa'], size: { w: 760, h: 220 },
    defaults: { name: 'Pelanggan', text: 'Kak, masih ada promonya?' }, fields: [F('name', 'Nama'), F('text', 'Pesan', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h - 30, S, R, Math.min(S.radius, 50));
      ctx.beginPath();
      ctx.moveTo(60, h - 32);
      ctx.lineTo(40, h);
      ctx.lineTo(110, h - 32);
      ctx.closePath();
      ctx.fillStyle = S.grad ? S.grad[0] : S.bg || 'transparent';
      ctx.fill();
      drawFittedText(ctx, P.name, 40, 18, w - 80, 50, { family: R.body, weight: 800, color: S.accent === S.fg ? S.sub : S.accent, size: 34 });
      const typing = R.t < 0.7;
      if (typing) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(60 + i * 40, 120 + Math.sin(R.t * 12 + i) * 8, 12, 0, Math.PI * 2);
          ctx.fillStyle = S.sub;
          ctx.fill();
        }
      } else drawFittedText(ctx, P.text, 40, 66, w - 80, h - 120, { family: R.body, weight: 600, color: S.fg, size: 46 });
    },
  },
  {
    kind: 'notif', label: 'Notifikasi', group: 'sosial', tags: ['notifikasi', 'pesanan', 'toast'], size: { w: 900, h: 220 },
    defaults: { app: 'shopping-bag', title: 'Pesanan baru masuk!', text: '12 orang beli dalam 1 jam terakhir' }, fields: [F('title', 'Judul'), F('text', 'Isi'), F('app', 'Ikon (id)')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R, Math.min(S.radius, 44));
      const s = h - 70;
      pathRR(ctx, 35, 35, s, s, s * 0.28);
      ctx.fillStyle = S.accent;
      ctx.fill();
      drawIcon(ctx, P.app || 'bell', 35 + s * 0.2, 35 + s * 0.2, s * 0.6, s * 0.6, S.accentFg, 2.2);
      drawFittedText(ctx, U(S, P.title), 65 + s, 34, w - s - 110, h * 0.38, { family: fam(S, R), weight: S.weight, color: S.fg, size: 48 });
      drawFittedText(ctx, P.text, 65 + s, h * 0.5, w - s - 110, h * 0.36, { family: R.body, weight: 500, color: S.sub, size: 36 });
      ctx.font = `600 28px ${R.body}`;
      ctx.fillStyle = S.sub;
      ctx.textAlign = 'right';
      ctx.fillText('sekarang', w - 36, 52);
      ctx.textAlign = 'left';
    },
  },
  {
    kind: 'search', label: 'Kolom Pencarian', group: 'ui', tags: ['search', 'cari', 'google'], size: { w: 860, h: 140 },
    defaults: { text: 'cara jualan laris di tiktok' }, fields: [F('text', 'Teks diketik')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R, h / 2);
      drawIcon(ctx, 'search', 40, h / 2 - 32, 64, 64, S.sub, 2.4);
      const n = Math.floor(P.text.length * clamp(R.t / 1.4));
      const shown = P.text.slice(0, n);
      ctx.font = `600 46px ${R.body}`;
      ctx.fillStyle = S.fg;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      setSpacing(ctx, 0);
      ctx.fillText(shown, 130, h / 2);
      if (Math.floor(R.t * 2.4) % 2 === 0) {
        const cw = ctx.measureText(shown).width;
        ctx.fillStyle = S.accent;
        ctx.fillRect(134 + cw, h / 2 - 28, 5, 56);
      }
    },
  },
  {
    kind: 'rating', label: 'Rating Bintang', group: 'data', tags: ['rating', 'bintang', 'review', 'testimoni'], size: { w: 700, h: 220 },
    defaults: { value: '4.9', label: '2.300+ ulasan' }, fields: [F('value', 'Nilai'), F('label', 'Label')],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const v = Number(P.value) || 5;
      const sz = Math.min(80, (w - 300) / 5);
      for (let i = 0; i < 5; i++) {
        const appear = ease('outBack', clamp((R.t - i * 0.12) / 0.35));
        ctx.save();
        ctx.translate(40 + i * (sz + 10) + sz / 2, h * 0.38);
        ctx.scale(appear, appear);
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
          const rr = k % 2 ? sz * 0.22 : sz * 0.5;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = i < Math.round(v) ? '#FFC531' : rgba(S.fg, 0.2);
        ctx.fill();
        ctx.restore();
      }
      drawFittedText(ctx, P.value, w - 230, 20, 190, h * 0.6, { family: fam(S, R), weight: 900, color: S.fg, size: 110, align: 'right' });
      drawFittedText(ctx, P.label, 40, h * 0.66, w - 80, h * 0.26, { family: R.body, weight: 600, color: S.sub, size: 38 });
    },
  },
  {
    kind: 'countdown', label: 'Hitung Mundur', group: 'jualan', tags: ['countdown', 'timer', 'flash sale'], size: { w: 860, h: 260 },
    defaults: { value: '02:15:30', label: 'Promo berakhir dalam' }, fields: [F('label', 'Label'), F('value', 'Waktu (jj:mm:dd)')],
    render: (ctx, w, h, P, S, R) => {
      const parts = String(P.value || '00:10:00').split(':').map((x) => Number(x) || 0);
      while (parts.length < 3) parts.unshift(0);
      let total = parts[0] * 3600 + parts[1] * 60 + parts[2] - Math.floor(R.t);
      total = Math.max(0, total);
      const vals = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map((n) => String(n).padStart(2, '0'));
      drawFittedText(ctx, U(S, P.label), 0, 0, w, h * 0.26, { family: R.body, weight: 700, color: S.fg === '#111111' && !S.bg ? S.fg : S.fg, size: 40, align: 'center' });
      const bw = (w - 120) / 3;
      vals.forEach((v, i) => {
        const x = i * (bw + 60);
        panel(ctx, x, h * 0.32, bw, h * 0.68, S, R, Math.min(S.radius, 30));
        drawFittedText(ctx, v, x, h * 0.32, bw, h * 0.68, { family: fam(S, R), weight: 900, color: S.fg, size: 120, align: 'center' });
        if (i < 2) drawFittedText(ctx, ':', x + bw, h * 0.32, 60, h * 0.68, { family: fam(S, R), weight: 900, color: S.accent, size: 100, align: 'center' });
      });
    },
  },
  {
    kind: 'chips', label: 'Deretan Tag', group: 'ui', tags: ['tag', 'chip', 'kategori'], size: { w: 900, h: 120 },
    defaults: { items: 'Halal|Fresh|Murah' }, fields: [F('items', 'Tag (pisah |)', true)],
    render: (ctx, w, h, P, S, R) => {
      const list = items(P.items).slice(0, 5);
      ctx.font = `800 44px ${R.body}`;
      const widths = list.map((s) => ctx.measureText(U(S, s)).width + 80);
      const total = widths.reduce((a, b) => a + b, 0) + (list.length - 1) * 20;
      const sc = Math.min(1, w / total);
      let x = (w - total * sc) / 2;
      list.forEach((s, i) => {
        const ap = ease('outBack', clamp((R.t - i * 0.12) / 0.35));
        const cw = widths[i] * sc;
        ctx.save();
        ctx.translate(x + cw / 2, h / 2);
        ctx.scale(ap, ap);
        panel(ctx, -cw / 2, -h / 2 + 6, cw, h - 12, i % 2 ? { ...S, bg: S.accent, grad: undefined, fg: S.accentFg } : S, R, (h - 12) / 2);
        ctx.font = `800 ${44 * sc}px ${R.body}`;
        ctx.fillStyle = i % 2 ? S.accentFg : S.fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(U(S, s), 0, 2);
        ctx.restore();
        x += cw + 20 * sc;
      });
    },
  },
  {
    kind: 'sticker', label: 'Stiker Label', group: 'dekor', tags: ['stiker', 'label', 'tape'], size: { w: 520, h: 160 },
    defaults: { text: 'BEST SELLER' }, fields: [F('text', 'Teks')],
    render: (ctx, w, h, P, S, R, C) => {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.06 + Math.sin(R.t * 2) * 0.015);
      const S2 = S.bg === C.surface ? { ...S, bg: C.secondary, fg: readableOn(C.secondary) } : S;
      panel(ctx, -w / 2, -h / 2, w, h, S2, R, Math.min(S2.radius, 20));
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-w / 2 + 30, -h / 2 - 14, 90, 34);
      drawFittedText(ctx, P.text.toUpperCase(), -w / 2 + 30, -h / 2, w - 60, h, { family: fam(S2, R), weight: 900, color: S2.fg, size: 80, align: 'center' });
      ctx.restore();
    },
  },
  {
    kind: 'follow', label: 'Ikuti Akun', group: 'sosial', tags: ['follow', 'akun', 'instagram', 'tiktok'], size: { w: 820, h: 200 },
    defaults: { name: 'Kopi Senja Kita', handle: '@kopisenja' }, fields: [F('name', 'Nama'), F('handle', '@akun')],
    render: (ctx, w, h, P, S, R, C) => {
      panel(ctx, 0, 0, w, h, S, R, Math.min(S.radius, h / 2));
      const d = h - 50;
      ctx.beginPath();
      ctx.arc(25 + d / 2, h / 2, d / 2, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(25, 25, 25 + d, 25 + d);
      g.addColorStop(0, C.primary);
      g.addColorStop(1, C.secondary);
      ctx.fillStyle = g;
      ctx.fill();
      drawFittedText(ctx, (P.name || 'M').trim()[0]?.toUpperCase() || 'M', 25, 25, d, d, { family: R.heading, weight: 900, color: '#FFFFFF', size: d * 0.5, align: 'center' });
      drawFittedText(ctx, P.name, 50 + d, 30, w - d - 330, h * 0.4, { family: fam(S, R), weight: S.weight, color: S.fg, size: 46 });
      drawFittedText(ctx, P.handle, 50 + d, h * 0.52, w - d - 330, h * 0.3, { family: R.body, weight: 500, color: S.sub, size: 34 });
      const followed = R.t > 1.1;
      const bw = 230;
      pill(ctx, w - bw - 30, h / 2 - 40, bw, 80, followed ? rgba(S.fg, 0.18) : C.primary);
      drawFittedText(ctx, followed ? 'Diikuti ✓' : 'Ikuti', w - bw - 30, h / 2 - 40, bw, 80, { family: R.body, weight: 800, color: followed ? S.fg : readableOn(C.primary), size: 38, align: 'center' });
    },
  },
  {
    kind: 'comment', label: 'Balas Komentar', group: 'sosial', tags: ['komentar', 'balas', 'tiktok'], size: { w: 860, h: 220 },
    defaults: { name: 'Membalas komentar @rina', text: 'Kak, cara bikinnya gimana sih?' }, fields: [F('name', 'Judul'), F('text', 'Komentar', true)],
    render: (ctx, w, h, P, S, R) => {
      const S2 = S.bg ? S : { ...S, bg: '#FFFFFF', fg: '#111111', sub: '#555555' };
      panel(ctx, 0, 0, w, h, S2, R, Math.min(S2.radius, 30));
      drawFittedText(ctx, P.name, 36, 20, w - 72, 56, { family: R.body, weight: 600, color: S2.sub, size: 32 });
      drawFittedText(ctx, P.text, 36, 76, w - 72, h - 100, { family: R.body, weight: 800, color: S2.fg, size: 50 });
    },
  },
  {
    kind: 'poll', label: 'Polling', group: 'data', tags: ['poll', 'vote', 'pilihan', 'quiz'], size: { w: 860, h: 420 },
    defaults: { question: 'Tim kopi atau teh?', a: 'Kopi', b: 'Teh', pa: '64' }, fields: [F('question', 'Pertanyaan'), F('a', 'Opsi A'), F('b', 'Opsi B'), F('pa', '% Opsi A')],
    render: (ctx, w, h, P, S, R, C) => {
      panel(ctx, 0, 0, w, h, S, R);
      drawFittedText(ctx, U(S, P.question), 40, 24, w - 80, h * 0.3, { family: fam(S, R), weight: S.weight, color: S.fg, size: 56, align: 'center' });
      const pa = clamp((Number(P.pa) || 50) / 100);
      const reveal = ease('outCubic', clamp((R.t - 0.6) / 1));
      [
        [P.a, pa],
        [P.b, 1 - pa],
      ].forEach(([label, v], i) => {
        const y = h * 0.36 + i * h * 0.3;
        const bw = w - 80;
        pill(ctx, 40, y, bw, h * 0.22, rgba(S.fg, 0.1));
        pill(ctx, 40, y, Math.max(h * 0.22, bw * (v as number) * reveal), h * 0.22, i ? C.secondary : C.primary);
        drawFittedText(ctx, String(label), 70, y, bw * 0.6, h * 0.22, { family: R.body, weight: 800, color: S.fg, size: 42 });
        if (reveal > 0.05) drawFittedText(ctx, `${Math.round((v as number) * 100 * reveal)}%`, 40 + bw - 200, y, 170, h * 0.22, { family: R.body, weight: 900, color: S.fg, size: 42, align: 'right' });
      });
    },
  },
  {
    kind: 'beforeafter', label: 'Sebelum → Sesudah', group: 'data', tags: ['before', 'after', 'perbandingan'], size: { w: 900, h: 200 },
    defaults: { before: 'Sebelum', after: 'Sesudah' }, fields: [F('before', 'Kiri'), F('after', 'Kanan')],
    render: (ctx, w, h, P, S, R, C) => {
      const bw = (w - 140) / 2;
      panel(ctx, 0, 0, bw, h, { ...S, bg: rgba('#000000', 0.55), grad: undefined, fg: '#FFFFFF', border: null }, R, Math.min(S.radius, h / 2));
      panel(ctx, w - bw, 0, bw, h, { ...S, bg: C.primary, grad: undefined, fg: readableOn(C.primary) }, R, Math.min(S.radius, h / 2));
      drawFittedText(ctx, U(S, P.before), 0, 0, bw, h, { family: fam(S, R), weight: 800, color: '#FFFFFF', size: 56, align: 'center' });
      drawFittedText(ctx, U(S, P.after), w - bw, 0, bw, h, { family: fam(S, R), weight: 800, color: readableOn(C.primary), size: 56, align: 'center' });
      const ax = w / 2 + Math.sin(R.t * 5) * 10;
      drawIcon(ctx, 'arrow-right', ax - 45, h / 2 - 45, 90, 90, S.fg, 3);
    },
  },
  {
    kind: 'phone', label: 'Mockup HP', group: 'mockup', tags: ['hp', 'mockup', 'aplikasi', 'foto'], size: { w: 520, h: 980 },
    defaults: { image: '', title: 'Aplikasi Kamu' }, fields: [F('title', 'Judul layar'), F('image', 'Foto (pilih dari panel)')],
    render: (ctx, w, h, P, S, R, C) => {
      panel(ctx, 0, 0, w, h, { ...S, bg: '#0B0B0D', grad: undefined, border: S.border || '#2A2A2E', borderW: Math.max(S.borderW, 6) }, R, 70);
      ctx.save();
      pathRR(ctx, 22, 22, w - 44, h - 44, 52);
      ctx.clip();
      const img = P.image && R.image ? R.image(P.image) : null;
      if (img) {
        const iw = (img as HTMLImageElement).width || 1;
        const ih = (img as HTMLImageElement).height || 1;
        const sc = Math.max((w - 44) / iw, (h - 44) / ih) * (1 + 0.03 * Math.sin(R.t));
        ctx.drawImage(img, 22 + (w - 44 - iw * sc) / 2, 22 + (h - 44 - ih * sc) / 2, iw * sc, ih * sc);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, C.primary);
        g.addColorStop(1, C.secondary);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        drawFittedText(ctx, P.title, 60, h * 0.4, w - 120, h * 0.2, { family: R.heading, weight: 900, color: readableOn(C.primary), size: 70, align: 'center' });
      }
      ctx.restore();
      pill(ctx, w / 2 - 70, 40, 140, 34, '#0B0B0D');
    },
  },
  {
    kind: 'browser', label: 'Jendela Browser', group: 'mockup', tags: ['browser', 'website', 'web'], size: { w: 900, h: 600 },
    defaults: { url: 'tokokamu.id', title: 'Website Kamu Jadi Keren' }, fields: [F('url', 'Alamat'), F('title', 'Isi judul', true)],
    render: (ctx, w, h, P, S, R, C) => {
      panel(ctx, 0, 0, w, h, S.bg ? S : { ...S, bg: '#FFFFFF', fg: '#111' }, R, Math.min(S.radius, 30));
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(46 + i * 40, 46, 13, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      });
      pill(ctx, 180, 24, w - 220, 46, rgba(S.fg, 0.1));
      drawFittedText(ctx, P.url, 210, 24, w - 280, 46, { family: R.body, weight: 600, color: S.sub, size: 28 });
      ctx.fillStyle = rgba(C.primary, 0.18);
      pathRR(ctx, 40, 100, w - 80, h - 140, 20);
      ctx.fill();
      drawFittedText(ctx, U(S, P.title), 80, 130, w - 160, h * 0.4, { family: fam(S, R), weight: S.weight, color: S.fg, size: 64, align: 'center' });
      pill(ctx, w / 2 - 150, h - 160, 300, 70, C.primary);
      drawFittedText(ctx, 'Mulai', w / 2 - 150, h - 160, 300, 70, { family: R.body, weight: 800, color: readableOn(C.primary), size: 34, align: 'center' });
    },
  },
  {
    kind: 'ribbon', label: 'Pita Banner', group: 'dekor', tags: ['pita', 'banner', 'ribbon'], size: { w: 860, h: 170 },
    defaults: { text: 'GRAND OPENING' }, fields: [F('text', 'Teks')],
    render: (ctx, w, h, P, S, R, C) => {
      const fill = S.grad ? S.grad[0] : S.bg && S.bg !== C.surface ? S.bg : C.primary;
      const fg = S.grad || (S.bg && S.bg !== C.surface) ? S.fg : readableOn(C.primary);
      ctx.fillStyle = shade(fill.startsWith('#') ? fill : C.primary, -0.3);
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(80, 30);
      ctx.lineTo(80, h);
      ctx.lineTo(0, h);
      ctx.lineTo(40, h * 0.6);
      ctx.closePath();
      ctx.moveTo(w, 30);
      ctx.lineTo(w - 80, 30);
      ctx.lineTo(w - 80, h);
      ctx.lineTo(w, h);
      ctx.lineTo(w - 40, h * 0.6);
      ctx.closePath();
      ctx.fill();
      panel(ctx, 50, 0, w - 100, h - 30, { ...S, bg: fill, grad: S.grad }, R, Math.min(S.radius, 14));
      drawFittedText(ctx, P.text.toUpperCase(), 80, 0, w - 160, h - 30, { family: fam(S, R), weight: 900, color: fg, size: 84, align: 'center' });
    },
  },
  {
    kind: 'location', label: 'Kartu Lokasi', group: 'kartu', tags: ['lokasi', 'alamat', 'map'], size: { w: 840, h: 220 },
    defaults: { title: 'Kunjungi Kami', address: 'Jl. Braga No. 21, Bandung' }, fields: [F('title', 'Judul'), F('address', 'Alamat', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const bounce = Math.abs(Math.sin(R.t * 3)) * 14;
      drawIcon(ctx, 'map-pin', 30, h / 2 - 60 - bounce, 120, 120, S.accent === S.fg ? S.fg : S.accent, 2.3);
      drawFittedText(ctx, U(S, P.title), 180, 26, w - 220, h * 0.42, { family: fam(S, R), weight: S.weight, color: S.fg, size: 52 });
      drawFittedText(ctx, P.address, 180, h * 0.5, w - 220, h * 0.4, { family: R.body, weight: 500, color: S.sub, size: 36 });
    },
  },
  {
    kind: 'feature', label: 'Fitur + Ikon', group: 'kartu', tags: ['fitur', 'ikon', 'benefit'], size: { w: 860, h: 260 },
    defaults: { icon: 'zap', title: 'Super cepat', subtitle: 'Siap dalam 5 menit' }, fields: [F('icon', 'Ikon (id)'), F('title', 'Judul'), F('subtitle', 'Keterangan', true)],
    render: (ctx, w, h, P, S, R) => {
      panel(ctx, 0, 0, w, h, S, R);
      const s = h - 80;
      pathRR(ctx, 40, 40, s, s, s * 0.3);
      ctx.fillStyle = S.accent;
      ctx.fill();
      drawIcon(ctx, P.icon || 'sparkles', 40 + s * 0.2, 40 + s * 0.2, s * 0.6, s * 0.6, S.accentFg, 2.2);
      drawFittedText(ctx, U(S, P.title), 80 + s, 36, w - s - 120, h * 0.42, { family: fam(S, R), weight: S.weight, color: S.fg, size: 60, valign: 'bottom' });
      drawFittedText(ctx, P.subtitle, 80 + s, h * 0.52, w - s - 120, h * 0.36, { family: R.body, weight: 500, color: S.sub, size: 38, valign: 'top' });
    },
  },
  {
    kind: 'callout', label: 'Panah Sorot', group: 'dekor', tags: ['panah', 'callout', 'sorot'], size: { w: 640, h: 220 },
    defaults: { text: 'Lihat ini!' }, fields: [F('text', 'Teks')],
    render: (ctx, w, h, P, S, R, C) => {
      const S2 = S.bg === C.surface ? { ...S, bg: C.primary, fg: readableOn(C.primary) } : S;
      panel(ctx, 0, 0, w * 0.68, h * 0.62, S2, R, Math.min(S2.radius, 40));
      drawFittedText(ctx, U(S2, P.text), 30, 0, w * 0.68 - 60, h * 0.62, { family: fam(S2, R), weight: 900, color: S2.fg, size: 70, align: 'center' });
      const draw = ease('outCubic', clamp(R.t / 0.8));
      ctx.strokeStyle = S2.grad ? S2.grad[0] : S2.bg || C.primary;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const sx = w * 0.6;
      const sy = h * 0.62;
      const ex = w - 30;
      const ey = h - 20;
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(w * 0.85, h * 0.7, sx + (ex - sx) * draw, sy + (ey - sy) * draw);
      ctx.stroke();
      if (draw > 0.95) {
        ctx.beginPath();
        ctx.moveTo(ex - 40, ey - 6);
        ctx.lineTo(ex, ey);
        ctx.lineTo(ex - 10, ey - 40);
        ctx.stroke();
      }
    },
  },
  {
    kind: 'corners', label: 'Bingkai HUD', group: 'dekor', tags: ['frame', 'bingkai', 'hud', 'fokus'], size: { w: 900, h: 900 },
    defaults: { label: 'REC ● 00:12' }, fields: [F('label', 'Label')],
    render: (ctx, w, h, P, S, R, C) => {
      const col = S.border || S.accent || C.primary;
      const L = Math.min(w, h) * 0.16;
      const inset = 6 + Math.sin(R.t * 2.5) * 6;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(6, S.borderW + 2);
      ctx.lineCap = 'round';
      if (S.glow && R.allowBlur) {
        ctx.shadowColor = S.glow;
        ctx.shadowBlur = 20;
      }
      const c = [
        [inset, inset, 1, 1],
        [w - inset, inset, -1, 1],
        [inset, h - inset, 1, -1],
        [w - inset, h - inset, -1, -1],
      ];
      c.forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * L);
        ctx.lineTo(x, y);
        ctx.lineTo(x + sx * L, y);
        ctx.stroke();
      });
      ctx.shadowColor = 'transparent';
      if (P.label) {
        if (Math.floor(R.t * 1.5) % 2 === 0) {
          ctx.beginPath();
          ctx.arc(inset + 50, inset + 56, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#FF3B3B';
          ctx.fill();
        }
        drawFittedText(ctx, P.label.replace('●', '').trim(), inset + 76, inset + 30, w * 0.6, 52, { family: R.body, weight: 700, color: col, size: 38 });
      }
    },
  },
  {
    kind: 'caption', label: 'Subtitle Karaoke', group: 'teks', tags: ['subtitle', 'caption', 'karaoke'], size: { w: 920, h: 200 },
    defaults: { text: 'Ini rahasia yang jarang orang tahu' }, fields: [F('text', 'Kalimat', true)],
    render: (ctx, w, h, P, S, R, C) => {
      const words = P.text.split(/\s+/).filter(Boolean);
      const fit = fitText(ctx, P.text, R.heading, 900, w - 40, h, 80, 20, 1.15);
      ctx.font = `900 ${fit.px}px ${R.heading}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const active = Math.floor(R.t / 0.32) % Math.max(1, words.length);
      let wi = 0;
      const total = fit.lines.length * fit.lineH;
      fit.lines.forEach((line, li) => {
        const lw = ctx.measureText(line).width;
        let x = (w - lw) / 2;
        const y = (h - total) / 2 + fit.lineH * (li + 0.5);
        line.split(' ').forEach((word) => {
          const ww = ctx.measureText(word).width;
          const on = wi === active;
          if (on) {
            pathRR(ctx, x - 12, y - fit.px * 0.6, ww + 24, fit.px * 1.2, 14);
            ctx.fillStyle = S.accent === '#111111' ? '#111111' : C.primary;
            ctx.fill();
          }
          ctx.lineWidth = fit.px * 0.14;
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.lineJoin = 'round';
          if (!on) ctx.strokeText(word, x, y);
          ctx.fillStyle = on ? readableOn(C.primary) : '#FFFFFF';
          ctx.fillText(word, x, y);
          x += ww + ctx.measureText(' ').width;
          wi++;
        });
      });
    },
  },
  {
    kind: 'tag', label: 'Label Kecil', group: 'dekor', tags: ['label', 'baru', 'badge'], size: { w: 300, h: 110 },
    defaults: { text: 'BARU' }, fields: [F('text', 'Teks')],
    render: (ctx, w, h, P, S, R, C) => {
      const S2 = S.bg === C.surface ? { ...S, bg: C.primary, fg: readableOn(C.primary) } : S;
      const pulse = 1 + 0.05 * Math.sin(R.t * 6);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(pulse, pulse);
      panel(ctx, -w / 2, -h / 2, w, h, S2, R, Math.min(S2.radius, h / 2));
      drawFittedText(ctx, P.text.toUpperCase(), -w / 2 + 20, -h / 2, w - 40, h, { family: fam(S2, R), weight: 900, color: S2.fg, size: 56, align: 'center' });
      ctx.restore();
    },
  },
];

export const COMPONENT_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'jualan', label: 'Jualan' },
  { id: 'kartu', label: 'Kartu' },
  { id: 'daftar', label: 'Daftar & Langkah' },
  { id: 'data', label: 'Data & Angka' },
  { id: 'sosial', label: 'Sosial Media' },
  { id: 'aksi', label: 'Tombol' },
  { id: 'ui', label: 'UI' },
  { id: 'mockup', label: 'Mockup' },
  { id: 'dekor', label: 'Dekorasi' },
  { id: 'teks', label: 'Teks' },
  { id: 'custom', label: 'Custom Admin' },
];

const KIND_BY = new Map(KINDS.map((k) => [k.kind, k]));
const REGISTRY: ComponentDef[] = [];
KINDS.forEach((k) =>
  COMPONENT_STYLES.forEach((s) =>
    REGISTRY.push({
      id: `${k.kind}-${s.id}`,
      name: `${k.label} · ${s.label}`,
      kind: k.kind,
      styleId: s.id,
      group: k.group,
      tags: [...k.tags, s.id],
      size: k.size,
      defaults: k.defaults,
      fields: k.fields,
      author: 'builtin',
    })
  )
);
const BY_ID = new Map(REGISTRY.map((c) => [c.id, c]));

export function allComponents(): ComponentDef[] {
  return REGISTRY;
}
export function getComponent(id: string): ComponentDef | undefined {
  return BY_ID.get(id);
}
export function componentKinds() {
  return KINDS.map((k) => ({ kind: k.kind, label: k.label, group: k.group }));
}
export function registerComponent(def: ComponentDef) {
  const idx = REGISTRY.findIndex((c) => c.id === def.id);
  if (idx >= 0) REGISTRY[idx] = def;
  else REGISTRY.unshift(def);
  BY_ID.set(def.id, def);
}
export function unregisterComponent(id: string) {
  const idx = REGISTRY.findIndex((c) => c.id === id);
  if (idx >= 0) REGISTRY.splice(idx, 1);
  BY_ID.delete(id);
}
export function componentIdFor(kind: string, style: string): string {
  return BY_ID.has(`${kind}-${style}`) ? `${kind}-${style}` : `${kind}-gelap`;
}

export function drawComponent(ctx: CanvasRenderingContext2D, def: ComponentDef, w: number, h: number, props: Record<string, string>, colors: CompColors, R: CompRenderCtx) {
  const P = { ...def.defaults, ...props };
  if (def.custom) {
    drawCustom(ctx, def.custom, w, h, P, colors, R);
    return;
  }
  const k = KIND_BY.get(def.kind);
  if (!k) return;
  const S = tokens(def.styleId, colors);
  ctx.save();
  // skala dalam: komponen didesain untuk ukuran default, lalu ditarik ke ukuran layer
  const sx = w / k.size.w;
  const sy = h / k.size.h;
  const s = Math.min(sx, sy);
  const iw = w / s;
  const ih = h / s;
  ctx.scale(s, s);
  if (S.tilt) {
    ctx.translate(iw / 2, ih / 2);
    ctx.rotate((S.tilt * Math.PI) / 180);
    ctx.translate(-iw / 2, -ih / 2);
  }
  k.render(ctx, iw, ih, P, S, R, colors);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Komponen custom (DSL JSON admin)                                    */
/* ------------------------------------------------------------------ */
export interface CustomLayerSpec {
  type: 'rect' | 'circle' | 'text' | 'icon' | 'line' | 'pill';
  x: number;
  y: number;
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  fill?: string;
  gradient?: [string, string];
  stroke?: string;
  strokeWidth?: number;
  shadow?: boolean;
  text?: string;
  size?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  font?: 'heading' | 'body';
  icon?: string;
  opacity?: number;
  /** animasi internal sederhana */
  anim?: 'pulse' | 'float' | 'spin' | 'blink' | 'grow';
  delay?: number;
}

export interface CustomComponentSpec {
  name: string;
  size: { w: number; h: number };
  props: Record<string, string>;
  layers: CustomLayerSpec[];
  base?: string;
  style?: string;
}

function resolveColor(v: string | undefined, C: CompColors, fallback: string): string {
  if (!v) return fallback;
  if (v.startsWith('$')) {
    const key = v.slice(1) as keyof CompColors;
    return C[key] || fallback;
  }
  return v;
}
function tpl(s: string, P: Record<string, string>) {
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => P[k] ?? '');
}

function drawCustom(ctx: CanvasRenderingContext2D, spec: CustomComponentSpec, w: number, h: number, P: Record<string, string>, C: CompColors, R: CompRenderCtx) {
  if (spec.base) {
    const baseDef = getComponent(componentIdFor(spec.base, spec.style || 'gelap'));
    if (baseDef && !baseDef.custom) drawComponent(ctx, baseDef, w, h, P, C, R);
  }
  const sw = spec.size.w || w;
  const sh = spec.size.h || h;
  const s = Math.min(w / sw, h / sh);
  ctx.save();
  ctx.scale(s, s);
  const X = (v: number) => (Math.abs(v) <= 1 ? v * sw : v);
  const Y = (v: number) => (Math.abs(v) <= 1 ? v * sh : v);
  for (const L of spec.layers) {
    const appear = clamp((R.t - (L.delay || 0)) / 0.35);
    if (appear <= 0) continue;
    const x = X(L.x);
    const y = Y(L.y);
    const lw = X(L.w ?? 0.2);
    const lh = Y(L.h ?? 0.2);
    ctx.save();
    ctx.globalAlpha *= (L.opacity ?? 1) * appear;
    const cx = x + lw / 2;
    const cy = y + lh / 2;
    ctx.translate(cx, cy);
    if (L.anim === 'pulse') ctx.scale(1 + 0.06 * Math.sin(R.t * 5), 1 + 0.06 * Math.sin(R.t * 5));
    if (L.anim === 'float') ctx.translate(0, Math.sin(R.t * 2) * 12);
    if (L.anim === 'spin') ctx.rotate(R.t * 1.2);
    if (L.anim === 'blink' && Math.floor(R.t * 2) % 2) ctx.globalAlpha *= 0.2;
    if (L.anim === 'grow') ctx.scale(ease('outBack', appear), ease('outBack', appear));
    ctx.translate(-cx, -cy);
    if (L.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
    }
    const fillStyle = (): string | CanvasGradient => {
      if (L.gradient) {
        const g = ctx.createLinearGradient(x, y, x + lw, y + lh);
        g.addColorStop(0, resolveColor(L.gradient[0], C, C.primary));
        g.addColorStop(1, resolveColor(L.gradient[1], C, C.secondary));
        return g;
      }
      return resolveColor(L.fill, C, 'transparent');
    };
    switch (L.type) {
      case 'rect':
      case 'pill': {
        pathRR(ctx, x, y, lw, lh, L.type === 'pill' ? lh / 2 : L.radius ?? 0);
        if (L.fill || L.gradient) {
          ctx.fillStyle = fillStyle();
          ctx.fill();
        }
        ctx.shadowColor = 'transparent';
        if (L.stroke) {
          ctx.lineWidth = L.strokeWidth ?? 3;
          ctx.strokeStyle = resolveColor(L.stroke, C, C.text);
          ctx.stroke();
        }
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.ellipse(cx, cy, lw / 2, lh / 2, 0, 0, Math.PI * 2);
        if (L.fill || L.gradient) {
          ctx.fillStyle = fillStyle();
          ctx.fill();
        }
        ctx.shadowColor = 'transparent';
        if (L.stroke) {
          ctx.lineWidth = L.strokeWidth ?? 3;
          ctx.strokeStyle = resolveColor(L.stroke, C, C.text);
          ctx.stroke();
        }
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(X(L.x2 ?? L.x + 0.2), Y(L.y2 ?? L.y));
        ctx.lineWidth = L.strokeWidth ?? 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = resolveColor(L.stroke || L.color, C, C.text);
        ctx.stroke();
        break;
      }
      case 'text':
        drawFittedText(ctx, tpl(L.text || '', P), x, y, lw, lh, {
          family: L.font === 'body' ? R.body : R.heading,
          weight: L.weight ?? 800,
          color: resolveColor(L.color, C, C.text),
          size: L.size ?? 60,
          align: L.align || 'left',
        });
        break;
      case 'icon':
        drawIcon(ctx, tpl(L.icon || 'sparkles', P), x, y, lw, lh, resolveColor(L.color, C, C.primary), L.strokeWidth ?? 2);
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

export function parseComponentCode(raw: string, fallbackName = 'Komponen Custom'): { ok: boolean; error?: string; def?: ComponentDef } {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `JSON tidak valid: ${(e as Error).message}` };
  }
  const size = (j.size || {}) as { w?: number; h?: number };
  const w = Math.max(40, Math.min(1920, Number(size.w) || 800));
  const h = Math.max(40, Math.min(1920, Number(size.h) || 300));
  const layers = Array.isArray(j.layers) ? (j.layers as CustomLayerSpec[]) : [];
  const base = typeof j.base === 'string' ? j.base : undefined;
  if (base && !KIND_BY.has(base)) return { ok: false, error: `"base" tidak dikenal. Pilihan: ${KINDS.map((k) => k.kind).join(', ')}` };
  if (!layers.length && !base) return { ok: false, error: 'Isi "layers" (array) atau "base" (jenis komponen bawaan).' };
  const okTypes = ['rect', 'circle', 'text', 'icon', 'line', 'pill'];
  for (const [i, L] of layers.entries()) {
    if (!okTypes.includes(L?.type)) return { ok: false, error: `layers[${i}].type harus salah satu: ${okTypes.join(', ')}` };
    if (typeof L.x !== 'number' || typeof L.y !== 'number') return { ok: false, error: `layers[${i}] wajib punya x dan y (angka).` };
  }
  if (layers.length > 40) return { ok: false, error: 'Maksimal 40 layer per komponen.' };
  const props: Record<string, string> = {};
  Object.entries((j.props || {}) as Record<string, unknown>).forEach(([k, v]) => (props[k] = String(v)));
  const name = String(j.name || fallbackName);
  const spec: CustomComponentSpec = { name, size: { w, h }, props, layers, base, style: typeof j.style === 'string' ? j.style : undefined };
  const baseKind = base ? KIND_BY.get(base) : undefined;
  const fields: CompField[] = Object.keys(props).map((k) => ({ key: k, label: k }));
  return {
    ok: true,
    def: {
      id: String(j.id || `custom-comp-${Date.now()}`),
      name,
      kind: base || 'custom',
      styleId: spec.style || 'custom',
      group: 'custom',
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(String) : ['custom'],
      size: { w, h },
      defaults: { ...(baseKind?.defaults || {}), ...props },
      fields: baseKind ? [...baseKind.fields, ...fields.filter((f) => !baseKind.fields.some((b) => b.key === f.key))] : fields,
      author: 'admin',
      custom: spec,
    },
  };
}

export const COMPONENT_CODE_EXAMPLE = `{
  "name": "Kartu Promo Bulat",
  "size": { "w": 800, "h": 320 },
  "props": { "title": "Diskon 30%", "subtitle": "Khusus hari ini" },
  "layers": [
    { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 48,
      "gradient": ["$primary", "$secondary"], "shadow": true },
    { "type": "circle", "x": 0.04, "y": 0.16, "w": 0.26, "h": 0.68, "fill": "#FFFFFF", "anim": "pulse" },
    { "type": "icon", "icon": "badge-percent", "x": 0.08, "y": 0.28, "w": 0.18, "h": 0.44, "color": "$primary" },
    { "type": "text", "x": 0.36, "y": 0.14, "w": 0.6, "h": 0.42, "text": "{{title}}", "size": 90, "weight": 900, "color": "#FFFFFF" },
    { "type": "text", "x": 0.36, "y": 0.58, "w": 0.6, "h": 0.26, "text": "{{subtitle}}", "size": 44, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
  ]
}`;

export { hash01 };
