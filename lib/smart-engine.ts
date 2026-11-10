/**
 * ============================================================================
 * MOTIONKU - SMART TEMPLATE ENGINE & RULE-BASED GENERATOR (V3 - ADMIN TRAINABLE)
 * File: lib/smart-engine.ts
 * ============================================================================
 * PENTING:
 * 1. Berjalan 100% LOKAL tanpa API AI eksternal (tanpa OpenAI, Gemini, Claude).
 * 2. Dilengkapi fungsi `parseTopic(topik)` dengan regex harga `/(\d+[.,]?\d*)\s*(rb|ribu|k|jt)/i`
 *    dan deteksi emosi (`galau`, `sedih`, `capek`, `promo`, `diskon`).
 * 3. Dilengkapi 60 Hook, 72 variasi kalimat Scene (24 per kategori), dan 35 CTA.
 * 4. Mendukung Admin Training (`kakangkasyaf@gmail.com`) untuk menambahkan Hook,
 *    kalimat Scene, CTA, dan Gambar Asset baru secara dinamis.
 * 5. Musik menggunakan 5 link MP3 CDN bebas copyright + file lokal `/music/*.mp3`
 *    dengan fallback otomatis ke Web Audio Synthesizer jika gagal dimuat.
 * ============================================================================
 */

export type CategoryType = 'quote' | 'promo' | 'edukasi';

export type AnimationType = 'pop' | 'slide-up' | 'typewriter' | 'bounce' | 'fade' | 'zoom';

export type AspectRatioType = '9:16' | '1:1' | '16:9';

export interface SceneItem {
  id: string;
  sceneNumber: number;
  role: 'Hook / Masalah' | 'Isi / Solusi' | 'Bukti / Harga' | 'CTA Akhir';
  text: string;
  subtext: string;
  emoji: string;
  duration: number;
  animation: AnimationType;
  imageUrl?: string; // Opsional: Gambar khusus per scene yang di-upload user
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
  font: 'Poppins' | 'Montserrat' | 'Bebas Neue' | 'Playfair Display' | 'Space Grotesk' | 'Anton';
  musicId: string;
  music: MusicTrack;
  backgroundType: 'solid' | 'gradient' | 'image';
  gradientPreset: string;
  moodLabel: string;
}

export interface ParsedTopicMeta {
  cleanTopic: string;
  productName: string;
  priceText: string;
  originalPriceText: string;
  storeName: string;
  emotionKeyword: string;
  detectedMood: 'galau' | 'promo' | 'edukasi' | 'netral';
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
}

export interface GenerateOptions {
  customPrice?: string;
  customProductName?: string;
  customStoreName?: string;
  excludeHooks?: string[];
  forceRandomPalette?: boolean;
  userImages?: string[];
}

// ============================================================================
// 1. KOLEKSI GAMBAR PICSUM.PHOTOS & ASSET ADMIN (BUKAN UNSPLASH SOURCE)
// ============================================================================
export const CUSTOM_IMAGE_ASSETS: CustomImageAsset[] = [
  {
    id: 'picsum-coffee',
    title: 'Kopi Susu & Kuliner UMKM',
    category: 'promo',
    url: 'https://picsum.photos/seed/motionku-coffee/720/1280',
  },
  {
    id: 'picsum-night-rain',
    title: 'Malam Hujan Estetik (Quote)',
    category: 'quote',
    url: 'https://picsum.photos/seed/motionku-rain/720/1280',
  },
  {
    id: 'picsum-workspace',
    title: 'Meja Kerja & Edukasi',
    category: 'edukasi',
    url: 'https://picsum.photos/seed/motionku-study/720/1280',
  },
  {
    id: 'picsum-streetfood',
    title: 'Kuliner & Produk Lokal',
    category: 'promo',
    url: 'https://picsum.photos/seed/motionku-food/720/1280',
  },
  {
    id: 'picsum-sunset',
    title: 'Senja & Renungan Hati',
    category: 'quote',
    url: 'https://picsum.photos/seed/motionku-sunset/720/1280',
  },
  {
    id: 'picsum-tech',
    title: 'Teknologi & Coding Modern',
    category: 'edukasi',
    url: 'https://picsum.photos/seed/motionku-tech/720/1280',
  },
];

// ============================================================================
// 2. PALET WARNA PRESET (8 PALET MODERN)
// ============================================================================
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'promo-merah-kuning',
    name: 'Flash Promo (Merah & Kuning)',
    bgPrimary: '#991B1B',
    bgSecondary: '#DC2626',
    textColor: '#FFFFFF',
    accentColor: '#FACC15',
    badgeTextColor: '#7F1D1D',
  },
  {
    id: 'midnight-galau',
    name: 'Midnight Galau (Gelap & Ungu)',
    bgPrimary: '#090D16',
    bgSecondary: '#1E1B4B',
    textColor: '#F8FAFC',
    accentColor: '#A78BFA',
    badgeTextColor: '#0F172A',
  },
  {
    id: 'tech-blue',
    name: 'Edu Chill (Biru & Putih)',
    bgPrimary: '#0F172A',
    bgSecondary: '#1D4ED8',
    textColor: '#FFFFFF',
    accentColor: '#38BDF8',
    badgeTextColor: '#082F49',
  },
  {
    id: 'sunset-orange',
    name: 'Warm Sunset (Oranye & Emas)',
    bgPrimary: '#7C2D12',
    bgSecondary: '#EA580C',
    textColor: '#FFF7ED',
    accentColor: '#FDE047',
    badgeTextColor: '#431407',
  },
  {
    id: 'fresh-emerald',
    name: 'UMKM Fresh (Hijau & Mint)',
    bgPrimary: '#064E3B',
    bgSecondary: '#059669',
    textColor: '#ECFDF5',
    accentColor: '#34D399',
    badgeTextColor: '#022C22',
  },
  {
    id: 'neon-cyber',
    name: 'Cyber Neon (Magenta & Cyan)',
    bgPrimary: '#180926',
    bgSecondary: '#701A75',
    textColor: '#FDF4FF',
    accentColor: '#22D3EE',
    badgeTextColor: '#090D16',
  },
  {
    id: 'warm-sepia',
    name: 'Aesthetic Coffee (Cokelat & Krem)',
    bgPrimary: '#1C1917',
    bgSecondary: '#44403C',
    textColor: '#F5F5F4',
    accentColor: '#FBBF24',
    badgeTextColor: '#1C1917',
  },
  {
    id: 'cyber-lime',
    name: 'High Contrast (Hitam & Lime)',
    bgPrimary: '#09090B',
    bgSecondary: '#27272A',
    textColor: '#FAFAFA',
    accentColor: '#A3E635',
    badgeTextColor: '#09090B',
  },
];

