import type {
  Aspect,
  ComponentLayer,
  ContentPlan,
  Fill,
  IconLayer,
  ImageLayer,
  Layer,
  PlanItem,
  ProjectDoc,
  Scene,
  ShapeLayer,
  TextLayer,
  Theme,
} from './types';
import { canvasSize, uid } from './types';
import { getLayout, getTemplate, getTheme, LayoutDef, rankTemplates, ThemeDef } from './packs/templates';
import { componentIdFor, getComponent } from './packs/components';
import { getAnimation } from './packs/animations';
import { getTransition, hasTransition } from './packs/transitions';
import { readableOn, rgba } from './color';
import { getEffect, suggestEffects } from './packs/effects';

/**
 * Builder — mengubah ContentPlan + template menjadi ProjectDoc yang bisa diedit penuh
 * (setiap teks, komponen, ikon, foto adalah layer terpisah).
 */

type ThemeLike = Pick<Theme, 'palette' | 'headingFont' | 'bodyFont'>;

interface Ctx {
  plan: ContentPlan;
  theme: ThemeDef;
  L: LayoutDef;
  W: number;
  H: number;
  k: number;
  m: number;
  cw: number;
  x0: number;
  idx: number;
  total: number;
  photo?: string;
  seed: number;
}

const pick = <T,>(arr: T[], n: number): T => arr[Math.abs(n) % arr.length];

function anim(id: string | undefined, delay = 0, fallback = 'fade') {
  const spec = getAnimation(id) || getAnimation(fallback)!;
  return { id: spec.id, duration: spec.duration, delay };
}

function base(kind: Layer['kind'], name: string, x: number, y: number, w: number, h: number, start = 0): Omit<Layer, 'kind'> & { kind: Layer['kind'] } {
  return { id: uid('ly'), kind, name, x, y, w, h, rotation: 0, opacity: 1, start, end: null, animIn: null, animOut: null, animLoop: null, shadow: null };
}

export function makeText(c: { theme: ThemeLike }, text: string, x: number, y: number, w: number, h: number, o: Partial<TextLayer> = {}): TextLayer {
  const p = c.theme.palette;
  return {
    ...(base('text', o.name || 'Teks', x, y, w, h) as TextLayer),
    kind: 'text',
    text,
    font: c.theme.headingFont,
    size: 96,
    weight: 800,
    color: p.text,
    align: 'center',
    lineHeight: 1.12,
    letterSpacing: 0,
    stroke: null,
    highlight: null,
    ...o,
  };
}

export function makeComponent(c: { theme: ThemeLike }, componentId: string, x: number, y: number, w: number, h: number, props: Record<string, string> = {}, o: Partial<ComponentLayer> = {}): ComponentLayer {
  const p = c.theme.palette;
  const def = getComponent(componentId);
  return {
    ...(base('component', def?.name.split(' · ')[0] || 'Komponen', x, y, w, h) as ComponentLayer),
    kind: 'component',
    componentId,
    props,
    colors: { primary: p.primary, secondary: p.secondary, text: p.text, surface: p.surface },
    ...o,
  };
}

export function makeIcon(c: { theme: ThemeLike }, iconId: string, x: number, y: number, s: number, o: Partial<IconLayer> = {}): IconLayer {
  const p = c.theme.palette;
  return {
    ...(base('icon', 'Ikon', x, y, s, s) as IconLayer),
    kind: 'icon',
    iconId,
    color: readableOn(p.primary),
    strokeWidth: 2.2,
    bg: { shape: 'circle', color: p.primary },
    ...o,
  };
}

export function makeImage(src: string, x: number, y: number, w: number, h: number, o: Partial<ImageLayer> = {}): ImageLayer {
  return { ...(base('image', 'Foto', x, y, w, h) as ImageLayer), kind: 'image', src, fit: 'cover', radius: 32, border: null, mask: 'none', ...o };
}

export function makeShape(shape: ShapeLayer['shape'], x: number, y: number, w: number, h: number, fill: string, o: Partial<ShapeLayer> = {}): ShapeLayer {
  return { ...(base('shape', 'Bentuk', x, y, w, h) as ShapeLayer), kind: 'shape', shape, fill, stroke: null, radius: 0, ...o };
}

/* ------------------------------------------------------------------ */
function sceneDuration(item: PlanItem): number {
  const words = `${item.title} ${item.body || ''}`.split(/\s+/).filter(Boolean).length;
  const base = item.role === 'kutipan' ? 1.6 : 1.3;
  return Math.round(Math.min(6.5, Math.max(2.6, base + words / 3)) * 10) / 10;
}

