import type { Category, ContentPlan, Intent, PlanItem, SceneRole } from './types';
import { findIconFor } from './packs/icons';
import { BA_PAIRS, BENEFITS, CITY_FOODS, CTAS, DOMAIN_RULES, FACTS, GENERIC_QUALS, HOOKS, MISTAKES, OCCASIONS, PLACES, QUOTES, QUOTE_THEMES, ROLE_QUALS, STEPS, TIPS, type Line } from './prompt-banks';

/**
 * Prompt Engine v8 — membaca prompt bebas (bahasa Indonesia sehari-hari, campur Inggris & emoji) lalu menyusun rencana video.
 *
 * Alurnya:
 * 1. Ekstraksi entitas di teks asli (huruf besar-kecil tetap terjaga): kontak (WA/telepon, email, @akun, link),
 *    diskon (persen, potongan rupiah, beli X gratis Y), tanggal/jam/jadwal, harga beserta perannya
 *    (harga jual, harga coret, HTM, hadiah, gaji, budget, minimal belanja, ongkir) dan satuannya (/kg, /bulan),
 *    lokasi (jalan, area, tempat acara, online), dan nama toko. Tahun, nomor HP, jumlah ulasan, ukuran, level,
 *    jam buka, dan versi TIDAK lagi terbaca sebagai harga/tanggal.
 * 2. Setiap entitas "ditutup" lalu sisa kalimat dipecah per klausa: klausa pertama = produk/topik,
 *    klausa lain = keunggulan, daftar (menu, syarat, isi paket, fitur), ajakan, atau info.
 * 3. Jenis video dinilai dengan pencocokan kata utuh (bukan potongan kata — "acara" tidak lagi terbaca "cara",
 *    "video" tidak terbaca "ide", "kembali" tidak terbaca "Bali") ditambah bobot posisi & sinyal struktur.
 * 4. Scene disusun dari isi prompt; bila prompt tidak menyebut detail, diisi bank pengetahuan (tips, kesalahan,
 *    manfaat, langkah, fakta populer, tempat wisata, kutipan per tema, ucapan per hari besar). Teks contoh
 *    bertanda "ganti" hanya muncul untuk hal yang memang tidak boleh dikarang (fakta/topik tak dikenal, ulasan,
 *    syarat lowongan, tanggal acara yang belum disebut).
 * 5. Jenis usaha (kuliner, jasa, kelas, sewa, properti, kendaraan, travel) menentukan kalimat ajakan & tombol;
 *    isi bank diurutkan menurut kata penting di prompt; scene tambahan (saat jumlah scene dinaikkan) diambil
 *    dari isi prompt, langkah "cara order/daftar", dan ajakan ringan sebelum memakai teks contoh.
 * 100% lokal, tanpa API AI.
 */

/* ------------------------------------------------------------------ */
/* Label & kategori                                                     */
/* ------------------------------------------------------------------ */
const CATEGORY_OF: Record<Intent, Category> = {
  'promo-produk': 'promo',
  'flash-sale': 'promo',
  'menu-kuliner': 'promo',
  launching: 'promo',
  event: 'promo',
  testimoni: 'promo',
  'before-after': 'promo',
  tips: 'edukasi',
  tutorial: 'edukasi',
  fakta: 'edukasi',
  lowongan: 'edukasi',
  pengumuman: 'edukasi',
  travel: 'edukasi',
  cerita: 'quote',
  'quote-motivasi': 'quote',
  'quote-galau': 'quote',
  ucapan: 'quote',
};

export const INTENT_LABELS: Record<Intent, string> = {
  'promo-produk': 'Promo Produk',
  'flash-sale': 'Flash Sale',
  'menu-kuliner': 'Menu Kuliner',
  launching: 'Launching',
  event: 'Event / Acara',
  tips: 'Tips & Trik',
  tutorial: 'Tutorial Langkah',
  fakta: 'Fakta Unik',
  'quote-motivasi': 'Quote Motivasi',
  'quote-galau': 'Quote Galau',
  testimoni: 'Testimoni',
  'before-after': 'Before–After',
  lowongan: 'Lowongan Kerja',
  pengumuman: 'Pengumuman',
  ucapan: 'Ucapan / Hari Besar',
  travel: 'Travel & Wisata',
  cerita: 'Storytelling',
};

/* ------------------------------------------------------------------ */
/* Training admin: kalimat tambahan masuk ke bank                       */
/* ------------------------------------------------------------------ */
export function registerHook(category: string, text: string) {
  const key = category === 'quote' ? 'cerita' : category === 'edukasi' ? 'tips' : 'promo';
  (HOOKS[key] = HOOKS[key] || []).unshift(text);
}
export function unregisterHook(category: string, text: string) {
  const key = category === 'quote' ? 'cerita' : category === 'edukasi' ? 'tips' : 'promo';
  const index = (HOOKS[key] || []).indexOf(text);
  if (index >= 0) HOOKS[key].splice(index, 1);
}
export function registerCta(category: string, text: string) {
  const key = category === 'quote' ? 'quote' : category === 'edukasi' ? 'edukasi' : 'promo';
  (CTAS[key] = CTAS[key] || []).unshift(text);
}
export function unregisterCta(category: string, text: string) {
  const key = category === 'quote' ? 'quote' : category === 'edukasi' ? 'edukasi' : 'promo';
  const index = (CTAS[key] || []).indexOf(text);
  if (index >= 0) CTAS[key].splice(index, 1);
}
export function registerQuote(text: string, galau = false) {
  QUOTES[galau ? 'galau' : 'motivasi'].unshift(text);
}
export function unregisterQuote(text: string, galau = false) {
  const bank = QUOTES[galau ? 'galau' : 'motivasi'];
  const index = bank.indexOf(text);
  if (index >= 0) bank.splice(index, 1);
}

/* ------------------------------------------------------------------ */
/* Utilitas teks                                                        */
/* ------------------------------------------------------------------ */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WORD_RE = new Map<string, RegExp>();
/** Cocokkan kata utuh (boleh berakhiran -nya/-kan/-an/-lah/-ku/-mu) di teks huruf kecil. */
function wordAt(low: string, w: string): number {
  let re = WORD_RE.get(w);
  if (!re) {
    re = new RegExp(`(?:^|[^a-z0-9])${esc(w)}(?:nya|kan|an|in|lah|kah|ku|mu)?(?=[^a-z0-9]|$)`);
    WORD_RE.set(w, re);
  }
  const m = re.exec(low);
  return m ? m.index + (m[0].length - m[0].replace(/^[^a-z0-9]/, '').length) : -1;
}
const hasWord = (low: string, w: string) => wordAt(low, w) >= 0;
const hasAny = (low: string, ws: string[]) => ws.some((w) => hasWord(low, w));

/** Pilihan acak yang stabil per seed (hash bilangan bulat — sebaran merata, jadi "Acak kalimat" benar-benar berganti). */
function seeded(seed: number, n: number) {
  let x = (Math.floor(seed) | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) % Math.max(1, n);
}

const ACRONYMS = new Set(
  'po cod umkm cv ats ac tk smp sma smk hrd wa ig bpom umr ump bpjs hp pc led wib wita wit ktp kpr dp ps4 ps5 ui ux seo ai api qris atm b2b diy mua faq ceo cs vip vvip fyp mpasi pns cpns bumn s1 s2 s3 d3 pt gpu cpu ram ssd hdd usb gtа gta fifa nba nft ssr rt rw tni polri dki ntt ntb jabodetabek ri bsd ppn pph ojk bi bca bri bni btn kfc mcd ptn umptn snbt utbk ipk sks lpg unpad ugm itb its unair undip uny uns ipb uin unj unesa upi umy ums binus bsi ojk lcd oled hdmi pdam pln bpkb stnk sim'.split(' ')
);
const SMALL_WORDS = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang', 'atau', 'dengan', 'per', '&', 'x', 'vs', 'buat', 'sampai', 'pada', 'oleh', 'tanpa', 'ala', 'ini', 'itu', 'si', 'sang', 'dalam', 'tentang', 'bagi', 'agar', 'supaya', 'sebagai', 'hingga', 'serta', 'karena', 'terhadap']);
/** Nama tempat yang juga kata biasa ("batu", "solo", "malang") hanya dikapitalkan bila jelas nama tempat. */
const AMBIG_PLACE = new Set(['batu', 'solo', 'malang', 'palu', 'medan', 'padang', 'tegal', 'kudus']);
function isPlaceWord(core: string, prev?: string): boolean {
  if (core.length < 3 || !PLACE_RE.test(core)) return false;
  if (!AMBIG_PLACE.has(core)) return true;
  return !!prev && /^(di|ke|dari|kota|area|wilayah|sekitar|seluruh|daerah|bakso|soto|nasi|rendang|asal|khas|wisata|liburan)$/i.test(prev);
}
/** Penulisan merek yang benar (tiktok → TikTok). */
const BRAND_CASE: Record<string, string> = {
  tiktok: 'TikTok', youtube: 'YouTube', whatsapp: 'WhatsApp', iphone: 'iPhone', ipad: 'iPad', imac: 'iMac', macbook: 'MacBook', airpods: 'AirPods',
  linkedin: 'LinkedIn', github: 'GitHub', capcut: 'CapCut', chatgpt: 'ChatGPT', gofood: 'GoFood', grabfood: 'GrabFood', shopeefood: 'ShopeeFood',
  gopay: 'GoPay', shopeepay: 'ShopeePay', paypal: 'PayPal', playstation: 'PlayStation', nextjs: 'Next.js', javascript: 'JavaScript', typescript: 'TypeScript',
  wordpress: 'WordPress', powerpoint: 'PowerPoint', photoshop: 'Photoshop', ovo: 'OVO', tokopedia: 'Tokopedia', shopee: 'Shopee', lazada: 'Lazada',
  gojek: 'Gojek', gosend: 'GoSend', grab: 'Grab', wifi: 'WiFi', youtuber: 'YouTuber', tiktoker: 'TikToker', ecommerce: 'e-commerce',
  canva: 'Canva', instagram: 'Instagram', facebook: 'Facebook', google: 'Google', vercel: 'Vercel', zoom: 'Zoom', netflix: 'Netflix', spotify: 'Spotify',
};
/** Rapikan kata per kata di teks jadi: merek & singkatan (tanpa menyentuh email, link, @akun, angka). */
function polish(s0: string): string {
  const s = s0.replace(/\bgen\s?z\b/gi, 'Gen Z').replace(/\bmilenial\b/g, 'milenial');
  return s.replace(/[A-Za-z][A-Za-z0-9.'-]*/g, (w, at: number) => {
    const prev = s.charAt(at - 1);
    if (prev === '@' || prev === '/' || prev === '.' || /[@/]/.test(w) || /\.[a-z]{2,}$/i.test(w)) return w;
    const core = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    const brand = BRAND_CASE[core];
    if (brand && w.replace(/[.'-]+$/, '').length === core.length) return brand + w.slice(core.length);
    if (core.length > 1 && ACRONYMS.has(core) && w === w.toLowerCase() && /^[a-z0-9]+$/.test(w)) return w.toUpperCase();
    if (w === w.toLowerCase() && /^[a-z]+$/.test(w)) {
      const prevWord = /([A-Za-z]+)\s+$/.exec(s.slice(0, at))?.[1];
      if (isPlaceWord(core, prevWord)) return w.charAt(0).toUpperCase() + w.slice(1);
    }
    return w;
  });
}

function caseWord(w: string, i: number, allCaps: boolean): string {
  const core = w.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (core && ACRONYMS.has(core)) return w.toUpperCase();
  if (BRAND_CASE[core] && /^[A-Za-z0-9]+$/.test(w)) return BRAND_CASE[core];
  const unitW = /^(\d+(?:[.,]\d+)?)(gb|tb|mb|mah|ml|kg|gr|cm|mm|inch|w)$/i.exec(w);
  if (unitW) return `${unitW[1]}${{ gb: 'GB', tb: 'TB', mb: 'MB', mah: 'mAh' }[unitW[2].toLowerCase()] || unitW[2].toLowerCase()}`;
  const shouty = w.length > 3 && w === w.toUpperCase() && /[A-Z]{4}/.test(w);
  if (!allCaps && !shouty && /[A-Z]/.test(w.slice(1))) return w; // iPhone, PlayStation, GoFood, PS5
  if (i > 0 && SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
  const lw = w.toLowerCase();
  return lw.charAt(0).toUpperCase() + lw.slice(1);
}
/** Judul: tiap kata huruf besar di depan, singkatan tetap kapital, merek seperti iPhone tetap. */
function titleCase(s: string, allCaps = false): string {
  let i = 0;
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => caseWord(w, i++, allCaps))
    .join(' ');
}
/** Kalimat: huruf besar di depan saja, singkatan dibetulkan (cod → COD). */
function sentenceCase(s: string, allCaps = false): string {
  let t = s.replace(/\s+/g, ' ').trim();
  if (allCaps) t = t.toLowerCase();
  const ws = t.split(' ');
  t = ws
    .map((w, i) => {
      const core = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (core.length > 1 && ACRONYMS.has(core)) return w.toUpperCase();
      if (isPlaceWord(core, ws[i - 1])) return w.charAt(0).toUpperCase() + w.slice(1);
      return w;
    })
    .join(' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const dash = (s: string) => s.replace(/(\d)\s*-\s*(\d)/g, '$1–$2');
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const uniq = <T,>(a: T[]) => Array.from(new Set(a));
function dedupeLines(a: string[]): string[] {
  const out: string[] = [];
  for (const x of a) {
    const k = x.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!k) continue;
    if (out.some((y) => {
      const ky = y.toLowerCase().replace(/[^a-z0-9]/g, '');
      return ky === k || ky.includes(k) || k.includes(ky);
    }))
      continue;
    out.push(x);
  }
  return out;
}

const STOP = new Set(
  'yang dan di ke dari untuk dengan ini itu buat bikin video konten tiktok reels shorts instagram ig tolong mau ingin dong ya aku saya kami kita kamu nya pada atau juga jadi agar supaya biar lebih paling sangat banget aja saja cuma hanya ada adalah akan sudah lagi bisa dalam tentang soal sebuah satu para promo diskon harga murah tips cara rp ribu rb jt juta semua sih kok deh nih tuh gak nggak ga tidak bukan the and of for'.split(
    ' '
  )
);

/* ------------------------------------------------------------------ */
/* Ekstraksi entitas                                                    */
/* ------------------------------------------------------------------ */
type MoneyRole = 'price' | 'old' | 'discount' | 'prize' | 'salary' | 'budget' | 'min' | 'shipping' | 'ticket';
interface Money {
  value: number;
  /** batas atas untuk rentang ("5-7jt") */
  max?: number;
  role: MoneyRole;
  start: number;
  end: number;
  unit?: string;
  from?: boolean;
  nego?: boolean;
  bundle?: string;
}
interface Contact {
  wa?: string;
  phone?: string;
  email?: string;
  handle?: string;
  handleNet?: 'ig' | 'tiktok' | 'x' | 'yt';
  url?: string;
  bio?: boolean;
  dm?: boolean;
  shop?: string;
  food?: string;
  /** Play Store / App Store */
  app?: string;
}
interface Entities {
  money: Money[];
  contact: Contact;
  discount?: string;
  discountUpTo?: boolean;
  dates: Array<{ text: string; deadline: boolean; start: number }>;
  times: string[];
  schedule: string[];
  rel: string[];
  location?: string;
  online?: string;
  venue?: string;
  area?: string;
  store?: string;
  rating?: string;
  reviews?: number;
  sold?: number;
  campaign?: string;
  hijriYear?: string;
  year?: string;
  /** pembicara/pengisi acara ("bersama Ustadz Ahmad", "bareng @rina") */
  speaker?: string;
  /** keterangan waktu non-jam ("ba'da Isya") */
  timeNote?: string;
  /** preposisi asal nama toko ("di X" / "oleh X") */
  storeVia?: string;
}

const MONTHS: Record<string, string> = {
  januari: 'Januari', jan: 'Januari', februari: 'Februari', feb: 'Februari', maret: 'Maret', mar: 'Maret', april: 'April', apr: 'April', mei: 'Mei',
  juni: 'Juni', jun: 'Juni', juli: 'Juli', jul: 'Juli', agustus: 'Agustus', agu: 'Agustus', agt: 'Agustus', agus: 'Agustus', ags: 'Agustus',
  september: 'September', sep: 'September', sept: 'September', oktober: 'Oktober', okt: 'Oktober', november: 'November', nov: 'November', desember: 'Desember', des: 'Desember',
};
const MONTH_ALT = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const DAY_ALT = "senin|selasa|rabu|kamis|jum'?at|sabtu|minggu|ahad";
const capDay = (d: string) => {
  const x = d.toLowerCase().replace("'", '');
  return x.charAt(0).toUpperCase() + x.slice(1);
};
const fmtTime = (t: string, part?: string) => {
  const m = /^(\d{1,2})(?:[.:](\d{2}))?$/.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]);
  const p = (part || '').toLowerCase();
  // "jam 3 sore" = 15.00, "jam 9 malam" = 21.00, "jam 1 siang" = 13.00, "jam 12 malam" = 00.00
  if (p === 'sore' && h < 12) h += 12;
  else if (p === 'siang' && h >= 1 && h <= 4) h += 12;
  else if (p === 'malam' && h >= 5 && h < 12) h += 12;
  else if (p === 'malam' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}.${m[2] || '00'}`;
};
const PART = '(?:\\s*(pagi|siang|sore|malam))?';

const PLACE_NAMES =
  'jakarta|jaksel|jakbar|jaktim|jakut|jakpus|bekasi|bogor|depok|tangerang|tangsel|bandung|cimahi|sumedang|garut|tasik|tasikmalaya|cirebon|sukabumi|karawang|purwakarta|semarang|solo|surakarta|jogja|yogya|yogyakarta|sleman|bantul|magelang|klaten|purwokerto|tegal|pekalongan|kudus|jepara|surabaya|sidoarjo|gresik|malang|batu|kediri|madiun|jember|banyuwangi|probolinggo|pasuruan|mojokerto|blitar|denpasar|bali|ubud|lombok|mataram|kupang|labuan bajo|makassar|manado|palu|kendari|balikpapan|samarinda|pontianak|banjarmasin|palangkaraya|medan|binjai|pematangsiantar|padang|bukittinggi|pekanbaru|batam|jambi|palembang|bengkulu|lampung|bandar lampung|aceh|banda aceh|ambon|jayapura|sorong|indonesia|jabodetabek|jawa|sumatera|kalimantan|sulawesi|papua';
const PLACE_RE = new RegExp(`^(?:${PLACE_NAMES})$`, 'i');

const QTY_AFTER =
  /^\s*(?:x\b|kali\b|kg\b|kilo|gr\b|gram|ons|ml\b|liter|ltr|cm\b|mm\b|m\b|meter|km\b|mah|gb\b|tb\b|mb\b|inch|inci|"|pcs|pc\b|buah|biji|box|porsi|orang|org\b|anak|peserta|tahun|thn|th\b|bulan|bln|hari|hr\b|jam|menit|mnt|detik|minggu|malam|lantai|kamar|unit|level|lvl|varian|rasa|ukuran|size|ulasan|review|terjual|sold|pembeli|pelanggan|follower|pengikut|views|penonton|subscriber|tenant|kursi|slot|kuota|halaman|lembar|langkah|tips|cara|fakta|hal\b|ide\b|tempat|menu|item|produk|warna|model|seri|edisi|wib|wita|wit|am\b|pm\b|h\b|m\b|cc\b|watt|w\b|v\b|volt|hp\b|ekor|pasang|set\b|lusin|kodi|tahap|step|bab|episode|eps|season|sks|semester)/i;
const QTY_BEFORE = /(?:jam|pukul|pkl|tahun|thn|th|tgl|tanggal|ke-|no\.?|nomor|versi|ver|v|size|ukuran|level|lantai|kamar|rt|rw|blok|gang|gg|kode|tipe|type|seri|series|gen|generasi|nomer|angka|rating|bintang|kelas|semester|umur|usia|max|maks|maksimal|minimal|min|top|edisi|episode|season|vol|chapter|bab)\.?\s*$/i;
const MONEY_BEFORE = /(?:harga|seharga|cuma|cuman|hanya|mulai|bayar|htm|tiket|biaya|ongkir|budget|modal|gaji|dp|diskon|potongan|hemat|cashback|hadiah|total|senilai|sebesar|dari|jadi|normal|rp\.?|idr)\s*$/i;
const COUNT_AFTER = /^\s*\+?\s*(?:ulasan|review|terjual|sold|pembeli|pelanggan|follower|followers|pengikut|views|penonton|subscriber|orang)/i;

function parseNum(raw: string): number {
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''));
  return Number(raw.replace(',', '.'));
}

export function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) {
    const m = n / 1_000_000_000;
    return `Rp ${Number.isInteger(m) ? m : m.toFixed(1).replace('.', ',')} M`;
  }
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')} jt`;
  }
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}
/** "Rp 5–7 jt", "Rp 100.000–150.000" */
function formatMoney(m: { value: number; max?: number }): string {
  if (!m.max) return formatRupiah(m.value);
  if (m.value >= 1_000_000 && m.max >= 1_000_000) return `${formatRupiah(m.value).replace(/\s*jt$/, '')}–${formatRupiah(m.max).replace(/^Rp\s*/, '')}`;
  return `${formatRupiah(m.value)}–${formatRupiah(m.max).replace(/^Rp\s*/, '')}`;
}
function shortMoney(n: number): string {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')}jt`;
  }
  if (n >= 1000) return `${Math.round(n / 100) / 10}rb`.replace('.', ',');
  return String(n);
}

const UNIT_MAP: Record<string, string> = { kilo: 'kg', bln: 'bulan', org: 'orang', thn: 'tahun', ltr: 'liter', pc: 'pcs', pax: 'orang', hr: 'hari' };

