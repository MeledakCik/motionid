/**
 * MotionKu Smart Engine — generator script video berbasis aturan (tanpa API AI eksternal).
 *
 * Isi video dibuat sesuai kategori:
 * - promo   : produk → keunggulan → harga (dengan harga coret bila ada) → ajakan order
 * - quote   : kalimat renungan sesuai suasana (capek, galau, semangat, cinta, syukur)
 * - edukasi : angka besar → daftar langkah → tips penting → ajakan simpan
 *
 * Kalimat dipilih acak supaya setiap klik "Buat" menghasilkan variasi. Isi `seed` untuk hasil
 * yang selalu sama (dipakai untuk data awal yang ikut dirender di server, agar tidak terjadi
 * hydration mismatch). Kalimat hasil training admin ikut masuk ke kumpulan kandidat, tetapi
 * tidak menggeser kalimat bawaan.
 */

/* -------------------------------------------------------------------------- */
/* FISIKA PEGAS & KURSOR                                                      */
/* -------------------------------------------------------------------------- */

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function solveSpring(
  t: number,
  { stiffness = 210, damping = 15, mass = 1 }: SpringConfig = {}
): number {
  const clamped = Math.max(0, Math.min(2.5, t));
  if (clamped <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * w0 * clamped);
    return 1 - env * (Math.cos(wd * clamped) + ((zeta * w0) / wd) * Math.sin(wd * clamped));
  }
  return 1 - (1 + w0 * clamped) * Math.exp(-w0 * clamped);
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

export interface CursorKeyframeState {
  x: number;
  y: number;
  isPressed: boolean;
  rippleProgress: number;
}

export function computeCursorChoreography(
  progress: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): CursorKeyframeState {
  const moveT = smoothStep(0.36, 0.55, progress);
  const arcLift = Math.sin(moveT * Math.PI) * 18;
  return {
    x: startX + (targetX - startX) * moveT,
    y: startY + (targetY - startY) * moveT - arcLift,
    isPressed: progress > 0.54 && progress < 0.63,
    rippleProgress: smoothStep(0.55, 0.78, progress),
  };
}

/* -------------------------------------------------------------------------- */
/* TIPE DATA                                                                  */
/* -------------------------------------------------------------------------- */

export type CategoryType = 'quote' | 'promo' | 'edukasi';

export type AnimationType = 'pop' | 'slide-up' | 'typewriter' | 'bounce' | 'fade' | 'zoom';

export type AspectRatioType = '9:16' | '1:1' | '16:9';

export type CameraMotionType =
  | 'spring-slide-vertical'
  | 'perspective-tilt-3d'
  | 'whip-zoom-spring'
  | 'smooth-float';

export type EngineFontName =
  | 'Poppins'
  | 'Montserrat'
  | 'Bebas Neue'
  | 'Playfair Display'
  | 'Space Grotesk'
  | 'Anton';

/** Posisi judul & kartu dalam satu scene. */
export type SceneLayout = 'stack' | 'card-first' | 'center-text';
/** Efek pergantian antar-scene. */
export type SceneTransition = 'cut' | 'fade' | 'slide' | 'push-up' | 'zoom' | 'wipe' | 'flash';
/** Pola latar di atas gradien palet. */
export type BackgroundStyle =
  | 'mesh'
  | 'sunburst'
  | 'stripes'
  | 'blobs'
  | 'spotlight'
  | 'confetti'
  | 'waves'
  | 'grid';
/** Cara judul muncul. */
export type HeadlineAnim = 'spring-words' | 'typewriter' | 'rise-lines' | 'pop' | 'marker';

export const SCENE_LAYOUTS: readonly SceneLayout[] = ['stack', 'card-first', 'center-text'];
export const SCENE_TRANSITIONS: readonly SceneTransition[] = ['cut', 'fade', 'slide', 'push-up', 'zoom', 'wipe', 'flash'];
export const BACKGROUND_STYLES: readonly BackgroundStyle[] = ['mesh', 'sunburst', 'stripes', 'blobs', 'spotlight', 'confetti', 'waves', 'grid'];
export const HEADLINE_ANIMS: readonly HeadlineAnim[] = ['spring-words', 'typewriter', 'rise-lines', 'pop', 'marker'];

/** Komponen kartu yang bisa digambar Motion Studio. */
export type StudioWidgetType =
  | 'price_tag_card'
  | 'checklist_card'
  | 'step_number_card'
  | 'quote_card'
  | 'cta_button_card'
  | 'repo_input_card'
  | 'repo_scanner_card'
  | 'terminal_build_card'
  | 'bento_metrics_grid'
  | 'kinetic_showcase_card';

/** Termasuk nama lama dari profil training versi sebelumnya (dinormalisasi saat dirender). */
export type WidgetBlueprintType =
  | StudioWidgetType
  | 'feature_spotlight_card'
  | 'kinetic_hook_card'
  | 'cta_dock_card';

export const STUDIO_WIDGET_TYPES: readonly StudioWidgetType[] = [
  'price_tag_card',
  'checklist_card',
  'step_number_card',
  'quote_card',
  'cta_button_card',
  'repo_input_card',
  'repo_scanner_card',
  'terminal_build_card',
  'bento_metrics_grid',
  'kinetic_showcase_card',
];

const LEGACY_WIDGET_MAP: Record<string, StudioWidgetType> = {
  feature_spotlight_card: 'checklist_card',
  kinetic_hook_card: 'kinetic_showcase_card',
  cta_dock_card: 'cta_button_card',
};

/** Ubah nama widget apa pun (termasuk nama lama) menjadi widget yang pasti bisa digambar. */
export function normalizeWidgetType(
  value: unknown,
  fallback: StudioWidgetType = 'checklist_card'
): StudioWidgetType {
  if (typeof value !== 'string') return fallback;
  if ((STUDIO_WIDGET_TYPES as readonly string[]).includes(value)) return value as StudioWidgetType;
  return LEGACY_WIDGET_MAP[value] || fallback;
}

export interface MotionTelemetryProfile {
  presetId: string;
  creatorHandle: string;
  sourceUrl: string;
  easing: string;
  cameraMotion: CameraMotionType;
  bpm: number;
  paletteId: string;
  widgetSequence: WidgetBlueprintType[];
  stepBadges: string[];
  cardRadius: number;
  glassBlur: number;
  staggerMs: number;
}

export interface TrainedVideoPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  creatorHandle: string;
  profile: MotionTelemetryProfile;
}

export interface GeneratedMotionScene {
  id: string;
  stepBadge: string;
  title: string;
  subtext: string;
  duration: number;
  paletteId: string;
  widgetType: WidgetBlueprintType;
  widgetData: {
    primaryInput?: string;
    secondaryBadge?: string;
    terminalLines?: string[];
    metrics?: Array<{ label: string; value: string; accent: string }>;
  };
  cameraMotion: string;
  easing: string;
}

export type SceneRole =
  | 'Hook / Masalah'
  | 'Isi / Solusi'
  | 'Bukti / Harga'
  | 'CTA Akhir'
  | 'Langkah'
  | 'Tips Penting'
  | 'Renungan';

export interface SceneItem {
  id: string;
  sceneNumber: number;
  role: SceneRole;
  text: string;
  subtext: string;
  emoji: string;
  duration: number;
  animation: AnimationType;
  imageUrl?: string;
  stepBadge?: string;
  widgetType?: WidgetBlueprintType;
  /** Isi utama kartu: nama produk, isi kutipan, angka besar, atau teks tombol. */
  primaryInput?: string;
  /** Isi tambahan kartu, dipisah "|" (contoh: "Rp18rb | Rp25rb | Hemat 28%"). */
  secondaryInput?: string;
  cameraMotion?: CameraMotionType;
  paletteId?: string;
  layout?: SceneLayout;
  transition?: SceneTransition;
  bgStyle?: BackgroundStyle;
  headlineAnim?: HeadlineAnim;
  /** Emoji dekorasi yang melayang di latar, mis. "☕✨". */
  decor?: string;
  /** Kata kunci dari prompt yang ditonjolkan di judul, dipisah "|". */
  emphasis?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  textColor: string;
  accentColor: string;
  badgeTextColor: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  mood: 'slow' | 'energetic' | 'chill' | 'upbeat' | 'dramatic';
  bpm: number;
  url: string;
  cdnUrl: string;
  description: string;
}

export interface CustomImageAsset {
  id: string;
  title: string;
  category: CategoryType;
  url: string;
}

export interface StyleSuggestion {
  paletteId: string;
  colors: ColorPalette;
  font: EngineFontName;
  musicId: string;
  music: MusicTrack;
  backgroundType: 'solid' | 'gradient' | 'image';
  gradientPreset: string;
  moodLabel: string;
}

export type QuoteMood = 'capek' | 'galau' | 'semangat' | 'cinta' | 'syukur' | 'netral';

export interface ParsedTopicMeta {
  cleanTopic: string;
  productName: string;
  /** Harga promo, '' bila tidak ada. */
  priceText: string;
  /** Harga normal (untuk harga coret), '' bila tidak ada. */
  originalPriceText: string;
  /** Nama toko, '' bila tidak ada. */
  storeName: string;
  emotionKeyword: string;
  detectedMood: 'galau' | 'promo' | 'edukasi' | 'netral';
  discountPercent?: number | null;
  /** Edukasi: topik tanpa awalan "3 cara …". */
  subject?: string;
  /** Edukasi: jumlah langkah yang diminta (dibatasi 2–6). */
  stepCount?: number | null;
  /** Edukasi: true bila angka di topik tidak perlu dibatasi. */
  stepCountExact?: boolean;
  /** Edukasi: kata benda setelah angka ("cara", "tips", "langkah", …). */
  stepNoun?: string;
  quoteMood?: QuoteMood;
}

export interface GeneratedScriptResult {
  hook: string;
  scenes: SceneItem[];
  caption: string;
  hashtags: string[];
  suggestedMusic: MusicTrack;
  suggestedColor: ColorPalette;
  suggestedStyle: StyleSuggestion;
  extractedMeta: ParsedTopicMeta;
  /** Gaya yang dipilih dari prompt (paket gaya + kata kunci yang terbaca). */
  recipe?: StyleRecipe;
}

export interface GenerateOptions {
  customPrice?: string;
  customOriginalPrice?: string;
  customProductName?: string;
  customStoreName?: string;
  excludeHooks?: string[];
  forceRandomPalette?: boolean;
  userImages?: string[];
  /** Isi angka untuk hasil yang selalu sama (deterministik). */
  seed?: number;
  /** Paksa paket gaya tertentu (id dari STYLE_PACKS). */
  stylePackId?: string;
  /** Paksa susunan scene: A = lengkap, B = alternatif, C = ringkas. */
  variant?: 'A' | 'B' | 'C';
}

export interface SceneTemplateEntry {
  text: string;
  subtext: string;
  emoji: string;
}

/* -------------------------------------------------------------------------- */
/* ACAK & TEKS                                                                */
/* -------------------------------------------------------------------------- */

type Rng = () => number;

function createRng(seed?: number): Rng {
  if (typeof seed !== 'number' || !Number.isFinite(seed)) return Math.random;
  let state = Math.floor(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: readonly T[], rng: Rng, fallback: T): T {
  if (!list.length) return fallback;
  return list[Math.floor(rng() * list.length)] ?? fallback;
}

function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ambil n item berbeda secara acak. */
function pickSome<T>(list: readonly T[], n: number, rng: Rng): T[] {
  return shuffle(Array.from(new Set(list)), rng).slice(0, n);
}

/** Ambil n item secara acak tapi urutannya tetap seperti daftar aslinya. */
function pickOrdered<T>(list: readonly T[], n: number, rng: Rng): T[] {
  if (n >= list.length) return [...list];
  const idx = shuffle(
    list.map((_, i) => i),
    rng
  )
    .slice(0, n)
    .sort((a, b) => a - b);
  return idx.map((i) => list[i]);
}

function cleanSpaces(s: string): string {
  return s
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?:;])/g, '$1')
    .trim();
}

function sentenceCase(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

const SMALL_WORDS = new Set(['di', 'ke', 'dari', 'dan', 'atau', 'yang', 'untuk', 'dengan', 'pada', '&']);

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      if (/[A-Z]/.test(w.slice(1)) || /\d/.test(w) || w.startsWith('@')) return w;
      const lw = w.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');
}

function shortenAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/* -------------------------------------------------------------------------- */
/* HARGA                                                                      */
/* -------------------------------------------------------------------------- */

export interface PriceMatch {
  text: string;
  display: string;
  value: number;
  start: number;
  end: number;
}

// Angka dianggap harga hanya jika ada "Rp", satuan (rb/k/jt), atau pemisah ribuan.
// Satuan tidak boleh diikuti huruf/angka, jadi "2 kopi" atau "5 kali" tidak dibaca sebagai harga.
const PRICE_SOURCE =
  '(\\brp\\.?\\s*)?(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)\\s*(rb|ribu|k|jt|juta)?(?![a-z0-9])';

const UNIT_MULTIPLIER: Record<string, number> = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6 };

function parseIdNumber(num: string): number {
  if (/^\d{1,3}([.,]\d{3})+$/.test(num)) return Number(num.replace(/[.,]/g, ''));
  return Number(num.replace(',', '.'));
}

function formatPriceDisplay(num: string, unit: string): string {
  if (unit === 'rb' || unit === 'ribu' || unit === 'k') return `Rp${num}rb`;
  if (unit === 'jt' || unit === 'juta') return `Rp${num}jt`;
  return `Rp${num}`;
}

export function findPrices(text: string): PriceMatch[] {
  const out: PriceMatch[] = [];
  const re = new RegExp(PRICE_SOURCE, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || '')) !== null) {
    const full = m[0];
    const prefix = m[1] || '';
    const num = m[2] || '';
    const unit = (m[3] || '').toLowerCase();
    const hasSeparator = /^\d{1,3}([.,]\d{3})+$/.test(num);
    if (!prefix && !unit && !hasSeparator) continue;
    const base = parseIdNumber(num);
    if (!Number.isFinite(base) || base <= 0) continue;
    out.push({
      text: full.trim(),
      display: formatPriceDisplay(num, unit),
      value: base * (UNIT_MULTIPLIER[unit] || 1),
      start: m.index,
      end: m.index + full.length,
    });
  }
  return out;
}

/** "Rp18rb" → 18000, "Rp 1,5jt" → 1500000, "18.000" → 18000. null bila bukan harga. */
export function priceToNumber(text: string): number | null {
  const hits = findPrices(text || '');
  if (hits.length) return hits[0].value;
  const plain = /^\s*(\d[\d.,]*)\s*$/.exec(text || '');
  if (!plain) return null;
  const n = parseIdNumber(plain[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* -------------------------------------------------------------------------- */
/* DATA BAWAAN                                                                */
/* -------------------------------------------------------------------------- */

export const CUSTOM_IMAGE_ASSETS: CustomImageAsset[] = [
  {
    id: 'asset-promo-coffee',
    title: 'Foto produk minuman',
    category: 'promo',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 'asset-quote-sunset',
    title: 'Visual tenang',
    category: 'quote',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 'asset-edukasi-laptop',
    title: 'Ilustrasi belajar',
    category: 'edukasi',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&q=80',
  },
];

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'promo-pop',
    name: 'Kuning Promo',
    bgPrimary: '#ffe08a',
    bgSecondary: '#ffc94d',
    textColor: '#1c1206',
    accentColor: '#dc2626',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'quote-ink',
    name: 'Tinta Malam',
    bgPrimary: '#0b1026',
    bgSecondary: '#241a3d',
    textColor: '#f8f5ee',
    accentColor: '#c08a3e',
    badgeTextColor: '#1f1b2e',
  },
  {
    id: 'aurora-mint',
    name: 'Mint Segar',
    bgPrimary: '#d1fae5',
    bgSecondary: '#ecfeff',
    textColor: '#064e3b',
    accentColor: '#10b981',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'depup-lavender',
    name: 'Lavender Pastel',
    bgPrimary: '#dcd6f7',
    bgSecondary: '#f3e8ff',
    textColor: '#18181b',
    accentColor: '#4f46e5',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'midnight-indigo',
    name: 'Indigo Malam',
    bgPrimary: '#090d16',
    bgSecondary: '#1e1b4b',
    textColor: '#f8fafc',
    accentColor: '#6366f1',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'cyber-sunset',
    name: 'Sunset Neon',
    bgPrimary: '#18181b',
    bgSecondary: '#4c0519',
    textColor: '#ffffff',
    accentColor: '#f43f5e',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald',
    bgPrimary: '#064e3b',
    bgSecondary: '#022c22',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    badgeTextColor: '#022c22',
  },
  { id: 'candy-pop', name: 'Candy Pop', bgPrimary: '#ffe4f1', bgSecondary: '#e9d5ff', textColor: '#18181b', accentColor: '#db2777', badgeTextColor: '#ffffff' },
  { id: 'ocean-fresh', name: 'Biru Segar', bgPrimary: '#e0f2fe', bgSecondary: '#a5f3fc', textColor: '#18181b', accentColor: '#0369a1', badgeTextColor: '#ffffff' },
  { id: 'mono-noir', name: 'Hitam Tegas', bgPrimary: '#0a0a0a', bgSecondary: '#262626', textColor: '#f8fafc', accentColor: '#facc15', badgeTextColor: '#111827' },
  { id: 'royal-gold', name: 'Emas Mewah', bgPrimary: '#0c1a14', bgSecondary: '#1c1917', textColor: '#f8fafc', accentColor: '#d4af37', badgeTextColor: '#111827' },
  { id: 'sunset-warm', name: 'Senja Hangat', bgPrimary: '#ffedd5', bgSecondary: '#fecdd3', textColor: '#18181b', accentColor: '#ea580c', badgeTextColor: '#ffffff' },
  { id: 'paper-clean', name: 'Kertas Bersih', bgPrimary: '#fafaf9', bgSecondary: '#e7e5e4', textColor: '#18181b', accentColor: '#1d4ed8', badgeTextColor: '#ffffff' },
  { id: 'cocoa-cream', name: 'Kopi Krim', bgPrimary: '#f5ebe0', bgSecondary: '#e3d5ca', textColor: '#18181b', accentColor: '#7f4f24', badgeTextColor: '#ffffff' },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-saas-upbeat',
    title: 'Future Garage (118 BPM)',
    mood: 'upbeat',
    bpm: 118,
    url: '/music/upbeat.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    description: 'Beat elektronik bersih untuk demo produk',
  },
  {
    id: 'track-energetic-drop',
    title: 'Kinetic Bass Drop (128 BPM)',
    mood: 'energetic',
    bpm: 128,
    url: '/music/energetic.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3',
    description: 'Ketukan cepat untuk video promo',
  },
  {
    id: 'track-chill-lofi',
    title: 'Lofi Focus (110 BPM)',
    mood: 'chill',
    bpm: 110,
    url: '/music/chill.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    description: 'Suasana santai untuk video edukasi',
  },
  {
    id: 'track-slow-ambient',
    title: 'Cinematic Warmth (92 BPM)',
    mood: 'slow',
    bpm: 92,
    url: '/music/slow.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e02f9.mp3',
    description: 'Alunan lembut untuk kutipan',
  },
];

/**
 * Kalimat hasil training admin (diisi saat runtime oleh lib/training.ts).
 * Kalimat bawaan ada di konstanta PROMO_*, QUOTE_PACKS, dan EDU_PACKS di bawah.
 */
export const BANK_HOOK: Record<CategoryType, string[]> = { promo: [], quote: [], edukasi: [] };

export const BANK_SCENES: Record<
  CategoryType,
  { scene2: SceneTemplateEntry[]; scene3: SceneTemplateEntry[] }
> = {
  promo: { scene2: [], scene3: [] },
  quote: { scene2: [], scene3: [] },
  edukasi: { scene2: [], scene3: [] },
};

export const BANK_CTA: Record<CategoryType, string[]> = { promo: [], quote: [], edukasi: [] };

export const BANK_HASHTAGS: Record<CategoryType, string[]> = {
  promo: ['#promo', '#diskon', '#umkm', '#promohariini'],
  quote: ['#quotes', '#katakata', '#selfreminder', '#quotesindonesia'],
  edukasi: ['#edukasi', '#tips', '#belajar', '#infobermanfaat'],
};

/** Kata kunci → hashtag tambahan (bisa ditambah lewat training "keyword_rule"). */
export const TOPIC_HASHTAG_MAP: Record<string, string[]> = {
  kopi: ['#kopisusu', '#kopikekinian'],
};

const trainedVideoPresets: TrainedVideoPreset[] = [];

/* ---------- Promo ---------- */

const PROMO_HOOKS = [
  'Stop scroll! {product} lagi promo 👀',
  'Lagi cari {product}? Pas banget, lagi promo!',
  '{product} favoritmu lagi turun harga 🔥',
  'Kabar baik buat pencinta {product}!',
  'Promo {product} cuma {price}!',
  'Cuma {price} buat {product}? Serius!',
  'Jangan sampai kehabisan promo {product} di {store}!',
  'Stop scroll! Ada promo spesial hari ini 👀',
];

const PROMO_URGENT_HOOKS = [
  'FLASH SALE! {product} cuma {price} ⚡',
  'Buruan! Promo {product} terbatas banget',
  'Diskon {discount}% {product}, jangan sampai kehabisan!',
  'Cuma sebentar: {product} jadi {price}!',
];

const PROMO_URGENT_CTA = ['Buruan checkout sebelum kehabisan!', 'Amankan sekarang sebelum promonya habis!'];

const PROMO_HOOK_SUBTEXTS = [
  'Promo terbatas, simak sampai habis.',
  'Harga promonya ada sebentar lagi 👇',
  'Khusus di {store} selama promo berlangsung.',
];

const PROMO_BENEFIT_TITLES = [
  'Kenapa harus {product}?',
  'Ini alasan {product} jadi favorit',
  'Yang bikin {product} beda:',
  'Kenapa banyak yang pilih ini?',
];

const PROMO_PRICE_TITLES = ['Sekarang cuma {price}!', 'Harga promo: {price}', 'Cukup {price} aja!'];

const PROMO_DISCOUNT_TITLES = [
  'Hemat {discount}%, sekarang {price}!',
  'Turun dari {original_price} jadi {price}!',
];

const PROMO_NOPRICE_TITLES = [
  'Harga spesial selama promo!',
  'Harga spesialnya cuma di {store}!',
  'Cek harga spesialnya sekarang!',
];

const PROMO_CTA_TITLES = [
  'Pesan sekarang sebelum promonya habis!',
  'Yuk, order sekarang juga!',
  'Mampir ke {store} hari ini!',
  'Klik link di bio buat pesan!',
];

interface PromoKind {
  match: RegExp;
  benefits: string[];
  hashtags: string[];
}

const PROMO_KINDS: PromoKind[] = [
  {
    match:
      /kopi|teh\b|susu|boba|jus|minuman|\bes\b|makan|nasi|ayam|bakso|\bmie?\b|soto|sate|kue|roti|donat|martabak|snack|cemilan|camilan|keripik|sambal|seblak|pizza|burger|dimsum|frozen|katering|catering/,
    benefits: [
      'Dibuat fresh setiap hari',
      'Rasa favorit pelanggan',
      'Porsi pas, harga bersahabat',
      'Bahan pilihan berkualitas',
    ],
    hashtags: ['#kulinerindonesia', '#jajanan'],
  },
  {
    match:
      /baju|kaos|kemeja|celana|\brok\b|dress|gamis|hijab|jilbab|kerudung|jaket|hoodie|sepatu|sandal|\btas\b|dompet|topi|outfit|batik/,
    benefits: [
      'Bahan nyaman dipakai seharian',
      'Banyak pilihan ukuran dan warna',
      'Jahitan rapi dan awet',
      'Cocok buat harian atau acara',
    ],
    hashtags: ['#fashionlokal', '#outfit'],
  },
  {
    match: /skincare|serum|sabun|lipstik|parfum|lotion|sunscreen|masker|kosmetik|make ?up/,
    benefits: [
      'Praktis dipakai setiap hari',
      'Kemasan mudah dibawa',
      'Banyak pilihan varian',
      'Harga ramah di kantong',
    ],
    hashtags: ['#skincarelokal', '#beauty'],
  },
  {
    match: /jasa|servis|service|laundry|\bles\b|kursus|kelas|potong rambut|barbershop|salon|desain|fotografi/,
    benefits: [
      'Dikerjakan rapi dan tepat waktu',
      'Bisa konsultasi dulu',
      'Harga jelas dari awal',
      'Pelayanan ramah',
    ],
    hashtags: ['#jasa', '#umkmindonesia'],
  },
];