function kickerFor(item: PlanItem, c: Ctx): string {
  const { plan } = c;
  const nPoints = plan.items.filter((i) => i.role === item.role).length;
  const nth = plan.items.filter((i, j) => i.role === item.role && j <= c.idx).length;
  switch (item.role) {
    case 'hook':
      return plan.category === 'promo' ? (plan.intent === 'flash-sale' ? 'FLASH SALE' : 'PROMO') : plan.intent === 'fakta' ? 'FAKTA' : plan.intent === 'tutorial' ? 'TUTORIAL' : plan.category === 'quote' ? '' : 'TIPS';
    case 'poin':
      return plan.intent === 'fakta' ? `FAKTA #${nth}` : plan.intent === 'travel' ? `SPOT #${nth}` : nPoints > 1 ? `#${nth} DARI ${nPoints}` : 'KEUNGGULAN';
    case 'langkah':
      return `LANGKAH ${nth}`;
    case 'harga':
      return 'HARGA SPESIAL';
    case 'bukti':
      return 'BUKTI NYATA';
    case 'produk':
      return plan.intent === 'menu-kuliner' ? 'MENU' : 'PRODUK';
    case 'info':
      return 'INFO';
    case 'masalah':
      return 'MASALAH';
    case 'cta':
      return 'YUK!';
    default:
      return '';
  }
}

function emphasisWordsOf(text: string, plan: ContentPlan): string[] {
  const words: string[] = [];
  if (plan.price) words.push(...plan.price.split(' '));
  if (plan.discount) words.push(plan.discount);
  const nums = text.match(/\b\d+[%k]?\b|rp/gi) || [];
  words.push(...nums);
  if (plan.product) words.push(...plan.product.split(' ').slice(0, 2));
  return Array.from(new Set(words.map((w) => w.toLowerCase())));
}

function headline(c: Ctx, text: string, y: number, h: number, delay = 0.15, extra: Partial<TextLayer> = {}): TextLayer {
  const { L, theme, k } = c;
  const left = L.align === 'left';
  const t = makeText(c, L.upper ? text.toUpperCase() : text, c.x0, y, c.cw, h, {
    name: 'Judul',
    size: Math.round(L.headlineSize * k),
    weight: theme.headingFont === 'Bebas Neue' || theme.headingFont === 'Anton' ? 400 : 800,
    align: left ? 'left' : 'center',
    lineHeight: theme.headingFont === 'Bebas Neue' || theme.headingFont === 'Anton' ? 1.0 : 1.1,
    emphasisColor: theme.palette.primary,
    emphasisWords: emphasisWordsOf(text, c.plan),
    animIn: anim(pick(L.headAnim, c.idx + c.seed), delay),
    ...extra,
  });
  if (L.highlight) {
    t.highlight = { color: rgba(theme.palette.primary, 0.95), padding: 18, radius: 10 };
    t.color = readableOn(theme.palette.primary);
    t.emphasisWords = [];
  }
  return t;
}

function bodyText(c: Ctx, text: string, y: number, h: number, delay = 0.7): TextLayer {
  const { L, theme, k } = c;
  return makeText(c, text, c.x0, y, c.cw, h, {
    name: 'Keterangan',
    font: theme.bodyFont,
    size: Math.round(46 * k),
    weight: 500,
    color: theme.palette.muted,
    align: L.align === 'left' ? 'left' : 'center',
    lineHeight: 1.3,
    animIn: anim(pick(L.bodyAnim, c.idx), delay),
  });
}

function kicker(c: Ctx, label: string, y: number): Layer | null {
  if (!label) return null;
  const { L, theme, k } = c;
  if (L.id === 'editorial' || L.id === 'sinema' || L.id === 'minimal') {
    return makeText(c, label, c.x0, y, c.cw, 60 * k, {
      name: 'Label',
      font: theme.bodyFont,
      size: Math.round(36 * k),
      weight: 700,
      letterSpacing: 6,
      color: theme.palette.primary,
      align: L.align === 'left' ? 'left' : 'center',
      animIn: anim('teks-char-muncul-cepat', 0),
    });
  }
  const w = Math.min(c.cw, Math.max(260, label.length * 30 + 120)) * k;
  const h = 96 * k;
  const x = L.align === 'left' ? c.x0 : (c.W - w) / 2;
  return makeComponent(c, componentIdFor('tag', L.compStyle === 'kaca' ? 'gradien' : L.compStyle), x, y, w, h, { text: label }, { name: 'Label', animIn: anim('pop-kecil-membal', 0) });
}

function iconBadge(c: Ctx, iconId: string, cx: number, cy: number, s: number, delay = 0.5): IconLayer {
  const { L, theme } = c;
  const p = theme.palette;
  const style = L.compStyle;
  const bg = style === 'garis' || style === 'elegan' ? null : { shape: (style === 'brutal' || style === 'retro' ? 'squircle' : 'circle') as 'circle' | 'squircle', color: p.primary };
  return makeIcon(c, iconId, cx - s / 2, cy - s / 2, s, {
    color: bg ? readableOn(p.primary) : p.primary,
    bg,
    animIn: anim(pick(L.elemAnim, c.idx + 1), delay),
    animLoop: pick(L.loops, c.idx),
  });
}