/** Semua angka rupiah beserta perannya. Kontak/persen/tanggal sudah ditutup di `t`. */
function findMoney(t0: string): Money[] {
  const out: Money[] = [];
  // rentang "5-7jt", "100-150rb": ambil batas bawah & atas, satuan dari angka kedua
  let t = t0;
  const ranges: Money[] = [];
  t = t.replace(/(rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:-|–|s\.?d\.?|sampai)\s*(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)(?![a-z0-9])/gi, (all, _rp, a, b, u, off: number) => {
    const mul = /^(rb|ribu|k)$/i.test(u) ? 1000 : 1_000_000;
    const lo = parseNum(a) * mul;
    const hi = parseNum(b) * mul;
    if (!(lo > 0 && hi > lo)) return all;
    const B = t0.slice(Math.max(0, off - 32), off).toLowerCase().replace(/\s+$/, '');
    const role: MoneyRole = /(gaji|upah|honor|fee|komisi|salary|thp)\s*(pokok)?$/.test(B) ? 'salary' : /(budget|bujet|modal|anggaran)\s*$/.test(B) ? 'budget' : 'price';
    ranges.push({ value: lo, max: hi, role, start: off, end: off + all.length, from: role === 'price' });
    return ' '.repeat(all.length);
  });
  out.push(...ranges);
  const re = /(rp\.?|idr)?\s*(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(rb|ribu|rbu|k|jt|juta|m|miliar|milyar)?(?![a-z0-9])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const cur = !!m[1];
    let unit = (m[3] || '').toLowerCase();
    const num = m[2];
    const start = m.index + (m[0].length - m[0].replace(/^\s+/, '').length);
    const end = m.index + m[0].length;
    const after = t.slice(end, end + 32);
    const before = t.slice(Math.max(0, start - 32), start);
    if (/^\s*%/.test(after)) continue;
    if (unit === 'm' && !cur && !/harga|rp/i.test(before)) continue;
    if (!cur && !unit) {
      if (/^(19|20)\d{2}$/.test(num)) continue; // tahun
      if (/^1[34]\d{2}$/.test(num) && /^\s*h\b/i.test(after)) continue; // tahun hijriah
      if (QTY_AFTER.test(after) || QTY_BEFORE.test(before)) continue;
      if (!/[.,]\d{3}$/.test(num) && !MONEY_BEFORE.test(before)) continue; // angka polos yang ambigu
    } else if (COUNT_AFTER.test(after)) continue; // "5rb followers" = jumlah, bukan uang
    if (/(?:\bkm|kilometer|odo|odometer|jarak tempuh|mileage|kapasitas|isi)\s*:?\s*$/i.test(before) && !cur) continue;
    let value = parseNum(num);
    if (unit === 'rb' || unit === 'ribu' || unit === 'rbu' || unit === 'k') value *= 1000;
    else if (unit === 'jt' || unit === 'juta') value *= 1_000_000;
    else if (unit === 'm' || unit === 'miliar' || unit === 'milyar') value *= 1_000_000_000;
    if (!Number.isFinite(value) || value < 100 || value > 1e12) continue;
    if (value < 1000 && !cur) continue;

    const B = before.toLowerCase().replace(/\s+$/, '');
    let role: MoneyRole = 'price';
    if (/(diskon|potongan|potong|hemat|cashback|voucher|kupon)\s*(s\.?d\.?|sampai|hingga|up to|upto|sebesar)?\s*(rp\.?)?$/.test(B) && !/paket\s+hemat\s*(rp\.?)?$/.test(B)) role = 'discount';
    else if (/(hadiah|juara \d|total hadiah|hadiah total|uang tunai|uang pembinaan|bonus)\s*(total|utama|senilai|sebesar|jutaan)?\s*(rp\.?)?$/.test(B)) role = 'prize';
    else if (/(gaji|upah|honor|fee|komisi|insentif|salary|thp)\s*(pokok|mulai|sampai|hingga|s\.?d\.?|sebesar)?\s*(rp\.?)?$/.test(B)) role = 'salary';
    else if (/(budget|bujet|modal|anggaran|dana|biaya hidup)\s*(cuma|hanya|mulai|sekitar|±)?\s*(rp\.?)?$/.test(B)) role = 'budget';
    else if (/(min(imal|\.)?\s*(belanja|order|pembelian|beli|transaksi|pembayaran))\s*(rp\.?)?$/.test(B)) role = 'min';
    else if (/(ongkir|ongkos kirim)\s*(cuma|hanya|mulai|flat)?\s*(rp\.?)?$/.test(B)) role = 'shipping';
    else if (/(htm|tiket|ticket|biaya pendaftaran|biaya daftar|pendaftaran|registrasi|kontribusi|investasi)\s*(cuma|hanya|mulai|:)?\s*(rp\.?)?$/.test(B)) role = 'ticket';
    else if (/(harga normal|normal|sebelumnya|semula|biasanya|biasa|coret|harga asli|dari)\s*(rp\.?)?$/.test(B)) role = 'old';
    else if (/^\s*(jadi|menjadi|->|→|=>)\s*(rp\.?)?\s*\d/i.test(after)) role = 'old';

    const unitM = /^\s*(?:\/|per\s+)\s*(\d+\s*)?(kg|kilo|gram|gr|ons|liter|ltr|botol|pcs|pc|buah|porsi|box|pack|paket|orang|org|pax|malam|hari|hr|minggu|bulan|bln|tahun|thn|jam|menit|sesi|pertemuan|kelas|meter|lembar|lusin|kodi|item|cup|gelas|potong|ekor|biji|kali|unit|bungkus|toples|pouch|set|pasang|m2|video|foto|desain|design|halaman|slide|lagu|kamar|tiket|kursi|kepala|anak|siswa|peserta|batang|ikat|karung|sak|dus|karton|rim|roll|tabung|galon|kilogram)\b/i.exec(after);
    const approx = /^-?an\b/i.test(after);
    const unitTxt = unitM ? `/${unitM[1] ? `${unitM[1].trim()} ` : ''}${UNIT_MAP[unitM[2].toLowerCase()] || unitM[2].toLowerCase()}` : approx ? '-an' : undefined;
    const bundleM = /^\s*(?:dapat|dpt|isi)\s+(\d+)\s*(pcs|buah|biji|box|pack|item|botol|porsi)?/i.exec(after);
    out.push({
      value,
      role,
      start,
      end,
      unit: unitTxt,
      from: /(mulai|mulai dari|start|start from|from|cuma mulai)\s*(rp\.?)?$/.test(B),
      nego: /^\s*(?:\/\S+\s*)?(nego|bisa nego)/i.test(after),
      bundle: bundleM ? `dapat ${bundleM[1]}${bundleM[2] ? ` ${bundleM[2]}` : ''}` : undefined,
    });
    if (!unit && re.lastIndex <= end) re.lastIndex = end;
  }
  // "dari X" hanya harga coret bila memang ada harga lain
  if (!out.some((x) => x.role === 'price')) out.forEach((x) => x.role === 'old' && (x.role = 'price'));
  return out;
}

/** Tutup bagian teks (diganti spasi, panjang tetap) supaya tidak terbaca ulang. */
function blank(t: string, s: number, e: number) {
  return t.slice(0, s) + ' '.repeat(Math.max(0, e - s)) + t.slice(e);
}

function extract(text: string): { e: Entities; masked: string } {
  let t = text;
  const e: Entities = { money: [], contact: {}, dates: [], times: [], schedule: [], rel: [] };
  const mask = (re: RegExp, fn?: (m: RegExpExecArray) => void) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const hits: Array<[number, number]> = [];
    while ((m = re.exec(t))) {
      fn?.(m);
      hits.push([m.index, m.index + m[0].length]);
      if (m[0].length === 0) re.lastIndex++;
    }
    for (const [s, en] of hits) t = blank(t, s, en);
  };
  const low = text.toLowerCase();
  const c = e.contact;

  // --- kontak ---
  mask(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, (m) => (c.email = c.email || m[0]));
  mask(/\b(?:https?:\/\/[^\s,]+|(?:www\.)?[a-z0-9][a-z0-9-]*\.(?:com|id|co\.id|my\.id|biz\.id|web\.id|ac\.id|net|org|shop|store|link|me|xyz|io|app|site|online|ly|ee)(?:\/[^\s,]*)?)/gi, (m) => (c.url = c.url || m[0].replace(/[.)]+$/, '')));
  mask(/(?:\+?62[\s.-]?|\b0)8\d{1,3}(?:[\s.-]?\d{2,5}){2,3}/g, (m) => {
    const digits = m[0].replace(/\D/g, '').replace(/^62/, '0');
    if (digits.length < 10 || digits.length > 13) return;
    const fmt = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    const before = low.slice(Math.max(0, m.index - 16), m.index);
    if (/(wa|whatsapp|whatsap|watsap|wasap|chat)\W*$|wa\.me/.test(before) || /\b(wa|whatsapp)\b/.test(low)) c.wa = c.wa || fmt;
    else c.phone = c.phone || fmt;
  });
  mask(/(^|[^A-Za-z0-9_.@])@([A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?)/g, (m) => {
    if (c.handle) return;
    c.handle = `@${m[2]}`;
    const before = low.slice(Math.max(0, m.index - 14), m.index + 1);
    c.handleNet = /tiktok|\btt\b/.test(before) ? 'tiktok' : /twitter|\bx\b/.test(before) ? 'x' : /youtube|\byt\b/.test(before) ? 'yt' : 'ig';
  });
  if (/link (?:di|in) bio/.test(low)) c.bio = true;
  if (/\bdm\b/.test(low)) c.dm = true;
  const shopM = /\b(shopee|tokopedia|tokped|lazada|blibli|tiktok shop|bukalapak)\b/.exec(low);
  if (shopM) c.shop = shopM[1] === 'tokped' ? 'Tokopedia' : titleCase(shopM[1]);
  const foodM = /\b(gofood|go-food|grabfood|grab food|shopeefood|shopee food)\b/.exec(low);
  if (foodM) c.food = /go/.test(foodM[1]) ? 'GoFood' : /grab/.test(foodM[1]) ? 'GrabFood' : 'ShopeeFood';
  const appM = /\b(play ?store|google play|app ?store|appgallery)\b/.exec(low);
  if (appM) {
    c.app = /play/.test(appM[1]) ? 'Play Store' : /gallery/.test(appM[1]) ? 'AppGallery' : 'App Store';
    mask(/\b(?:(?:download|unduh|install|instal)\s+)?(?:(?:di|lewat|via|dari)\s+)?(?:play ?store|google play|app ?store|appgallery)\b/gi);
  }
  const spk = /\b(?:bersama|bareng|with|ft\.?|feat\.?|narasumber|pembicara|pemateri|speaker|mentor|host|dipandu|dibawakan oleh|diisi oleh)\s*:?\s*((?:@[\w.]+)|(?:(?:Kak|Bang|Mas|Mbak|Pak|Bu|Ibu|Bapak|Ustadz|Ustaz|Ustadzah|Ust\.?|Dr\.?|Prof\.?|Coach|Habib|Kyai|KH\.?|Gus|Ning|dr\.)\s+)?[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){0,3})/.exec(text);
  if (spk) e.speaker = spk[1].replace(/[.,]$/, '');

  // --- kampanye tanggal kembar (11.11, 12.12) ---
  mask(/\b(\d{1,2})\.(\1)\b/g, (m) => (Number(m[1]) <= 12 ? (e.campaign = e.campaign || `${m[1]}.${m[1]}`) : undefined));

  // --- diskon ---
  mask(/(?:beli|buy)\s*(\d+)\s*(?:gratis|free|get|dapat gratis|dapet gratis)\s*(\d+)/gi, (m) => (e.discount = e.discount || `B${m[1]}G${m[2]}`));
  mask(/\bb(\d)g(\d)\b/gi, (m) => (e.discount = e.discount || `B${m[1]}G${m[2]}`));
  const pcts: Array<{ v: number; upto: boolean; ctx: boolean }> = [];
  {
    // persen non-diskon (untung 40%, naik 10%, DP 30%) dibiarkan di teks agar tetap terbaca sebagai keterangan
    const pctRe = /(^|[^\d.,])(\d{1,2}(?:[.,]\d)?)\s*%/g;
    let pm: RegExpExecArray | null;
    while ((pm = pctRe.exec(t))) {
      const before = text.slice(Math.max(0, pm.index - 20), pm.index + pm[1].length).toLowerCase();
      if (/(naik|kenaikan|meningkat|bertambah|tumbuh|inflasi|pajak|ppn|bunga|komisi|profit|untung|margin|dp|uang muka|royalti|bagi hasil|tingkat|akurasi|baterai|batre|kadar|kandungan)\s*(sebesar|hingga|sampai|s\.?d\.?|cuma|hanya|min(imal)?|mulai)?\s*$/.test(before))
        t = t.slice(0, pm.index + pm[1].length) + pm[0].slice(pm[1].length).replace(/%/, '\u0003') + t.slice(pm.index + pm[0].length);
    }
  }
  mask(/(^|[^\d.,])(\d{1,2}(?:[.,]\d)?)\s*%/g, (m) => {
    const endIdx = m.index + m[0].length;
    const after = text.slice(endIdx, endIdx + 24);
    if (/^\s*(original|ori\b|asli|murni|halal|katun|cotton|polyester|uang kembali|garansi|kepuasan|aman|natural|alami|organik)/i.test(after)) return;
    const before = text.slice(Math.max(0, m.index - 20), m.index + m[1].length).toLowerCase();
    pcts.push({ v: Number(m[2].replace(',', '.')), upto: /(s\.?d\.?|sampai|hingga|up ?to|upto|max(imal)?)\s*$/.test(before), ctx: /(diskon|potongan|off|hemat|cashback|sale|promo)/.test(before) });
  });
  if (pcts.length && !e.discount) {
    const best = pcts.find((p) => p.ctx) || pcts.reduce((a, b) => (b.v > a.v ? b : a));
    e.discount = `${String(best.v).replace('.', ',')}%`;
    e.discountUpTo = best.upto;
  }

  // --- tanggal, jam, jadwal ---
  mask(new RegExp(`(?:\\b(${DAY_ALT}),?\\s*)?\\b(\\d{1,2})(?:\\s*-\\s*(\\d{1,2}))?\\s+(${MONTH_ALT})\\b\\.?(?:\\s+(\\d{4}))?`, 'gi'), (m) => {
    const before = text.slice(Math.max(0, m.index - 24), m.index).toLowerCase();
    const txt = `${m[1] ? `${capDay(m[1])}, ` : ''}${m[2]}${m[3] ? `–${m[3]}` : ''} ${MONTHS[m[4].toLowerCase()]}${m[5] ? ` ${m[5]}` : ''}`;
    e.dates.push({ text: txt, deadline: /(sebelum|paling lambat|maks(imal)?|batas|deadline|hingga|sampai|s\.?d\.?|berlaku)\s*(tanggal|tgl)?\s*$/.test(before), start: m.index });
  });
  mask(new RegExp(`\\b(${MONTH_ALT})\\s+(\\d{4})\\b`, 'gi'), (m) => e.dates.push({ text: `${MONTHS[m[1].toLowerCase()]} ${m[2]}`, deadline: false, start: m.index }));
  mask(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, (m) => {
    if (m[1] === '24' && m[2] === '7') return;
    if (Number(m[1]) <= 31 && Number(m[2]) <= 12) e.dates.push({ text: m[0], deadline: false, start: m.index });
  });
  mask(/\b(?:tgl\.?|tanggal)\s*(\d{1,2}(?:\s*-\s*\d{1,2})?)\b(?!\s*(?:%|rb|jt))/gi, (m) => e.dates.push({ text: `Tanggal ${dash(m[1])}`, deadline: false, start: m.index }));
  // jadwal: Senin-Jumat 08.00-17.00
  mask(new RegExp(`\\b(${DAY_ALT})\\s*-\\s*(${DAY_ALT})\\b\\s*:?\\s*(?:(?:jam|pukul)\\s*)?(\\d{1,2}[.:]\\d{2})?\\s*(?:-|s\\.?d\\.?|sampai)?\\s*(\\d{1,2}[.:]\\d{2})?`, 'gi'), (m) => {
    e.schedule.push(`${capDay(m[1])}–${capDay(m[2])}${m[3] ? `: ${fmtTime(m[3])}${m[4] ? `–${fmtTime(m[4])}` : ''}` : ''}`);
  });
  mask(new RegExp(`\\b(${DAY_ALT})\\s*:?\\s*(?:(?:jam|pukul)\\s*)?(\\d{1,2}[.:]\\d{2})\\s*(?:-|s\\.?d\\.?|sampai)\\s*(\\d{1,2}[.:]\\d{2})`, 'gi'), (m) => {
    e.schedule.push(`${capDay(m[1])}: ${fmtTime(m[2])}–${fmtTime(m[3])}`);
  });
  mask(new RegExp(`\\bbuka\\s+(?:(?:setiap|tiap)\\s+(?:hari|malam|pagi|sore|siang)\\s+)?(?:dari\\s+)?(?:jam|pukul)\\s*(\\d{1,2}(?:[.:]\\d{2})?)${PART}\\s*(?:-|s\\.?d\\.?|sampai|hingga)\\s*(?:jam\\s*)?(\\d{1,2}(?:[.:]\\d{2})?)${PART}(?:\\s*(wib|wita|wit))?`, 'gi'), (m) => {
    e.schedule.push(`Buka ${fmtTime(m[1], m[2])}–${fmtTime(m[3], m[4])}${m[5] ? ` ${m[5].toUpperCase()}` : ''}`);
  });
  mask(new RegExp(`\\b(?:buka|mulai buka|open)\\s+(?:mulai|dari)\\s+(?:jam|pukul)\\s*(\\d{1,2}(?:[.:]\\d{2})?)${PART}(?:\\s*(wib|wita|wit))?`, 'gi'), (m) => {
    e.schedule.push(`Buka mulai ${fmtTime(m[1], m[2])}${m[3] ? ` ${m[3].toUpperCase()}` : ''}`);
  });
  mask(/\b(?:ba'?da|bakda|setelah|selepas|habis|sesudah)\s+(subuh|shubuh|dzuhur|zuhur|duhur|ashar|asar|maghrib|magrib|isya|isya'|jumatan)\b/gi, (m) => {
    const w = m[1].toLowerCase().replace("'", '');
    const name = /subuh|shubuh/.test(w) ? 'Subuh' : /zuhur|dzuhur|duhur/.test(w) ? 'Zuhur' : /as(h)?ar/.test(w) ? 'Asar' : /ma(g)?h?rib/.test(w) ? 'Magrib' : /isya/.test(w) ? 'Isya' : 'Jumatan';
    e.timeNote = e.timeNote || `Ba'da ${name}`;
  });
  mask(/\bbuka\s+(setiap hari|tiap hari|24 jam|24\/7|non-?stop)\b/gi, (m) => e.schedule.push(`Buka ${m[1].toLowerCase().replace('tiap', 'setiap')}`));
  mask(new RegExp(`\\b(setiap|tiap)\\s+(hari\\s+)?(${DAY_ALT})((?:\\s*(?:&|dan|,)\\s*(?:${DAY_ALT}))*)(\\s+(pagi|siang|sore|malam))?`, 'gi'), (m) => {
    const more = m[4] ? m[4].split(/\s*(?:&|dan|,)\s*/).filter(Boolean).map(capDay) : [];
    e.schedule.push(`Setiap ${[capDay(m[3]), ...more].join(' & ')}${m[6] ? ` ${m[6].toLowerCase()}` : ''}`);
  });
  mask(new RegExp(`\\b(?:jam|pukul|pkl\\.?)\\s*(\\d{1,2}(?:[.:]\\d{2})?)${PART}(?:\\s*(?:-|s\\.?d\\.?|sampai|hingga)\\s*(?:jam\\s*)?(\\d{1,2}(?:[.:]\\d{2})?|selesai)${PART})?\\s*(wib|wita|wit)?\\b`, 'gi'), (m) => {
    e.times.push(`${fmtTime(m[1], m[2])}${m[3] ? `–${m[3].toLowerCase() === 'selesai' ? 'selesai' : fmtTime(m[3], m[4] || m[2])}` : ''}${m[5] ? ` ${m[5].toUpperCase()}` : ''}`);
  });
  mask(/\b(\d{1,2}[.:]\d{2})\s*(?:-|s\.?d\.?|sampai)\s*(\d{1,2}[.:]\d{2})\s*(wib|wita|wit)?/gi, (m) => e.times.push(`${fmtTime(m[1])}–${fmtTime(m[2])}${m[3] ? ` ${m[3].toUpperCase()}` : ''}`));
  mask(/\b(\d{1,2}[.:]\d{2})\s*(wib|wita|wit)\b/gi, (m) => e.times.push(`${fmtTime(m[1])} ${m[2].toUpperCase()}`));
  // hari tunggal (bukan "2 minggu" / "minggu ini")
  {
    const dayRe = new RegExp(`\\b(${DAY_ALT})\\b(?!\\s*(?:ini|depan|lalu|kemarin))`, 'gi');
    let dm0: RegExpExecArray | null;
    const hits: Array<[number, number, string]> = [];
    while ((dm0 = dayRe.exec(t))) {
      const d = dm0[1];
      const before = text.slice(Math.max(0, dm0.index - 12), dm0.index).toLowerCase();
      if (/\d\s*$/.test(before) || /(dalam|selama|beberapa|per|tiap|setiap)\s*$/.test(before)) continue;
      if (d.toLowerCase() === 'minggu' && !/^M/.test(d) && !/hari\s*$/.test(before)) continue; // "minggu" = pekan
      hits.push([dm0.index, dm0.index + d.length, d]);
    }
    for (const [s0, e0, d] of hits) {
      const night = /\bmalam\s*$/i.exec(t.slice(Math.max(0, s0 - 7), s0));
      const s1 = night ? s0 - (t.slice(Math.max(0, s0 - 7), s0).length - night.index) : s0;
      e.dates.push({ text: night ? `Malam ${capDay(d)}` : capDay(d), deadline: false, start: s1 });
      t = blank(t, s1, e0);
    }
  }
  if (/\b(promo|diskon|sale|po|pre.?order|open order|daftar|pendaftaran|lomba|berlaku|potongan|cashback|early bird|voucher|harga spesial)\b/.test(low)) {
    const relDl = /\b(?:berlaku\s+)?(?:sampai|hingga|s\.?d\.?|until|sebelum)\s+(akhir bulan(?: ini)?|akhir tahun(?: ini)?|akhir pekan(?: ini)?|minggu depan|bulan depan|besok|lusa|lebaran|tahun baru|stok habis|persediaan habis)\b/gi;
    let rd: RegExpExecArray | null;
    while ((rd = relDl.exec(t))) {
      if (/\b(biar|agar|supaya|cukup|bertahan|awet|tahan|tetap)\b[^,.;]*$/i.test(text.slice(Math.max(0, rd.index - 30), rd.index))) continue;
      e.dates.push({ text: rd[1].toLowerCase(), deadline: true, start: rd.index });
      t = blank(t, rd.index, rd.index + rd[0].length);
    }
  }
  const relM = /\b(hari ini|malam ini|besok|lusa|minggu ini|minggu depan|bulan ini|bulan depan|akhir pekan ini|akhir pekan|weekend ini|weekend|akhir tahun)\b/i.exec(t);
  if (relM) e.rel.push(relM[1].toLowerCase());
  const hijri = /\b(1[34]\d{2})\s*h\b/i.exec(text);
  if (hijri) e.hijriYear = `${hijri[1]} H`;
  const yr = /\b(20[2-4]\d)\b/.exec(text);
  if (yr) e.year = yr[1];
  t = t.replace(/\b1[34]\d{2}\s*h\b/gi, (s) => ' '.repeat(s.length));

  // --- rating & jumlah ulasan/terjual (hanya bila ditulis eksplisit) ---
  const ratingM = /\brating\s*(\d(?:[.,]\d)?)|\b(\d[.,]\d)\s*(?:\/\s*5|bintang)\b|\bbintang\s*(\d(?:[.,]\d)?)\s*(?:dari|di)\s*\d/i.exec(text);
  if (ratingM) e.rating = (ratingM[1] || ratingM[2] || ratingM[3]).replace(',', '.');
  const revM = /(\d[\d.]*)\s*\+?\s*(rb|ribu|k)?\s*(?:ulasan|review|reviews|penilaian)/i.exec(text);
  if (revM) e.reviews = parseNum(revM[1]) * (revM[2] ? 1000 : 1);
  const soldM = /(?:terjual|sold)\s*(\d[\d.]*)\s*\+?\s*(rb|ribu|k)?|(\d[\d.]*)\s*\+?\s*(rb|ribu|k)?\s*(?:terjual|sold|pembeli)/i.exec(text);
  if (soldM) e.sold = parseNum(soldM[1] || soldM[3]) * ((soldM[2] || soldM[4]) ? 1000 : 1);
  t = t.replace(/\brating\s*\d(?:[.,]\d)?|\b\d[.,]\d\s*(?:\/\s*5|bintang)|(\d[\d.]*)\s*\+?\s*(rb|ribu|k)?\s*(ulasan|review|reviews|penilaian|terjual|sold)|(terjual|sold)\s*\d[\d.]*\s*\+?\s*(rb|ribu|k)?/gi, (s) => ' '.repeat(s.length));

  // --- uang ---
  e.money = findMoney(t);
  for (const mo of e.money) {
    let end = mo.end;
    const tail = /^\s*(?:(?:\/|per\s+)\s*(\d+\s*)?[a-z]+|-?an\b|\s*(?:dapat|dpt|isi)\s+\d+\s*[a-z]*|\s*,?\s*(?:bisa\s+)?nego(?:\s+(?:tipis|santai|halus|sampai deal|aja|ya))?)/i.exec(t.slice(end));
    if (tail && (mo.unit || mo.bundle || mo.nego)) end += tail[0].length;
    t = blank(t, mo.start, end);
  }
  // kata pengantar harga yang sudah yatim
  t = t.replace(/\b(rp\.?|idr)(?=\s|$)/gi, (s) => ' '.repeat(s.length));

  // --- lokasi ---
  const street = /\b(?:[Jj][Ll][Nn]?(?:\.\s*|\s+)(?=[A-Za-z0-9])|[Jj]alan\s+(?=[A-Z0-9]))([A-Za-z0-9][^,;\n]*?)(?=\s*(?:[,;\n]|$|\s(?:gratis|buka|order|hubungi|wa\b|telp|dan\s|untuk|kirim|cek|info|jam|setiap|tiap|harga|mulai|cuma|hanya|disewakan|dijual)\b))/.exec(t);
  if (street) {
    const st = street[1].trim().replace(/\.\s*(?:wa|whatsapp|telp|tlp|hp|hubungi|order|info|dm|cek|buka|harga|promo)\b.*$/i, '').replace(/[.,]$/, '');
    e.location = `Jl. ${/[A-Z]/.test(st) ? st : titleCase(st)}`;
    t = blank(t, street.index, street.index + street[0].length);
    const pre = /\b(?:di|lokasi|alamat)\s*:?\s*$/i.exec(t.slice(0, street.index));
    if (pre) t = blank(t, pre.index, street.index);
  }
  const labeled =
    /\b(alamat|lokasi|tempat|venue|lokasinya|alamatnya)\s*:\s*(?:di\s+)?([^,;\n]+)/i.exec(t) ||
    new RegExp(`\\b(alamat|lokasi|lokasinya|alamatnya)\\s+(?:di\\s+)?((?:${PLACE_NAMES})(?:\\s+(?:${PLACE_NAMES}|kota|utara|selatan|barat|timur|tengah))*|[A-Z][\\w.-]*(?:\\s+[A-Z][\\w.-]*){0,2})\\b`, 'i').exec(t);
  if (labeled && !e.location && !/^(strategis|dekat|bagus|aman|nyaman|premium)$/i.test(labeled[2].trim())) {
    e.location = titleCase(labeled[2].trim());
    t = blank(t, labeled.index, labeled.index + labeled[0].length);
  }
  const online = /\b(?:via|lewat|melalui|di)\s+(zoom|google meet|gmeet|youtube|yt|ig live|instagram live|tiktok live|live tiktok|live ig|discord|ms teams|microsoft teams|teams|grup wa|whatsapp group)\b/i.exec(t);
  if (online) {
    const name = online[1].toLowerCase();
    e.online = `Online via ${name === 'gmeet' ? 'Google Meet' : name === 'yt' ? 'YouTube' : name === 'grup wa' ? 'grup WhatsApp' : titleCase(online[1])}`;
    t = blank(t, online.index, online.index + online[0].length);
  } else if (/\b(online|daring)\b/i.test(t) && /\b(webinar|kelas|seminar|workshop|kajian|kursus|event|acara|meetup)\b/i.test(t)) e.online = 'Online';
  const venue = /\b(?:di|ke|bertempat di)\s+((?:gedung|aula|balai|lapangan|lap\.|taman|alun-alun|masjid|gereja|gor|stadion|mall|mal|kampus|universitas|sekolah|hotel|kolam|pantai|lobby|ballroom|hall|plaza|pendopo)(?:\s+(?!dan\b|untuk\b|jam\b|pukul\b|ada\b|yang\b|gratis\b|bisa\b|tanggal\b)[A-Za-z0-9][\w.'&-]*){0,3})/i.exec(t);
  if (venue) {
    e.venue = titleCase(venue[1].trim().replace(/[.,]$/, ''));
    t = blank(t, venue.index, venue.index + venue[0].length);
  }
  const near = /\b(?:di\s+)?(depan|samping|sebelah|belakang|seberang|dekat|deket)\s+((?:kampus|stasiun|pasar|masjid|sekolah|alun-alun|terminal|mall|mal|kantor|rs|rumah sakit|bandara|pelabuhan|taman|gor|lapangan|indomaret|alfamart|bank|puskesmas|universitas|pabrik|perumahan|gerbang|pintu)\b(?:\s+(?!dan\b|untuk\b|jam\b|buka\b|harga\b|mulai\b|cuma\b)[A-Za-z0-9][\w.'-]*){0,3})/i.exec(t);
  if (near && !e.location && !e.venue) {
    e.location = `${near[1].toLowerCase() === 'deket' ? 'Dekat' : titleCase(near[1])} ${titleCase(near[2].trim().replace(/[.,]$/, ''))}`;
    t = blank(t, near.index, near.index + near[0].length);
  }
  const area = new RegExp(`\\b(area|wilayah|kawasan|daerah|domisili|penempatan|seluruh|sekitar|sekitaran)\\s+((?:${PLACE_NAMES})(?:\\s+(?:${PLACE_NAMES}|raya|utara|selatan|barat|timur|tengah|kota|kabupaten))*|[A-Z][\\w.-]*(?:\\s+[A-Z][\\w.-]*){0,2})`, 'i').exec(t);
  if (area) {
    const kind = area[1].toLowerCase();
    let names = area[2];
    let endA = area.index + area[0].length;
    // "area Depok & Bogor", "area Jaksel, Depok, dan Tangsel"
    const nextPlace = new RegExp(`^\\s*(?:&|dan|,|,\\s*dan)\\s*((?:${PLACE_NAMES})\\b)`, 'i');
    const nextCap = /^\s*(?:&|dan)\s*([A-Z][\w.-]*(?:\s+[A-Z][\w.-]*){0,2})/;
    for (let g = 0; g < 4; g++) {
      const nx = nextPlace.exec(t.slice(endA)) || nextCap.exec(t.slice(endA));
      if (!nx) break;
      names += ` & ${nx[1]}`;
      endA += nx[0].length;
    }
    e.area = `${kind === 'seluruh' ? 'Seluruh' : kind === 'domisili' ? 'Domisili' : kind === 'penempatan' ? 'Penempatan' : kind === 'sekitar' || kind === 'sekitaran' ? 'Sekitar' : 'Area'} ${titleCase(names)}`;
    t = blank(t, area.index, endA);
  }

  // --- toko ---
  const storeKw = /\b(toko|warung|warkop|kedai|kafe|cafe|café|coffee shop|resto|restoran|rumah makan|rm\.?|depot|bakery|barbershop|barber|salon|klinik|apotek|apotik|butik|boutique|outlet|studio|laundry|bengkel|kantin|angkringan|lesehan|pt\.?|cv\.?)\s+((?:[A-Z0-9][\w'&.-]*)(?:\s+(?:[A-Z0-9][\w'&.-]*|&)){0,3})/.exec(t.replace(/\b(Toko|Warung|Warkop|Kedai|Kafe|Cafe|Resto|Restoran|Rumah Makan|Depot|Bakery|Barbershop|Barber|Salon|Klinik|Apotek|Butik|Outlet|Studio|Laundry|Bengkel|Kantin|Angkringan|Lesehan|PT)\b(?=\.?\s+[A-Z0-9])|\bCV\b(?=\.?\s+[A-Z][a-z])/g, (s) => s.toLowerCase()));
  if (storeKw && !/^(kami|kita|ini|itu|saya|aku)$/i.test(storeKw[2])) {
    const kw = storeKw[1].toLowerCase().replace(/\.$/, '');
    e.store = `${kw === 'pt' || kw === 'cv' ? kw.toUpperCase() : titleCase(kw)} ${storeKw[2].trim().replace(/[.,!]$/, '')}`;
    const pre = /\b(?:di|dari|oleh|by)\s*$/i.exec(t.slice(0, storeKw.index));
    t = blank(t, pre ? pre.index : storeKw.index, storeKw.index + storeKw[0].length);
  }
  if (!e.store) {
    const lowerKw = /\b(toko|warung|kedai|kafe|cafe|resto)\s+([a-z]+(?:\s+[a-z]+){0,2})\s*:/.exec(t);
    if (lowerKw && !/^(kami|kita|ini|itu)/.test(lowerKw[2])) {
      e.store = titleCase(`${lowerKw[1]} ${lowerKw[2]}`);
      t = blank(t, lowerKw.index, lowerKw.index + lowerKw[0].length - 1);
    }
  }
  if (!e.store) {
    const hon = /(?:\b([A-Z][a-z]+)\s+)?\b(Pak|Bu|Bude|Pakde|Mak|Mbak|Mba|Mas|Bang|Cak|Om|Tante|Kak|Ibu|Bapak|Uda|Uni|Teh|Koh|Cik|Ci|Ncek|Haji|Hj\.?|Mama|Papa|Oma|Opa|Nenek|Kakek|Mpok|Cici|Bunda|Umi|Abah|Ummi)\s+([A-Z][a-z]+)/.exec(t);
    if (hon) {
      e.store = `${hon[1] ? `${hon[1]} ` : ''}${hon[2]} ${hon[3]}`;
      t = blank(t, hon.index, hon.index + hon[0].length);
    }
  }
  if (!e.store) {
    const app = /\bdi\s+(?:aplikasi|app|website|web|situs|marketplace)\s+([A-Z][\w-]+)(?![\w.]*\.(?:js|ts|py))/.exec(t);
    if (app) {
      e.store = app[1];
      t = blank(t, app.index, app.index + app[0].length);
    }
  }
  // "di/dari X" — tempat terkenal → lokasi, nama lain → toko
  const diRe = /\b(di|dari|by|oleh|ke)\s+([A-Z][\w'&.-]*(?:\s+(?:[A-Z][\w'&.-]*|\d+)){0,3})/g;
  let dm: RegExpExecArray | null;
  const diHits: Array<[number, number, string, string]> = [];
  while ((dm = diRe.exec(t))) diHits.push([dm.index, dm.index + dm[0].length, dm[1].toLowerCase(), dm[2].trim().replace(/[.,!]$/, '')]);
  for (const [s, en, prep, name] of diHits) {
    const first = name.split(/\s+/)[0];
    if (PLACE_RE.test(first) || PLACE_RE.test(name)) {
      if (!e.location && prep !== 'dari') e.location = titleCase(name);
      t = blank(t, s, en);
    } else if (MONTHS[first.toLowerCase()] || new RegExp(`^(${DAY_ALT})$`, 'i').test(first) || /^(Zoom|Instagram|Ig|Tiktok|TikTok|Youtube|YouTube|Whatsapp|WhatsApp|Wa|Shopee|Tokopedia|Google)$/.test(first)) {
      continue;
    } else if (!e.store && (prep === 'di' || prep === 'by' || prep === 'oleh')) {
      e.store = name;
      e.storeVia = prep;
      t = blank(t, s, en);
    }
  }
  return { e, masked: t.replace(/\u0003/g, '%') };
}

/* ------------------------------------------------------------------ */
/* Klausa, produk, daftar                                               */
/* ------------------------------------------------------------------ */
const LEAD_CMD =
  /^\s*(?:(?:aku|saya|gue|gw|kami|kita)\s+(?:mau|ingin|pengen|pingin|lagi|akan|perlu|butuh)\s+)?(?:tolong\s+|minta\s+|coba\s+|mohon\s+)?(?:(?:buat(?:kan|in)?|bikin(?:in|kan)?|generate|create|desain(?:kan)?|ceritain|ceritakan|jelasin|jelaskan|promosiin|promosikan|postingin)\s+)?(?:(?:sebuah|satu)\s+)?(?:(?:video|konten|reels|story|postingan|post|iklan|ads)\s+)?(?:pendek\s+)?(?:(?:edukasi|informasi|promosi)\s+)?(?:(?:tentang|soal|untuk|buat|mengenai)\s+)?/i;
const OFFER_LEAD = /^\s*(?:(?:promo|diskon|potongan|hemat|cashback|sale|flash\s*sale|flashsale|jual|jualan|dijual|disewakan|dikontrakkan|dikontrakan|disewa|ready(?:\s+stock)?|open\s+order|open\s+po|buka\s+po|pre[-\s]?order|po|cuci\s+gudang|clearance|grand\s+launching|soft\s+launching|launching|launch|rilis|peluncuran|grand\s+opening|soft\s+opening|opening|menu(?:\s+baru)?|produk\s+baru|new\s+arrival|restock|terima\s+(?:pesanan|order|jasa)|melayani|info|update|new|hot\s+deal|special|spesial|big\s+sale|mega\s+sale|harbolnas|payday|gajian)\b[\s:!-]*)+/i;
const INTENT_LEAD = /^\s*(?:(?:testimoni|testi|review(?:\s+jujur)?|ulasan|kata\s+pelanggan|pelanggan|before\s*-?\s*after|sebelum\s+(?:dan\s+)?sesudah|lowongan(?:\s+kerja)?|loker|dicari|pengumuman|tentang|soal)\b[\s:]*)+/i;
const PRODUCT_CUT =
  /\s(?:di|ke|dari|dengan|cuma|cuman|hanya|mulai|harga|seharga|untuk|buat|khusus|sampai|hingga|s\.d\.?|s\/d|via|lewat|per|setiap|tiap|buka|include|termasuk|bisa|plus|\+|ada|berlaku|yang|biar|agar|supaya|isi|berisi|varian|rasa|ready|tersedia|stok|stock|gratis|free|bonus|dapat|dpt|order|pesan|hubungi|cek|langsung|area|kirim|pengiriman|garansi|bergaransi|tanggal|tgl|jam|pukul|pada|panggil)\b.*$/i;
const CONDITION = /\b(second|seken|bekas|mulus|no minus|tanpa minus|bnib|bnob|fullset|full set|like new|nego(?:\s+(?:tipis|santai|halus|sampai deal|aja))?|original|ori|baru|new|murah|meriah|terjangkau|berkualitas|terbaik|termurah|enak|lezat|mantap|kekinian|viral|premium|asli|murni|halal|segar|fresh|awet|tahan lama|lengkap)\b/gi;
const CTA_LEAD =
  /^(?:order|pesan|beli|hubungi|chat|dm|cek|kunjungi|daftar|daftarkan|kirim|klik|follow|buruan|mampir|datang|tag|share|simpan|download|unduh|(?:yuk|ayo|segera|langsung|silakan|jangan lupa)\s+(?:order|pesan|beli|hubungi|chat|dm|cek|kunjungi|daftar|kirim|klik|follow|mampir|datang|cobain|coba|ambil|wa|whatsapp|checkout|ikut|gabung|join|serbu|borong|download|unduh))\b/i;
const URGENCY = /\b(stok terbatas|terbatas|limited(?: stock| time)?|today only|only today|hari ini (?:saja|aja)|khusus hari ini|(?:khusus |cuma |hanya )?hari pertama|cuma \d+ (?:jam|hari)|hanya \d+ (?:jam|hari)|\d+ jam saja|selama persediaan masih ada|selama stok ada|sisa \d+|buruan|first come first served|siapa cepat dia dapat)\b/i;

/** Pecah per klausa (baris, titik akhir kalimat, koma, ; ! ?). Singkatan seperti "jl." & "s.d." dilindungi. */
function splitClauses(s: string): string[] {
  return s
    .replace(/\b(jl|jln|no|dr|mr|st|dll|dsb|tgl|kab|kec|kel|rp|ny|hj|pt|cv|ir|prof|drs|vs|min|maks|max|s\.d|sd)\./gi, '$1\u0001')
    .split(/\n|[;!?]|\.(?=\s|$)|,(?!\d)/)
    .map((x) => x.replace(/\u0001/g, '.').replace(/\s+/g, ' ').trim())
    .filter((x) => x.replace(/[^a-z0-9]/gi, '').length > 1);
}

/** Daftar eksplisit dari user: poin baris, "1. a 2. b", "x: a, b, c", "isi a, b dan c". */
function extractList(prompt: string): { items: string[]; label?: string } {
  const lines = prompt.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^([-•*✅▪️►→]|\d+[.)])\s*/.test(l)).map((l) => l.replace(/^([-•*✅▪️►→]|\d+[.)])\s*/, '').trim());
  if (bullets.length >= 2) return { items: bullets };
  const inline = prompt.split(/(?:^|\s)\d{1,2}[.)]\s+/).map((x) => x.trim().replace(/[,;]\s*$/, ''));
  if (inline.length >= 3) {
    const head = inline[0];
    const items = inline.slice(1).filter(Boolean);
    if (items.length >= 2) return { items, label: head.replace(/:\s*$/, '') };
  }
  const colon = /(?:^|\s)([^:\n]{2,40}):\s*([^:\n]+)/.exec(prompt);
  if (colon) {
    const first = colon[2].split(/\.\s+(?=[A-Z])|\.\s*$/)[0];
    const parts = first.split(/,|;|\s+dan\s+|\s+&\s+|\s+serta\s+/i).map((x) => x.trim()).filter((x) => x.length > 1);
    if (parts.length >= 2) return { items: parts, label: colon[1].trim() };
  }
  const kw = /\b(isi(?:nya)?|berisi|menu(?:nya)?|fitur(?:nya)?|poin(?:nya)?|daftar(?:nya)?|meliputi|antara lain|yaitu|yakni|seperti|topping(?:nya)?|materi(?:nya)?|benefit(?:nya)?|fasilitas(?:nya)?|syarat(?:nya)?|kualifikasi)\s+(.+?)(?:[.\n]|$)/i.exec(prompt);
  if (kw) {
    const parts = kw[2].split(/,|;|\s+dan\s+|\s+&\s+|\s+serta\s+/i).map((x) => x.trim()).filter((x) => x.length > 1);
    if (parts.length >= 2) return { items: parts, label: kw[1].toLowerCase() };
  }
  return { items: [] };
}