const PROMO_DEFAULT_KIND: PromoKind = {
  match: /$^/,
  benefits: [
    'Kualitas terjaga',
    'Harga bersahabat',
    'Pelayanan cepat dan ramah',
    'Promo berlaku terbatas',
  ],
  hashtags: ['#umkmindonesia', '#produklokal'],
};

/* ---------- Quote ---------- */

interface QuotePack {
  hooks: string[];
  quotes: string[];
  hashtags: string[];
}

const QUOTE_PACKS: Record<QuoteMood, QuotePack> = {
  capek: {
    hooks: [
      'Untuk kamu yang lagi capek, tapi tetap bertahan.',
      'Kalau hari ini berat, baca ini dulu.',
      'Capek itu wajar. Berhenti sebentar juga boleh.',
    ],
    quotes: [
      'Istirahat bukan menyerah, itu cara mengisi ulang tenaga.',
      'Pelan-pelan saja, yang penting tidak berhenti.',
      'Kamu sudah sejauh ini. Itu bukan hal kecil.',
      'Tidak semua hari harus produktif. Bertahan juga pencapaian.',
      'Lelahmu hari ini sedang membentuk dirimu yang besok.',
    ],
    hashtags: ['#capek', '#healing'],
  },
  galau: {
    hooks: [
      'Buat kamu yang lagi nggak baik-baik saja.',
      'Kalau hatimu lagi berat, ini buat kamu.',
      'Sedih itu boleh, nggak harus pura-pura kuat.',
    ],
    quotes: [
      'Hari buruk bukan berarti hidupmu buruk.',
      'Yang pergi jadi pelajaran, yang tinggal jaga baik-baik.',
      'Hatimu juga butuh waktu untuk pulih.',
      'Kamu berhak bahagia, mulai dari dirimu sendiri.',
      'Menangis bukan tanda lemah, itu tanda kamu manusia.',
    ],
    hashtags: ['#galau', '#patahhati'],
  },
  semangat: {
    hooks: [
      'Pengingat buat kamu yang lagi berjuang.',
      'Simpan ini buat hari-hari malasmu.',
      'Kalau mulai ragu, baca ini lagi.',
    ],
    quotes: [
      'Mulai dari yang kecil, tapi mulai hari ini.',
      'Konsisten mengalahkan bakat yang malas.',
      'Progres kecil tetap progres.',
      'Mimpi besar dibangun dari kebiasaan kecil.',
      'Gagal hari ini bukan akhir, cuma bagian dari cerita.',
    ],
    hashtags: ['#motivasi', '#semangat'],
  },
  cinta: {
    hooks: [
      'Buat kamu yang lagi belajar mencintai dengan sehat.',
      'Pengingat kecil soal cinta.',
      'Untuk hati yang sedang menunggu.',
    ],
    quotes: [
      'Cinta yang sehat bikin kamu tumbuh, bukan takut.',
      'Yang tepat tidak akan membuatmu terus menebak-nebak.',
      'Sayangi dirimu dulu, baru orang lain.',
      'Cinta itu soal hadir, bukan cuma soal kata.',
    ],
    hashtags: ['#cinta', '#relationship'],
  },
  syukur: {
    hooks: [
      'Pengingat untuk pelan-pelan bersyukur.',
      'Sebelum mengeluh, baca ini dulu.',
      'Untuk kamu yang sedang belajar ikhlas.',
    ],
    quotes: [
      'Yang kamu punya hari ini dulu pernah kamu doakan.',
      'Tenang bukan karena masalah hilang, tapi karena hati ikhlas.',
      'Cukup itu bukan soal jumlah, tapi soal rasa.',
      'Bersyukur bikin yang sedikit terasa cukup.',
    ],
    hashtags: ['#bersyukur', '#ikhlas'],
  },
  netral: {
    hooks: [
      'Pengingat kecil untuk hari ini.',
      'Baca pelan-pelan, ini buat kamu.',
      'Satu menit untuk dirimu sendiri.',
    ],
    quotes: [
      'Semua yang besar dimulai dari langkah kecil.',
      'Jangan bandingkan awalmu dengan pertengahan orang lain.',
      'Hari ini cukup lakukan yang terbaik yang kamu bisa.',
      'Pelan bukan berarti tertinggal.',
    ],
    hashtags: ['#motivasi'],
  },
};

const QUOTE_MOOD_RULES: Array<[QuoteMood, RegExp]> = [
  ['capek', /capek|\bcape\b|lelah|penat|burnout|kerja|lembur/],
  ['galau', /galau|sedih|patah hati|kecewa|nangis|menangis|kesepian|sendirian|move on|mantan|hancur/],
  ['cinta', /cinta|sayang|pasangan|jodoh|rindu|kangen|nikah|pacar/],
  ['syukur', /syukur|bersyukur|ikhlas|sabar|tenang|damai|bahagia/],
  ['semangat', /semangat|motivasi|sukses|mimpi|usaha|berjuang|konsisten|disiplin|produktif|bangkit|gagal/],
];

const QUOTE_HOOK_SUBTEXTS = ['Baca pelan-pelan, ya.', 'Simpan kalau ini kena di hati.'];
const QUOTE_LEADS_1 = ['Ingat ini baik-baik:', 'Satu hal yang perlu kamu tahu:', 'Pegang kalimat ini:'];
const QUOTE_LEADS_2 = ['Dan jangan lupa:', 'Satu lagi:', 'Yang paling penting:'];
const QUOTE_CTA_TITLES = [
  'Simpan untuk pengingat, kirim ke yang butuh.',
  'Kirim ini ke orang yang lagi butuh.',
  'Simpan, lalu baca lagi saat hari terasa berat.',
];
const QUOTE_CTA_SUBTEXTS = ['Kamu nggak sendirian.', 'Semoga harimu lebih ringan.'];

/* ---------- Edukasi ---------- */

interface EduPack {
  match: RegExp;
  steps: string[];
  tips: string[];
  hashtags: string[];
}

const EDU_PACKS: EduPack[] = [
  {
    match: /uang|keuangan|nabung|menabung|tabungan|gaji|investasi|budget|anggaran|utang|hutang|cicilan|hemat/,
    steps: [
      'Catat semua pengeluaran selama 30 hari',
      'Bagi gaji pakai pola 50/30/20',
      'Sisihkan tabungan di awal bulan',
      'Siapkan dana darurat sebelum investasi',
      'Hindari cicilan untuk barang konsumtif',
    ],
    tips: [
      'Jangan menunggu sisa gaji untuk menabung.',
      'Naik gaji boleh, naik gaya hidup jangan dulu.',
      'Pisahkan rekening tabungan dan rekening harian.',
    ],
    hashtags: ['#tipskeuangan', '#keuangan'],
  },
  {
    match: /belajar|ujian|kuliah|sekolah|hafal|menghafal|skripsi|materi|bahasa inggris/,
    steps: [
      'Fokus belajar 25 menit, lalu istirahat 5 menit',
      'Jelaskan ulang materi pakai bahasamu sendiri',
      'Ulangi materi besok dan minggu depan',
      'Kerjakan latihan soal, jangan cuma membaca',
      'Tidur cukup sebelum hari ujian',
    ],
    tips: [
      'Latihan soal lebih efektif daripada membaca ulang.',
      'Belajar sedikit tiap hari lebih nempel daripada sistem kebut semalam.',
      'Jauhkan HP saat sedang belajar.',
    ],
    hashtags: ['#tipsbelajar', '#pelajar'],
  },
  {
    match: /produktif|produktivitas|fokus|waktu|malas|menunda|prokrastinasi|rutinitas|kerja/,
    steps: [
      'Tulis 3 prioritas sebelum mulai kerja',
      'Kerjakan tugas terberat saat pikiran segar',
      'Matikan notifikasi saat sedang fokus',
      'Kelompokkan tugas kecil di satu waktu',
      'Rencanakan besok sebelum tutup hari',
    ],
    tips: [
      'Kalau bisa selesai dalam 2 menit, kerjakan sekarang.',
      'Multitasking justru bikin kerja lebih lama.',
      'Istirahat singkat bikin fokus bertahan lebih lama.',
    ],
    hashtags: ['#produktif', '#selfimprovement'],
  },
  {
    match: /sehat|kesehatan|olahraga|tidur|gizi|air putih|jalan kaki|stres|stress/,
    steps: [
      'Minum air putih yang cukup setiap hari',
      'Bergerak minimal 30 menit sehari',
      'Tidur dan bangun di jam yang sama',
      'Kurangi layar satu jam sebelum tidur',
      'Perbanyak sayur dan buah di piringmu',
    ],
    tips: [
      'Konsisten lebih penting daripada langsung berat.',
      'Mulai dari kebiasaan kecil yang gampang diulang.',
      'Kalau ada keluhan kesehatan, konsultasikan ke dokter.',
    ],
    hashtags: ['#hidupsehat', '#tipssehat'],
  },
  {
    match: /jualan|bisnis|usaha|umkm|toko|pelanggan|marketing|pemasaran|konten|closing|omzet/,
    steps: [
      'Kenali satu masalah utama pelangganmu',
      'Tunjukkan produk saat dipakai, bukan cuma difoto',
      'Posting rutin di jam pelanggan aktif',
      'Balas komentar dan DM secepat mungkin',
      'Minta testimoni dari pelanggan yang puas',
    ],
    tips: [
      'Jual manfaatnya, bukan cuma fiturnya.',
      'Satu konten yang jelas lebih baik dari sepuluh yang asal.',
      'Pelanggan lama lebih mudah diajak beli lagi.',
    ],
    hashtags: ['#tipsbisnis', '#jualanonline'],
  },
  {
    match: /masak|resep|memasak|dapur|bikin kue|baking/,
    steps: [
      'Siapkan semua bahan sebelum mulai memasak',
      'Panaskan wajan sebelum bahan masuk',
      'Masak dengan api sedang supaya matang merata',
      'Cicipi dan koreksi rasa di akhir',
    ],
    tips: [
      'Takar bumbu dulu, jangan langsung dituang.',
      'Jangan isi wajan terlalu penuh supaya tidak lembek.',
    ],
    hashtags: ['#resep', '#masakdirumah'],
  },
];

const EDU_DEFAULT: EduPack = {
  match: /$^/,
  steps: [
    'Pahami dasarnya dulu sebelum yang rumit',
    'Praktik sedikit, tapi setiap hari',
    'Catat progres dan evaluasi tiap minggu',
    'Belajar dari orang yang sudah berhasil',
    'Ulangi bagian yang masih sulit',
  ],
  tips: [
    'Konsisten kecil lebih baik daripada semangat sesaat.',
    'Jangan takut salah, itu bagian dari belajar.',
  ],
  hashtags: ['#belajarbareng'],
};

const EDU_NOUNS = 'cara|tips|tip|langkah|trik|kebiasaan|hal|rahasia|kesalahan|fakta|alasan|ide';
const EDU_LIST_TITLES = ['Ini langkah-langkahnya:', 'Caranya begini:', 'Coba urutan ini:'];
const EDU_TIP_TITLES = ['Tips penting:', 'Yang sering dilupakan:', 'Satu lagi:'];
const EDU_CTA_TITLES = [
  'Simpan biar nggak lupa!',
  'Bagikan ke teman yang butuh!',
  'Follow untuk tips berikutnya!',
];

/* -------------------------------------------------------------------------- */
/* TRAINING ADMIN (dipanggil lib/training.ts)                                 */
/* -------------------------------------------------------------------------- */

export function addTrainedVideoPresetToEngine(preset: TrainedVideoPreset): void {
  const idx = trainedVideoPresets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    trainedVideoPresets[idx] = preset;
  } else {
    trainedVideoPresets.unshift(preset);
  }
}

export function getTrainedVideoPresets(): TrainedVideoPreset[] {
  return trainedVideoPresets;
}