function photoLayers(c: Ctx, region: { y: number; h: number }): Layer[] {
  if (!c.photo) return [];
  const { L, W, theme } = c;
  if (L.photo === 'split') {
    return [makeImage(c.photo, 0, 0, W, region.y + region.h, { name: 'Foto', radius: 0, animIn: anim('blur-fokus-zoom-halus', 0), animLoop: 'loop-zoom-pelan-lembut' })];
  }
  if (L.photo === 'phone') {
    const h = region.h;
    const w = h * 0.53;
    return [makeComponent(c, componentIdFor('phone', 'gelap'), (W - w) / 2, region.y, w, h, { image: c.photo, title: c.plan.product || '' }, { name: 'Mockup HP', animIn: anim('geser-atas-jauh-membal', 0.2), animLoop: 'loop-melayang-lembut' })];
  }
  const w = Math.min(c.cw, region.h * 1.25);
  const img = makeImage(c.photo, (W - w) / 2, region.y, w, region.h, {
    name: 'Foto',
    radius: L.compStyle === 'brutal' ? 18 : 40,
    border: { color: L.compStyle === 'brutal' ? '#111111' : '#FFFFFF', width: L.compStyle === 'brutal' ? 8 : 10 },
    rotation: L.compStyle === 'brutal' || L.compStyle === 'pop' ? -3 : 0,
    animIn: anim(pick(L.elemAnim, c.idx), 0.25),
    animLoop: 'loop-melayang-lembut',
    shadow: { color: 'rgba(0,0,0,0.45)', blur: 40, x: 0, y: 24 },
  });
  void theme;
  return [img];
}

function decorLayers(c: Ctx): Layer[] {
  const { L, W, H, theme, idx } = c;
  const p = theme.palette;
  const out: Layer[] = [];
  switch (L.decor) {
    case 'blobs':
      out.push(makeShape('blob', -W * 0.25, -H * 0.06, W * 0.75, W * 0.75, rgba(p.primary, 0.28), { name: 'Dekor', animLoop: 'loop-melayang-sedang', opacity: 0.9 }));
      out.push(makeShape('blob', W * 0.55, H * 0.72, W * 0.7, W * 0.7, rgba(p.secondary, 0.22), { name: 'Dekor', animLoop: 'loop-goyang-lembut', rotation: 40 }));
      break;
    case 'bubbles':
      for (let i = 0; i < 5; i++) {
        const s = (60 + ((i * 53 + idx * 17) % 120)) * c.k;
        out.push(makeShape('circle', ((i * 211 + idx * 97) % 1000) / 1000 * W, ((i * 347 + idx * 61) % 1000) / 1000 * H, s, s, rgba(i % 2 ? p.secondary : p.primary, 0.25), { name: 'Gelembung', animLoop: i % 2 ? 'loop-melayang-sedang' : 'loop-melayang-lembut' }));
      }
      break;
    case 'corners':
      out.push(makeComponent(c, componentIdFor('corners', 'neon'), W * 0.05, H * 0.05, W * 0.9, H * 0.9, { label: `REC ● 0${idx + 1}` }, { name: 'Bingkai', animIn: anim('pop-besar-tegas', 0) }));
      break;
    case 'lines':
      out.push(makeShape('rect', c.x0, H * 0.12, 120 * c.k, 10 * c.k, p.primary, { name: 'Garis', radius: 5, animIn: anim('stretch-h-tegas', 0.1) }));
      break;
    case 'letterbox':
      out.push(makeShape('rect', 0, 0, W, H * 0.09, '#000000', { name: 'Letterbox', animIn: anim('geser-bawah-pendek-halus', 0) }));
      out.push(makeShape('rect', 0, H * 0.91, W, H * 0.09, '#000000', { name: 'Letterbox', animIn: anim('geser-atas-pendek-halus', 0) }));
      break;
    case 'stickers':
      if (idx % 2 === 0) out.push(makeShape('star', W * 0.8, H * 0.1, 140 * c.k, 140 * c.k, p.secondary, { name: 'Bintang', animLoop: 'loop-putar-lembut', stroke: { color: '#111111', width: 5 } }));
      else out.push(makeShape('circle', W * 0.06, H * 0.84, 110 * c.k, 110 * c.k, p.secondary, { name: 'Bulat', animLoop: 'loop-lompat-lembut', stroke: { color: '#111111', width: 5 } }));
      break;
    case 'grid':
    case 'none':
      break;
  }
  return out;
}