/** Bersihkan item daftar (harga & toko dipisah, angka biasa seperti "25 tahun" tetap). */
function cleanItem(s: string, store?: string): { text: string; price?: number } {
  const money = findMoney(s).filter((m) => m.role === 'price' || m.role === 'old');
  let text = s;
  for (const m of [...money].sort((a, b) => b.start - a.start)) text = text.slice(0, m.start) + text.slice(m.end);
  text = text
    .replace(/^\s*(?:(?:promo|diskon|sale|menu|jual|open\s+po|po|ready)\b[\s:!-]*)+/i, '')
    .replace(/\b(rp\.?|idr)\s*$/i, '')
    .replace(/\b(cuma|hanya|harga|seharga|mulai)\s*$/i, '')
    .replace(/^\s*(dan|plus|\+|serta|juga|ada)\s+/i, '')
    .replace(store ? new RegExp(`\\s+(?:di|dari|by)\\s+${esc(store)}\\s*$`, 'i') : /$^/, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,;:.-]+$/, '')
    .trim();
  return { text: dash(text), price: money[0]?.value };
}

/* ------------------------------------------------------------------ */
/* Jenis video                                                          */
/* ------------------------------------------------------------------ */
type W = [string, number];
const RULES: Array<{ intent: Intent; words: W[] }> = [
  { intent: 'flash-sale', words: [['flash sale', 3.5], ['flashsale', 3.5], ['cuci gudang', 3], ['clearance', 2.5], ['harbolnas', 3], ['payday', 2], ['hari ini saja', 2], ['sisa stok', 2], ['stok terbatas', 1.2], ['limited', 1], ['buruan', 1], ['detik terakhir', 2], ['big sale', 2.5], ['mega sale', 2.5]] },
  { intent: 'promo-produk', words: [['promo', 2.5], ['diskon', 2.5], ['jual', 2.5], ['jualan', 2], ['dijual', 2.5], ['sale', 1.5], ['harga', 1], ['murah', 1], ['beli', 1], ['order', 1], ['pesan', 0.6], ['ready', 1], ['ready stock', 2], ['produk', 0.8], ['gratis ongkir', 1.5], ['cod', 1], ['potongan', 2], ['cashback', 2], ['voucher', 1.5], ['sewa', 2], ['rental', 2], ['jasa', 2.2], ['open order', 2.5], ['pre order', 2.5], ['preorder', 2.5], ['po', 1.2], ['paket', 1], ['kursus', 1.8], ['les', 1], ['servis', 1.5], ['service', 1.2], ['laundry', 1.8], ['hampers', 1.5], ['katering', 1.2], ['catering', 1.2], ['grosir', 1.5], ['reseller', 1.2], ['nego', 1], ['garansi', 0.8], ['stok', 0.6]] },
  { intent: 'menu-kuliner', words: [['menu', 2.5], ['makanan', 1.2], ['minuman', 1.2], ['kuliner', 2], ['warung', 1.5], ['resto', 1.2], ['restoran', 1.2], ['kafe', 1], ['cafe', 1], ['kedai', 1.2], ['kopi', 1], ['seblak', 1.5], ['bakso', 1.5], ['ayam', 1], ['nasi', 1], ['mie', 1], ['boba', 1.2], ['martabak', 1.5], ['snack', 1], ['jajanan', 1.5], ['dessert', 1.2], ['kue', 1], ['es teh', 1.2], ['sate', 1.2], ['geprek', 1.2], ['dimsum', 1.2], ['pizza', 1.2], ['burger', 1.2], ['croissant', 1], ['matcha', 1], ['latte', 1], ['americano', 1], ['takjil', 1.5], ['gorengan', 1.2]] },
  { intent: 'launching', words: [['launching', 3.5], ['launch', 2.5], ['rilis', 2.5], ['peluncuran', 3.5], ['grand opening', 4], ['soft opening', 4], ['opening', 2], ['baru buka', 2.5], ['resmi buka', 3], ['segera hadir', 2.5], ['coming soon', 2.5], ['produk baru', 2], ['versi baru', 2], ['aplikasi baru', 2]] },
  { intent: 'event', words: [['event', 2.5], ['acara', 2], ['webinar', 3.5], ['seminar', 3], ['workshop', 3.5], ['konser', 3], ['festival', 3], ['lomba', 3.5], ['kompetisi', 3], ['turnamen', 3], ['bazar', 3], ['bazaar', 3], ['pameran', 3], ['expo', 2.5], ['meetup', 3], ['talkshow', 3], ['kajian', 2.5], ['pengajian', 2.5], ['daftar sekarang', 1.5], ['pendaftaran', 1.5], ['tiket', 1.2], ['htm', 2.5], ['pernikahan', 2.5], ['resepsi', 3], ['akad', 2.5], ['walimah', 3], ['syukuran', 2.5], ['aqiqah', 2.5], ['khitanan', 2.5], ['undangan', 3], ['save the date', 3], ['open house', 2.5], ['gathering', 2.5], ['reuni', 3], ['fun run', 3], ['jalan sehat', 3], ['senam bersama', 2.5], ['kelas online', 2]] },
  { intent: 'tips', words: [['tips', 3], ['tip', 2], ['trik', 2.5], ['cara', 2], ['rahasia', 2], ['hack', 1.5], ['ide', 1], ['rekomendasi', 1.5], ['kesalahan', 2.5], ['hindari', 1.5], ['manfaat', 2.5], ['alasan', 1.5], ['tanda', 1], ['kebiasaan', 2.5], ['bahaya', 2], ['waspada', 2], ['ciri-ciri', 2], ['biar', 0.4], ['agar', 0.4], ['supaya', 0.4]] },
  { intent: 'tutorial', words: [['tutorial', 3.5], ['langkah', 2], ['step', 1.5], ['panduan', 2.5], ['cara membuat', 2], ['cara bikin', 2], ['resep', 3.5], ['how to', 2.5], ['setup', 1.5], ['install', 2], ['deploy', 2], ['diy', 2], ['step by step', 3]] },
  { intent: 'fakta', words: [['fakta', 3.5], ['tahukah', 3], ['tau gak', 2], ['tahu nggak', 2], ['tahu gak', 2], ['ternyata', 0.8], ['unik', 1], ['sejarah', 2], ['mitos', 2], ['sains', 1.5], ['jarang diketahui', 2], ['misteri', 1.5], ['statistik', 1.5]] },
  { intent: 'quote-motivasi', words: [['motivasi', 3], ['semangat', 2], ['kata bijak', 3], ['bijak', 1.5], ['inspirasi', 2], ['sukses', 1], ['jangan menyerah', 2], ['bangkit', 1.2], ['mimpi', 0.8], ['berjuang', 1], ['afirmasi', 2.5], ['renungan', 2.5], ['pengingat', 1.5], ['sabar', 1.5], ['ikhlas', 1.5], ['bersyukur', 1.5]] },
  { intent: 'quote-galau', words: [['galau', 3.5], ['sedih', 2], ['patah hati', 3], ['rindu', 2], ['kangen', 2], ['capek', 1], ['lelah', 1], ['kecewa', 2], ['overthinking', 2.5], ['mantan', 2.5], ['baper', 2], ['healing', 1], ['ditinggal', 2], ['nangis', 2], ['move on', 2], ['sendiri', 0.8]] },
  { intent: 'testimoni', words: [['testimoni', 3.5], ['testi', 2.5], ['review', 2.5], ['ulasan', 2], ['kata pelanggan', 3], ['feedback', 2], ['rating', 1.5], ['puas', 0.8], ['repeat order', 2]] },
  { intent: 'before-after', words: [['before after', 4], ['sebelum sesudah', 4], ['sebelum dan sesudah', 4], ['before-after', 4], ['transformasi', 2.5], ['glow up', 2.5], ['makeover', 2.5], ['hasil pemakaian', 2.5]] },
  { intent: 'lowongan', words: [['lowongan', 4], ['loker', 4], ['lowker', 4], ['dicari', 2], ['dibutuhkan', 2.5], ['rekrutmen', 3.5], ['rekrut', 3], ['hiring', 3.5], ['open recruitment', 4], ['oprec', 3.5], ['karyawan', 1.5], ['magang', 2.5], ['internship', 3], ['kirim cv', 3], ['lamaran', 2], ['posisi', 1.2], ['kualifikasi', 2], ['gaji', 1]] },
  { intent: 'pengumuman', words: [['pengumuman', 4], ['pemberitahuan', 3.5], ['informasi', 1.5], ['info', 1], ['libur', 2], ['tutup', 2], ['tutup sementara', 3], ['buka kembali', 2.5], ['buka lagi', 2], ['jadwal', 1.2], ['jam operasional', 3], ['perubahan', 1.2], ['update', 0.8], ['maintenance', 2.5], ['pindah alamat', 3], ['himbauan', 3], ['imbauan', 3], ['tutup lebih awal', 3.5], ['buka seperti biasa', 2.5], ['tidak beroperasi', 3], ['tidak melayani', 2.5], ['harga naik', 3], ['kenaikan harga', 3.5], ['penyesuaian harga', 3.5], ['libur lebaran', 3], ['cuti bersama', 3]] },
  { intent: 'ucapan', words: [['selamat', 2], ['ucapan', 3], ['happy', 1.5], ['dirgahayu', 3.5], ['idul fitri', 1.5], ['lebaran', 1.2], ['idul adha', 1.5], ['natal', 1.5], ['tahun baru', 1.5], ['imlek', 1.5], ['ramadhan', 1.5], ['ramadan', 1.5], ['puasa', 0.8], ['ulang tahun', 1.5], ['ultah', 1.5], ['milad', 1.5], ['anniversary', 1.5], ['hari ibu', 2], ['hari guru', 2], ['kartini', 1.5], ['kemerdekaan', 1.5], ['wisuda', 1.2], ['hari raya', 1.5]] },
  { intent: 'travel', words: [['liburan', 2], ['wisata', 2.5], ['travel', 2], ['trip', 1.5], ['jalan-jalan', 2], ['destinasi', 2.5], ['pantai', 1], ['gunung', 1], ['villa', 1], ['staycation', 2], ['itinerary', 3.5], ['backpacker', 2.5], ['hidden gem', 2], ['tempat wisata', 3], ['open trip', 2.5], ['tour', 1.5], ['healing', 0.5]] },
  { intent: 'cerita', words: [['cerita', 2.5], ['kisah', 2.5], ['pengalaman pribadi', 3], ['storytime', 3.5], ['curhat', 2.5], ['dulu aku', 2.5], ['dulu saya', 2.5], ['dari nol', 1.5], ['pengalaman', 1.5], ['pertama kali', 1], ['perjalanan karier', 2.5], ['kisah nyata', 3]] },
];
const JASA_RE = /\b(jasa|servis|service|sewa|rental|kursus|les|kelas|laundry|cleaning|desain|design|fotografi|catering|katering|bimbel|privat|konsultasi|terapi|pijat|potong rambut|cukur|make ?up|mua|umroh|umrah|travel|tour)\b/i;
const GENERIC_QUOTE: W[] = [['quotes', 3], ['quote', 3], ['kata-kata', 2.5], ['kata kata', 2.5], ['caption', 1]];