// ============================================================================
// 3. DAFTAR MUSIK (5 LINK MP3 BEBAS COPYRIGHT DARI CDN + LOKAL + FALLBACK SYNTH)
// ============================================================================
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'energetic-promo',
    title: 'Beat Promo Viral (Energetic)',
    mood: 'energetic',
    bpm: 128,
    url: '/music/energetic-promo.mp3',
    cdnUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'Ketukan cepat & berenergi tinggi cocok untuk Flash Sale dan Promo UMKM',
  },
  {
    id: 'slow-galau',
    title: 'Lo-Fi Hujan Malam (Slow Piano)',
    mood: 'slow',
    bpm: 72,
    url: '/music/slow-galau.mp3',
    cdnUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: 'Alunan piano lembut dan ambient syahdu untuk konten Quote & renungan',
  },
  {
    id: 'chill-edukasi',
    title: 'Chill Synth Focus (Edukasi)',
    mood: 'chill',
    bpm: 96,
    url: '/music/chill-edukasi.mp3',
    cdnUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    description: 'Musik latar modern yang tenang agar penonton fokus membaca tips & fakta',
  },
  {
    id: 'upbeat-kuliner',
    title: 'Funky Cafe Groove (Upbeat)',
    mood: 'upbeat',
    bpm: 115,
    url: '/music/upbeat-kuliner.mp3',
    cdnUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    description: 'Irama ceria yang pas untuk review makanan, kopi, dan produk lifestyle',
  },
  {
    id: 'dramatic-hook',
    title: 'Cinematic Pulse (Dramatic)',
    mood: 'dramatic',
    bpm: 105,
    url: '/music/dramatic-hook.mp3',
    cdnUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    description: 'Ketukan suspens untuk fakta mengejutkan, misteri, dan tebak-tebakan',
  },
];

// ============================================================================
// 4. BANK HOOK (60+ TEMPLATE HOOK — DAPAT DITAMBAH OLEH ADMIN kakangkasyaf@gmail.com)
// ============================================================================
export const BANK_HOOK: Record<CategoryType, string[]> = {
  promo: [
    'STOP SCROLL! Promo {produk} paling gila bulan ini!',
    'Cuma {harga} doang bisa dapet {produk} seenak ini?!',
    'Jangan beli {produk} di tempat lain sebelum nonton ini!',
    'PROMO GILA {produk} khusus hari ini di {toko}!',
    'Seriusan {produk} kualitas premium harganya cuma {harga}?!',
    'Warga TikTok wajib tahu! {produk} lagi banting harga jadi {harga}!',
    'Dompet tipis tapi pengen {produk}? Ini penyelamat lu!',
    'Rugi banget kalau kelewatan promo {produk} {harga} ini!',
    'Nyesel baru tahu sekarang! {produk} di {toko} cuma {harga}!',
    'Bocor halus! Rahasia jajan {produk} hemat cuma {harga}!',
    'Gak masuk akal! {produk} sebanyak ini cuma bayar {harga}!',
    'Siapa cepat dia dapat! Kuota promo {produk} {harga} tinggal dikit!',
    'Pecinta {produk} merapat! Ada diskon sadis di {toko}!',
    'Tanggal tua tetep bisa nikmatin {produk} cuma modal {harga}!',
    'Viral banget! Ini alasan {produk} di {toko} selalu ludes!',
    'Ekspektasi vs Realita beli {produk} seharga {harga}!',
    'Bikin nagih! Sekali coba {produk} ini dijamin repeat order!',
    'Harga kaki lima, kualitas bintang lima: {produk} cuma {harga}!',
    'Jangan bilang siapa-siapa! Kode promo {produk} {harga} bocor!',
    'Auto borong! {produk} favorit sekarang turun harga jadi {harga}!',
  ],
  quote: [
    'Dengerin ini kalau lu lagi capek banget sama {topik}...',
    'Kata-kata soal {topik} ini bakal nampar keras hidup lu...',
    'Baca pelan-pelan, pesan tentang {topik} ini buat lu yang lagi berjuang.',
    'Suatu saat lu bakal paham kenapa {topik} itu harus terjadi...',
    'Jangan skip kalau hari ini hati lu lagi ngerasa {topik}...',
    'Untuk jiwa yang diam-diam menahan {topik} sendirian setiap malam.',
    'Ternyata dewasa itu bukan soal umur, tapi soal menerima {topik}.',
    'Berhenti nyalahin diri sendiri soal {topik}, lu udah hebat banget.',
    'Satu kalimat tentang {topik} yang ngubah cara pandang gue 180 derajat.',
    'Kalau lu ngerasa gagal gara-gara {topik}, inget satu hal ini...',
    'Gak semua orang perlu tahu betapa beratnya {topik} yang lu lewatin.',
    'Tarik napas dulu... {topik} yang lu khawatirin bakal baik-baik aja.',
    'Jangan paksa semua orang ngerti tentang {topik} yang lu rasain.',
    'Terkadang obat terbaik dari {topik} adalah ikhlas dan jalan terus.',
    'Validasi terbaik saat menghadapi {topik} datang dari diri lu sendiri.',
    'Kenyataan pahit soal {topik} yang jarang berani diomongin orang.',
    'Peluk jauh buat lu yang hari ini tetep senyum meski lagi {topik}.',
    'Nggak apa-apa istirahat sebentar dari {topik}, asal jangan menyerah.',
    'Cara paling elegan membalas rasa {topik} adalah dengan bahagia.',
    'Simpan pengingat {topik} ini buat malam-malam saat lu ngerasa sendiri.',
  ],
  edukasi: [
    '90% orang masih salah besar soal {topik}! Ini faktanya.',
    '{angka} cara mudah menguasai {topik} yang gak diajarin di sekolah!',
    'Jangan lakukan kesalahan ini saat mulai belajar {topik}!',
    'Fakta mengejutkan tentang {topik} yang jarang diketahui banyak orang!',
    'Rahasia {topik} yang bikin hasil kerja lu 10x lebih cepat!',
    'Cuma butuh 30 detik buat paham konsep {topik} sampai ke akarnya!',
    'Kenapa banyak pemula gagal di {topik}? Ternyata ini penyebabnya!',
    'Stop buang waktu! Ini jalan pintas belajar {topik} yang terbukti efektif.',
    'Tebak-tebakan cepat: Seberapa paham lu tentang {topik} sebenarnya?',
    '{angka} tanda lu sudah jauh lebih maju dalam {topik} dibanding rata-rata!',
    'Mitos vs Fakta seputar {topik} yang sering bikin orang terkecoh!',
    'Kalau gue harus ngulang belajar {topik} dari nol, ini yang bakal gue lakuin.',
    'Hack sederhana untuk {topik} yang hemat waktu dan biaya!',
    'Banyak yang belum tahu! Begini cara kerja {topik} yang sesungguhnya.',
    'Cek sekarang! Apakah cara lu menerapkan {topik} sudah benar?',
    '{angka} langkah praktis upgrade skill {topik} langsung dari HP lu!',
    'Bongkar tuntas rumus rahasia di balik kesuksesan {topik}!',
    'Hindari {angka} jebakan fatal ini kalau lu mau ahli di bidang {topik}!',
    'Ilmu mahal! Rangkuman materi {topik} paling daging dalam 15 detik.',
    'Satu kebiasaan kecil terkait {topik} yang berdampak besar di masa depan!',
  ],
};

// ============================================================================
// 5. BANK VARIASI KALIMAT SCENE (24 VARIASI PER KATEGORI = 72 KALIMAT SCENE)
// ============================================================================
export interface SceneTemplateEntry {
  text: string;
  subtext: string;
  emoji: string;
}

export const BANK_SCENES: Record<
  CategoryType,
  {
    scene2: SceneTemplateEntry[];
    scene3: SceneTemplateEntry[];
  }