function buildRole(item: PlanItem, c: Ctx): Layer[] {
  const { L, W, H, k, plan, theme } = c;
  const p = theme.palette;
  const st = L.compStyle;
  const out: Layer[] = [];
  const add = (l: Layer | null) => l && out.push(l);
  const split = L.photo === 'split' && !!c.photo;
  // area konten (di bawah foto saat layout split)
  const top = split ? H * 0.5 : H * 0.14;
  const bottom = H * 0.88;
  const area = bottom - top;
  const Y = (f: number) => top + area * f;

  if (!split && c.photo && (L.photo === 'frame' || L.photo === 'phone') && (item.role === 'produk' || item.role === 'hook')) {
    out.push(...photoLayers(c, { y: H * 0.1, h: L.photo === 'phone' ? H * 0.5 : H * 0.34 }));
    const t0 = L.photo === 'phone' ? H * 0.62 : H * 0.47;
    add(kicker(c, kickerFor(item, c), t0));
    out.push(headline(c, item.title, t0 + 110 * k, H * 0.18));
    if (item.body) out.push(bodyText(c, item.body, t0 + 110 * k + H * 0.19, H * 0.08));
    if (item.role === 'produk' && plan.keywords.length) {
      const chips = (item.value || plan.keywords.slice(0, 3).map((w) => w[0].toUpperCase() + w.slice(1)).join('|'));
      out.push(makeComponent(c, componentIdFor('chips', st), c.x0, H * 0.86, c.cw, 110 * k, { items: chips }, { animIn: anim('fade', 1) }));
    }
    return out;
  }
  if (split) out.push(...photoLayers(c, { y: 0, h: H * 0.46 }));

  switch (item.role) {
    case 'hook': {
      add(kicker(c, kickerFor(item, c), Y(0.08)));
      out.push(headline(c, item.title, Y(0.16), area * 0.42));
      if (item.body) out.push(bodyText(c, item.body, Y(0.6), area * 0.1));
      if (plan.discount && plan.category === 'promo') {
        const s = 300 * k;
        out.push(makeComponent(c, componentIdFor('discount', st === 'kaca' ? 'gradien' : st), L.align === 'left' ? W - s - c.m : (W - s) / 2, Y(0.72), s, s, { value: plan.discount, label: plan.discount === 'B1G1' ? 'PROMO' : 'OFF' }, { animIn: anim('fisika-elastis-kuat', 0.9), animLoop: 'loop-denyut-lembut' }));
      } else if (item.icon) out.push(iconBadge(c, item.icon, L.align === 'left' ? c.x0 + 110 * k : W / 2, Y(0.84), 200 * k, 0.9));
      break;
    }
    case 'masalah':
    case 'info': {
      add(kicker(c, kickerFor(item, c), Y(0.1)));
      if (item.icon) out.push(iconBadge(c, item.icon, L.align === 'left' ? c.x0 + 100 * k : W / 2, Y(0.26), 190 * k, 0.1));
      out.push(headline(c, item.title, Y(0.38), area * 0.28, 0.35));
      if (item.body) {
        if (item.role === 'info' && item.value?.includes('|')) out.push(makeComponent(c, componentIdFor('checklist', st), c.x0, Y(0.7), c.cw, area * 0.26, { items: item.value }, { animIn: anim(pick(L.bodyAnim, c.idx), 0.8) }));
        else if (item.role === 'info' && /jl|jalan|lokasi/i.test(item.body)) out.push(makeComponent(c, componentIdFor('location', st), c.x0, Y(0.7), c.cw, 230 * k, { title: item.title, address: item.body }, { animIn: anim(pick(L.elemAnim, c.idx), 0.8) }));
        else out.push(bodyText(c, item.body, Y(0.7), area * 0.14, 0.8));
      }
      break;
    }
    case 'poin': {
      add(kicker(c, kickerFor(item, c), Y(0.06)));
      if (L.id === 'majalah' && item.value) {
        out.push(makeText(c, item.value.padStart(2, '0'), c.x0, Y(0.12), c.cw, area * 0.34, { name: 'Nomor', size: Math.round(420 * k), weight: 900, color: p.primary, align: 'left', lineHeight: 0.9, animIn: anim('pop-raksasa-tegas', 0.1) }));
        out.push(headline(c, item.title, Y(0.5), area * 0.24, 0.4));
        if (item.body) out.push(bodyText(c, item.body, Y(0.76), area * 0.14, 0.8));
      } else if (item.value?.includes('|')) {
        out.push(headline(c, item.title, Y(0.14), area * 0.24, 0.15));
        out.push(makeComponent(c, componentIdFor('checklist', st), c.x0, Y(0.46), c.cw, area * 0.38, { items: item.value }, { animIn: anim(pick(L.bodyAnim, c.idx), 0.5) }));
      } else {
        out.push(headline(c, item.title, Y(0.14), area * 0.3, 0.15));
        out.push(makeComponent(c, componentIdFor('feature', st), c.x0, Y(0.52), c.cw, 270 * k, { icon: item.icon || 'sparkles', title: item.title.split(' ').slice(0, 3).join(' '), subtitle: item.body || '' }, { animIn: anim(pick(L.elemAnim, c.idx), 0.6) }));
      }
      break;
    }
    case 'langkah': {
      add(kicker(c, kickerFor(item, c), Y(0.06)));
      out.push(headline(c, item.title, Y(0.16), area * 0.26, 0.15));
      out.push(makeComponent(c, componentIdFor('step', st), c.x0, Y(0.5), c.cw, 280 * k, { number: item.value || String(c.idx), title: item.title, subtitle: item.body || '' }, { animIn: anim(pick(L.elemAnim, c.idx), 0.55) }));
      if (item.icon) out.push(iconBadge(c, item.icon, W / 2, Y(0.86), 150 * k, 1));
      break;
    }
    case 'produk': {
      add(kicker(c, kickerFor(item, c), Y(0.08)));
      if (!c.photo && item.icon) out.push(iconBadge(c, item.icon, L.align === 'left' ? c.x0 + 130 * k : W / 2, Y(0.3), 260 * k, 0.1));
      out.push(headline(c, item.title, Y(c.photo ? 0.18 : 0.46), area * 0.26, 0.3));
      if (item.body) out.push(bodyText(c, item.body, Y(c.photo ? 0.46 : 0.74), area * 0.1, 0.8));
      if (item.value) out.push(makeComponent(c, componentIdFor('tag', st === 'kaca' ? 'gradien' : st), L.align === 'left' ? c.x0 : (W - 360 * k) / 2, Y(c.photo ? 0.6 : 0.86), 360 * k, 110 * k, { text: item.value }, { animIn: anim('pop-kecil-membal', 1.1), animLoop: 'loop-denyut-lembut' }));
      break;
    }
    case 'harga': {
      add(kicker(c, kickerFor(item, c), Y(0.06)));
      out.push(headline(c, plan.product || 'Harga Spesial', Y(0.14), area * 0.2, 0.15));
      const pw = Math.min(c.cw, 800 * k);
      out.push(makeComponent(c, componentIdFor('price', st), L.align === 'left' ? c.x0 : (W - pw) / 2, Y(0.38), pw, 380 * k, { label: 'Harga spesial', old: item.body || '', price: item.title }, { animIn: anim(pick(L.elemAnim, c.idx), 0.45) }));
      if (item.value) {
        const s = 280 * k;
        out.push(makeComponent(c, componentIdFor('discount', st === 'kaca' ? 'gradien' : st), W - s - c.m * 0.6, Y(0.3), s, s, { value: item.value, label: item.value === 'B1G1' || item.value === 'BARU' ? '!' : 'OFF' }, { animIn: anim('fisika-elastis-kuat', 0.9), animLoop: 'loop-denyut-sedang' }));
      }
      if (plan.intent === 'flash-sale') out.push(makeComponent(c, componentIdFor('countdown', st), c.x0, Y(0.78), c.cw, 250 * k, { label: 'Berakhir dalam', value: '02:59:59' }, { animIn: anim('geser-atas-pendek-tegas', 1.1) }));
      else out.push(makeComponent(c, componentIdFor('sticker', st === 'kaca' ? 'retro' : st), c.x0, Y(0.84), 480 * k, 140 * k, { text: 'Stok terbatas' }, { animIn: anim('gaya-tada-normal', 1.2), rotation: -4 }));
      break;
    }
    case 'bukti': {
      add(kicker(c, kickerFor(item, c), Y(0.06)));
      const pw = c.cw;
      if (item.value && /^\d(\.\d)?$/.test(item.value)) {
        out.push(headline(c, item.title, Y(0.14), area * 0.24, 0.15));
        out.push(makeComponent(c, componentIdFor('rating', st), c.x0, Y(0.44), pw, 240 * k, { value: item.value, label: item.body || '' }, { animIn: anim(pick(L.elemAnim, c.idx), 0.5) }));
        out.push(makeComponent(c, componentIdFor('comment', st === 'neon' ? 'gelap' : st), c.x0, Y(0.7), pw, 230 * k, { name: 'Ulasan pelanggan', text: `Mantap! ${plan.product || 'Produknya'} recommended banget 🔥` }, { animIn: anim('geser-atas-pendek-membal', 1.1) }));
      } else if (item.value && /^\d+$/.test(item.value) && Number(item.value) > 100) {
        out.push(headline(c, item.title, Y(0.14), area * 0.24, 0.15));
        out.push(makeComponent(c, componentIdFor('counter', st), c.x0, Y(0.46), pw, 320 * k, { value: item.value, suffix: '+', label: item.body || '' }, { animIn: anim(pick(L.elemAnim, c.idx), 0.5) }));
      } else if (item.value && /^\d+$/.test(item.value)) {
        out.push(headline(c, item.title, Y(0.14), area * 0.24, 0.15));
        out.push(makeComponent(c, componentIdFor('progress', st), c.x0, Y(0.48), pw, 180 * k, { label: item.body || 'Terjual', value: item.value }, { animIn: anim(pick(L.elemAnim, c.idx), 0.5) }));
        out.push(makeComponent(c, componentIdFor('notif', st === 'neon' ? 'gelap' : st), c.x0, Y(0.7), pw, 220 * k, { app: 'shopping-bag', title: 'Pesanan baru!', text: 'Seseorang baru saja membeli' }, { animIn: anim('geser-bawah-pendek-membal', 1) }));
      } else if (plan.intent === 'testimoni' || L.id === 'chat') {
        out.push(makeComponent(c, componentIdFor('chat', st === 'brutal' ? 'minimal' : st), c.x0, Y(0.18), pw * 0.9, 240 * k, { name: item.title, text: item.body || '' }, { animIn: anim('geser-atas-pendek-membal', 0.1) }));
        out.push(makeComponent(c, componentIdFor('chat', 'gradien'), c.x0 + pw * 0.1, Y(0.5), pw * 0.9, 220 * k, { name: plan.store || 'Admin', text: 'Terima kasih kak! 🙏' }, { animIn: anim('geser-atas-pendek-membal', 1.2) }));
      } else {
        out.push(headline(c, item.title, Y(0.22), area * 0.3, 0.15));
        if (item.body) out.push(bodyText(c, item.body, Y(0.56), area * 0.12, 0.6));
        if (item.icon) out.push(iconBadge(c, item.icon, W / 2, Y(0.82), 200 * k, 0.9));
      }
      break;
    }
    case 'kutipan': {
      const serif = L.id === 'sinema' || L.id === 'minimal' || L.id === 'editorial';
      if (L.id === 'kaca' || L.id === 'chat' || L.id === 'brutal' || L.id === 'retro' || L.id === 'jualan') {
        out.push(makeComponent(c, componentIdFor('quote', st), c.x0, Y(0.2), c.cw, area * 0.55, { text: item.title, author: item.body || (plan.handle ? `— ${plan.handle}` : '') }, { animIn: anim(pick(L.elemAnim, c.idx), 0.1) }));
      } else {
        out.push(makeText(c, '“', c.x0, Y(0.08), c.cw, 220 * k, { name: 'Tanda kutip', size: Math.round(300 * k), weight: 900, color: p.primary, align: L.align === 'left' ? 'left' : 'center', animIn: anim('pop-kecil-membal', 0) }));
        out.push(
          makeText(c, item.title, c.x0, Y(0.26), c.cw, area * 0.5, {
            name: 'Kutipan',
            font: serif ? theme.headingFont : theme.headingFont,
            size: Math.round(86 * k),
            weight: theme.headingFont === 'Playfair Display' ? 600 : 800,
            italic: theme.headingFont === 'Playfair Display',
            align: L.align === 'left' ? 'left' : 'center',
            lineHeight: 1.22,
            animIn: anim(pick(L.headAnim, c.idx), 0.2),
          })
        );
        if (item.body) out.push(bodyText(c, item.body, Y(0.8), area * 0.08, 1.2));
      }
      break;
    }
    case 'cta': {
      add(kicker(c, kickerFor(item, c), Y(0.12)));
      out.push(headline(c, item.title, Y(0.2), area * 0.3, 0.15));
      const bw = Math.min(c.cw, 720 * k);
      out.push(makeComponent(c, componentIdFor('button', st === 'garis' || st === 'kaca' ? 'gradien' : st), (W - bw) / 2, Y(0.56), bw, 160 * k, { label: plan.category === 'promo' ? 'Pesan Sekarang' : plan.category === 'quote' ? 'Bagikan' : 'Simpan Video' }, { animIn: anim('fisika-elastis-lembut', 0.7), animLoop: 'loop-denyut-lembut' }));
      if (plan.handle || plan.store) out.push(makeComponent(c, componentIdFor('follow', st === 'brutal' ? 'minimal' : st), c.x0, Y(0.78), c.cw, 200 * k, { name: plan.store || plan.handle?.replace('@', '') || 'MotionKu', handle: plan.handle || `@${(plan.store || 'motionku').toLowerCase().replace(/\s+/g, '')}` }, { animIn: anim('geser-atas-pendek-membal', 1.2) }));
      break;
    }
  }
  return out;
}