export function addCustomHookToEngine(category: CategoryType, hookText: string): boolean {
  const clean = hookText.trim();
  const list = BANK_HOOK[category];
  if (!clean || !list) return false;
  if (!list.includes(clean)) list.push(clean);
  return true;
}

export function addCustomSceneToEngine(
  category: CategoryType,
  slot: 'scene2' | 'scene3',
  entry: SceneTemplateEntry
): boolean {
  const target = BANK_SCENES[category];
  if (!entry.text?.trim() || !target) return false;
  target[slot].push({
    text: entry.text.trim(),
    subtext: entry.subtext?.trim() || '',
    emoji: entry.emoji?.trim() || '✨',
  });
  return true;
}

/** Tanpa kategori = berlaku untuk semua kategori. */
export function addCustomCtaToEngine(ctaText: string, category?: CategoryType): boolean {
  const clean = ctaText.trim();
  if (!clean) return false;
  const cats: CategoryType[] = category ? [category] : ['promo', 'quote', 'edukasi'];
  cats.forEach((c) => {
    if (!BANK_CTA[c].includes(clean)) BANK_CTA[c].push(clean);
  });
  return true;
}

export function addCustomImageAssetToEngine(asset: CustomImageAsset): boolean {
  if (!asset.url?.trim()) return false;
  if (!CUSTOM_IMAGE_ASSETS.some((a) => a.id === asset.id)) {
    CUSTOM_IMAGE_ASSETS.unshift(asset);
  }
  return true;
}