> = {
  promo: {
    scene2: [
      {
        text: 'Kenalin: {produk} dengan racikan bahan premium yang bikin nagih!',
        subtext: 'Dibuat fresh setiap hari di {toko} dengan standar kualitas terbaik.',
        emoji: '✨',
      },
      {
        text: 'Kenapa {produk} di {toko} selalu antre panjang setiap hari?',
        subtext: 'Karena porsinya melimpah, rasanya otentik, dan gak pelit topping!',
        emoji: '🔥',
      },
      {
        text: 'Solusi mood booster paling ampuh hari ini: {produk} spesial!',
        subtext: 'Cocok dinikmati sendiri atau bareng temen satu tongkrongan.',
        emoji: '🥤',
      },
      {
        text: 'Bukan {produk} biasa! Sekali coba langsung berasa bedanya.',
        subtext: 'Racikan rahasia khas {toko} yang gak bakal lu temuin di tempat lain.',
        emoji: '🌟',
      },
      {
        text: 'Lagi cari {produk} yang enak tapi ramah di kantong mahasiswa?',
        subtext: '{toko} hadir bawa kualitas bintang lima dengan harga bersahabat.',
        emoji: '💎',
      },
      {
        text: 'Upgrade harimu dengan kelezatan {produk} paling hits minggu ini!',
        subtext: 'Bahan baku pilihan langsung diolah saat pesanan kamu masuk.',
        emoji: '🍽️',
      },
      {
        text: '3 Alasan {produk} ini wajib masuk daftar pesananmu hari ini:',
        subtext: '1. Rasa juara • 2. Porsi puas • 3. Harga super hemat di {toko}.',
        emoji: '🏆',
      },
      {
        text: 'Jangan biarin perut keroncongan! {produk} siap nemenin aktivitasmu.',
        subtext: 'Praktis, higienis, dan bisa langsung pesan dari HP kamu.',
        emoji: '⚡',
      },
      {
        text: 'Menu best-seller paling dicari di {toko}: {produk}!',
        subtext: 'Perpaduan rasa yang pas banget di lidah orang Indonesia.',
        emoji: '😍',
      },
      {
        text: 'Udah ratusan porsi {produk} terjual ludes hanya dalam hitungan jam!',
        subtext: 'Pastikan kamu kebagian kuota produksi hari ini di {toko}.',
        emoji: '🚀',
      },
      {
        text: 'Bingung mau jajan apa? {produk} dari {toko} jawabannya!',
        subtext: 'Garansi puas 100% sejak suapan atau tegukan pertama.',
        emoji: '💯',
      },
      {
        text: 'Spesial buat kamu pecinta {produk} sejati yang anti kompromi soal rasa!',
        subtext: 'Kualitas terjaga ketat langsung dari dapur {toko}.',
        emoji: '👑',
      },
    ],
    scene3: [
      {
        text: 'Harga Normal {harga_coret} ➔ Hari Ini CUMA {harga}!',
        subtext: 'Sudah 1.200+ pelanggan puas di {toko} • Rating 4.9/5 ⭐',
        emoji: '💸',
      },
      {
        text: 'Cuma modal {harga} udah dapet {produk} komplit tanpa syarat ribet!',
        subtext: 'Hemat jauh dibanding harga normal {harga_coret} di luar sana.',
        emoji: '🏷️',
      },
      {
        text: 'Banting Harga! Dari {harga_coret} sekarang tebus murah {harga} aja!',
        subtext: 'Promo terbatas khusus 50 pembeli pertama di {toko} hari ini.',
        emoji: '⏳',
      },
      {
        text: 'Testimoni jujur: "Gila sih, {produk} seharga {harga} rasanya mewah banget!"',
        subtext: '9 dari 10 pelanggan {toko} langsung repeat order minggu depannya.',
        emoji: '⭐',
      },
      {
        text: 'Paket Hemat {produk}: Cukup bayar {harga} (Hemat dari {harga_coret})!',
        subtext: 'Berlaku untuk pembelian langsung maupun pemesanan online.',
        emoji: '🎁',
      },
      {
        text: 'Kantong aman, hati senang! {produk} favorit cuma {harga} nett!',
        subtext: 'Gak ada biaya tambahan tersembunyi, langsung klaim di {toko}.',
        emoji: '🤑',
      },
      {
        text: 'Flash Deal {toko}: Coret harga {harga_coret}, bungkus sekarang {harga}!',
        subtext: 'Stok promo menipis setiap jam, jangan sampai gigit jari.',
        emoji: '🔔',
      },
      {
        text: 'Bandingin sendiri! Kualitas setara {harga_coret} tapi kamu cukup bayar {harga}!',
        subtext: 'Terbukti paling worth-it se-TikTok bulan ini.',
        emoji: '📊',
      },
      {
        text: 'Promo Spesial Akhir Pekan: {produk} turun harga drastis jadi {harga}!',
        subtext: 'Ajak teman atau pasanganmu biar makin hemat di {toko}.',
        emoji: '🎉',
      },
      {
        text: 'Rating 4.9 Bintang! Ribuan orang udah buktiin nikmatnya {produk} {harga} ini.',
        subtext: 'Sekarang giliran kamu yang cobain langsung di {toko}!',
        emoji: '🌟',
      },
      {
        text: 'Diskon Sadis! Potongan langsung dari {harga_coret} jadi cuma {harga}!',
        subtext: 'Tunjukkan video ini ke admin atau kasir {toko} saat memesan.',
        emoji: '🎟️',
      },
      {
        text: 'Harga jujur paling bersahabat: {produk} porsi jumbo cuma {harga}!',
        subtext: 'Dijamin kenyang, puas, dan gak bikin dompet menangis.',
        emoji: '🔥',
      },
    ],
  },
  quote: {
    scene2: [
      {
        text: '"Terkadang {topik} hadir bukan untuk menjatuhkanmu, tapi mengajarkanmu arti ketenangan."',
        subtext: 'Tidak semua hal harus selesai dan terjawab malam ini juga.',
        emoji: '🌧️',
      },
      {
        text: '"Kamu tidak sedang tertinggal. Setiap orang punya garis waktu berbeda saat menghadapi {topik}."',
        subtext: 'Berhentilah membandingkan bab pertamamu dengan bab terakhir orang lain.',
        emoji: '🌙',
      },
      {
        text: '"Ada hari di mana bertahan melewati {topik} saja sudah merupakan pencapaian besar."',
        subtext: 'Apresiasi dirimu yang tetap melangkah meski dengan hati yang lelah.',
        emoji: '🍂',
      },
      {
        text: '"Rasa sakit dari {topik} yang kamu rasakan hari ini adalah benih kekuatanmu esok hari."',
        subtext: 'Percayalah, tidak ada hujan yang turun selamanya tanpa reda.',
        emoji: '🌱',
      },
      {
        text: '"Jangan menyalahkan dirimu atas {topik} yang berada di luar kendali tanganmu."',
        subtext: 'Fokuslah pada ketenangan batinmu dan lepaskan sisanya perlahan.',
        emoji: '🕊️',
      },
      {
        text: '"Terkadang kita harus kehilangan ekspektasi soal {topik} agar bisa menemukan damai yang sejati."',
        subtext: 'Menerima kenyataan adalah langkah awal menuju pemulihan.',
        emoji: '🌊',
      },
      {
        text: '"Diam bukan berarti kalah. Dalam menghadapi {topik}, diam adalah cara kita menjaga kewarasan."',
        subtext: 'Hemat energimu untuk hal-hal yang benar-benar menghargaimu.',
        emoji: '🕯️',
      },
      {
        text: '"Tidak apa-apa jika hari ini kamu merasa lelah dengan {topik}. Istirahatlah, bukan berhenti."',
        subtext: 'Tubuh dan pikiranmu juga punya hak untuk mengambil jeda.',
        emoji: '☕',
      },
      {
        text: '"Orang hanya melihat senyummu di luar, tanpa tahu badai {topik} yang sedang kamu redam di dalam."',
        subtext: 'Terima kasih sudah bertahan sejauh ini tanpa menyerah.',
        emoji: '🌌',
      },
      {
        text: '"Suatu hari nanti, kamu akan mengenang masa {topik} ini sambil tersenyum lega."',
        subtext: 'Waktu akan menyembuhkan apa yang tidak bisa dijelaskan oleh logika.',
        emoji: '🌅',
      },
      {
        text: '"Jangan mengemis perhatian saat kamu sedang berjuang melawan {topik} sendirian."',
        subtext: 'Pelukan terhangat justru datang saat kamu berdamai dengan dirimu sendiri.',
        emoji: '🫂',
      },
      {
        text: '"Kecewa karena {topik} itu manusiawi, tapi jangan biarkan itu mematikan cahayamu."',
        subtext: 'Kamu tetap berharga terlepas dari penilaian siapa pun.',
        emoji: '✨',
      },
    ],
    scene3: [
      {
        text: 'Lihat ke belakang: Sudah berapa banyak badai berat yang berhasil kamu lewati sejauh ini?',
        subtext: 'Kamu jauh lebih tangguh dari yang kamu kira selama ini.',
        emoji: '🤍',
      },
      {
        text: 'Mulai malam ini, maafkan dirimu atas semua hal tentang {topik} yang belum berjalan sempurna.',
        subtext: 'Kamu sedang bertumbuh, dan proses bertumbuh memang butuh waktu.',
        emoji: '🌷',
      },
      {
        text: 'Ingat satu hal: Nilai dirimu sama sekali tidak berkurang hanya karena ujian {topik} ini.',
        subtext: 'Esok pagi selalu membawa kesempatan baru untuk memulai kembali.',
        emoji: '☀️',
      },
      {
        text: 'Tarik napas dalam-dalam, hembuskan perlahan... biarkan beban {topik} itu luruh satu per satu.',
        subtext: 'Kamu berhak tidur dengan hati yang tenang malam ini.',
        emoji: '🍃',
      },
      {
        text: 'Buktinya sampai detik ini kamu masih berdiri tegak meski sempat dihantam {topik}.',
        subtext: 'Itu adalah bukti nyata bahwa mentalmu sekuat baja.',
        emoji: '🛡️',
      },
      {
        text: 'Kelilingi dirimu dengan hal positif dan jauhi lingkungan yang memperparah {topik}.',
        subtext: 'Ketenangan pikiranmu jauh lebih mahal daripada validasi semu.',
        emoji: '💎',
      },
      {
        text: 'Jangan takut melangkah sendiri setelah melewati fase {topik} yang melelahkan ini.',
        subtext: 'Terkadang jalan terbaik memang ditempuh dalam keheningan.',
        emoji: '🛤️',
      },
      {
        text: 'Percayalah, skenario Tuhan di balik {topik} selalu berakhir jauh lebih indah dari rencanamu.',
        subtext: 'Tugasmu hanya terus melangkah dan berprasangka baik.',
        emoji: '🤲',
      },
      {
        text: 'Setiap luka dari {topik} yang berhasil kamu sembuhkan akan menjadi kebijaksanaan baru.',
        subtext: 'Kamu tidak lagi berada di titik yang sama seperti kemarin.',
        emoji: '🦋',
      },
      {
        text: 'Berhentilah menoleh ke masa lalu. Bab baru setelah {topik} sudah menunggumu di depan.',
        subtext: 'Pegang kendali penuh atas kebahagiaanmu sendiri mulai hari ini.',
        emoji: '🗝️',
      },
      {
        text: 'Saat dunia terasa bising oleh {topik}, kembalilah pulang ke dalam ketenangan hatimu.',
        subtext: 'Di sanalah tempat paling aman untuk memulihkan energi.',
        emoji: '🏡',
      },
      {
        text: 'Kamu tidak sendirian. Jutaan orang di luar sana juga sedang berjuang menaklukkan {topik}.',
        subtext: 'Mari saling menguatkan dan terus melangkah maju.',
        emoji: '🌟',
      },
    ],
  },
  edukasi: {
    scene2: [
      {
        text: '1. Pahami fondasi dasar {topik}\n2. Praktekkan minimal 20 menit setiap hari',
        subtext: 'Konsistensi kecil setiap hari mengalahkan teori berjam-jam tanpa aksi.',
        emoji: '🚀',
      },
      {
        text: 'Kesalahan terbesar pemula di {topik}: Terlalu banyak menghafal tapi takut mencoba praktek!',
        subtext: 'Padahal 80% pemahaman justru muncul saat kamu langsung terjun mencoba.',
        emoji: '⚠️',
      },
      {
        text: 'Rumus 3P untuk menguasai {topik}: Pelajari polanya, Praktekkan langsung, dan Perbaiki evaluasi.',
        subtext: 'Framework sederhana yang dipakai para profesional di bidangnya.',
        emoji: '🧠',
      },
      {
        text: 'Tahukah kamu? Menguasai 20% inti dari {topik} sudah cukup menghasilkan 80% dampak utama!',
        subtext: 'Itulah penerapan Prinsip Pareto (80/20) agar belajarmu super efisien.',
        emoji: '🎯',
      },
      {
        text: 'Langkah Pertama: Pecah target besar {topik} menjadi 3 kebiasaan mikro harian.',
        subtext: 'Otak manusia jauh lebih mudah menyerap materi yang dicicil terstruktur.',
        emoji: '🧩',
      },
      {
        text: 'Rahasia cepat paham {topik}: Cobalah jelaskan kembali konsepnya dengan bahasa anak SD!',
        subtext: 'Metode Teknik Feynman ini langsung membongkar bagian mana yang belum kamu kuasai.',
        emoji: '💡',
      },
      {
        text: 'Jangan langsung beli alat mahal untuk {topik}! Maksimalkan dulu tools gratis yang ada.',
        subtext: 'Skill dan jam terbang jauh lebih menentukan hasil daripada sekadar perlengkapan.',
        emoji: '🛠️',
      },
      {
        text: 'Fakta Riset: Fokus tanpa distraksi selama 25 menit pada {topik} setara 2 jam belajar sambil buka sosmed!',
        subtext: 'Gunakan teknik Pomodoro untuk menjaga fokus tetap tajam.',
        emoji: '⏱️',
      },
      {
        text: 'Urutan belajar {topik} yang benar: Kuasai konsep dasar ➔ Tiru studi kasus ➔ Modifikasi sendiri.',
        subtext: 'Formula ATM (Amati, Tiru, Modifikasi) mempercepat kurva belajarmu 3x lipat.',
        emoji: '📐',
      },
      {
        text: 'Kenapa banyak yang mentok di {topik}? Karena tidak mencatat progres dan kesalahan mingguan!',
        subtext: 'Apa yang tidak diukur tidak akan pernah bisa ditingkatkan secara terarah.',
        emoji: '📓',
      },
      {
        text: 'Bedah Mitos {topik}: Kamu TIDAK butuh bakat lahiriah, yang kamu butuhkan adalah sistem latihan yang tepat!',
        subtext: 'Deliberate practice selama 30 hari berturut-turut akan mengubah levelmu.',
        emoji: '🔓',
      },
      {
        text: 'Hack Produktivitas {topik}: Siapkan materi latihanmu malam sebelumnya agar esok pagi tinggal eksekusi!',
        subtext: 'Mengurangi friksi awal adalah kunci agar kamu tidak menunda-nunda (prokrastinasi).',
        emoji: '⚡',
      },
    ],
    scene3: [
      {
        text: '3. Evaluasi hasil mingguan! Terbukti meningkatkan penguasaan {topik} hingga 3x lipat lebih cepat.',
        subtext: 'Metode praktis yang sudah teruji oleh ribuan praktisi sukses.',
        emoji: '📈',
      },
      {
        text: 'Hasilnya: Dalam 14 hari pertama, kamu bakal melihat lompatan progres {topik} yang signifikan!',
        subtext: 'Mulai dari langkah paling kecil hari ini tanpa menunggu sempurna.',
        emoji: '🏆',
      },
      {
        text: 'Bandingkan: 1 jam praktek terfokus pada {topik} setiap hari = 365 jam keahlian baru dalam setahun!',
        subtext: 'Investasi leher ke atas adalah aset yang tidak akan pernah tergerus inflasi.',
        emoji: '💎',
      },
      {
        text: 'Checklist Harian {topik}: ✔ 15 menit teori • ✔ 30 menit praktek • ✔ 5 menit review.',
        subtext: 'Simpan pola sederhana ini dan terapkan mulai besok pagi!',
        emoji: '✅',
      },
      {
        text: 'Bukti Nyata: Mereka yang disiplin menerapkan sistem ini di {topik} hemat waktu belajar sampai 60%!',
        subtext: 'Belajar cerdas selalu mengalahkan sekadar belajar keras tanpa arah.',
        emoji: '🔥',
      },
      {
        text: 'Kesimpulan Penting: Kunci utama {topik} bukan seberapa cepat kamu mulai, tapi seberapa konsisten kamu bertahan.',
        subtext: 'Jangan berhenti di minggu pertama saat kurva belajar sedang menanjak.',
        emoji: '⛰️',
      },
      {
        text: 'Tips Bonus: Cari 1 komunitas atau teman diskusi seputar {topik} agar motivasimu terjaga 100%!',
        subtext: 'Lingkungan yang suportif mempercepat pertukaran insight berharga.',
        emoji: '🤝',
      },
      {
        text: 'Hindari multitasking saat mendalami {topik}! Fokus satu sub-materi sampai tuntas baru pindah ke tahap berikutnya.',
        subtext: 'Kejelasan fokus adalah bahan bakar utama penguasaan skill.',
        emoji: '🔍',
      },
      {
        text: 'Uji Pemahamanmu: Kalau kamu sudah bisa menyelesaikan 1 proyek kecil di {topik}, artinya kamu siap naik level!',
        subtext: 'Portofolio nyata berbicara jauh lebih keras daripada sekadar sertifikat.',
        emoji: '🎖️',
      },
      {
        text: 'Ingat Aturan 2 Menit: Jika latihan {topik} terasa berat, mulailah hanya selama 2 menit pertama!',
        subtext: 'Begitu momentum terbentuk, otakmu akan otomatis lanjut menyelesaikan sisanya.',
        emoji: '⚙️',
      },
      {
        text: 'Rangkuman Cepat {topik}: Fokus pada fundamental, bangun rutinitas harian, dan ukur progres tiap pekan.',
        subtext: 'Tiga pilar ini adalah fondasi kesuksesan jangka panjang.',
        emoji: '🏛️',
      },
      {
        text: 'Sekarang giliranmu! Pilih 1 poin tentang {topik} dari video ini dan langsung praktekkan hari ini juga.',
        subtext: 'Ilmu tanpa amal bagaikan pohon rindang tanpa buah.',
        emoji: '🌟',
      },
    ],
  },
};

