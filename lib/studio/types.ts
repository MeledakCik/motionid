/**
 * MotionKu Studio v6 — model dokumen proyek.
 * Semua koordinat memakai "unit kanvas dasar": lebar 1080, tinggi mengikuti rasio.
 * Renderer menskalakan ke ukuran kanvas sebenarnya (preview kecil atau export 1080p).
 */

export type Aspect = '9:16' | '4:5' | '1:1' | '16:9';
export type Category = 'promo' | 'quote' | 'edukasi';

export type Intent =
  | 'promo-produk'
  | 'flash-sale'
  | 'menu-kuliner'
  | 'launching'
  | 'event'
  | 'tips'
  | 'tutorial'
  | 'fakta'
  | 'quote-motivasi'
  | 'quote-galau'
  | 'testimoni'
  | 'before-after'
  | 'lowongan'
  | 'pengumuman'
  | 'ucapan'
  | 'travel'
  | 'cerita';

export type FontId =
  | 'Poppins'
  | 'Montserrat'
  | 'Bebas Neue'
  | 'Playfair Display'
  | 'Space Grotesk'
  | 'Anton'
  | 'Plus Jakarta Sans';

export type BgPattern =
  | 'none'
  | 'dots'
  | 'grid'
  | 'rays'
  | 'blobs'
  | 'stripes'
  | 'noise'
  | 'waves'
  | 'halftone'
  | 'bokeh'
  | 'bubbles';

export interface Fill {
  type: 'solid' | 'gradient' | 'image';
  color: string;
  colors?: string[];
  angle?: number;
  /** id aset (lihat ProjectDoc.assets) atau URL/data-URI */
  src?: string;
  fit?: 'cover' | 'contain';
  /** 0..1 — lapisan gelap di atas foto agar teks terbaca */
  dim?: number;
  blur?: number;
  kenBurns?: boolean;
  pattern?: BgPattern;
  patternColor?: string;
  patternOpacity?: number;
}

export interface AnimRef {
  id: string;
  /** detik */
  duration: number;
  /** detik, relatif terhadap awal layer */
  delay?: number;
}

export type LayerKind = 'text' | 'image' | 'icon' | 'component' | 'shape' | 'path' | 'group' | 'video';

/**
 * Keyframe gaya After Effects / Alight Motion. Waktu dalam detik sejak awal scene.
 * Setiap keyframe menyimpan pose lengkap; easing berlaku dari keyframe ini ke keyframe berikutnya.
 */
export interface Keyframe {
  t: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scale: number;
  /** id easing, atau 'custom' untuk kurva bezier sendiri (graph editor) */
  ease: string;
  /** kurva cubic-bezier [x1, y1, x2, y2] bila ease === 'custom' */
  bez?: [number, number, number, number];
}

export interface LayerBase {
  id: string;
  kind: LayerKind;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  hidden?: boolean;
  locked?: boolean;
  /** detik sejak awal scene */
  start: number;
  /** detik sejak awal scene; null = sampai scene selesai */
  end: number | null;
  animIn?: AnimRef | null;
  animOut?: AnimRef | null;
  /** animasi berulang (emphasis) setelah animasi masuk selesai */
  animLoop?: string | null;
  shadow?: { color: string; blur: number; x: number; y: number } | null;
  /** teks/isi contoh yang belum diganti user */
  placeholder?: boolean;
  /** animasi keyframe (posisi, putar, transparansi, skala) */
  keyframes?: Keyframe[];
}

export interface TextLayer extends LayerBase {
  kind: 'text';
  text: string;
  font: FontId;
  size: number;
  weight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  uppercase?: boolean;
  italic?: boolean;
  stroke?: { color: string; width: number } | null;
  /** blok sorot di belakang teks */
  highlight?: { color: string; padding: number; radius: number } | null;
  /** kata yang diberi warna aksen */
  emphasisColor?: string;
  emphasisWords?: string[];
}

export interface ImageLayer extends LayerBase {
  kind: 'image';
  src: string;
  fit: 'cover' | 'contain';
  radius: number;
  border?: { color: string; width: number } | null;
  mask?: 'none' | 'circle' | 'blob' | 'arch';
}

