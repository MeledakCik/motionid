import { clamp, hash01 } from '../easing';
import { readableOn, rgba } from '../color';
import { drawIcon } from './icons';

/**
 * Effect Pack — 34 jenis efek × variasi gaya × 3 intensitas = 370+ efek.
 * Semua partikel deterministik (posisi = fungsi waktu), jadi preview & export identik
 * dan tidak butuh state antar frame.
 */

export type EffectLayer = 'under' | 'over' | 'camera' | 'post';

export type EffectKind =
  | 'hujan'
  | 'salju'
  | 'pasir'
  | 'kaca-pecah'
  | 'confetti'
  | 'kembang-api'
  | 'bokeh'
  | 'kilau'
  | 'hati'
  | 'sakura'
  | 'daun'
  | 'bara'
  | 'kabut'
  | 'petir'
  | 'matrix'
  | 'warp'
  | 'light-leak'
  | 'film'
  | 'vhs'
  | 'crt'
  | 'vignette'
  | 'flare'
  | 'shine'
  | 'rgb'
  | 'guncang'
  | 'denyut'
  | 'gelembung'
  | 'debu'
  | 'ikon'
  | 'uang'
  | 'balon'
  | 'static'
  | 'speedline'
  | 'sinar';

export interface EffectParams {
  style: string;
  k: number;
  colors?: string[];
  /** id ikon dari Icon Pack (bawaan atau custom admin) */
  icon?: string;
  motion?: 'jatuh' | 'naik' | 'melayang';
}

export interface EffectSpec {
  id: string;
  name: string;
  group: string;
  kind: EffectKind;
  layer: EffectLayer;
  tags: string[];
  params: EffectParams;
  author?: 'builtin' | 'admin';
}

export interface EffectRef {
  id: string;
  /** pengali intensitas tambahan dari user (0.2..2) */
  amount?: number;
}

export const EFFECT_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'cuaca', label: 'Cuaca' },
  { id: 'dramatis', label: 'Dramatis' },
  { id: 'pesta', label: 'Pesta & Promo' },
  { id: 'cahaya', label: 'Cahaya' },
  { id: 'partikel', label: 'Partikel' },
  { id: 'retro', label: 'Retro & Film' },
  { id: 'kamera', label: 'Kamera' },
  { id: 'ikon', label: 'Hujan Ikon' },
  { id: 'custom', label: 'Custom Admin' },
];

const INT: Array<[string, string, number]> = [
  ['ringan', 'Ringan', 0.55],
  ['sedang', 'Sedang', 1],
  ['lebat', 'Lebat', 1.8],
];

type Def = { kind: EffectKind; label: string; group: string; layer: EffectLayer; tags: string[]; styles: Array<[string, string, Partial<EffectParams>?]> };

