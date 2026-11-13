import type { CSSProperties } from 'react';
import type { CategoryType } from '@/lib/smart-engine';

/**
 * MotionKu Creative Pack Library
 * ---------------------------------------------------------------------------
 * Satu tempat untuk library besar yang dipakai Studio:
 * - 300+ icon pack (SVG aman, tanpa script)
 * - 300+ component pack (gaya kartu)
 * - 300+ transition pack
 * - 300+ animation pack
 * - 48 variasi gaya untuk memperbanyak template scene (dipakai Studio)
 *
 * Pack bawaan dibuat dari kombinasi bentuk + tema supaya ringan, konsisten,
 * dan tetap terasa seperti library desain (bukan file gambar yang berat).
 */

export type CreativePackKind = 'icon' | 'component' | 'transition' | 'animation';
export type PackCategory = CategoryType | 'all';
export type PackAuthor = 'builtin' | 'admin';

export interface IconPathPart {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface IconPackDefinition {
  id: string;
  kind: 'icon';
  name: string;
  tags: string[];
  category: PackCategory;
  glyph: string;
  svg: string;
  paths: IconPathPart[];
  color: string;
  accent: string;
  author: PackAuthor;
}

export interface ComponentStyleSpec {
  background: string;
  foreground: string;
  border: string;
  accent: string;
  radius: number;
  shadow: number;
  opacity: number;
}

export interface ComponentPackDefinition {
  id: string;
  kind: 'component';
  name: string;
  tags: string[];
  category: PackCategory;
  code: string;
  style: ComponentStyleSpec;
  author: PackAuthor;
}

export interface TransitionSpec {
  fromX: number;
  fromY: number;
  fromScale: number;
  fromRotate: number;
  fade: boolean;
  wipe: boolean;
  flash: boolean;
  duration: number;
  easing: string;
}

export interface TransitionPackDefinition {
  id: string;
  kind: 'transition';
  name: string;
  tags: string[];
  category: PackCategory;
  code: string;
  spec: TransitionSpec;
  author: PackAuthor;
}

export interface AnimationSpec {
  fromX: number;
  fromY: number;
  fromScale: number;
  fromRotate: number;
  stagger: number;
  fade: boolean;
  duration: number;
  easing: string;
}

export interface AnimationPackDefinition {
  id: string;
  kind: 'animation';
  name: string;
  tags: string[];
  category: PackCategory;
  code: string;
  spec: AnimationSpec;
  author: PackAuthor;
}

export type CreativePackDefinition =
  | IconPackDefinition
  | ComponentPackDefinition
  | TransitionPackDefinition
  | AnimationPackDefinition;

/* -------------------------------------------------------------------------- */
/* Icon packs                                                                  */
/* -------------------------------------------------------------------------- */

const ICON_GLYPHS: Array<{ key: string; name: string; d: string; tags: string[] }> = [
  { key: 'star', name: 'Bintang', d: 'M12 2.6l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.7 6.1 20.9l1.2-6.6L2.5 9.6l6.6-.9z', tags: ['rating', 'favorit'] },
  { key: 'heart', name: 'Hati', d: 'M12 21s-7.5-4.6-9.4-9.4C1.1 7.9 3.2 4.5 6.7 4.5c2 0 3.4 1.1 4.3 2.4.9-1.3 2.3-2.4 4.3-2.4 3.5 0 5.6 3.4 4.1 7.1C19.5 16.4 12 21 12 21z', tags: ['cinta', 'suka'] },
  { key: 'bolt', name: 'Petir', d: 'M13 2L4.5 13.5H10l-1 8.5L18 10h-5.6z', tags: ['cepat', 'energi'] },
  { key: 'check', name: 'Centang', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm-1.1 14.2l-4.2-4.2 1.5-1.5 2.7 2.7 5.4-5.4 1.5 1.5z', tags: ['benar', 'selesai'] },
  { key: 'arrow', name: 'Panah', d: 'M5 12h11.2l-3.6-3.6L14 7l6 5-6 5-1.4-1.4 3.6-3.6H5z', tags: ['lanjut', 'arah'] },
  { key: 'fire', name: 'Api', d: 'M12 2c1.5 3.4-.3 4.7-1.8 6.4-1.3 1.5-2.7 3.1-2.2 5.6.6 2.6 2.7 4.4 5.4 4.4 2.9 0 5-2.1 5-5.2 0-3.5-2.3-5.4-3.4-7.5C13.9 4.1 13.3 2.9 12 2z', tags: ['promo', 'panas'] },
  { key: 'spark', name: 'Kilau', d: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z', tags: ['baru', 'highlight'] },
  { key: 'cart', name: 'Keranjang', d: 'M3 4h2.2l1.3 2h13.2l-2.2 8.2H8.1L6.4 8.7 5.3 6H3zm5.2 14.5a1.7 1.7 0 103.4 0 1.7 1.7 0 00-3.4 0zm7 0a1.7 1.7 0 103.4 0 1.7 1.7 0 00-3.4 0z', tags: ['belanja', 'toko'] },
  { key: 'tag', name: 'Label', d: 'M3 11V4h7l10 10-6 6L3 11zm4.5-3.5A1.5 1.5 0 107.5 5a1.5 1.5 0 000 3z', tags: ['harga', 'diskon'] },
  { key: 'gift', name: 'Hadiah', d: 'M4 11h16v9H4v-9zm-1-4h18v4H3V7zm7 0V5.5A2.5 2.5 0 017.5 3 2.5 2.5 0 005 5.5V7h5zm2 0h5V5.5A2.5 2.5 0 0014.5 3 2.5 2.5 0 0012 5.5V7z', tags: ['bonus', 'giveaway'] },
  { key: 'camera', name: 'Kamera', d: 'M4 7h4l1.5-2h5L16 7h4a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2zm8 10a4 4 0 100-8 4 4 0 000 8z', tags: ['foto', 'video'] },
  { key: 'music', name: 'Musik', d: 'M9 18.5A2.5 2.5 0 116.5 16c.5 0 1 .1 1.5.3V4l10-2v12.5A2.5 2.5 0 1115.5 12c.5 0 1 .1 1.5.3V6L9 7.5v11z', tags: ['lagu', 'audio'] },
  { key: 'coffee', name: 'Kopi', d: 'M4 7h13v7a5 5 0 01-5 5H9a5 5 0 01-5-5V7zm13 2h2a3 3 0 010 6h-2V9zM3 21h16v-2H3v2z', tags: ['kuliner', 'minuman'] },
  { key: 'bag', name: 'Tas', d: 'M8 7V5a4 4 0 118 0v2h3a2 2 0 012 2v11H3V9a2 2 0 012-2h3zm2 0h4V5a2 2 0 10-4 0v2zm-4 4v9h12v-9H6z', tags: ['fashion', 'belanja'] },
  { key: 'wallet', name: 'Dompet', d: 'M3 6a2 2 0 012-2h12a2 2 0 012 2v2h-5a4 4 0 000 8h5v2a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm14 4h4v4h-4a2 2 0 010-4z', tags: ['uang', 'keuangan'] },
  { key: 'chart', name: 'Grafik', d: 'M4 20V9h4v11H4zm6 0V4h4v16h-4zm6 0v-7h4v7h-4z', tags: ['data', 'bisnis'] },
  { key: 'book', name: 'Buku', d: 'M4 4h7a3 3 0 013 3v13a3 3 0 00-3-3H4V4zm16 0h-7v13a3 3 0 013-3h4V4z', tags: ['edukasi', 'belajar'] },
  { key: 'home', name: 'Rumah', d: 'M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z', tags: ['properti', 'rumah'] },
  { key: 'plane', name: 'Pesawat', d: 'M2 13l20-9-6 20-4-8-10-3z', tags: ['travel', 'liburan'] },
  { key: 'leaf', name: 'Daun', d: 'M20 3C10 3 4 8 4 16c0 2.5 1 4.5 2 5 1-7 5-10 11-12-5 3-8 7-9 13 9 0 12-6 12-19z', tags: ['sehat', 'alami'] },
  { key: 'moon', name: 'Bulan', d: 'M20 15.5A8.5 8.5 0 019.5 5 8.5 8.5 0 1020 15.5z', tags: ['malam', 'religi'] },
  { key: 'sun', name: 'Matahari', d: 'M12 6a6 6 0 100 12 6 6 0 000-12zm0-4v3m0 14v3M2 12h3m14 0h3M4.9 4.9L7 7m10 10l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1', tags: ['cerah', 'pagi'] },
  { key: 'cloud', name: 'Awan', d: 'M6.5 19a4.5 4.5 0 01-.4-9A6 6 0 0118 11.2 4 4 0 0117 19H6.5z', tags: ['cuaca', 'tenang'] },
  { key: 'chat', name: 'Obrolan', d: 'M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z', tags: ['komentar', 'komunitas'] },
  { key: 'user', name: 'Pengguna', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0H4z', tags: ['akun', 'profil'] },
  { key: 'users', name: 'Tim', d: 'M9 11a4 4 0 100-8 4 4 0 000 8zm7 0a3 3 0 100-6 3 3 0 000 6zM2 21a7 7 0 0114 0H2zm14 0a6 6 0 00-4-5.7 5 5 0 019.8 1.7H16z', tags: ['tim', 'komunitas'] },
  { key: 'lock', name: 'Gembok', d: 'M7 10V7a5 5 0 0110 0v3h2v11H5V10h2zm2 0h6V7a3 3 0 00-6 0v3z', tags: ['aman', 'privasi'] },
  { key: 'key', name: 'Kunci', d: 'M14 4a6 6 0 00-5.7 8L2 18.3V22h3.7l1.3-1.3V19h2v-2h2l1.3-1.3A6 6 0 1014 4zm2 3a2 2 0 110 4 2 2 0 010-4z', tags: ['akses', 'password'] },
  { key: 'globe', name: 'Dunia', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c2 0 3.8 3.6 3.8 8s-1.8 8-3.8 8-3.8-3.6-3.8-8S10 4 12 4zM2.5 9h19M2.5 15h19', tags: ['web', 'global'] },
  { key: 'code', name: 'Kode', d: 'M8.5 7L3 12l5.5 5L10 15.5 7 12l3-3.5L8.5 7zm7 0L14 8.5l3 3.5-3 3.5 1.5 1.5L21 12l-5.5-5z', tags: ['developer', 'tech'] },
  { key: 'terminal', name: 'Terminal', d: 'M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zm3 5l4 3-4 3v-2l2-1-2-1V9zm7 6h5v2h-5v-2z', tags: ['developer', 'shell'] },
  { key: 'rocket', name: 'Roket', d: 'M14 3c4 1 7 4 7 7 0 2-2 5-5 7l-3-3 1-11zM9 14l-3-3C4 13 3 16 3 21c5 0 8-1 10-3l-3-3zm2-2l2-2 2 2-2 2-2-2z', tags: ['launch', 'startup'] },
  { key: 'layers', name: 'Lapisan', d: 'M12 2l10 5-10 5L2 7l10-5zm0 8l10 5-10 5-10-5 10-5zm0 4l6.5 3.2L12 20.5 5.5 17.2 12 14z', tags: ['desain', 'layer'] },
  { key: 'wand', name: 'Sihir', d: 'M4 20L16 8l3 3L7 23l-3-3zM15 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm5 8l.7 2.3L23 14l-2.3.7L20 17l-.7-2.3L17 14l2.3-.7L20 11z', tags: ['efek', 'magic'] },
];

const ICON_STYLES: Array<{
  key: string;
  name: string;
  color: string;
  accent: string;
  mode: 'solid' | 'outline' | 'duotone';
  strokeWidth: number;
}> = [
  { key: 'iris', name: 'Iris Solid', color: '#7C6CFF', accent: '#C8F169', mode: 'solid', strokeWidth: 0 },
  { key: 'lime', name: 'Lime Outline', color: '#C8F169', accent: '#7C6CFF', mode: 'outline', strokeWidth: 1.8 },
  { key: 'noir', name: 'Noir Bold', color: '#0E0A24', accent: '#7C6CFF', mode: 'solid', strokeWidth: 0 },
  { key: 'sunset', name: 'Sunset Duotone', color: '#FB7185', accent: '#FBBF24', mode: 'duotone', strokeWidth: 1.2 },
  { key: 'ocean', name: 'Ocean Outline', color: '#38BDF8', accent: '#0EA5E9', mode: 'outline', strokeWidth: 1.6 },
  { key: 'royal', name: 'Royal Gold', color: '#D4AF37', accent: '#FDF8E7', mode: 'solid', strokeWidth: 0 },
  { key: 'candy', name: 'Candy Duotone', color: '#EC4899', accent: '#A78BFA', mode: 'duotone', strokeWidth: 1.2 },
  { key: 'mint', name: 'Mint Solid', color: '#10B981', accent: '#ECFDF5', mode: 'solid', strokeWidth: 0 },
  { key: 'retro', name: 'Retro Line', color: '#F97316', accent: '#7C2D12', mode: 'outline', strokeWidth: 2.2 },
  { key: 'glass', name: 'Glass Soft', color: '#E2E8F0', accent: '#94A3B8', mode: 'duotone', strokeWidth: 1 },
];

function makeSvg(pathD: string, style: (typeof ICON_STYLES)[number]): string {
  if (style.mode === 'outline') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${pathD}" fill="none" stroke="${style.color}" stroke-width="${style.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (style.mode === 'duotone') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${pathD}" fill="${style.accent}" opacity="0.35"/><path d="${pathD}" fill="none" stroke="${style.color}" stroke-width="${Math.max(1, style.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${pathD}" fill="${style.color}" stroke="${style.accent}" stroke-width="0"/></svg>`;
}

const BUILTIN_ICON_PACKS: IconPackDefinition[] = ICON_GLYPHS.flatMap((glyph) =>
  ICON_STYLES.map((style) => ({
    id: `icon-${glyph.key}-${style.key}`,
    kind: 'icon' as const,
    name: `${glyph.name} ${style.name}`,
    tags: [...glyph.tags, style.mode, 'ikon'],
    category: 'all' as PackCategory,
    glyph: glyph.key,
    svg: makeSvg(glyph.d, style),
    paths: parseSvgIcon(makeSvg(glyph.d, style)),
    color: style.color,
    accent: style.accent,
    author: 'builtin' as PackAuthor,
  }))
);

/* -------------------------------------------------------------------------- */
/* Component packs                                                             */
/* -------------------------------------------------------------------------- */

const COMPONENT_BASES: Array<{
  key: string;
  name: string;
  tags: string[];
  dark: boolean;
  radius: number;
  shadow: number;
  opacity: number;
  surface: 'soft' | 'strong' | 'outline' | 'glow';
}> = [
  { key: 'glass', name: 'Glass', tags: ['kaca', 'modern', 'transparan'], dark: false, radius: 26, shadow: 28, opacity: 0.94, surface: 'soft' },
  { key: 'clay', name: 'Clay', tags: ['lembut', '3d', 'ramah'], dark: false, radius: 30, shadow: 22, opacity: 1, surface: 'strong' },
  { key: 'neon', name: 'Neon', tags: ['neon', 'gaming', 'gelap'], dark: true, radius: 22, shadow: 36, opacity: 0.98, surface: 'glow' },
  { key: 'minimal', name: 'Minimal', tags: ['minimal', 'bersih', 'rapi'], dark: false, radius: 18, shadow: 14, opacity: 1, surface: 'outline' },
  { key: 'paper', name: 'Paper', tags: ['kertas', 'editorial', 'hangat'], dark: false, radius: 14, shadow: 10, opacity: 1, surface: 'strong' },
  { key: 'gradient', name: 'Gradient', tags: ['gradien', 'cerah', 'modern'], dark: false, radius: 28, shadow: 30, opacity: 1, surface: 'glow' },
  { key: 'outline', name: 'Outline', tags: ['garis', 'ringan', 'stylish'], dark: false, radius: 20, shadow: 8, opacity: 0.96, surface: 'outline' },
  { key: 'sticker', name: 'Sticker', tags: ['stiker', 'lucu', 'ceria'], dark: false, radius: 34, shadow: 18, opacity: 1, surface: 'strong' },
  { key: 'magazine', name: 'Magazine', tags: ['majalah', 'editorial', 'tegas'], dark: false, radius: 8, shadow: 12, opacity: 1, surface: 'strong' },
  { key: 'terminal', name: 'Terminal', tags: ['terminal', 'developer', 'gelap'], dark: true, radius: 16, shadow: 26, opacity: 1, surface: 'strong' },
  { key: 'soft', name: 'Soft', tags: ['lembut', 'pastel', 'tenang'], dark: false, radius: 32, shadow: 16, opacity: 0.97, surface: 'soft' },
  { key: 'brutalist', name: 'Brutalist', tags: ['berani', 'tegas', 'kontras'], dark: false, radius: 4, shadow: 20, opacity: 1, surface: 'outline' },
  { key: 'luxury', name: 'Luxury', tags: ['mewah', 'emas', 'elegan'], dark: true, radius: 24, shadow: 30, opacity: 1, surface: 'glow' },
  { key: 'candy', name: 'Candy', tags: ['manis', 'ceria', 'pink'], dark: false, radius: 36, shadow: 20, opacity: 1, surface: 'soft' },
  { key: 'dark', name: 'Dark', tags: ['gelap', 'premium', 'kontras'], dark: true, radius: 20, shadow: 24, opacity: 1, surface: 'strong' },
];

const COMPONENT_PALETTES: Array<{ name: string; accent: string; light: string; lightText: string; dark: string; darkText: string }> = [
  { name: 'Iris', accent: '#7C6CFF', light: '#FFFFFF', lightText: '#171225', dark: 'rgba(15, 12, 30, 0.94)', darkText: '#F8FAFC' },
  { name: 'Lime', accent: '#C8F169', light: '#FBFEF2', lightText: '#1A2408', dark: 'rgba(18, 26, 10, 0.94)', darkText: '#F7FEE7' },
  { name: 'Rose', accent: '#FB7185', light: '#FFF1F2', lightText: '#3F0A14', dark: 'rgba(40, 10, 18, 0.94)', darkText: '#FFE4E6' },
  { name: 'Ocean', accent: '#38BDF8', light: '#F0F9FF', lightText: '#082F49', dark: 'rgba(8, 30, 48, 0.94)', darkText: '#E0F2FE' },
  { name: 'Amber', accent: '#FBBF24', light: '#FFFBEB', lightText: '#422006', dark: 'rgba(40, 28, 4, 0.94)', darkText: '#FEF3C7' },
  { name: 'Emerald', accent: '#34D399', light: '#ECFDF5', lightText: '#022C22', dark: 'rgba(3, 30, 24, 0.94)', darkText: '#D1FAE5' },
  { name: 'Violet', accent: '#A78BFA', light: '#F5F3FF', lightText: '#2E1065', dark: 'rgba(24, 12, 46, 0.94)', darkText: '#EDE9FE' },
  { name: 'Cyan', accent: '#22D3EE', light: '#ECFEFF', lightText: '#083344', dark: 'rgba(5, 30, 38, 0.94)', darkText: '#CFFAFE' },
  { name: 'Orange', accent: '#FB923C', light: '#FFF7ED', lightText: '#431407', dark: 'rgba(40, 18, 6, 0.94)', darkText: '#FFEDD5' },
  { name: 'Gold', accent: '#D4AF37', light: '#FEFCE8', lightText: '#291A02', dark: 'rgba(28, 22, 6, 0.94)', darkText: '#FDF8E7' },
  { name: 'Pink', accent: '#EC4899', light: '#FDF2F8', lightText: '#500724', dark: 'rgba(38, 6, 24, 0.94)', darkText: '#FCE7F3' },
  { name: 'Sky', accent: '#60A5FA', light: '#EFF6FF', lightText: '#172554', dark: 'rgba(10, 20, 44, 0.94)', darkText: '#DBEAFE' },
  { name: 'Red', accent: '#F87171', light: '#FEF2F2', lightText: '#450A0A', dark: 'rgba(38, 8, 8, 0.94)', darkText: '#FEE2E2' },
  { name: 'Mint', accent: '#6EE7B7', light: '#F0FDFA', lightText: '#042F2E', dark: 'rgba(4, 32, 30, 0.94)', darkText: '#CCFBF1' },
  { name: 'Indigo', accent: '#818CF8', light: '#EEF2FF', lightText: '#1E1B4B', dark: 'rgba(14, 16, 42, 0.94)', darkText: '#E0E7FF' },
  { name: 'Sand', accent: '#D6C7A1', light: '#FAF7F0', lightText: '#2B2418', dark: 'rgba(28, 24, 16, 0.94)', darkText: '#F5F0E6' },
  { name: 'Ice', accent: '#BAE6FD', light: '#F8FAFC', lightText: '#0F172A', dark: 'rgba(15, 23, 42, 0.94)', darkText: '#F1F5F9' },
  { name: 'Plum', accent: '#C084FC', light: '#FAF5FF', lightText: '#3B0764', dark: 'rgba(26, 8, 44, 0.94)', darkText: '#F3E8FF' },
  { name: 'Forest', accent: '#4ADE80', light: '#F0FDF4', lightText: '#052E16', dark: 'rgba(6, 28, 16, 0.94)', darkText: '#DCFCE7' },
  { name: 'Sunset', accent: '#FDBA74', light: '#FFF7ED', lightText: '#431407', dark: 'rgba(42, 18, 8, 0.94)', darkText: '#FFEDD5' },
];

const BUILTIN_COMPONENT_PACKS: ComponentPackDefinition[] = COMPONENT_BASES.flatMap((base) =>
  COMPONENT_PALETTES.map((palette) => {
    const background = base.dark ? palette.dark : base.surface === 'outline' ? 'rgba(255,255,255,0.68)' : palette.light;
    const foreground = base.dark ? palette.darkText : palette.lightText;
    const border = base.surface === 'glow' ? `${palette.accent}66` : `${palette.accent}33`;
    const code = [
      `background: ${background};`,
      `color: ${foreground};`,
      `border: 1.5px solid ${border};`,
      `radius: ${base.radius};`,
      `shadow: ${base.shadow};`,
      `opacity: ${base.opacity};`,
      `accent: ${palette.accent};`,
    ].join('\n');
    return {
      id: `component-${base.key}-${palette.name.toLowerCase()}`,
      kind: 'component' as const,
      name: `${base.name} ${palette.name}`,
      tags: [...base.tags, palette.name.toLowerCase(), 'komponen'],
      category: 'all' as PackCategory,
      code,
      style: {
        background,
        foreground,
        border,
        accent: palette.accent,
        radius: base.radius,
        shadow: base.shadow,
        opacity: base.opacity,
      },
      author: 'builtin' as PackAuthor,
    };
  })
);

/* -------------------------------------------------------------------------- */
/* Transition packs                                                            */
/* -------------------------------------------------------------------------- */

const TRANSITION_BASES: Array<{
  key: string;
  name: string;
  tags: string[];
  spec: Omit<TransitionSpec, 'duration' | 'easing'>;
}> = [
  { key: 'fade', name: 'Fade', tags: ['halus', 'lembut'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'slide-left', name: 'Slide Kiri', tags: ['geser', 'cepat'], spec: { fromX: -55, fromY: 0, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'slide-right', name: 'Slide Kanan', tags: ['geser', 'cepat'], spec: { fromX: 55, fromY: 0, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'push-up', name: 'Push Atas', tags: ['dorong', 'vertikal'], spec: { fromX: 0, fromY: 45, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'push-down', name: 'Push Bawah', tags: ['dorong', 'vertikal'], spec: { fromX: 0, fromY: -45, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'zoom-in', name: 'Zoom Masuk', tags: ['zoom', 'fokus'], spec: { fromX: 0, fromY: 0, fromScale: 1.22, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'zoom-out', name: 'Zoom Keluar', tags: ['zoom', 'lebar'], spec: { fromX: 0, fromY: 0, fromScale: 0.78, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'whip-left', name: 'Whip Kiri', tags: ['cepat', 'dinamis'], spec: { fromX: -90, fromY: 0, fromScale: 0.92, fromRotate: -3, fade: true, wipe: false, flash: false } },
  { key: 'whip-right', name: 'Whip Kanan', tags: ['cepat', 'dinamis'], spec: { fromX: 90, fromY: 0, fromScale: 0.92, fromRotate: 3, fade: true, wipe: false, flash: false } },
  { key: 'rotate-in', name: 'Rotate', tags: ['putar', 'kreatif'], spec: { fromX: 0, fromY: 0, fromScale: 0.86, fromRotate: -10, fade: true, wipe: false, flash: false } },
  { key: 'flip-x', name: 'Flip X', tags: ['flip', '3d'], spec: { fromX: 0, fromY: 0, fromScale: 0.65, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'flip-y', name: 'Flip Y', tags: ['flip', '3d'], spec: { fromX: 0, fromY: 0, fromScale: 0.65, fromRotate: 4, fade: true, wipe: false, flash: false } },
  { key: 'blur', name: 'Blur', tags: ['blur', 'sinematik'], spec: { fromX: 0, fromY: 0, fromScale: 1.08, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'wipe-left', name: 'Wipe Kiri', tags: ['wipe', 'bersih'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, fade: false, wipe: true, flash: false } },
  { key: 'wipe-right', name: 'Wipe Kanan', tags: ['wipe', 'bersih'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, fade: false, wipe: true, flash: false } },
  { key: 'wipe-up', name: 'Wipe Atas', tags: ['wipe', 'vertikal'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, fade: false, wipe: true, flash: false } },
  { key: 'wipe-down', name: 'Wipe Bawah', tags: ['wipe', 'vertikal'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, fade: false, wipe: true, flash: false } },
  { key: 'elastic', name: 'Elastic', tags: ['pegas', 'lucu'], spec: { fromX: 0, fromY: 0, fromScale: 0.48, fromRotate: -4, fade: true, wipe: false, flash: false } },
  { key: 'drift', name: 'Drift', tags: ['melayang', 'tenang'], spec: { fromX: 18, fromY: -22, fromScale: 0.96, fromRotate: 2, fade: true, wipe: false, flash: false } },
  { key: 'tilt', name: 'Tilt', tags: ['miring', 'stylish'], spec: { fromX: 0, fromY: 0, fromScale: 0.94, fromRotate: 7, fade: true, wipe: false, flash: false } },
  { key: 'spin', name: 'Spin', tags: ['putar', 'energik'], spec: { fromX: 0, fromY: 0, fromScale: 0.6, fromRotate: 20, fade: true, wipe: false, flash: false } },
  { key: 'drop', name: 'Drop', tags: ['jatuh', 'berat'], spec: { fromX: 0, fromY: -75, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'rise', name: 'Rise', tags: ['naik', 'ringan'], spec: { fromX: 0, fromY: 75, fromScale: 1, fromRotate: 0, fade: true, wipe: false, flash: false } },
  { key: 'swing', name: 'Swing', tags: ['ayun', 'playful'], spec: { fromX: -18, fromY: 0, fromScale: 1, fromRotate: -6, fade: true, wipe: false, flash: false } },
  { key: 'glitch', name: 'Glitch', tags: ['glitch', 'gaming'], spec: { fromX: 0, fromY: 0, fromScale: 1.04, fromRotate: 0, fade: true, wipe: false, flash: true } },
];

const MOTION_TEMPOS: Array<{ name: string; duration: number; easing: string; suffix: string }> = [
  { name: 'Lembut', duration: 0.55, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', suffix: 'lembut' },
  { name: 'Snappy', duration: 0.32, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', suffix: 'snappy' },
  { name: 'Sinematik', duration: 0.75, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', suffix: 'sinematik' },
  { name: 'Bouncy', duration: 0.48, easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', suffix: 'bouncy' },
  { name: 'Lambat', duration: 0.9, easing: 'ease-in-out', suffix: 'lambat' },
  { name: 'Kilat', duration: 0.22, easing: 'ease-out', suffix: 'kilat' },
  { name: 'Dramatis', duration: 0.66, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', suffix: 'dramatis' },
  { name: 'Bersih', duration: 0.38, easing: 'ease-out', suffix: 'bersih' },
  { name: 'Playful', duration: 0.52, easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', suffix: 'playful' },
  { name: 'Mewah', duration: 0.82, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', suffix: 'mewah' },
  { name: 'Punchy', duration: 0.28, easing: 'cubic-bezier(0.2, 1.5, 0.4, 1)', suffix: 'punchy' },
  { name: 'Halus', duration: 0.6, easing: 'ease-in-out', suffix: 'halus' },
];

const BUILTIN_TRANSITION_PACKS: TransitionPackDefinition[] = TRANSITION_BASES.flatMap((base) =>
  MOTION_TEMPOS.map((tempo) => {
    const spec: TransitionSpec = { ...base.spec, duration: tempo.duration, easing: tempo.easing };
    return {
      id: `transition-${base.key}-${tempo.suffix}`,
      kind: 'transition' as const,
      name: `${base.name} ${tempo.name}`,
      tags: [...base.tags, tempo.suffix, 'transisi'],
      category: 'all' as PackCategory,
      code: `fromX=${spec.fromX}; fromY=${spec.fromY}; scale=${spec.fromScale}; rotate=${spec.fromRotate}; fade=${spec.fade ? 1 : 0}; wipe=${spec.wipe ? 1 : 0}; flash=${spec.flash ? 1 : 0}; duration=${spec.duration}s; ease=${spec.easing};`,
      spec,
      author: 'builtin' as PackAuthor,
    };
  })
);

/* -------------------------------------------------------------------------- */
/* Animation packs                                                             */
/* -------------------------------------------------------------------------- */

const ANIMATION_BASES: Array<{
  key: string;
  name: string;
  tags: string[];
  spec: Omit<AnimationSpec, 'duration' | 'easing'>;
}> = [
  { key: 'word-rise', name: 'Word Rise', tags: ['naik', 'kata'], spec: { fromX: 0, fromY: 38, fromScale: 1, fromRotate: 0, stagger: 0.065, fade: true } },
  { key: 'word-drop', name: 'Word Drop', tags: ['jatuh', 'kata'], spec: { fromX: 0, fromY: -38, fromScale: 1, fromRotate: 0, stagger: 0.065, fade: true } },
  { key: 'word-pop', name: 'Word Pop', tags: ['pop', 'kata'], spec: { fromX: 0, fromY: 0, fromScale: 0.55, fromRotate: 0, stagger: 0.07, fade: true } },
  { key: 'word-zoom', name: 'Word Zoom', tags: ['zoom', 'kata'], spec: { fromX: 0, fromY: 0, fromScale: 1.45, fromRotate: 0, stagger: 0.05, fade: true } },
  { key: 'word-slide', name: 'Word Slide', tags: ['geser', 'kata'], spec: { fromX: 52, fromY: 0, fromScale: 1, fromRotate: 0, stagger: 0.05, fade: true } },
  { key: 'word-flip', name: 'Word Flip', tags: ['flip', 'kata'], spec: { fromX: 0, fromY: 0, fromScale: 0.8, fromRotate: -12, stagger: 0.06, fade: true } },
  { key: 'word-spin', name: 'Word Spin', tags: ['putar', 'kata'], spec: { fromX: 0, fromY: 0, fromScale: 0.7, fromRotate: 18, stagger: 0.065, fade: true } },
  { key: 'word-swing', name: 'Word Swing', tags: ['ayun', 'kata'], spec: { fromX: -22, fromY: 0, fromScale: 1, fromRotate: -8, stagger: 0.07, fade: true } },
  { key: 'word-wave', name: 'Word Wave', tags: ['gelombang', 'kata'], spec: { fromX: 0, fromY: 18, fromScale: 0.94, fromRotate: 3, stagger: 0.08, fade: true } },
  { key: 'word-scatter', name: 'Word Scatter', tags: ['acak', 'kata'], spec: { fromX: 34, fromY: 22, fromScale: 0.72, fromRotate: 14, stagger: 0.055, fade: true } },
  { key: 'word-stack', name: 'Word Stack', tags: ['susun', 'kata'], spec: { fromX: 0, fromY: 55, fromScale: 0.9, fromRotate: 0, stagger: 0.09, fade: true } },
  { key: 'type', name: 'Typewriter', tags: ['ketik', 'teks'], spec: { fromX: 0, fromY: 0, fromScale: 1, fromRotate: 0, stagger: 0.04, fade: false } },
  { key: 'glow', name: 'Glow', tags: ['glow', 'neon'], spec: { fromX: 0, fromY: 0, fromScale: 0.86, fromRotate: 0, stagger: 0.06, fade: true } },
  { key: 'bounce', name: 'Bounce', tags: ['bounce', 'lucu'], spec: { fromX: 0, fromY: -48, fromScale: 0.9, fromRotate: 0, stagger: 0.06, fade: true } },
  { key: 'drift', name: 'Drift', tags: ['melayang', 'tenang'], spec: { fromX: 16, fromY: 12, fromScale: 0.98, fromRotate: 2, stagger: 0.07, fade: true } },
  { key: 'tilt', name: 'Tilt', tags: ['miring', 'stylish'], spec: { fromX: 0, fromY: 0, fromScale: 0.92, fromRotate: 8, stagger: 0.07, fade: true } },
  { key: 'snap', name: 'Snap', tags: ['tegas', 'cepat'], spec: { fromX: 0, fromY: 24, fromScale: 1.08, fromRotate: 0, stagger: 0.035, fade: true } },
  { key: 'soft-fade', name: 'Soft Fade', tags: ['halus', 'fade'], spec: { fromX: 0, fromY: 8, fromScale: 1, fromRotate: 0, stagger: 0.05, fade: true } },
  { key: 'letter-rise', name: 'Letter Rise', tags: ['huruf', 'naik'], spec: { fromX: 0, fromY: 26, fromScale: 1, fromRotate: 0, stagger: 0.03, fade: true } },
  { key: 'letter-pop', name: 'Letter Pop', tags: ['huruf', 'pop'], spec: { fromX: 0, fromY: 0, fromScale: 0.4, fromRotate: 0, stagger: 0.035, fade: true } },
  { key: 'letter-wave', name: 'Letter Wave', tags: ['huruf', 'gelombang'], spec: { fromX: 0, fromY: 20, fromScale: 0.9, fromRotate: 4, stagger: 0.028, fade: true } },
  { key: 'line-reveal', name: 'Line Reveal', tags: ['garis', 'editorial'], spec: { fromX: -24, fromY: 0, fromScale: 1, fromRotate: 0, stagger: 0.1, fade: true } },
  { key: 'mask-rise', name: 'Mask Rise', tags: ['mask', 'naik'], spec: { fromX: 0, fromY: 52, fromScale: 1, fromRotate: 0, stagger: 0.06, fade: false } },
  { key: 'elastic-word', name: 'Elastic Word', tags: ['pegas', 'kata'], spec: { fromX: 0, fromY: 18, fromScale: 0.5, fromRotate: 0, stagger: 0.075, fade: true } },
  { key: 'neon-word', name: 'Neon Word', tags: ['neon', 'kata'], spec: { fromX: 0, fromY: 0, fromScale: 1.3, fromRotate: 0, stagger: 0.06, fade: true } },
];

const BUILTIN_ANIMATION_PACKS: AnimationPackDefinition[] = ANIMATION_BASES.flatMap((base) =>
  MOTION_TEMPOS.map((tempo) => {
    const spec: AnimationSpec = { ...base.spec, duration: tempo.duration, easing: tempo.easing };
    return {
      id: `animation-${base.key}-${tempo.suffix}`,
      kind: 'animation' as const,
      name: `${base.name} ${tempo.name}`,
      tags: [...base.tags, tempo.suffix, 'animasi'],
      category: 'all' as PackCategory,
      code: `fromX=${spec.fromX}; fromY=${spec.fromY}; scale=${spec.fromScale}; rotate=${spec.fromRotate}; stagger=${spec.stagger}; fade=${spec.fade ? 1 : 0}; duration=${spec.duration}s; ease=${spec.easing};`,
      spec,
      author: 'builtin' as PackAuthor,
    };
  })
);

/* -------------------------------------------------------------------------- */
/* Template style variants                                                     */
/* -------------------------------------------------------------------------- */

const TEMPLATE_PALETTE_LABELS: Record<string, string> = {
  'candy-pop': 'Candy Pop',
  'ocean-fresh': 'Biru Segar',
  'mono-noir': 'Hitam Tegas',
  'royal-gold': 'Emas Mewah',
  'sunset-warm': 'Senja Hangat',
  'paper-clean': 'Kertas Bersih',
  'cocoa-cream': 'Kopi Krim',
  'promo-pop': 'Promo Pop',
  'quote-ink': 'Tinta Malam',
  'depup-lavender': 'Lavender',
  'midnight-indigo': 'Neon Malam',
  'cyber-sunset': 'Cyber Sunset',
};

export const TEMPLATE_STYLE_VARIANTS = [
  'candy-pop',
  'ocean-fresh',
  'mono-noir',
  'royal-gold',
  'sunset-warm',
  'paper-clean',
  'cocoa-cream',
  'promo-pop',
  'quote-ink',
  'depup-lavender',
  'midnight-indigo',
  'cyber-sunset',
].flatMap((paletteId, paletteIndex) => {
  const motions = [
    { name: 'Lembut', cameraMotion: 'smooth-float', transition: 'fade', headlineAnim: 'rise-lines', bgStyle: 'mesh', layout: 'stack' },
    { name: 'Energik', cameraMotion: 'whip-zoom-spring', transition: 'zoom', headlineAnim: 'pop', bgStyle: 'stripes', layout: 'mixed' },
    { name: 'Elegan', cameraMotion: 'perspective-tilt-3d', transition: 'slide', headlineAnim: 'spring-words', bgStyle: 'spotlight', layout: 'card-first' },
    { name: 'Editorial', cameraMotion: 'spring-slide-vertical', transition: 'push-up', headlineAnim: 'marker', bgStyle: 'grid', layout: 'center-text' },
  ];
  return motions.map((motion, motionIndex) => ({
    key: `${paletteId}-${motionIndex}`,
    name: `${motion.name} ${TEMPLATE_PALETTE_LABELS[paletteId] || paletteIndex + 1}`,
    paletteId,
    cameraMotion: motion.cameraMotion,
    transition: motion.transition,
    headlineAnim: motion.headlineAnim,
    bgStyle: motion.bgStyle,
    layout: motion.layout,
    bpmScale: 0.92 + ((paletteIndex + motionIndex) % 5) * 0.04,
  }));
});

/* -------------------------------------------------------------------------- */
/* Parser aman untuk kode admin                                                */
/* -------------------------------------------------------------------------- */

export function parseSvgIcon(svg: string): IconPathPart[] {
  const source = String(svg || '');
  const parts: IconPathPart[] = [];
  const pathRe = /<path\b([^>]*?)\/?>/gi;
  let match: RegExpExecArray | null;
  const readAttr = (attrs: string, name: string) => {
    const m = attrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
    return m ? m[1] : '';
  };
  while ((match = pathRe.exec(source))) {
    const attrs = match[1] || '';
    const d = readAttr(attrs, 'd').trim();
    if (!d) continue;
    const strokeWidth = Number(readAttr(attrs, 'stroke-width')) || undefined;
    parts.push({
      d,
      fill: readAttr(attrs, 'fill') || undefined,
      stroke: readAttr(attrs, 'stroke') || undefined,
      strokeWidth,
    });
  }
  if (!parts.length) {
    const d = source.trim();
    if (/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/.test(d)) parts.push({ d });
  }
  return parts;
}

function numberAfter(code: string, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const m = code.match(new RegExp(`${key}\\s*[:=]\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'));
    if (m) return Number(m[1]);
  }
  return fallback;
}

function boolAfter(code: string, key: string, fallback = false): boolean {
  const m = code.match(new RegExp(`${key}\\s*[:=]\\s*(true|1|yes|on|false|0|no|off)`, 'i'));
  if (!m) return fallback;
  return /^(true|1|yes|on)$/i.test(m[1]);
}

export function parseTransitionCode(code: string): TransitionSpec {
  const src = String(code || '');
  const tx = src.match(/translateX\s*\(\s*(-?\d+(?:\.\d+)?)\s*%?\s*\)/i);
  const ty = src.match(/translateY\s*\(\s*(-?\d+(?:\.\d+)?)\s*%?\s*\)/i);
  const sc = src.match(/scale\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/i);
  const rot = src.match(/rotate\s*\(\s*(-?\d+(?:\.\d+)?)\s*deg?\s*\)/i);
  return {
    fromX: numberAfter(src, ['fromX', 'x', 'translate-x'], tx ? Number(tx[1]) : 0),
    fromY: numberAfter(src, ['fromY', 'y', 'translate-y'], ty ? Number(ty[1]) : 0),
    fromScale: numberAfter(src, ['fromScale', 'scale'], sc ? Number(sc[1]) : 1),
    fromRotate: numberAfter(src, ['fromRotate', 'rotate'], rot ? Number(rot[1]) : 0),
    fade: boolAfter(src, 'fade', true),
    wipe: boolAfter(src, 'wipe', /wipe|clip/i.test(src)),
    flash: boolAfter(src, 'flash', /flash|glitch/i.test(src)),
    duration: Math.min(2, Math.max(0.1, numberAfter(src, ['duration', 'dur'], 0.45))),
    easing: (src.match(/ease\s*[:=]\s*([^;,\n]+)/i)?.[1] || 'ease-out').trim(),
  };
}

export function parseAnimationCode(code: string): AnimationSpec {
  const src = String(code || '');
  const sc = src.match(/scale\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/i);
  return {
    fromX: numberAfter(src, ['fromX', 'x'], 0),
    fromY: numberAfter(src, ['fromY', 'y'], 24),
    fromScale: numberAfter(src, ['fromScale', 'scale'], sc ? Number(sc[1]) : 1),
    fromRotate: numberAfter(src, ['fromRotate', 'rotate'], 0),
    stagger: Math.min(0.2, Math.max(0.01, numberAfter(src, ['stagger', 'delay'], 0.06))),
    fade: boolAfter(src, 'fade', true),
    duration: Math.min(2, Math.max(0.1, numberAfter(src, ['duration', 'dur'], 0.45))),
    easing: (src.match(/ease\s*[:=]\s*([^;,\n]+)/i)?.[1] || 'ease-out').trim(),
  };
}

function cssColor(code: string, keys: string[], fallback: string): string {
  for (const key of keys) {
    const m = code.match(new RegExp(`(?:^|\\n|;)\\s*${key}\\s*:\\s*([^;\\n]+)`, 'i'));
    if (m) return m[1].trim();
  }
  return fallback;
}

/** Ambil bagian warna dari shorthand CSS (mis. "1.5px solid #7C6CFF55" → "#7C6CFF55"). */
function colorToken(value: string): string {
  const m = value.match(/(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:transparent|white|black)\b)/i);
  return m ? m[1] : value.trim();
}

export function parseComponentCode(code: string): Partial<ComponentStyleSpec> {
  const src = String(code || '');
  const out: Partial<ComponentStyleSpec> = {};
  const background = cssColor(src, ['background', 'background-color', 'bg'], '');
  const foreground = cssColor(src, ['color', 'text', 'foreground'], '');
  const border = cssColor(src, ['border', 'border-color'], '');
  const accent = cssColor(src, ['accent', 'primary'], '');
  const radius = numberAfter(src, ['radius', 'border-radius'], NaN);
  const shadow = numberAfter(src, ['shadow', 'box-shadow'], NaN);
  const opacity = numberAfter(src, ['opacity'], NaN);
  if (background) out.background = background;
  if (foreground) out.foreground = foreground;
  if (border) out.border = colorToken(border);
  if (accent) out.accent = accent;
  if (!Number.isNaN(radius)) out.radius = Math.min(64, Math.max(0, radius));
  if (!Number.isNaN(shadow)) out.shadow = Math.min(60, Math.max(0, shadow));
  if (!Number.isNaN(opacity)) out.opacity = Math.min(1, Math.max(0, opacity));
  return out;
}

/* -------------------------------------------------------------------------- */
/* Runtime registry (bawaan + hasil training admin)                            */
/* -------------------------------------------------------------------------- */

const extraIcons: IconPackDefinition[] = [];
const extraComponents: ComponentPackDefinition[] = [];
const extraTransitions: TransitionPackDefinition[] = [];
const extraAnimations: AnimationPackDefinition[] = [];

export function getIconPacks(): IconPackDefinition[] {
  return [...BUILTIN_ICON_PACKS, ...extraIcons];
}

export function getComponentPacks(): ComponentPackDefinition[] {
  return [...BUILTIN_COMPONENT_PACKS, ...extraComponents];
}

export function getTransitionPacks(): TransitionPackDefinition[] {
  return [...BUILTIN_TRANSITION_PACKS, ...extraTransitions];
}

export function getAnimationPacks(): AnimationPackDefinition[] {
  return [...BUILTIN_ANIMATION_PACKS, ...extraAnimations];
}

export function findIconPack(id: string | undefined): IconPackDefinition | undefined {
  if (!id) return undefined;
  return BUILTIN_ICON_PACKS.find((pack) => pack.id === id) || extraIcons.find((pack) => pack.id === id);
}

export function findComponentPack(id: string | undefined): ComponentPackDefinition | undefined {
  if (!id) return undefined;
  return (
    BUILTIN_COMPONENT_PACKS.find((pack) => pack.id === id) ||
    extraComponents.find((pack) => pack.id === id)
  );
}

export function findTransitionPack(id: string | undefined): TransitionPackDefinition | undefined {
  if (!id) return undefined;
  return (
    BUILTIN_TRANSITION_PACKS.find((pack) => pack.id === id) ||
    extraTransitions.find((pack) => pack.id === id)
  );
}

export function findAnimationPack(id: string | undefined): AnimationPackDefinition | undefined {
  if (!id) return undefined;
  return (
    BUILTIN_ANIMATION_PACKS.find((pack) => pack.id === id) ||
    extraAnimations.find((pack) => pack.id === id)
  );
}

export function creativePackCounts() {
  return {
    icon: BUILTIN_ICON_PACKS.length + extraIcons.length,
    component: BUILTIN_COMPONENT_PACKS.length + extraComponents.length,
    transition: BUILTIN_TRANSITION_PACKS.length + extraTransitions.length,
    animation: BUILTIN_ANIMATION_PACKS.length + extraAnimations.length,
  };
}

export interface CreativePackRowLike {
  id: string;
  type: string;
  content_text: string;
  subtext?: string | null;
  category?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

function safeCategory(value: string | null | undefined): PackCategory {
  return value === 'promo' || value === 'quote' || value === 'edukasi' ? value : 'all';
}

export function registerCreativePackFromRow(row: CreativePackRowLike): boolean {
  const meta = (row.metadata_json || {}) as Record<string, unknown>;
  const kind = String(meta.kind || row.type.replace(/_pack$/, ''));
  const name = row.content_text || 'Pack admin';
  const tags = String(row.subtext || 'admin, kustom')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const code = String(meta.code || meta.svg || row.content_text || '');
  const id = `db-${row.id}`;
  const category = safeCategory(row.category);

  if (kind === 'icon') {
    const svg = String(meta.svg || meta.code || '');
    const paths = parseSvgIcon(svg);
    if (!paths.length) return false;
    extraIcons.unshift({
      id,
      kind: 'icon',
      name,
      tags: [...tags, 'ikon'],
      category,
      glyph: 'custom',
      svg,
      paths,
      color: String(meta.color || '#7C6CFF'),
      accent: String(meta.accent || '#C8F169'),
      author: 'admin',
    });
    return true;
  }
  if (kind === 'component') {
    if (!code.trim()) return false;
    const parsed = parseComponentCode(code);
    extraComponents.unshift({
      id,
      kind: 'component',
      name,
      tags: [...tags, 'komponen'],
      category,
      code,
      style: {
        background: parsed.background || 'rgba(255,255,255,0.95)',
        foreground: parsed.foreground || '#0f172a',
        border: parsed.border || 'rgba(124,108,255,0.28)',
        accent: parsed.accent || '#7C6CFF',
        radius: parsed.radius ?? 24,
        shadow: parsed.shadow ?? 24,
        opacity: parsed.opacity ?? 1,
      },
      author: 'admin',
    });
    return true;
  }
  if (kind === 'transition') {
    if (!code.trim()) return false;
    extraTransitions.unshift({
      id,
      kind: 'transition',
      name,
      tags: [...tags, 'transisi'],
      category,
      code,
      spec: parseTransitionCode(code),
      author: 'admin',
    });
    return true;
  }
  if (kind === 'animation') {
    if (!code.trim()) return false;
    extraAnimations.unshift({
      id,
      kind: 'animation',
      name,
      tags: [...tags, 'animasi'],
      category,
      code,
      spec: parseAnimationCode(code),
      author: 'admin',
    });
    return true;
  }
  return false;
}

export function removeCreativePackFromRegistry(packId: string): void {
  const remove = <T extends { id: string }>(list: T[]) => {
    const idx = list.findIndex((item) => item.id === packId);
    if (idx >= 0) list.splice(idx, 1);
  };
  remove(extraIcons);
  remove(extraComponents);
  remove(extraTransitions);
  remove(extraAnimations);
}

/** Preview CSS kecil untuk kartu component pack. */
export function componentPackPreviewStyle(pack: ComponentPackDefinition): CSSProperties {
  return {
    background: pack.style.background,
    color: pack.style.foreground,
    border: `1.5px solid ${pack.style.border}`,
    borderRadius: Math.min(22, pack.style.radius),
    boxShadow: `0 ${Math.min(18, pack.style.shadow)}px ${Math.min(36, pack.style.shadow * 1.4)}px -18px ${pack.style.accent}88`,
    opacity: pack.style.opacity,
  };
}