export function addKeywordRuleToEngine(keywords: string[], hashtags: string[]): boolean {
  if (!keywords.length || !hashtags.length) return false;
  const formattedTags = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`));
  keywords.forEach((kw) => {
    const k = kw.toLowerCase().trim();
    if (k) {
      TOPIC_HASHTAG_MAP[k] = Array.from(new Set([...(TOPIC_HASHTAG_MAP[k] || []), ...formattedTags]));
    }
  });
  return true;
}

/* -------------------------------------------------------------------------- */
/* PARSER TOPIK                                                               */
/* -------------------------------------------------------------------------- */

const PROMO_FILLER = new Set([
  'promo',
  'diskon',
  'sale',
  'cuma',
  'hanya',
  'dari',
  'jadi',
  'harga',
  'spesial',
  'special',
  'murah',
  'flash',
  'hemat',
  'potongan',
  'mulai',
  'only',
  'turun',
]);
const TRAILING_FILLER = new Set(['hari', 'ini', 'aja', 'saja', 'sekarang', 'juga', 'nih', 'yuk', 'guys']);
const LEADING_FILLER = new Set(['yuk', 'ada', 'lagi', 'beli', 'jual']);

// Kata platform & gaya tidak ikut jadi nama produk/judul ("buat story WA", "aesthetic", "nuansa merah")
const PLATFORM_PHRASE =
  /\b(?:buat|untuk|di|ke|konten|video)?\s*(?:story|status|sw|whatsapp|wa|tiktok|reels?|instagram|ig|feed|shorts?|youtube|yt|fyp)(?:\s+(?:ig|wa|instagram|tiktok|youtube|yt))?\b/gi;
const STYLE_PHRASE = /\b(?:nuansa|gaya|tema|suasana|vibes?|style)\s+\S+(?:\s+(?:dan|&)\s+\S+)?/gi;
const STYLE_WORDS =
  /\b(?:aesthetic|estetik|minimalis|retro|vintage|futuristik|neon|colorful|warna-warni|pastel|cozy|playful|gemas|kalem|adem|vibes|tegas|bold|ceria)\b/gi;

function stripStyleWords(text: string): string {
  return text
    .replace(STYLE_PHRASE, ' ')
    .replace(PLATFORM_PHRASE, ' ')
    .replace(STYLE_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFiller(s: string): string {
  const tokens = s
    .replace(/\bhari ini\b|\bflash ?sale\b|\b\d{1,3}\s*%/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !PROMO_FILLER.has(t.toLowerCase().replace(/[^a-z]/g, '')));
  while (tokens.length && LEADING_FILLER.has(tokens[0].toLowerCase())) tokens.shift();
  while (tokens.length && TRAILING_FILLER.has(tokens[tokens.length - 1].toLowerCase())) tokens.pop();
  return tokens.join(' ').replace(/^[,.!?:;\-–—]+|[,.!?:;\-–—]+$/g, '').trim();
}

function detectQuoteMood(lower: string): QuoteMood {
  for (const [mood, re] of QUOTE_MOOD_RULES) {
    if (re.test(lower)) return mood;
  }
  return 'netral';
}

function findEduPack(lower: string): EduPack {
  return EDU_PACKS.find((p) => p.match.test(lower)) || EDU_DEFAULT;
}

function detectPromoKind(lower: string): PromoKind {
  return PROMO_KINDS.find((k) => k.match.test(lower)) || PROMO_DEFAULT_KIND;
}

function stripLeadWords(s: string): string {
  return s.replace(/^(untuk|agar|supaya|biar|buat)\s+/i, '').trim();
}

function parseEduTopic(topic: string): {
  count: number | null;
  exact: boolean;
  noun: string;
  subject: string;
} {
  const t = topic.trim();
  const m = t.match(new RegExp(`^(\\d{1,2})\\s+(${EDU_NOUNS})\\b\\s*(.*)$`, 'i'));
  if (m) {
    const asked = Number(m[1]);
    const count = Math.min(6, Math.max(2, asked));
    return { count, exact: count === asked, noun: m[2].toLowerCase(), subject: stripLeadWords(m[3]) };
  }
  const m2 = t.match(/^(cara|tips|tutorial|panduan)\s+(.*)$/i);
  if (m2) {
    return {
      count: null,
      exact: false,
      noun: m2[1].toLowerCase() === 'tips' ? 'tips' : 'cara',
      subject: stripLeadWords(m2[2]),
    };
  }
  return { count: null, exact: false, noun: 'cara', subject: stripLeadWords(t) };
}

/**
 * Baca harga, harga normal, produk, dan toko dari topik.
 * Contoh: "promo kopi susu dari 25rb jadi 18rb di kopi senja"
 *  → produk "Kopi Susu", harga "Rp18rb", harga normal "Rp25rb", toko "Kopi Senja", hemat 28%.
 */
export function parseTopic(
  rawTopic: string,
  options?: GenerateOptions,
  category?: CategoryType
): ParsedTopicMeta {
  const rawClean = (rawTopic || '').replace(/\s+/g, ' ').trim();
  const cleanTopic = stripStyleWords(rawClean) || rawClean;
  const lower = rawClean.toLowerCase();

  const prices = findPrices(cleanTopic);
  let promoHit: PriceMatch | undefined;
  let originalHit: PriceMatch | undefined;
  if (prices.length) {
    const sorted = [...prices].sort((a, b) => a.value - b.value);
    promoHit = sorted[0];
    const top = sorted[sorted.length - 1];
    if (sorted.length > 1 && top.value > promoHit.value) originalHit = top;
  }

  const priceText = options?.customPrice?.trim() || promoHit?.display || '';
  const originalPriceText = options?.customOriginalPrice?.trim() || originalHit?.display || '';
  const pv = priceToNumber(priceText);
  const ov = priceToNumber(originalPriceText);
  let discountPercent =
    pv !== null && ov !== null && pv > 0 && ov > pv ? Math.round((1 - pv / ov) * 100) : null;
  const pctMatch = category === 'promo' ? cleanTopic.match(/(\d{1,2})\s*%/) : null;
  if (discountPercent === null && pctMatch) discountPercent = Number(pctMatch[1]);

  // Buang teks harga (dari belakang supaya posisi tetap valid)
  let rest = cleanTopic;
  [...prices]
    .sort((a, b) => b.start - a.start)
    .forEach((p) => {
      rest = `${rest.slice(0, p.start)} ${rest.slice(p.end)}`;
    });
  rest = rest.replace(/\s+/g, ' ').trim();

  let storeName = options?.customStoreName?.trim() || '';
  if (category === 'promo') {
    const handle = rest.match(/(?:^|\s)(@[a-z0-9._]{2,30})\s*$/i);
    if (handle && handle.index !== undefined) {
      if (!storeName) storeName = handle[1];
      rest = rest.slice(0, handle.index).trim();
    } else {
      const at = rest.match(
        /\s+di\s+((?:toko|warung|kedai|kafe|cafe|resto|restoran|outlet|butik|gerai|lapak|kios)\b[^,.!?]{0,40})$/i
      );
      if (at && at.index !== undefined) {
        const store = stripFiller(at[1]);
        if (store) {
          if (!storeName) storeName = titleCase(store);
          rest = rest.slice(0, at.index).trim();
        }
      }
    }
  }

  const productName = options?.customProductName?.trim() || titleCase(stripFiller(rest)) || '';

  const quoteMood = detectQuoteMood(lower);
  let detectedMood: ParsedTopicMeta['detectedMood'] = 'netral';
  let emotionKeyword = 'netral';
  if (prices.length || /promo|diskon|murah|sale/.test(lower)) {
    detectedMood = 'promo';
    emotionKeyword = 'antusias';
  } else if (/cara|tutorial|langkah|belajar|tips/.test(lower)) {
    detectedMood = 'edukasi';
    emotionKeyword = 'informatif';
  } else if (quoteMood !== 'netral') {
    detectedMood = 'galau';
    emotionKeyword = quoteMood;
  }

  const edu = parseEduTopic(cleanTopic);

  return {
    cleanTopic,
    productName,
    priceText,
    originalPriceText,
    storeName,
    emotionKeyword,
    detectedMood,
    discountPercent,
    subject: edu.subject,
    stepCount: edu.count,
    stepCountExact: edu.exact,
    stepNoun: edu.noun,
    quoteMood,
  };
}

export const extractTopicMetadata = parseTopic;

/** Tebak kategori dari topik (dipakai bila kategori tidak dipilih). */
export function detectCategory(topic: string): CategoryType {
  const lower = (topic || '').toLowerCase();
  if (findPrices(topic).length > 0 || /\b(promo|diskon|sale|jual|order|grosir|ongkir|harga)\b/.test(lower)) {
    return 'promo';
  }
  if (
    new RegExp(`^\\s*\\d{1,2}\\s+(${EDU_NOUNS})\\b`).test(lower) ||
    /\b(cara|tips|tutorial|panduan|belajar)\b/.test(lower)
  ) {
    return 'edukasi';
  }
  if (/\b(kata-kata|quote|quotes|renungan|pengingat|motivasi)\b/.test(lower) || detectQuoteMood(lower) !== 'netral') {
    return 'quote';
  }
  return 'promo';
}

/* -------------------------------------------------------------------------- */
/* PLACEHOLDER                                                                */
/* -------------------------------------------------------------------------- */

type PlaceholderKey = 'product' | 'price' | 'original' | 'store' | 'topic' | 'discount';

// Mendukung nama Indonesia (dokumentasi lama) dan Inggris.
const PLACEHOLDERS: Array<[string, PlaceholderKey]> = [
  ['\\{(?:product|produk)\\}', 'product'],
  ['\\{(?:price|harga)\\}', 'price'],
  ['\\{(?:original_price|harga_coret|harga_normal)\\}', 'original'],
  ['\\{(?:store|toko)\\}', 'store'],
  ['\\{(?:topic|topik)\\}', 'topic'],
  ['\\{(?:discount|diskon)\\}', 'discount'],
];

function placeholderValues(meta: ParsedTopicMeta): Record<PlaceholderKey, string> {
  return {
    product: meta.productName || '',
    price: meta.priceText || '',
    original: meta.originalPriceText || '',
    store: meta.storeName || '',
    topic: meta.cleanTopic || '',
    discount: meta.discountPercent ? String(meta.discountPercent) : '',
  };
}

/** true bila semua placeholder di template punya nilai. */
export function canFill(template: string, meta: ParsedTopicMeta): boolean {
  const values = placeholderValues(meta);
  return PLACEHOLDERS.every(
    ([source, key]) => !new RegExp(source, 'i').test(template) || values[key].trim() !== ''
  );
}

export function interpolateTemplate(template: string, meta: ParsedTopicMeta): string {
  const values = placeholderValues(meta);
  let out = template || '';
  for (const [source, key] of PLACEHOLDERS) {
    out = out.replace(new RegExp(source, 'gi'), values[key]);
  }
  return cleanSpaces(out);
}

function pickFilled(
  templates: readonly string[],
  meta: ParsedTopicMeta,
  rng: Rng,
  exclude: readonly string[] = []
): string {
  const pool = templates
    .filter((t) => canFill(t, meta))
    .filter((t) => !exclude.includes(t) && !exclude.includes(interpolateTemplate(t, meta)));
  if (!pool.length) return '';
  return interpolateTemplate(pick(pool, rng, pool[0]), meta);
}

function pickEntry(
  builtins: readonly SceneTemplateEntry[],
  customs: readonly SceneTemplateEntry[],
  meta: ParsedTopicMeta,
  rng: Rng
): SceneTemplateEntry {
  const pool = [...builtins, ...customs].filter(
    (e) => canFill(e.text, meta) && canFill(e.subtext || '', meta)
  );
  const fallback: SceneTemplateEntry = builtins[0] || { text: '', subtext: '', emoji: '' };
  const chosen = pick(pool, rng, fallback);
  return {
    text: interpolateTemplate(chosen.text, meta),
    subtext: interpolateTemplate(chosen.subtext || '', meta),
    emoji: chosen.emoji,
  };
}

const asEntries = (list: readonly string[], emoji: string): SceneTemplateEntry[] =>
  list.map((text) => ({ text, subtext: '', emoji }));

/* -------------------------------------------------------------------------- */
/* GAYA PER KATEGORI                                                          */
/* -------------------------------------------------------------------------- */

const CATEGORY_STYLE: Record<
  CategoryType,
  { paletteId: string; font: EngineFontName; musicId: string; camera: CameraMotionType }
> = {
  promo: {
    paletteId: 'promo-pop',
    font: 'Montserrat',
    musicId: 'track-energetic-drop',
    camera: 'whip-zoom-spring',
  },
  quote: {
    paletteId: 'quote-ink',
    font: 'Playfair Display',
    musicId: 'track-slow-ambient',
    camera: 'smooth-float',
  },
  edukasi: {
    paletteId: 'aurora-mint',
    font: 'Poppins',
    musicId: 'track-chill-lofi',
    camera: 'spring-slide-vertical',
  },
};

export function suggestCameraMotion(category: CategoryType): CameraMotionType {
  return (CATEGORY_STYLE[category] || CATEGORY_STYLE.promo).camera;
}

/** Font bawaan per kategori ('saas' dan lainnya → Poppins). */
export function suggestedFontFor(category: string): EngineFontName {
  return category === 'promo' || category === 'quote' || category === 'edukasi'
    ? CATEGORY_STYLE[category].font
    : 'Poppins';
}

export function suggestStyle(
  rawTopic: string,
  category: CategoryType = 'promo',
  forceRandom = false,
  rng: Rng = Math.random
): StyleSuggestion {
  void rawTopic;
  const base = CATEGORY_STYLE[category] || CATEGORY_STYLE.promo;
  const palette = forceRandom
    ? pick(COLOR_PALETTES, rng, COLOR_PALETTES[0])
    : COLOR_PALETTES.find((p) => p.id === base.paletteId) || COLOR_PALETTES[0];
  const music = MUSIC_TRACKS.find((m) => m.id === base.musicId) || MUSIC_TRACKS[0];
  return {
    paletteId: palette.id,
    colors: palette,
    font: base.font,
    musicId: music.id,
    music,
    backgroundType: 'gradient',
    gradientPreset: palette.id,
    moodLabel: `${palette.name} • ${music.bpm} BPM`,
  };
}

/* -------------------------------------------------------------------------- */
/* PENYUSUN SCENE PER KATEGORI                                                */
/* -------------------------------------------------------------------------- */

type SceneDraft = Omit<SceneItem, 'id' | 'sceneNumber' | 'imageUrl' | 'cameraMotion' | 'paletteId'>;

const joinItems = (items: Array<string | null | undefined>) =>
  items.map((s) => (s || '').trim()).filter(Boolean).join(' | ');

function buildPromoScenes(meta: ParsedTopicMeta, rng: Rng, options?: GenerateOptions): SceneDraft[] {
  const product = meta.productName;
  const kind = detectPromoKind(`${meta.cleanTopic} ${product}`.toLowerCase());
  const hasPrice = Boolean(meta.priceText);

  const urgent = /flash ?sale|buruan|terbatas|kilat|gercep|terakhir|habis|hari ini/.test(
    meta.cleanTopic.toLowerCase()
  );
  const hook =
    pickFilled(
      [...(urgent ? PROMO_URGENT_HOOKS : PROMO_HOOKS), ...BANK_HOOK.promo],
      meta,
      rng,
      options?.excludeHooks
    ) ||
    'Stop scroll! Ada promo spesial hari ini 👀';
  const hookSub = pickFilled(PROMO_HOOK_SUBTEXTS, meta, rng) || 'Promo terbatas, simak sampai habis.';

  const benefit = pickEntry(asEntries(PROMO_BENEFIT_TITLES, '✅'), BANK_SCENES.promo.scene2, meta, rng);
  const benefits = pickSome(kind.benefits, 3, rng);

  const priceTitles = hasPrice
    ? meta.discountPercent
      ? [...PROMO_PRICE_TITLES, ...PROMO_DISCOUNT_TITLES]
      : PROMO_PRICE_TITLES
    : PROMO_NOPRICE_TITLES;
  const priceScene = pickEntry(asEntries(priceTitles, '🏷️'), BANK_SCENES.promo.scene3, meta, rng);
  const priceSub =
    priceScene.subtext ||
    (meta.originalPriceText
      ? `Harga normal ${meta.originalPriceText}.`
      : hasPrice
      ? 'Selama persediaan masih ada.'
      : 'Tanya harga promonya lewat DM, ya.');
  const sticker = meta.discountPercent ? `Hemat ${meta.discountPercent}%` : 'Promo';

  const cta =
    pickFilled([...(urgent ? PROMO_URGENT_CTA : PROMO_CTA_TITLES), ...BANK_CTA.promo], meta, rng) || 'Pesan sekarang sebelum promonya habis!';
  const ctaSub = meta.storeName
    ? `Promo terbatas di ${meta.storeName}.`
    : 'Promo terbatas, jangan sampai kelewatan.';

  const productLabel = product || 'Promo spesial';

  return [
    {
      role: 'Hook / Masalah',
      text: hook,
      subtext: hookSub,
      emoji: '🔥',
      duration: 3.4,
      animation: 'pop',
      stepBadge: 'Lagi promo',
      widgetType: 'price_tag_card',
      primaryInput: productLabel,
      secondaryInput: joinItems([pick(['Promo spesial', 'Spesial hari ini'], rng, 'Promo spesial'), meta.storeName]),
    },
    {
      role: 'Isi / Solusi',
      text: benefit.text || 'Kenapa banyak yang pilih ini?',
      subtext: benefit.subtext,
      emoji: '✅',
      duration: 3.8,
      animation: 'slide-up',
      stepBadge: 'Keunggulan',
      widgetType: 'checklist_card',
      primaryInput: '',
      secondaryInput: joinItems(benefits),
    },
    {
      role: 'Bukti / Harga',
      text: priceScene.text || 'Harga spesial selama promo!',
      subtext: priceSub,
      emoji: '🏷️',
      duration: 3.6,
      animation: 'zoom',
      stepBadge: 'Harga spesial',
      widgetType: 'price_tag_card',
      primaryInput: productLabel,
      secondaryInput: hasPrice
        ? joinItems([meta.priceText, meta.originalPriceText, sticker, meta.storeName])
        : joinItems(['Harga spesial', meta.storeName]),
    },
    {
      role: 'CTA Akhir',
      text: cta,
      subtext: ctaSub,
      emoji: '🛒',
      duration: 3.2,
      animation: 'bounce',
      stepBadge: 'Cara order',
      widgetType: 'cta_button_card',
      primaryInput: pick(['Pesan Sekarang', 'Order Sekarang'], rng, 'Pesan Sekarang'),
      secondaryInput: joinItems([meta.storeName, pick(['Link di bio', 'Pesan via DM'], rng, 'Link di bio')]),
    },
  ];
}

function buildQuoteScenes(meta: ParsedTopicMeta, rng: Rng, options?: GenerateOptions): SceneDraft[] {
  const pack = QUOTE_PACKS[meta.quoteMood || 'netral'] || QUOTE_PACKS.netral;
  const hook =
    pickFilled([...pack.hooks, ...BANK_HOOK.quote], meta, rng, options?.excludeHooks) || pack.hooks[0];

  const trainedQuotes = [...BANK_SCENES.quote.scene2, ...BANK_SCENES.quote.scene3]
    .map((e) => e.text)
    .filter((t) => canFill(t, meta))
    .map((t) => interpolateTemplate(t, meta));
  const quotes = pickSome([...pack.quotes, ...trainedQuotes], 3, rng);
  for (const extra of QUOTE_PACKS.netral.quotes) {
    if (quotes.length >= 3) break;
    if (!quotes.includes(extra)) quotes.push(extra);
  }

  const signature = meta.storeName;
  const cta = pickFilled([...QUOTE_CTA_TITLES, ...BANK_CTA.quote], meta, rng) || QUOTE_CTA_TITLES[0];

  return [
    {
      role: 'Hook / Masalah',
      text: hook,
      subtext: pick(QUOTE_HOOK_SUBTEXTS, rng, ''),
      emoji: '🤍',
      duration: 4.0,
      animation: 'fade',
      stepBadge: 'Untukmu',
      widgetType: 'quote_card',
      primaryInput: quotes[0],
      secondaryInput: signature,
    },
    {
      role: 'Renungan',
      text: pick(QUOTE_LEADS_1, rng, QUOTE_LEADS_1[0]),
      subtext: '',
      emoji: '🌙',
      duration: 4.2,
      animation: 'typewriter',
      stepBadge: 'Renungan',
      widgetType: 'quote_card',
      primaryInput: quotes[1],
      secondaryInput: signature,
    },
    {
      role: 'Renungan',
      text: pick(QUOTE_LEADS_2, rng, QUOTE_LEADS_2[0]),
      subtext: '',
      emoji: '✨',
      duration: 4.2,
      animation: 'typewriter',
      stepBadge: 'Pengingat',
      widgetType: 'quote_card',
      primaryInput: quotes[2],
      secondaryInput: signature,
    },
    {
      role: 'CTA Akhir',
      text: cta,
      subtext: pick(QUOTE_CTA_SUBTEXTS, rng, ''),
      emoji: '📌',
      duration: 3.2,
      animation: 'fade',
      stepBadge: 'Simpan',
      widgetType: 'cta_button_card',
      primaryInput: 'Simpan',
      secondaryInput: 'Kirim ke teman | Follow untuk lainnya',
    },
  ];
}

function buildEdukasiScenes(meta: ParsedTopicMeta, rng: Rng, options?: GenerateOptions): SceneDraft[] {
  const lower = meta.cleanTopic.toLowerCase();
  const pack = findEduPack(lower);
  const want = meta.stepCount ?? 3;
  const steps = pickOrdered(pack.steps, Math.min(want, pack.steps.length), rng);
  for (const extra of EDU_DEFAULT.steps) {
    if (steps.length >= want) break;
    if (!steps.includes(extra)) steps.push(extra);
  }
  const n = steps.length;
  const noun = meta.stepNoun || 'cara';
  const subject = meta.subject || meta.cleanTopic || 'hal baru';

  const builtInHooks = meta.stepCount
    ? [
        `${n} ${noun} ${subject} yang jarang dibahas`,
        `${n} ${noun} ${subject} yang wajib kamu tahu`,
        ...(meta.stepCountExact ? [meta.cleanTopic] : []),
      ]
    : [`Cara ${subject} tanpa ribet`, `Mau ${subject}? Mulai dari sini`, `Panduan singkat ${subject}`];
  const hook = sentenceCase(
    pickFilled([...builtInHooks, ...BANK_HOOK.edukasi], meta, rng, options?.excludeHooks) || builtInHooks[0]
  );
  const hookSub = pick(
    meta.stepCount
      ? ['Simpan dulu biar nggak lupa.', `Nomor ${n} paling sering dilupakan.`, 'Tonton sampai habis, ya.']
      : ['Simpan dulu biar nggak lupa.', 'Tonton sampai habis, ya.'],
    rng,
    ''
  );

  const listScene = pickEntry(asEntries(EDU_LIST_TITLES, '📝'), BANK_SCENES.edukasi.scene2, meta, rng);
  const tip = pickEntry(asEntries(pack.tips, '⚠️'), BANK_SCENES.edukasi.scene3, meta, rng);
  const cta = pickFilled([...EDU_CTA_TITLES, ...BANK_CTA.edukasi], meta, rng) || EDU_CTA_TITLES[0];

  return [
    {
      role: 'Hook / Masalah',
      text: hook,
      subtext: hookSub,
      emoji: '💡',
      duration: 3.4,
      animation: 'pop',
      stepBadge: meta.stepCount ? `${n} ${noun}` : 'Edukasi',
      widgetType: 'step_number_card',
      primaryInput: String(n),
      secondaryInput: joinItems([noun, shortenAtWord(subject, 48)]),
    },
    {
      role: 'Langkah',
      text: listScene.text || EDU_LIST_TITLES[0],
      subtext: listScene.subtext,
      emoji: '📝',
      duration: Math.round((2.8 + 0.7 * n) * 10) / 10,
      animation: 'slide-up',
      stepBadge: 'Langkahnya',
      widgetType: 'checklist_card',
      primaryInput: '',
      secondaryInput: steps.map((s, i) => `${i + 1}. ${s}`).join(' | '),
    },
    {
      role: 'Tips Penting',
      text: pick(EDU_TIP_TITLES, rng, EDU_TIP_TITLES[0]),
      subtext: tip.subtext,
      emoji: '⚠️',
      duration: 3.8,
      animation: 'zoom',
      stepBadge: 'Tips penting',
      widgetType: 'step_number_card',
      primaryInput: '!',
      secondaryInput: tip.text,
    },
    {
      role: 'CTA Akhir',
      text: cta,
      subtext: 'Biar bisa kamu buka lagi kapan saja.',
      emoji: '📌',
      duration: 3.2,
      animation: 'bounce',
      stepBadge: 'Simpan',
      widgetType: 'cta_button_card',
      primaryInput: pick(['Simpan Video', 'Simpan Sekarang'], rng, 'Simpan Video'),
      secondaryInput: 'Bagikan | Follow',
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* GENERATOR UTAMA                                                            */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* PEMBACA PROMPT & PAKET GAYA                                                */
/* -------------------------------------------------------------------------- */

/** Hal-hal yang terbaca dari prompt dan dipakai untuk memilih gaya visual. */
export interface PromptKeys {
  category: CategoryType;
  /** kuliner, kopi, fashion, beauty, tech, keuangan, belajar, sehat, travel, … */
  industry: string;
  /** ceria, mewah, tenang, tegas, retro, minimal, neon, hangat */
  mood: string;
  energy: 'calm' | 'medium' | 'high';
  /** merah, pink, biru, hijau, kuning, oranye, ungu, gelap, terang, emas, pastel, coklat */
  colorHint: string;
  styleHints: string[];
  /** tiktok, reels, shorts, youtube, story, atau '' */
  platform: string;
  /** Rasio yang disarankan bila prompt menyebut platform. */
  aspect: '' | '9:16' | '1:1' | '16:9';
  urgent: boolean;
  /** Kata yang ditonjolkan di judul (harga, diskon, nama produk, angka). */
  emphasis: string[];
  /** Emoji dekorasi sesuai topik. */
  icons: string;
  topicLower: string;
}

export interface StylePack {
  id: string;
  name: string;
  /** Kata pemicu: suasana, industri, warna, gaya, atau kata bebas dari admin. */
  tags: string[];
  categories?: CategoryType[];
  paletteId: string;
  /** Warna kustom (mis. hasil ekstraksi video referensi). Studio membuat paletnya dengan id `pack-<id>`. */
  colors?: { bgStart: string; bgEnd: string; accent: string; isDark: boolean };
  bgStyle: BackgroundStyle;
  layout: SceneLayout | 'mixed';
  transition: SceneTransition;
  headlineAnim: HeadlineAnim;
  font: EngineFontName;
  camera: CameraMotionType;
  /** Pengali durasi scene: < 1 lebih cepat, > 1 lebih pelan. */
  pace: number;
  decor?: string;
  /** true untuk gaya hasil training admin. */
  trained?: boolean;
}

export interface StyleRecipe {
  packId: string;
  packName: string;
  variant: 'A' | 'B' | 'C';
  keys: PromptKeys;
}

const INDUSTRY_RULES: Array<[string, RegExp, string]> = [
  ['kopi', /kopi|coffee|cafe|kafe|latte|espresso/, '☕🤎✨'],
  ['kuliner', /kue|roti|donat|cake|dessert|brownies|cookies/, '🧁🍰✨'],
  ['kuliner', /makan|nasi|ayam|bakso|\bmie?\b|soto|sate|seblak|sambal|pizza|burger|dimsum|kuliner|resep|masak|snack|cemilan|camilan|keripik|katering|catering/, '🍜🔥😋'],
  ['kuliner', /teh\b|boba|jus|minuman|\bes\b|susu|smoothie/, '🧋🍹✨'],
  ['fashion', /sepatu|sneaker|sandal/, '👟⚡✨'],
  ['fashion', /baju|kaos|kemeja|celana|dress|gamis|hijab|jilbab|jaket|hoodie|\btas\b|outfit|batik|fashion/, '👗🛍️✨'],
  ['beauty', /skincare|serum|lipstik|parfum|lotion|sunscreen|kosmetik|make ?up|salon|nail|beauty|kecantikan/, '💄🌸✨'],
  ['tech', /aplikasi|\bapp\b|website|software|laptop|\bhp\b|gadget|coding|ngoding|teknologi|\bai\b|digital|startup/, '📱⚡💡'],
  ['keuangan', /uang|keuangan|nabung|menabung|gaji|investasi|saham|budget|cicilan|utang|hutang|bisnis|omzet|jualan/, '💰📈🪙'],
  ['belajar', /belajar|ujian|kuliah|sekolah|skripsi|kursus|\bles\b|bahasa|buku|materi/, '📚✏️💡'],
  ['sehat', /sehat|olahraga|gym|fitness|diet|tidur|yoga|lari|kesehatan|gizi/, '💪🥗❤️'],
  ['travel', /travel|wisata|liburan|hotel|villa|pantai|gunung|tiket|trip|staycation/, '✈️🌴📍'],
  ['otomotif', /motor|mobil|bengkel|otomotif|sparepart|helm/, '🏍️🚗⚡'],
  ['properti', /rumah|kos|kost|apartemen|properti|kontrakan|ruko|interior|furniture/, '🏠🔑✨'],
  ['religi', /doa|ramadan|ramadhan|lebaran|idul|ngaji|sedekah|hijrah|islami|syukur|ikhlas|sabar/, '🌙✨🤲'],
  ['gaming', /game|gaming|gamer|esport|top ?up|diamond/, '🎮🔥⚡'],
  ['musik', /musik|lagu|konser|band|gitar|podcast/, '🎧🎵✨'],
  ['anak', /bayi|anak|mainan|parenting|balita/, '🧸🍼💛'],
  ['hewan', /kucing|anjing|pet\b|hewan|grooming/, '🐱🐾💛'],
  ['jasa', /jasa|servis|service|laundry|barbershop|desain|fotografi|percetakan|sablon/, '🛠️✅✨'],
  ['cinta', /cinta|sayang|pasangan|jodoh|rindu|kangen|nikah|wedding|pacar/, '❤️🌹✨'],
  ['galau', /galau|sedih|patah hati|kecewa|kesepian|capek|lelah|burnout/, '🌧️🌙🤍'],
  ['semangat', /semangat|motivasi|sukses|mimpi|berjuang|bangkit|produktif|disiplin/, '🔥🚀💪'],
];

const MOOD_RULES: Array<[string, RegExp]> = [
  ['mewah', /mewah|elegan|premium|eksklusif|luxury|exclusive|classy|berkelas/],
  ['tenang', /tenang|kalem|adem|soft|aesthetic|estetik|lembut|healing|santai/],
  ['tegas', /tegas|bold|garang|keras|berani|maskulin|gahar/],
  ['retro', /retro|jadul|vintage|klasik|90an|y2k/],
  ['minimal', /minimalis|minimal|clean|simple|simpel|rapi|profesional/],
  ['neon', /neon|futuristik|cyber|glow|gaming/],
  ['ceria', /ceria|fun|lucu|seru|playful|colorful|warna-warni|gemas|imut/],
  ['hangat', /hangat|cozy|rumahan|homey|keluarga/],
];

const COLOR_RULES: Array<[string, RegExp]> = [
  ['merah', /\bmerah\b(?! muda)|\bred\b|maroon/],
  ['pink', /pink|merah muda|rose\b/],
  ['biru', /biru|blue|navy|tosca/],
  ['hijau', /hijau|green|sage|mint/],
  ['kuning', /kuning|yellow/],
  ['oranye', /oranye|orange|jingga/],
  ['ungu', /ungu|purple|lilac|lavender/],
  ['gelap', /hitam|gelap|dark|black/],
  ['terang', /putih|terang|cerah|white/],
  ['emas', /emas|gold/],
  ['pastel', /pastel/],
  ['coklat', /coklat|cokelat|brown|earth ?tone|krem|cream/],
];

const EMPHASIS_WORDS = /^(gratis|diskon|promo|baru|hemat|cuma|terbatas|sale|bonus|rahasia|wajib|penting|mudah|cepat)$/;

function keyOfWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9%]/g, '');
}

/** Baca prompt: industri, suasana, warna, platform, tingkat energi, dan kata yang perlu ditonjolkan. */
export function analyzePrompt(
  rawTopic: string,
  category: CategoryType,
  meta: ParsedTopicMeta = parseTopic(rawTopic, undefined, category)
): PromptKeys {
  const topicLower = (rawTopic || '').toLowerCase();
  const industryHit = INDUSTRY_RULES.find(([, re]) => re.test(topicLower));
  const industry = industryHit ? industryHit[0] : '';
  const icons = industryHit
    ? industryHit[2]
    : category === 'quote'
    ? '✨🌙🤍'
    : category === 'edukasi'
    ? '💡📌✨'
    : '🔥✨🛍️';

  const styleHints = MOOD_RULES.filter(([, re]) => re.test(topicLower)).map(([id]) => id);
  let mood = styleHints[0] || '';
  if (!mood) {
    if (category === 'quote') {
      mood = meta.quoteMood === 'semangat' ? 'tegas' : meta.quoteMood === 'cinta' ? 'hangat' : 'tenang';
    } else if (category === 'edukasi') {
      mood = 'minimal';
    } else {
      mood = industry === 'kopi' ? 'hangat' : industry === 'beauty' ? 'ceria' : 'ceria';
    }
  }

  const colorHint = (COLOR_RULES.find(([, re]) => re.test(topicLower)) || [''])[0];
  const urgent = /flash ?sale|hari ini|buruan|terbatas|cepat|kilat|gercep|last|terakhir|besok|habis/.test(topicLower);
  const platform = /story|status|\bsw\b|\bwa\b|whatsapp/.test(topicLower)
    ? 'story'
    : /tiktok/.test(topicLower)
    ? 'tiktok'
    : /shorts/.test(topicLower)
    ? 'shorts'
    : /reels|\big\b|instagram/.test(topicLower)
    ? 'reels'
    : /youtube|\byt\b/.test(topicLower)
    ? 'youtube'
    : '';
  const aspect: PromptKeys['aspect'] = /feed|postingan|persegi|square/.test(topicLower)
    ? '1:1'
    : platform === 'youtube'
    ? '16:9'
    : platform
    ? '9:16'
    : '';
  const energy: PromptKeys['energy'] =
    urgent || mood === 'tegas' || mood === 'neon' || (category === 'promo' && mood === 'ceria')
      ? 'high'
      : category === 'quote' || mood === 'tenang' || mood === 'mewah'
      ? 'calm'
      : 'medium';

  const emphasis = new Set<string>();
  [meta.priceText, meta.discountPercent ? `${meta.discountPercent}%` : ''].forEach((t) => {
    (t || '').split(/\s+/).forEach((w) => keyOfWord(w) && emphasis.add(keyOfWord(w)));
  });
  if (category === 'promo') {
    (meta.productName || '').split(/\s+/).slice(0, 2).forEach((w) => keyOfWord(w).length > 2 && emphasis.add(keyOfWord(w)));
  }
  (rawTopic || '').split(/\s+/).forEach((w) => {
    const k = keyOfWord(w);
    if (EMPHASIS_WORDS.test(k) || /^\d+%$/.test(k)) emphasis.add(k);
  });
  if (category === 'edukasi' && meta.stepCount) emphasis.add(String(meta.stepCount));

  return {
    category,
    industry,
    mood,
    energy,
    colorHint,
    styleHints,
    platform,
    aspect,
    urgent,
    emphasis: Array.from(emphasis).slice(0, 8),
    icons,
    topicLower,
  };
}

/** Paket gaya bawaan. Admin bisa menambah lewat training (addStylePackToEngine). */
export const STYLE_PACKS: StylePack[] = [
  { id: 'poster-promo', name: 'Poster Promo', tags: ['ceria', 'kuliner', 'kuning', 'merah', 'umkm', 'diskon'], categories: ['promo'], paletteId: 'promo-pop', bgStyle: 'sunburst', layout: 'mixed', transition: 'zoom', headlineAnim: 'marker', font: 'Montserrat', camera: 'whip-zoom-spring', pace: 0.95 },
  { id: 'flash-sale', name: 'Flash Sale', tags: ['tegas', 'urgent', 'flash', 'sale', 'gelap', 'neon', 'merah', 'gaming', 'otomotif'], categories: ['promo'], paletteId: 'cyber-sunset', bgStyle: 'stripes', layout: 'mixed', transition: 'flash', headlineAnim: 'pop', font: 'Anton', camera: 'whip-zoom-spring', pace: 0.85 },
  { id: 'candy', name: 'Candy Pop', tags: ['ceria', 'pink', 'beauty', 'fashion', 'pastel', 'anak', 'hewan'], categories: ['promo', 'edukasi'], paletteId: 'candy-pop', bgStyle: 'blobs', layout: 'mixed', transition: 'push-up', headlineAnim: 'spring-words', font: 'Poppins', camera: 'spring-slide-vertical', pace: 1 },
  { id: 'luxe', name: 'Emas Mewah', tags: ['mewah', 'emas', 'gelap', 'properti', 'beauty', 'fashion'], categories: ['promo', 'quote'], paletteId: 'royal-gold', bgStyle: 'spotlight', layout: 'mixed', transition: 'fade', headlineAnim: 'rise-lines', font: 'Playfair Display', camera: 'smooth-float', pace: 1.15 },
  { id: 'confetti-party', name: 'Pesta Konfeti', tags: ['ceria', 'giveaway', 'ulang tahun', 'lebaran', 'pesta', 'grand opening', 'kuning', 'anak'], categories: ['promo'], paletteId: 'promo-pop', bgStyle: 'confetti', layout: 'mixed', transition: 'zoom', headlineAnim: 'pop', font: 'Montserrat', camera: 'whip-zoom-spring', pace: 0.9 },
  { id: 'cocoa', name: 'Kopi Krim', tags: ['kopi', 'coklat', 'hangat', 'kuliner', 'retro', 'cinta'], categories: ['promo', 'quote'], paletteId: 'cocoa-cream', bgStyle: 'spotlight', layout: 'mixed', transition: 'slide', headlineAnim: 'spring-words', font: 'Playfair Display', camera: 'smooth-float', pace: 1.05 },
  { id: 'clean-paper', name: 'Kertas Bersih', tags: ['minimal', 'terang', 'jasa', 'tech', 'keuangan', 'properti'], categories: ['edukasi', 'promo'], paletteId: 'paper-clean', bgStyle: 'grid', layout: 'mixed', transition: 'slide', headlineAnim: 'rise-lines', font: 'Space Grotesk', camera: 'spring-slide-vertical', pace: 1 },
  { id: 'mint-study', name: 'Mint Belajar', tags: ['tenang', 'hijau', 'belajar', 'sehat', 'keuangan', 'minimal'], categories: ['edukasi'], paletteId: 'aurora-mint', bgStyle: 'waves', layout: 'mixed', transition: 'push-up', headlineAnim: 'spring-words', font: 'Poppins', camera: 'spring-slide-vertical', pace: 1 },
  { id: 'ocean', name: 'Biru Segar', tags: ['biru', 'tech', 'travel', 'jasa', 'sehat', 'minimal'], categories: ['edukasi', 'promo'], paletteId: 'ocean-fresh', bgStyle: 'waves', layout: 'mixed', transition: 'wipe', headlineAnim: 'marker', font: 'Montserrat', camera: 'perspective-tilt-3d', pace: 1 },
  { id: 'lavender-app', name: 'Lavender', tags: ['ungu', 'pastel', 'tech', 'belajar', 'tenang'], categories: ['edukasi', 'promo'], paletteId: 'depup-lavender', bgStyle: 'mesh', layout: 'mixed', transition: 'slide', headlineAnim: 'spring-words', font: 'Space Grotesk', camera: 'spring-slide-vertical', pace: 1 },
  { id: 'noir-bold', name: 'Hitam Tegas', tags: ['tegas', 'gelap', 'semangat', 'gaming', 'otomotif', 'sehat', 'kuning'], categories: ['quote', 'edukasi', 'promo'], paletteId: 'mono-noir', bgStyle: 'stripes', layout: 'mixed', transition: 'flash', headlineAnim: 'pop', font: 'Bebas Neue', camera: 'whip-zoom-spring', pace: 0.9 },
  { id: 'neon-night', name: 'Neon Malam', tags: ['neon', 'gaming', 'musik', 'gelap', 'ungu', 'tech'], categories: ['promo', 'edukasi', 'quote'], paletteId: 'midnight-indigo', bgStyle: 'grid', layout: 'mixed', transition: 'wipe', headlineAnim: 'typewriter', font: 'Space Grotesk', camera: 'perspective-tilt-3d', pace: 0.95 },
  { id: 'ink-quote', name: 'Tinta Malam', tags: ['tenang', 'galau', 'gelap', 'ungu', 'musik'], categories: ['quote'], paletteId: 'quote-ink', bgStyle: 'spotlight', layout: 'mixed', transition: 'fade', headlineAnim: 'typewriter', font: 'Playfair Display', camera: 'smooth-float', pace: 1.15 },
  { id: 'sunset-soft', name: 'Senja Hangat', tags: ['hangat', 'cinta', 'oranye', 'pink', 'travel', 'tenang'], categories: ['quote', 'promo'], paletteId: 'sunset-warm', bgStyle: 'blobs', layout: 'mixed', transition: 'fade', headlineAnim: 'rise-lines', font: 'Playfair Display', camera: 'smooth-float', pace: 1.1 },
  { id: 'emerald-calm', name: 'Emerald Teduh', tags: ['religi', 'hijau', 'tenang', 'mewah'], categories: ['quote'], paletteId: 'emerald-luxury', bgStyle: 'spotlight', layout: 'mixed', transition: 'fade', headlineAnim: 'rise-lines', font: 'Playfair Display', camera: 'smooth-float', pace: 1.15 },
];

export function getStylePacks(): StylePack[] {
  return STYLE_PACKS;
}

const FONT_NAMES: readonly EngineFontName[] = ['Poppins', 'Montserrat', 'Bebas Neue', 'Playfair Display', 'Space Grotesk', 'Anton'];
const CAMERA_NAMES: readonly CameraMotionType[] = ['spring-slide-vertical', 'perspective-tilt-3d', 'whip-zoom-spring', 'smooth-float'];
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback;

/** Validasi paket gaya dari database (hasil training admin). null bila tidak layak pakai. */
export function normalizeStylePack(raw: unknown, id: string, fallbackName = 'Gaya admin'): StylePack | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const tags = (Array.isArray(r.tags) ? r.tags : String(r.tags || '').split(','))
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 24);
  const c = (r.colors || null) as Record<string, unknown> | null;
  const colors =
    c && isHex(c.bgStart) && isHex(c.bgEnd) && isHex(c.accent)
      ? { bgStart: c.bgStart, bgEnd: c.bgEnd, accent: c.accent, isDark: Boolean(c.isDark) }
      : undefined;
  const cats = (Array.isArray(r.categories) ? r.categories : []).filter(
    (x): x is CategoryType => x === 'promo' || x === 'quote' || x === 'edukasi'
  );
  return {
    id,
    name: String(r.name || fallbackName).slice(0, 60),
    tags,
    categories: cats.length ? cats : undefined,
    paletteId: typeof r.paletteId === 'string' && r.paletteId ? r.paletteId : 'promo-pop',
    colors,
    bgStyle: oneOf(BACKGROUND_STYLES, r.bgStyle, 'mesh'),
    layout: r.layout === 'mixed' ? 'mixed' : oneOf(SCENE_LAYOUTS, r.layout, 'stack'),
    transition: oneOf(SCENE_TRANSITIONS, r.transition, 'fade'),
    headlineAnim: oneOf(HEADLINE_ANIMS, r.headlineAnim, 'spring-words'),
    font: oneOf(FONT_NAMES, r.font, 'Poppins'),
    camera: oneOf(CAMERA_NAMES, r.camera, 'spring-slide-vertical'),
    pace: Math.min(1.4, Math.max(0.7, Number(r.pace) || 1)),
    decor: typeof r.decor === 'string' ? r.decor.slice(0, 16) : undefined,
    trained: true,
  };
}

export function addStylePackToEngine(pack: StylePack): void {
  const idx = STYLE_PACKS.findIndex((p) => p.id === pack.id);
  if (idx >= 0) STYLE_PACKS[idx] = pack;
  else STYLE_PACKS.push(pack);
}

export function removeStylePackFromEngine(id: string): void {
  const idx = STYLE_PACKS.findIndex((p) => p.id === id && p.trained);
  if (idx >= 0) STYLE_PACKS.splice(idx, 1);
}

/** Id palet yang dipakai sebuah paket gaya di studio. */
export function paletteIdOfPack(pack: StylePack): string {
  return pack.colors ? `pack-${pack.id}` : pack.paletteId;
}

/**
 * Pilih paket gaya yang paling cocok dengan prompt. Ada unsur acak di antara 3 kandidat teratas
 * supaya hasil tidak selalu sama, tapi tetap searah dengan nuansa prompt.
 */
export function pickStylePack(keys: PromptKeys, rng: Rng = Math.random): StylePack {
  const explicit = new Set(keys.styleHints);
  const scored = STYLE_PACKS.filter((p) => !p.categories || p.categories.includes(keys.category))
    .map((p) => {
      let score = 0;
      for (const tag of p.tags) {
        if (explicit.has(tag)) score += 5;
        else if (tag === keys.mood) score += 1.5;
        if (keys.colorHint && tag === keys.colorHint) score += 6;
        if (keys.industry && tag === keys.industry) score += 3;
        if (keys.urgent && tag === 'urgent') score += 5;
        if (keys.platform && tag === keys.platform) score += 2;
        if (tag.length > 2 && !explicit.has(tag) && tag !== keys.industry && keys.topicLower.includes(tag)) {
          score += p.trained ? 6 : 3;
        }
      }
      return { p, score: score + rng() * 2 };
    })
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return STYLE_PACKS[0];
  // Biasanya gaya terbaik, sesekali kandidat ke-2/ke-3 supaya tidak monoton
  // Prompt dengan sinyal kuat → hampir selalu gaya terbaik; prompt samar → lebih bervariasi
  const strong = scored.length > 1 && scored[0].score - scored[1].score >= 4;
  const r = rng();
  const idx = strong ? (r < 0.9 ? 0 : 1) : r < 0.7 ? 0 : r < 0.92 ? 1 : 2;
  return scored[Math.min(idx, scored.length - 1)].p;
}

/** Atribut visual satu scene berdasarkan paket gaya. Dipakai generator dan tombol "Acak gaya". */
export function styleFieldsFor(
  pack: StylePack,
  sceneIndex: number,
  widgetType: string | undefined,
  hasPriceOrText: boolean,
  keys: Pick<PromptKeys, 'icons' | 'emphasis'> & Partial<Pick<PromptKeys, 'energy'>>,
  rng: Rng = Math.random,
  fixedLayout?: SceneLayout
): Required<Pick<SceneItem, 'cameraMotion' | 'paletteId' | 'layout' | 'transition' | 'bgStyle' | 'headlineAnim' | 'decor' | 'emphasis'>> {
  let layout: SceneLayout = fixedLayout || (pack.layout === 'mixed' ? 'stack' : pack.layout);
  if (!fixedLayout && pack.layout === 'mixed') {
    const r = rng();
    if (widgetType === 'cta_button_card' && r < 0.4) layout = 'card-first';
    else if (widgetType === 'price_tag_card' && sceneIndex === 0 && !hasPriceOrText && r < 0.4) layout = 'center-text';
    else if (widgetType === 'quote_card' && r < 0.25) layout = 'card-first';
    else if (widgetType === 'checklist_card' && r < 0.2) layout = 'card-first';
  }
  return {
    cameraMotion: pack.camera,
    paletteId: paletteIdOfPack(pack),
    layout,
    transition: pack.transition,
    bgStyle: pack.bgStyle,
    headlineAnim:
      sceneIndex === 0 && keys.energy === 'high' && pack.headlineAnim !== 'typewriter'
        ? 'pop'
        : pack.headlineAnim,
    decor: pack.decor || keys.icons,
    emphasis: keys.emphasis.join('|'),
  };
}

/* -------------------------------------------------------------------------- */
/* VARIASI SUSUNAN SCENE                                                      */
/* -------------------------------------------------------------------------- */

function chooseVariant(
  category: CategoryType,
  drafts: SceneDraft[],
  meta: ParsedTopicMeta,
  keys: PromptKeys,
  rng: Rng
): 'A' | 'B' | 'C' {
  const r = rng();
  if (category === 'promo') {
    if (keys.platform === 'story') return r < 0.6 ? 'C' : 'A';
    if (meta.priceText && r < 0.3) return 'B';
    return r < 0.8 ? 'A' : 'C';
  }
  if (category === 'quote') return r < 0.45 ? 'A' : r < 0.75 ? 'B' : 'C';
  const stepCount = (drafts[1]?.secondaryInput || '').split('|').filter((x) => x.trim()).length;
  if (stepCount <= 4 && r < 0.35) return 'B';
  return r < 0.75 ? 'A' : 'C';
}

/** A = susunan lengkap. B = susunan alternatif. C = versi ringkas (cocok untuk story/status). */
function varyStructure(
  category: CategoryType,
  drafts: SceneDraft[],
  meta: ParsedTopicMeta,
  variant: 'A' | 'B' | 'C',
  rng: Rng
): SceneDraft[] {
  if (variant === 'A' || drafts.length < 4) return drafts;
  const [hook, second, third, cta] = drafts;

  if (category === 'promo') {
    if (variant === 'C') return [{ ...hook, layout: 'center-text' }, third, cta];
    if (!meta.priceText) return drafts;
    return [
      {
        ...third,
        role: 'Hook / Masalah',
        text: `${meta.productName || 'Promo spesial'} sekarang cuma ${meta.priceText}!`,
        stepBadge: 'Harga spesial',
        emoji: '🏷️',
      },
      second,
      {
        role: 'Isi / Solusi',
        text: pick(['Promonya terbatas!', 'Jangan sampai kehabisan!'], rng, 'Promonya terbatas!'),
        subtext: 'Selama persediaan masih ada.',
        emoji: '⏰',
        duration: 3,
        animation: 'zoom',
        stepBadge: 'Terbatas',
        widgetType: 'step_number_card',
        primaryInput: '⏰',
        secondaryInput: 'Promo terbatas | Pesan sebelum kehabisan',
      },
      cta,
    ];
  }

  if (category === 'quote') {
    if (variant === 'C') return [hook, second, cta];
    // B: pembuka berupa teks besar tanpa kartu, lalu kutipan satu per satu
    return [
      { ...hook, layout: 'center-text', duration: 3 },
      { ...second, primaryInput: hook.primaryInput },
      { ...third, primaryInput: second.primaryInput },
      cta,
    ];
  }

  // edukasi
  if (variant === 'C') return [hook, second, cta];
  const steps = (second.secondaryInput || '')
    .split('|')
    .map((x) => x.trim().replace(/^\d{1,2}[.)]\s*/, ''))
    .filter(Boolean);
  if (!steps.length || steps.length > 4) return drafts;
  return [
    hook,
    ...steps.map(
      (step, i): SceneDraft => ({
        role: 'Langkah',
        text: `${sentenceCase(meta.stepNoun || 'cara')} ke-${i + 1}`,
        subtext: '',
        emoji: '📝',
        duration: 2.8,
        animation: 'slide-up',
        stepBadge: `${i + 1} dari ${steps.length}`,
        widgetType: 'step_number_card',
        primaryInput: String(i + 1),
        secondaryInput: step,
      })
    ),
    cta,
  ];
}

function normalizeHashtag(tag: string): string {
  const body = tag.replace(/^#/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return body.length >= 2 ? `#${body}` : '';
}