// ============================================================================
// 6. BANK CTA (35+ TEMPLATE CALL-TO-ACTION)
// ============================================================================
export const BANK_CTA: string[] = [
  'Follow akun ini buat dapet update Part 2 besok!',
  'Save video ini sekarang biar gak ilang pas lu butuh!',
  'Tag temen dekat lu yang wajib banget nonton video ini!',
  'Komen "MAU" di bawah biar gue spill info lengkapnya!',
  'Klik link di bio sekarang sebelum kuota promonya habis!',
  'Share ke WhatsApp Story lu kalau konten ini bermanfaat!',
  'Jangan lupa tap love ❤️ dan simpan buat pengingat diri sendiri.',
  'Komen pendapat lu di bawah, tim setuju atau nggak nih?',
  'Langsung DM atau klik keranjang/link bio buat amankan pesananmu!',
  'Follow sekarang biar algoritma TikTok lu makin positif setiap hari!',
  'Screenshot layar ini sekarang buat ditunjukin ke kasir kami!',
  'Bagikan ke grup tongkrongan lu biar bisa patungan bareng!',
  'Ketik "HADIR" di kolom komentar kalau lu relate banget sama ini!',
  'Buruan checkout hari ini, besok harga kembali normal!',
  'Simpan ke koleksi Favorit dan tonton ulang saat lu butuh semangat!',
  'Tulis pertanyaan lu di komentar, nanti gue bahas di video berikutnya!',
  'Ajak pasangan atau sahabat lu mampir ke sini akhir pekan ini!',
  'Follow untuk tips harian gratis yang langsung bisa dipraktekkan!',
  'Komen angka favoritmu dan lihat siapa yang punya pemikiran sama!',
  'Jangan cuma ditonton, langsung praktekkan langkah pertamanya hari ini!',
  'Kunjungi profil kami untuk melihat katalog lengkap dan testimoni asli!',
  'Tag 1 orang spesial yang pengen lu ajak cobain ini bareng!',
  'Aktifkan lonceng notifikasi biar gak ketinggalan flash sale berikutnya!',
  'Komen "LANJUT" kalau lu mau bedah tuntas topik ini lebih dalam!',
  'Repost video ini kalau kalimat tadi mewakili perasaan lu malam ini.',
  'Hubungi admin via link bio untuk klaim voucher diskon tambahan!',
  'Beri nilai 1 sampai 10 di kolom komentar buat bahasan kali ini!',
  'Save dulu, praktek kemudian! Dijamin kepake banget.',
  'Cek pin komentar paling atas untuk detail lokasi dan jam buka!',
  'Follow akun ini biar lu gak ketinggalan trik rahasia lainnya!',
  'Tunjukkan video ini saat order dan dapatkan bonus spesial hari ini!',
  'Komen dari kota mana aja nih yang nonton video ini sampai habis?',
  'Bagikan ke teman kerjamu yang sering ngalamin masalah serupa!',
  'Klik tombol Follow sekarang, gratis tapi ilmunya daging semua!',
  'Ambil promonya sekarang juga sebelum stok hari ini ludes terjual!',
];