function backgroundFor(c: Ctx, item: PlanItem): Fill {
  const { theme, L, idx } = c;
  const p = theme.palette;
  if (c.photo && L.photo === 'bg') {
    return { type: 'image', color: p.bg, src: c.photo, fit: 'cover', dim: item.role === 'kutipan' ? 0.62 : 0.5, kenBurns: true, pattern: 'none' };
  }
  const cta = item.role === 'cta' || item.role === 'harga';
  const colors = cta && L.energy >= 2 ? [p.bg2, p.bg, p.bg2] : idx % 2 ? [p.bg2, p.bg] : [p.bg, p.bg2];
  return {
    type: 'gradient',
    color: p.bg,
    colors,
    angle: theme.gradientAngle + (idx % 3) * 25,
    pattern: L.pattern || theme.pattern,
    patternColor: p.primary,
    patternOpacity: 0.14,
  };
}

function pickTransition(L: LayoutDef, idx: number, prev?: string): { id: string; duration: number } {
  const pool = L.transitions.filter((t) => hasTransition(t));
  let id = pool[idx % pool.length] || 'fade-none-normal';
  if (id === prev && pool.length > 1) id = pool[(idx + 1) % pool.length];
  const spec = getTransition(id);
  return { id: spec.id, duration: spec.duration };
}