export interface IconLayer extends LayerBase {
  kind: 'icon';
  iconId: string;
  color: string;
  strokeWidth: number;
  bg?: { shape: 'circle' | 'square' | 'squircle'; color: string } | null;
}

export interface ComponentLayer extends LayerBase {
  kind: 'component';
  componentId: string;
  props: Record<string, string>;
  colors: { primary: string; secondary: string; text: string; surface: string };
}

export interface ShapeLayer extends LayerBase {
  kind: 'shape';
  shape: 'rect' | 'circle' | 'line' | 'triangle' | 'star' | 'blob' | 'arrow';
  fill: string;
  stroke?: { color: string; width: number } | null;
  radius: number;
}

/** Titik jangkar vektor. Koordinat 0..1 relatif terhadap kotak layer; handle relatif terhadap titik. */
export interface PathPoint {
  x: number;
  y: number;
  /** handle masuk (offset dari titik) */
  ix?: number;
  iy?: number;
  /** handle keluar (offset dari titik) */
  ox?: number;
  oy?: number;
}

/** Vektor bebas gaya Illustrator: dibuat dengan pena, pensil, atau garis. */
export interface PathLayer extends LayerBase {
  kind: 'path';
  points: PathPoint[];
  closed: boolean;
  /** null = tanpa isi */
  fill: string | null;
  /** gradien isi: warna akhir + sudut */
  gradient?: { to: string; angle: number } | null;
  stroke: { color: string; width: number; cap?: 'round' | 'butt' | 'square' } | null;
  /** efek "gambar garis" (trim path): garis tergambar selama N detik sejak layer muncul */
  drawOn?: number;
  /** kontur tambahan (hasil boolean: lubang / pulau), digambar dengan aturan evenodd */
  extra?: PathPoint[][];
}

/** Grup / instance komponen buatan sendiri (gaya Figma). Anak memakai koordinat lokal grup. */
export interface GroupLayer extends LayerBase {
  kind: 'group';
  children: Layer[];
  /** ukuran isi asli; anak diskalakan w/cw dan h/ch */
  cw: number;
  ch: number;
  /** id komponen utama (ProjectDoc.symbols) bila ini instance komponen */
  symbolId?: string;
  /** anak paling bawah menjadi bentuk mask untuk anak lainnya (gaya Figma) */
  mask?: boolean;
}

/** Klip video (gaya CapCut): potong awal/akhir, kecepatan, volume. */
export interface VideoLayer extends LayerBase {
  kind: 'video';
  /** id di ProjectDoc.media */
  mediaId: string;
  /** detik di file sumber tempat klip mulai */
  trimIn: number;
  /** detik di file sumber tempat klip selesai */
  trimOut: number;
  speed: number;
  volume: number;
  muted?: boolean;
  fit: 'cover' | 'contain';
  radius: number;
}

/** Berkas media besar (video). Isinya disimpan di IndexedDB / Supabase Storage, bukan di dokumen. */
export interface MediaInfo {
  id: string;
  name: string;
  kind: 'video';
  mime: string;
  duration: number;
  w: number;
  h: number;
  size: number;
  hasAudio?: boolean;
  /** path di bucket Supabase "media" bila sudah terunggah */
  remote?: string;
  /** dari proyek impor: file belum disambungkan */
  missing?: boolean;
}

export type Layer = TextLayer | ImageLayer | IconLayer | ComponentLayer | ShapeLayer | PathLayer | GroupLayer | VideoLayer;

/** Komponen buatan user: disimpan di proyek, bisa dipakai ulang berkali-kali. */
export interface SymbolDef {
  id: string;
  name: string;
  w: number;
  h: number;
  children: Layer[];
}

export type SceneRole =
  | 'hook'
  | 'masalah'
  | 'poin'
  | 'langkah'
  | 'produk'
  | 'harga'
  | 'bukti'
  | 'kutipan'
  | 'info'
  | 'cta';

export interface Scene {
  id: string;
  name: string;
  role: SceneRole;
  duration: number;
  background: Fill;
  layers: Layer[];
  /** transisi masuk ke scene ini (diabaikan di scene pertama) */
  transition: { id: string; duration: number };
  /** efek visual (hujan, kaca pecah, pasir, confetti, dll) */
  effects?: Array<{ id: string; amount?: number }>;
}