// ============================================================================
// 7. FUNGSI ADMIN TRAINING (UNTUK kakangkasyaf@gmail.com)
// Menambahkan Hook, Scene, CTA, dan Gambar Asset baru secara live ke Smart Engine
// ============================================================================
export function addCustomHookToEngine(category: CategoryType, hookText: string) {
  if (!hookText.trim()) return;
  BANK_HOOK[category].unshift(hookText.trim());
}

export function addCustomSceneToEngine(
  category: CategoryType,
  slot: 'scene2' | 'scene3',
  entry: SceneTemplateEntry
) {
  if (!entry.text.trim()) return;
  BANK_SCENES[category][slot].unshift(entry);
}

export function addCustomCtaToEngine(ctaText: string) {
  if (!ctaText.trim()) return;
  BANK_CTA.unshift(ctaText.trim());
}

export function addCustomImageAssetToEngine(asset: CustomImageAsset) {
  if (!asset.url.trim()) return;
  CUSTOM_IMAGE_ASSETS.unshift(asset);
}

// ============================================================================
// 8. BANK HASHTAG PER KATEGORI & TOPIK POPULER
// ============================================================================
export const BANK_HASHTAGS: Record<CategoryType, string[]> = {
  promo: ['#promotiktok', '#diskonviral', '#umkmindonesia', '#jajananviral', '#racuntiktok', '#fypindonesia'],
  quote: ['#katakatabijak', '#quotesindonesia', '#relatable', '#suarahati', '#motivasi', '#fypmalam'],
  edukasi: ['#samasamabelajar', '#tipsandtricks', '#edukasitiktok', '#tahukahkamu', '#produktif', '#fypedukasi'],
};