const DEFS: Def[] = [
  { kind: 'hujan', label: 'Hujan', group: 'cuaca', layer: 'over', tags: ['hujan', 'rain', 'galau', 'sedih'], styles: [['lurus', 'Lurus'], ['miring-kiri', 'Miring Kiri'], ['miring-kanan', 'Miring Kanan'], ['neon', 'Neon'], ['petir', '+ Petir'], ['malam', 'Malam Gelap']] },
  { kind: 'salju', label: 'Salju', group: 'cuaca', layer: 'over', tags: ['salju', 'snow', 'dingin', 'natal'], styles: [['lembut', 'Lembut'], ['badai', 'Badai'], ['kilau', 'Berkilau']] },
  { kind: 'pasir', label: 'Pasir', group: 'cuaca', layer: 'over', tags: ['pasir', 'sand', 'gurun', 'debu', 'pantai'], styles: [['badai-kanan', 'Badai ke Kanan'], ['badai-kiri', 'Badai ke Kiri'], ['jatuh', 'Pasir Jatuh'], ['gurun', 'Debu Gurun'], ['emas', 'Pasir Emas']] },
  { kind: 'kaca-pecah', label: 'Kaca Pecah', group: 'dramatis', layer: 'over', tags: ['kaca', 'pecah', 'retak', 'glass', 'shatter', 'kaget'], styles: [['tengah', 'Retak Tengah'], ['kiri-atas', 'Retak Kiri Atas'], ['kanan-bawah', 'Retak Kanan Bawah'], ['hamburan', 'Pecah Berhamburan'], ['jatuh', 'Retak + Serpihan Jatuh'], ['layar-hp', 'Layar HP Retak']] },
  { kind: 'confetti', label: 'Confetti', group: 'pesta', layer: 'over', tags: ['confetti', 'pesta', 'promo', 'selamat', 'launching'], styles: [['warna', 'Warna-warni'], ['tema', 'Warna Tema'], ['emas', 'Emas'], ['pastel', 'Pastel'], ['merah-putih', 'Merah Putih']] },
  { kind: 'kembang-api', label: 'Kembang Api', group: 'pesta', layer: 'over', tags: ['kembang api', 'fireworks', 'tahun baru', 'perayaan'], styles: [['warna', 'Warna-warni'], ['emas', 'Emas'], ['tema', 'Warna Tema'], ['malam', 'Malam Tahun Baru']] },
  { kind: 'bokeh', label: 'Bokeh', group: 'cahaya', layer: 'under', tags: ['bokeh', 'lampu', 'aesthetic'], styles: [['hangat', 'Hangat'], ['dingin', 'Dingin'], ['tema', 'Warna Tema'], ['emas', 'Emas']] },
  { kind: 'kilau', label: 'Kilau Bintang', group: 'cahaya', layer: 'over', tags: ['kilau', 'sparkle', 'glitter', 'mewah', 'skincare'], styles: [['putih', 'Putih'], ['emas', 'Emas'], ['tema', 'Warna Tema'], ['pelangi', 'Pelangi']] },
  { kind: 'hati', label: 'Hati Melayang', group: 'partikel', layer: 'over', tags: ['hati', 'cinta', 'love', 'valentine'], styles: [['merah', 'Merah'], ['pink', 'Pink'], ['tema', 'Warna Tema']] },
  { kind: 'sakura', label: 'Kelopak Sakura', group: 'partikel', layer: 'over', tags: ['sakura', 'bunga', 'kelopak', 'romantis', 'wedding'], styles: [['pink', 'Pink'], ['putih', 'Putih'], ['mawar', 'Mawar Merah']] },
  { kind: 'daun', label: 'Daun Gugur', group: 'partikel', layer: 'over', tags: ['daun', 'gugur', 'alam', 'autumn'], styles: [['oranye', 'Oranye'], ['hijau', 'Hijau'], ['coklat', 'Coklat']] },
  { kind: 'bara', label: 'Bara Api', group: 'dramatis', layer: 'over', tags: ['api', 'bara', 'pedas', 'hot', 'panas'], styles: [['oranye', 'Oranye'], ['biru', 'Biru'], ['hijau', 'Hijau Gaib']] },
  { kind: 'kabut', label: 'Kabut & Asap', group: 'cuaca', layer: 'over', tags: ['kabut', 'asap', 'fog', 'misteri', 'horor'], styles: [['putih', 'Putih'], ['gelap', 'Gelap'], ['tema', 'Warna Tema'], ['mistis', 'Mistis Ungu']] },
  { kind: 'petir', label: 'Petir', group: 'dramatis', layer: 'over', tags: ['petir', 'kilat', 'badai', 'thunder'], styles: [['biru', 'Biru'], ['putih', 'Putih'], ['ungu', 'Ungu']] },
  { kind: 'matrix', label: 'Hujan Kode', group: 'retro', layer: 'under', tags: ['matrix', 'kode', 'hacker', 'coding', 'teknologi'], styles: [['hijau', 'Hijau Matrix'], ['tema', 'Warna Tema'], ['emas', 'Emas']] },
  { kind: 'warp', label: 'Warp Bintang', group: 'kamera', layer: 'under', tags: ['bintang', 'warp', 'luar angkasa', 'cepat', 'launching'], styles: [['putih', 'Putih'], ['tema', 'Warna Tema'], ['biru', 'Hyperspace Biru']] },
  { kind: 'light-leak', label: 'Light Leak', group: 'cahaya', layer: 'over', tags: ['light leak', 'cahaya', 'film', 'vintage'], styles: [['hangat', 'Hangat'], ['sunset', 'Sunset'], ['dingin', 'Dingin'], ['pelangi', 'Pelangi']] },
  { kind: 'film', label: 'Film Grain', group: 'retro', layer: 'post', tags: ['film', 'grain', 'sinema', 'vintage'], styles: [['warna', 'Film Warna'], ['hitam-putih', 'Hitam Putih'], ['sepia', 'Sepia']] },
  { kind: 'vhs', label: 'VHS', group: 'retro', layer: 'post', tags: ['vhs', 'retro', '90an', 'kaset'], styles: [['klasik', 'Klasik'], ['rusak', 'Pita Rusak'], ['90an', 'Retro 90an']] },
  { kind: 'crt', label: 'Layar CRT', group: 'retro', layer: 'over', tags: ['crt', 'scanline', 'tv', 'retro', 'game'], styles: [['hijau', 'Hijau'], ['putih', 'Putih'], ['tema', 'Warna Tema']] },
  { kind: 'vignette', label: 'Vignette', group: 'cahaya', layer: 'over', tags: ['vignette', 'fokus', 'sinema'], styles: [['hitam', 'Hitam'], ['tema', 'Warna Tema'], ['dreamy', 'Dreamy Putih']] },
  { kind: 'flare', label: 'Lens Flare', group: 'cahaya', layer: 'over', tags: ['flare', 'matahari', 'cahaya', 'sinematik'], styles: [['hangat', 'Hangat'], ['biru', 'Biru'], ['tema', 'Warna Tema']] },
  { kind: 'shine', label: 'Kilau Sapu', group: 'cahaya', layer: 'over', tags: ['shine', 'kilap', 'produk', 'premium'], styles: [['putih', 'Putih'], ['emas', 'Emas'], ['tema', 'Warna Tema']] },
  { kind: 'rgb', label: 'RGB Split', group: 'kamera', layer: 'post', tags: ['rgb', 'chromatic', 'glitch', 'aberasi'], styles: [['pelan', 'Pelan'], ['beat', 'Ikut Beat'], ['glitch', 'Glitch']] },
  { kind: 'guncang', label: 'Guncang Kamera', group: 'kamera', layer: 'camera', tags: ['guncang', 'shake', 'gempa', 'impact'], styles: [['halus', 'Handheld Halus'], ['beat', 'Ikut Beat'], ['gempa', 'Gempa']] },
  { kind: 'denyut', label: 'Zoom Denyut', group: 'kamera', layer: 'camera', tags: ['zoom', 'beat', 'denyut', 'pulse'], styles: [['pelan', 'Pelan'], ['beat', 'Ikut Beat'], ['cepat', 'Cepat']] },
  { kind: 'gelembung', label: 'Gelembung', group: 'partikel', layer: 'over', tags: ['gelembung', 'bubble', 'sabun', 'segar', 'laundry'], styles: [['air', 'Air'], ['pelangi', 'Sabun Pelangi'], ['tema', 'Warna Tema']] },
  { kind: 'debu', label: 'Debu Cahaya', group: 'partikel', layer: 'over', tags: ['debu', 'partikel', 'emas', 'magis'], styles: [['emas', 'Emas'], ['putih', 'Putih'], ['tema', 'Warna Tema']] },
  { kind: 'ikon', label: 'Hujan Ikon', group: 'ikon', layer: 'over', tags: ['ikon', 'paralaks', 'lucu', 'viral'], styles: [['api', 'Api', { icon: 'flame' }], ['uang', 'Uang', { icon: 'banknote' }], ['hati', 'Hati', { icon: 'heart' }], ['bintang', 'Bintang', { icon: 'star' }], ['pesta', 'Pesta', { icon: 'party-popper', motion: 'naik' }], ['jempol', 'Jempol', { icon: 'thumbs-up', motion: 'naik' }], ['kopi', 'Kopi', { icon: 'coffee', motion: 'melayang' }], ['makanan', 'Makanan', { icon: 'soup', motion: 'melayang' }], ['kilat', 'Kilat', { icon: 'zap' }], ['hadiah', 'Hadiah', { icon: 'gift', motion: 'naik' }]] },
  { kind: 'uang', label: 'Hujan Cuan', group: 'pesta', layer: 'over', tags: ['uang', 'koin', 'cuan', 'diskon', 'gajian'], styles: [['koin', 'Koin Emas'], ['kertas', 'Uang Kertas'], ['berlian', 'Berlian']] },
  { kind: 'balon', label: 'Balon', group: 'pesta', layer: 'over', tags: ['balon', 'ulang tahun', 'pesta', 'anak'], styles: [['warna', 'Warna-warni'], ['tema', 'Warna Tema'], ['merah-putih', 'Merah Putih']] },
  { kind: 'static', label: 'TV Static', group: 'retro', layer: 'over', tags: ['static', 'noise', 'tv', 'horor', 'glitch'], styles: [['ringan', 'Bersemut'], ['rusak', 'Sinyal Rusak'], ['glitch', 'Glitch Blok']] },
  { kind: 'speedline', label: 'Garis Kecepatan', group: 'dramatis', layer: 'over', tags: ['anime', 'speed', 'kecepatan', 'kaget', 'fokus'], styles: [['putih', 'Putih'], ['hitam', 'Hitam'], ['tema', 'Warna Tema']] },
  { kind: 'sinar', label: 'Sinar Berputar', group: 'cahaya', layer: 'under', tags: ['sinar', 'rays', 'promo', 'juara'], styles: [['putih', 'Putih'], ['emas', 'Emas'], ['tema', 'Warna Tema']] },
];

function build(): EffectSpec[] {
  const out: EffectSpec[] = [];
  for (const d of DEFS)
    for (const [sk, sl, extra] of d.styles)
      for (const [ik, il, k] of INT)
        out.push({
          id: `${d.kind}-${sk}-${ik}`,
          name: `${d.label} ${sl} · ${il}`,
          group: d.group,
          kind: d.kind,
          layer: d.layer,
          tags: [...d.tags, sk],
          params: { style: sk, k, ...(extra || {}) },
          author: 'builtin',
        });
  return out;
}

const LIB = build();
const BY_ID = new Map(LIB.map((e) => [e.id, e]));