export function detectIntent(prompt: string): { intent: Intent; scores: Array<[Intent, number]> } {
  // alasan ("…karena ada acara keluarga") tidak menentukan jenis video
  const low = ` ${prompt.toLowerCase().replace(/\s+/g, ' ').replace(/\b(karena|sebab|dikarenakan|soalnya)\b[^.,;!?\n]*/g, ' ')} `;
  const head = low.split(/[^a-z0-9-]+/).filter(Boolean).slice(0, 3).join(' ');
  const scores = new Map<Intent, number>();
  const add = (i: Intent, v: number) => scores.set(i, (scores.get(i) || 0) + v);
  // frasa (mis. "flash sale", "stok terbatas", "cara bikin") mengklaim posisinya: kata tunggal di dalamnya
  // ("sale", "stok", "cara") tidak lagi dihitung untuk jenis video lain
  const claims: Array<{ i: Intent; s: number; e: number }> = [];
  for (const r of RULES)
    for (const [w] of r.words) {
      if (!w.includes(' ')) continue;
      const at = wordAt(low, w);
      if (at >= 0) claims.push({ i: r.intent, s: at, e: at + w.length + 1 });
    }
  for (const r of RULES) {
    let s = 0;
    const seen = new Map<number, number>();
    for (const [w, wt] of r.words) {
      const at = wordAt(low, w);
      if (at < 0) continue;
      if (!w.includes(' ') && claims.some((cl) => cl.i !== r.intent && at >= cl.s && at + w.length <= cl.e)) continue;
      const lead = head.includes(w.split(' ')[0]) && at < 24;
      const v = wt * (lead ? 1.6 : 1);
      // kata yang sama di posisi yang sama (mis. "jual" & "jualan") hanya dihitung sekali, ambil bobot terbesar
      const prev = seen.get(at);
      if (prev !== undefined) {
        if (v > prev) {
          s += v - prev;
          seen.set(at, v);
        }
        continue;
      }
      seen.set(at, v);
      s += v;
    }
    if (s) add(r.intent, s);
  }
  let q = 0;
  for (const [w, wt] of GENERIC_QUOTE) if (hasWord(low, w)) q += wt * (head.includes(w.split(' ')[0]) ? 1.6 : 1);
  if (q) add((scores.get('quote-galau') || 0) >= 2 ? 'quote-galau' : 'quote-motivasi', q);
  // sinyal struktur
  const { e } = extract(prompt);
  const hasPrice = e.money.some((m) => m.role === 'price' || m.role === 'old');
  const strongNonPromo = ['event', 'lowongan', 'tips', 'tutorial', 'fakta', 'pengumuman', 'ucapan', 'travel'].some((i) => (scores.get(i as Intent) || 0) >= 3);
  if (hasPrice && !strongNonPromo) add('promo-produk', 1.5);
  if ((e.discount || e.money.some((m) => m.role === 'discount')) && !strongNonPromo) add('promo-produk', 2.5);
  if (e.campaign) add('flash-sale', 2.5);
  if (/\d+\s*(tips|cara|trik|ide|alasan|kesalahan|manfaat|tanda|rahasia|hal|kebiasaan|ciri|langkah mudah)\b/.test(low)) add('tips', 3);
  if (/\bcara\s+(mengatasi|menghilangkan|mencegah|menghadapi|mengurangi|meningkatkan|menjaga|merawat|memilih|menghemat|hemat|biar|agar|supaya|ampuh|jitu|cepat|mudah|efektif)\b/.test(low)) add('tips', 3.5);
  if (/\d+\s*(langkah|step|tahap)\b/.test(low)) add('tutorial', 3);
  if (/\bcara\s+(me[a-z]+|ber[a-z]+|bikin|buat|pakai|masak|deploy|install|instal|setting|setup|daftar|login|upload|edit|pasang|ganti|cek|bersihin|bersihkan|bayar|isi|kirim|transfer|aktifkan|hapus)\b/.test(low)) add('tutorial', 3.5);
  if (/\d+\s*fakta\b/.test(low)) add('fakta', 3);
  if (/\d+\s*(tempat|destinasi|spot|pantai|wisata)\b/.test(low)) add('travel', 3);
  if (/\d+\s*hari\s*\d+\s*malam|\d+d\d+n/.test(low)) add('travel', 2.5);
  if (PLACES.some((p) => p.re.test(low)) && (scores.get('travel') || 0) > 0) add('travel', 1);
  if (/\bselamat\s+(pagi|siang|sore|malam)\b/.test(low) && !OCCASIONS.some((o) => o.re.test(low))) {
    add('quote-motivasi', 3);
    scores.set('ucapan', 0);
  }
  if (/\bselamat\b/.test(low) && OCCASIONS.some((o) => o.re.test(low))) add('ucapan', 2.5);
  if (e.contact.email && /\bcv\b/.test(low)) add('lowongan', 2);
  if ((/\bsebelum\b/.test(low) && /\bsesudah\b/.test(low)) || (/\bbefore\b/.test(low) && /\bafter\b/.test(low))) add('before-after', 3);
  if (/^\s*(\d+[.)]\s+|[-•*]\s+)/m.test(prompt) && /(resep|cara|langkah|tutorial)/.test(low)) add('tutorial', 2);
  const sorted = [...scores.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (sorted.length) return { intent: sorted[0][0], scores: sorted };
  // tanpa kata kunci: tebak dari isinya
  const meaningful = words(low).filter((w) => !STOP.has(w));
  let intent: Intent = 'promo-produk';
  if (meaningful.length >= 2) {
    if (FACTS.some((f) => f.re.test(low))) intent = 'fakta';
    else if (pickDomain(low) !== 'umum') intent = 'tips';
    else if (QUOTE_THEMES.some(([re]) => re.test(low))) intent = 'quote-motivasi';
    else intent = meaningful.length > 6 ? 'cerita' : 'tips';
  }
  return { intent, scores: [] };
}

/** Urutkan isi bank: yang memuat kata penting dari prompt didahulukan; keduanya diputar sesuai seed supaya "Acak kalimat" tetap bervariasi. */
function rankBank<T>(bank: T[], keys: string[], text: (x: T) => string, seed: number): T[] {
  const rel: T[] = [];
  const rest: T[] = [];
  for (const x of bank) (keys.length && keys.some((k) => text(x).toLowerCase().includes(k)) ? rel : rest).push(x);
  const rot = (a: T[]) => {
    const o = a.length ? Math.abs(seed) % a.length : 0;
    return [...a.slice(o), ...a.slice(0, o)];
  };
  return [...rot(rel), ...rot(rest)];
}