export const TOPIC_HASHTAG_MAP: Record<string, string[]> = {
  kopi: ['#kopi', '#kopisusu', '#eskopisusu', '#kulinerbandung', '#pecintakopi', '#coffeeshop'],
  makan: ['#kulinertiktok', '#makananenak', '#kulinerviral', '#foodieindonesia'],
  pedas: ['#kulinerpedas', '#seblakviral', '#pecintapedas', '#jajananpedas'],
  baju: ['#ootdindonesia', '#fashionlokal', '#thrifting', '#racunshopee'],
  skincare: ['#skincareviral', '#tipsskincare', '#glowup', '#pejuangjerawat'],
  galau: ['#galau', '#patahhati', '#sadboy', '#sadgirl', '#overthinking'],
  capek: ['#lelah', '#pejuangrupiah', '#mentalhealth', '#burnout', '#semangat'],
  cinta: ['#bucintiktok', '#pasangan', '#hubungan', '#ceritacinta'],
  uang: ['#keuangan', '#belajarinvestasi', '#mengaturuang', '#cuan', '#finansial'],
  bisnis: ['#bisnisonline', '#ideusaha', '#belajarbisnis', '#wirausaha'],
  coding: ['#belajarngoding', '#programmerindonesia', '#anakit', '#webdeveloper'],
  ngoding: ['#belajarngoding', '#programmerindonesia', '#anakit', '#codinglife'],
  desain: ['#desainer', '#tipskonten', '#kreatorpemula', '#capcutindonesia'],
};