export interface Palette {
  bg: string;
  bg2: string;
  primary: string;
  secondary: string;
  text: string;
  muted: string;
  surface: string;
}

export interface Theme {
  palette: Palette;
  headingFont: FontId;
  bodyFont: FontId;
}

export interface PlanItem {
  role: SceneRole;
  /** teks contoh (bukan dari user) — wajib diganti sebelum dipublikasikan */
  placeholder?: boolean;
  title: string;
  body?: string;
  value?: string;
  icon?: string;
}

/** Hasil analisis prompt — disimpan supaya template bisa diganti tanpa kehilangan isi. */
export interface ContentPlan {
  prompt: string;
  intent: Intent;
  category: Category;
  mood: 'energik' | 'tenang' | 'mewah' | 'lucu' | 'serius' | 'galau' | 'hangat';
  product?: string;
  store?: string;
  price?: string;
  oldPrice?: string;
  discount?: string;
  cta: string;
  handle?: string;
  location?: string;
  date?: string;
  /** jam acara/buka yang terbaca ("19.00", "Ba'da Isya") */
  time?: string;
  /** kontak utama yang terbaca (WA, telepon, email, link, @akun) */
  contact?: string;
  /** catatan harga ("Bisa nego") */
  priceNote?: string;
  /** keunggulan/fitur yang terbaca dari prompt */
  features?: string[];
  keywords: string[];
  items: PlanItem[];
  caption: string;
  hashtags: string[];
  /** efek pilihan user; undefined = pakai saran otomatis dari prompt */
  effects?: string[];
}

/** Narasi / voice over: skrip + suara hasil rekam/unggah. */
export interface NarrationDoc {
  /** aktif atau tidak; audio hanya masuk MP4 kalau enabled + ada data */
  enabled: boolean;
  /** skrip narasi (bisa dibuat otomatis dari isi scene) */
  script: string;
  /** rekaman mikrofon / file audio unggahan (data URI) */
  data?: string | null;
  /** nama sumber audio, mis. "Rekaman narasi" */
  name?: string;
  /** volume narasi 0..1 */
  volume: number;
  /** kecilkan musik otomatis saat narasi berbunyi */
  duckMusic: boolean;
  /** geser mulai narasi (detik) */
  start: number;
}

export interface ProjectDoc {
  version: 6;
  id: string;
  title: string;
  aspect: Aspect;
  templateId: string;
  theme: Theme;
  scenes: Scene[];
  /** foto unggahan user: id -> data URI (dikompres) */
  assets: Record<string, string>;
  music: { id: string; volume: number };
  /** lagu unggahan user (data URI), dipakai bila music.id === 'upload' */
  audio?: { name: string; data: string } | null;
  /** narasi / voice over (opsional, project lama tidak punya field ini) */
  narration?: NarrationDoc | null;
  plan: ContentPlan;
  showProgress: boolean;
  watermark?: string;
  /** komponen buatan user (gaya Figma) */
  symbols?: Record<string, SymbolDef>;
  /** klip video (isi file di IndexedDB / Supabase Storage) */
  media?: Record<string, MediaInfo>;
  /** asal proyek impor + catatan bagian yang tidak bisa diterjemahkan */
  imported?: { from: 'after-effects' | 'alight-motion' | 'capcut'; file: string; notes: string[] };
}

export const BASE_W = 1080;
export function canvasSize(aspect: Aspect): { w: number; h: number } {
  switch (aspect) {
    case '16:9':
      return { w: 1920, h: 1080 };
    case '1:1':
      return { w: 1080, h: 1080 };
    case '4:5':
      return { w: 1080, h: 1350 };
    default:
      return { w: 1080, h: 1920 };
  }
}

export function docDuration(doc: ProjectDoc): number {
  return doc.scenes.reduce((a, s) => a + s.duration, 0);
}

let uidCounter = 0;
export function uid(prefix = 'id'): string {
  uidCounter = (uidCounter + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}${uidCounter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
