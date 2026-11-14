import type { Category, ContentPlan, Intent, PlanItem, SceneRole } from './types';
import { findIconFor } from './packs/icons';

/**
 * Prompt Engine v6 — membaca prompt bebas (bahasa Indonesia sehari-hari) lalu menyusun
 * rencana konten: jenis video (17 intent), jumlah scene menyesuaikan isi prompt,
 * harga/diskon/toko/lokasi/tanggal, daftar poin, CTA, caption & hashtag.
 * 100% lokal, tanpa API AI.
 */

const INTENT_RULES: Array<{ intent: Intent; words: string[]; weight?: number }> = [
  { intent: 'flash-sale', words: ['flash sale', 'flashsale', 'hari ini saja', 'terbatas', 'cuci gudang', 'clearance', 'harbolnas', '11.11', '12.12', 'payday', 'gajian', 'buruan', 'sisa stok', 'limited'], weight: 1.4 },
  { intent: 'promo-produk', words: ['promo', 'diskon', 'jual', 'jualan', 'dijual', 'harga', 'murah', 'beli', 'order', 'pesan', 'ready', 'produk', 'gratis ongkir', 'cod', 'potongan', 'cashback', 'voucher', 'sale'] },
  { intent: 'menu-kuliner', words: ['menu', 'makanan', 'minuman', 'kuliner', 'warung', 'resto', 'restoran', 'kafe', 'cafe', 'kopi', 'seblak', 'bakso', 'ayam', 'nasi', 'mie', 'boba', 'martabak', 'katering', 'catering', 'snack', 'jajanan', 'dessert', 'kue', 'es teh'], weight: 1.1 },
  { intent: 'launching', words: ['launching', 'launch', 'rilis', 'peluncuran', 'baru buka', 'grand opening', 'opening', 'produk baru', 'segera hadir', 'coming soon', 'versi baru', 'update terbaru', 'aplikasi baru'], weight: 1.3 },
  { intent: 'event', words: ['event', 'acara', 'webinar', 'seminar', 'workshop', 'konser', 'festival', 'lomba', 'kompetisi', 'bazar', 'pameran', 'meetup', 'kelas online', 'daftar sekarang', 'pendaftaran', 'ticket', 'tiket'], weight: 1.2 },
  { intent: 'tips', words: ['tips', 'cara', 'trik', 'rahasia', 'biar', 'agar', 'supaya', 'hack', 'ide', 'rekomendasi', 'kesalahan', 'hindari', 'manfaat', 'alasan', 'tanda'] },
  { intent: 'tutorial', words: ['tutorial', 'langkah', 'step', 'panduan', 'cara membuat', 'cara bikin', 'resep', 'how to', 'setup', 'install', 'deploy', 'diy'], weight: 1.2 },
  { intent: 'fakta', words: ['fakta', 'tahukah', 'tau gak', 'tahu nggak', 'ternyata', 'unik', 'sejarah', 'mitos', 'sains', 'jarang diketahui', 'misteri', 'statistik', 'data'], weight: 1.2 },
  { intent: 'quote-motivasi', words: ['motivasi', 'semangat', 'quotes', 'quote', 'kata-kata', 'kata kata', 'bijak', 'inspirasi', 'sukses', 'jangan menyerah', 'bangkit', 'mimpi', 'berjuang'], weight: 1.1 },
  { intent: 'quote-galau', words: ['galau', 'sedih', 'patah hati', 'rindu', 'kangen', 'capek', 'lelah', 'kecewa', 'sendiri', 'overthinking', 'mantan', 'baper', 'healing'], weight: 1.3 },
  { intent: 'testimoni', words: ['testimoni', 'review', 'ulasan', 'kata pelanggan', 'pengalaman', 'feedback', 'rating', 'bintang 5', 'puas'], weight: 1.3 },
  { intent: 'before-after', words: ['before after', 'sebelum sesudah', 'sebelum dan sesudah', 'transformasi', 'perubahan', 'hasil pemakaian', 'glow up', 'makeover', 'renovasi'], weight: 1.5 },
  { intent: 'lowongan', words: ['lowongan', 'loker', 'dicari', 'rekrutmen', 'hiring', 'karyawan', 'kerja', 'posisi', 'magang', 'internship', 'freelance', 'kirim cv'], weight: 1.3 },
  { intent: 'pengumuman', words: ['pengumuman', 'info', 'informasi', 'libur', 'tutup', 'jadwal', 'perubahan jam', 'pemberitahuan', 'update'], weight: 0.9 },
  { intent: 'ucapan', words: ['selamat', 'ucapan', 'idul fitri', 'lebaran', 'natal', 'tahun baru', 'imlek', 'ramadhan', 'ramadan', 'ulang tahun', 'hut', 'hari ibu', 'merdeka', 'kemerdekaan', 'wisuda', 'happy'], weight: 1.4 },
  { intent: 'travel', words: ['liburan', 'wisata', 'travel', 'trip', 'jalan-jalan', 'destinasi', 'pantai', 'gunung', 'hotel', 'villa', 'staycation', 'itinerary', 'backpacker', 'bali', 'jogja', 'lombok', 'bandung'], weight: 1.1 },
  { intent: 'cerita', words: ['cerita', 'kisah', 'pengalaman pribadi', 'storytime', 'curhat', 'perjalanan', 'dulu aku'], weight: 1 },
];

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
/* Bank teks (bisa ditambah dari training admin)                        */
/* ------------------------------------------------------------------ */
const HOOKS: Record<string, string[]> = {
  promo: [
    'Stop scroll! Ini promo {produk} yang kamu tunggu',
    '{produk} cuma {harga}? Serius!',
    'Jangan beli {produk} sebelum lihat ini',
    'Promo {produk} paling worth it minggu ini',
    'Yang belum coba {produk}, rugi banget',
  ],
  'flash-sale': ['FLASH SALE! {produk} cuma {harga}', 'Hari ini saja: {produk} diskon {diskon}', 'Buruan, stok {produk} tinggal sedikit!', 'Detik-detik terakhir promo {produk}'],
  kuliner: ['Lapar? {produk} siap bikin nagih', 'Menu andalan {toko} yang wajib dicoba', 'Rasanya bikin balik lagi: {produk}', 'Kuliner paling dicari minggu ini'],
  launching: ['Akhirnya rilis: {produk}!', 'Kenalan sama {produk} yang baru', 'Yang kamu tunggu sudah datang', 'Ada yang baru dari {toko}'],
  event: ['Catat tanggalnya! {produk}', 'Jangan sampai ketinggalan {produk}', 'Kamu diundang ke {produk}', 'Event paling seru bulan ini'],
  tips: ['{n} tips {topik} yang jarang orang tahu', 'Cara {topik} biar hasilnya maksimal', 'Simpan dulu: {n} trik {topik}', 'Kalau mau {topik}, lakukan ini'],
  tutorial: ['Cara {topik} dalam {n} langkah', 'Tutorial {topik} anti ribet', 'Ikuti {n} langkah ini: {topik}', 'Gampang banget! {topik}'],
  fakta: ['{n} fakta {topik} yang bikin kaget', 'Tahukah kamu soal {topik}?', 'Ternyata {topik} itu begini', 'Fakta {topik} yang jarang dibahas'],
  testimoni: ['Kata mereka setelah coba {produk}', 'Review jujur pelanggan {toko}', 'Kenapa banyak yang repeat order {produk}?', 'Bukan kata kami, kata pelanggan'],
  'before-after': ['Sebelum vs sesudah pakai {produk}', 'Perubahannya nyata banget!', 'Hasil {produk} bikin pangling', 'Transformasi dalam hitungan hari'],
  lowongan: ['Kami mencari {produk}!', 'Lowongan kerja: {produk}', 'Mau gabung tim {toko}?', 'Kesempatan karier baru buat kamu'],
  pengumuman: ['Pengumuman penting!', 'Info terbaru dari {toko}', 'Mohon perhatian, ada update', 'Kabar terbaru untuk kamu'],
  travel: ['{n} tempat wajib di {topik}', 'Liburan ke {topik}? Simpan ini', 'Itinerary {topik} paling hemat', 'Hidden gem {topik} yang jarang orang tahu'],
  cerita: ['Aku nggak nyangka ini terjadi', 'Cerita singkat yang mengubah segalanya', 'Ini kisah {topik}', 'Dulu aku pikir ini mustahil'],
};