function ctxFor(plan: ContentPlan, theme: ThemeDef, L: LayoutDef, aspect: Aspect, seed: number): Omit<Ctx, 'idx' | 'photo'> {
  const { w: W, h: H } = canvasSize(aspect);
  const k = Math.max(0.6, Math.min(1, (H / 1920) * 1.35));
  const m = Math.round(W * (W > H ? 0.1 : 0.08));
  const cw = Math.min(W - m * 2, W > H ? 1300 : 1000);
  const x0 = L.align === 'left' && W > H ? m : (W - cw) / 2;
  return { plan, theme, L, W, H, k, m, cw, x0, total: plan.items.length, seed };
}

export function themeOf(t: ThemeDef): Theme {
  return { palette: { ...t.palette }, headingFont: t.headingFont, bodyFont: t.bodyFont };
}

export function buildScenes(plan: ContentPlan, templateId: string, aspect: Aspect, photoIds: string[], seed = 1): Scene[] {
  const tp = getTemplate(templateId);
  const theme = getTheme(tp.themeId);
  const L = getLayout(tp.layoutId);
  const base = ctxFor(plan, theme, L, aspect, seed);
  let photoCursor = 0;
  let prevTr: string | undefined;
  const fxIds = suggestEffects([plan.prompt, ...plan.keywords], plan.mood, plan.intent);
  const AMBIENT = ['hujan', 'salju', 'pasir', 'bokeh', 'kabut', 'matrix', 'debu', 'sakura', 'daun', 'bara', 'film', 'kilau'];
  const effectsFor = (role: string, idx: number) =>
    fxIds
      .filter((id) => {
        const kind = getEffect(id)?.kind || '';
        if (AMBIENT.includes(kind)) return true;
        if (kind === 'kaca-pecah') return idx === 0;
        return role === 'hook' || role === 'cta' || role === 'harga';
      })
      .map((id) => ({ id }));
  return plan.items.map((item, idx) => {
    const wantsPhoto = photoIds.length > 0 && (item.role === 'hook' || item.role === 'produk' || L.photo === 'bg' || photoIds.length > photoCursor);
    const photo = wantsPhoto ? photoIds[photoCursor++ % photoIds.length] : undefined;
    const c: Ctx = { ...base, idx, photo };
    const layers = [...decorLayers(c), ...buildRole(item, c)];
    const tr = pickTransition(L, idx + seed, prevTr);
    prevTr = tr.id;
    return {
      id: uid('sc'),
      name: `${idx + 1}. ${item.title.slice(0, 24)}`,
      role: item.role,
      duration: sceneDuration(item),
      background: backgroundFor(c, item),
      layers,
      transition: tr,
      effects: effectsFor(item.role, idx),
    };
  });
}