// ============================================================================
// 9. FUNGSI parseTopic(topik, options?)
// ============================================================================
export function parseTopic(
  rawTopic: string,
  options?: GenerateOptions
): ParsedTopicMeta {
  const cleanTopic = (rawTopic || 'Promo Kopi Susu 18rb').trim();

  const priceRegex = /(\d+[.,]?\d*)\s*(rb|ribu|k|jt)/i;
  const priceMatch = cleanTopic.match(priceRegex);

  let detectedPrice = 'Rp 18rb';
  let numericAmount = 18;
  let unitText = 'rb';

  if (priceMatch) {
    const rawNum = priceMatch[1].replace(',', '.');
    numericAmount = parseFloat(rawNum) || 18;
    unitText = priceMatch[2].toLowerCase();
    detectedPrice = `Rp ${priceMatch[1]}${unitText}`;
  }

  const priceText =
    options?.customPrice && options.customPrice.trim().length > 0
      ? options.customPrice.trim()
      : detectedPrice;

  const customNumMatch = priceText.match(/(\d+[.,]?\d*)/);
  const baseNumber = customNumMatch
    ? parseFloat(customNumMatch[1].replace(',', '.')) || numericAmount
    : numericAmount;
  const higherVal = Math.max(baseNumber + 5, Math.round(baseNumber * 1.5));
  const originalPriceText = `Rp ${higherVal}${unitText.toUpperCase()}`;

  const emotionRegex =
    /\b(galau|sedih|capek|lelah|kecewa|patah hati|rindu|promo|diskon|murah|hemat|belajar|tips|cara|fakta|rahasia)\b/i;
  const emotionMatch = cleanTopic.match(emotionRegex);
  const emotionKeyword = emotionMatch ? emotionMatch[1].toLowerCase() : 'spesial';

  let detectedMood: ParsedTopicMeta['detectedMood'] = 'netral';
  if (/(galau|sedih|capek|lelah|kecewa|patah hati|rindu)/i.test(cleanTopic)) {
    detectedMood = 'galau';
  } else if (
    /(promo|diskon|murah|hemat|sale|beli|paket|\d+\s*(?:rb|ribu|k|jt))/i.test(cleanTopic)
  ) {
    detectedMood = 'promo';
  } else if (/(belajar|tips|cara|fakta|rahasia|edukasi|trik|rumus)/i.test(cleanTopic)) {
    detectedMood = 'edukasi';
  }

  const strippedProduct = cleanTopic
    .replace(/(?:rp\.?\s*)?(\d+[.,]?\d*)\s*(rb|ribu|k|jt)\b/gi, '')
    .replace(/\b(promo|diskon|murah|spesial|paket|jual|beli|cuma|hanya|di|untuk|buat)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const productName =
    options?.customProductName && options.customProductName.trim().length > 0
      ? options.customProductName.trim()
      : strippedProduct.length >= 2
      ? capitalizeWords(strippedProduct)
      : capitalizeWords(cleanTopic);

  const storeName =
    options?.customStoreName && options.customStoreName.trim().length > 0
      ? options.customStoreName.trim()
      : 'Toko Favoritmu';

  return {
    cleanTopic,
    productName,
    priceText,
    originalPriceText,
    storeName,
    emotionKeyword,
    detectedMood,
  };
}

export const extractTopicMetadata = parseTopic;

function capitalizeWords(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function interpolateTemplate(
  template: string,
  meta: ParsedTopicMeta
): string {
  const safeProduct = meta.productName || meta.cleanTopic || 'Produk Pilihan';
  const safePrice = meta.priceText || 'Rp 18rb';
  const safeOrigPrice = meta.originalPriceText || 'Rp 27RB';
  const safeStore = meta.storeName || 'Toko Kami';
  const safeTopic = meta.cleanTopic || safeProduct;

  return template
    .replace(/\{produk\}/gi, safeProduct)
    .replace(/\{harga\}/gi, safePrice)
    .replace(/\{harga_coret\}/gi, safeOrigPrice)
    .replace(/\{toko\}/gi, safeStore)
    .replace(/\{topik\}/gi, safeTopic)
    .replace(/\{emosi\}/gi, meta.emotionKeyword || safeTopic)
    .replace(/\{angka\}/gi, '3')
    .replace(/\{[^}]+\}/g, safeTopic);
}

// ============================================================================
// 10. RANDOMIZER ANTI-BERULANG (MURNI Math.random())
// ============================================================================
const lastPickedByKey: Record<string, string[]> = {};

function pickRandomNonRepeating<T>(
  pool: T[],
  memoryKey: string,
  getId: (item: T) => string,
  maxMemory = 6
): T {
  if (pool.length === 0) {
    throw new Error(`Pool kosong untuk key: ${memoryKey}`);
  }
  if (pool.length === 1) {
    return pool[0];
  }

  const history = lastPickedByKey[memoryKey] || [];
  const candidates = pool.filter((item) => !history.includes(getId(item)));
  const activePool =
    candidates.length > 0
      ? candidates
      : pool.filter((item) => getId(item) !== history[history.length - 1]);
  const finalPool = activePool.length > 0 ? activePool : pool;

  const randomIndex = Math.floor(Math.random() * finalPool.length);
  const chosen = finalPool[randomIndex];

  const updatedHistory = [...history, getId(chosen)];
  if (updatedHistory.length > maxMemory) {
    updatedHistory.shift();
  }
  lastPickedByKey[memoryKey] = updatedHistory;

  return chosen;
}

export function suggestStyle(
  rawTopic: string,
  category?: CategoryType,
  forceRandom = false
): StyleSuggestion {
  const parsed = parseTopic(rawTopic);
  const lower = (rawTopic || '').toLowerCase();

  const allAnimationsGradient = [
    'aurora-night',
    'fire-sale',
    'ocean-tech',
    'deep-violet',
    'crimson-amber',
    'indigo-sky',
  ];
  const randomGradient = pickRandomNonRepeating(allAnimationsGradient, 'gradient', (g) => g, 3);

  if (forceRandom) {
    const randomPalette = pickRandomNonRepeating(COLOR_PALETTES, 'palette', (p) => p.id, 4);
    const randomMusic = pickRandomNonRepeating(MUSIC_TRACKS, 'music', (m) => m.id, 3);
    const fonts: StyleSuggestion['font'][] = [
      'Poppins',
      'Montserrat',
      'Bebas Neue',
      'Playfair Display',
      'Space Grotesk',
      'Anton',
    ];
    const randomFont = pickRandomNonRepeating(fonts, 'font', (f) => f, 3);
    return {
      paletteId: randomPalette.id,
      colors: randomPalette,
      font: randomFont,
      musicId: randomMusic.id,
      music: randomMusic,
      backgroundType: 'gradient',
      gradientPreset: randomGradient,
      moodLabel: `Random Style (${randomPalette.name})`,
    };
  }

  if (
    parsed.detectedMood === 'galau' ||
    /(galau|sedih|capek|lelah|patah hati|kecewa|malam|hujan|rindu)/.test(lower)
  ) {
    const darkPalettes = COLOR_PALETTES.filter((p) =>
      ['midnight-galau', 'neon-cyber', 'warm-sepia'].includes(p.id)
    );
    const chosenPalette = pickRandomNonRepeating(darkPalettes, 'palette', (p) => p.id, 2);
    const music = MUSIC_TRACKS.find((m) => m.id === 'slow-galau') || MUSIC_TRACKS[1];
    return {
      paletteId: chosenPalette.id,
      colors: chosenPalette,
      font: 'Playfair Display',
      musicId: music.id,
      music,
      backgroundType: 'gradient',
      gradientPreset: 'aurora-night',
      moodLabel: 'Dark & Melancholic (Slow Music)',
    };
  }

  if (
    parsed.detectedMood === 'promo' ||
    /(promo|diskon|murah|hemat|sale|kuliner|kopi)/.test(lower) ||
    category === 'promo'
  ) {
    const promoPalettes = COLOR_PALETTES.filter((p) =>
      ['promo-merah-kuning', 'sunset-orange', 'fresh-emerald', 'warm-sepia'].includes(p.id)
    );
    const chosenPalette = pickRandomNonRepeating(promoPalettes, 'palette', (p) => p.id, 2);
    const promoMusics = MUSIC_TRACKS.filter((m) =>
      ['energetic-promo', 'upbeat-kuliner'].includes(m.id)
    );
    const music = pickRandomNonRepeating(promoMusics, 'music', (m) => m.id, 1);
    return {
      paletteId: chosenPalette.id,
      colors: chosenPalette,
      font: 'Bebas Neue',
      musicId: music.id,
      music,
      backgroundType: 'gradient',
      gradientPreset: 'fire-sale',
      moodLabel: 'Bright Promo (Energetic Music)',
    };
  }

  const eduPalettes = COLOR_PALETTES.filter((p) =>
    ['tech-blue', 'cyber-lime', 'neon-cyber', 'fresh-emerald'].includes(p.id)
  );
  const chosenPalette = pickRandomNonRepeating(eduPalettes, 'palette', (p) => p.id, 2);
  const eduMusics = MUSIC_TRACKS.filter((m) => ['chill-edukasi', 'dramatic-hook'].includes(m.id));
  const music = pickRandomNonRepeating(eduMusics, 'music', (m) => m.id, 1);
  return {
    paletteId: chosenPalette.id,
    colors: chosenPalette,
    font: 'Space Grotesk',
    musicId: music.id,
    music,
    backgroundType: 'gradient',
    gradientPreset: 'ocean-tech',
    moodLabel: 'Clean Edu (Biru/Putih + Chill Music)',
  };
}

export function generateCaptionAndHashtags(
  topic: string,
  category: CategoryType,
  meta: ParsedTopicMeta,
  ctaText: string
): { caption: string; hashtags: string[] } {
  const lower = topic.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s]/gi, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !['dan', 'yang', 'ini', 'itu', 'buat', 'dari', 'untuk', 'cuma', 'harga'].includes(w)
    );

  const tagSet = new Set<string>();

  Object.entries(TOPIC_HASHTAG_MAP).forEach(([key, tags]) => {
    if (lower.includes(key)) {
      tags.forEach((t) => tagSet.add(t));
    }
  });

  words.slice(0, 3).forEach((w) => tagSet.add(`#${w}`));
  if (words.length >= 2) {
    tagSet.add(`#${words[0]}${words[1]}`);
  }

  BANK_HASHTAGS[category].forEach((t) => tagSet.add(t));
  tagSet.add('#fyp');
  tagSet.add('#tiktokindonesia');

  const hashtags = Array.from(tagSet).slice(0, 8);

  const captionTemplates: Record<CategoryType, string[]> = {
    promo: [
      `🔥 ${meta.productName} spesial di ${meta.storeName} cuma ${meta.priceText} (Harga normal ${meta.originalPriceText})! ${ctaText}`,
      `⚡ Warga TikTok wajib cobain ${meta.productName} dari ${meta.storeName}! Lagi promo gila cuma ${meta.priceText}. ${ctaText}`,
      `💸 Jajan hemat kualitas juara: ${meta.productName} di ${meta.storeName} sekarang cuma ${meta.priceText}! ${ctaText}`,
    ],
    quote: [
      `✨ Pengingat kecil tentang "${meta.cleanTopic}" buat kamu yang lewat di FYP malam ini. ${ctaText}`,
      `🌙 Untuk hati yang sedang berjuang melewati ${meta.cleanTopic}, pelan-pelan ya. ${ctaText}`,
      `🤍 Baca ini kalau hari ini kamu merasa lelah karena ${meta.cleanTopic}. Kamu gak sendirian. ${ctaText}`,
    ],
    edukasi: [
      `💡 Bahas tuntas soal ${meta.cleanTopic} dalam 15 detik! Jangan lupa dipraktekkan. ${ctaText}`,
      `🚀 Banyak yang masih keliru soal ${meta.cleanTopic}, simak rangkuman praktisnya di video ini! ${ctaText}`,
      `📌 Simpan panduan singkat ${meta.cleanTopic} ini biar gak bingung lagi pas praktek! ${ctaText}`,
    ],
  };

  const captionPool = captionTemplates[category] || captionTemplates.promo;
  const caption = pickRandomNonRepeating(captionPool, `caption-${category}`, (c) => c, 2);

  return { caption, hashtags };
}