const CTAS: Record<string, string[]> = {
  promo: ['Pesan sekarang sebelum kehabisan!', 'Klik link di bio & checkout', 'DM sekarang, stok terbatas!', 'Order lewat WhatsApp ya!'],
  edukasi: ['Simpan & bagikan ke temanmu!', 'Follow untuk tips berikutnya', 'Tulis pengalamanmu di komentar', 'Share ke yang butuh ini!'],
  quote: ['Kirim ke seseorang yang butuh ini', 'Follow untuk kata-kata harian', 'Simpan buat pengingat diri', 'Tag temanmu di kolom komentar'],
  event: ['Daftar sekarang, kuota terbatas!', 'Amankan tiketmu hari ini', 'Klik link di bio untuk daftar'],
  lowongan: ['Kirim CV kamu sekarang!', 'Daftar lewat link di bio', 'Tag temanmu yang cocok!'],
};

const TIPS_BANK: Record<string, string[][]> = {
  keuangan: [
    ['Pisahkan rekening', 'Satu untuk kebutuhan, satu untuk tabungan.'],
    ['Pakai aturan 50/30/20', 'Kebutuhan, keinginan, dan tabungan.'],
    ['Catat semua pengeluaran', 'Yang kecil-kecil justru paling bocor.'],
    ['Bikin dana darurat', 'Minimal 3–6 kali pengeluaran bulanan.'],
    ['Tunda beli 24 jam', 'Kalau masih mau besok, baru beli.'],
    ['Investasi rutin', 'Nominal kecil tapi konsisten tiap bulan.'],
    ['Hindari utang konsumtif', 'Paylater itu tetap utang.'],
    ['Evaluasi tiap akhir bulan', 'Lihat pos mana yang bisa dihemat.'],
  ],
  jualan: [
    ['Kenali target pembeli', 'Bicara langsung ke masalah mereka.'],
    ['Foto produk yang terang', 'Cahaya alami bikin produk lebih menarik.'],
    ['Hook 3 detik pertama', 'Kalimat pertama menentukan orang berhenti scroll.'],
    ['Tampilkan testimoni', 'Bukti sosial bikin orang lebih yakin.'],
    ['Kasih alasan beli sekarang', 'Promo terbatas atau bonus khusus.'],
    ['Balas chat secepatnya', 'Respon cepat = closing lebih banyak.'],
    ['Posting konsisten', 'Algoritma suka akun yang rajin.'],
    ['Upsell dengan paket', 'Bundling bikin nilai belanja naik.'],
  ],
  belajar: [
    ['Belajar 25 menit, istirahat 5', 'Teknik pomodoro bikin fokus tahan lama.'],
    ['Jelaskan ulang ke orang lain', 'Kalau bisa menjelaskan, berarti paham.'],
    ['Latihan soal, bukan cuma baca', 'Ingatan menguat saat dipakai.'],
    ['Tidur cukup', 'Otak menyimpan memori saat tidur.'],
    ['Singkirkan HP', 'Notifikasi adalah musuh fokus.'],
    ['Ulangi berkala', 'Spaced repetition: hari 1, 3, 7.'],
    ['Buat peta konsep', 'Hubungkan ide biar gampang diingat.'],
    ['Tetapkan target kecil', 'Satu bab per hari lebih realistis.'],
  ],
  kesehatan: [
    ['Minum air 8 gelas', 'Tubuh terhidrasi, pikiran lebih segar.'],
    ['Jalan kaki 30 menit', 'Olahraga ringan yang paling mudah.'],
    ['Kurangi gula', 'Energi lebih stabil sepanjang hari.'],
    ['Tidur sebelum jam 11', 'Kualitas tidur ikut menentukan mood.'],
    ['Perbanyak sayur & buah', 'Isi setengah piring dengan warna.'],
    ['Peregangan tiap jam', 'Leher dan punggung bakal berterima kasih.'],
    ['Batasi layar sebelum tidur', 'Cahaya biru mengganggu jam biologis.'],
    ['Cek kesehatan rutin', 'Lebih baik mencegah daripada mengobati.'],
  ],
  konten: [
    ['Riset tren dulu', 'Lihat FYP dan cari pola yang berulang.'],
    ['Hook kuat di detik awal', 'Pertanyaan atau pernyataan mengejutkan.'],
    ['Durasi singkat & padat', '15–30 detik paling aman.'],
    ['Pakai teks di layar', 'Banyak orang nonton tanpa suara.'],
    ['Konsisten jam posting', 'Biasakan audiens menunggu kontenmu.'],
    ['Balas komentar jadi video', 'Konten baru sekaligus interaksi.'],
    ['Analisis insight', 'Ulangi format yang performanya bagus.'],
    ['Kolaborasi', 'Pinjam audiens kreator lain.'],
  ],
  umum: [
    ['Mulai dari yang kecil', 'Langkah kecil yang konsisten lebih kuat.'],
    ['Buat jadwal rutin', 'Kebiasaan mengalahkan motivasi.'],
    ['Catat progresmu', 'Melihat kemajuan bikin semangat.'],
    ['Cari mentor', 'Belajar dari yang sudah berhasil.'],
    ['Evaluasi tiap minggu', 'Buang yang tidak berhasil.'],
    ['Jangan bandingkan diri', 'Fokus pada prosesmu sendiri.'],
    ['Pakai alat bantu', 'Kerja cerdas, bukan cuma keras.'],
    ['Rayakan kemenangan kecil', 'Energi positif untuk langkah berikutnya.'],
  ],
};