export function buildDoc(opts: {
  plan: ContentPlan;
  templateId?: string;
  aspect?: Aspect;
  assets?: Record<string, string>;
  photoIds?: string[];
  id?: string;
  seed?: number;
}): ProjectDoc {
  const aspect = opts.aspect || '9:16';
  const photoIds = opts.photoIds || Object.keys(opts.assets || {});
  const templateId =
    opts.templateId ||
    rankTemplates({ intent: opts.plan.intent, mood: opts.plan.mood, keywords: opts.plan.keywords, hasPhotos: photoIds.length > 0 }, 1)[0].id;
  const tp = getTemplate(templateId);
  const theme = getTheme(tp.themeId);
  return {
    version: 6,
    id: opts.id || uid('proj'),
    title: (opts.plan.category === 'promo' ? opts.plan.product || opts.plan.prompt : opts.plan.items[0]?.title || opts.plan.prompt).slice(0, 60),
    aspect,
    templateId: tp.id,
    theme: themeOf(theme),
    scenes: buildScenes(opts.plan, tp.id, aspect, photoIds, opts.seed ?? 1),
    assets: { ...(opts.assets || {}) },
    music: { id: musicFor(opts.plan), volume: 0.7 },
    plan: opts.plan,
    showProgress: true,
  };
}