export function generateCaptionAndHashtags(
  topic: string,
  category: CategoryType,
  scenesOrMeta?: SceneItem[] | ParsedTopicMeta,
  maybeMeta?: ParsedTopicMeta
): { caption: string; hashtags: string[] } {
  const scenes = Array.isArray(scenesOrMeta) ? scenesOrMeta : [];
  const meta =
    maybeMeta ||
    (scenesOrMeta && !Array.isArray(scenesOrMeta) ? scenesOrMeta : parseTopic(topic, undefined, category));
  const lower = (topic || '').toLowerCase();

  const tags: string[] = [...(BANK_HASHTAGS[category] || BANK_HASHTAGS.promo)];
  let caption: string;

  if (category === 'quote') {
    const quote =
      scenes.find((s) => s.widgetType === 'quote_card' && s.primaryInput)?.primaryInput ||
      scenes[0]?.text ||
      '';
    caption = `${quote} 🤍 Simpan dan kirim ke orang yang lagi butuh.`;
    tags.push(...QUOTE_PACKS[meta.quoteMood || detectQuoteMood(lower)].hashtags);
  } else if (category === 'edukasi') {
    const title = scenes[0]?.text || sentenceCase(meta.cleanTopic);
    caption = `${title} 📌 Simpan biar nggak lupa, bagikan ke teman yang butuh.`;
    tags.push(...findEduPack(lower).hashtags);
  } else {
    const product = meta.productName || 'Promo spesial';
    caption = `🔥 ${product}${meta.priceText ? ` cuma ${meta.priceText}` : ' lagi promo'}${
      meta.originalPriceText ? ` (normal ${meta.originalPriceText})` : ''
    }${meta.storeName ? ` di ${meta.storeName}` : ''}. Promo terbatas, yuk order sekarang!`;
    tags.push(...detectPromoKind(`${lower} ${product.toLowerCase()}`).hashtags);
    const storeTag = normalizeHashtag(meta.storeName || '');
    if (storeTag.length > 3 && storeTag.length <= 30) tags.push(storeTag);
  }

  Object.entries(TOPIC_HASHTAG_MAP).forEach(([kw, list]) => {
    if (kw && lower.includes(kw)) tags.push(...list);
  });
  tags.push('#fyp');

  const unique = Array.from(new Set(tags.map(normalizeHashtag).filter(Boolean)));
  return { caption: cleanSpaces(caption), hashtags: unique.slice(0, 8) };
}