function pickDomain(low: string): string {
  // bidang dari kata yang paling awal muncul ("konten … untuk UMKM" → konten); seri → urutan aturan
  let best = 'umum';
  let bestAt = Infinity;
  for (const [re, d] of DOMAIN_RULES) {
    const m = re.exec(low);
    if (m && m.index < bestAt) {
      best = d;
      bestAt = m.index;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Isian kalimat                                                        */
/* ------------------------------------------------------------------ */
function fill(t: string, v: Record<string, string | undefined>) {
  return t
    .replace(/\{\?\w+\}/g, '')
    .replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s([?!.,:])/g, '$1')
    .replace(/:\s*$/, '')
    .trim();
}
/** Pilih template yang semua variabelnya tersedia; utamakan yang memakai variabel `prefer` & tidak terlalu panjang. */
function pickTemplate(bank: string[], v: Record<string, string | undefined>, seed: number, prefer: string[] = []): string {
  const need = (t: string) => Array.from(t.matchAll(/\{\??(\w+)\}/g)).map((m) => m[1]);
  const ok = bank.filter((t) => need(t).every((k) => !!v[k]));
  let pool = ok.length ? ok : bank.filter((t) => !/\{/.test(t));
  if (!pool.length) pool = bank;
  const pref = prefer.filter((k) => v[k]);
  if (pref.length) {
    const p = pool.filter((t) => pref.some((k) => need(t).includes(k)));
    if (p.length) pool = p;
  }
  const short = pool.filter((t) => fill(t, v).length <= 64);
  if (short.length) pool = short;
  return fill(pool[seeded(seed, pool.length)], v);
}

/* ------------------------------------------------------------------ */
/* Analisis utama                                                       */
/* ------------------------------------------------------------------ */
export interface AnalyzeOptions {
  seed?: number;
  sceneCount?: number;
  intentOverride?: Intent;
  price?: string;
  product?: string;
  store?: string;
}

type Item = PlanItem & { _p?: number; _at?: number };

export function analyzePrompt(promptRaw: string, opts: AnalyzeOptions = {}): ContentPlan {
  const raw = (promptRaw || '').trim() || 'promo kopi susu gula aren 18rb';
  const prompt = raw
    .replace(/[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\uFE0F\u200D\u20E3]/g, ' ')
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
  const letters = prompt.replace(/[^A-Za-z]/g, '');
  const allCaps = letters.length > 8 && letters === letters.toUpperCase();
  const seed = opts.seed ?? Math.floor(Math.random() * 100000);
  const low = prompt.toLowerCase().replace(/\s+/g, ' ');
  const { intent: detected } = detectIntent(prompt);
  const intent = opts.intentOverride || detected;
  const category = CATEGORY_OF[intent];
  const { e, masked } = extract(prompt);
  const c = e.contact;
  const TC = (s: string) => titleCase(s, allCaps);
  const SC = (s: string) => sentenceCase(dash(s), allCaps);
  const meaningful = words(low).filter((w) => !STOP.has(w) && w.replace(/[^a-z]/g, '').length > 1);
  const junk = meaningful.length < 2 && !e.money.length && !e.discount;

  /* ---------- harga ---------- */
  const priceMoney = e.money.filter((m) => m.role === 'price');
  const oldMoney = e.money.filter((m) => m.role === 'old');
  const list = extractList(prompt);
  const listItems = list.items.map((x) => cleanItem(x, e.store)).filter((x) => x.text.length > 1 || x.price);
  const menuItems = listItems.filter((x) => x.price);
  // baris "Nama 15rb" tanpa tanda daftar juga dihitung menu
  const lineMenu = prompt
    .split(/\n/)
    .map((l) => cleanItem(l, e.store))
    .filter((x) => x.price && x.text && x.text.split(' ').length <= 6);
  const commaMenu = splitClauses(prompt.replace(/^[^:\n]*:/, ''))
    .map((x) => cleanItem(x, e.store))
    .filter((x) => x.price && x.text && x.text.split(' ').length <= 5);
  const menu = menuItems.length >= 2 ? menuItems : lineMenu.length >= 2 ? lineMenu : commaMenu.length >= 2 ? commaMenu : [];
  const isMenu = menu.length >= 2;
  let price: string | undefined;
  let oldPrice: string | undefined;
  let priceNote: string | undefined;
  const priceStr = (m: Money) => `${formatMoney(m)}${m.unit || ''}${m.bundle ? ` ${m.bundle}` : ''}`;
  if (isMenu) price = `Mulai ${formatRupiah(Math.min(...menu.map((x) => x.price || Infinity)))}`;
  else if (priceMoney.length) {
    const from = priceMoney.find((m) => m.from);
    const main = from || (priceMoney.length > 1 ? priceMoney.reduce((a, b) => (b.value < a.value ? b : a)) : priceMoney[0]);
    price = `${from || priceMoney.length > 1 ? 'Mulai ' : ''}${priceStr(main)}`;
    if (main.nego || /\bnego\b/i.test(prompt)) priceNote = 'Bisa nego';
    const old = oldMoney.length ? oldMoney.reduce((a, b) => (b.value > a.value ? b : a)) : undefined;
    if (old && old.value > main.value) {
      oldPrice = formatRupiah(old.value);
      if (!e.discount) e.discount = `${Math.round((1 - main.value / old.value) * 100)}%`;
      price = priceStr(main);
    }
  }
  const disc = e.money.find((m) => m.role === 'discount');
  if (!e.discount && disc) e.discount = `-${shortMoney(disc.value)}`;
  const ticket = e.money.find((m) => m.role === 'ticket');
  const prize = e.money.find((m) => m.role === 'prize');
  const salary = e.money.find((m) => m.role === 'salary');
  const budget = e.money.find((m) => m.role === 'budget');
  const minOrder = e.money.find((m) => m.role === 'min');
  const shipping = e.money.find((m) => m.role === 'shipping');
  if (opts.price) {
    price = opts.price;
    oldPrice = undefined;
  }
  const discount = e.discount;
  const gratis = /\b(gratis|free)\b(?!\s+ongkir)/i.test(prompt) && !price && !ticket;

  /* ---------- klausa, produk, keunggulan ---------- */
  const rest = (category === 'quote' ? masked : masked.replace(/"[^"\n]{2,220}"(?:\s*[-–—,]?\s*(?:oleh|dari|by)?\s*[A-Z][\w.]*(?:\s+[A-Z][\w.]*)?)?/g, (q) => (q.length > 40 || /"\s*[-–—]/.test(q) ? ' '.repeat(q.length) : q)))
    .replace(LEAD_CMD, ' ')
    .replace(/[ \t]+/g, ' ');
  const restLines = rest.split(/\n/);
  // klausa beserta tanda "berasal dari baris poin" — baris poin tidak dipakai sebagai nama produk
  const clauseInfo: Array<{ text: string; bullet: boolean }> = [];
  for (const line of restLines) {
    const bullet = /^\s*([-•*✅▪️►→]|\d+[.)])\s+/.test(line);
    for (const cl of splitClauses(line.replace(/^\s*([-•*✅▪️►→]|\d+[.)])\s+/, ''))) clauseInfo.push({ text: cl, bullet });
  }
  let headIdx = (() => {
    const lead = clauseInfo.findIndex((x) => !x.bullet && OFFER_LEAD.test(x.text));
    if (lead >= 0) return lead;
    const nb = clauseInfo.findIndex((x) => !x.bullet);
    return nb >= 0 ? nb : 0;
  })();
  const clauses = clauseInfo.map((x) => x.text);
  let head = (clauses[headIdx] || '').split(':')[0];
  let campaign = e.campaign ? e.campaign : '';
  const SEASON_RE = /^\s*(?:promo|diskon|sale|spesial|special)?\s*(tahun baru(?:\s+\d{4})?|lebaran|natal|ramadh?an|imlek|kemerdekaan|17 agustus|akhir tahun|awal tahun|harbolnas|payday|gajian|valentine|back to school|black friday|hari ibu|early bird|pre-?sale|harga spesial|harga khusus|member baru|new member|anniversary|ulang tahun toko|grand opening|weekend|akhir pekan|jumat berkah)\b/i;
  const stripHead = (x: string) => {
    let h = x.split(':')[0];
    const ss = SEASON_RE.exec(h.replace(/^\s*(?:(?:promo|diskon|sale|spesial|special|flash\s*sale|big\s+sale|mega\s+sale)\b[\s:!-]*)+/i, ' ')) || SEASON_RE.exec(h);
    h = h.replace(OFFER_LEAD, '').replace(INTENT_LEAD, '').trim();
    let camp = '';
    if (ss && intent !== 'ucapan') {
      camp = TC(ss[1]);
      if (new RegExp(`^${esc(ss[1])}`, 'i').test(h)) h = h.slice(ss[1].length);
    }
    h = h.replace(/\b(diskon|potongan|promo|sale|cashback|hemat)\b/gi, ' ').replace(/\s+/g, ' ').replace(/^[\s+&,.:-]+/, '').trim();
    return { h, camp };
  };
  {
    const first = stripHead(head);
    head = first.h;
    if (first.camp) campaign = campaign || first.camp;
  }
  // judul kosong ("PROMO GAJIAN!!", "produk baru!") → nama produk ada di klausa berikutnya
  const weakHead = (h: string) => {
    const x = h.replace(/\b(hari ini|besok|lusa|minggu ini|bulan ini|malam ini|sekarang|saat ini|weekend ini|akhir pekan ini|aja|saja|nih|dong|yuk)\b/gi, ' ').trim();
    return x.replace(/[^a-z]/gi, '').length < 3 || /^(produk|barang|item|kami|toko|baru|new|lagi|guys|gaes|kak|spesial|special)$/i.test(x);
  };
  let weakIdx = -1;
  const headClause0 = clauses[headIdx] || '';
  if (weakHead(head) && !isMenu && headClause0.includes(':') && !(list.items.length >= 2)) {
    // "promo bulan ini: potong rambut + creambath 60rb" → nama ada setelah titik dua
    const after = stripHead(headClause0.slice(headClause0.indexOf(':') + 1));
    if (!weakHead(after.h)) head = after.h;
  }
  if (weakHead(head) && !isMenu && !(list.items.length >= 2 && /:/.test(clauses[headIdx] || '')) && !(intent === 'launching' && (opts.store || e.store))) {
    weakIdx = headIdx;
    for (let j = 0; j < clauseInfo.length; j++) {
      if (j === headIdx || clauseInfo[j].bullet) continue;
      const cand = stripHead(clauses[j]);
      if (weakHead(cand.h) || CTA_LEAD.test(cand.h) || URGENCY.test(cand.h)) continue;
      headIdx = j;
      head = cand.h;
      if (cand.camp) campaign = campaign || cand.camp;
      break;
    }
  }
  let scope = '';
  head = head.replace(/^\s*(?:up\s*to|upto|s\.d\.?)\s*/i, '').replace(/\b(?:only|today only|this weekend only)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const sc = /(?:^|\s)(?:(?:untuk|buat|khusus|berlaku|for)\s+)?(?:semua|seluruh|all)\s+(varian|produk|item|items|products?|menu|barang|koleksi|jenis|ukuran|size|warna|model|collections?)\b/i.exec(head);
  if (sc) {
    const scW = sc[1].toLowerCase().replace(/^items?$/, 'produk').replace(/^products?$/, 'produk').replace(/^collections?$/, 'koleksi');
    scope = `Berlaku untuk semua ${scW}`;
    head = `${head.slice(0, sc.index)} ${head.slice(sc.index + sc[0].length)}`.replace(/\s+/g, ' ').trim();
  }
  head = head.replace(/^(?:untuk|buat|khusus|s\.?d\.?|\+)\s*/i, '').trim();
  const condPhrase = /^(?:(?:pembelian|transaksi|order|pesanan|belanja)\s+(?:pertama|perdana)|pengguna baru|member baru|user baru|semua transaksi)\b/i.exec(head);
  const conditions: string[] = [];
  if (condPhrase) {
    conditions.push(`khusus ${condPhrase[0].toLowerCase()}`);
    head = head.slice(condPhrase[0].length).trim();
  }
  const speedM = /\b(\d+)\s*(jam|hari|menit)\s+(selesai|jadi|beres|kelar|sampai)\b/i.exec(head);
  const speedFeature = speedM ? `${speedM[3].charAt(0).toUpperCase()}${speedM[3].slice(1).toLowerCase()} dalam ${speedM[1]} ${speedM[2].toLowerCase()}` : '';
  if (speedM) head = `${head.slice(0, speedM.index)} ${head.slice(speedM.index + speedM[0].length)}`.replace(/\s+/g, ' ').trim();
  const headCut = PRODUCT_CUT.exec(` ${head}`);
  let productRaw = (headCut ? ` ${head}`.slice(0, headCut.index) : head).trim();
  const headTail = headCut ? ` ${head}`.slice(headCut.index).trim() : '';
  productRaw = productRaw.replace(/\b100\s*%(?:\s*(asli|murni|original|ori|alami|natural|organik|halal|katun|cotton))?/gi, (w) => {
    conditions.push(w.toLowerCase().replace(/\s+/g, ' '));
    return ' ';
  });
  productRaw = productRaw.replace(CONDITION, (w) => {
    conditions.push(w.toLowerCase());
    return ' ';
  });
  productRaw = productRaw
    .replace(/\b(hari ini|besok|lusa|minggu ini|malam ini|sekarang|saat ini|bulan ini|weekend ini)\b/gi, ' ')
    .replace(/\b(aja|saja|doang|nih|dong|deh|yuk|kok|sih|lho|loh|kak|gan|sis|bun|guys|gaes)\b/gi, ' ')
    .replace(/["“”]/g, ' ');
  const version = /\b(?:versi|ver\.?|v)\s*(\d+(?:\.\d+)*)\b/i.exec(prompt)?.[1];
  productRaw = productRaw
    .replace(/\s*\b(?:versi|ver\.?|v)\s*\d+(?:\.\d+)*\b/i, ' ')
    .replace(/\b(versi|ver\.?)\s*$/i, '')
    .replace(/[^\w\s&'.+/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s&/.,+-]+|[\s&/.,+-]+$/g, '')
    .trim();
  // merek berhuruf besar di belakang frasa ("aplikasi kasir Kasirku") → merek jadi nama, sisanya keterangan
  let productDesc = '';
  const brand = /^([a-z][a-z\s]+?)\s+([A-Z][\w-]*(?:\s+[A-Z0-9][\w-]*)*)$/.exec(productRaw);
  if (brand && !allCaps && words(brand[1]).length <= 3 && brand[2].length >= 3 && !words(brand[2]).every((w) => ACRONYMS.has(w.toLowerCase()) || /^\d+$/.test(w)) && !/^[A-Z0-9]+$/.test(brand[2])) {
    productDesc = SC(brand[1]);
    productRaw = brand[2];
  }
  if (version && productRaw && !productRaw.includes(version)) productRaw = `${productRaw} ${version}`;
  productRaw = words(productRaw).slice(0, 6).join(' ');
  const store = opts.store || e.store;
  let productGeneric = false;
  let product = opts.product || (productRaw && productRaw.replace(/[^a-z]/gi, '').length > 1 ? TC(productRaw) : '');
  if (!product) {
    productGeneric = true;
    product = scope ? `Semua ${TC(scope.split(' ').pop() || 'Produk')}` : campaign ? 'Semua Produk' : store && !isMenu ? store : isMenu ? (store ? `Menu ${store}` : 'Menu Andalan') : junk ? 'Nama Produk' : 'Produk Pilihan';
  }
  product = dash(product);
  if (isMenu && !opts.product) product = store ? `Menu ${store}` : productRaw ? TC(productRaw) : 'Menu Andalan';

  // klausa sisa → keunggulan / ajakan / urgensi
  const features: string[] = [];
  const urgency: string[] = [];
  let ctaUser = '';
  let areaUsed = false;
  const featureSrc = [headTail, ...clauses.filter((_, i) => i !== headIdx && i !== weakIdx)];
  const fromHead = new Set<string>();
  const menuNames = new Set(menu.map((x) => x.text.toLowerCase()));
  for (const raw0 of featureSrc) {
    let cl = raw0
      .replace(/^(?:[\s,.:;+-]|dan\b|plus\b|serta\b|juga\b|lalu\b|terus\b|s\.d\.?|s\/d)+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cl || (cl.replace(/[^a-z]/gi, '').length < 3 && !/^(ac|tv|wifi|cod|ps5|ps4)$/i.test(cl.trim()))) continue;
    const lcl = cl.toLowerCase();
    if (menuNames.has(lcl)) continue;
    if (/^(di|ke|dari|untuk|buat|yang|dengan|via|lewat|per|mulai|harga|cuma|hanya|sampai|hingga|tanggal|tgl|jam|pukul)$/i.test(cl)) continue;
    if (/^(hadiah(?: total)?|total hadiah|htm|tiket|gaji|budget|bujet|harga(?: normal)?|ongkir|min(?:imal|\.)? (?:belanja|order)|cashback|diskon|potongan|rating|ulasan|terjual|deadline|batas(?: waktu| akhir)?|pendaftaran|registrasi|kuota)$/i.test(cl)) continue;
    const urg = URGENCY.exec(cl);
    if (urg) {
      urgency.push(SC(urg[0]));
      const restUrg = cl.replace(urg[0], ' ').replace(/\b(diskon|promo|khusus|cuma|hanya)\b/gi, ' ').replace(/\s+/g, ' ').trim();
      if (restUrg.replace(/[^a-z]/gi, '').length < 4) continue;
      cl = restUrg;
    }
    if (CTA_LEAD.test(cl)) {
      const cta0 = cl.replace(/\s+(?:ke|di|via|lewat|ya|yuk)\s*$/i, '').trim();
      const meaningfulCta = words(cta0).filter((w) => !/^(via|lewat|ke|di|wa|whatsapp|ig|instagram|dm|tiktok|sekarang|aja|ya|yuk|kami)$/i.test(w));
      if (!ctaUser && meaningfulCta.length >= 2) ctaUser = SC(cta0);
      continue;
    }
    cl = cl.replace(/\s+(?:di|ke|dari|untuk|via|lewat|dengan|mulai|harga|cuma|hanya|sampai|hingga|tanggal|tgl)$/i, '').trim();
    if (/^(hadiah(?: total)?|htm|tiket|gaji|budget|harga(?: normal| mulai)?|ongkir|cashback|diskon|potongan|deadline|batas(?: waktu| akhir)?|pendaftaran|registrasi|kuota|download|unduh|install)$/i.test(cl)) continue;
    if (e.area && !areaUsed && /\b(pengiriman|kirim|dikirim|antar|delivery|melayani|layanan|panggil|ke rumah|home service|jemput|cod|ongkir)\b/i.test(cl)) {
      cl = `${cl} ${e.area.replace(/^(Area|Seluruh|Sekitar)\b/, (w) => w.toLowerCase())}`;
      areaUsed = true;
    }
    if (words(cl).length > 12) cl = words(cl).slice(0, 12).join(' ');
    if (cl.replace(/[^a-z]/gi, '').length >= 3 && !/^(isi|berisi|syarat|fitur|materi|menu|topping|benefit|fasilitas|kualifikasi|tersedia)$/i.test(cl)) {
      features.push(SC(cl));
      if (raw0 === headTail) fromHead.add(SC(cl));
    }
  }
  if (speedFeature) features.unshift(speedFeature);
  const conditionFeature = conditions.filter((w) => !/^(murah|meriah|baru|new|nego.*|terjangkau)$/.test(w));
  if (conditionFeature.length) features.unshift(SC(conditionFeature.join(', ')));
  if (/\b(murah|meriah|terjangkau)\b/i.test(prompt) && !features.some((f) => /murah|terjangkau/i.test(f))) features.push('Harga terjangkau');
  if (scope) features.unshift(scope);
  // istilah Inggris → Indonesia
  for (let i = 0; i < features.length; i++) {
    features[i] = features[i]
      .replace(/^free shipping\b/i, 'Gratis ongkir')
      .replace(/^(?:only\s+)?this weekend(?:\s+only)?(?:\s+at)?$/i, 'Khusus akhir pekan ini')
      .replace(/^(?:only\s+)?today(?:\s+only)?$/i, 'Khusus hari ini')
      .replace(/\s+(?:at|in|on)$/i, '');
  }
  const BENEFIT_WORDS: Array<[RegExp, string]> = [
    [/gratis ongkir|free ongkir|free shipping|bebas ongkir/i, 'Gratis ongkir'],
    [/\bcod\b|bayar di tempat/i, 'Bisa COD'],
    [/\bhalal\b/i, 'Halal'],
    [/\bgaransi\b/i, 'Bergaransi'],
    [/\bpre[-\s]?order\b|\bopen po\b|\bbuka po\b/i, 'Sistem pre-order'],
  ];
  for (const [re, label] of BENEFIT_WORDS) if (re.test(prompt) && !features.some((f) => re.test(f))) features.push(label);
  if (shipping) features.push(`Ongkir ${formatRupiah(shipping.value)}`);
  if (minOrder) features.push(`Min. belanja ${formatRupiah(minOrder.value)}`);
  if (e.area && !areaUsed && category !== 'quote' && intent !== 'lowongan') features.push(e.area);
  const isBulletList = !list.label && list.items.length >= 2;
  const contentList =
    !!list.label && (/isi|berisi|topping|fasilitas|benefit|fitur|materi|meliputi|antara lain|yaitu|yakni|seperti|include|termasuk|sudah termasuk|dapat apa/i.test(list.label) || (category === 'promo' && /\b(paket|hampers|bundling|parcel|all in|set)\b/i.test(list.label)));
  const listLow = new Set(listItems.map((x) => x.text.toLowerCase()));
  const inList = (f: string) => {
    const k = f.toLowerCase().replace(/^(isi|berisi|topping|fitur|materi|benefit|fasilitas|syarat|kualifikasi)\s*:?\s*/, '');
    return listLow.has(k) || listLow.has(f.toLowerCase());
  };
  const featuresClean = dedupeLines([...(isBulletList && category === 'promo' && !isMenu ? listItems.map((x) => SC(x.text)) : []), ...features.filter((f) => !(contentList && inList(f)))].map((f) => f.replace(/[.,;:]+$/, ''))).filter(
    (f) => f.toLowerCase() !== product.toLowerCase() && !menuNames.has(f.toLowerCase()) && !(scope && productGeneric && f === scope)
  );

  /* ---------- topik (untuk edukasi & quote) ---------- */
  const topicInfo = (() => {
    let t = masked.replace(LEAD_CMD, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(/^\s*\d+\s+/, '');
    const mk = /\b(?:\d+\s+)?(tips(?:\s+(?:dan|&)\s+trik)?|trik|cara|tutorial|resep|fakta(?:\s+unik)?|manfaat|kesalahan|rahasia|alasan|tanda|ide|panduan|langkah|kata-kata|kata kata|kata bijak|quotes?|motivasi|cerita|kisah)(?:nya)?\b\s*(?:tentang|soal|mengenai|seputar)?\s*/i.exec(t);
    let core = mk ? t.slice(mk.index + mk[0].length) : t.replace(/^(?:tentang|soal|mengenai)\s+/i, '');
    const marker = mk ? mk[1].toLowerCase() : '';
    const mkOrig = marker ? new RegExp(`\\b(?:\\d+\\s+)?${esc(marker.split(' ')[0])}`, 'i').exec(prompt) : null;
    const before = mkOrig ? prompt.slice(0, mkOrig.index).replace(LEAD_CMD, '').replace(/\b(ini|itu|berikut|nih)\s*$/i, '').replace(/[,.\s]+$/, '').trim() : '';
    // satu klausa saja, tanpa sisa tanda baca dari bagian yang sudah dibaca (harga, tanggal)
    core = core.split(':')[0].replace(/\s+([,.;!?])/g, '$1').replace(/^[\s,.;]+/, '').split(/\s*[,;]\s*/)[0];
    const goalM = /(?:^|\s)(?:biar|agar|supaya)\s+(.+)$/i.exec(core);
    const goal = goalM ? goalM[1].replace(/[.,!]+$/, '').trim() : '';
    if (goalM) core = core.slice(0, goalM.index);
    const audM = /\s(?:untuk|buat|bagi)\s+((?:para\s+)?(?:pemula|anak|ibu|mahasiswa|pelajar|karyawan|pekerja|pebisnis|pemilik|orang|kamu|yang|umkm|freelancer|mama|papa|remaja|newbie|cewek|cowok|wanita|pria)[\w\s-]*)$/i.exec(core);
    const target = audM ? audM[1].trim() : '';
    if (audM) core = core.slice(0, audM.index);
    core = core
      .replace(/\s+(?:dalam|cuma|hanya)\s+\d+\s+(?:langkah|step|tahap|menit|hari)\s*$/i, '')
      .replace(/\s+\d+\s+(?:langkah|step|tahap)\s*$/i, '')
      .replace(/\s+(?:yang\s+)?(?:jarang\s+(?:diketahui|orang\s+tahu)|wajib\s+(?:dikunjungi|dicoba|kamu\s+tahu)|harus\s+(?:kamu\s+)?tahu|paling\s+\w+)\s*$/i, '')
      .replace(/\s+(?:yang\s+)?(?:lucu|imut|gemas|menggemaskan)\s*$/i, '')
      .replace(/[.,:;!?]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { topic: core, marker, goal, target, before };
  })();
  const lowerFirst = (s: string) => (/^[A-Z][a-z]+\b/.test(s) && !allCaps ? s.charAt(0).toLowerCase() + s.slice(1) : allCaps ? s.toLowerCase() : s);
  const topicCore = lowerFirst(topicInfo.topic || topicInfo.goal || (productGeneric ? '' : product.toLowerCase()));
  const topicFull = `${topicCore}${topicInfo.target ? ` ${/^(untuk|buat|bagi)\b/i.test(topicInfo.target) ? '' : 'untuk '}${topicInfo.target}` : ''}`.replace(/\s+/g, ' ').trim();

  const countM = /(\d+)\s*(tips|cara|trik|ide|alasan|kesalahan|manfaat|tanda|langkah|step|tahap|fakta|tempat|destinasi|spot|menu|hal|rekomendasi|rahasia|quotes?|kata|kebiasaan|ciri|kuliner|makanan)/i.exec(prompt);
  const nAsked = countM ? Math.min(10, Number(countM[1])) : 0;

  /* ---------- tanggal & info ---------- */
  const dates = e.dates.filter((d) => !d.deadline);
  const deadline = e.dates.find((d) => d.deadline)?.text;
  const relDate = e.rel.find((r) => r !== 'hari ini' && r !== 'malam ini');
  const date = dates.length ? dates.map((d) => d.text).slice(0, 2).join(' & ') : relDate ? sentenceCase(relDate) : undefined;
  const time = e.times[0] || e.timeNote;
  const location = e.location || e.venue || (e.area && category !== 'promo' && !/^Domisili/.test(e.area) ? e.area : undefined);
  const where = e.online || location;
  const city = PLACES.find((p) => p.re.test(low));
  const cityName = city?.name || (e.location && PLACE_RE.test(e.location.split(' ')[0]) ? e.location : undefined);
  const contactLine = c.wa ? `WA ${c.wa}` : c.phone ? `Telp ${c.phone}` : c.email ? c.email : c.url ? c.url.replace(/^https?:\/\//, '') : c.handle;

  /* ---------- variabel kalimat ---------- */
  const durM = /\b(\d+)\s*(hari|jam|minggu|bulan)\s*(\d+\s*malam)?\b/i.exec(prompt);
  const isFromPrice = !!price && /^Mulai /.test(price);
  const firstItemIsProduct = isMenu && !!menu[0]?.price && !!productRaw && menu[0].text.toLowerCase().includes(productRaw.toLowerCase().replace(/^(?:promo|diskon)\s+/, ''));
  const priceBare = price ? price.replace(/^Mulai\s+/, '') : undefined;
  const vars: Record<string, string | undefined> = {
    produk: product,
    harga: priceBare,
    hargaPas: firstItemIsProduct ? formatRupiah(menu[0].price as number) : isFromPrice ? undefined : priceBare,
    hargaMulai: firstItemIsProduct ? undefined : isFromPrice ? priceBare : undefined,
    kampanye: campaign ? `Promo ${campaign}` : undefined,
    tgl: undefined,
    diskon: discount && !/^B\d/.test(discount) ? `${e.discountUpTo ? 's.d. ' : ''}${/^-/.test(discount) && disc ? formatRupiah(disc.value) : discount.replace(/^-/, '')}` : undefined,
    toko: store,
    topik: topicFull || lowerFirst(product),
    kota: cityName,
    target: topicInfo.goal || undefined,
    durasi: durM ? `${durM[1]} ${durM[2].toLowerCase()}${durM[3] ? ` ${durM[3].replace(/\s+/, ' ')}` : ''}` : undefined,
  };

  const items: Item[] = [];
  const iconFor = (w: string, fb = 'sparkles') => findIconFor(w.split(/\s+/).concat(words(low)), fb);
  const push = (role: SceneRole, title: string, body?: string, value?: string, icon?: string, placeholder = false, p = 5) => {
    items.push({ role, title, body: body || undefined, value: value || undefined, icon: icon || iconFor(title), ...(placeholder ? { placeholder: true } : {}), _p: p });
  };
  const hookOf = (key: string, v = vars, s = seed, prefer: string[] = []) => pickTemplate(HOOKS[key] || HOOKS.promo, v, s, prefer).replace(/\bpromo\s+promo\b/gi, 'promo').replace(/\bmulai\s+mulai\b/gi, 'mulai');
  const proofs = () => {
    if (e.rating) push('bukti', `Rating ${e.rating}`, e.reviews ? `Dari ${e.reviews.toLocaleString('id-ID')}+ ulasan` : '', e.rating, 'star', false, 6);
    else if (e.sold && e.sold > 50) push('bukti', `${e.sold.toLocaleString('id-ID')}+ terjual`, '', String(e.sold), 'users', false, 6);
    else if (e.reviews && e.reviews > 10) push('bukti', `${e.reviews.toLocaleString('id-ID')}+ ulasan`, '', String(e.reviews), 'message-circle', false, 6);
  };
  const infoLines = () =>
    dedupeLines([...(e.online ? [e.online] : []), ...(location ? [location] : []), ...e.schedule, ...(date ? [`${date}${time ? ` · ${time}` : ''}`] : time ? [time] : [])]);
  const pushInfo = (titleHint?: string) => {
    const lines = infoLines();
    if (!lines.length) return;
    if (lines.length === 1 && e.online && !location && /online|daring/i.test(product)) return;
    const isLoc = !!(location || e.online);
    const title =
      titleHint ||
      (isLoc
        ? e.online && !location
          ? 'Online'
          : promoKind === 'properti'
            ? 'Lokasi'
            : 'Lokasi kami'
        : e.schedule.length
          ? e.schedule.some((x) => /\d|buka|24 jam/i.test(x))
            ? 'Jam buka'
            : e.discount || campaign
              ? 'Promo berlaku'
              : 'Jadwal'
          : /\b(umroh|umrah|haji|tour|trip|keberangkatan|berangkat)\b/.test(low)
            ? 'Keberangkatan'
            : !date && time
              ? 'Mulai pukul'
              : category === 'promo' && (e.discount || campaign)
                ? 'Periode promo'
                : category === 'promo' && /\b(po|pre[-\s]?order)\b/.test(low)
                  ? 'Periode PO'
                  : 'Catat tanggalnya');
    push('info', title, lines[0], lines.length > 1 ? lines.join('|') : undefined, isLoc ? 'map-pin' : e.schedule.length || (!date && time) ? 'clock' : 'calendar', false, 4);
  };
  const featureScene = (fs: string[], titleIfMany?: string, p = 3) => {
    if (!fs.length) return;
    if (fs.length === 1) push('poin', fs[0], '', undefined, iconFor(fs[0], 'badge-check'), false, p);
    else push('poin', titleIfMany || (words(product).length <= 3 && !productGeneric ? `Kenapa pilih ${product}?` : 'Keunggulannya'), '', fs.slice(0, 4).join('|'), 'badge-check', false, p);
  };
  const splitMore = (pool: string[], valueKey?: string) => {
    // keunggulan dalam satu scene checklist bisa dipecah satu per scene saat jumlah scene ditambah
    let k = 0;
    let at = 0;
    return () => {
      const head4 = valueKey ?? pool.slice(0, 4).join('|');
      const idx = items.findIndex((it) => it.role === 'poin' && !!it.value && it.value === head4);
      if (k === 0 && idx >= 0 && pool.length >= 2) {
        items.splice(idx, 1, { role: 'poin', title: pool[0], icon: iconFor(pool[0], 'badge-check'), _p: 3 });
        k = 1;
        at = idx + 1;
        return { role: 'poin' as SceneRole, title: pool[1], icon: iconFor(pool[1], 'badge-check'), _p: 3, _at: at++ };
      }
      if (k > 0 && k + 1 < pool.length) {
        k++;
        return { role: 'poin' as SceneRole, title: pool[k], icon: iconFor(pool[k], 'badge-check'), _p: 3, _at: at++ };
      }
      return null;
    };
  };

  /* ---------- jenis usaha (menentukan kalimat ajakan) ---------- */
  const promoKind = (() => {
    if (category !== 'promo' || intent === 'event' || intent === 'launching') return '';
    const monthly = !!price && /\/(bulan|tahun)/.test(price);
    const lowP = low.replace(/\banak kos(t)?\b/g, ' ');
    if (
      /\b(rumah|tanah|ruko|apartemen|apartment|kavling|kaveling|villa|kost|kos|kosan|kos-kosan|kontrakan|properti|perumahan|townhouse|kios)\b/.test(lowP) &&
      (/\b(dijual|jual|disewakan|dikontrakkan|over kredit|take over|cluster|lantai|sertifikat|shm|kpr|luas|lt\b|lb\b|kamar tidur|kamar mandi|siap huni|putra|putri|campur|pasutri)/.test(lowP) || monthly) &&
      !/rumah makan|cuci gudang|rumah sakit|rumahan|rumah tangga/.test(lowP)
    )
      return 'properti';
    if (/\b(umroh|umrah|haji|open trip|paket wisata|paket tour|tour|trip)\b/.test(low)) return 'travel';
    if (/\b(kursus|les|kelas|bimbel|privat|pelatihan|training|bootcamp|mentoring|coaching)\b/.test(low)) return 'kelas';
    if (/\b(sewa|rental|disewakan)\b/.test(low)) return 'sewa';
    // makanan dilihat dari nama produk/menu, bukan kata acak di prompt ("noda kopi" bukan kuliner)
    const foodSrc = `${productRaw} ${product} ${menu.map((x) => x.text).join(' ')}`.toLowerCase();
    const food = intent === 'menu-kuliner' || /\b(makan|makanan|minum|minuman|kuliner|warung|kedai|resto|restoran|kafe|cafe|coffee|kopi|nasi|bakso|mie|mi|seblak|ayam|bebek|sate|martabak|kue|cake|roti|boba|es|teh|snack|camilan|cemilan|keripik|sambal|frozen food|katering|catering|dimsum|pizza|burger|takjil|gorengan|jajanan|nastar|kastengel|brownies|donat|bolu|puding|jus|susu|seafood|ikan|daging|steak|ramen|sushi|bento|geprek|pecel|soto|rawon|gado-gado|lontong|bubur|cireng|cilok|batagor|siomay|madu)\b/.test(foodSrc);
    if (food) return /\b(warung|kedai|resto|restoran|kafe|cafe|depot|rumah makan|angkringan|foodcourt|food court)\b/.test(low) || location ? 'tempat' : 'kuliner';
    if (/\b(desain|design|edit|editing|editor|website|web|aplikasi|logo|konten|copywriting|ketik|translate|terjemah|jastip|jasa titip|pembuatan|bikin|joki|social media|sosmed|admin|laundry|cetak|print|sablon|bordir)\b/.test(low) && (JASA_RE.test(low) || /\b(laundry|cetak|print|sablon|bordir)\b/.test(low))) return 'jasaOrder';
    if (JASA_RE.test(low) || /\b(cuci|jahit|pasang|sedot|renovasi|tukang|pindahan|angkut|rias|reparasi|perbaikan|instalasi|install|bengkel|salon|spa|barber|pangkas)\b/.test(low.replace(/cuci gudang/g, ' '))) return 'jasa';
    return '';
  })();

  const brandHandle = c.handle && e.speaker !== c.handle ? c.handle : undefined;
  const PUBLIC_EVENT = /\b(bazar|bazaar|festival|pameran|expo|konser|open house|jalan sehat|fun run|senam bersama|pasar malam|car free day|kajian|pengajian|tabligh|majelis|ceramah|sholawat|shalawat|maulid|istighosah|nonton bareng|nobar)\b/i;
  const isAppLaunch = /\b(aplikasi|app|apk|website|web|platform|software|game)\b/.test(low) || !!c.app;
  const ctaClean = (x: string) => {
    let t0 = x.replace(/[.!]+$/, '');
    for (let g = 0; g < 4; g++) t0 = t0.replace(/\s+(?:paling lambat|sebelum|sampai|hingga|maks(?:imal)?|max|ke|via|lewat|di|wa|whatsapp|email|e-mail|nomor|no|sekarang juga)\s*$/i, '');
    return t0.trim();
  };

  /* ---------- CTA ---------- */
  const ctaPick = (key: string) => {
    const b = CTAS[key] || CTAS.promo;
    return b[seeded(seed + 7, b.length)];
  };
  const buildCta = (): Item => {
    let title = '';
    let value: string | undefined;
    let body: string | undefined = brandHandle || store;
    if (intent === 'lowongan') {
      const partner = /\b(reseller|dropship(?:per)?|agen|mitra|affiliate|afiliasi)\b/i.test(low);
      const docW = /portofolio|portfolio/i.test(low) ? 'portofolio' : 'CV';
      title = partner
        ? `Daftar jadi ${/\breseller\b/i.test(low) ? 'reseller' : /\bdropship/i.test(low) ? 'dropshipper' : /\bagen\b/i.test(low) ? 'agen' : 'mitra'} sekarang!`
        : ctaUser && /cv|lamar|daftar|portofolio|portfolio|berkas|resume/i.test(ctaUser) && words(ctaClean(ctaUser)).length >= 2
          ? `${ctaClean(ctaUser)} sekarang!`.replace(/sekarang sekarang/i, 'sekarang')
          : c.email || c.wa || c.url
            ? `Kirim ${docW} kamu sekarang!`
            : ctaPick('lowongan');
      value = c.email ? clip(c.email, 26) : c.wa ? `WA ${c.wa}` : c.url ? clip(c.url.replace(/^https?:\/\//, ''), 26) : partner ? 'Daftar' : 'Kirim CV';
      if (deadline) body = `Paling lambat ${deadline}`;
    } else if (intent === 'event') {
      const invite = /pernikahan|resepsi|akad|walimah|syukuran|aqiqah|khitan|undangan|save the date/i.test(low);
      const publik = !invite && PUBLIC_EVENT.test(low);
      const submit = /\b(lomba|kompetisi|sayembara|giveaway|challenge)\b/.test(low) && /\b(kirim|upload|unggah|posting|submit|setor)\b/.test(low);
      title = deadline
        ? `${submit ? 'Kirim karyamu' : 'Daftar'} sebelum ${deadline}!`
        : ctaUser && words(ctaClean(ctaUser)).length >= 2
          ? `${ctaClean(ctaUser)}!`
          : c.url && !invite && !publik
            ? 'Daftar lewat link ini, yuk!'
            : ctaPick(invite ? 'undangan' : publik ? 'eventPublik' : 'event');
      value = c.url ? clip(c.url.replace(/^https?:\/\//, ''), 26) : c.email ? clip(c.email, 26) : c.wa ? `WA ${c.wa}` : invite ? 'Hadir Ya!' : publik ? 'Datang Yuk!' : 'Daftar Sekarang';
    } else if (intent === 'pengumuman') {
      title = /libur|tutup|maintenance|renovasi|perubahan/i.test(low) ? 'Mohon maaf atas ketidaknyamanannya' : ctaPick('pengumuman');
      body = store || brandHandle;
      value = c.wa ? `WA ${c.wa}` : undefined;
    } else if (intent === 'launching') {
      const opening = /\b(grand opening|soft opening|opening|baru buka|resmi buka|pembukaan)\b/i.test(low);
      title = ctaUser && words(ctaClean(ctaUser)).length >= 2 ? `${ctaClean(ctaUser)}!` : c.app ? `Download di ${c.app}, yuk!` : ctaPick(opening ? 'opening' : isAppLaunch ? 'launching' : 'launchingProduk');
      value = c.app ? c.app : c.url ? clip(c.url.replace(/^https?:\/\//, ''), 26) : c.wa ? `WA ${c.wa}` : opening ? 'Datang Yuk!' : isAppLaunch ? 'Coba Sekarang' : undefined;
    } else if (intent === 'ucapan') {
      const rel = /\b(?:untuk|buat|kepada|teruntuk)\s+(istri|suami|pacar|sayang)/i.test(prompt) ? 'cinta' : /\b(?:untuk|buat|kepada|teruntuk)\s+(ibu|ayah|bapak|mama|papa|mamah|papah|bunda|adik|kakak|abang|anak|nenek|kakek|sahabat|bestie|teman)/i.test(prompt) ? 'sayang' : '';
      title = store ? `Dari kami, ${store}` : rel === 'cinta' ? 'Dengan penuh cinta' : rel === 'sayang' ? 'Dengan penuh sayang' : 'Salam hangat';
      body = brandHandle;
    } else if (category === 'promo') {
      const prop = promoKind === 'properti';
      const verb = promoKind === 'kelas' || promoKind === 'travel' ? 'daftar' : promoKind === 'jasa' || promoKind === 'sewa' ? 'booking' : 'order';
      const isPO = /\b(po|pre[-\s]?order|open po|buka po)\b/.test(low);
      const ctaU = ctaUser ? ctaClean(ctaUser) : '';
      if (ctaUser && /\b(sebelum|sampai|paling lambat|maks(?:imal)?)\s*[.!]?$/i.test(ctaUser) && deadline) title = `${ctaU} sebelum ${deadline}!`;
      else if (ctaU && words(ctaU).length >= 2 && !/^(cek|follow)/i.test(ctaU)) title = `${ctaU}!`;
      else if (c.wa && !title)
        title = prop
          ? 'Hubungi via WhatsApp untuk survei'
          : verb === 'order'
            ? ['Order via WhatsApp sekarang!', 'Pesan lewat WhatsApp, yuk!', 'Chat kami di WhatsApp sekarang!'][seeded(seed + 3, 3)]
            : `${verb === 'daftar' ? 'Daftar' : 'Booking'} via WhatsApp, yuk!`;
      else if (c.phone) title = prop ? 'Hubungi kami untuk survei' : 'Hubungi kami sekarang!';
      else if (c.food) title = `Pesan lewat ${c.food}, yuk!`;
      else if (c.shop) title = `Checkout sekarang di ${c.shop}!`;
      else if (c.url) title = prop ? 'Lihat info lengkapnya di link' : `Klik link untuk ${verb}`;
      else if (c.bio) title = prop ? 'Info lengkap di link bio' : verb === 'order' ? 'Klik link di bio & checkout' : `Klik link di bio untuk ${verb}`;
      else if (c.dm) title = prop ? 'DM untuk info & jadwal survei' : `DM sekarang untuk ${verb}!`;
      else if (c.handle) title = `Cek ${c.handleNet === 'tiktok' ? 'TikTok' : 'IG'} ${c.handle} sekarang!`;
      else if (isPO && !prop) title = deadline ? `Ikut PO sebelum ${deadline}, yuk!` : 'Ikut PO sekarang, yuk!';
      else title = ctaPick(promoKind ? `promo-${promoKind}` : 'promo');
      value = c.wa ? `WA ${c.wa}` : c.phone ? c.phone : c.food ? c.food : c.shop ? 'Checkout' : c.url ? clip(c.url.replace(/^https?:\/\//, ''), 26) : prop ? 'Hubungi Kami' : verb === 'daftar' ? 'Daftar Sekarang' : verb === 'booking' ? 'Booking Sekarang' : undefined;
      if (urgency.length && !/terbatas|kehabisan/i.test(title)) body = [urgency[0], brandHandle || store].filter(Boolean).join(' · ');
    } else {
      title = ctaPick(category === 'quote' ? 'quote' : 'edukasi');
      body = brandHandle;
    }
    return { role: 'cta', title, body: body || undefined, value, icon: intent === 'lowongan' ? 'send' : intent === 'event' ? 'ticket' : category === 'promo' ? 'shopping-cart' : category === 'quote' ? 'heart' : 'bookmark', _p: 0 };
  };

  /* ---------- daftar dari bank ---------- */
  const listed = listItems.map((x) => x.text).filter(Boolean);
  let more: (() => Item | null) | null = null;
  // scene cadangan yang dipakai saat user menambah jumlah scene (setelah `more` habis)
  let extra: Item[] = [];
  const promoExtras = (name = product): Item[] => {
    const via = c.wa ? `Chat WA ${c.wa}` : c.phone ? `Telepon ${c.phone}` : c.food ? `Pesan lewat ${c.food}` : c.shop ? `Checkout di ${c.shop}` : c.url ? `Buka ${clip(c.url.replace(/^https?:\/\//, ''), 24)}` : c.bio ? 'Klik link di bio' : c.dm ? 'Kirim DM ke kami' : c.handle ? `DM ${c.handle}` : location && promoKind === 'tempat' ? `Datang ke ${clip(location, 26)}` : 'Hubungi kami';
    const kindWord = promoKind === 'jasa' || promoKind === 'sewa' ? 'booking' : promoKind === 'kelas' || promoKind === 'travel' ? 'daftar' : promoKind === 'properti' ? 'survei' : 'order';
    const choose = promoKind === 'jasaOrder' ? 'Ceritakan kebutuhanmu' : promoKind === 'jasa' || promoKind === 'sewa' ? 'Pilih jadwal yang pas' : promoKind === 'kelas' ? 'Pilih kelas yang cocok' : promoKind === 'travel' ? 'Pilih paket & tanggal' : isMenu || promoKind === 'tempat' || promoKind === 'kuliner' ? 'Pilih menu favoritmu' : 'Pilih produk favoritmu';
    const steps = promoKind === 'properti' ? [via, 'Atur jadwal survei', 'Cek lokasinya langsung'] : [choose, via, kindWord === 'daftar' ? 'Konfirmasi pendaftaranmu' : 'Konfirmasi pesananmu'];
    return [
      { role: 'masalah', title: 'Masih ragu?', body: 'Tanya-tanya dulu juga boleh, kok', icon: 'message-circle', _p: 5 },
      { role: 'poin', title: `Cara ${kindWord}`, value: steps.join('|'), icon: 'list-checks', _p: 5 },
      ...(deadline || urgency[0] ? [{ role: 'info' as SceneRole, title: deadline ? `Berlaku s.d. ${deadline}` : urgency[0], body: 'Jangan sampai kelewatan', icon: 'clock', _p: 5 }] : []),
      { role: 'produk', title: name, body: [price, featuresClean[0]].filter(Boolean).join(' · ') || undefined, value: discount && !/^B\d/.test(discount) ? discount : undefined, icon: iconFor(name, 'shopping-bag'), _p: 5 },
    ];
  };
  const engage = (q: string, b: string): Item => ({ role: 'poin', title: q, body: b, icon: 'message-circle', _p: 5 });

  /* ================================================================== */
  switch (intent) {
    case 'promo-produk':
    case 'flash-sale':
    case 'menu-kuliner': {
      if (intent === 'menu-kuliner' && isMenu) {
        push('hook', hookOf('kuliner'), urgency[0] || (e.campaign ? `Promo ${e.campaign}` : ''), undefined, iconFor(product, 'utensils'), false, 0);
        menu.slice(0, 6).forEach((x, i) => push('produk', TC(x.text), '', x.price ? formatRupiah(x.price) : undefined, iconFor(x.text, 'utensils'), false, i < 3 ? 2 : 4));
        featureScene(featuresClean, 'Kenapa harus coba?', 3);
        push('harga', price || 'Harga bersahabat', oldPrice || priceNote, discount, 'tag', !price, 2);
        pushInfo();
        proofs();
        let k = 6;
        const menuSplit = splitMore(featuresClean);
        more = () => (k < menu.length ? { role: 'produk', title: TC(menu[k].text), value: menu[k].price ? formatRupiah(menu[k++].price as number) : (k++, undefined), icon: 'utensils', _p: 4 } : menuSplit());
        extra = promoExtras(product);
        break;
      }
      const isJasa = JASA_RE.test(low);
      const key = intent === 'flash-sale' ? 'flash-sale' : intent === 'menu-kuliner' ? 'kuliner' : isJasa && !discount ? 'jasa' : 'promo';
      const jamM = /\b(\d+)\s*jam\b/i.exec(prompt);
      const hv = { ...vars, durasi: jamM ? `${jamM[1]} jam` : vars.durasi };
      const bxgy = /^B(\d+)G(\d+)$/.exec(discount || '');
      const hookBody = dedupeLines(
        [
          intent === 'flash-sale' && vars.diskon ? `Diskon ${vars.diskon}` : '',
          bxgy ? `Beli ${bxgy[1]} gratis ${bxgy[2]}` : '',
          urgency[0] || (e.rel.includes('hari ini') ? 'Khusus hari ini' : ''),
          deadline ? `${/\b(po|pre[-\s]?order|open po|buka po)\b/.test(low) ? 'PO' : /\b(order|pesan|pemesanan)\b[^.]{0,14}\b(sebelum|s\.d|sampai|paling lambat)/.test(low) ? 'Order' : 'Berlaku'} s.d. ${deadline}` : '',
          campaign && !product.includes(campaign) ? `Promo ${campaign}` : '',
        ].filter(Boolean)
      ).join(' · ');
      const saleWord = /cuci gudang/.test(low) ? 'CUCI GUDANG' : /clearance/.test(low) ? 'CLEARANCE SALE' : /mega sale/.test(low) ? 'MEGA SALE' : /big sale/.test(low) ? 'BIG SALE' : /harbolnas/.test(low) ? 'HARBOLNAS' : 'FLASH SALE';
      let hookTxt: string;
      if (promoKind === 'properti' && /\b(kos|kost|kosan|kos-kosan|kontrakan)\b/.test(low) && !/\bdijual\b/.test(low)) {
        hookTxt = pickTemplate(['{produk}, cuma {hargaPas}', 'Lagi cari kos? Cek {produk}', '{produk}, {hargaPas}'], hv, seed, ['hargaPas']);
      } else if (promoKind === 'properti') {
        const jual = /\b(disewakan|dikontrakkan|sewa|kontrak)\b/.test(low) ? 'Disewakan' : 'Dijual';
        hookTxt = hookOf('properti', { ...hv, jual, lokasi: location }, seed, ['lokasi', 'hargaPas']);
      } else if (bxgy) {
        hookTxt = [`Beli ${bxgy[1]} gratis ${bxgy[2]}! Khusus ${product}`, `Promo beli ${bxgy[1]} gratis ${bxgy[2]} buat ${product}!`][seeded(seed, 2)];
      } else {
        const hv2 = intent === 'flash-sale' && campaign ? { ...hv, kampanye: campaign } : hv;
        hookTxt = hookOf(key, hv2, seed, vars.diskon ? ['diskon', 'kampanye'] : price ? ['hargaPas', 'hargaMulai'] : []).replace(/FLASH SALE/g, saleWord);
      }
      const hookLow = hookTxt.toLowerCase();
      // keterangan di bawah hook tidak mengulang isi hook ("Buruan! …" + "Buruan")
      const hookBody2 = hookBody
        .split(' · ')
        .filter((b) => {
          if (!b) return false;
          const bl = b.toLowerCase();
          if (hookLow.includes(bl)) return false;
          if (vars.diskon && b.startsWith('Diskon') && hookTxt.includes(vars.diskon)) return false;
          if (campaign && b.includes(campaign) && hookTxt.includes(campaign)) return false;
          const bw = words(bl).filter((w) => w.length > 3);
          return !(bw.length && bw.every((w) => hookLow.includes(w)));
        })
        .join(' · ');
      push('hook', hookTxt, hookBody2, undefined, intent === 'flash-sale' ? 'zap' : iconFor(product, intent === 'menu-kuliner' ? 'utensils' : 'flame'), false, 0);
      push('produk', product, productDesc || (store && store !== product ? `Hanya di ${store}` : ''), undefined, iconFor(product, isJasa ? 'sparkles' : 'shopping-bag'), junk, 1);
      if (isMenu) {
        // beberapa harga (varian/layanan) → satu scene daftar harga, bisa dipecah saat scene ditambah
        const priceList = menu.slice(0, 5).map((x) => `${TC(x.text)} — ${x.price ? formatRupiah(x.price) : ''}`.replace(/\s—\s$/, ''));
        push('poin', promoKind === 'kuliner' || promoKind === 'tempat' ? 'Pilihan menunya' : 'Daftar harga', '', priceList.join('|'), 'tag', false, 2);
      }
      if (contentList && listed.length >= 2 && !isMenu)
        push(
          'poin',
          /topping/i.test(list.label || '')
            ? 'Pilihan topping'
            : /fasilitas/i.test(list.label || '')
              ? 'Fasilitas'
              : /fitur/i.test(list.label || '')
                ? 'Fiturnya'
                : /materi/i.test(list.label || '')
                  ? 'Materinya'
                  : /benefit/i.test(list.label || '')
                    ? 'Benefitnya'
                    : /isi|berisi/i.test(list.label || '') || /\b(paket|hampers|bundling|parcel)\b/i.test(low)
                      ? 'Isi paketnya'
                      : 'Yang kamu dapat',
          '',
          listed.slice(0, 5).map((x) => SC(x)).join('|'),
          'package',
          false,
          3
        );
      featureScene(featuresClean, undefined, 3);
      if (price) push('harga', price, oldPrice || priceNote, discount, intent === 'flash-sale' ? 'badge-percent' : 'tag', false, 2);
      pushInfo();
      proofs();
      more = splitMore(featuresClean);
      extra = promoExtras(product);
      break;
    }
    case 'launching': {
      const bxgyL = /^B(\d+)G(\d+)$/.exec(discount || '');
      const opening = /\b(grand opening|soft opening|opening|baru buka|resmi buka|pembukaan)\b/i.test(low);
      const name = opening && store && productGeneric ? store : product;
      product = name;
      push('hook', hookOf(opening ? 'opening' : 'launching', { ...vars, produk: name }), opening && date ? `${date}${time ? ` · ${time}` : ''}` : '', undefined, opening ? 'party-popper' : 'rocket', false, 0);
      push('produk', name, productDesc || (store && store !== name ? `Persembahan ${store}` : ''), undefined, iconFor(name, opening ? 'store' : 'sparkles'), false, 1);
      // diskon pembukaan/peluncuran jadi poin tersendiri ("Diskon 50% semua menu (hari pertama)")
      const scopeF = featuresClean.find((f) => /^semua\b/i.test(f));
      const discF = vars.diskon ? `Diskon ${vars.diskon}${scopeF ? ` ${scopeF.toLowerCase()}` : scope ? ` ${scope.replace(/^Berlaku untuk /, '')}` : ''}${urgency[0] ? ` (${urgency[0].toLowerCase()})` : ''}` : bxgyL ? `Beli ${bxgyL[1]} gratis ${bxgyL[2]}` : '';
      const feats = dedupeLines([...(discF ? [discF] : []), ...listed.map((x) => SC(x)), ...featuresClean.filter((f) => f !== scopeF && !(discF && f === scope))]);
      if (feats.length) featureScene(feats, opening ? 'Ada apa saja?' : isAppLaunch ? 'Fitur unggulan' : 'Kenapa wajib coba?', 2);
      if (price) push('harga', price, oldPrice || priceNote, discount || 'BARU', 'tag', false, 3);
      const when = date ? `${date}${time ? ` · ${time}` : ''}` : '';
      if (opening) {
        // tanggal pembukaan sudah tampil di bawah hook; scene info cukup lokasinya
        if (where) push('info', 'Lokasi', where, undefined, e.online && !location ? 'globe' : 'map-pin', false, 2);
      } else {
        if (date) push('info', `Rilis ${date}`, time || where || '', undefined, 'calendar', false, 2);
        else if (where) push('info', e.online && !location ? 'Online' : 'Lokasi', where, undefined, e.online && !location ? 'globe' : 'map-pin', false, 2);
      }
      more = splitMore(feats);
      const isApp = isAppLaunch;
      extra = opening
        ? [
            { role: 'info', title: 'Ajak temanmu', body: 'Lebih seru kalau datang bareng', icon: 'users', _p: 5 },
            { role: 'info', title: name, body: [when, where].filter(Boolean).join(' · ') || 'Ditunggu kedatanganmu!', icon: 'store', _p: 5 },
          ]
        : isApp
          ? [
              { role: 'poin', title: 'Cara mulai', value: [c.url ? `Buka ${clip(c.url.replace(/^https?:\/\//, ''), 24)}` : 'Download lewat link di bio', 'Daftar akunmu', 'Langsung coba fiturnya'].join('|'), icon: 'list-checks', _p: 5 },
              { role: 'masalah', title: 'Masih ragu?', body: 'Coba dulu, rasakan sendiri bedanya', icon: 'message-circle', _p: 5 },
            ]
          : promoExtras(name);
      break;
    }
    case 'event': {
      const invite = /pernikahan|resepsi|akad|walimah|syukuran|aqiqah|khitan|undangan|save the date/i.test(low);
      const qTitle = /"([^"\n]{3,60})"/.exec(prompt);
      const headClause = clauses[headIdx] || '';
      let acara = (qTitle && headClause.includes(`"${qTitle[1]}"`) ? `${headClause.slice(0, headClause.indexOf(`"${qTitle[1]}"`))} ${qTitle[1]}` : headClause)
        .split(':')[0]
        .replace(/\b(gratis|free)\b/gi, ' ')
        .replace(/\b(hari ini|malam ini|besok|lusa|minggu ini|minggu depan|bulan ini|bulan depan|akhir pekan(?: ini)?|weekend(?: ini)?)\b/gi, ' ');
      if (!qTitle)
        acara = acara.replace(/\s(?:di(?!\s+(?:TikTok|Tiktok|Shopee|Tokopedia|Instagram|IG|YouTube|Youtube|Facebook|WhatsApp|Google|Canva|CapCut|Excel)\b)|ke|untuk|mulai|htm|tiket|daftar|via|lewat|bersama|oleh|jam|pukul|tanggal|tgl|hadiah|kuota|ada|dengan|pada|diskon|potongan|harga|promo|semua)\b.*$/i, '');
      acara = acara
        .replace(/^\s*(acara|event)\s+/i, '')
        .replace(/["“”]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!acara) acara = productRaw || 'Acara Spesial';
      const acaraTC = opts.product || TC(words(acara).slice(0, 7).join(' '));
      product = acaraTC;
      push('hook', hookOf(invite ? 'undangan' : 'event', { ...vars, acara: acaraTC, tgl: date }), gratis ? 'Gratis!' : store && e.storeVia !== 'di' ? `Oleh ${store}` : '', undefined, invite ? 'heart' : 'calendar', false, 0);
      if (invite) push('produk', acaraTC, '', undefined, 'heart', false, 1);
      if (date) push('info', date, time || '', date, 'calendar', false, 1);
      else if (deadline) push('info', `Pendaftaran s.d. ${deadline}`, time || '', deadline, 'calendar', false, 1);
      else push('info', 'Tanggal acara', 'Isi tanggal & jam acaramu', undefined, 'calendar', true, 1);
      let whereEv = where;
      if (!whereEv && store && e.storeVia === 'di') whereEv = store;
      if (!whereEv) {
        const capCl = clauses.find((cl, i) => i !== headIdx && /^[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){1,3}$/.test(cl.trim()) && !cl.trim().startsWith('@'));
        if (capCl) whereEv = capCl.trim();
      }
      const evOnline = !whereEv && /\b(webinar|online|daring|live (?:ig|instagram|tiktok|youtube)|zoom|gmeet|google meet)\b/.test(low);
      const contest = /\b(lomba|kompetisi|sayembara|giveaway|challenge|kuis|quiz)\b/.test(low);
      if (whereEv || evOnline) push('info', e.online && !location ? 'Online' : evOnline ? 'Online' : 'Lokasi', whereEv || 'Ikuti dari mana saja', undefined, e.online || evOnline ? 'video' : 'map-pin', false, 1);
      else if (contest && (c.email || c.url || c.wa)) push('info', 'Cara ikut', c.email ? `Kirim karya ke ${c.email}` : c.url ? `Daftar di ${clip(c.url.replace(/^https?:\/\//, ''), 28)}` : `Daftar via WA ${c.wa}`, undefined, 'send', false, 1);
      else if (!contest) push('info', 'Tempat acara', 'Isi lokasi acaramu', undefined, 'map-pin', true, 1);
      if (e.speaker) push('info', /kajian|pengajian|tabligh|ceramah|majelis/.test(low) ? 'Pengisi kajian' : /konser|live music|music/.test(low) ? 'Penampil' : 'Pembicara', e.speaker, undefined, 'users', false, 2);
      const prizeTxt = !prize ? /\bhadiah\s+((?:jutaan|ratusan|puluhan|menarik|total|utama|berupa|uang|voucher|merchandise|hp|motor|sepeda|emas|trofi|piala|sertifikat)[^,.\n]*)/i.exec(prompt)?.[1] : undefined;
      const evDisc = vars.diskon ? `Diskon ${vars.diskon}${scope ? ` ${scope.replace(/^Berlaku untuk /, '')}` : ''}` : '';
      const feats = dedupeLines([
        ...(evDisc ? [evDisc] : []),
        ...(prize ? [`Hadiah total ${formatRupiah(prize.value)}`] : prizeTxt ? [SC(`hadiah ${prizeTxt.trim()}`)] : []),
        ...listed.map((x) => SC(x)),
        ...featuresClean.filter((f) => !/^gratis$/i.test(f) && !fromHead.has(f) && f !== whereEv && !(evDisc && f === scope)),
      ]);
      if (feats.length) featureScene(feats, /lomba|kompetisi|turnamen/i.test(low) ? 'Info lomba' : /webinar|seminar|workshop|kelas|kajian|talkshow/i.test(low) ? 'Yang kamu dapat' : 'Ada apa saja?', 3);
      if (ticket && !opts.price) push('harga', formatRupiah(ticket.value), '', undefined, 'ticket', false, 2);
      else if (price && !invite) push('harga', price, oldPrice || priceNote, discount, 'ticket', false, 2);
      else if (gratis) push('harga', 'GRATIS', /kuota|terbatas/i.test(low) ? 'Kuota terbatas' : '', undefined, 'ticket', false, 3);
      more = splitMore(feats);
      const publik = PUBLIC_EVENT.test(low);
      extra = [
        ...(!invite && !publik
          ? [{ role: 'poin' as SceneRole, title: 'Cara daftar', value: [c.url ? `Buka ${clip(c.url.replace(/^https?:\/\//, ''), 24)}` : c.wa ? `Chat WA ${c.wa}` : 'Klik link di bio', 'Isi data dirimu', 'Simpan bukti pendaftaran'].join('|'), icon: 'list-checks', _p: 5 }]
          : []),
        invite
          ? { role: 'kutipan', title: 'Merupakan suatu kehormatan bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i', icon: 'heart', _p: 5 }
          : { role: 'info', title: 'Ajak temanmu', body: e.online ? 'Ikut bareng lebih seru' : 'Lebih seru kalau datang bareng', icon: 'users', _p: 5 },
        { role: 'info', title: acaraTC, body: [date || (deadline ? `Daftar s.d. ${deadline}` : ''), where].filter(Boolean).join(' · ') || undefined, icon: 'calendar', _p: 5 },
      ];
      break;
    }
    case 'tips': {
      const kind = /\b(kesalahan|salah kaprah|hindari|dihindari|jangan lakukan|pantangan|larangan)\b/i.test(low) ? 'kesalahan' : /\b(manfaat|keuntungan|kelebihan|khasiat)\b/i.test(low) ? 'manfaat' : /\b(bahaya|waspada|modus|penipuan|scam|ciri-ciri|ciri)\b/i.test(low) ? 'waspada' : 'tips';
      const topicDomain = pickDomain(`${topicFull} ${topicInfo.goal}`.toLowerCase());
      const lowDomain = pickDomain(low);
      const GENERAL = new Set(['umum', 'hemat', 'keuangan', 'produktif']);
      const domain = topicDomain !== 'umum' && !(GENERAL.has(topicDomain) && !GENERAL.has(lowDomain)) ? topicDomain : lowDomain;
      let bank: Line[] = [];
      let sample = false;
      if (kind === 'kesalahan') bank = MISTAKES[domain] || MISTAKES.umum;
      else if (kind === 'waspada') bank = TIPS[domain] && domain !== 'umum' ? TIPS[domain] : [];
      else if (kind === 'manfaat') bank = BENEFITS.find((x) => x.re.test(low))?.lines || [];
      else if (domain !== 'umum') bank = TIPS[domain];
      if (!bank.length) {
        sample = true;
        const label = kind === 'manfaat' ? 'Manfaat' : kind === 'kesalahan' ? 'Kesalahan' : kind === 'waspada' ? 'Poin' : 'Tips';
        bank = Array.from({ length: 10 }, (_, i) => [`${label} #${i + 1}`, `Tulis ${label.toLowerCase()} soal ${clip(topicCore || 'topikmu', 30)} di sini`] as Line);
      }
      const n = Math.max(2, Math.min(8, Math.max(listed.length, nAsked || 3)));
      const hv = { ...vars, n: String(n), topik: kind === 'waspada' ? (topicFull || lowerFirst(product)).replace(/^(?:bahaya|waspada|hati-hati(?:\s+dengan)?|modus|ciri-ciri|ciri)\s+/i, '') : topicFull || lowerFirst(product) };
      const hookBody = topicInfo.goal && topicInfo.topic ? SC(`biar ${topicInfo.goal}`) : topicInfo.before && words(topicInfo.before).length >= 3 ? SC(topicInfo.before) : 'Simpan biar nggak lupa';
      // "7 kebiasaan orang sukses" → hook memakai kata bendanya sendiri, bukan "7 tips kebiasaan …"
      const listNoun = countM && /^(kebiasaan|ciri|hal)$/i.test(countM[2]) ? countM[2].toLowerCase() : '';
      const tipsHook = listNoun ? `${n} ${listNoun} ${hv.topik?.replace(new RegExp(`^${listNoun}\\s+`, 'i'), '') || ''}`.trim() : hookOf(kind, hv, seed, nAsked ? ['n'] : []);
      push('hook', tipsHook, /simpan/i.test(tipsHook) && /simpan/i.test(hookBody) ? '' : hookBody, undefined, kind === 'kesalahan' || kind === 'waspada' ? 'alert-triangle' : kind === 'manfaat' ? 'heart' : 'lightbulb', false, 0);
      const keys = words(`${topicFull} ${topicInfo.goal}`.toLowerCase())
        .map((w) => w.replace(/(nya|ku|mu)$/, ''))
        .filter((w) => w.length >= 4 && !STOP.has(w));
      if (!sample) bank = rankBank(bank, keys, (l) => `${l[0]} ${l[1]}`, seed);
      let bi = 0;
      const nextBank = () => bank[bi++ % bank.length];
      for (let i = 0; i < n; i++) {
        if (listed[i]) push('poin', SC(listed[i]), '', String(i + 1), undefined, false, 2);
        else {
          const [t, b] = nextBank();
          push('poin', t, b, String(i + 1), undefined, sample, 2);
        }
      }
      let k = n;
      more = () => {
        if (k >= 10 || (nAsked && k >= nAsked)) return null;
        const [t, b] = nextBank();
        k++;
        return { role: 'poin', title: t, body: b, value: String(k), icon: iconFor(t), _p: 2, ...(sample ? { placeholder: true } : {}) };
      };
      extra = [engage(kind === 'kesalahan' ? 'Kamu pernah yang mana?' : kind === 'manfaat' ? 'Sudah rutin melakukannya?' : 'Kamu sudah coba yang mana?', 'Cerita di kolom komentar, yuk')];
      break;
    }
    case 'tutorial': {
      const resep = /\bresep\b/i.test(low);
      const stepBank = STEPS.find((s) => s.re.test(low));
      const userSteps = listed.length >= 2 ? listed : [];
      const seqSteps = !userSteps.length ? prompt.split(/\b(?:lalu|kemudian|terus|setelah itu|selanjutnya|terakhir)\b/i).map((x) => x.trim().replace(/^[,.\s]+|[,.\s]+$/g, '')).filter((x) => x.length > 3) : [];
      const steps = userSteps.length ? userSteps : seqSteps.length >= 3 ? seqSteps.slice(1) : [];
      // tanpa langkah bawaan → pakai tips sebidang (cara hemat listrik, cara merawat kucing, …)
      const tDom = !stepBank && !steps.length ? pickDomain(`${topicFull} ${topicInfo.goal}`.toLowerCase()) : 'umum';
      const tipSteps = tDom !== 'umum' ? TIPS[tDom] || [] : [];
      const stepSrc = stepBank || (tipSteps.length ? { re: /x/, lines: tipSteps } : undefined);
      const n = Math.max(2, Math.min(8, nAsked || steps.length || (stepSrc ? Math.min(5, stepSrc.lines.length) : 4)));
      const hv = { ...vars, n: String(n), topik: topicFull || lowerFirst(product) };
      push('hook', hookOf(resep ? 'resep' : 'tutorial', hv), resep ? 'Simpan resepnya!' : 'Ikuti sampai selesai', undefined, resep ? 'chef-hat' : 'list-checks', false, 0);
      const bahan = /\bbahan(?:-bahan)?\s*:\s*([^\n.]+)/i.exec(prompt);
      if (bahan) {
        const b = bahan[1].split(/,|;|\s+dan\s+/i).map((x) => SC(x.trim())).filter((x) => x.length > 1);
        if (b.length >= 2) push('poin', 'Bahan-bahan', '', b.slice(0, 6).join('|'), 'clipboard-list', false, 3);
      }
      const stepItem = (i: number): Item =>
        steps[i]
          ? { role: 'langkah', title: SC(steps[i]), value: String(i + 1), icon: iconFor(steps[i], 'list-checks'), _p: 2 }
          : stepSrc?.lines[i]
            ? { role: 'langkah', title: stepSrc.lines[i][0], body: stepSrc.lines[i][1], value: String(i + 1), icon: iconFor(stepSrc.lines[i][0], 'list-checks'), _p: 2 }
            : { role: 'langkah', title: `Langkah ${i + 1}`, body: `Tulis langkah ke-${i + 1} di sini`, value: String(i + 1), icon: 'list-checks', placeholder: true, _p: 2 };
      for (let i = 0; i < n; i++) items.push(stepItem(i));
      push('bukti', resep ? 'Siap disajikan!' : 'Selesai! Gampang, kan?', '', undefined, 'party-popper', false, 6);
      let k = n;
      const maxStep = Math.max(n, steps.length, stepSrc?.lines.length || 0);
      more = () => (k < maxStep && !(nAsked && k >= nAsked) ? stepItem(k++) : null);
      extra = [engage(resep ? 'Sudah coba bikin?' : 'Berhasil dicoba?', resep ? 'Tunjukkan hasil masakanmu di komentar' : 'Ceritakan hasilnya di komentar, yuk')];
      break;
    }
    case 'fakta': {
      const f = FACTS.find((x) => x.re.test(low));
      const avail = listed.length + (f ? f.lines.length : 0);
      const n = Math.max(2, Math.min(8, nAsked ? (avail ? Math.min(nAsked, avail) : nAsked) : listed.length || 3));
      const hv = { ...vars, n: String(n), topik: topicCore || lowerFirst(product) };
      const faktaHook = hookOf('fakta', hv, seed, nAsked ? ['n'] : []);
      push('hook', faktaHook, listed.length || f ? (/kaget/i.test(faktaHook) ? 'Simak sampai akhir, ya' : 'Nomor terakhir paling bikin kaget') : '', undefined, 'lightbulb', false, 0);
      const factItem = (i: number): Item => {
        if (listed[i]) return { role: 'poin', title: SC(listed[i]), value: String(i + 1), icon: 'lightbulb', _p: 2 };
        const j = i - Math.min(i, listed.length);
        if (f && j < f.lines.length) {
          const [t, b] = f.lines[(seed + j) % f.lines.length];
          return { role: 'poin', title: t, body: b, value: String(i + 1), icon: 'lightbulb', _p: 2 };
        }
        return { role: 'poin', title: `Fakta #${i + 1}`, body: `Tulis fakta soal ${clip(topicCore || 'topikmu', 28)} di sini (cek sumbernya ya)`, value: String(i + 1), icon: 'lightbulb', placeholder: true, _p: 2 };
      };
      for (let i = 0; i < n; i++) items.push(factItem(i));
      let k = n;
      const maxFact = Math.max(n, listed.length + (f ? f.lines.length : 0));
      more = () => (k < Math.min(8, maxFact) && !(nAsked && k >= nAsked) ? factItem(k++) : null);
      extra = [engage('Kamu baru tahu yang mana?', 'Tulis nomornya di kolom komentar')];
      break;
    }
    case 'travel': {
      const dayM = /\b(\d+)\s*hari(?:\s*(\d+)\s*malam)?|\b(\d+)d(\d+)n\b/i.exec(prompt);
      const days = dayM ? Math.min(5, Number(dayM[1] || dayM[3])) : 0;
      const places = city?.lines || [];
      const kota = cityName || (topicCore && words(topicCore).length <= 3 ? TC(topicCore) : 'kotamu');
      const foods = city ? CITY_FOODS[city.name] || [] : [];
      const wantsFood = /\b(tempat makan|kuliner|makanan khas|jajanan|makan enak|resto|restoran|cafe|kafe|warung|oleh-oleh|oleh oleh)\b/.test(low);
      const hemat = /\b(hemat|murah|budget|irit|backpacker|low budget)\b/.test(low) ? 'ya' : undefined;
      if (wantsFood && foods.length && days < 2) {
        const n = Math.max(2, Math.min(foods.length, nAsked || foods.length));
        push('hook', hookOf('kulinerKota', { ...vars, kota, n: String(n) }, seed, nAsked ? ['n'] : []), 'Simpan buat referensi', undefined, 'utensils', false, 0);
        for (let i = 0; i < n; i++) push('poin', foods[i][0], foods[i][1], String(i + 1), 'utensils', false, 2);
        extra = TIPS.travel.map(([t, b]): Item => ({ role: 'poin', title: t, body: b, icon: 'lightbulb', _p: 5 }));
      } else if (days >= 2) {
        push('hook', hookOf('itinerary', { ...vars, kota, hemat }), budget ? `Budget ${formatRupiah(budget.value)}` : 'Simpan buat liburanmu', undefined, 'plane', false, 0);
        for (let d = 0; d < days; d++) {
          const a = places[d * 2];
          const b = places[d * 2 + 1];
          const lastDay = d === days - 1;
          if (a) push('poin', `Hari ${d + 1}: ${a[0]}${b ? ` & ${b[0]}` : ''}`, a[1], String(d + 1), 'map-pin', false, 2);
          else if (lastDay && d > 0) push('poin', `Hari ${d + 1}: Oleh-oleh & pulang`, foods[0] ? `Bawa pulang ${foods.slice(0, 2).map((x) => x[0].toLowerCase()).join(' atau ')}` : 'Santai sejenak sebelum perjalanan pulang', String(d + 1), 'map-pin', false, 2);
          else if (foods.length && d > 0) push('poin', `Hari ${d + 1}: Wisata kuliner`, `Cobain ${foods.slice(0, 2).map((x) => x[0].toLowerCase()).join(' & ')}`, String(d + 1), 'utensils', false, 2);
          else push('poin', `Hari ${d + 1}`, `Tulis tujuan hari ke-${d + 1}`, String(d + 1), 'map-pin', true, 2);
        }
        if (budget) push('info', 'Budget', formatRupiah(budget.value), undefined, 'wallet', false, 3);
        let pk = days * 2;
        more = () => (pk < places.length ? { role: 'poin', title: `Bonus: ${places[pk][0]}`, body: places[pk++][1], icon: 'map-pin', _p: 3 } : null);
        extra = TIPS.travel.map(([t, b]): Item => ({ role: 'poin', title: t, body: b, icon: 'lightbulb', _p: 5 }));
      } else {
        const n = Math.max(2, Math.min(8, nAsked || listed.length || (places.length ? 5 : 4)));
        const travelHook = hookOf('travel', { ...vars, kota, n: String(n) }, seed, nAsked ? ['n'] : []);
        push('hook', travelHook, /simpan/i.test(travelHook) ? '' : 'Simpan biar nggak lupa', undefined, 'plane', false, 0);
        const placeItem = (i: number): Item =>
          listed[i]
            ? { role: 'poin', title: SC(listed[i]), value: String(i + 1), icon: 'map-pin', _p: 2 }
            : places[i]
              ? { role: 'poin', title: places[i][0], body: places[i][1], value: String(i + 1), icon: 'map-pin', _p: 2 }
              : { role: 'poin', title: `Spot #${i + 1}`, body: `Tulis nama tempat di ${kota}`, value: String(i + 1), icon: 'map-pin', placeholder: true, _p: 2 };
        for (let i = 0; i < n; i++) items.push(placeItem(i));
        let k = n;
        const maxPlace = Math.max(n, listed.length, places.length);
        more = () => (k < Math.min(8, maxPlace) && !(nAsked && k >= nAsked) ? placeItem(k++) : null);
        extra = TIPS.travel.map(([t, b]): Item => ({ role: 'poin', title: t, body: b, icon: 'lightbulb', _p: 5 }));
      }
      break;
    }
    case 'testimoni': {
      const personalReview = !/"/.test(prompt) && !listed.length && /\breview\b/i.test(low) && /\b(setelah|sesudah|pemakaian|pakai|aku|saya|gue|jujur|unboxing|konten)\b/i.test(low) && !/\b(pelanggan|customer|pembeli|testimoni)\b/i.test(low);
      if (personalReview) {
        const durR = /\b(\d+)\s*(hari|minggu|bulan)\b/i.exec(prompt);
        const nameR = TC(productRaw.replace(/\b(review|jujur|konten|setelah|sesudah|pemakaian|pakai|\d+\s*(?:hari|minggu|bulan))\b/gi, ' ').replace(/\s+/g, ' ').trim()) || product;
        product = nameR;
        push('hook', `Review jujur ${nameR}${durR ? ` setelah ${durR[1]} ${durR[2].toLowerCase()}` : ''}`, 'Tonton sampai habis', undefined, 'message-circle', false, 0);
        push('bukti', 'Kesan pertama', 'Ceritakan kesan pertamamu', undefined, 'message-circle', true, 1);
        push('bukti', durR ? `Setelah ${durR[1]} ${durR[2].toLowerCase()}` : 'Setelah dipakai', 'Ceritakan hasil yang kamu rasakan', undefined, 'sparkles', true, 1);
        push('poin', 'Worth it?', 'Kasih nilaimu, misalnya 8/10', undefined, 'star', true, 2);
        break;
      }
      const qm = Array.from(prompt.matchAll(/"([^"]{4,160})"(?:\s*[-–—,]?\s*(?:oleh|dari|by)?\s*([A-Z][\w.]*(?:\s+[A-Z][\w.]*)?))?/g));
      const reviews = qm.length ? qm.map((m) => m[1].trim()) : listed;
      const reviewer = (i: number) => (qm[i]?.[2] ? qm[i][2].trim() : 'Kata pelanggan');
      push('hook', hookOf('testimoni', { ...vars, produk: productGeneric ? undefined : product }), e.rating ? `Rating ${e.rating}` : '', undefined, 'message-circle', false, 0);
      if (reviews.length) reviews.slice(0, 4).forEach((r, i) => push('bukti', reviewer(i), SC(r), undefined, 'message-circle', false, i ? 3 : 1));
      else push('bukti', 'Kata pelanggan', 'Tempel ulasan asli pelangganmu di sini', undefined, 'message-circle', true, 1);
      proofs();
      if (!productGeneric || store) push('produk', productGeneric && store ? store : product, store && !productGeneric ? `Hanya di ${store}` : '', undefined, iconFor(product, 'gift'), false, 2);
      featureScene(featuresClean.filter((f) => !reviews.some((r) => r.toLowerCase() === f.toLowerCase())), 'Yang bikin pelanggan balik lagi', 3);
      if (price) push('harga', price, oldPrice || priceNote, discount, 'tag', false, 3);
      pushInfo();
      let rk = Math.min(4, reviews.length);
      const split = splitMore(featuresClean);
      more = () => (rk < reviews.length ? { role: 'bukti', title: reviewer(rk), body: SC(reviews[rk++]), icon: 'message-circle', _p: 3 } : split());
      extra = promoExtras(product);
      break;
    }
    case 'before-after': {
      const baSrc = prompt.replace(/before\s*-?\s*after|sebelum\s+(?:dan\s+)?sesudah/gi, ' ');
      const ba = /(?:sebelum|before)\s*:?\s*(.+?)\s*[,;.]?\s*(?:sesudah|setelah|after)\s*:?\s*(.+?)(?:[.\n]|$)/i.exec(baSrc);
      const name =
        TC(
          productRaw
            .replace(/\b(before|after|sebelum|sesudah|dan|vs|pakai|menggunakan|pemakaian|hasil)\b/gi, ' ')
            .replace(/\b\d+\s*(hari|minggu|bulan)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        ) || product;
      const dur = /\b(\d+)\s*(hari|minggu|bulan)\b/i.exec(prompt);
      const guess = !ba ? BA_PAIRS.find((x) => x.re.test(low)) : undefined;
      const userAfter = !ba ? featuresClean.find((f) => /\b(hilang|bersih|kinclong|cerah|glowing|mulus|rapi|wangi|normal|lancar|kembali|berkurang|hilang total|jadi|lebih|turun|naik)\b/i.test(f)) : undefined;
      product = name;
      push('hook', hookOf('before-after', { ...vars, produk: name, durasi: dur ? `${dur[1]} ${dur[2]}` : undefined }), dur ? `Dalam ${dur[1]} ${dur[2]}` : 'Lihat perbedaannya', undefined, 'sparkles', false, 0);
      push('masalah', 'Sebelum', ba ? SC(ba[1]) : guess ? guess.before : 'Tulis kondisi sebelum', undefined, 'frown', !ba && !guess, 1);
      push('produk', dur ? `Sesudah ${dur[1]} ${dur[2].toLowerCase()}` : 'Sesudah', ba ? SC(ba[2]) : userAfter ? userAfter : guess ? guess.after : `Tulis hasil setelah pakai ${name}`, undefined, 'smile', !ba && !guess && !userAfter, 1);
      const baFeats = featuresClean.filter((f) => f !== userAfter && !/^\d+\s*(hari|minggu|bulan)$/i.test(f) && !/^(sebelum|sesudah|setelah|before|after)\b/i.test(f) && !(ba && (ba[1].toLowerCase().includes(f.toLowerCase()) || ba[2].toLowerCase().includes(f.toLowerCase()))));
      featureScene(baFeats, 'Kenapa hasilnya bisa begini?', 3);
      if (price) push('harga', price, oldPrice || priceNote, discount, 'tag', false, 3);
      pushInfo();
      proofs();
      more = splitMore(baFeats);
      extra = [{ role: 'poin', title: 'Prosesnya', body: dur ? `Rutin selama ${dur[1]} ${dur[2].toLowerCase()}` : 'Rutin & konsisten', icon: 'clock', _p: 5 }, ...promoExtras(name)];
      break;
    }
    case 'lowongan': {
      const posM =
        /\b(?:posisi|jabatan|sebagai)\s*:?\s*([^,.\n:]+)/i.exec(masked) ||
        /\b(?:lowongan(?:\s+kerja)?|loker|lowker|dicari|dibutuhkan|hiring|we are hiring|rekrutmen|open recruitment|oprec|butuh)\s*:?\s*(?:(?:untuk|sebagai|bagian)\s+)?(?:posisi\s+)?([^,.\n:]+)/i.exec(masked);
      const posRaw = (posM ? posM[1] : productRaw)
        .replace(PRODUCT_CUT, '')
        .replace(/\b(segera|urgent|cepat|sekarang|kerja|kami|membuka)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const workMode = /\b(remote|wfh|work from home)\b/i.test(low) ? 'Remote' : /\bhybrid\b/i.test(low) ? 'Hybrid' : /\b(wfo|onsite|on-site)\b/i.test(low) ? 'Kerja di kantor' : '';
      const posClean = posRaw.replace(/^[^A-Za-z0-9]+/, '').replace(/\b(remote|wfh|hybrid|wfo|onsite|on-site|full ?time|part ?time|freelance)\b/gi, ' ').replace(/\s+/g, ' ').trim();
      const posisi = posClean ? TC(words(posClean).slice(0, 5).join(' ')) : 'Kandidat Terbaik';
      const partner = /\b(reseller|dropship(?:per)?|agen|mitra|affiliate|afiliasi)\b/i.test(low);
      product = posisi;
      const urgentHire = /\b(segera|urgent|cepat|asap)\b/i.test(low);
      const lokerHook = partner ? `Peluang usaha: jadi ${posisi}!` : hookOf('lowongan', { ...vars, posisi, segera: urgentHire ? 'ya' : undefined }, seed, ['posisi']);
      push('hook', lokerHook, store && !lokerHook.includes(store) ? `Bergabung bersama ${store}` : '', undefined, partner ? 'rocket' : 'briefcase', false, 0);
      // syarat yang ditulis sebagai kalimat ("pengalaman min 2 tahun, wanita max 25 tahun")
      const reqLike = featuresClean.filter((f) => /\b(pengalaman|berpengalaman|min(?:imal|\.)?\s*\d|usia|umur|lulusan|pendidikan|s1|d3|sma|smk|bisa|mampu|menguasai|memiliki|punya|domisili|pria|wanita|laki-laki|perempuan|fresh graduate|jujur|disiplin|sim\b)/i.test(f));
      const syarat = listed.length >= 2 ? listed : reqLike;
      let qualPool: string[] = syarat.slice(0, 5).map((x) => SC(x));
      if (syarat.length && syarat.length < 3 && listed.length < 2) {
        const roleQ = (partner ? [] : ROLE_QUALS.find((r) => r.re.test(posisi.toLowerCase()) || r.re.test(low))?.lines || GENERIC_QUALS).filter((q) => !qualPool.some((x) => x.toLowerCase().includes(q.split(' ')[0].toLowerCase())));
        qualPool = [...qualPool, ...roleQ].slice(0, 4);
      }
      if (syarat.length) push('poin', 'Kualifikasi', '', qualPool.join('|'), 'check', false, 1);
      else {
        // prompt tidak menyebut syarat → kualifikasi umum sesuai posisinya (bisa diedit)
        const quals = (partner ? ['Punya semangat jualan', 'Aktif di media sosial', 'Mau belajar hal baru'] : ROLE_QUALS.find((r) => r.re.test(posisi.toLowerCase()) || r.re.test(low))?.lines || GENERIC_QUALS).slice();
        const dom = e.area && /^Domisili/i.test(e.area) ? e.area : '';
        if (dom) quals.splice(2, 0, dom);
        qualPool = quals.slice(0, 4);
        push('poin', 'Kualifikasi', '', qualPool.join('|'), 'check', false, 1);
      }
      const benefit = featuresClean.filter((f) => !syarat.includes(f) && /gaji|bonus|bpjs|tunjangan|mess|makan|insentif|thr|umr|lembur|jenjang|karier|karir|asuransi|untung|komisi|profit|cuan|diskon reseller/i.test(f));
      if (salary) benefit.unshift(`Gaji ${formatMoney(salary)}`);
      if (benefit.length) push('info', partner ? 'Keuntungannya' : 'Benefit', benefit[0], benefit.length > 1 ? benefit.join('|') : undefined, 'gift', false, 2);
      if (budget) push('info', 'Modal', `Mulai ${formatMoney(budget)}`, undefined, 'wallet', false, 3);
      if (workMode) push('info', 'Sistem kerja', workMode, undefined, 'briefcase', false, 3);
      const lok = e.area && !/^Domisili/.test(e.area) ? e.area : e.location;
      if (lok && !syarat.some((s) => s.toLowerCase().includes(lok.toLowerCase().replace(/^area\s+/, '')))) push('info', 'Penempatan', lok, undefined, 'map-pin', false, 3);
      // scene tambahan saat jumlah scene ditambah: cara melamar & batas waktu
      const doc = /portofolio|portfolio/i.test(low) ? 'CV & portofolio' : 'CV';
      const applyLine = partner ? (c.wa ? `Chat WA ${c.wa}` : 'DM untuk info lengkap') : c.email ? `Kirim ${doc} ke ${c.email}` : c.wa ? `Kirim ${doc} via WA ${c.wa}` : c.url ? `Daftar di ${clip(c.url.replace(/^https?:\/\//, ''), 30)}` : ctaUser && /cv|lamar|daftar/i.test(ctaUser) ? SC(ctaUser) : 'Kirim CV & perkenalkan dirimu';
      const lokerExtra: Item[] = [
        { role: 'info', title: 'Cara melamar', body: applyLine, icon: 'send', _p: 4 },
        ...(deadline ? [{ role: 'info' as SceneRole, title: 'Batas lamaran', body: deadline, icon: 'calendar', _p: 4 }] : []),
      ];
      const qualSplit = splitMore(qualPool, qualPool.join('|'));
      more = () => lokerExtra.shift() || qualSplit();
      extra = [
        { role: 'produk', title: posisi, body: store ? `Bergabung bersama ${store}` : lok ? `Penempatan ${lok}` : 'Kesempatan berkarier', icon: 'briefcase', _p: 5 },
        { role: 'info', title: 'Kenal yang cocok?', body: 'Tag atau bagikan ke temanmu', icon: 'users', _p: 5 },
      ];
      break;
    }
    case 'pengumuman': {
      push('hook', hookOf('pengumuman'), store || '', undefined, 'megaphone', false, 0);
      const parts = splitClauses(prompt.replace(/^\s*(pengumuman|pemberitahuan|info|informasi|update)\b\s*:?\s*/i, ''));
      const dateIn = (s: string) => {
        const m = new RegExp(`\\b(\\d{1,2})(?:\\s*-\\s*(\\d{1,2}))?\\s+(${MONTH_ALT})\\b(?:\\s+(\\d{4}))?`, 'i').exec(s);
        return m ? `${m[1]}${m[2] ? `–${m[2]}` : ''} ${MONTHS[m[3].toLowerCase()]}${m[4] ? ` ${m[4]}` : ''}` : '';
      };
      let added = 0;
      let scheduleUsed = false;
      const timeIn = (s: string) => {
        const m = new RegExp(`\\b(?:jam|pukul|pkl\\.?)\\s*(\\d{1,2}(?:[.:]\\d{2})?)${PART}`, 'i').exec(s) || /\b(\d{1,2}[.:]\d{2})\b()/.exec(s);
        return m ? fmtTime(m[1], m[2]) : '';
      };
      for (const p of parts.slice(0, 5)) {
        const dIn = dateIn(p);
        const tIn = timeIn(p);
        let title = p
          .replace(new RegExp(`(?:\\b(?:mulai|per|pada|sejak)\\s+)?(?:\\b(?:tanggal|tgl)\\s*)?\\b\\d{1,2}(?:\\s*-\\s*\\d{1,2})?\\s+(?:${MONTH_ALT})\\b(?:\\s+\\d{4})?`, 'gi'), '')
          .replace(new RegExp(`\\b(${DAY_ALT})\\b(?:\\s*-\\s*(${DAY_ALT})\\b)?`, 'gi'), '')
          .replace(new RegExp(`(?:\\b(?:mulai|sejak)\\s+)?\\b(?:jam|pukul|pkl\\.?)\\s*\\d{1,2}(?:[.:]\\d{2})?${PART}(?:\\s*(?:wib|wita|wit))?`, 'gi'), '')
          .replace(/\b\d{1,2}[.:]\d{2}(?:\s*-\s*\d{1,2}[.:]\d{2})?/g, '')
          .replace(/\b(tanggal|tgl)\s*$/i, '')
          .replace(/^(?:mulai|per|sejak)\s+/i, '')
          .replace(/[\s:,-]+$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (title.replace(/[^a-z]/gi, '').length < 4) continue;
        const why = /\b(karena|sebab|dikarenakan)\s+(.+)$/i.exec(title);
        if (why) title = title.slice(0, why.index).trim();
        title = title.replace(/^(toko|kami)\s+kami\s+/i, 'Toko ');
        const when = [dIn ? (/\bmulai\b/i.test(p) && !/\bbuka\b/i.test(title) ? `Mulai ${dIn}` : dIn) : '', tIn ? (/\b(mulai|sejak)\s+(?:jam|pukul)/i.test(p) ? `Mulai ${tIn}` : `Pukul ${tIn}`) : ''].filter(Boolean).join(' · ');
        if (/jam (operasional|buka|kerja)|jadwal/i.test(title) && e.schedule.length && !scheduleUsed) {
          push('info', SC(title), e.schedule[0], e.schedule.length > 1 ? e.schedule.join('|') : undefined, 'clock', false, 1);
          scheduleUsed = true;
        } else {
          push('info', SC(title), when || (why ? SC(why[0]) : ''), dIn || undefined, iconFor(title, 'info'), false, 2);
          if (when && why) push('info', SC(why[0]), '', undefined, 'info', false, 3);
        }
        added++;
      }
      if (e.schedule.length && !scheduleUsed) push('info', 'Jam operasional', e.schedule[0], e.schedule.length > 1 ? e.schedule.join('|') : undefined, 'clock', false, 1);
      if (!added && !e.schedule.length) push('info', SC(topicCore || product), date || '', date, 'info', false, 2);
      const annExtra: Item[] = [
        ...e.schedule.slice(1).map((l): Item => ({ role: 'info', title: l.split(':')[0] || l, body: l.includes(':') ? l.split(':').slice(1).join(':').trim() : undefined, icon: 'clock', _p: 4 })),
        ...(contactLine ? [{ role: 'info' as SceneRole, title: 'Info lebih lanjut', body: contactLine, icon: 'message-circle', _p: 4 }] : []),
      ];
      more = () => annExtra.shift() || null;
      extra = [{ role: 'kutipan', title: 'Terima kasih atas pengertiannya', body: store ? `— ${store}` : undefined, icon: 'heart', _p: 5 }];
      break;
    }
    case 'ucapan': {
      const occ = OCCASIONS.find((o) => o.re.test(low));
      const keM = /\bke[-\s]?(\d{1,3})\b/i.exec(prompt);
      const relM = /\b(?:untuk|buat|kepada|teruntuk|to)\s+((?:istri|suami|ibu|ayah|bapak|mama|papa|mamah|papah|bunda|ayahanda|ibunda|adik|kakak|abang|sahabat|pacar|sayang|anak|nenek|kakek|om|tante|teman|bestie|bos|guru)(?:ku|nya)?(?:\s+(?:tercinta|tersayang|terbaik|kesayangan|terhebat))?)\b/i.exec(prompt);
      const nama = store || /\b(?:untuk|buat|kepada|teruntuk)\s+([A-Z][\w']*(?:\s+(?:&\s+)?[A-Z][\w']*){0,3})/.exec(prompt)?.[1] || (relM ? TC(relM[1]) : undefined);
      const personal = !store && !!relM;
      const title = occ
        ? fill(occ.title, {
            tahun: occ.hijri ? (e.hijriYear ? ` ${e.hijriYear}` : '') : e.year && /tahun baru/i.test(low) ? ` ${e.year}` : '',
            ke: keM ? ` ke-${keM[1]}` : '',
            nama: nama && /ulang tahun|ultah|milad|anniversary|wisuda|pernikahan|menikah|wedding|birthday/i.test(low) ? `, ${nama}` : '',
          })
        : TC(/^selamat\b/i.test(topicCore) ? topicCore : `Selamat ${topicCore || 'Hari Bahagia'}`);
      product = title.replace(/\s+,/g, ',').replace(/,.*$/, '');
      push('kutipan', title.replace(/\s+,/g, ','), '', undefined, 'party-popper', false, 0);
      const own = splitClauses(prompt)
        .filter((s) => /\b(terima kasih|makasih|semoga|mohon maaf|sukses selalu|bahagia selalu|jasamu|kasihmu)\b/i.test(s))
        .map((s) => SC(s.replace(/^(dan|serta)\s+/i, '').replace(/^.*?\b(terima kasih|makasih|semoga|mohon maaf)/i, '$1')).replace(/[.!]*$/, '.'));
      const occMsgs = occ ? (personal ? occ.messages.filter((m) => !/\b(kami|bersama kami|pelanggan)\b/i.test(m)) : occ.messages) : QUOTES.syukur.slice(0, 2);
      const msgs = dedupeLines([...own, ...occMsgs, ...(personal ? ['Terima kasih sudah selalu ada.', 'Semoga bahagia selalu.'] : [])]);
      const n = Math.max(1, Math.min(3, nAsked || 2));
      msgs.slice(0, n).forEach((m, i) => push('kutipan', m, i === 0 && store ? `— ${store}` : '', undefined, 'heart', false, i ? 3 : 1));
      let k = n;
      more = () => (k < msgs.length ? { role: 'kutipan', title: msgs[k++], icon: 'heart', _p: 3 } : null);
      break;
    }
    case 'quote-motivasi':
    case 'quote-galau':
    case 'cerita': {
      const themes = QUOTE_THEMES.filter(([re]) => re.test(low)).map(([, t]) => t);
      if (!themes.length) themes.push(intent === 'quote-galau' ? 'galau' : 'motivasi');
      const qKeys = words(`${topicFull} ${topicInfo.goal}`.toLowerCase()).filter((w) => w.length >= 4 && !STOP.has(w));
      const themed = uniq(themes.flatMap((t) => QUOTES[t] || []));
      const qScore = (x: string) => ((QUOTES[themes[0]] || []).includes(x) ? 2 : 0) + themes.filter((t) => (QUOTES[t] || []).includes(x)).length + qKeys.filter((k) => x.toLowerCase().includes(k)).length;
      const tiers = Array.from(new Set(themed.map(qScore))).sort((a, b) => b - a);
      const bank = [
        ...tiers.flatMap((sc) => rankBank(themed.filter((x) => qScore(x) === sc), [], (x) => x, seed)),
        ...rankBank((intent === 'quote-galau' ? QUOTES.galau : QUOTES.motivasi).filter((x) => !themes.some((t) => (QUOTES[t] || []).includes(x))), [], (x) => x, seed),
      ];
      const quoted = Array.from(prompt.matchAll(/"([^"]{6,220})"/g)).map((m) => m[1].trim());
      const lines = prompt.split(/\n/).map((l) => l.trim()).filter((l) => l.split(' ').length >= 4 && !/^(buat|bikin|tolong|quotes?|kata|caption|video|konten)\b/i.test(l));
      const own = quoted.length ? quoted : listed.length >= 2 ? listed : lines.length >= 2 ? lines : [];
      if (intent === 'cerita') {
        push('hook', hookOf('cerita', { ...vars, topik: topicCore }), '', undefined, 'book-open', false, 0);
        const beats = own.length ? own : splitClauses(prompt).filter((s) => s.split(' ').length >= 4).slice(1);
        const arc = /(?:^|\s)(?:(aku|saya|gue|gw|kami|dia)\s+)?(.*?)\s*\bdari\s+(.+?)\s+(?:sampai|hingga|sampe|jadi|menjadi)\s+(.+)$/i.exec(topicInfo.topic || topicCore);
        if (beats.length >= 2) beats.slice(0, 5).forEach((b, i) => push('kutipan', SC(b), '', undefined, 'book-open', false, 2 + i));
        else if (arc && arc[3] && arc[4]) {
          const act = (arc[2] || '').replace(/^(?:tentang|soal|sukses|perjalanan|kisah)\s+/i, '').trim();
          const now = arc[4].replace(/[.!]+$/, '');
          push('kutipan', 'Awalnya…', SC(`${act ? `${act} ` : 'mulai '}dari ${arc[3]}`), undefined, 'book-open', false, 2);
          push('kutipan', 'Titik baliknya…', 'Ceritakan momen yang mengubah segalanya', undefined, 'book-open', true, 2);
          push('kutipan', 'Sekarang…', SC(/^\d/.test(now) ? `sudah ${now}` : now), undefined, 'book-open', false, 2);
        } else if (/\s(?:dan|lalu|terus|tapi|tetapi|namun|eh)\s/i.test(topicInfo.topic || topicCore)) {
          const tp = (topicInfo.topic || topicCore).replace(/^(?:tentang|soal)\s+/i, '').replace(/^pengalaman\s+/i, '');
          const sp = /^(.*?)\s+(?:dan|lalu|terus|tapi|tetapi|namun|eh)\s+(.+)$/i.exec(tp) as RegExpExecArray;
          const setup = sp[1].replace(/\b(aku|saya|gue|gw)\b\s*/gi, '').trim();
          push('kutipan', 'Awalnya…', SC(setup), undefined, 'book-open', false, 2);
          push('kutipan', 'Ternyata…', SC(sp[2].replace(/[.!]+$/, '')), undefined, 'book-open', false, 2);
          push('kutipan', 'Pelajarannya…', 'Ceritakan pelajaran yang kamu dapat', undefined, 'book-open', true, 2);
        } else {
          push('kutipan', 'Awalnya…', `Ceritakan kondisi awal soal ${clip(topicCore || 'ceritamu', 30)}`, undefined, 'book-open', true, 2);
          push('kutipan', 'Titik baliknya…', 'Momen yang mengubah segalanya', undefined, 'book-open', true, 2);
          push('kutipan', 'Sekarang…', 'Hasil & pelajaran yang kamu dapat', undefined, 'book-open', true, 2);
        }
      } else {
        const n = Math.max(2, Math.min(6, nAsked || own.length || 3));
        let bq = 0;
        for (let i = 0; i < n; i++) push('kutipan', own[i] ? SC(own[i]) : bank[bq++ % bank.length], '', undefined, intent === 'quote-galau' ? 'moon' : 'sun', false, 2);
        let k = n;
        more = () => (k++ < 10 ? { role: 'kutipan', title: bank[bq++ % bank.length], icon: intent === 'quote-galau' ? 'moon' : 'sun', _p: 2 } : null);
      }
      break;
    }
  }
  items.push(buildCta());

  /* ---------- jumlah scene sesuai permintaan ---------- */
  if (opts.sceneCount && opts.sceneCount >= 2) {
    const want = Math.min(12, opts.sceneCount);
    while (items.length > want) {
      let idx = -1;
      let worst = -1;
      items.forEach((it, i) => {
        if (i === 0 || i === items.length - 1) return;
        const p = it._p ?? 5;
        if (p >= worst) {
          worst = p;
          idx = i;
        }
      });
      if (idx < 0) {
        if (items.length > 2) items.splice(items.length - 2, 1);
        else break;
      } else items.splice(idx, 1);
    }
    // urutan isi tambahan: generator jenis video → keunggulan yang belum tampil → scene cadangan → lokasi/kontak → contoh
    const shownNow = () => items.map((it) => `${it.title} ${it.body || ''} ${it.value || ''}`.toLowerCase()).join(' ');
    const featPool = featuresClean.filter((f) => !(intent === 'event' && fromHead.has(f)));
    const nextFeature = (): Item | null => {
      while (featPool.length) {
        const f = featPool.shift() as string;
        if (!shownNow().includes(f.toLowerCase())) return { role: 'poin', title: f, icon: iconFor(f, 'badge-check'), _p: 4 };
      }
      return null;
    };
    const nextExtra = (): Item | null => {
      while (extra.length) {
        const x = extra.shift() as Item;
        const sn = shownNow();
        if (x.icon === 'clock' && x.role === 'info' && sn.includes(x.title.toLowerCase())) continue;
        if (/komentar/i.test(x.body || '') && /komentar/i.test(items[items.length - 1]?.title || '')) continue;
        if (!sn.includes(`${x.title} ${x.body || ''}`.toLowerCase().trim())) return x;
      }
      return null;
    };
    const nextInfo = (): Item | null => {
      const sn = shownNow();
      if (where && !sn.includes(where.toLowerCase())) return { role: 'info', title: e.online && !location ? 'Online' : 'Lokasi', body: where, icon: 'map-pin', _p: 4 };
      if (contactLine && category !== 'quote' && !sn.includes(contactLine.toLowerCase())) return { role: 'info', title: category === 'promo' ? 'Hubungi kami' : 'Info lebih lanjut', body: contactLine, icon: 'message-circle', _p: 4 };
      return null;
    };
    // ajakan ringan (simpan/bagikan) sebelum teks contoh; tidak dobel dengan kalimat CTA
    const ctaLow = (items[items.length - 1]?.title || '').toLowerCase();
    const fillers: Item[] = (
      intent === 'pengumuman'
        ? [['Simpan info ini', 'Biar nggak ketinggalan info'], ['Bantu sebarkan', 'Bagikan ke teman & keluarga']]
        : intent === 'lowongan'
          ? [['Simpan lowongan ini', 'Biar nggak lupa kirim lamaran']]
          : intent === 'event'
            ? [['Simpan tanggalnya', 'Biar nggak kelewatan'], ['Bagikan ke temanmu', 'Siapa tahu dia juga mau ikut']]
            : category === 'promo'
              ? [['Simpan dulu video ini', 'Biar gampang dicari lagi nanti'], ['Tag temanmu', 'Siapa tahu dia juga lagi cari']]
              : category === 'edukasi'
                ? [['Simpan video ini', 'Biar bisa dibuka lagi nanti'], ['Bagikan ke temanmu', 'Siapa tahu dia juga butuh']]
                : []
    )
      .filter(([t]) => !(/simpan/i.test(t) && /simpan/.test(ctaLow)) && !(/bagikan|tag|sebarkan/i.test(t) && /bagikan|share|tag|kirim ke/.test(ctaLow)))
      .map(([t, b]): Item => ({ role: 'info', title: t, body: b, icon: /simpan/i.test(t) ? 'bookmark' : 'users', _p: 5 }));
    let guard = 0;
    while (items.length < want && guard++ < 24) {
      const x = (more ? more() : null) || (category === 'promo' ? nextFeature() : null) || nextExtra() || nextInfo() || fillers.shift() || null;
      const fallback: Item =
        category === 'quote'
          ? { role: 'kutipan', title: QUOTES.motivasi[(seed + guard) % QUOTES.motivasi.length], icon: 'sun', _p: 4 }
          : { role: 'poin', title: 'Poin tambahan', body: 'Tulis isi scene ini', icon: 'sparkles', placeholder: true, _p: 4 };
      const it = x || fallback;
      const numbered = (y: Item) => (y.role === 'langkah' || y.role === 'poin') && !!y.value && /^\d+$/.test(y.value);
      let pos = items.length - 1;
      if (it._at !== undefined) pos = Math.min(it._at, items.length - 1);
      else if (numbered(it)) {
        const last = items.map((y, i) => (numbered(y) && y.role === it.role ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
        if (last >= 0) pos = last + 1;
      }
      delete it._at;
      items.splice(pos, 0, it);
    }
  }
  // angka di hook ("5 tips", "dalam 4 langkah") mengikuti jumlah poin yang benar-benar tampil
  {
    const nums = items.filter((y) => (y.role === 'langkah' || y.role === 'poin') && !!y.value && /^\d+$/.test(y.value));
    const hookIt = items[0];
    const declared = /\b(\d+)\s+(tips|cara|trik|ide|alasan|kesalahan|manfaat|tanda|langkah|step|fakta|tempat|spot|hal|rahasia)\b/i.exec(hookIt?.title || '');
    if (hookIt && declared && nums.length && Number(declared[1]) !== nums.length) {
      const t = hookIt.title.replace(declared[0], nums.length >= 2 ? `${nums.length} ${declared[2]}` : declared[2]).replace(/\s+/g, ' ').trim();
      hookIt.title = t.charAt(0).toUpperCase() + t.slice(1);
    }
  }

  /* ---------- nama topik untuk video non-jualan ---------- */
  if (!opts.product && category !== 'promo' && intent !== 'lowongan' && intent !== 'ucapan' && category !== 'quote') {
    let subj = '';
    if (intent === 'pengumuman') subj = TC(items.find((it) => it.role === 'info')?.title || 'Pengumuman');
    else if (intent === 'travel') subj = cityName ? (/\b(tempat makan|kuliner|makanan khas|jajanan|makan enak)\b/.test(low) && CITY_FOODS[cityName] ? `Kuliner ${cityName}` : /\b(liburan|itinerary|trip|jalan-jalan|staycation)\b/.test(low) ? `Liburan${/\b(hemat|murah|irit)\b/.test(low) ? ' Hemat' : ''} ke ${cityName}` : `Wisata ${cityName}`) : topicCore ? TC(topicCore) : '';
    else {
      const mk = topicInfo.marker.replace(/\s+(dan|&)\s+trik$/, '');
      const listN = /\d+\s*(kebiasaan|ciri|hal)\b/i.exec(low)?.[1];
      const lead = listN ? '' : mk && !/^(cara|tutorial|resep|kata|quotes?|motivasi|cerita|kisah|ide|panduan|langkah)/.test(mk) ? mk : intent === 'tutorial' ? (/\bresep\b/.test(low) ? 'resep' : 'cara') : intent === 'fakta' ? 'fakta' : intent === 'tips' ? 'tips' : '';
      const core = words(topicFull).length <= 6 ? topicFull : topicCore;
      if (core) subj = TC(`${lead ? `${lead} ` : ''}${core}`);
    }
    if (subj && words(subj).length <= 8) product = dash(subj);
  }

  /* ---------- kata kunci, caption, hashtag ---------- */
  const kwSrc = `${product} ${topicCore} ${featuresClean.join(' ')} ${store || ''} ${cityName || ''} ${low}`.toLowerCase();
  const keywords = uniq(kwSrc.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w) && !/^(rb|jt|wib|jam|nya)$/.test(w))).slice(0, 14);
  const hook = items[0]?.title || product;
  const cta = items[items.length - 1];
  const tag = (s: string) => `#${s.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const tagBase = uniq(words(`${productGeneric ? '' : product} ${category !== 'promo' ? topicCore : ''}`.toLowerCase()).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w))).slice(0, 3).map(tag);
  const hashtags = uniq(
    [
      ...tagBase,
      store ? tag(store) : '',
      cityName ? tag(cityName) : '',
      '#fyp',
      category === 'promo' ? '#promo' : category === 'quote' ? '#quotes' : '#edukasi',
      intent === 'menu-kuliner' ? '#kulinerindonesia' : intent === 'tips' ? '#tipsandtrick' : intent === 'lowongan' ? '#lowongankerja' : intent === 'travel' ? '#wisataindonesia' : '#tiktokindonesia',
    ].filter((x) => x && x.length > 2)
  ).slice(0, 8);
  const captionBits = [price || '', category !== 'quote' && date ? date : '', category !== 'quote' && where ? where : ''].filter(Boolean);
  const caption = `${hook}${captionBits.length ? ` — ${captionBits.join(' · ')}` : ''}. ${cta.title}${contactLine && !cta.title.includes(contactLine) ? ` ${contactLine}` : ''}`.replace(/([.!?])\./g, '$1');

  const moodOf = (): ContentPlan['mood'] => {
    if (intent === 'quote-galau') return 'galau';
    if (/\b(mewah|luxury|premium|eksklusif|elegan|exclusive)\b/.test(low)) return 'mewah';
    if (/\b(lucu|kocak|ngakak|gemes|gemas|receh)\b/.test(low)) return 'lucu';
    if (intent === 'flash-sale' || intent === 'launching' || intent === 'event') return 'energik';
    if (intent === 'quote-motivasi' || intent === 'ucapan') return 'hangat';
    if (intent === 'fakta' || intent === 'lowongan' || intent === 'pengumuman') return 'serius';
    if (/\b(santai|tenang|chill|aesthetic|estetik|calm)\b/.test(low)) return 'tenang';
    return category === 'promo' ? 'energik' : 'hangat';
  };

  return {
    prompt: raw,
    intent,
    category,
    mood: moodOf(),
    product,
    store,
    price,
    oldPrice,
    discount,
    cta: cta.title,
    handle: brandHandle,
    location: where,
    date: date || deadline,
    time,
    contact: contactLine,
    priceNote,
    features: featuresClean.slice(0, 6),
    keywords,
    items: items.map(({ _p, ...it }) => ({ ...it, title: polish(it.title), ...(it.body ? { body: polish(it.body) } : {}) })),
    caption,
    hashtags,
  };
}

/** Untuk pengujian & alat bantu: harga yang terbaca dari teks (dalam rupiah). */
export function extractPrices(text: string): number[] {
  return extract(text).e.money.filter((m) => m.role === 'price' || m.role === 'old').map((m) => m.value);
}

export { CATEGORY_OF };