/** Ganti template tapi pertahankan isi (plan), foto, dan pengaturan musik. */
export function applyTemplate(doc: ProjectDoc, templateId: string, seed = 1): ProjectDoc {
  const tp = getTemplate(templateId);
  const theme = getTheme(tp.themeId);
  const photoIds = Object.keys(doc.assets);
  // sinkronkan teks yang sudah diedit user ke plan
  const plan: ContentPlan = { ...doc.plan, items: doc.plan.items.map((it, i) => syncItemFromScene(it, doc.scenes[i])) };
  return { ...doc, plan, templateId: tp.id, theme: themeOf(theme), scenes: buildScenes(plan, tp.id, doc.aspect, photoIds, seed) };
}

function syncItemFromScene(item: PlanItem, scene?: Scene): PlanItem {
  if (!scene) return item;
  const title = scene.layers.find((l) => l.kind === 'text' && (l.name === 'Judul' || l.name === 'Kutipan')) as TextLayer | undefined;
  const body = scene.layers.find((l) => l.kind === 'text' && l.name === 'Keterangan') as TextLayer | undefined;
  return { ...item, title: title ? title.text : item.title, body: body ? body.text : item.body };
}

/** Ganti rasio: bangun ulang posisi dari plan dengan template yang sama. */
export function changeAspect(doc: ProjectDoc, aspect: Aspect): ProjectDoc {
  return applyTemplate({ ...doc, aspect }, doc.templateId);
}

export function musicFor(plan: ContentPlan): string {
  if (plan.mood === 'galau' || plan.mood === 'tenang') return 'lofi-senja';
  if (plan.mood === 'mewah') return 'cinematic-gold';
  if (plan.mood === 'lucu') return 'bouncy-pop';
  if (plan.mood === 'serius') return 'corporate-pulse';
  if (plan.mood === 'hangat') return 'acoustic-pagi';
  return 'hype-beat';
}

/** Ganti palet seluruh proyek: setiap warna lama dipetakan ke peran yang sama di palet baru. */
export function recolorDoc(doc: ProjectDoc, theme: Theme): ProjectDoc {
  const old = doc.theme.palette;
  const neu = theme.palette;
  const map = new Map<string, string>();
  (Object.keys(old) as Array<keyof typeof old>).forEach((k) => map.set(old[k].toLowerCase(), neu[k]));
  const c = (v: string) => {
    if (!v) return v;
    const hit = map.get(v.toLowerCase());
    if (hit) return hit;
    // rgba(...) turunan warna primer/sekunder
    const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(v.replace(/\s/g, ''));
    if (m) {
      const hex = `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
      const h = map.get(hex);
      if (h) return rgba(h, Number(m[4]));
    }
    return v;
  };
  const fontMap = (f: string) => (f === doc.theme.headingFont ? theme.headingFont : f === doc.theme.bodyFont ? theme.bodyFont : f);
  return {
    ...doc,
    theme: { ...theme, palette: { ...neu } },
    scenes: doc.scenes.map((s) => ({
      ...s,
      background: { ...s.background, color: c(s.background.color), colors: s.background.colors?.map(c), patternColor: s.background.patternColor ? c(s.background.patternColor) : undefined },
      layers: s.layers.map((l) => {
        switch (l.kind) {
          case 'text':
            return { ...l, color: c(l.color), emphasisColor: l.emphasisColor ? c(l.emphasisColor) : undefined, highlight: l.highlight ? { ...l.highlight, color: c(l.highlight.color) } : null, font: fontMap(l.font) as TextLayer['font'] };
          case 'icon':
            return { ...l, color: c(l.color), bg: l.bg ? { ...l.bg, color: c(l.bg.color) } : null };
          case 'component':
            return { ...l, colors: { primary: neu.primary, secondary: neu.secondary, text: neu.text, surface: neu.surface } };
          case 'shape':
            return { ...l, fill: c(l.fill), stroke: l.stroke ? { ...l.stroke, color: c(l.stroke.color) } : null };
          default:
            return l;
        }
      }),
    })),
  };
}