/**
 * Buat script video lengkap sesuai kategori.
 * Setiap pemanggilan tanpa `seed` menghasilkan variasi kalimat yang berbeda.
 */
export function generateScript(
  rawTopic: string,
  category: CategoryType = 'promo',
  options?: GenerateOptions
): GeneratedScriptResult {
  const rng = createRng(options?.seed);
  const meta = parseTopic(rawTopic, options, category);
  const style = suggestStyle(rawTopic, category, options?.forceRandomPalette, rng);

  const baseDrafts =
    category === 'quote'
      ? buildQuoteScenes(meta, rng, options)
      : category === 'edukasi'
      ? buildEdukasiScenes(meta, rng, options)
      : buildPromoScenes(meta, rng, options);

  // Gaya visual & susunan scene mengikuti isi prompt
  const keys = analyzePrompt(rawTopic, category, meta);
  const forcedPack = options?.stylePackId
    ? STYLE_PACKS.find((p) => p.id === options.stylePackId)
    : undefined;
  const pack = forcedPack || pickStylePack(keys, rng);
  const variant = options?.variant || chooseVariant(category, baseDrafts, meta, keys, rng);
  const drafts = varyStructure(category, baseDrafts, meta, variant, rng);

  if (!options?.forceRandomPalette) {
    const packPalette = COLOR_PALETTES.find((p) => p.id === pack.paletteId);
    style.paletteId = paletteIdOfPack(pack);
    if (packPalette && !pack.colors) style.colors = packPalette;
    style.gradientPreset = style.paletteId;
    style.font = pack.font;
    style.moodLabel = `${pack.name} • ${style.music.bpm} BPM`;
  }

  const fallbackImage = CUSTOM_IMAGE_ASSETS.find((a) => a.category === category)?.url;
  const scenes: SceneItem[] = drafts.map((draft, i) => {
    const visual = styleFieldsFor(
      pack,
      i,
      draft.widgetType,
      Boolean(meta.priceText),
      keys,
      rng,
      draft.layout
    );
    return {
      id: `scene-${i + 1}`,
      sceneNumber: i + 1,
      ...draft,
      duration: Math.round(draft.duration * pack.pace * 10) / 10,
      imageUrl: options?.userImages?.[i] || fallbackImage,
      ...visual,
      paletteId: options?.forceRandomPalette ? style.paletteId : visual.paletteId,
    };
  });

  const { caption, hashtags } = generateCaptionAndHashtags(rawTopic, category, scenes, meta);

  return {
    hook: scenes[0]?.text || '',
    scenes,
    caption,
    hashtags,
    suggestedMusic: style.music,
    suggestedColor: style.colors,
    suggestedStyle: style,
    extractedMeta: meta,
    recipe: { packId: pack.id, packName: pack.name, variant, keys },
  };
}

