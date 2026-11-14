import type { BgPattern, FontId, Intent, Palette } from '../types';

/**
 * Template Pack — 30 tema warna × 12 layout = 360 template.
 * Tema menentukan palet, font, dan pola latar. Layout menentukan susunan elemen tiap scene,
 * gaya komponen, pilihan animasi, dan transisi. Prompt engine memilih kombinasi terbaik.
 */

export interface ThemeDef {
  id: string;
  name: string;
  palette: Palette;
  headingFont: FontId;
  bodyFont: FontId;
  pattern: BgPattern;
  gradientAngle: number;
  keywords: string[];
  moods: string[];
}

export interface LayoutDef {
  id: string;
  name: string;
  desc: string;
  intents: Intent[];
  align: 'center' | 'left';
  compStyle: string;
  headlineSize: number;
  upper: boolean;
  highlight: boolean;
  photo: 'bg' | 'split' | 'frame' | 'phone';
  decor: 'none' | 'blobs' | 'corners' | 'lines' | 'stickers' | 'letterbox' | 'grid' | 'bubbles';
  headAnim: string[];
  bodyAnim: string[];
  elemAnim: string[];
  loops: string[];
  transitions: string[];
  pattern?: BgPattern;
  energy: 1 | 2 | 3;
}

export interface TemplateDef {
  id: string;
  name: string;
  themeId: string;
  layoutId: string;
  tags: string[];
}

const T = (
  id: string,
  name: string,
  p: [string, string, string, string, string, string, string],
  headingFont: FontId,
  bodyFont: FontId,
  pattern: BgPattern,
  keywords: string[],
  moods: string[],
  gradientAngle = 160
): ThemeDef => ({
  id,
  name,
  palette: { bg: p[0], bg2: p[1], primary: p[2], secondary: p[3], text: p[4], muted: p[5], surface: p[6] },
  headingFont,
  bodyFont,
  pattern,
  gradientAngle,
  keywords,
  moods,
});