const STEP_BANK: string[][] = [
  ['Siapkan bahan & alat', 'Pastikan semua sudah lengkap.'],
  ['Ikuti urutan dasar', 'Jangan lompat langkah penting.'],
  ['Cek hasil sementara', 'Perbaiki kalau ada yang kurang.'],
  ['Sempurnakan detail', 'Bagian kecil yang bikin beda.'],
  ['Uji coba', 'Pastikan hasilnya sesuai harapan.'],
  ['Selesai & bagikan', 'Tunjukkan hasil kerjamu!'],
  ['Rapikan', 'Simpan untuk dipakai lagi.'],
  ['Ulangi lebih cepat', 'Latihan bikin makin mahir.'],
];

const FACT_BANK: string[][] = [
  ['Lebih tua dari yang kamu kira', 'Sejarahnya sudah ada sejak ratusan tahun lalu.'],
  ['Dipakai jutaan orang', 'Tanpa sadar kamu mungkin sudah sering bertemu.'],
  ['Punya versi unik di tiap daerah', 'Setiap tempat punya ciri khasnya sendiri.'],
  ['Banyak mitos yang salah', 'Faktanya justru kebalikannya.'],
  ['Bisa dipelajari siapa saja', 'Tidak perlu bakat khusus untuk mulai.'],
  ['Pengaruhnya besar', 'Hal kecil ini berdampak ke banyak hal.'],
  ['Terus berkembang', 'Selalu ada hal baru setiap tahun.'],
  ['Ada angka mengejutkan di baliknya', 'Datanya bikin banyak orang kaget.'],
];