const ALL_ANIMATIONS: AnimationType[] = ['pop', 'slide-up', 'typewriter', 'bounce', 'fade', 'zoom'];

export function generateScript(
  rawTopic: string,
  category: CategoryType,
  options?: GenerateOptions
): GeneratedScriptResult {
  const meta = parseTopic(rawTopic, options);

  const hookPool = BANK_HOOK[category] || BANK_HOOK.promo;
  const chosenHookTemplate = pickRandomNonRepeating(hookPool, `hook-${category}`, (h) => h, 8);
  const hook = interpolateTemplate(chosenHookTemplate, meta);

  const scene2Pool = BANK_SCENES[category]?.scene2 || BANK_SCENES.promo.scene2;
  const chosenScene2Template = pickRandomNonRepeating(
    scene2Pool,
    `scene2-${category}`,
    (s) => s.text,
    6
  );

  const scene3Pool = BANK_SCENES[category]?.scene3 || BANK_SCENES.promo.scene3;
  const chosenScene3Template = pickRandomNonRepeating(
    scene3Pool,
    `scene3-${category}`,
    (s) => s.text,
    6
  );

  const chosenCtaTemplate = pickRandomNonRepeating(BANK_CTA, 'cta-global', (c) => c, 10);
  const chosenCta = interpolateTemplate(chosenCtaTemplate, meta);

  const anim1 = pickRandomNonRepeating(ALL_ANIMATIONS, 'anim-s1', (a) => a, 3);
  const anim2 = pickRandomNonRepeating(ALL_ANIMATIONS, 'anim-s2', (a) => a, 3);
  const anim3 = pickRandomNonRepeating(ALL_ANIMATIONS, 'anim-s3', (a) => a, 3);
  const anim4 = pickRandomNonRepeating(ALL_ANIMATIONS, 'anim-s4', (a) => a, 3);

  const userImgs = options?.userImages || [];

  const scenes: SceneItem[] = [
    {
      id: 's1',
      sceneNumber: 1,
      role: 'Hook / Masalah',
      text: hook,
      subtext: interpolateTemplate(
        category === 'promo'
          ? 'Spesial di {toko} • Kuota Promo Terbatas!'
          : category === 'quote'
          ? 'Dengarkan pesan ini sejenak malam ini...'
          : 'Simak sampai habis biar gak salah langkah soal {topik}!',
        meta
      ),
      emoji: category === 'promo' ? '🔥' : category === 'quote' ? '🌙' : '💡',
      duration: 3,
      animation: anim1,
      imageUrl: userImgs[0] || undefined,
    },
    {
      id: 's2',
      sceneNumber: 2,
      role: 'Isi / Solusi',
      text: interpolateTemplate(chosenScene2Template.text, meta),
      subtext: interpolateTemplate(chosenScene2Template.subtext, meta),
      emoji: chosenScene2Template.emoji,
      duration: category === 'promo' ? 3 : 4,
      animation: anim2,
      imageUrl: userImgs[1] || userImgs[0] || undefined,
    },
    {
      id: 's3',
      sceneNumber: 3,
      role: 'Bukti / Harga',
      text: interpolateTemplate(chosenScene3Template.text, meta),
      subtext: interpolateTemplate(chosenScene3Template.subtext, meta),
      emoji: chosenScene3Template.emoji,
      duration: category === 'promo' ? 3 : 4,
      animation: anim3,
      imageUrl: userImgs[2] || userImgs[0] || undefined,
    },
    {
      id: 's4',
      sceneNumber: 4,
      role: 'CTA Akhir',
      text: chosenCta,
      subtext: interpolateTemplate(
        category === 'promo'
          ? 'Order {produk} sekarang di {toko} sebelum kehabisan!'
          : category === 'quote'
          ? 'Semoga esok pagi hatimu kembali hangat ✨'
          : 'Bagikan ilmu {topik} ini ke teman belajarmu sekarang!',
        meta
      ),
      emoji: category === 'promo' ? '🛒' : category === 'quote' ? '🔖' : '📌',
      duration: 3,
      animation: anim4,
      imageUrl: userImgs[3] || userImgs[0] || undefined,
    },
  ];

  const suggestedStyle = suggestStyle(rawTopic, category, Boolean(options?.forceRandomPalette));
  const { caption, hashtags } = generateCaptionAndHashtags(rawTopic, category, meta, chosenCta);

  const result: GeneratedScriptResult = {
    hook,
    scenes,
    caption,
    hashtags,
    suggestedMusic: suggestedStyle.music,
    suggestedColor: suggestedStyle.colors,
    suggestedStyle,
    extractedMeta: meta,
  };

  console.log('[MotionKu SmartEngine] generateScript JSON:', JSON.stringify(result, null, 2));

  return result;
}

export function randomizeHookAndStyle(
  currentTopic: string,
  category: CategoryType,
  currentPaletteId: string,
  options?: GenerateOptions
): {
  newScript: GeneratedScriptResult;
  randomPalette: ColorPalette;
  randomMusic: MusicTrack;
} {
  const newScript = generateScript(currentTopic, category, {
    ...options,
    forceRandomPalette: true,
  });

  const otherPalettes = COLOR_PALETTES.filter((p) => p.id !== currentPaletteId);
  const randomPalette =
    otherPalettes[Math.floor(Math.random() * otherPalettes.length)] ||
    newScript.suggestedColor;

  const randomMusic =
    MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)] ||
    newScript.suggestedMusic;

  newScript.suggestedColor = randomPalette;
  newScript.suggestedMusic = randomMusic;
  newScript.suggestedStyle.colors = randomPalette;
  newScript.suggestedStyle.paletteId = randomPalette.id;
  newScript.suggestedStyle.music = randomMusic;
  newScript.suggestedStyle.musicId = randomMusic.id;

  return {
    newScript,
    randomPalette,
    randomMusic,
  };
}