export const THEMES: ThemeDef[] = [
  T('sunset-coral', 'Sunset Coral', ['#1A0F0C', '#3A1A12', '#FF6A3D', '#FFB547', '#FFF3EA', '#D9BFAE', '#2A1A14'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'blobs', ['motionku', 'umum'], ['energik', 'hangat']),
  T('kopi-senja', 'Kopi Senja', ['#1B120C', '#3B2416', '#E8A15A', '#F5D7A1', '#FFF6EA', '#CDB69E', '#2B1D14'], 'Playfair Display', 'Poppins', 'bokeh', ['kopi', 'coffee', 'cafe', 'kafe', 'senja', 'aren', 'latte', 'roastery'], ['hangat', 'tenang']),
  T('matcha', 'Matcha Fresh', ['#0F1F17', '#1F3D2B', '#8FD694', '#F2E8C9', '#F4FFF6', '#B9D6C2', '#18301F'], 'Montserrat', 'Poppins', 'dots', ['matcha', 'sehat', 'healthy', 'diet', 'sayur', 'organik', 'vegan'], ['tenang', 'hangat']),
  T('neon-tokyo', 'Neon Tokyo', ['#0A0716', '#1D0E3A', '#FF3EA5', '#2DE2E6', '#FFFFFF', '#B9AEDC', '#160D2C'], 'Space Grotesk', 'Space Grotesk', 'grid', ['malam', 'party', 'dj', 'konser', 'anime', 'jepang', 'k-pop'], ['energik', 'lucu']),
  T('ocean', 'Ocean Breeze', ['#04192B', '#0B3B5B', '#38BDF8', '#A7F3D0', '#F0FBFF', '#A9C9DB', '#0A2A40'], 'Montserrat', 'Poppins', 'waves', ['laut', 'pantai', 'air', 'ikan', 'seafood', 'renang', 'diving'], ['tenang']),
  T('midnight-ungu', 'Midnight Ungu', ['#0E0A24', '#241A5C', '#8B7CFF', '#C8F169', '#F7F5FF', '#B4ACD9', '#1A1440'], 'Space Grotesk', 'Plus Jakarta Sans', 'grid', ['teknologi', 'aplikasi', 'saas', 'startup', 'ai', 'software'], ['serius', 'energik']),
  T('lemon-pop', 'Lemon Pop', ['#FFF6C7', '#FFE266', '#111111', '#FF5A5F', '#111111', '#4A4320', '#FFFFFF'], 'Anton', 'Poppins', 'halftone', ['lucu', 'snack', 'jajan', 'cemilan', 'anak', 'es', 'segar'], ['lucu', 'energik'], 135),
  T('monokrom', 'Monokrom', ['#0B0B0B', '#1F1F1F', '#FFFFFF', '#9A9A9A', '#FFFFFF', '#A3A3A3', '#181818'], 'Bebas Neue', 'Montserrat', 'noise', ['fashion', 'foto', 'minimalis', 'arsitek', 'desain'], ['serius', 'mewah']),
  T('sakura', 'Cherry Blossom', ['#FFF0F3', '#FFD1DC', '#E0457B', '#7C3AED', '#3A0F1E', '#8A5A69', '#FFFFFF'], 'Playfair Display', 'Poppins', 'bokeh', ['cinta', 'wedding', 'nikah', 'valentine', 'bunga', 'romantis', 'pacar'], ['hangat', 'galau']),
  T('hutan', 'Hutan Tropis', ['#0B1A10', '#143322', '#4ADE80', '#FACC15', '#F0FFF4', '#A7C4AE', '#12291A'], 'Montserrat', 'Poppins', 'blobs', ['alam', 'hutan', 'camping', 'tanaman', 'hiking', 'pendaki'], ['tenang', 'energik']),
  T('cyber-lime', 'Cyber Lime', ['#07090A', '#12181A', '#C6FF00', '#00E5FF', '#F5FFF0', '#A0B3A8', '#10161A'], 'Space Grotesk', 'Space Grotesk', 'grid', ['coding', 'programmer', 'hacker', 'security', 'web', 'developer', 'nextjs', 'react'], ['serius', 'energik']),
  T('batik-sogan', 'Batik Sogan', ['#20130A', '#4A2C14', '#D9A441', '#B5452F', '#FFF4E0', '#D1B892', '#2E1C0F'], 'Playfair Display', 'Montserrat', 'halftone', ['batik', 'budaya', 'tradisional', 'jawa', 'kerajinan', 'oleh-oleh'], ['mewah', 'hangat']),
  T('merah-putih', 'Merah Putih', ['#B3121B', '#7A0A10', '#FFFFFF', '#FFD43B', '#FFFFFF', '#FFD0D0', '#8F0E15'], 'Anton', 'Montserrat', 'rays', ['merdeka', 'agustus', 'indonesia', 'nasional', 'kemerdekaan', 'pahlawan'], ['energik', 'serius']),
  T('emas-mewah', 'Emas Mewah', ['#0C0A07', '#231C10', '#D9B86C', '#F5E6C4', '#FFF8EA', '#BFAF8E', '#1A150C'], 'Playfair Display', 'Montserrat', 'noise', ['mewah', 'luxury', 'emas', 'perhiasan', 'properti', 'premium', 'hotel', 'parfum'], ['mewah']),
  T('pastel', 'Pastel Dream', ['#F3EEFF', '#E2F4FF', '#8B5CF6', '#F472B6', '#2A2340', '#6E6787', '#FFFFFF'], 'Poppins', 'Poppins', 'bubbles', ['bayi', 'kids', 'pastel', 'aesthetic', 'kue', 'dessert', 'hampers'], ['lucu', 'tenang'], 135),
  T('retro-80', 'Retro 80an', ['#1B0B33', '#3C0E5A', '#FF2E88', '#FFD23F', '#FFF4FD', '#D4B6E0', '#2A1146'], 'Anton', 'Space Grotesk', 'stripes', ['retro', 'vintage', 'musik', 'karaoke', 'disko', 'jadul'], ['energik', 'lucu']),
  T('bubblegum', 'Bubblegum', ['#FF8DC7', '#FFB6E1', '#2B2BFF', '#FFFFFF', '#1A0B2E', '#5B3B6E', '#FFE3F1'], 'Anton', 'Poppins', 'dots', ['permen', 'cewek', 'girly', 'makeup', 'kosmetik', 'lipstik'], ['lucu', 'energik']),
  T('arctic', 'Arctic Clean', ['#EAF6FF', '#CDE8FF', '#0369A1', '#06B6D4', '#0B2235', '#4C6A80', '#FFFFFF'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'grid', ['klinik', 'dokter', 'medis', 'kesehatan', 'laundry', 'bersih', 'ac', 'servis'], ['serius', 'tenang']),
  T('lava', 'Lava Pedas', ['#140404', '#3B0A06', '#FF4D00', '#FFC300', '#FFF1E8', '#E0B4A0', '#240806'], 'Anton', 'Montserrat', 'rays', ['pedas', 'seblak', 'ayam', 'geprek', 'sambal', 'bakso', 'mie', 'api', 'hot'], ['energik']),
  T('mint-choco', 'Mint Choco', ['#2A1B14', '#3D2A20', '#7EE0C3', '#F4E1C1', '#FFFBF5', '#CBB8A8', '#362419'], 'Poppins', 'Poppins', 'blobs', ['coklat', 'cokelat', 'brownies', 'roti', 'bakery', 'donat'], ['hangat', 'lucu']),
  T('kampus-biru', 'Kampus Biru', ['#0A1B3D', '#12306B', '#3B82F6', '#FBBF24', '#F5F9FF', '#A8B8D8', '#102652'], 'Montserrat', 'Plus Jakarta Sans', 'grid', ['kampus', 'kuliah', 'sekolah', 'belajar', 'les', 'kursus', 'beasiswa', 'ujian', 'guru'], ['serius']),
  T('cuan-hijau', 'Cuan Hijau', ['#021A10', '#063D24', '#22C55E', '#FDE047', '#F0FFF6', '#9FC8B0', '#052A18'], 'Montserrat', 'Poppins', 'rays', ['uang', 'cuan', 'investasi', 'saham', 'bisnis', 'finansial', 'keuangan', 'nabung', 'gaji'], ['serius', 'energik']),
  T('galau-malam', 'Galau Malam', ['#070B1A', '#1A2240', '#93C5FD', '#F9A8D4', '#EEF2FF', '#9AA6C7', '#111834'], 'Playfair Display', 'Poppins', 'bokeh', ['galau', 'sedih', 'rindu', 'patah', 'hati', 'kangen', 'malam', 'sendiri', 'capek'], ['galau', 'tenang']),
  T('pantai-bali', 'Pantai Bali', ['#0E3A44', '#156E7A', '#FFB86B', '#FFE8C2', '#FFFFFF', '#BFDDE0', '#12505B'], 'Montserrat', 'Poppins', 'waves', ['bali', 'liburan', 'travel', 'wisata', 'trip', 'pantai', 'villa', 'staycation'], ['hangat', 'tenang']),
  T('street', 'Street Hitam Kuning', ['#0D0D0D', '#1A1A1A', '#FFD400', '#FF3D00', '#FFFFFF', '#B3B3B3', '#161616'], 'Anton', 'Montserrat', 'stripes', ['streetwear', 'sneakers', 'distro', 'otomotif', 'motor', 'bengkel', 'barbershop', 'gym'], ['energik', 'serius']),
  T('skincare-nude', 'Skincare Nude', ['#F6E7DD', '#EBCFBF', '#B76E59', '#6B4F4F', '#3B2A25', '#866A60', '#FFF8F3'], 'Playfair Display', 'Poppins', 'blobs', ['skincare', 'serum', 'kecantikan', 'glowing', 'kulit', 'facial', 'spa', 'salon'], ['tenang', 'mewah'], 135),
  T('gaming-rgb', 'Gaming RGB', ['#05060F', '#111436', '#7C3AED', '#22D3EE', '#FFFFFF', '#A5A8D6', '#0D1030'], 'Space Grotesk', 'Space Grotesk', 'grid', ['game', 'gaming', 'mabar', 'esport', 'mobile legends', 'ml', 'pubg', 'valorant', 'top up', 'point blank'], ['energik']),
  T('rempah', 'Rempah Nusantara', ['#2B0F0A', '#5A2312', '#F08A24', '#8FB339', '#FFF3E3', '#D8B79A', '#3A160D'], 'Montserrat', 'Poppins', 'halftone', ['rendang', 'nasi', 'sate', 'warung', 'masakan', 'resep', 'katering', 'padang', 'soto'], ['hangat', 'energik']),
  T('lavender', 'Lavender Calm', ['#EFEAFB', '#DCD2F5', '#6D4AE0', '#F59E8B', '#241A3D', '#6E6488', '#FFFFFF'], 'Playfair Display', 'Plus Jakarta Sans', 'bokeh', ['tenang', 'meditasi', 'yoga', 'mental', 'self love', 'healing', 'jurnal'], ['tenang', 'galau'], 135),
  T('teh-tarik', 'Teh Tarik', ['#E9D3B6', '#D4B18A', '#6B3E1F', '#C2410C', '#2E1A0D', '#6E5038', '#F7EBDD'], 'Bebas Neue', 'Poppins', 'noise', ['teh', 'boba', 'milk tea', 'minuman', 'thai tea', 'es teh'], ['hangat', 'lucu'], 135),
];

const ALL_INTENTS: Intent[] = ['promo-produk', 'flash-sale', 'menu-kuliner', 'launching', 'event', 'tips', 'tutorial', 'fakta', 'quote-motivasi', 'quote-galau', 'testimoni', 'before-after', 'lowongan', 'pengumuman', 'ucapan', 'travel', 'cerita'];

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'bold', name: 'Bold Center', desc: 'Judul besar di tengah, energik untuk hook kuat.', intents: ['promo-produk', 'flash-sale', 'launching', 'fakta', 'pengumuman'],
    align: 'center', compStyle: 'gelap', headlineSize: 128, upper: true, highlight: false, photo: 'bg', decor: 'blobs',
    headAnim: ['teks-word-pop-normal', 'gaya-tumbuk-normal', 'teks-word-naik-cepat'], bodyAnim: ['geser-atas-pendek-halus', 'fade'], elemAnim: ['pop-kecil-membal', 'fisika-elastis-lembut'],
    loops: ['loop-denyut-lembut', 'loop-melayang-lembut'], transitions: ['zoom-masuk-sedang', 'whip-left', 'flash-white-kilat', 'push-up-tegas', 'slide-left-membal'], energy: 3,
  },
  {
    id: 'editorial', name: 'Editorial Kiri', desc: 'Rata kiri ala majalah, elegan & rapi.', intents: ['tips', 'fakta', 'cerita', 'quote-motivasi', 'travel'],
    align: 'left', compStyle: 'garis', headlineSize: 104, upper: false, highlight: false, photo: 'split', decor: 'lines',
    headAnim: ['teks-line-naik-normal', 'wipe-left-halus', 'blur-fokus-naik-halus'], bodyAnim: ['teks-line-muncul-normal', 'geser-atas-pendek-halus'], elemAnim: ['geser-kanan-pendek-halus', 'fade'],
    loops: ['loop-napas-lembut'], transitions: ['wipe-left-soft', 'push-left-halus', 'fade-none-normal', 'slide-up-halus'], energy: 1,
  },
  {
    id: 'kaca', name: 'Kartu Kaca', desc: 'Kartu glassmorphism melayang di atas latar.', intents: ['promo-produk', 'launching', 'tips', 'testimoni', 'event'],
    align: 'center', compStyle: 'kaca', headlineSize: 100, upper: false, highlight: false, photo: 'bg', decor: 'bubbles',
    headAnim: ['teks-word-blur-normal', 'blur-fokus-zoom-halus', 'teks-word-naik-normal'], bodyAnim: ['blur-fokus-naik-halus', 'fade'], elemAnim: ['geser-atas-pendek-membal', 'pop-sedang-membal'],
    loops: ['loop-melayang-lembut', 'loop-napas-sedang'], transitions: ['blur-sedang', 'zoom-masuk-halus', 'card-up', 'dolly-lembut', 'iris-center-halus'], energy: 2,
  },
  {
    id: 'brutal', name: 'Brutal Pop', desc: 'Border tebal, bayangan keras, stiker — gaya Gen Z.', intents: ['flash-sale', 'promo-produk', 'menu-kuliner', 'fakta', 'tips'],
    align: 'left', compStyle: 'brutal', headlineSize: 120, upper: true, highlight: true, photo: 'frame', decor: 'stickers',
    headAnim: ['teks-word-pop-cepat', 'gaya-jelly-cepat', 'fisika-snap-kuat'], bodyAnim: ['geser-kanan-jauh-tegas', 'pop-kecil-membal'], elemAnim: ['gaya-tada-cepat', 'fisika-jatuh-pantul-kuat', 'putar-kiri-12-membal'],
    loops: ['loop-goyang-sedang', 'loop-lompat-lembut'], transitions: ['stripes-left-5', 'colorwipe-left-primary', 'slice-3', 'grid-4-diagonal', 'push-left-membal'], energy: 3,
  },
  {
    id: 'neon', name: 'Neon HUD', desc: 'Bingkai HUD, teks mono, glow — cocok tech & gaming.', intents: ['launching', 'fakta', 'tutorial', 'event', 'pengumuman'],
    align: 'center', compStyle: 'neon', headlineSize: 108, upper: true, highlight: false, photo: 'bg', decor: 'corners', pattern: 'grid',
    headAnim: ['teks-decode-normal', 'gaya-glitch-masuk-cepat', 'teks-char-muncul-cepat'], bodyAnim: ['teks-ketik-cepat', 'wipe-left-tegas'], elemAnim: ['gaya-kilat-cepat', 'stretch-h-tegas'],
    loops: ['loop-kedip-lembut', 'loop-denyut-lembut'], transitions: ['glitch-rgb-sedang', 'glitch-iris-sedang', 'pixel-sedang', 'zoom-masuk-putar-halus', 'wipe-right-glow'], energy: 3,
  },
  {
    id: 'minimal', name: 'Minimal Clean', desc: 'Banyak ruang kosong, tipografi bersih.', intents: ['quote-motivasi', 'pengumuman', 'lowongan', 'tips', 'ucapan'],
    align: 'center', compStyle: 'minimal', headlineSize: 96, upper: false, highlight: false, photo: 'frame', decor: 'none',
    headAnim: ['teks-word-muncul-lambat', 'fade-slow', 'teks-line-naik-lambat'], bodyAnim: ['fade', 'geser-atas-pendek-halus'], elemAnim: ['fade', 'pop-sedang-halus'],
    loops: ['loop-napas-lembut'], transitions: ['fade-none-normal', 'fade-white-normal', 'slide-up-halus', 'wipe-up-soft'], energy: 1,
  },
  {
    id: 'majalah', name: 'Majalah Angka', desc: 'Angka raksasa & poin bernomor — listicle viral.', intents: ['tips', 'tutorial', 'fakta', 'lowongan'],
    align: 'left', compStyle: 'gradien', headlineSize: 112, upper: false, highlight: true, photo: 'split', decor: 'grid',
    headAnim: ['teks-word-naik-normal', 'gaya-meluncur-rem-cepat', 'teks-line-pop-normal'], bodyAnim: ['teks-word-naik-cepat', 'geser-atas-pendek-tegas'], elemAnim: ['pop-raksasa-tegas', 'geser-kanan-jauh-membal', 'fisika-pegas-kanan-kuat'],
    loops: ['loop-melayang-lembut'], transitions: ['push-up-tegas', 'push-left-tegas', 'blinds-v-6-tegas', 'split-pintu-h', 'cube-left'], energy: 2,
  },
  {
    id: 'split', name: 'Split Foto', desc: 'Foto di setengah layar, teks di sisi lain.', intents: ['promo-produk', 'menu-kuliner', 'travel', 'testimoni', 'before-after'],
    align: 'left', compStyle: 'soft', headlineSize: 100, upper: false, highlight: false, photo: 'split', decor: 'none',
    headAnim: ['teks-word-naik-normal', 'wipe-up-halus'], bodyAnim: ['geser-atas-pendek-halus', 'teks-line-muncul-cepat'], elemAnim: ['pop-kecil-membal', 'geser-atas-jauh-membal'],
    loops: ['loop-zoom-pelan-lembut'], transitions: ['push-up-halus', 'wipe-up-hard', 'slide-left-halus', 'split-pintu-v'], energy: 2,
  },
  {
    id: 'chat', name: 'Chat Story', desc: 'Cerita lewat bubble chat & komentar.', intents: ['testimoni', 'cerita', 'quote-galau', 'tips'],
    align: 'center', compStyle: 'soft', headlineSize: 92, upper: false, highlight: false, photo: 'bg', decor: 'bubbles',
    headAnim: ['teks-word-pop-normal', 'pop-kecil-membal'], bodyAnim: ['geser-atas-pendek-membal', 'pop-sedang-membal'], elemAnim: ['geser-atas-jauh-membal', 'fisika-pegas-lembut'],
    loops: ['loop-melayang-lembut'], transitions: ['slide-up-membal', 'push-up-membal', 'zoom-masuk-halus', 'card-up'], energy: 2,
  },
  {
    id: 'listicle', name: 'Listicle Langkah', desc: 'Kartu langkah bernomor, jelas untuk tutorial.', intents: ['tutorial', 'tips', 'lowongan', 'event'],
    align: 'center', compStyle: 'retro', headlineSize: 104, upper: false, highlight: false, photo: 'phone', decor: 'lines',
    headAnim: ['teks-word-naik-normal', 'gaya-roket-cepat'], bodyAnim: ['geser-kiri-jauh-membal', 'geser-kanan-jauh-membal'], elemAnim: ['fisika-pegas-kiri-kuat', 'gaya-denyut-masuk-cepat'],
    loops: ['loop-lompat-lembut', 'loop-denyut-lembut'], transitions: ['push-left-membal', 'stripes-up-3', 'shape-square-halus', 'clock-center'], energy: 2,
  },
  {
    id: 'jualan', name: 'Promo Jualan', desc: 'Harga, diskon, timer & tombol beli — siap closing.', intents: ['flash-sale', 'promo-produk', 'menu-kuliner', 'launching'],
    align: 'center', compStyle: 'pop', headlineSize: 124, upper: true, highlight: true, photo: 'frame', decor: 'stickers', pattern: 'rays',
    headAnim: ['gaya-tumbuk-cepat', 'teks-word-pop-cepat', 'fisika-elastis-kuat'], bodyAnim: ['pop-besar-tegas', 'geser-atas-pendek-membal'], elemAnim: ['fisika-jatuh-pantul-kuat', 'gaya-tada-normal', 'putar-kanan-30-membal'],
    loops: ['loop-detak-sedang', 'loop-goyang-sedang', 'loop-denyut-sedang'], transitions: ['flash-primary-blitz', 'shake-sedang', 'zoom-masuk-kuat', 'burst-5', 'shape-star-membal'], energy: 3,
  },
  {
    id: 'sinema', name: 'Kutipan Sinema', desc: 'Letterbox, teks serif, mood film.', intents: ['quote-motivasi', 'quote-galau', 'cerita', 'ucapan', 'travel'],
    align: 'center', compStyle: 'elegan', headlineSize: 92, upper: false, highlight: false, photo: 'bg', decor: 'letterbox', pattern: 'noise',
    headAnim: ['teks-word-blur-lambat', 'teks-line-muncul-lambat', 'blur-kabut-halus'], bodyAnim: ['fade-slow', 'blur-fokus-halus'], elemAnim: ['fade-slow'],
    loops: ['loop-napas-lembut', 'loop-zoom-pelan-lembut'], transitions: ['fade-black-lambat', 'blur-berat', 'dolly-lembut', 'fade-none-lambat'], energy: 1,
  },
];