const QUOTES: Record<'motivasi' | 'galau' | 'ucapan', string[]> = {
  motivasi: [
    'Pelan-pelan saja, yang penting tidak berhenti.',
    'Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk jadi hebat.',
    'Lelah boleh, menyerah jangan.',
    'Proses tidak pernah mengkhianati hasil.',
    'Hari ini berat, tapi kamu lebih kuat.',
    'Mimpi besar dimulai dari langkah kecil hari ini.',
    'Jangan bandingkan bab 1 kamu dengan bab 20 orang lain.',
    'Disiplin adalah jembatan antara tujuan dan pencapaian.',
  ],
  galau: [
    'Ternyata yang paling sulit itu pura-pura baik-baik saja.',
    'Aku tidak marah, aku cuma capek berharap.',
    'Ada rindu yang tidak bisa diucapkan, hanya bisa dipendam.',
    'Kadang yang pergi bukan berarti tidak sayang.',
    'Pelan-pelan, hati juga butuh waktu untuk sembuh.',
    'Malam selalu lebih jujur soal perasaan.',
    'Kita pernah sedekat itu, lalu jadi asing.',
    'Tidak apa-apa menangis, besok kita coba lagi.',
  ],
  ucapan: [
    'Semoga hari ini membawa berkah dan kebahagiaan untuk kita semua.',
    'Terima kasih sudah jadi bagian dari perjalanan kami.',
    'Mari rayakan dengan penuh syukur dan kebersamaan.',
    'Semoga semua harapan baik terwujud.',
  ],
};

export function registerHook(category: string, text: string) {
  const key = category === 'quote' ? 'cerita' : category === 'edukasi' ? 'tips' : 'promo';
  (HOOKS[key] = HOOKS[key] || []).unshift(text);
}
export function registerCta(category: string, text: string) {
  const key = category === 'quote' ? 'quote' : category === 'edukasi' ? 'edukasi' : 'promo';
  (CTAS[key] = CTAS[key] || []).unshift(text);
}
export function registerQuote(text: string, galau = false) {
  QUOTES[galau ? 'galau' : 'motivasi'].unshift(text);
}

/* ------------------------------------------------------------------ */
/* Ekstraksi                                                            */
/* ------------------------------------------------------------------ */
function formatRupiah(n: number): string {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')} jt`;
  }
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export function extractPrices(text: string): number[] {
  const out: number[] = [];
  const re = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const full = m[0].toLowerCase();
    const unit = (m[2] || '').toLowerCase();
    const hasRp = full.includes('rp');
    let raw = m[1];
    let val: number;
    if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) val = Number(raw.replace(/[.,]/g, ''));
    else val = Number(raw.replace(',', '.'));
    if (unit === 'rb' || unit === 'ribu' || unit === 'k') val *= 1000;
    if (unit === 'jt' || unit === 'juta') val *= 1_000_000;
    // angka tanpa satuan & tanpa Rp dianggap harga hanya jika >= 1000
    if (!unit && !hasRp && val < 1000) continue;
    const before = text.slice(Math.max(0, m.index - 1), m.index);
    if (before === '%' || /\d+\s*%/.test(m[0])) continue;
    if (val >= 500 && val < 1e10) out.push(val);
    raw = '';
  }
  return out;
}

const STOP = new Set(
  'yang dan di ke dari untuk dengan ini itu buat bikin video konten tiktok reels shorts instagram ig tolong mau ingin dong ya aku saya kami kita kamu nya pada atau juga jadi agar supaya biar lebih paling sangat banget aja saja cuma hanya ada adalah akan sudah lagi bisa dalam tentang soal sebuah satu para promo diskon harga murah tips cara rp ribu rb jt juta'.split(' ')
);

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i > 0 && w.length <= 2 && w !== w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

const INTENT_WORDS = /\b(flash\s*sale|promo|diskon|sale|jual(an)?|dijual|launching|rilis|lowongan(\s+kerja)?|loker|dicari|webinar|workshop|seminar|event|acara|tips|trik|cara|fakta(\s+unik)?|unik|tutorial|langkah|resep|review|testimoni|kata-kata|kata kata|quotes?|galau|motivasi|pengumuman|gratis|buruan|terbatas|khusus|hari ini|via zoom|online|offline)\b/gi;
const DATE_WORDS = /\b(\d{1,2}\s+)?(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|agus|sep|okt|nov|des)\b(\s+\d{4})?/gi;