/** Kompatibilitas versi lama: kategori ditebak dari prompt. */
export function generateDynamicMotionScenes(prompt: string, presetId?: string): GeneratedMotionScene[] {
  void presetId;
  const result = generateScript(prompt, detectCategory(prompt));
  return result.scenes.map((s) => ({
    id: s.id,
    stepBadge: s.stepBadge || '',
    title: s.text,
    subtext: s.subtext,
    duration: s.duration,
    paletteId: s.paletteId || result.suggestedStyle.paletteId,
    widgetType: s.widgetType || 'checklist_card',
    widgetData: { primaryInput: s.primaryInput, secondaryBadge: s.secondaryInput },
    cameraMotion: s.cameraMotion || 'spring-slide-vertical',
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  }));
}

export function randomizeHookAndStyle(
  currentTopic: string,
  category: CategoryType = 'promo',
  currentPaletteId = 'promo-pop',
  options?: GenerateOptions
): {
  newScript: GeneratedScriptResult;
  randomPalette: ColorPalette;
  randomMusic: MusicTrack;
} {
  const otherPalettes = COLOR_PALETTES.filter((p) => p.id !== currentPaletteId);
  const randomPalette =
    otherPalettes[Math.floor(Math.random() * otherPalettes.length)] || COLOR_PALETTES[0];
  const randomMusic = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];

  const newScript = generateScript(currentTopic, category, {
    ...options,
    forceRandomPalette: true,
  });

  newScript.suggestedColor = randomPalette;
  newScript.suggestedMusic = randomMusic;
  newScript.suggestedStyle = {
    ...newScript.suggestedStyle,
    paletteId: randomPalette.id,
    colors: randomPalette,
    musicId: randomMusic.id,
    music: randomMusic,
    gradientPreset: randomPalette.id,
  };
  newScript.scenes = newScript.scenes.map((s) => ({ ...s, paletteId: randomPalette.id }));

  return {
    newScript,
    randomPalette,
    randomMusic,
  };
}