export function allEffects(): EffectSpec[] {
  return LIB;
}
const ALIAS: Record<string, string> = { ngakak: 'bintang', mie: 'makanan', seratus: 'kilat' };
export function getEffect(id?: string): EffectSpec | undefined {
  if (!id) return undefined;
  const hit = BY_ID.get(id);
  if (hit || !id.startsWith('emoji-')) return hit;
  // proyek lama yang masih memakai efek emoji → ikon
  const [, style, lvl] = id.split('-');
  return BY_ID.get(`ikon-${ALIAS[style] || style}-${lvl}`);
}
export function registerEffect(e: EffectSpec) {
  const i = LIB.findIndex((x) => x.id === e.id);
  if (i >= 0) LIB[i] = e;
  else LIB.push(e);
  BY_ID.set(e.id, e);
}
export function unregisterEffect(id: string) {
  const i = LIB.findIndex((x) => x.id === id);
  if (i >= 0) LIB.splice(i, 1);
  BY_ID.delete(id);
}
export const effectKinds = () => DEFS.map((d) => ({ kind: d.kind, label: d.label, layer: d.layer, styles: d.styles.map((s) => s[0]) }));

/** Cari efek yang cocok dengan kata kunci prompt. */
export function suggestEffects(words: string[], mood: string, intent: string): string[] {
  const w = words.join(' ').toLowerCase();
  const pick: string[] = [];
  const has = (...k: string[]) => k.some((x) => w.includes(x));
  if (has('hujan', 'gerimis')) pick.push('hujan-miring-kiri-sedang');
  if (has('salju', 'natal', 'dingin')) pick.push('salju-lembut-sedang');
  if (has('pasir', 'gurun', 'pantai')) pick.push('pasir-badai-kanan-ringan');
  if (has('pecah', 'kaca', 'retak', 'hancur', 'shock', 'kaget')) pick.push('kaca-pecah-tengah-sedang');
  if (has('tahun baru', 'kembang api', 'merdeka', 'perayaan')) pick.push('kembang-api-warna-sedang');
  if (has('pedas', 'api', 'hot', 'seblak', 'geprek')) pick.push('bara-oranye-sedang');
  if (has('cinta', 'valentine', 'pacar', 'wedding', 'nikah')) pick.push('sakura-pink-ringan');
  if (has('coding', 'hacker', 'program', 'developer', 'nextjs')) pick.push('matrix-hijau-ringan');
  if (has('kopi', 'cafe', 'kafe')) pick.push('ikon-kopi-ringan');
  if (has('cuan', 'uang', 'gaji', 'investasi', 'diskon')) pick.push('uang-koin-ringan');
  if (has('skincare', 'glowing', 'mewah', 'premium', 'emas')) pick.push('kilau-emas-sedang');
  if (has('horor', 'misteri', 'seram')) pick.push('kabut-gelap-sedang');
  if (!pick.length) {
    if (mood === 'galau') pick.push('hujan-malam-ringan');
    else if (intent === 'flash-sale') pick.push('confetti-tema-sedang');
    else if (intent === 'launching' || intent === 'ucapan') pick.push('confetti-warna-sedang');
    else if (mood === 'mewah') pick.push('debu-emas-sedang');
    else if (mood === 'tenang' || mood === 'hangat') pick.push('bokeh-hangat-ringan');
  }
  return pick.filter((p) => BY_ID.has(p));
}

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */
export interface EffectCtx {
  W: number;
  H: number;
  t: number;
  dur: number;
  primary: string;
  secondary: string;
  ps: number;
  allowBlur: boolean;
}

const RAINBOW = ['#FF5E5E', '#FFB547', '#FFE24D', '#4ADE80', '#38BDF8', '#A78BFA', '#F472B6'];
const fr = (x: number) => x - Math.floor(x);

function confettiColors(style: string, c: EffectCtx): string[] {
  switch (style) {
    case 'tema':
      return [c.primary, c.secondary, '#FFFFFF'];
    case 'emas':
      return ['#FFD45E', '#E6A93A', '#FFF1B8', '#B8862B'];
    case 'pastel':
      return ['#FBCFE8', '#BFDBFE', '#BBF7D0', '#FEF08A', '#DDD6FE'];
    case 'merah-putih':
      return ['#E11D2A', '#FFFFFF'];
    default:
      return RAINBOW;
  }
}

function heartPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.9, -s * 0.3, -s * 0.4, -s * 0.95, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.4, -s * 0.95, s * 0.9, -s * 0.3, 0, s * 0.3);
  ctx.closePath();
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, seed: number, spread: number) {
  ctx.beginPath();
  ctx.moveTo(x, y0);
  let cx = x;
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    cx += (hash01(i, seed) - 0.5) * spread;
    ctx.lineTo(cx, y0 + ((y1 - y0) * i) / steps);
  }
}

let noiseCanvas: HTMLCanvasElement | null = null;
function noiseTex(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d')!;
  const d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.floor(hash01(i, 77) * 255);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  noiseCanvas = c;
  return c;
}

const scratch: Record<string, HTMLCanvasElement> = {};
function scr(key: string, w: number, h: number) {
  let c = scratch[key];
  if (!c) c = scratch[key] = document.createElement('canvas');
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c;
}

/** Transform kamera (dipanggil sebelum menggambar latar & layer). */
export function cameraTransform(spec: EffectSpec, c: EffectCtx, amount = 1): { x: number; y: number; s: number; r: number } {
  const k = spec.params.k * amount;
  const { t } = c;
  const beat = 60 / 120;
  if (spec.kind === 'guncang') {
    const st = spec.params.style;
    const a = st === 'gempa' ? 26 : st === 'beat' ? 14 : 6;
    const env = st === 'beat' ? Math.exp(-((t % beat) / beat) * 5) : 1;
    const f = st === 'halus' ? 1.3 : 9;
    return { x: Math.sin(t * f * 2.1) * a * k * env + Math.sin(t * f * 5.3) * a * 0.3 * k, y: Math.cos(t * f * 1.7) * a * k * env, s: 1 + 0.03 * k, r: Math.sin(t * f) * 0.006 * k * env };
  }
  if (spec.kind === 'denyut') {
    const st = spec.params.style;
    if (st === 'pelan') return { x: 0, y: 0, s: 1 + 0.04 * k * (0.5 + 0.5 * Math.sin(t * 1.5)), r: 0 };
    const per = st === 'cepat' ? beat / 2 : beat;
    const env = Math.exp(-((t % per) / per) * 6);
    return { x: 0, y: 0, s: 1 + 0.06 * k * env, r: 0 };
  }
  return { x: 0, y: 0, s: 1, r: 0 };
}