export const TEMPLATES: TemplateDef[] = [];
for (const L of LAYOUTS) {
  for (const th of THEMES) {
    TEMPLATES.push({
      id: `${L.id}--${th.id}`,
      name: `${th.name} · ${L.name}`,
      themeId: th.id,
      layoutId: L.id,
      tags: [...L.intents, ...th.keywords, ...th.moods],
    });
  }
}

const THEME_BY = new Map(THEMES.map((t) => [t.id, t]));
const LAYOUT_BY = new Map(LAYOUTS.map((l) => [l.id, l]));
const TEMPLATE_BY = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateDef {
  return TEMPLATE_BY.get(id) || TEMPLATES[0];
}
export function getTheme(id: string): ThemeDef {
  return THEME_BY.get(id) || THEMES[0];
}
export function getLayout(id: string): LayoutDef {
  return LAYOUT_BY.get(id) || LAYOUTS[0];
}

export interface RankInput {
  intent: Intent;
  mood: string;
  keywords: string[];
  hasPhotos: boolean;
}

/** Skor template untuk prompt tertentu (makin tinggi makin cocok). */
export function rankTemplates(input: RankInput, limit = 24): Array<TemplateDef & { score: number; reason: string }> {
  const kw = input.keywords.map((k) => k.toLowerCase());
  const scored = TEMPLATES.map((tp) => {
    const th = THEME_BY.get(tp.themeId)!;
    const L = LAYOUT_BY.get(tp.layoutId)!;
    let score = 0;
    const reasons: string[] = [];
    const li = L.intents.indexOf(input.intent);
    if (li >= 0) {
      score += 40 - li * 6;
      reasons.push('cocok untuk jenis konten ini');
    }
    const themeHits = th.keywords.filter((k) => kw.some((w) => w === k || (w.length > 3 && (k.includes(w) || w.includes(k)))));
    if (themeHits.length) {
      score += 30 + themeHits.length * 6;
      reasons.push(`warna pas untuk "${themeHits[0]}"`);
    }
    if (th.moods.includes(input.mood)) score += 14;
    if (input.hasPhotos && (L.photo === 'split' || L.photo === 'frame' || L.photo === 'phone')) score += 8;
    if (th.id === 'sunset-coral') score += 4;
    // variasi kecil yang stabil agar urutan tidak monoton
    score += ((tp.id.length * 7 + tp.id.charCodeAt(0)) % 5) * 0.5;
    return { ...tp, score, reason: reasons.join(' · ') || 'alternatif gaya' };
  });
  scored.sort((a, b) => b.score - a.score);
  // jaga keberagaman: maksimal 3 template per layout di daftar teratas
  const perLayout: Record<string, number> = {};
  const out: Array<TemplateDef & { score: number; reason: string }> = [];
  for (const s of scored) {
    perLayout[s.layoutId] = (perLayout[s.layoutId] || 0) + 1;
    if (perLayout[s.layoutId] <= 3) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export { ALL_INTENTS };