function detectTopic(clean: string): string {
  // ambil frasa inti: utamakan "tentang/soal/mengenai X", lalu setelah kata penanda umum
  const m =
    /(?:tentang|soal|mengenai)\s+([a-z0-9\s\-&']{3,60})/i.exec(clean) ||
    /(?:untuk|promo|jual|jualan|diskon|launching|menu|tips|cara|fakta|resep|tutorial|review|lowongan kerja|lowongan|loker|dicari|flash sale)\s+([a-z0-9\s\-&']{3,60})/i.exec(clean);
  let core = (m ? m[1] : clean).replace(DATE_WORDS, ' ').replace(INTENT_WORDS, ' ');
  core = core
    .replace(/\b(rp\.?\s*)?\d[\d.,]*\s*(rb|ribu|k|jt|juta|%)?/gi, ' ')
    .replace(/\b(di|ke|dari|dengan|cuma|hanya|mulai|harga|seharga|diskon|potongan|buat|untuk|yang|biar|agar)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = core.split(' ').filter((w) => w && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
  return words.slice(0, 5).join(' ') || clean.replace(INTENT_WORDS, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).slice(0, 4).join(' ') || 'produk';
}

function cleanListItem(s: string): string {
  return s
    .replace(/\b(?:di|ke|dari)\s+[A-Z][\w']+(?:\s+[A-Z\w'.]+)*.*$/, '')
    .replace(/\b(?:jl\.?|jalan)\s.*$/i, '')
    .replace(/(?:rp\.?\s*)?\d[\d.,]*\s*(?:rb|ribu|k|jt|juta)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractList(prompt: string): string[] {
  const lines = prompt.split(/\n/).map((l) => l.trim());
  const bullets = lines.filter((l) => /^([-•*✅▪️]|\d+[.)])\s+/.test(l)).map((l) => l.replace(/^([-•*✅▪️]|\d+[.)])\s+/, '').trim());
  if (bullets.length >= 2) return bullets;
  const colon = /:\s*([^:\n]+)$/m.exec(prompt);
  if (colon) {
    const parts = colon[1].split(/,|;|\s+dan\s+|\s+&\s+/i).map(cleanListItem).filter((s) => s.length > 1);
    if (parts.length >= 2) return parts;
  }
  const isi = /\b(?:isi(?:nya)?|menu(?:nya)?|fitur(?:nya)?|poin(?:nya)?|daftar(?:nya)?|meliputi|antara lain|yaitu|seperti)\s+(.+)$/im.exec(prompt);
  if (isi) {
    const parts = isi[1].split(/,|;|\s+dan\s+|\s+&\s+/i).map(cleanListItem).filter((s) => s.length > 1);
    if (parts.length >= 2) return parts;
  }
  return [];
}

/** Harga per item daftar (mis. "nasi goreng 15rb, mie ayam 12rb"). */
function listPrices(prompt: string): number[] {
  const seg = /:\s*([^:\n]+)$/m.exec(prompt)?.[1] || prompt;
  return seg.split(/,|;|\s+dan\s+/i).map((p) => extractPrices(p)[0] || 0);
}

function pickDomain(clean: string): keyof typeof TIPS_BANK {
  if (/uang|keuangan|nabung|tabung|investasi|gaji|hemat|saham|finansial|cuan/.test(clean)) return 'keuangan';
  if (/jualan|jual|bisnis|usaha|umkm|toko|closing|pembeli|olshop|marketing/.test(clean)) return 'jualan';
  if (/belajar|ujian|kuliah|sekolah|fokus|skripsi|bahasa|les/.test(clean)) return 'belajar';
  if (/sehat|diet|olahraga|tidur|gym|kesehatan|makan|berat badan/.test(clean)) return 'kesehatan';
  if (/konten|tiktok|fyp|viral|kreator|creator|youtube|followers|algoritma/.test(clean)) return 'konten';
  return 'umum';
}

function fill(t: string, v: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '').replace(/\s+/g, ' ').replace(/\s([?!.,])/g, '$1').trim();
}

function seeded(seed: number, n: number) {
  return Math.abs(Math.floor(Math.sin(seed * 9301 + 49297) * 233280)) % Math.max(1, n);
}

export interface AnalyzeOptions {
  seed?: number;
  sceneCount?: number;
  intentOverride?: Intent;
  price?: string;
  product?: string;
  store?: string;
}

export function detectIntent(prompt: string): { intent: Intent; scores: Array<[Intent, number]> } {
  const low = ` ${prompt.toLowerCase()} `;
  const scores = new Map<Intent, number>();
  for (const r of INTENT_RULES) {
    let s = 0;
    for (const w of r.words) if (low.includes(w)) s += w.includes(' ') ? 2 : 1;
    if (s) scores.set(r.intent, s * (r.weight || 1));
  }
  if (extractPrices(prompt).length) scores.set('promo-produk', (scores.get('promo-produk') || 0) + 1.5);
  if (/\d+\s*(tips|cara|trik|ide|alasan|kesalahan|manfaat|tanda)/i.test(prompt)) scores.set('tips', (scores.get('tips') || 0) + 2);
  if (/\d+\s*(langkah|step|tahap)/i.test(prompt)) scores.set('tutorial', (scores.get('tutorial') || 0) + 2.5);
  if (/\d+\s*(fakta)/i.test(prompt)) scores.set('fakta', (scores.get('fakta') || 0) + 2.5);
  if (/\d+\s*(tempat|destinasi|spot)/i.test(prompt)) scores.set('travel', (scores.get('travel') || 0) + 2.5);
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return { intent: sorted[0]?.[0] || (prompt.split(' ').length > 8 ? 'quote-motivasi' : 'promo-produk'), scores: sorted };
}

export function analyzePrompt(promptRaw: string, opts: AnalyzeOptions = {}): ContentPlan {
  const prompt = promptRaw.trim() || 'promo kopi susu gula aren 18rb';
  const seed = opts.seed ?? Math.floor(Math.random() * 100000);
  const clean = prompt.toLowerCase().replace(/\s+/g, ' ');
  const { intent: detected } = detectIntent(prompt);
  const intent = opts.intentOverride || detected;
  const category = CATEGORY_OF[intent];

  const prices = extractPrices(prompt);
  const listedEarly = extractList(prompt);
  const isMenuList = listedEarly.length >= 2 && prices.length >= 2;
  const discM = /(\d{1,2})\s*%/.exec(prompt);
  let price = opts.price || (prices.length ? formatRupiah(Math.min(...prices)) : undefined);
  let oldPrice = prices.length === 2 && !isMenuList ? formatRupiah(Math.max(...prices)) : undefined;
  let discount = discM ? `${discM[1]}%` : /beli\s*1\s*gratis\s*1|buy\s*1\s*get\s*1|b1g1/i.test(prompt) ? 'B1G1' : undefined;
  if (price && !oldPrice && discount && discount.endsWith('%')) {
    const p = Math.min(...prices);
    const d = Number(discount.replace('%', '')) / 100;
    if (d > 0 && d < 1) oldPrice = formatRupiah(Math.round(p / (1 - d) / 1000) * 1000);
  }
  if (isMenuList) price = opts.price || `Mulai ${formatRupiah(Math.min(...prices))}`;
  if (price && oldPrice && !discount) {
    const a = Math.min(...prices);
    const b = Math.max(...prices);
    if (b > a) discount = `${Math.round((1 - a / b) * 100)}%`;
  }

  const handle = /@[\w.]{2,30}/.exec(prompt)?.[0];
  const storeM = /\b(?:toko|warung|kedai|kafe|cafe|resto|di|by|dari)\s+([A-Z][\w']+(?:\s+[A-Z][\w']+){0,3})/.exec(prompt);
  const store = opts.store || storeM?.[1] || (handle ? handle.replace('@', '') : undefined);
  const locM = /\b(?:jl\.?|jalan|lokasi|alamat|di kota|di)\s+([A-Za-z0-9.\s]{3,40}?)(?:[,.\n]|$)/i.exec(prompt);
  const location = /jl\.?|jalan|lokasi|alamat/i.test(prompt) ? locM?.[0].replace(/^(lokasi|alamat)\s*/i, '').trim() : undefined;
  const dateM = /\b(\d{1,2}\s+(?:jan|feb|mar|apr|mei|jun|jul|agu|agus|sep|okt|nov|des)[a-z]*(?:\s+\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|besok|lusa|minggu ini|akhir pekan|weekend|(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu)(?:\s+ini)?)\b/i.exec(prompt);
  const date = dateM?.[0];

  const topic = detectTopic(clean);
  const listed = listedEarly;
  const product = opts.product || (isMenuList ? (store ? `Menu ${store}` : 'Menu Andalan') : titleCase(topic));
  const perItemPrice = isMenuList ? listPrices(prompt) : [];
  const countM = /(\d+)\s*(tips|cara|trik|ide|alasan|kesalahan|manfaat|tanda|langkah|step|tahap|fakta|tempat|destinasi|spot|menu|hal|rekomendasi)/i.exec(prompt);
  const nAsked = countM ? Number(countM[1]) : 0;

  const keywords = Array.from(new Set(clean.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))));

  const moodOf = (): ContentPlan['mood'] => {
    if (intent === 'quote-galau') return 'galau';
    if (/mewah|luxury|premium|eksklusif|elegan/.test(clean)) return 'mewah';
    if (/lucu|kocak|ngakak|gemes|receh/.test(clean)) return 'lucu';
    if (intent === 'flash-sale' || intent === 'launching' || intent === 'event') return 'energik';
    if (intent === 'quote-motivasi' || intent === 'ucapan') return 'hangat';
    if (intent === 'fakta' || intent === 'lowongan' || intent === 'pengumuman') return 'serius';
    if (/santai|tenang|chill|aesthetic|estetik/.test(clean)) return 'tenang';
    return category === 'promo' ? 'energik' : 'hangat';
  };
  const mood = moodOf();

  const vars: Record<string, string> = {
    produk: product,
    topik: topic,
    harga: price || 'harga spesial',
    diskon: discount || 'besar-besaran',
    toko: store || 'kami',
    n: String(nAsked || listed.length || 3),
  };

  const hookKey =
    intent === 'menu-kuliner' ? 'kuliner' : intent === 'promo-produk' ? 'promo' : intent === 'quote-motivasi' || intent === 'quote-galau' || intent === 'ucapan' ? 'cerita' : intent;
  const hookBank = HOOKS[hookKey] || HOOKS.promo;
  const hook = fill(hookBank[seeded(seed, hookBank.length)], vars);
  const ctaKey = intent === 'event' ? 'event' : intent === 'lowongan' ? 'lowongan' : category === 'promo' ? 'promo' : category === 'quote' ? 'quote' : 'edukasi';
  const ctaBank = CTAS[ctaKey];
  const cta = ctaBank[seeded(seed + 7, ctaBank.length)];

  const items: PlanItem[] = [];
  const iconFor = (words: string, fb = 'sparkles') => findIconFor(words.split(/\s+/).concat(keywords), fb);
  const push = (role: SceneRole, title: string, body?: string, value?: string, icon?: string) => items.push({ role, title, body, value, icon: icon || iconFor(title) });

  const wantPoints = (fallback: number) => Math.max(2, Math.min(8, nAsked || listed.length || fallback));
  const bankItems = (bank: string[][], n: number, ordered = false): Array<[string, string]> => {
    const out: Array<[string, string]> = [];
    for (let i = 0; i < n; i++) {
      if (listed[i]) out.push([titleCase(listed[i]), '']);
      else {
        const b = bank[((ordered ? 0 : seed) + i) % bank.length];
        out.push([b[0], b[1]]);
      }
    }
    return out;
  };

  switch (intent) {
    case 'flash-sale':
      push('hook', hook, discount ? `Diskon ${discount} khusus hari ini` : 'Hanya hari ini!', undefined, 'zap');
      push('produk', product, store ? `Langsung dari ${store}` : 'Kualitas terbaik, harga bersahabat', undefined, iconFor(product, 'shopping-bag'));
      listed.slice(0, 3).forEach((l) => push('poin', titleCase(l), '', undefined, iconFor(l, 'check')));
      push('harga', price || 'Harga Spesial', oldPrice, discount, 'badge-percent');
      push('bukti', 'Stok menipis!', 'Sudah terjual ratusan, sisa sedikit lagi', '87', 'flame');
      push('cta', cta, store, undefined, 'shopping-cart');
      break;
    case 'promo-produk':
    case 'menu-kuliner': {
      push('hook', hook, intent === 'menu-kuliner' ? 'Menu favorit pelanggan' : 'Promo spesial minggu ini', undefined, iconFor(product, 'flame'));
      if (listed.length >= 2) {
        listed.slice(0, 6).forEach((l, i) => push(intent === 'menu-kuliner' ? 'produk' : 'poin', titleCase(l), i === 0 ? 'Paling laris' : '', perItemPrice[i] ? formatRupiah(perItemPrice[i]) : undefined, iconFor(l, 'utensils')));
      } else {
        push('produk', product, store ? `Hanya di ${store}` : 'Dibuat dengan bahan pilihan', undefined, iconFor(product, 'gift'));
        const benefits = intent === 'menu-kuliner' ? ['Porsi melimpah', 'Rasa autentik', 'Harga ramah kantong'] : ['Kualitas terjamin', 'Pengiriman cepat', 'Bisa COD'];
        push('poin', benefits[0], benefits.slice(1).join(' • '), benefits.join('|'), 'badge-check');
      }
      if (price) push('harga', price, oldPrice, discount, 'tag');
      if (location || date) push('info', location ? 'Lokasi kami' : 'Catat tanggalnya', location || date, date, location ? 'map-pin' : 'calendar');
      push('bukti', 'Rating 4.9 dari pelanggan', 'Sudah dipercaya ribuan pembeli', '4.9', 'star');
      push('cta', cta, handle || store, undefined, 'shopping-cart');
      break;
    }
    case 'launching':
      push('hook', hook, 'Sesuatu yang baru telah hadir', undefined, 'rocket');
      push('masalah', 'Capek dengan cara lama?', 'Ribet, lama, dan mahal', undefined, 'frown');
      push('produk', product, store ? `Persembahan ${store}` : 'Solusi baru yang lebih mudah', undefined, iconFor(product, 'sparkles'));
      bankItems([['Lebih cepat', 'Hemat waktu sampai 2x'], ['Lebih mudah', 'Bisa dipakai siapa saja'], ['Lebih hemat', 'Harga perkenalan spesial']], wantPoints(3)).forEach(([t, b]) => push('poin', t, b));
      if (price) push('harga', price, oldPrice, discount || 'BARU', 'tag');
      push('cta', cta, handle || store, undefined, 'arrow-right');
      break;
    case 'event':
      push('hook', hook, store ? `Diselenggarakan oleh ${store}` : 'Jangan sampai ketinggalan', undefined, 'calendar');
      push('info', date ? `Tanggal: ${date}` : 'Segera hadir', 'Catat di kalendermu', date, 'calendar');
      push('info', location ? 'Lokasi' : 'Tempat', location || 'Online & offline', undefined, 'map-pin');
      bankItems([['Materi daging', 'Langsung dari praktisi'], ['Networking', 'Ketemu banyak teman baru'], ['Doorprize', 'Hadiah menarik untuk peserta']], wantPoints(3)).forEach(([t, b]) => push('poin', t, b));
      if (price) push('harga', price, oldPrice, discount, 'ticket');
      push('cta', cta, handle, undefined, 'ticket');
      break;
    case 'tips':
    case 'fakta':
    case 'travel': {
      const n = wantPoints(intent === 'travel' ? 4 : 3);
      vars.n = String(n);
      push('hook', fill(hookBank[seeded(seed, hookBank.length)], vars), intent === 'fakta' ? 'Nomor terakhir paling mengejutkan' : 'Simpan biar nggak lupa', undefined, intent === 'fakta' ? 'lightbulb' : intent === 'travel' ? 'plane' : 'lightbulb');
      const bank = intent === 'fakta' ? FACT_BANK : intent === 'travel' ? [['Spot sunrise', 'Datang sebelum jam 5 pagi'], ['Kuliner lokal', 'Cobain makanan khas setempat'], ['Hidden beach', 'Masih sepi dan bersih'], ['Penginapan murah', 'Mulai 150 ribuan per malam'], ['Pusat oleh-oleh', 'Harga lebih miring'], ['Spot foto', 'Paling instagramable']] : TIPS_BANK[pickDomain(clean)];
      bankItems(bank, n).forEach(([t, b], i) => push('poin', t, b, String(i + 1)));
      push('cta', cta, handle, undefined, 'bookmark');
      break;
    }
    case 'tutorial': {
      const n = wantPoints(4);
      vars.n = String(n);
      push('hook', fill(hookBank[seeded(seed, hookBank.length)], vars), 'Ikuti sampai selesai', undefined, 'list-checks');
      bankItems(STEP_BANK, n, true).forEach(([t, b], i) => push('langkah', t, b, String(i + 1)));
      push('bukti', 'Hasilnya!', 'Mudah kan? Coba sekarang juga', undefined, 'party-popper');
      push('cta', cta, handle, undefined, 'bookmark');
      break;
    }
    case 'testimoni':
      push('hook', hook, 'Review asli tanpa settingan', undefined, 'message-circle');
      push('bukti', 'Pelanggan', listed[0] || `Suka banget sama ${product}, bakal order lagi!`, undefined, 'message-circle');
      push('bukti', 'Rating', 'Dari ratusan ulasan', '4.9', 'star');
      push('bukti', 'Pelanggan setia', listed[1] || 'Pelayanannya ramah dan cepat', '1000', 'users');
      push('produk', product, store ? `Hanya di ${store}` : 'Buktikan sendiri', undefined, iconFor(product, 'gift'));
      push('cta', cta, handle || store, undefined, 'shopping-cart');
      break;
    case 'before-after':
      push('hook', hook, 'Lihat perbedaannya', undefined, 'sparkles');
      push('masalah', 'Sebelum', listed[0] || 'Kusam, ribet, dan bikin nggak pede', undefined, 'frown');
      push('produk', 'Sesudah', listed[1] || `Pakai ${product}, hasilnya langsung terasa`, undefined, 'smile');
      push('bukti', 'Hasil nyata', 'Dalam hitungan hari', '7', 'calendar-check');
      if (price) push('harga', price, oldPrice, discount, 'tag');
      push('cta', cta, handle || store, undefined, 'shopping-cart');
      break;
    case 'lowongan': {
      push('hook', fill(hookBank[seeded(seed, hookBank.length)], vars), store ? `Bergabung bersama ${store}` : 'Kesempatan terbuka untuk kamu', undefined, 'briefcase');
      bankItems([['Usia 18–30 tahun', ''], ['Komunikatif & jujur', ''], ['Siap kerja shift', ''], ['Pengalaman jadi nilai plus', '']], wantPoints(3)).forEach(([t, b], i) => push('poin', t, b, String(i + 1), 'check'));
      push('info', 'Benefit', 'Gaji kompetitif • Bonus • Jenjang karier', 'Gaji kompetitif|Bonus|Jenjang karier', 'gift');
      push('cta', cta, handle, undefined, 'send');
      break;
    }
    case 'pengumuman':
      push('hook', hook, store || '', undefined, 'megaphone');
      (listed.length ? listed.slice(0, 3) : [topic]).forEach((l) => push('info', titleCase(l), date || '', date, iconFor(l, 'info')));
      push('cta', 'Terima kasih atas perhatiannya', handle || store, undefined, 'heart');
      break;
    case 'ucapan': {
      const q = QUOTES.ucapan;
      push('kutipan', titleCase(topic.startsWith('selamat') ? topic : `Selamat ${topic}`), '', undefined, 'party-popper');
      push('kutipan', q[seeded(seed, q.length)], store ? `— ${store}` : '', undefined, 'heart');
      push('cta', store ? `Dari kami, ${store}` : 'Salam hangat', handle, undefined, 'heart');
      break;
    }
    case 'quote-motivasi':
    case 'quote-galau':
    case 'cerita': {
      const bank = [...(intent === 'quote-galau' ? QUOTES.galau : QUOTES.motivasi)];
      const quoted = Array.from(prompt.matchAll(/["“]([^"”]{8,200})["”]/g)).map((m) => m[1].trim());
      const own = quoted.length
        ? quoted
        : prompt
            .split(/[.!?\n]/)
            .map((s) => s.trim())
            .filter((s) => s.split(' ').length >= 5 && !/(buat|bikin|tolong|video|konten|kata-kata|kata kata|quotes?|caption|tentang|yang lagi|untuk yang)/i.test(s));
      const prefer = /kangen|rindu/.test(clean) ? 'rindu' : /capek|lelah/.test(clean) ? 'capek' : /mantan|pergi/.test(clean) ? 'pergi' : /semangat|sukses|kerja/.test(clean) ? 'proses' : '';
      if (prefer) bank.sort((a, b) => Number(b.toLowerCase().includes(prefer)) - Number(a.toLowerCase().includes(prefer)));
      const n = Math.max(2, Math.min(5, nAsked || own.length || 3));
      if (intent === 'cerita') push('hook', hook, '', undefined, 'book-open');
      for (let i = 0; i < n; i++) push('kutipan', own[i] || bank[(prefer ? i : seed + i) % bank.length], '', undefined, intent === 'quote-galau' ? 'moon' : 'sun');
      push('cta', cta, handle, undefined, 'heart');
      break;
    }
  }

  if (opts.sceneCount && opts.sceneCount > 1) {
    while (items.length > opts.sceneCount) {
      const idx = items.findIndex((it, i) => i > 0 && i < items.length - 1 && (it.role === 'poin' || it.role === 'bukti' || it.role === 'info' || it.role === 'masalah'));
      items.splice(idx > 0 ? idx : items.length - 2, 1);
    }
    let extra = 0;
    while (items.length < opts.sceneCount) {
      const b = TIPS_BANK[pickDomain(clean)][(seed + extra++) % 8];
      items.splice(items.length - 1, 0, { role: 'poin', title: b[0], body: b[1], icon: findIconFor(b[0].split(' '), 'sparkles') });
    }
  }

  const tagBase = keywords.slice(0, 4).map((k) => `#${k.replace(/[^a-z0-9]/g, '')}`);
  const hashtags = Array.from(new Set([...tagBase, '#fyp', category === 'promo' ? '#promo' : category === 'quote' ? '#quotes' : '#edukasi', '#tiktokindonesia', intent === 'menu-kuliner' ? '#kulinerindonesia' : intent === 'tips' ? '#tipsandtrick' : '#viral'])).slice(0, 8);
  const caption = `${hook}${price ? ` — ${price}` : ''}. ${cta}`;

  return {
    prompt,
    intent,
    category,
    mood,
    product,
    store,
    price,
    oldPrice,
    discount,
    cta,
    handle,
    location,
    date,
    keywords,
    items,
    caption,
    hashtags,
  };
}

export { CATEGORY_OF };