/** Efek pasca-proses (butuh membaca isi kanvas) — dipanggil dalam ruang piksel. */
export function drawPostEffect(ctx: CanvasRenderingContext2D, spec: EffectSpec, c: EffectCtx, pw: number, ph: number, amount = 1) {
  const k = spec.params.k * amount;
  const st = spec.params.style;
  const { t } = c;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = pw / 1080;
  if (spec.kind === 'rgb' || spec.kind === 'vhs') {
    let off = 0;
    if (spec.kind === 'vhs') off = (st === 'rusak' ? 7 : 4) * k;
    else if (st === 'pelan') off = 6 * k * (0.6 + 0.4 * Math.sin(t * 2));
    else if (st === 'beat') off = 14 * k * Math.exp(-((t % 0.5) / 0.5) * 5);
    else off = hash01(Math.floor(t * 12), 3) > 0.6 ? 22 * k * hash01(Math.floor(t * 12), 5) : 2 * k;
    off *= u;
    if (off > 0.6) {
      const src = scr('rgb-src', pw, ph);
      const sx = src.getContext('2d')!;
      sx.globalCompositeOperation = 'copy';
      sx.drawImage(ctx.canvas, 0, 0);
      const r = scr('rgb-r', pw, ph);
      const rx = r.getContext('2d')!;
      rx.globalCompositeOperation = 'copy';
      rx.drawImage(src, 0, 0);
      rx.globalCompositeOperation = 'multiply';
      rx.fillStyle = '#FF0000';
      rx.fillRect(0, 0, pw, ph);
      const g = scr('rgb-g', pw, ph);
      const gx = g.getContext('2d')!;
      gx.globalCompositeOperation = 'copy';
      gx.drawImage(src, 0, 0);
      gx.globalCompositeOperation = 'multiply';
      gx.fillStyle = '#00FFFF';
      gx.fillRect(0, 0, pw, ph);
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(g, -off, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(r, off, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  if (spec.kind === 'vhs') {
    // garis scan + pita tracking + teks PLAY
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < ph; y += Math.max(2, 4 * u)) ctx.fillRect(0, y, pw, Math.max(1, 1.5 * u));
    const bandY = fr(t * 0.23) * ph * 1.3 - ph * 0.15;
    const bh = (st === 'rusak' ? 90 : 40) * u * k;
    const src = scr('vhs', pw, ph);
    const sx = src.getContext('2d')!;
    sx.globalCompositeOperation = 'copy';
    sx.drawImage(ctx.canvas, 0, 0);
    for (let i = 0; i < 6; i++) {
      const y = bandY + (i * bh) / 6;
      ctx.drawImage(src, 0, y, pw, bh / 6, (hash01(i, Math.floor(t * 20)) - 0.5) * 30 * u * k, y, pw, bh / 6);
    }
    ctx.fillStyle = `rgba(255,255,255,${0.06 * k})`;
    ctx.fillRect(0, bandY, pw, bh);
    if (st === '90an') {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(255,120,200,0.18)';
      ctx.fillRect(0, 0, pw, ph);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.font = `700 ${34 * u}px monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textBaseline = 'top';
    ctx.fillText('PLAY ▶', 40 * u, 40 * u);
    const sec = Math.floor(t);
    ctx.fillText(`00:00:${String(sec).padStart(2, '0')}`, 40 * u, ph - 90 * u);
  }
  if (spec.kind === 'film') {
    if (st === 'hitam-putih' || st === 'sepia') {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, pw, ph);
      if (st === 'sepia') {
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#A0703C';
        ctx.fillRect(0, 0, pw, ph);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    const n = noiseTex();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.18 * k;
    const ox = Math.floor(hash01(Math.floor(t * 24), 1) * 160);
    const oy = Math.floor(hash01(Math.floor(t * 24), 2) * 160);
    const pat = ctx.createPattern(n, 'repeat');
    if (pat) {
      ctx.translate(-ox, -oy);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, pw + 320, ph + 320);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // goresan & flicker
    if (hash01(Math.floor(t * 8), 9) > 0.55) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = Math.max(1, 2 * u);
      const x = hash01(Math.floor(t * 8), 4) * pw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 6 * u, ph);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(0,0,0,${0.05 * k * hash01(Math.floor(t * 15), 6)})`;
    ctx.fillRect(0, 0, pw, ph);
  }
  ctx.restore();
}

/** Efek lapisan (dipanggil di ruang unit dasar, setelah setTransform ke skala kanvas). */
export function drawEffect(ctx: CanvasRenderingContext2D, spec: EffectSpec, c: EffectCtx, amount = 1) {
  const { W, H, t, primary, secondary } = c;
  const k = spec.params.k * amount;
  const st = spec.params.style;
  const n = (base: number) => Math.max(1, Math.round(base * k * c.ps));
  ctx.save();
  switch (spec.kind) {
    case 'hujan': {
      const slant = st === 'miring-kiri' ? -0.28 : st === 'miring-kanan' ? 0.28 : st === 'lurus' || st === 'neon' ? 0 : 0.12;
      if (st === 'malam' || st === 'petir') {
        ctx.fillStyle = `rgba(5,10,25,${0.28 * Math.min(1.4, k)})`;
        ctx.fillRect(0, 0, W, H);
      }
      const col = st === 'neon' ? primary : '#CFE3FF';
      ctx.strokeStyle = rgba(col, st === 'neon' ? 0.7 : 0.45);
      ctx.lineCap = 'round';
      const count = n(160);
      for (let i = 0; i < count; i++) {
        const sp = 1.6 + hash01(i, 2) * 1.4;
        const y = fr(hash01(i, 3) + t * sp * 0.9) * (H + 300) - 150;
        const x = (hash01(i, 1) * (W + 600) - 300 + slant * y + t * slant * 400) % (W + 600);
        const len = 40 + hash01(i, 4) * 70;
        ctx.lineWidth = 1.5 + hash01(i, 5) * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + slant * len, y + len);
        ctx.stroke();
      }
      // cipratan
      ctx.strokeStyle = rgba(col, 0.35);
      for (let i = 0; i < n(18); i++) {
        const ph = fr(t * 2 + hash01(i, 8));
        const x = hash01(i, 9) * W;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, H - 40 - hash01(i, 10) * 120, 6 + ph * 26, 2 + ph * 6, 0, 0, Math.PI * 2);
        ctx.globalAlpha = 1 - ph;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (st === 'petir') drawLightning(ctx, c, '#DDE8FF', 0.7 * k, 1);
      break;
    }
    case 'salju': {
      for (let i = 0; i < n(st === 'badai' ? 170 : 90); i++) {
        const sp = st === 'badai' ? 0.35 + hash01(i, 2) * 0.3 : 0.1 + hash01(i, 2) * 0.12;
        const y = fr(hash01(i, 3) + t * sp) * (H + 60) - 30;
        const wind = st === 'badai' ? t * 260 : 0;
        const x = (((hash01(i, 1) * W + Math.sin(t * 1.3 + i) * 30 + wind) % W) + W) % W;
        const r = 3 + hash01(i, 4) * 8;
        ctx.globalAlpha = 0.5 + hash01(i, 5) * 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (st === 'kilau' && hash01(i, 6) > 0.7) {
          const tw = 0.5 + 0.5 * Math.sin(t * 6 + i);
          ctx.strokeStyle = `rgba(255,255,255,${tw})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - r * 2.5, y);
          ctx.lineTo(x + r * 2.5, y);
          ctx.moveTo(x, y - r * 2.5);
          ctx.lineTo(x, y + r * 2.5);
          ctx.stroke();
        }
      }
      break;
    }
    case 'pasir': {
      const sand = st === 'emas' ? '#FFD36E' : '#D9B27A';
      if (st === 'gurun' || st.startsWith('badai')) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgba(sand, 0.06 * k));
        g.addColorStop(1, rgba(sand, 0.28 * k));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      if (st === 'jatuh') {
        // aliran pasir dari atas seperti jam pasir
        for (let s = 0; s < 3; s++) {
          const sx = W * (0.25 + s * 0.25) + Math.sin(t + s) * 20;
          for (let i = 0; i < n(110); i++) {
            const y = fr(hash01(i, s + 1) + t * (0.6 + hash01(i, 7) * 0.4)) * H;
            const x = sx + (hash01(i, s + 11) - 0.5) * (10 + (y / H) * 60);
            ctx.fillStyle = rgba(sand, 0.6 + hash01(i, 3) * 0.4);
            ctx.fillRect(x, y, 3, 3);
          }
          ctx.fillStyle = rgba(sand, 0.85);
          ctx.beginPath();
          ctx.ellipse(sx, H + 20, 160 + fr(t * 0.1) * 40, 70, 0, Math.PI, 0);
          ctx.fill();
        }
        break;
      }
      const dir = st === 'badai-kiri' ? -1 : 1;
      const count = n(st === 'gurun' ? 140 : 260);
      for (let i = 0; i < count; i++) {
        const sp = 0.5 + hash01(i, 2) * 0.9;
        const xr = fr(hash01(i, 1) + t * sp * (st === 'gurun' ? 0.25 : 0.7));
        const x = dir > 0 ? xr * (W + 200) - 100 : W + 100 - xr * (W + 200);
        const y = hash01(i, 3) * H + Math.sin(t * 3 + i) * 12 + xr * 40;
        const len = st === 'gurun' ? 4 : 10 + sp * 26;
        ctx.strokeStyle = rgba(sand, 0.35 + hash01(i, 4) * 0.5);
        ctx.lineWidth = 1.5 + hash01(i, 5) * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dir * len, y - len * 0.08);
        ctx.stroke();
        if (st === 'emas' && hash01(i, 6) > 0.92) {
          ctx.fillStyle = `rgba(255,250,220,${0.5 + 0.5 * Math.sin(t * 8 + i)})`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'kaca-pecah':
      drawShatter(ctx, c, st, k);
      break;
    case 'confetti': {
      const cols = confettiColors(st, c);
      for (let i = 0; i < n(90); i++) {
        const sp = 0.18 + hash01(i, 2) * 0.22;
        const y = fr(hash01(i, 3) + t * sp) * (H + 100) - 50;
        const x = hash01(i, 1) * W + Math.sin(t * 2 + i) * 40;
        const rot = t * (2 + hash01(i, 4) * 6) + i;
        const w = 14 + hash01(i, 5) * 16;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, Math.cos(rot * 1.7));
        ctx.fillStyle = cols[i % cols.length];
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, w / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-w / 2, -w / 4, w, w / 2);
        ctx.restore();
      }
      break;
    }
    case 'kembang-api': {
      if (st === 'malam') {
        ctx.fillStyle = 'rgba(2,4,20,0.35)';
        ctx.fillRect(0, 0, W, H);
      }
      const cols = st === 'emas' ? ['#FFD45E', '#FFF1B8', '#FFB547'] : st === 'tema' ? [primary, secondary, '#FFFFFF'] : RAINBOW;
      ctx.globalCompositeOperation = 'lighter';
      const bursts = Math.max(1, Math.round(3 * k));
      for (let b = 0; b < bursts; b++) {
        const per = 1.6 + hash01(b, 1) * 0.8;
        const tt = t + hash01(b, 2) * per;
        const idx = Math.floor(tt / per);
        const age = tt % per;
        const cx = W * (0.15 + hash01(idx * 7 + b, 3) * 0.7);
        const cy = H * (0.12 + hash01(idx * 7 + b, 4) * 0.35);
        const col = cols[(idx + b) % cols.length];
        if (age < 0.35) {
          ctx.strokeStyle = rgba(col, 0.8);
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, H);
          ctx.lineTo(cx, H - (H - cy) * (age / 0.35));
          ctx.stroke();
          continue;
        }
        const a = age - 0.35;
        const life = per - 0.35;
        const P = Math.round(36 * c.ps) + 8;
        for (let i = 0; i < P; i++) {
          const ang = (i / P) * Math.PI * 2;
          const v = 260 + hash01(i, b + idx) * 160;
          const x = cx + Math.cos(ang) * v * a;
          const y = cy + Math.sin(ang) * v * a + 160 * a * a;
          ctx.fillStyle = rgba(col, clamp(1 - a / life));
          ctx.beginPath();
          ctx.arc(x, y, 5 * (1 - a / life) + 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'bokeh': {
      const cols = st === 'dingin' ? ['#7DD3FC', '#C4B5FD', '#FFFFFF'] : st === 'tema' ? [primary, secondary] : st === 'emas' ? ['#FFD45E', '#FFB547'] : ['#FFB547', '#FF8A5C', '#FFE2B8'];
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < n(22); i++) {
        const r = 30 + hash01(i, 2) * 90;
        const x = hash01(i, 1) * W + Math.sin(t * 0.3 + i) * 50;
        const y = hash01(i, 3) * H + Math.cos(t * 0.25 + i * 2) * 60;
        const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
        const col = cols[i % cols.length];
        const a = 0.18 + 0.12 * Math.sin(t * 1.5 + i);
        g.addColorStop(0, rgba(col, a));
        g.addColorStop(0.9, rgba(col, a * 1.4));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'kilau':
    case 'debu': {
      const cols = st === 'emas' ? ['#FFE08A', '#FFC531'] : st === 'tema' ? [primary, secondary, '#FFFFFF'] : st === 'pelangi' ? RAINBOW : ['#FFFFFF'];
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n(spec.kind === 'debu' ? 70 : 40); i++) {
        const x = hash01(i, 1) * W + (spec.kind === 'debu' ? Math.sin(t * 0.5 + i) * 40 : 0);
        const y = spec.kind === 'debu' ? fr(hash01(i, 3) - t * (0.02 + hash01(i, 2) * 0.04)) * H : hash01(i, 3) * H;
        const tw = Math.max(0, Math.sin(t * (2 + hash01(i, 4) * 3) + i * 3));
        const col = cols[i % cols.length];
        if (spec.kind === 'debu') {
          const r = 2 + hash01(i, 5) * 5;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
          g.addColorStop(0, rgba(col, 0.7 * (0.4 + tw * 0.6)));
          g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g;
          ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
        } else {
          const s = (10 + hash01(i, 5) * 26) * tw;
          if (s < 1) continue;
          ctx.fillStyle = rgba(col, 0.9 * tw);
          ctx.beginPath();
          ctx.moveTo(x, y - s);
          ctx.quadraticCurveTo(x, y, x + s, y);
          ctx.quadraticCurveTo(x, y, x, y + s);
          ctx.quadraticCurveTo(x, y, x - s, y);
          ctx.quadraticCurveTo(x, y, x, y - s);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'hati':
    case 'gelembung':
    case 'balon': {
      const count = n(spec.kind === 'balon' ? 14 : 26);
      for (let i = 0; i < count; i++) {
        const sp = 0.07 + hash01(i, 2) * 0.1;
        const y = H + 120 - fr(hash01(i, 3) + t * sp) * (H + 260);
        const x = hash01(i, 1) * W + Math.sin(t * 1.2 + i) * 35;
        const s = (spec.kind === 'balon' ? 70 : 24) + hash01(i, 4) * (spec.kind === 'balon' ? 40 : 34);
        ctx.save();
        ctx.translate(x, y);
        if (spec.kind === 'hati') {
          const col = st === 'pink' ? '#F472B6' : st === 'tema' ? (i % 2 ? primary : secondary) : '#EF4444';
          ctx.rotate(Math.sin(t * 2 + i) * 0.25);
          heartPath(ctx, s);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = col;
          ctx.fill();
        } else if (spec.kind === 'gelembung') {
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          const col = st === 'tema' ? primary : '#BFE9FF';
          if (st === 'pelangi') {
            const g = ctx.createLinearGradient(-s, -s, s, s);
            RAINBOW.forEach((cc, j) => g.addColorStop(j / (RAINBOW.length - 1), rgba(cc, 0.35)));
            ctx.strokeStyle = g;
          } else ctx.strokeStyle = rgba(col, 0.6);
          ctx.lineWidth = 3;
          ctx.fillStyle = rgba(col, 0.08);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath();
          ctx.ellipse(-s * 0.35, -s * 0.4, s * 0.18, s * 0.1, -0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const cols = st === 'tema' ? [primary, secondary] : st === 'merah-putih' ? ['#E11D2A', '#F5F5F5'] : RAINBOW;
          ctx.rotate(Math.sin(t * 1.5 + i) * 0.12);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.6);
          ctx.quadraticCurveTo(10, s * 1.2, 0, s * 1.9);
          ctx.stroke();
          ctx.fillStyle = cols[i % cols.length];
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.45, s * 0.58, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.ellipse(-s * 0.16, -s * 0.22, s * 0.08, s * 0.15, -0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      break;
    }
    case 'sakura':
    case 'daun': {
      const cols =
        spec.kind === 'sakura'
          ? st === 'putih'
            ? ['#FFFFFF', '#FCE7F3']
            : st === 'mawar'
            ? ['#BE123C', '#E11D48']
            : ['#F9A8D4', '#FBCFE8', '#F472B6']
          : st === 'hijau'
          ? ['#4ADE80', '#22C55E']
          : st === 'coklat'
          ? ['#A16207', '#78350F']
          : ['#F97316', '#FB923C', '#EAB308'];
      for (let i = 0; i < n(40); i++) {
        const sp = 0.08 + hash01(i, 2) * 0.1;
        const y = fr(hash01(i, 3) + t * sp) * (H + 100) - 50;
        const x = (hash01(i, 1) * W + Math.sin(t * 1.1 + i) * 70 + t * 40) % (W + 60);
        const s = (spec.kind === 'daun' ? 26 : 16) + hash01(i, 4) * 14;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (1 + hash01(i, 5)) + i);
        ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(t * 2 + i)));
        ctx.fillStyle = cols[i % cols.length];
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.8, 0, 0, s);
        ctx.quadraticCurveTo(-s * 0.8, 0, 0, -s);
        ctx.fill();
        if (spec.kind === 'daun') {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }
    case 'bara': {
      const col = st === 'biru' ? '#60A5FA' : st === 'hijau' ? '#4ADE80' : '#FF7A1A';
      const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(1, rgba(col, 0.25 * k));
      ctx.fillStyle = g;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n(70); i++) {
        const sp = 0.12 + hash01(i, 2) * 0.2;
        const lf = fr(hash01(i, 3) + t * sp);
        const y = H + 20 - lf * H * 0.95;
        const x = hash01(i, 1) * W + Math.sin(t * 3 + i) * 25 + lf * 60;
        const r = (2 + hash01(i, 4) * 5) * (1 - lf * 0.6);
        const a = (1 - lf) * (0.6 + 0.4 * Math.sin(t * 12 + i));
        const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        gg.addColorStop(0, rgba('#FFF4D6', a));
        gg.addColorStop(0.3, rgba(col, a * 0.8));
        gg.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'kabut': {
      const col = st === 'gelap' ? '#0A0A0A' : st === 'tema' ? primary : st === 'mistis' ? '#7C3AED' : '#FFFFFF';
      for (let i = 0; i < n(10); i++) {
        const r = 300 + hash01(i, 2) * 350;
        const x = ((hash01(i, 1) * (W + 2 * r) + t * (20 + hash01(i, 4) * 40)) % (W + 2 * r)) - r;
        const y = H * (0.3 + hash01(i, 3) * 0.75);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(col, 0.22 * Math.min(1.3, k)));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      break;
    }
    case 'petir':
      drawLightning(ctx, c, st === 'ungu' ? '#C4B5FD' : st === 'putih' ? '#FFFFFF' : '#93C5FD', k, 2.2 / Math.max(0.6, k));
      break;
    case 'matrix': {
      const col = st === 'tema' ? primary : st === 'emas' ? '#FFD45E' : '#22FF88';
      const size = 34;
      const cols = Math.ceil(W / size);
      ctx.font = `700 ${size}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const glyphs = 'アイウエオカキクケコサシスセソ0123456789ABCDEF$#@';
      for (let ci = 0; ci < cols; ci++) {
        if (hash01(ci, 9) > 0.35 + 0.45 * Math.min(1, k)) continue;
        const sp = 0.25 + hash01(ci, 1) * 0.45;
        const head = fr(hash01(ci, 2) + t * sp) * (H * 1.5);
        const trail = 14;
        for (let j = 0; j < trail; j++) {
          const y = head - j * size;
          if (y < -size || y > H) continue;
          const g = glyphs[Math.floor(hash01(ci * 31 + j, Math.floor(t * 8)) * glyphs.length)];
          ctx.fillStyle = j === 0 ? '#EFFFF5' : rgba(col, 0.55 * (1 - j / trail));
          ctx.fillText(g, ci * size + size / 2, y);
        }
      }
      break;
    }
    case 'warp': {
      const col = st === 'tema' ? primary : st === 'biru' ? '#93C5FD' : '#FFFFFF';
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      const cx = W / 2;
      const cy = H / 2;
      for (let i = 0; i < n(130); i++) {
        const ang = hash01(i, 1) * Math.PI * 2;
        const z = fr(hash01(i, 2) + t * (0.35 + hash01(i, 3) * 0.3));
        const d0 = Math.pow(z, 2.2) * H * 0.9;
        const d1 = Math.pow(Math.max(0, z - 0.06), 2.2) * H * 0.9;
        ctx.globalAlpha = clamp(z * 1.5);
        ctx.lineWidth = 1 + z * 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * d1, cy + Math.sin(ang) * d1);
        ctx.lineTo(cx + Math.cos(ang) * d0, cy + Math.sin(ang) * d0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'light-leak': {
      const cols = st === 'dingin' ? ['#38BDF8', '#A78BFA'] : st === 'sunset' ? ['#FF5E3A', '#FFB547', '#F472B6'] : st === 'pelangi' ? RAINBOW : ['#FF9A3D', '#FFD27A'];
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const x = W * (0.5 + 0.7 * Math.sin(t * 0.35 + i * 2.1));
        const y = H * (0.5 + 0.6 * Math.cos(t * 0.28 + i * 1.7));
        const r = H * (0.35 + 0.15 * Math.sin(t * 0.5 + i));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(cols[i % cols.length], 0.45 * Math.min(1.2, k)));
        g.addColorStop(1, rgba(cols[i % cols.length], 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'crt': {
      const col = st === 'hijau' ? '#22FF88' : st === 'tema' ? primary : '#FFFFFF';
      ctx.fillStyle = `rgba(0,0,0,${0.22 * Math.min(1.5, k)})`;
      for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2.5);
      const by = fr(t * 0.4) * (H + 300) - 150;
      const g = ctx.createLinearGradient(0, by - 120, 0, by + 120);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.5, rgba(col, 0.1 * k));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, by - 120, W, 240);
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = rgba(col, 0.08 * k);
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      vignette(ctx, W, H, '#000000', 0.5);
      break;
    }
    case 'vignette': {
      const col = st === 'tema' ? primary : st === 'dreamy' ? '#FFFFFF' : '#000000';
      vignette(ctx, W, H, col, Math.min(0.95, 0.5 * k));
      break;
    }
    case 'flare': {
      const col = st === 'biru' ? '#7DD3FC' : st === 'tema' ? primary : '#FFC26E';
      const sx = W * (0.15 + 0.7 * fr(t * 0.08));
      const sy = H * 0.15;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 380);
      g.addColorStop(0, rgba('#FFFFFF', 0.7 * Math.min(1, k)));
      g.addColorStop(0.15, rgba(col, 0.45 * Math.min(1, k)));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(sx - 380, sy - 380, 760, 760);
      const dx = W / 2 - sx;
      const dy = H / 2 - sy;
      [0.4, 0.7, 1.1, 1.4, 1.8].forEach((f, i) => {
        const x = sx + dx * f;
        const y = sy + dy * f;
        const r = [40, 90, 30, 120, 60][i];
        ctx.fillStyle = rgba(i % 2 ? col : '#FFFFFF', 0.12 * k);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'shine': {
      const col = st === 'emas' ? '#FFE7A3' : st === 'tema' ? primary : '#FFFFFF';
      const per = 2.4 / Math.max(0.6, k);
      const p = fr(t / per);
      const x = -W * 0.5 + p * W * 2.2;
      ctx.globalCompositeOperation = 'overlay';
      ctx.translate(x, 0);
      ctx.transform(1, 0, -0.45, 1, 0, 0);
      const g = ctx.createLinearGradient(-140, 0, 140, 0);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.5, rgba(col, 0.75));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-140, -100, 280, H * 1.5);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'ikon': {
      // hujan ikon paralaks: 3 lapis kedalaman (jauh kecil & pelan, dekat besar & cepat)
      const icon = spec.params.icon || 'sparkles';
      const motion = spec.params.motion || 'jatuh';
      const count = n(24);
      for (let i = 0; i < count; i++) {
        const z = [0.45, 0.7, 1][i % 3];
        const sp = (0.08 + hash01(i, 2) * 0.08) * (0.5 + z);
        const ph = fr(hash01(i, 3) + t * sp);
        const y = motion === 'naik' ? H + 120 - ph * (H + 240) : motion === 'melayang' ? hash01(i, 3) * H + Math.sin(t * 0.8 + i) * 60 * z : ph * (H + 240) - 120;
        const x = (hash01(i, 1) * W + Math.sin(t * (0.9 + z) + i) * 40 * z + (motion === 'melayang' ? t * 30 * z : 0)) % (W + 60);
        const s = (46 + hash01(i, 4) * 40) * (0.6 + z * 0.8);
        const col = i % 2 ? secondary : primary;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.65 * z;
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 1.6 + i) * 0.35 * z);
        if (z === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.shadowColor = rgba(col, 0.6);
          ctx.shadowBlur = c.allowBlur ? 24 : 0;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          drawIcon(ctx, icon, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72, readableOn(col), 2.4);
        } else {
          drawIcon(ctx, icon, -s / 2, -s / 2, s, s, col, 2);
        }
        ctx.restore();
      }
      break;
    }
    case 'uang': {
      for (let i = 0; i < n(30); i++) {
        const sp = 0.14 + hash01(i, 2) * 0.16;
        const y = fr(hash01(i, 3) + t * sp) * (H + 200) - 100;
        const x = hash01(i, 1) * W + Math.sin(t * 1.4 + i) * 40;
        const s = 34 + hash01(i, 4) * 26;
        ctx.save();
        ctx.translate(x, y);
        const spin = Math.cos(t * 4 + i);
        if (st === 'kertas') {
          ctx.rotate(Math.sin(t * 2 + i) * 0.6);
          ctx.scale(1, 0.4 + 0.6 * Math.abs(spin));
          ctx.fillStyle = '#4C9A5B';
          ctx.fillRect(-s, -s * 0.5, s * 2, s);
          ctx.strokeStyle = '#2F6B3B';
          ctx.lineWidth = 3;
          ctx.strokeRect(-s * 0.85, -s * 0.38, s * 1.7, s * 0.76);
          ctx.fillStyle = '#E8F5E9';
          ctx.font = `800 ${s * 0.5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Rp', 0, 2);
        } else if (st === 'berlian') {
          ctx.scale(0.4 + 0.6 * Math.abs(spin), 1);
          ctx.fillStyle = '#7DD3FC';
          ctx.beginPath();
          ctx.moveTo(-s * 0.7, -s * 0.2);
          ctx.lineTo(-s * 0.35, -s * 0.6);
          ctx.lineTo(s * 0.35, -s * 0.6);
          ctx.lineTo(s * 0.7, -s * 0.2);
          ctx.lineTo(0, s * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(-s * 0.35, -s * 0.6);
          ctx.lineTo(0, -s * 0.2);
          ctx.lineTo(-s * 0.7, -s * 0.2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.scale(Math.max(0.08, Math.abs(spin)), 1);
          ctx.fillStyle = '#E6A93A';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFD45E';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#B8862B';
          ctx.font = `900 ${s * 0.5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 2);
        }
        ctx.restore();
      }
      break;
    }
    case 'static': {
      const nn = noiseTex();
      const a = st === 'ringan' ? 0.12 : st === 'rusak' ? 0.3 : 0.18;
      ctx.globalAlpha = Math.min(0.9, a * k * (st === 'rusak' ? 0.6 + 0.6 * hash01(Math.floor(t * 10), 2) : 1));
      ctx.globalCompositeOperation = 'overlay';
      const pat = ctx.createPattern(nn, 'repeat');
      if (pat) {
        ctx.save();
        ctx.translate(-hash01(Math.floor(t * 30), 1) * 160, -hash01(Math.floor(t * 30), 2) * 160);
        ctx.scale(2, 2);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (st === 'glitch' && hash01(Math.floor(t * 8), 5) > 0.5) {
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? rgba(primary, 0.45) : 'rgba(0,255,255,0.35)';
          ctx.fillRect(hash01(i, Math.floor(t * 8)) * W * 0.7, hash01(i + 9, Math.floor(t * 8)) * H, 80 + hash01(i, 3) * 300, 14 + hash01(i, 4) * 50);
        }
      }
      if (st === 'rusak') {
        const y = fr(t * 0.7) * H;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, y, W, 40);
      }
      break;
    }
    case 'speedline': {
      const col = st === 'hitam' ? '#000000' : st === 'tema' ? primary : '#FFFFFF';
      const frame = Math.floor(t * 18);
      ctx.fillStyle = rgba(col, 0.75);
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.hypot(W, H) * 0.6;
      for (let i = 0; i < n(70); i++) {
        const a = hash01(i, frame % 3) * Math.PI * 2;
        const inner = R * (0.42 + hash01(i, 5 + (frame % 2)) * 0.25);
        const w = 0.004 + hash01(i, 7) * 0.012;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a - w) * R * 1.2, cy + Math.sin(a - w) * R * 1.2);
        ctx.lineTo(cx + Math.cos(a + w) * R * 1.2, cy + Math.sin(a + w) * R * 1.2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'sinar': {
      const col = st === 'emas' ? '#FFD45E' : st === 'tema' ? primary : '#FFFFFF';
      ctx.translate(W / 2, H * 0.42);
      ctx.rotate(t * 0.25);
      const R = Math.hypot(W, H);
      const nr = 16;
      ctx.fillStyle = rgba(col, 0.1 * Math.min(1.6, k));
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, a, a + Math.PI / nr);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, W: number, H: number, col: string, a: number) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, rgba(col, 0));
  g.addColorStop(1, rgba(col, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawLightning(ctx: CanvasRenderingContext2D, c: EffectCtx, col: string, k: number, period: number) {
  const { W, H, t } = c;
  const idx = Math.floor(t / period);
  const local = t - idx * period;
  if (local > 0.35) return;
  const flash = local < 0.06 ? 1 : local < 0.12 ? 0.3 : local < 0.18 ? 0.8 : Math.max(0, 1 - (local - 0.18) / 0.17);
  ctx.fillStyle = rgba(col, 0.35 * flash * Math.min(1.2, k));
  ctx.fillRect(0, 0, W, H);
  const x = W * (0.2 + hash01(idx, 1) * 0.6);
  ctx.save();
  ctx.strokeStyle = rgba('#FFFFFF', flash);
  ctx.shadowColor = col;
  ctx.shadowBlur = 30;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  bolt(ctx, x, -10, H * (0.45 + hash01(idx, 2) * 0.25), idx * 13 + 1, 90);
  ctx.stroke();
  ctx.lineWidth = 3;
  bolt(ctx, x + 40, H * 0.2, H * 0.5, idx * 13 + 7, 70);
  ctx.stroke();
  ctx.restore();
}

function drawShatter(ctx: CanvasRenderingContext2D, c: EffectCtx, st: string, k: number) {
  const { W, H, t } = c;
  const t0 = 0.25;
  if (t < t0) return;
  const grow = clamp((t - t0) / 0.22);
  const [ox, oy] =
    st === 'kiri-atas' ? [W * 0.22, H * 0.2] : st === 'kanan-bawah' ? [W * 0.78, H * 0.78] : st === 'layar-hp' ? [W * 0.85, H * 0.88] : [W * 0.5, H * 0.45];
  // kilatan saat benturan
  if (t - t0 < 0.12) {
    ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - (t - t0) / 0.12)})`;
    ctx.fillRect(0, 0, W, H);
  }
  const rays = Math.round(9 + 9 * k);
  const reach = Math.hypot(W, H);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const pts: Array<Array<[number, number]>> = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + hash01(i, 1) * 0.4;
    const len = reach * (0.35 + hash01(i, 2) * 0.6) * grow;
    const line: Array<[number, number]> = [[ox, oy]];
    const steps = 7;
    for (let s = 1; s <= steps; s++) {
      const d = (len * s) / steps;
      const j = (hash01(i * 10 + s, 3) - 0.5) * 0.18;
      line.push([ox + Math.cos(a + j) * d, oy + Math.sin(a + j) * d]);
    }
    pts.push(line);
  }
  const drawLines = (stroke: string, w: number) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w;
    pts.forEach((line) => {
      ctx.beginPath();
      line.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    });
    // cincin retakan
    for (let ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      pts.forEach((line, i) => {
        const p = line[Math.min(line.length - 1, ring * 2)];
        const q = pts[(i + 1) % pts.length][Math.min(line.length - 1, ring * 2)];
        if (hash01(i * 3 + ring, 9) > 0.35) {
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
        }
      });
      ctx.stroke();
    }
  };
  drawLines('rgba(0,0,0,0.45)', 6);
  drawLines('rgba(255,255,255,0.9)', 2.5);
  // pantulan kaca
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  pts.forEach((line, i) => {
    if (i % 3) return;
    const nx = pts[(i + 1) % pts.length];
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(line[4][0], line[4][1]);
    ctx.lineTo(nx[4][0], nx[4][1]);
    ctx.closePath();
    ctx.fill();
  });
  // titik benturan
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(ox, oy, 10 * grow, 0, Math.PI * 2);
  ctx.fill();
  if (st === 'layar-hp') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(ox - hash01(i, 4) * 220, oy - hash01(i, 5) * 260, 18 + hash01(i, 6) * 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (st === 'hamburan' || st === 'jatuh') {
    const age = t - t0 - 0.3;
    if (age > 0) {
      const count = Math.round(18 * k) + 6;
      for (let i = 0; i < count; i++) {
        const a = hash01(i, 11) * Math.PI * 2;
        const v = st === 'hamburan' ? 500 + hash01(i, 12) * 900 : 60 + hash01(i, 12) * 120;
        const x = ox + Math.cos(a) * (st === 'hamburan' ? v * age : 80 + hash01(i, 13) * 300);
        const y = oy + Math.sin(a) * (st === 'hamburan' ? v * age : 60 + hash01(i, 14) * 200) + 900 * age * age;
        if (y > H + 100) continue;
        const s = 30 + hash01(i, 15) * 60;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(age * (3 + hash01(i, 16) * 6) + i);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.3);
        ctx.lineTo(s * 0.6, -s * 0.5);
        ctx.lineTo(s * 0.2, s * 0.6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(220,240,255,0.25)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Kode admin                                                          */
/* ------------------------------------------------------------------ */
export function parseEffectCode(raw: string, fallbackName = 'Efek Custom'): { ok: boolean; error?: string; spec?: EffectSpec } {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `JSON tidak valid: ${(e as Error).message}` };
  }
  const def = DEFS.find((d) => d.kind === j.kind);
  if (!def) return { ok: false, error: `"kind" harus salah satu: ${DEFS.map((d) => d.kind).join(', ')}` };
  const style = String(j.style || def.styles[0][0]);
  const extra = def.styles.find((s) => s[0] === style)?.[2] || {};
  return {
    ok: true,
    spec: {
      id: String(j.id || `custom-fx-${Date.now()}`),
      name: String(j.name || fallbackName),
      group: 'custom',
      kind: def.kind,
      layer: (['under', 'over'].includes(String(j.layer)) && (def.layer === 'under' || def.layer === 'over') ? j.layer : def.layer) as EffectLayer,
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(String) : ['custom'],
      params: { style, k: Math.max(0.1, Math.min(4, Number(j.intensity ?? j.k) || 1)), ...extra, ...(typeof j.icon === 'string' ? { icon: j.icon.slice(0, 80) } : {}), ...(['jatuh', 'naik', 'melayang'].includes(String(j.motion)) ? { motion: j.motion as EffectParams['motion'] } : {}) },
      author: 'admin',
    },
  };
}

export const EFFECT_CODE_EXAMPLE = `{
  "name": "Hujan Ikon Kopi Melayang",
  "kind": "ikon",
  "icon": "coffee",
  "motion": "melayang",
  "intensity": 1.2
}`;
