import type { BgPattern, FontId, Intent, Palette } from '../types';

/**
 * Template Pack — 106 tema warna × 48 layout = 5088 template.
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
  /** Layout induk: perilaku khusus builder (angka besar, bubble chat, serif, dll.) ikut induk ini. */
  base?: string;
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
  // ---- Tema tambahan v7 ----
  T('es-krim', 'Es Krim Stroberi', ['#FFF1F4', '#FFD6E0', '#FF4D7A', '#3CCFB0', '#3A1020', '#8C5566', '#FFFFFF'], 'Poppins', 'Poppins', 'dots', ['es krim', 'ice cream', 'gelato', 'stroberi', 'strawberry', 'sundae', 'mochi'], ['lucu', 'hangat'], 135),
  T('kopi-susu', 'Kopi Susu Krem', ['#F4E9DC', '#E6D2BC', '#6F4A2E', '#D97B3F', '#2C1C10', '#7A6150', '#FFF9F2'], 'Montserrat', 'Plus Jakarta Sans', 'noise', ['kopi susu', 'gula aren', 'susu', 'latte', 'kedai', 'roti bakar'], ['hangat', 'tenang'], 135),
  T('senja-ungu', 'Senja Ungu', ['#1E0B2E', '#4A1559', '#FF8A3D', '#FFD166', '#FFF5EC', '#D0B3CF', '#2E1240'], 'Playfair Display', 'Poppins', 'rays', ['senja', 'sunset', 'puisi', 'sore', 'langit'], ['galau', 'hangat']),
  T('aurora', 'Aurora Utara', ['#04141A', '#0B2F3A', '#3EF2B8', '#B46BFF', '#EFFFFB', '#9CC5BE', '#0A222B'], 'Space Grotesk', 'Plus Jakarta Sans', 'bokeh', ['aurora', 'malam', 'bintang', 'mimpi', 'kreatif', 'musik'], ['tenang', 'energik']),
  T('terracotta', 'Terracotta', ['#2A140E', '#5C2A1B', '#E07A4F', '#F2C79B', '#FFF4EC', '#D7B3A0', '#3A1D14'], 'Playfair Display', 'Montserrat', 'halftone', ['keramik', 'gerabah', 'interior', 'handmade', 'kriya', 'pot', 'tanaman hias'], ['hangat', 'mewah']),
  T('denim', 'Denim Biru', ['#0F1E3A', '#1D3766', '#6EA8FF', '#FFFFFF', '#F2F6FF', '#9FB2D6', '#162A50'], 'Bebas Neue', 'Montserrat', 'noise', ['jeans', 'denim', 'jaket', 'kaos', 'baju', 'outfit', 'ootd', 'thrift'], ['serius', 'energik']),
  T('sawah', 'Sawah Pagi', ['#F3FBE6', '#DDF2C0', '#3F8F2F', '#F5B700', '#1C2B10', '#5C6E4A', '#FFFFFF'], 'Montserrat', 'Poppins', 'waves', ['desa', 'sawah', 'petani', 'pertanian', 'beras', 'pupuk', 'umkm desa', 'pagi'], ['tenang', 'hangat'], 135),
  T('grafit-oranye', 'Grafit Oranye', ['#141414', '#262626', '#FF7A00', '#FFFFFF', '#FAFAFA', '#A6A6A6', '#1E1E1E'], 'Space Grotesk', 'Montserrat', 'grid', ['konstruksi', 'teknik', 'bengkel', 'alat', 'tukang', 'renovasi', 'industri'], ['serius', 'energik']),
  T('ramadan', 'Ramadan Hijau Emas', ['#06231A', '#0E4433', '#E6C065', '#7FD1AE', '#FFF9E8', '#B7CDBE', '#0A3226'], 'Playfair Display', 'Poppins', 'bokeh', ['ramadan', 'puasa', 'lebaran', 'idul fitri', 'takjil', 'sahur', 'mudik', 'zakat', 'islami', 'kajian'], ['tenang', 'mewah']),
  T('imlek', 'Imlek Merah Emas', ['#5A0A0A', '#8C1414', '#FFC94A', '#FF7043', '#FFF5E1', '#F0C4A8', '#6E0F0F'], 'Playfair Display', 'Montserrat', 'halftone', ['imlek', 'angpao', 'chinese', 'tahun baru', 'barongsai', 'hoki'], ['mewah', 'energik']),
  T('koran', 'Koran Pagi', ['#F2EFE6', '#E4DFD0', '#111111', '#D62828', '#111111', '#55524A', '#FFFFFF'], 'Playfair Display', 'Montserrat', 'noise', ['berita', 'news', 'info', 'koran', 'update', 'breaking', 'kabar', 'pengumuman'], ['serius'], 135),
  T('kosmik', 'Kosmik', ['#05031A', '#160B45', '#7B61FF', '#3DDCFF', '#F4F2FF', '#A39DD1', '#0F0836'], 'Space Grotesk', 'Space Grotesk', 'bokeh', ['luar angkasa', 'galaksi', 'astronomi', 'roket', 'sains', 'planet', 'futuristik'], ['serius', 'tenang']),
  T('tropis-jus', 'Jus Tropis', ['#FF8A00', '#FFB703', '#E63971', '#2EC4B6', '#2A0F00', '#6E3B1A', '#FFF4E0'], 'Anton', 'Poppins', 'blobs', ['jus', 'buah', 'smoothie', 'mangga', 'semangka', 'segar', 'es buah', 'rujak'], ['energik', 'lucu'], 135),
  T('sport-biru', 'Sport Elektrik', ['#06122B', '#0B2A66', '#00A3FF', '#C6FF3D', '#FFFFFF', '#9CB3D9', '#0A1E45'], 'Anton', 'Montserrat', 'stripes', ['olahraga', 'futsal', 'sepak bola', 'bola', 'lari', 'badminton', 'fitness', 'turnamen', 'basket'], ['energik']),
  T('hijab-mauve', 'Mauve Muslimah', ['#F5E9EE', '#E8CFDA', '#9C4F73', '#C9A27E', '#3A1E2B', '#7E6070', '#FFFAFC'], 'Playfair Display', 'Poppins', 'bokeh', ['hijab', 'gamis', 'muslimah', 'fashion muslim', 'mukena', 'kerudung', 'syari'], ['tenang', 'mewah'], 135),
  T('properti-navy', 'Properti Navy', ['#0B1630', '#172A55', '#E2B65C', '#FFFFFF', '#F7F9FF', '#A9B5CF', '#13234A'], 'Montserrat', 'Plus Jakarta Sans', 'grid', ['rumah', 'kpr', 'properti', 'kontrakan', 'kos', 'apartemen', 'tanah', 'perumahan', 'cluster'], ['serius', 'mewah']),
  // ---- Tema tambahan v8: niche usaha & momen ----
  T('laundry-biru', 'Laundry Segar', ['#EAF7FF', '#CFEBFF', '#0284C7', '#22D3EE', '#062033', '#4F6B80', '#FFFFFF'], 'Poppins', 'Poppins', 'bubbles', ['laundry', 'cuci', 'setrika', 'kiloan', 'bersih', 'wangi', 'dry clean'], ['tenang', 'serius'], 135),
  T('bengkel-oli', 'Bengkel Oli', ['#121212', '#2A2A2A', '#F97316', '#FACC15', '#F5F5F5', '#A3A3A3', '#1E1E1E'], 'Anton', 'Montserrat', 'stripes', ['bengkel', 'oli', 'servis motor', 'tune up', 'ban', 'sparepart', 'motor'], ['energik', 'serius']),
  T('salon-rose', 'Salon Rose Gold', ['#FFF1EE', '#F8D9D3', '#B4535B', '#D4A373', '#3B1E22', '#8A6266', '#FFFFFF'], 'Playfair Display', 'Poppins', 'bokeh', ['salon', 'potong rambut', 'creambath', 'nail art', 'kuku', 'bulu mata', 'lash', 'mua', 'makeup artist'], ['mewah', 'tenang'], 135),
  T('apotek-hijau', 'Apotek Sehat', ['#ECFDF5', '#D1FAE5', '#059669', '#0EA5E9', '#052E1F', '#4B6B5E', '#FFFFFF'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'grid', ['apotek', 'obat', 'vitamin', 'suplemen', 'farmasi', 'imun', 'daya tahan'], ['tenang', 'serius'], 135),
  T('petshop', 'Petshop Ceria', ['#FFF7E6', '#FFE3B3', '#F97316', '#8B5CF6', '#3A2208', '#7A5A3A', '#FFFFFF'], 'Poppins', 'Poppins', 'dots', ['kucing', 'anjing', 'pet', 'petshop', 'grooming', 'makanan kucing', 'hewan peliharaan'], ['lucu', 'hangat'], 135),
  T('florist', 'Florist Bunga', ['#FDF2F8', '#FCE7F3', '#DB2777', '#16A34A', '#3B0A23', '#86607A', '#FFFFFF'], 'Playfair Display', 'Poppins', 'blobs', ['florist', 'buket', 'bouquet', 'hand bouquet', 'papan bunga', 'bunga segar'], ['hangat', 'mewah'], 135),
  T('sushi', 'Sushi Jepang', ['#0F0F0F', '#1F1A17', '#E63946', '#F1FAEE', '#FFFFFF', '#B5B5B5', '#1A1A1A'], 'Bebas Neue', 'Montserrat', 'waves', ['sushi', 'ramen', 'japanese', 'takoyaki', 'onigiri', 'dimsum', 'udon'], ['serius', 'energik']),
  T('bbq-asap', 'BBQ Asap', ['#170B05', '#3A1A0A', '#FF5A1F', '#FFC145', '#FFF1E6', '#CDAE98', '#26120A'], 'Anton', 'Montserrat', 'noise', ['bbq', 'barbeque', 'grill', 'steak', 'panggang', 'daging', 'korean bbq'], ['energik', 'hangat']),
  T('martabak', 'Martabak Manis', ['#2A1608', '#4E2A10', '#F59E0B', '#EF4444', '#FFF7E8', '#D9BE98', '#3A200D'], 'Anton', 'Poppins', 'halftone', ['martabak', 'terang bulan', 'roti bakar', 'pisang bakar', 'gorengan', 'jajanan malam'], ['hangat', 'lucu']),
  T('nasgor', 'Nasi Goreng Kaki Lima', ['#1C1206', '#3B260C', '#EAB308', '#DC2626', '#FFF8E7', '#CDB892', '#2A1C0A'], 'Montserrat', 'Poppins', 'rays', ['nasi goreng', 'mie goreng', 'kaki lima', 'pecel lele', 'angkringan', 'warung tenda'], ['energik', 'hangat']),
  T('jamu', 'Jamu Tradisional', ['#1D2A0E', '#34501A', '#E9B949', '#A3C35A', '#FBF8E8', '#C3C9A6', '#263713'], 'Playfair Display', 'Montserrat', 'halftone', ['jamu', 'kunyit', 'beras kencur', 'temulawak', 'rempah', 'sehat alami'], ['tenang', 'hangat']),
  T('durian', 'Durian Montong', ['#1A2208', '#2F3D10', '#FACC15', '#84CC16', '#FEFCE8', '#C6CC9A', '#233010'], 'Anton', 'Poppins', 'dots', ['durian', 'montong', 'pancake durian', 'kebun buah', 'musim durian'], ['energik', 'lucu']),
  T('seafood-pedas', 'Seafood Pedas', ['#12090A', '#3A1214', '#EF4444', '#FB923C', '#FFF1F0', '#D8AFAB', '#22100F'], 'Anton', 'Montserrat', 'waves', ['kepiting', 'udang', 'cumi', 'kerang', 'saus padang', 'lobster', 'seafood'], ['energik']),
  T('kopi-tubruk', 'Kopi Tubruk', ['#0E0B08', '#241B13', '#C8A27A', '#E9D8C4', '#F7EFE6', '#A8977F', '#1A140E'], 'Bebas Neue', 'Montserrat', 'noise', ['kopi hitam', 'tubruk', 'espresso', 'robusta', 'arabika', 'biji kopi', 'barista'], ['serius', 'tenang']),
  T('wo-champagne', 'Wedding Champagne', ['#FBF6EE', '#F1E4CF', '#A67C52', '#C9A96E', '#2E2216', '#7D6A55', '#FFFFFF'], 'Playfair Display', 'Montserrat', 'bokeh', ['wedding organizer', 'pernikahan', 'undangan', 'akad', 'resepsi', 'lamaran', 'prewedding'], ['mewah', 'hangat'], 135),
  T('fotografer', 'Studio Foto', ['#0B0B0D', '#1C1C22', '#F5F5F5', '#EAB308', '#FFFFFF', '#9CA3AF', '#16161A'], 'Space Grotesk', 'Montserrat', 'noise', ['fotografer', 'foto studio', 'photoshoot', 'videografer', 'dokumentasi', 'kamera'], ['serius', 'mewah']),
  T('kids-crayon', 'Krayon Anak', ['#FFFBEB', '#FEF3C7', '#EF4444', '#3B82F6', '#1F2937', '#6B7280', '#FFFFFF'], 'Poppins', 'Poppins', 'dots', ['tk', 'paud', 'mainan', 'balita', 'ulang tahun anak', 'sekolah anak', 'kids'], ['lucu', 'energik'], 135),
  T('tosca-modern', 'Tosca Modern', ['#042F2E', '#0F4C4A', '#2DD4BF', '#FDE68A', '#F0FDFA', '#99C9C3', '#0B3B39'], 'Space Grotesk', 'Plus Jakarta Sans', 'grid', ['fintech', 'dompet digital', 'bank', 'asuransi', 'paylater', 'transfer'], ['serius', 'tenang']),
  T('genz-ungu', 'Gen Z Ungu', ['#1A0533', '#3B0A6B', '#C084FC', '#FDE047', '#FAF5FF', '#C4B5D9', '#2A0A4F'], 'Anton', 'Space Grotesk', 'halftone', ['gen z', 'viral', 'tren', 'fyp', 'konten', 'meme', 'relate'], ['lucu', 'energik']),
  T('mega-sale', 'Mega Sale Kuning', ['#FFD60A', '#FFC300', '#000000', '#E5383B', '#000000', '#3D3300', '#FFFFFF'], 'Anton', 'Montserrat', 'rays', ['sale', 'obral', 'cuci gudang', 'harbolnas', '12.12', '11.11', 'promo besar', 'payday'], ['energik'], 135),
  T('korporat-biru', 'Korporat Biru', ['#F4F7FB', '#E3EAF4', '#1D4ED8', '#0EA5E9', '#0B1B33', '#5A6B85', '#FFFFFF'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'grid', ['perusahaan', 'company profile', 'korporat', 'kantor', 'b2b', 'konsultan', 'jasa profesional'], ['serius'], 135),
  T('gym-power', 'Gym Power', ['#0A0A0A', '#1C1C1C', '#EF233C', '#F8F9FA', '#FFFFFF', '#A0A0A0', '#161616'], 'Anton', 'Montserrat', 'stripes', ['workout', 'binaraga', 'protein', 'personal trainer', 'bulking', 'cutting', 'membership gym'], ['energik', 'serius']),
  T('sage-calm', 'Sage Calm', ['#EEF2EA', '#DCE5D3', '#6B8F71', '#D9A47B', '#22301F', '#66745F', '#FFFFFF'], 'Playfair Display', 'Poppins', 'waves', ['pilates', 'wellness', 'pijat', 'refleksi', 'aromaterapi', 'massage', 'me time'], ['tenang'], 135),
  T('tropical-sunset', 'Tropical Sunset', ['#2B0F3A', '#7A1F5C', '#FF7A59', '#FFD166', '#FFF4EC', '#E0B3C5', '#3D1450'], 'Montserrat', 'Poppins', 'rays', ['tropis', 'summer', 'pool party', 'beach club', 'musim panas', 'liburan sekolah'], ['energik', 'hangat']),
  T('es-teh', 'Es Teh Segar', ['#EFFFF4', '#CFF7DC', '#16A34A', '#F59E0B', '#0F2A18', '#4E6D58', '#FFFFFF'], 'Bebas Neue', 'Poppins', 'bubbles', ['es teh', 'teh jumbo', 'minuman dingin', 'es jeruk', 'segar', 'haus', 'es campur'], ['energik', 'lucu'], 135),
  T('kue-lebaran', 'Kue Lebaran', ['#FFF8EC', '#FBE7C6', '#B45309', '#15803D', '#3A2108', '#7C6347', '#FFFFFF'], 'Playfair Display', 'Poppins', 'halftone', ['kue kering', 'nastar', 'kastengel', 'hampers lebaran', 'parsel', 'kue lebaran'], ['hangat', 'mewah'], 135),
  T('natal', 'Natal Merah Hijau', ['#0B2A1A', '#14432A', '#E63946', '#F1C453', '#F8FFF9', '#B5CDBE', '#0F3521'], 'Playfair Display', 'Montserrat', 'bokeh', ['natal', 'christmas', 'santa', 'desember', 'kado natal', 'pohon natal'], ['hangat', 'mewah']),
  T('halloween', 'Halloween', ['#120A1E', '#2A1340', '#FF7518', '#A3E635', '#FFF7ED', '#BCA9CF', '#1E1030'], 'Anton', 'Space Grotesk', 'halftone', ['halloween', 'horor', 'seram', 'hantu', 'misteri', 'creepy', 'uji nyali'], ['energik', 'lucu']),
  T('valentine-merah', 'Valentine Merah', ['#3A0412', '#6B0A22', '#FF4D6D', '#FFB3C1', '#FFF0F3', '#E6A9B6', '#4C0718'], 'Playfair Display', 'Poppins', 'bokeh', ['14 februari', 'couple', 'kado pacar', 'anniversary', 'hari kasih sayang'], ['hangat', 'galau']),
  T('tahun-baru', 'Tahun Baru Emas', ['#070710', '#161630', '#F5C542', '#E5E7EB', '#FFFFFF', '#A6A6C2', '#10102A'], 'Bebas Neue', 'Montserrat', 'rays', ['new year', 'countdown', 'malam tahun baru', 'resolusi', 'akhir tahun'], ['mewah', 'energik']),
  T('agustusan', 'Lomba Agustusan', ['#FFFFFF', '#FDECEC', '#DC2626', '#1D4ED8', '#1A1A1A', '#6B6B6B', '#FFF5F5'], 'Anton', 'Montserrat', 'stripes', ['lomba', 'agustusan', '17an', 'panjat pinang', 'balap karung', 'tujuh belasan'], ['energik', 'lucu'], 135),
  T('sekolah-hijau', 'Sekolah Hijau', ['#F0FDF4', '#DCFCE7', '#15803D', '#EAB308', '#052E16', '#4D6B57', '#FFFFFF'], 'Montserrat', 'Plus Jakarta Sans', 'grid', ['ppdb', 'pendaftaran sekolah', 'pesantren', 'madrasah', 'sd', 'smp', 'sma'], ['serius', 'tenang'], 135),
  T('kursus-coding', 'Kursus Coding', ['#0B1020', '#141B34', '#60A5FA', '#F472B6', '#EEF2FF', '#9AA5C6', '#111832'], 'Space Grotesk', 'Space Grotesk', 'grid', ['bootcamp', 'kursus coding', 'belajar programming', 'python', 'javascript', 'ui ux', 'data science'], ['serius', 'energik']),
  T('indie-gig', 'Indie Gig', ['#1B1B1B', '#2E2A24', '#F2C14E', '#F78154', '#F9F4EA', '#B8AE9C', '#24221E'], 'Bebas Neue', 'Space Grotesk', 'noise', ['gigs', 'band', 'indie', 'akustik', 'live music', 'open mic', 'konser kecil'], ['energik', 'galau']),
  T('podcast', 'Podcast Studio', ['#111827', '#1F2937', '#A78BFA', '#34D399', '#F9FAFB', '#9CA3AF', '#1A2232'], 'Space Grotesk', 'Plus Jakarta Sans', 'dots', ['podcast', 'episode', 'obrolan', 'talkshow', 'siniar', 'ngobrol santai'], ['serius', 'tenang']),
  T('esport-merah', 'Esport Merah', ['#0D0507', '#2A0B12', '#FF2D55', '#00E5FF', '#FFFFFF', '#B3A0A6', '#1E0A0F'], 'Anton', 'Space Grotesk', 'grid', ['turnamen', 'scrim', 'free fire', 'ff', 'mlbb', 'top up diamond', 'rank'], ['energik']),
  T('thrift-vintage', 'Thrift Vintage', ['#EFE6D8', '#DCCBB0', '#8C3B2E', '#2F5D50', '#2B2118', '#75654F', '#F8F2E8'], 'Bebas Neue', 'Poppins', 'noise', ['thrift', 'preloved', 'second', 'bekas', 'jaket jadul', 'kemeja vintage'], ['hangat', 'lucu'], 135),
  T('sneaker-hype', 'Sneaker Hype', ['#F5F5F5', '#E5E5E5', '#111111', '#FF3B30', '#111111', '#555555', '#FFFFFF'], 'Anton', 'Space Grotesk', 'stripes', ['sepatu', 'nike', 'adidas', 'original', 'drop', 'hype', 'jordan'], ['energik', 'serius'], 135),
  T('showroom-mobil', 'Showroom Mobil', ['#0A0F1A', '#18233A', '#E2E8F0', '#EF4444', '#FFFFFF', '#94A3B8', '#121A2C'], 'Montserrat', 'Montserrat', 'rays', ['mobil', 'showroom', 'rental mobil', 'dealer', 'kredit mobil', 'mobil bekas'], ['serius', 'mewah']),
  T('umrah', 'Umrah Haji', ['#0A2A24', '#12463C', '#D4AF37', '#F5F5DC', '#FFFDF5', '#B8C7BD', '#0E352E'], 'Playfair Display', 'Montserrat', 'halftone', ['umrah', 'haji', 'travel umrah', 'makkah', 'madinah', 'ibadah', 'manasik'], ['tenang', 'mewah']),
  T('pagi-cerah', 'Pagi Cerah', ['#FFF9EF', '#FFEFD2', '#F59E0B', '#10B981', '#2B2010', '#776A55', '#FFFFFF'], 'Poppins', 'Poppins', 'rays', ['pagi', 'sarapan', 'breakfast', 'bubur', 'nasi uduk', 'selamat pagi'], ['hangat', 'energik'], 135),
  T('malam-bintang', 'Malam Berbintang', ['#050B1F', '#0E1B44', '#FCD34D', '#93C5FD', '#F1F5FF', '#A3B1D1', '#0B1736'], 'Playfair Display', 'Poppins', 'bokeh', ['bintang', 'tidur', 'mimpi', 'renungan', 'selamat malam', 'doa malam'], ['galau', 'tenang']),
  T('kpop-pink', 'K-Pop Pink', ['#FFE4F1', '#FFC2DE', '#FF2E93', '#6C3BFF', '#2B0A1E', '#7E4B66', '#FFFFFF'], 'Anton', 'Poppins', 'dots', ['kpop', 'korea', 'idol', 'bias', 'drakor', 'oppa', 'photocard'], ['lucu', 'energik'], 135),
  T('army-outdoor', 'Army Outdoor', ['#1B1F14', '#2E3522', '#A3B14B', '#E0A458', '#F2F0E6', '#B3B49C', '#24291A'], 'Bebas Neue', 'Montserrat', 'noise', ['outdoor', 'survival', 'army', 'tactical', 'adventure', 'pendakian', 'carrier'], ['serius', 'energik']),
  T('kolam-renang', 'Kolam Renang', ['#E0F7FF', '#B9ECFF', '#0077B6', '#FFB703', '#023047', '#4C7488', '#FFFFFF'], 'Montserrat', 'Poppins', 'waves', ['kolam renang', 'les renang', 'waterpark', 'renang anak', 'water park'], ['energik', 'lucu'], 135),
  T('perhiasan-putih', 'Perhiasan Putih', ['#FFFFFF', '#F4EFE6', '#B8860B', '#1F2937', '#1A1A1A', '#6B6B6B', '#FAF7F0'], 'Playfair Display', 'Montserrat', 'none', ['cincin', 'kalung', 'emas murni', 'toko emas', 'gelang', 'anting'], ['mewah'], 135),
  T('sambal', 'Sambal Bawang', ['#B91C1C', '#7F1D1D', '#FDE047', '#FFFFFF', '#FFFFFF', '#FECACA', '#991B1B'], 'Anton', 'Montserrat', 'halftone', ['sambal', 'sambel', 'cabe', 'bumbu', 'sambal bawang', 'sambal botol', 'level pedas'], ['energik']),
  T('daun-pisang', 'Daun Pisang', ['#0F3D1E', '#1B5E2E', '#F4D35E', '#EE964B', '#F5FFF5', '#A8C8AE', '#144A25'], 'Playfair Display', 'Poppins', 'blobs', ['nasi bakar', 'pepes', 'nasi liwet', 'sunda', 'daun pisang', 'kuliner nusantara'], ['hangat', 'tenang']),
  T('abu-minimal', 'Abu Minimalis', ['#EDEDED', '#DADADA', '#222222', '#FF5F1F', '#111111', '#5E5E5E', '#FFFFFF'], 'Space Grotesk', 'Plus Jakarta Sans', 'grid', ['portfolio', 'arsitektur', 'interior', 'minimalis', 'studio desain', 'freelance'], ['serius', 'tenang'], 135),
  T('kayu-jati', 'Kayu Jati', ['#2A1B10', '#4A311C', '#D9A066', '#8FB996', '#FFF6EA', '#CDB59A', '#36231A'], 'Playfair Display', 'Montserrat', 'noise', ['furniture', 'mebel', 'kayu', 'jati', 'kerajinan kayu', 'interior rustic'], ['hangat', 'mewah']),
  T('es-kristal', 'Es Kristal', ['#E8F4FF', '#D0E8FF', '#2563EB', '#06B6D4', '#0B1F3A', '#5B7393', '#FFFFFF'], 'Montserrat', 'Poppins', 'bubbles', ['es batu', 'air mineral', 'galon', 'depot air', 'isi ulang', 'air minum'], ['tenang', 'serius'], 135),
  T('kurir', 'Kurir Kilat', ['#FFF4E5', '#FFE0B2', '#F97316', '#16A34A', '#2A1605', '#7A5530', '#FFFFFF'], 'Anton', 'Poppins', 'stripes', ['kurir', 'ojek', 'antar jemput', 'delivery', 'ekspedisi', 'pengiriman', 'cod'], ['energik'], 135),
  T('marun-kebaya', 'Marun Kebaya', ['#3A0A14', '#5E1323', '#E9C46A', '#F4A3A8', '#FFF5F0', '#D8B2AE', '#4A0E1A'], 'Playfair Display', 'Montserrat', 'halftone', ['kebaya', 'kain', 'tenun', 'songket', 'busana adat', 'sewa kebaya'], ['mewah', 'hangat']),
  T('lime-fresh', 'Lime Fresh', ['#F7FEE7', '#ECFCCB', '#65A30D', '#F43F5E', '#1A2E05', '#5F7044', '#FFFFFF'], 'Poppins', 'Poppins', 'blobs', ['salad buah', 'jus sehat', 'detox', 'smoothie bowl', 'sayur segar', 'buah potong'], ['lucu', 'energik'], 135),
  T('film-noir', 'Film Noir', ['#050505', '#161616', '#E50914', '#F5F5F1', '#FFFFFF', '#9E9E9E', '#121212'], 'Bebas Neue', 'Montserrat', 'noise', ['bioskop', 'trailer', 'review film', 'sinema', 'nonton', 'series'], ['serius', 'galau']),
  T('baby-mint', 'Baby Mint', ['#F0FFF8', '#D7F9EA', '#34D399', '#F9A8D4', '#1F3A30', '#6A8A7C', '#FFFFFF'], 'Poppins', 'Poppins', 'bubbles', ['baby shop', 'perlengkapan bayi', 'popok', 'susu formula', 'newborn', 'aqiqah'], ['lucu', 'tenang'], 135),
  T('synthwave', 'Synthwave', ['#0D0221', '#261447', '#FF2A6D', '#05D9E8', '#F7F7FF', '#A99BC7', '#1A0B38'], 'Space Grotesk', 'Space Grotesk', 'grid', ['synthwave', 'edm', 'rave', 'neon party', 'clubbing', 'dj set'], ['energik']),
  T('laporan-keuangan', 'Laporan Keuangan', ['#F8FAFC', '#E2E8F0', '#0F766E', '#F59E0B', '#0F172A', '#64748B', '#FFFFFF'], 'Plus Jakarta Sans', 'Plus Jakarta Sans', 'grid', ['pajak', 'akuntansi', 'laporan keuangan', 'pembukuan', 'konsultan pajak', 'umkm naik kelas'], ['serius'], 135),
  T('bata-merah', 'Bata Merah', ['#3B1A12', '#5C2A1E', '#E07A5F', '#F2CC8F', '#FFF4EC', '#D1A99A', '#48211A'], 'Anton', 'Montserrat', 'stripes', ['kontraktor', 'tukang bangunan', 'material', 'semen', 'bata', 'renovasi rumah', 'bangun rumah'], ['serius', 'energik']),
  T('wisuda-ungu', 'Wisuda Ungu', ['#2E1065', '#4C1D95', '#FBBF24', '#E9D5FF', '#FAF5FF', '#C4B5FD', '#3B1584'], 'Playfair Display', 'Montserrat', 'bokeh', ['wisuda', 'graduation', 'toga', 'sarjana', 'lulus', 'selamat lulus'], ['mewah', 'hangat']),
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
  // ---- Layout tambahan v7 ----
  {
    id: 'kertas', name: 'Catatan Kertas', desc: 'Kartu kertas bertekstur, rata kiri — hangat untuk tips & cerita.', intents: ['tips', 'tutorial', 'cerita', 'quote-motivasi'], base: 'editorial',
    align: 'left', compStyle: 'kertas', headlineSize: 100, upper: false, highlight: true, photo: 'frame', decor: 'lines', pattern: 'noise',
    headAnim: ['teks-line-naik-normal', 'teks-word-naik-normal'], bodyAnim: ['teks-line-muncul-normal', 'fade'], elemAnim: ['geser-kanan-pendek-halus', 'pop-kecil-membal'],
    loops: ['loop-napas-lembut'], transitions: ['wave-up-3-landai-halus', 'tilt-left-10-halus', 'zigzag-up-8-halus-polos', 'fade-none-normal'], energy: 1,
  },
  {
    id: 'ombak', name: 'Ombak Lembut', desc: 'Latar bergelombang, transisi air — santai & puitis.', intents: ['travel', 'quote-galau', 'ucapan', 'cerita'], base: 'sinema',
    align: 'center', compStyle: 'soft', headlineSize: 96, upper: false, highlight: false, photo: 'bg', decor: 'bubbles', pattern: 'waves',
    headAnim: ['teks-word-blur-normal', 'blur-fokus-naik-halus'], bodyAnim: ['fade-slow', 'geser-atas-pendek-halus'], elemAnim: ['fade', 'pop-sedang-halus'],
    loops: ['loop-melayang-lembut', 'loop-napas-lembut'], transitions: ['wave-up-5-tinggi-halus', 'wave-left-3-sedang-halus', 'rings-center-5', 'blur-sedang'], energy: 1,
  },
  {
    id: 'retro-tv', name: 'Retro TV', desc: 'Bingkai siaran jadul, garis pindai & gulungan film.', intents: ['fakta', 'event', 'pengumuman', 'launching'], base: 'listicle',
    align: 'center', compStyle: 'retro', headlineSize: 112, upper: true, highlight: false, photo: 'frame', decor: 'corners', pattern: 'stripes',
    headAnim: ['teks-decode-normal', 'teks-word-pop-normal'], bodyAnim: ['teks-ketik-cepat', 'geser-atas-pendek-tegas'], elemAnim: ['gaya-kilat-cepat', 'pop-kecil-membal'],
    loops: ['loop-kedip-lembut'], transitions: ['filmroll-left-halus', 'scan-down-white-tebal', 'pixel-sedang', 'checker-8-xy-catur-halus'], energy: 2,
  },
  {
    id: 'poster', name: 'Poster Konser', desc: 'Judul raksasa, balok warna, sinar — gaya poster acara.', intents: ['event', 'launching', 'promo-produk', 'pengumuman'], base: 'bold',
    align: 'center', compStyle: 'gelap', headlineSize: 136, upper: true, highlight: true, photo: 'bg', decor: 'stickers', pattern: 'rays',
    headAnim: ['gaya-tumbuk-cepat', 'teks-word-pop-cepat'], bodyAnim: ['pop-besar-tegas', 'geser-atas-pendek-membal'], elemAnim: ['gaya-tada-cepat', 'fisika-jatuh-pantul-kuat'],
    loops: ['loop-detak-sedang', 'loop-denyut-sedang'], transitions: ['colorbars-left-3-primary', 'stretch-left-sedang-tegas', 'burst-8', 'colorbars-up-5-secondary'], energy: 3,
  },
  {
    id: 'feed-app', name: 'Feed Aplikasi', desc: 'Kartu kaca di bingkai HP, geser ala karusel aplikasi.', intents: ['testimoni', 'tips', 'promo-produk', 'launching'], base: 'chat',
    align: 'center', compStyle: 'kaca', headlineSize: 96, upper: false, highlight: false, photo: 'phone', decor: 'bubbles',
    headAnim: ['teks-word-naik-normal', 'pop-kecil-membal'], bodyAnim: ['geser-atas-pendek-membal', 'fade'], elemAnim: ['geser-atas-jauh-membal', 'fisika-pegas-lembut'],
    loops: ['loop-melayang-lembut'], transitions: ['carousel-left-dekat-halus', 'carousel-up-dekat-membal', 'swing-left-membal', 'carousel-right-jauh-halus'], energy: 2,
  },
  {
    id: 'undangan', name: 'Undangan Elegan', desc: 'Serif emas, tirai panggung — untuk ucapan & acara resmi.', intents: ['ucapan', 'event', 'quote-motivasi', 'pengumuman'], base: 'sinema',
    align: 'center', compStyle: 'elegan', headlineSize: 92, upper: false, highlight: false, photo: 'frame', decor: 'lines', pattern: 'bokeh',
    headAnim: ['teks-word-muncul-lambat', 'teks-line-muncul-lambat'], bodyAnim: ['fade-slow', 'blur-fokus-halus'], elemAnim: ['fade-slow', 'pop-sedang-halus'],
    loops: ['loop-napas-lembut', 'loop-zoom-pelan-lembut'], transitions: ['curtain-left-secondary-lipit-halus', 'fade-white-lambat', 'rings-center-3', 'iris-center-halus'], energy: 1,
  },
  {
    id: 'pasar', name: 'Pasar Murah', desc: 'Split foto + stiker harga, gerigi & balok warna — jualan ramai.', intents: ['flash-sale', 'menu-kuliner', 'promo-produk'], base: 'jualan',
    align: 'left', compStyle: 'pop', headlineSize: 118, upper: true, highlight: true, photo: 'split', decor: 'stickers', pattern: 'halftone',
    headAnim: ['teks-word-pop-cepat', 'fisika-elastis-kuat'], bodyAnim: ['pop-besar-tegas', 'geser-kanan-jauh-tegas'], elemAnim: ['gaya-tada-normal', 'putar-kanan-30-membal'],
    loops: ['loop-goyang-sedang', 'loop-detak-sedang'], transitions: ['zigzag-left-8-tajam-primary', 'colorbars-up-5-secondary', 'dots-star-9-random', 'stretch-up-ekstrem-tegas'], energy: 3,
  },
  {
    id: 'tekno', name: 'Grid Teknologi', desc: 'Garis grid, angka besar, kerai miring — rapi untuk edukasi.', intents: ['tutorial', 'fakta', 'tips', 'launching'], base: 'majalah',
    align: 'left', compStyle: 'garis', headlineSize: 108, upper: false, highlight: true, photo: 'split', decor: 'grid', pattern: 'grid',
    headAnim: ['teks-char-muncul-cepat', 'teks-word-naik-normal'], bodyAnim: ['teks-word-naik-cepat', 'wipe-left-tegas'], elemAnim: ['stretch-h-tegas', 'pop-raksasa-tegas'],
    loops: ['loop-denyut-lembut'], transitions: ['diagblinds-45-8-tegas', 'scan-right-primary-tipis', 'checker-12-x-acak-halus', 'fan-tl-2'], energy: 2,
  },
  {
    id: 'komik', name: 'Panel Komik', desc: 'Garis tebal, halftone, gerak miring — gaya komik pop.', intents: ['fakta', 'cerita', 'tips', 'promo-produk'], base: 'brutal',
    align: 'left', compStyle: 'brutal', headlineSize: 124, upper: true, highlight: true, photo: 'frame', decor: 'stickers', pattern: 'halftone',
    headAnim: ['fisika-snap-kuat', 'gaya-jelly-cepat'], bodyAnim: ['geser-kanan-jauh-tegas', 'pop-kecil-membal'], elemAnim: ['putar-kiri-12-membal', 'fisika-jatuh-pantul-kuat'],
    loops: ['loop-lompat-lembut', 'loop-goyang-sedang'], transitions: ['tilt-left-35-tegas', 'dots-circle-12-diagonal', 'slide-left-sentak', 'shatter-center'], energy: 3,
  },
  {
    id: 'papan-info', name: 'Papan Info', desc: 'Minimal & jelas, potongan pie & langkah — untuk lowongan/info.', intents: ['lowongan', 'pengumuman', 'event', 'tutorial'], base: 'listicle',
    align: 'center', compStyle: 'minimal', headlineSize: 100, upper: false, highlight: false, photo: 'frame', decor: 'lines',
    headAnim: ['teks-word-naik-normal', 'gaya-roket-cepat'], bodyAnim: ['geser-kiri-jauh-membal', 'geser-atas-pendek-halus'], elemAnim: ['fisika-pegas-kiri-kuat', 'pop-kecil-membal'],
    loops: ['loop-denyut-lembut'], transitions: ['pie-4-urut-halus', 'push-up-pegas', 'wave-left-2-landai-halus', 'checker-6-y-catur-membal'], energy: 2,
  },
  {
    id: 'galeri', name: 'Galeri Foto', desc: 'Foto penuh berbingkai sinema, gulungan film & karusel.', intents: ['travel', 'before-after', 'menu-kuliner', 'testimoni'],
    align: 'center', compStyle: 'soft', headlineSize: 96, upper: false, highlight: false, photo: 'bg', decor: 'letterbox',
    headAnim: ['teks-word-blur-normal', 'wipe-up-halus'], bodyAnim: ['geser-atas-pendek-halus', 'fade'], elemAnim: ['pop-kecil-membal', 'fade'],
    loops: ['loop-zoom-pelan-lembut'], transitions: ['filmroll-up-halus', 'carousel-left-jauh-halus', 'dolly-lembut', 'rings-br-5'], energy: 2,
  },
  {
    id: 'neon-jalan', name: 'Neon Jalanan', desc: 'HUD neon, laser pindai & regang ekstrem — promo malam.', intents: ['flash-sale', 'event', 'launching', 'pengumuman'], base: 'neon',
    align: 'center', compStyle: 'neon', headlineSize: 116, upper: true, highlight: true, photo: 'bg', decor: 'corners', pattern: 'grid',
    headAnim: ['gaya-glitch-masuk-cepat', 'teks-decode-normal'], bodyAnim: ['teks-ketik-cepat', 'pop-besar-tegas'], elemAnim: ['gaya-kilat-cepat', 'gaya-tada-cepat'],
    loops: ['loop-kedip-lembut', 'loop-detak-sedang'], transitions: ['scan-left-secondary-tebal', 'glitch-blok-sedang', 'zigzag-right-14-tajam-primary', 'stretch-right-ekstrem-tegas'], energy: 3,
  },
];

// ---- Layout tambahan v8: turunan dari layout induk dengan gaya komponen, dekor, pola & transisi berbeda ----
const V = (baseId: string, o: Partial<LayoutDef> & { id: string; name: string; desc: string }): LayoutDef => {
  const b = LAYOUTS.find((l) => l.id === baseId) || LAYOUTS[0];
  return { ...b, ...o, base: b.base || b.id };
};
LAYOUTS.push(
  V('bold', { id: 'bold-clay', name: 'Bold Clay 3D', desc: 'Judul besar dengan kartu clay timbul & gelembung.', compStyle: 'clay', decor: 'bubbles', pattern: 'blobs', headAnim: ['gaya-meletus-normal', 'teks-word-pop-cepat'], transitions: ['bubbles-circle-16-polos', 'flytiles-up-6-rows-lurus', 'lens-center-ringan-polos', 'push-up-pegas'] }),
  V('editorial', { id: 'editorial-koran', name: 'Editorial Koran', desc: 'Kartu ala koran, serif & lipatan halaman.', compStyle: 'koran', decor: 'lines', pattern: 'noise', headAnim: ['teks-line-naik-normal', 'teks-word-muncul-normal'], transitions: ['pagecurl-br-0-kertas-halus', 'roll-up-tipis-halus', 'tear-left-14-halus-polos', 'wipe-left-soft'] }),
  V('kaca', { id: 'kaca-salju', name: 'Kaca Salju', desc: 'Kartu kaca terang yang bersih, transisi lensa.', compStyle: 'salju', decor: 'bubbles', pattern: 'bokeh', transitions: ['blur-sedang', 'lens-center-ringan-white', 'bubbles-circle-28-white', 'zoom-masuk-halus'] }),
  V('brutal', { id: 'stiker-pop', name: 'Stiker Pop', desc: 'Kartu berbingkai stiker putih, lempar & ubin terbang.', compStyle: 'stiker', decor: 'stickers', pattern: 'dots', elemAnim: ['gaya-stempel-cepat', 'fisika-snap-kiri-kuat'], transitions: ['toss-right-15-polos-cepat', 'flytiles-left-6-random-putar', 'dots-star-9-random', 'slide-left-sentak'] }),
  V('neon', { id: 'cyber-lime', name: 'Cyber Lime', desc: 'Terminal hijau limau, garis pindai & kerai acak.', compStyle: 'cyber', decor: 'corners', pattern: 'grid', headAnim: ['teks-decode-cepat', 'gaya-kedip-masuk-normal'], transitions: ['scan-down-white-tebal', 'glitch-rgb-sedang', 'slats-left-10-acak-hitam', 'pixel-kasar'] }),
  V('minimal', { id: 'minimal-krem', name: 'Minimal Krem', desc: 'Kartu krem hangat, sapuan kuas lembut.', compStyle: 'krem', decor: 'none', pattern: 'none', transitions: ['fade-none-lambat', 'brush-left-3-0-halus', 'wipe-up-soft', 'roll-down-tipis-halus'] }),
  V('majalah', { id: 'majalah-tinta', name: 'Majalah Tinta', desc: 'Blok tinta hitam tegas, halftone & sobekan.', compStyle: 'tinta', decor: 'grid', pattern: 'halftone', transitions: ['slats-up-6-urut-hitam', 'diagblinds-45-8-tegas', 'push-left-sentak', 'tear-up-8-kasar-white'] }),
  V('split', { id: 'split-kapsul', name: 'Split Kapsul', desc: 'Foto setengah layar dengan kartu kapsul warna brand.', compStyle: 'kapsul', decor: 'blobs', pattern: 'blobs', transitions: ['carousel-left-dekat-membal', 'swing-left-pegas', 'push-up-kenyal', 'lens-br-ringan-primary'] }),
  V('chat', { id: 'chat-pastel', name: 'Chat Pastel', desc: 'Bubble chat pastel lembut, gelembung hati.', compStyle: 'pastel', decor: 'bubbles', pattern: 'bubbles', transitions: ['bubbles-heart-16-white', 'slide-up-pegas', 'carousel-up-dekat-halus', 'zoom-masuk-halus'] }),
  V('listicle', { id: 'langkah-tegas', name: 'Langkah Tegas', desc: 'Kartu putih bergaris brand, langkah demi langkah.', compStyle: 'putih-tegas', decor: 'lines', pattern: 'grid', transitions: ['flytiles-up-4-rows-lurus', 'push-left-pegas', 'checker-6-y-catur-membal', 'pie-6-urut-halus'] }),
  V('jualan', { id: 'promo-sunset', name: 'Promo Sunset', desc: 'Gradien sunset, balok warna & ubin berputar.', compStyle: 'sunset', decor: 'stickers', pattern: 'rays', transitions: ['colorbars-left-3-secondary', 'zoom-masuk-kuat', 'burst-5', 'tilesout-6-diagonal-spin'] }),
  V('sinema', { id: 'sinema-emas', name: 'Sinema Hitam Emas', desc: 'Letterbox, kartu hitam-emas, lampu sorot.', compStyle: 'hitam-emas', decor: 'letterbox', pattern: 'noise', transitions: ['fade-black-lambat', 'spotlight-left-1-soft-polos', 'curtain-left-black-lipit-halus', 'dolly-dramatis'] }),
  V('kertas', { id: 'catatan-malam', name: 'Catatan Malam', desc: 'Kaca gelap di atas bokeh, kuas & lipatan.', compStyle: 'kaca-gelap', decor: 'lines', pattern: 'bokeh', transitions: ['brush-up-4-0-halus', 'fade-none-normal', 'pagecurl-tr-20-kertas-lembut', 'wave-up-3-landai-halus'] }),
  V('ombak', { id: 'ombak-biru', name: 'Ombak Biru', desc: 'Gradien laut, leleh & gelombang tinggi.', compStyle: 'laut', decor: 'bubbles', pattern: 'waves', transitions: ['melt-down-24-rata-pelan', 'wave-left-5-tinggi-halus', 'bubbles-circle-45-white', 'rings-center-8'] }),
  V('retro-tv', { id: 'retro-80an', name: 'Retro 80an', desc: 'Kartu ungu-pink 80an, kerai putar & film.', compStyle: 'retro-80', decor: 'corners', pattern: 'stripes', transitions: ['filmroll-up-membal', 'slats-up-10-urut-primary', 'scan-left-primary-tebal', 'checker-8-x-catur-membal'] }),
  V('poster', { id: 'poster-miring', name: 'Poster Miring', desc: 'Kartu miring dinamis, geser miring & lempar.', compStyle: 'miring', decor: 'stickers', pattern: 'rays', transitions: ['tilt-right-35-tegas', 'stretch-right-sedang-tegas', 'colorbars-right-3-primary', 'toss-left-40-polos-cepat'] }),
  V('feed-app', { id: 'feed-gradien', name: 'Feed Gradien', desc: 'Kartu gradien terbalik, karusel & ayun.', compStyle: 'gradien-balik', decor: 'bubbles', pattern: 'blobs', transitions: ['carousel-left-jauh-membal', 'swing-right-membal', 'lens-center-kuat-polos', 'flytiles-up-9-diagonal-lurus'] }),
  V('undangan', { id: 'undangan-garis', name: 'Undangan Garis', desc: 'Bingkai garis warna, tirai atas-bawah.', compStyle: 'garis-warna', decor: 'lines', pattern: 'bokeh', headAnim: ['gaya-tirai-turun-normal', 'teks-line-muncul-lambat'], transitions: ['curtain-up-secondary-lipit-halus', 'rings-center-5', 'fade-white-lambat', 'pagecurl-bl-0-primary-halus'] }),
  V('pasar', { id: 'pasar-blok', name: 'Pasar Blok Warna', desc: 'Blok warna aksen, ubin berjatuhan & gerigi.', compStyle: 'blok-aksen', decor: 'stickers', pattern: 'halftone', transitions: ['colorbars-up-3-primary', 'zigzag-right-8-tajam-primary', 'tilesout-8-random-fall', 'toss-up-15-foto-cepat'] }),
  V('tekno', { id: 'data-neon', name: 'Data Neon', desc: 'Grid data dengan garis neon aksen.', compStyle: 'neon-aksen', decor: 'grid', pattern: 'grid', transitions: ['scan-right-secondary-tipis', 'diagblinds-135-14-halus', 'slats-left-16-acak-hitam', 'fan-center-4'] }),
  V('komik', { id: 'komik-bayang', name: 'Komik Bayangan', desc: 'Panel komik dengan bayangan aksen & sobekan.', compStyle: 'bayang-aksen', decor: 'stickers', pattern: 'halftone', elemAnim: ['gaya-bumerang-cepat', 'fisika-jatuh-pantul-kuat'], transitions: ['tear-left-8-kasar-white', 'dots-circle-9-diagonal', 'slide-right-sentak', 'shatter-tl'] }),
  V('papan-info', { id: 'info-polos', name: 'Info Polos', desc: 'Teks tanpa kartu, rapi untuk info penting.', compStyle: 'polos', decor: 'lines', pattern: 'none', transitions: ['pie-8-urut-halus', 'wipe-down-soft', 'roll-left-tipis-cepat', 'push-down-halus'] }),
  V('galeri', { id: 'galeri-polaroid', name: 'Galeri Polaroid', desc: 'Foto berbingkai stiker, dilempar seperti polaroid.', compStyle: 'stiker', photo: 'frame', decor: 'none', pattern: 'noise', transitions: ['toss-right-15-foto-ayun', 'toss-left-15-foto-ayun', 'filmroll-left-halus', 'carousel-right-dekat-halus'] }),
  V('neon-jalan', { id: 'neon-pink', name: 'Neon Pink', desc: 'Neon aksen malam, pindai & bintang.', compStyle: 'neon-aksen', decor: 'corners', pattern: 'grid', transitions: ['scan-up-secondary-tebal', 'glitch-iris-berat', 'stretch-up-ekstrem-tegas', 'bubbles-star-28-primary'] })
);

/** Template = layout × tema. Nama & tag dihitung saat diakses supaya ribuan template tetap ringan dimuat. */
class Tpl implements TemplateDef {
  constructor(
    public id: string,
    public themeId: string,
    public layoutId: string,
    private L: LayoutDef,
    private th: ThemeDef
  ) {}
  get name() {
    return `${this.th.name} · ${this.L.name}`;
  }
  get tags() {
    return [...this.L.intents, ...this.th.keywords, ...this.th.moods];
  }
  toJSON() {
    return { id: this.id, name: this.name, themeId: this.themeId, layoutId: this.layoutId, tags: this.tags };
  }
}
export const TEMPLATES: TemplateDef[] = [];
for (const L of LAYOUTS) {
  for (const th of THEMES) TEMPLATES.push(new Tpl(`${L.id}--${th.id}`, th.id, L.id, L, th));
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

/** Skor template untuk prompt tertentu (makin tinggi makin cocok).
 *  Skor tema & layout dihitung sekali per tema/layout (bukan per template), lalu dijumlahkan —
 *  tetap cepat walau jumlah template ribuan. */
const JITTER = new Map(TEMPLATES.map((tp) => [tp.id, ((tp.id.length * 7 + tp.id.charCodeAt(0)) % 5) * 0.5]));
export function rankTemplates(input: RankInput, limit = 24): Array<TemplateDef & { score: number; reason: string }> {
  const kw = input.keywords.map((k) => k.toLowerCase());
  const themeScore = new Map<string, { s: number; r: string | null }>();
  for (const th of THEMES) {
    let sc = 0;
    let r: string | null = null;
    const hits = th.keywords.filter((k) => kw.some((w) => w === k || (w.length > 3 && (k.includes(w) || w.includes(k)))));
    if (hits.length) {
      sc += 30 + hits.length * 6;
      r = `warna pas untuk "${hits[0]}"`;
    }
    if (th.moods.includes(input.mood)) sc += 14;
    if (th.id === 'sunset-coral') sc += 4;
    themeScore.set(th.id, { s: sc, r });
  }
  const layoutScore = new Map<string, { s: number; r: string | null }>();
  for (const L of LAYOUTS) {
    let sc = 0;
    let r: string | null = null;
    const li = L.intents.indexOf(input.intent);
    if (li >= 0) {
      sc += 40 - li * 6;
      r = 'cocok untuk jenis konten ini';
    }
    if (input.hasPhotos && (L.photo === 'split' || L.photo === 'frame' || L.photo === 'phone')) sc += 8;
    layoutScore.set(L.id, { s: sc, r });
  }
  const scored = TEMPLATES.map((tp) => ({ tp, s: themeScore.get(tp.themeId)!.s + layoutScore.get(tp.layoutId)!.s + (JITTER.get(tp.id) || 0) }));
  scored.sort((a, b) => b.s - a.s);
  // jaga keberagaman: maksimal 3 template per layout di daftar teratas
  const perLayout: Record<string, number> = {};
  const out: Array<TemplateDef & { score: number; reason: string }> = [];
  for (const { tp, s: sc } of scored) {
    perLayout[tp.layoutId] = (perLayout[tp.layoutId] || 0) + 1;
    if (perLayout[tp.layoutId] <= 3) {
      const reasons = [layoutScore.get(tp.layoutId)!.r, themeScore.get(tp.themeId)!.r].filter(Boolean);
      out.push({ id: tp.id, name: tp.name, themeId: tp.themeId, layoutId: tp.layoutId, tags: tp.tags, score: sc, reason: reasons.join(' · ') || 'alternatif gaya' });
    }
    if (out.length >= limit) break;
  }
  return out;
}

export { ALL_INTENTS };
