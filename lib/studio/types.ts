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

export type LayerKind = 'text' | 'image' | 'icon' | 'component' | 'shape';

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

export type Layer = TextLayer | ImageLayer | IconLayer | ComponentLayer | ShapeLayer;

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
  keywords: string[];
  items: PlanItem[];
  caption: string;
  hashtags: string[];
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
  plan: ContentPlan;
  showProgress: boolean;
  watermark?: string;
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
