/**
 * Motion Lab — bank riset gerak untuk admin.
 *
 * Isi file ini murni data + fungsi murni (tanpa DOM / Supabase) supaya bisa dipakai
 * dari halaman admin, server MCP, maupun skrip. Semua "resep" di bawah adalah
 * rangkuman alur kerja umum dari aplikasi referensi (CapCut, Illustrator, Figma,
 * Alight Motion, Premiere, After Effects). Tidak ada afiliasi dengan aplikasi
 * tersebut — istilahnya dipakai sebagai bahasa bersama untuk menjelaskan gerak.
 *
 * Setiap resep punya dua bentuk:
 *   1. `code` — JSON deklaratif yang lolos parser pack studio (animasi/transisi).
 *   2. `preview` — pose awal untuk animasi kartu di halaman admin.
 */

export type MotionSourceId = 'capcut' | 'illustrator' | 'figma' | 'alight' | 'premiere' | 'aftereffects';

export type MotionCategory = '2d' | '3d' | 'kinetic' | 'mg' | 'ui' | 'transition';

export type MotionLevel = 'pemula' | 'menengah' | 'lanjut';

export interface MotionSource {
  id: MotionSourceId;
  name: string;
  short: string;
  accent: string;
  tagline: string;
  focus: string;
  strengths: string[];
  workflow: string[];
  signature: string[];
}

export const MOTION_SOURCES: MotionSource[] = [
  {
    id: 'capcut',
    name: 'CapCut',
    short: 'CapCut',
    accent: '#0f0f0f',
    tagline: 'Edit cepat, ritme beat, template siap pakai',
    focus: 'Short-form vertikal',
    strengths: ['Sinkron beat', 'Velocity & speed ramp', 'Auto caption', 'Transisi cepat'],
    workflow: [
      'Potong kasar mengikuti beat (cut di setiap 1–2 ketukan).',
      'Tandai titik beat lalu tempel transisi hanya di 2–3 titik terkuat.',
      'Tambahkan speed ramp 0,35× → 1,8× pada gerakan kamera.',
      'Kunci teks dengan kata kunci per 2–3 kata agar mata sempat membaca.',
    ],
    signature: ['beat pop', 'velocity edit', 'whip pan', 'caption karaoke'],
  },
  {
    id: 'illustrator',
    name: 'Adobe Illustrator',
    short: 'Illustrator',
    accent: '#ff9a00',
    tagline: 'Vektor bersih, garis tegas, bentuk geometris',
    focus: 'Aset & identitas visual',
    strengths: ['Path presisi', 'Garis stroke', 'Palet solid', 'Grid & bentuk'],
    workflow: [
      'Bangun bentuk di grid 8 px supaya gerak terasa rapi saat diskalakan.',
      'Pisahkan fill dan stroke ke layer berbeda untuk reveal bertahap.',
      'Gunakan bentuk dasar (lingkaran, kotak, bintang) sebagai mask reveal.',
      'Ekspor SVG lalu tempel ke tab Ikon admin agar bisa dipakai ulang.',
    ],
    signature: ['stroke draw', 'mask bentuk', 'bauhaus grid', 'poster stack'],
  },
  {
    id: 'figma',
    name: 'Figma',
    short: 'Figma',
    accent: '#a259ff',
    tagline: 'Smart animate, spring, motion untuk UI',
    focus: 'UI & produk digital',
    strengths: ['Smart animate', 'Spring & easing', 'Stagger', 'Komponen konsisten'],
    workflow: [
      'Tentukan dua state (awal & akhir) lalu biarkan properti yang sama beranimasi.',
      'Pakai spring ringan untuk elemen yang bisa disentuh; hindari overshoot di teks kecil.',
      'Beri jeda 40–80 ms antar item pada daftar agar terbaca sebagai satu gelombang.',
      'Jaga durasi 180–320 ms untuk mikro-interaksi, 400–700 ms untuk panel.',
    ],
    signature: ['smart animate', 'spring modal', 'stagger list', 'glass lift'],
  },
  {
    id: 'alight',
    name: 'Alight Motion',
    short: 'Alight Motion',
    accent: '#ff3d71',
    tagline: 'Compositing di HP, keyframe manual, 3D flip',
    focus: 'Mobile motion graphics',
    strengths: ['Keyframe manual', '3D flip', 'Blend & glow', 'Preset komunitas'],
    workflow: [
      'Siapkan layer terpisah untuk objek, bayangan, dan efek agar mudah di-keyframe.',
      'Tulis keyframe di 0%, 60%, 100% — bukan di setiap frame — lalu haluskan.',
      'Pakai flip sumbu X/Y dengan scale 1,05 untuk ilusi kartu 3D.',
      'Tambahkan motion blur tipis saat kecepatan puncak, bukan sepanjang animasi.',
    ],
    signature: ['3D card flip', 'orbit entry', 'liquid warp', 'glitch cut'],
  },
  {
    id: 'premiere',
    name: 'Adobe Premiere Pro',
    short: 'Premiere',
    accent: '#9999ff',
    tagline: 'Cut presisi, luma, lower third, broadcast',
    focus: 'Editing naratif',
    strengths: ['Trim presisi', 'Luma wipe', 'Lower third', 'Color match'],
    workflow: [
      'Kunci cut pada titik napas narasi, bukan hanya pada beat musik.',
      'Pakai luma wipe untuk transisi yang mengikuti arah cahaya di footage.',
      'Letakkan lower third 80 px dari tepi aman, tampil 3–4 detik.',
      'Samakan warna antar shot sebelum menambahkan gerak — gerak tidak menutupi warna yang beda.',
    ],
    signature: ['luma wipe', 'zoom punch', 'film roll', 'lower third'],
  },
  {
    id: 'aftereffects',
    name: 'After Effects',
    short: 'After Effects',
    accent: '#9999ff',
    tagline: 'Kinetic type, parallax, ekspresi & komposisi',
    focus: 'Motion graphics lanjutan',
    strengths: ['Kinetic typography', 'Parallax 3D', 'Shape burst', 'Expression'],
    workflow: [
      'Susun teks per kata, beri offset 1–2 frame untuk cascade yang enak dilihat.',
      'Pisahkan foreground, midground, background lalu geser dengan kecepatan berbeda.',
      'Gunakan ease-out panjang di akhir gerak agar objek terasa punya massa.',
      'Batasi 1 ide gerak per scene; gerak kedua dipakai untuk menegaskan, bukan mengulang.',
    ],
    signature: ['kinetic cascade', 'parallax push', 'neon pop', 'shape burst'],
  },
];

export const MOTION_CATEGORIES: Array<{ id: MotionCategory; label: string; hint: string }> = [
  { id: '2d', label: '2D', hint: 'Geser, skala, mask, shape' },
  { id: '3d', label: '3D', hint: 'Flip, kedalaman, parallax' },
  { id: 'kinetic', label: 'Kinetic Type', hint: 'Teks bergerak per kata/huruf' },
  { id: 'mg', label: 'Motion Graphics', hint: 'Bentuk, garis, elemen grafis' },
  { id: 'ui', label: 'UI Motion', hint: 'Mikro-interaksi & panel' },
  { id: 'transition', label: 'Transisi', hint: 'Pindah scene' },
];

export interface MotionPreview {
  fromX?: number;
  fromY?: number;
  fromScale?: number;
  fromRot?: number;
  fromOpacity?: number;
  fromBlur?: number;
  fromSkew?: number;
  duration: number;
  easing: 'halus' | 'tegas' | 'membal' | 'kenyal';
}

export interface MotionRecipe {
  id: string;
  name: string;
  source: MotionSourceId;
  category: MotionCategory;
  level: MotionLevel;
  summary: string;
  why: string;
  principles: string[];
  steps: string[];
  tags: string[];
  trainingType: 'animation_pack' | 'transition_pack';
  /** JSON siap tempel ke tab admin / MCP training_add */
  code: Record<string, unknown>;
  preview: MotionPreview;
}

const A = (
  id: string,
  name: string,
  source: MotionSourceId,
  category: MotionCategory,
  level: MotionLevel,
  summary: string,
  why: string,
  principles: string[],
  steps: string[],
  tags: string[],
  animation: Record<string, unknown>,
  preview: MotionPreview
): MotionRecipe => ({
  id,
  name,
  source,
  category,
  level,
  summary,
  why,
  principles,
  steps,
  tags,
  trainingType: 'animation_pack',
  code: { name, tags, ...animation },
  preview,
});

const T = (
  id: string,
  name: string,
  source: MotionSourceId,
  category: MotionCategory,
  level: MotionLevel,
  summary: string,
  why: string,
  principles: string[],
  steps: string[],
  tags: string[],
  transition: Record<string, unknown>,
  preview: MotionPreview
): MotionRecipe => ({
  id,
  name,
  source,
  category,
  level,
  summary,
  why,
  principles,
  steps,
  tags,
  trainingType: 'transition_pack',
  code: { name, tags, ...transition },
  preview,
});

/** 30 resep inti yang sudah tervalidasi bentuknya oleh parser pack studio. */
export const MOTION_RECIPES: MotionRecipe[] = [
  // ---------------------------------------------------------------- CapCut
  A(
    'capcut-beat-pop',
    'Beat Pop Sinkron',
    'capcut',
    'mg',
    'pemula',
    'Elemen membesar 8% lalu kembali tepat di ketukan musik.',
    'Memberi aksen pada kata kunci tanpa menggeser posisi baca.',
    ['Ketukan = puncak gerak', 'Amplitudo kecil 6–10%', 'Kembali sebelum ketukan berikutnya'],
    ['Tandai ketukan musik.', 'Letakkan elemen di posisi akhir.', 'Buat 3 keyframe: 0 (kecil), 0,35 (puncak), 1 (normal).', 'Ulangi hanya pada 2–3 kata terkuat.'],
    ['beat', 'pop', 'capcut', 'short-form'],
    {
      kind: 'in',
      duration: 0.42,
      easing: 'outBack',
      keyframes: [
        { t: 0, scale: 0.86, alpha: 0 },
        { t: 0.4, scale: 1.08, alpha: 1, easing: 'outBack' },
        { t: 1, scale: 1, alpha: 1, easing: 'outCubic' },
      ],
    },
    { fromScale: 0.86, fromOpacity: 0, duration: 0.42, easing: 'membal' }
  ),
  A(
    'capcut-velocity-snap',
    'Velocity Edit Snap',
    'capcut',
    '2d',
    'menengah',
    'Zoom cepat dengan blur sesaat seperti speed ramp 0,35× ke 1,8×.',
    'Membuat potongan terasa bertenaga tanpa perlu footage tambahan.',
    ['Blur hanya di puncak', 'Total < 400 ms', 'Arah zoom konsisten'],
    ['Potong di awal gerakan.', 'Tambahkan zoom 1,35× + blur 18 pada 45% durasi.', 'Turunkan kembali ke 1× dengan ease-out.', 'Batasi dua kali per 10 detik.'],
    ['velocity', 'zoom', 'blur', 'capcut'],
    {
      kind: 'in',
      duration: 0.34,
      easing: 'outExpo',
      keyframes: [
        { t: 0, scale: 0.92, blur: 14, alpha: 0 },
        { t: 0.45, scale: 1.35, blur: 18, alpha: 1, easing: 'outExpo' },
        { t: 1, scale: 1, blur: 0, easing: 'outCubic' },
      ],
    },
    { fromScale: 0.92, fromBlur: 14, fromOpacity: 0, duration: 0.34, easing: 'tegas' }
  ),
  A(
    'capcut-karaoke-bounce',
    'Karaoke Bounce',
    'capcut',
    'kinetic',
    'pemula',
    'Teks muncul kata per kata dengan lompatan kecil mengikuti caption.',
    'Membuat caption tetap terbaca sambil menjaga energi vertikal.',
    ['Satu kata = satu unit', 'Offset 40–70 ms', 'Gerak naik, bukan samping'],
    ['Pecah kalimat menjadi 2–4 kata.', 'Atur mode per kata (word).', 'Beri jarak antar kata 50 ms.', 'Highlight kata aktif saat beat kuat.'],
    ['caption', 'karaoke', 'teks', 'capcut'],
    {
      kind: 'in',
      duration: 0.5,
      easing: 'outBack',
      text: { mode: 'word', from: { y: 34, scale: 0.9, alpha: 0 }, overlap: 0.35, highlight: true },
    },
    { fromY: 34, fromScale: 0.9, fromOpacity: 0, duration: 0.5, easing: 'membal' }
  ),
  T(
    'capcut-whip-blur',
    'Whip Blur Cut',
    'capcut',
    'transition',
    'pemula',
    'Scene terlempar ke samping dengan blur tebal dan kilat putih tipis.',
    'Transisi paling aman untuk memindahkan perhatian antar ide cepat.',
    ['Durasi 0,35–0,5 s', 'Blur mengikuti arah', 'Satu aksen saja'],
    ['Pilih arah sesuai arah gerak objek.', 'Pasang kind whip, intensitas 2.', 'Tambahkan aksen kilat untuk scene energi tinggi.', 'Hindari dua whip berurutan.'],
    ['whip', 'blur', 'transisi', 'capcut'],
    {
      kind: 'whip',
      duration: 0.4,
      easing: 'inOutQuart',
      energy: 3,
      params: { dir: 'left', intensity: 2, fx: 'kilat' },
    },
    { fromX: 420, fromBlur: 16, fromOpacity: 0.4, duration: 0.4, easing: 'tegas' }
  ),
  A(
    'capcut-circle-mask',
    'Mask Lingkaran Reveal',
    'capcut',
    '2d',
    'menengah',
    'Konten terbuka dari lingkaran kecil di tengah, seperti mask reveal.',
    'Cocok untuk menampilkan produk atau wajah sebagai fokus.',
    ['Pusat mask = titik fokus', 'Jangan potong teks penting', 'Durasi 0,5–0,7 s'],
    ['Tempatkan objek di tengah.', 'Pilih clip circle.', 'Mulai dari skala 0,7 lalu naik ke 1.', 'Tambahkan fade 10% agar tepi tidak keras.'],
    ['mask', 'circle', 'reveal', 'capcut'],
    { kind: 'in', duration: 0.6, easing: 'outCubic', clip: 'circle', from: { scale: 0.72, alpha: 0 } },
    { fromScale: 0.72, fromOpacity: 0, duration: 0.6, easing: 'halus' }
  ),

  // ------------------------------------------------------------ Illustrator
  A(
    'ai-stroke-draw',
    'Stroke Draw In',
    'illustrator',
    'mg',
    'pemula',
    'Garis vektor terbuka dari kiri seperti digambar tangan.',
    'Menonjolkan bentuk dan ikon buatan Illustrator dengan bersih.',
    ['Arah reveal mengikuti alur path', 'Tepi tajam', 'Satu warna solid'],
    ['Siapkan ikon SVG bergaris.', 'Pilih clip kiri.', 'Mulai dari alpha 0,15 dengan geser x -24.', 'Selesaikan dalam 0,55 s.'],
    ['svg', 'garis', 'stroke', 'illustrator'],
    { kind: 'in', duration: 0.55, easing: 'outCubic', clip: 'left', from: { x: -24, alpha: 0.15 } },
    { fromX: -24, fromOpacity: 0.15, duration: 0.55, easing: 'halus' }
  ),
  A(
    'ai-vector-morph',
    'Vector Morph Reveal',
    'illustrator',
    '2d',
    'menengah',
    'Bentuk miring terungkap dengan sedikit skew, terasa seperti vektor yang dilipat.',
    'Memberi karakter grafis tanpa animasi berlebihan.',
    ['Skew maksimal 12°', 'Mask diagonal', 'Warna solid'],
    ['Siapkan bentuk dasar.', 'Pakai clip diagonal.', 'Beri skew awal 10° dan alpha 0.', 'Kembalikan skew ke 0 di akhir.'],
    ['vektor', 'skew', 'illustrator', 'grafis'],
    { kind: 'in', duration: 0.62, easing: 'outBack', clip: 'diagonal', from: { skew: 10, x: -18, alpha: 0 } },
    { fromX: -18, fromSkew: 10, fromOpacity: 0, duration: 0.62, easing: 'membal' }
  ),
  A(
    'ai-bauhaus-grid',
    'Bauhaus Grid Pop',
    'illustrator',
    'mg',
    'menengah',
    'Bentuk geometris muncul berurutan dengan rotasi kecil, seperti poster Bauhaus.',
    'Menghidupkan komposisi grid tanpa mengganggu hierarki.',
    ['Grid tetap', 'Rotasi kecil 6–10°', 'Urutan dari kiri atas'],
    ['Susun elemen di grid 8 px.', 'Beri stagger 60 ms.', 'Rotasi awal 8° bergantian arah.', 'Skala akhir tepat 1.'],
    ['grid', 'bauhaus', 'geometri', 'illustrator'],
    {
      kind: 'in',
      duration: 0.58,
      easing: 'outBack',
      keyframes: [
        { t: 0, scale: 0.72, rot: -8, alpha: 0, easing: 'outBack' },
        { t: 0.7, scale: 1.04, rot: 2, alpha: 1 },
        { t: 1, scale: 1, rot: 0 },
      ],
    },
    { fromScale: 0.72, fromRot: -8, fromOpacity: 0, duration: 0.58, easing: 'membal' }
  ),
  T(
    'ai-poster-stack',
    'Poster Stack Slide',
    'illustrator',
    'transition',
    'menengah',
    'Scene baru menumpuk di atas scene lama seperti tumpukan poster.',
    'Menjaga kesan editorial dan rapi untuk brand bergaya cetak.',
    ['Arah konsisten', 'Bayangan tipis', 'Durasi 0,6 s'],
    ['Tentukan arah tumpukan.', 'Pakai kind card.', 'Pertahankan sudut 0° agar terasa cetak.', 'Tambahkan jeda 2 frame di akhir.'],
    ['poster', 'card', 'editorial', 'illustrator'],
    { kind: 'card', duration: 0.62, easing: 'outCubic', energy: 2, params: { dir: 'left' } },
    { fromX: -260, fromScale: 0.96, fromOpacity: 0.6, duration: 0.62, easing: 'halus' }
  ),

  // ------------------------------------------------------------------ Figma
  A(
    'figma-smart-glide',
    'Smart Animate Glide',
    'figma',
    'ui',
    'pemula',
    'Elemen meluncur halus dari posisi lama ke posisi baru dengan pegas ringan.',
    'Gerak UI yang terasa natural dan tidak mengagetkan.',
    ['Durasi 240–320 ms', 'Spring ringan', 'Hindari overshoot besar'],
    ['Catat posisi awal dan akhir.', 'Gunakan ease spring.', 'Jaga opacity 0 → 1 di 40% pertama.', 'Pastikan tidak ada dua elemen bergerak berlawanan.'],
    ['ui', 'smart-animate', 'spring', 'figma'],
    { kind: 'in', duration: 0.3, easing: 'spring', from: { x: 48, y: 12, alpha: 0 } },
    { fromX: 48, fromY: 12, fromOpacity: 0, duration: 0.3, easing: 'kenyal' }
  ),
  A(
    'figma-spring-modal',
    'Spring Modal',
    'figma',
    'ui',
    'pemula',
    'Panel muncul dari 88% dengan overshoot tipis lalu duduk stabil.',
    'Cocok untuk dialog, sheet, dan kartu produk.',
    ['Skala awal 0,88', 'Overshoot 2–4%', 'Durasi ≤ 380 ms'],
    ['Siapkan panel di posisi akhir.', 'Keyframe 0: skala 0,88 & alpha 0.', 'Keyframe 0,65: skala 1,03.', 'Keyframe 1: skala 1.'],
    ['modal', 'sheet', 'spring', 'figma'],
    {
      kind: 'in',
      duration: 0.36,
      easing: 'spring',
      keyframes: [
        { t: 0, scale: 0.88, alpha: 0, easing: 'outCubic' },
        { t: 0.65, scale: 1.03, alpha: 1, easing: 'outBack' },
        { t: 1, scale: 1, alpha: 1 },
      ],
    },
    { fromScale: 0.88, fromOpacity: 0, duration: 0.36, easing: 'kenyal' }
  ),
  A(
    'figma-stagger-list',
    'Stagger List',
    'figma',
    'ui',
    'menengah',
    'Daftar muncul baris demi baris dengan jeda 60 ms.',
    'Membantu mata membaca urutan informasi.',
    ['Jeda 40–80 ms', 'Arah sama', 'Total < 900 ms'],
    ['Siapkan 4–6 baris.', 'Mode per baris (line).', 'Geser y 16 dan fade.', 'Batasi maksimal 6 baris.'],
    ['stagger', 'list', 'ui', 'figma'],
    { kind: 'in', duration: 0.42, easing: 'outCubic', text: { mode: 'line', from: { y: 18, alpha: 0 }, overlap: 0.55 } },
    { fromY: 18, fromOpacity: 0, duration: 0.42, easing: 'halus' }
  ),
  T(
    'figma-prototype-push',
    'Prototype Push',
    'figma',
    'transition',
    'pemula',
    'Layar baru mendorong layar lama ke kiri, seperti navigasi prototipe.',
    'Transisi netral yang menjelaskan perpindahan halaman.',
    ['Arah = hierarki', 'Tidak ada blur', 'Durasi 0,45 s'],
    ['Tentukan arah navigasi.', 'Pakai kind push.', 'Jangan campur dengan zoom.', 'Pertahankan kecepatan konstan.'],
    ['push', 'prototype', 'navigasi', 'figma'],
    { kind: 'push', duration: 0.45, easing: 'inOutCubic', energy: 2, params: { dir: 'left' } },
    { fromX: 300, fromOpacity: 0.5, duration: 0.45, easing: 'halus' }
  ),
  A(
    'figma-glass-lift',
    'Glass Lift',
    'figma',
    'ui',
    'menengah',
    'Kartu kaca terangkat dari bawah sambil kehilangan blur.',
    'Memberi kedalaman pada panel modern tanpa bayangan berat.',
    ['Blur 8–14 px', 'Naik 20–28 px', 'Alpha naik perlahan'],
    ['Siapkan kartu kaca.', 'Mulai y 24, blur 12, alpha 0.', 'Akhiri di posisi akhir tanpa blur.', 'Gunakan ease-out panjang.'],
    ['kaca', 'glass', 'lift', 'figma'],
    { kind: 'in', duration: 0.55, easing: 'outCubic', from: { y: 24, blur: 12, alpha: 0 } },
    { fromY: 24, fromBlur: 12, fromOpacity: 0, duration: 0.55, easing: 'halus' }
  ),

  // ----------------------------------------------------------- Alight Motion
  A(
    'alight-card-flip',
    '3D Card Flip',
    'alight',
    '3d',
    'menengah',
    'Kartu berputar pada sumbu X dengan skala 1,05 untuk ilusi kedalaman.',
    'Efek 3D paling ringan dan paling mudah dibaca di layar vertikal.',
    ['Sumbu X menyempit (sx 0)', 'Skala puncak 1,05', 'Durasi 0,65 s'],
    ['Letakkan kartu di pusat.', 'Keyframe 0: sx 0, skala 1,05, alpha 0.', 'Keyframe 0,55: sx 0, skala 1.', 'Keyframe 1: sx 1, alpha 1.'],
    ['3d', 'flip', 'kartu', 'alight'],
    {
      kind: 'in',
      duration: 0.66,
      easing: 'outCubic',
      keyframes: [
        { t: 0, sx: 0, scale: 1.05, alpha: 0, easing: 'outCubic' },
        { t: 0.55, sx: 0, scale: 1, alpha: 1 },
        { t: 1, sx: 1, alpha: 1, easing: 'outBack' },
      ],
    },
    { fromScale: 1.05, fromOpacity: 0, duration: 0.66, easing: 'membal' }
  ),
  A(
    'alight-orbit-entry',
    'Orbit Entry',
    'alight',
    '3d',
    'lanjut',
    'Objek masuk melengkung dari luar layar sambil berputar 25°.',
    'Memberi kesan kamera mengelilingi objek.',
    ['Lintasan melengkung', 'Rotasi searah', 'Skala 0,8 → 1'],
    ['Tentukan titik masuk dari kanan bawah.', 'Keyframe 0: x 420, y 180, rot 25, skala 0,8.', 'Keyframe 0,7: x -12, y -6, rot -4.', 'Keyframe 1: posisi akhir.'],
    ['orbit', '3d', 'masuk', 'alight'],
    {
      kind: 'in',
      duration: 0.85,
      easing: 'outCubic',
      keyframes: [
        { t: 0, x: 420, y: 180, rot: 25, scale: 0.8, alpha: 0, easing: 'outCubic' },
        { t: 0.7, x: -12, y: -6, rot: -4, scale: 1.02, alpha: 1 },
        { t: 1, x: 0, y: 0, rot: 0, scale: 1 },
      ],
    },
    { fromX: 420, fromY: 180, fromRot: 25, fromScale: 0.8, fromOpacity: 0, duration: 0.85, easing: 'halus' }
  ),
  A(
    'alight-depth-tilt',
    'Depth Tilt In',
    'alight',
    '3d',
    'menengah',
    'Bidang miring masuk dengan skala 1,08 lalu menegak, memberi kesan kamera menunduk.',
    'Menambah kedalaman pada kartu atau layar tanpa perlu kamera 3D.',
    ['Tilt 12° → 0°', 'Skala 1,08 → 1', 'Fokus tetap di tengah'],
    ['Letakkan kartu di tengah.', 'Keyframe 0: sy 0,94, rot 12, skala 1,08.', 'Keyframe 0,7: sy 1,02, rot -2.', 'Keyframe 1: identitas penuh.'],
    ['3d', 'tilt', 'kamera', 'alight'],
    {
      kind: 'in',
      duration: 0.78,
      easing: 'outCubic',
      keyframes: [
        { t: 0, sy: 0.94, rot: 12, scale: 1.08, alpha: 0, easing: 'outCubic' },
        { t: 0.7, sy: 1.02, rot: -2, scale: 1.01, alpha: 1 },
        { t: 1, sy: 1, rot: 0, scale: 1 },
      ],
    },
    { fromScale: 1.08, fromRot: 12, fromOpacity: 0, duration: 0.78, easing: 'halus' }
  ),
  A(
    'alight-liquid-warp',
    'Liquid Warp',
    'alight',
    '2d',
    'lanjut',
    'Elemen berubah bentuk dengan skew bolak-balik halus seperti cairan.',
    'Memberi tekstur organik pada shape atau teks besar.',
    ['Skew maksimal 8°', 'Dua fase', 'Akhir di 0°'],
    ['Siapkan shape besar.', 'Buat keyframe skew 8 → -4 → 0.', 'Tambahkan skala 1,03 di tengah.', 'Batasi hanya untuk satu elemen.'],
    ['liquid', 'warp', 'skew', 'alight'],
    {
      kind: 'in',
      duration: 0.9,
      easing: 'inOutSine',
      keyframes: [
        { t: 0, skew: 8, scale: 0.94, alpha: 0, easing: 'inOutSine' },
        { t: 0.5, skew: -4, scale: 1.03, alpha: 1 },
        { t: 1, skew: 0, scale: 1 },
      ],
    },
    { fromSkew: 8, fromScale: 0.94, fromOpacity: 0, duration: 0.9, easing: 'halus' }
  ),
  T(
    'alight-glitch-cut',
    'Glitch Cut',
    'alight',
    'transition',
    'lanjut',
    'Potongan glitch RGB dengan getaran singkat sebelum scene baru stabil.',
    'Cocok untuk konten teknologi, gaming, dan beat drop.',
    ['Durasi 0,3 s', 'Satu kali per 15 s', 'Jangan untuk teks kecil'],
    ['Siapkan dua scene berkontras.', 'Pakai kind glitch intensitas 2.', 'Tambahkan aksen getar.', 'Pastikan audio dipotong di titik yang sama.'],
    ['glitch', 'rgb', 'transisi', 'alight'],
    { kind: 'glitch', duration: 0.32, easing: 'linear', energy: 3, params: { intensity: 2, fx: 'getar' } },
    { fromX: -40, fromOpacity: 0.6, duration: 0.32, easing: 'tegas' }
  ),
  A(
    'alight-motion-trail',
    'Motion Trail Echo',
    'alight',
    'mg',
    'menengah',
    'Elemen bergerak dengan sisa bayangan tipis di belakangnya.',
    'Membuat gerak terasa lebih cepat dan sinematik.',
    ['Echo ≤ 3 lapis', 'Alpha 0,2', 'Jarak mengikuti arah'],
    ['Duplikasi elemen tiga kali.', 'Geser 8/16/24 px ke belakang.', 'Turunkan alpha 0,28/0,16/0,08.', 'Animasi hanya elemen utama.'],
    ['trail', 'echo', 'motion', 'alight'],
    {
      kind: 'in',
      duration: 0.5,
      easing: 'outExpo',
      keyframes: [
        { t: 0, x: 120, blur: 10, alpha: 0, easing: 'outExpo' },
        { t: 0.7, x: -6, blur: 2, alpha: 1 },
        { t: 1, x: 0, blur: 0 },
      ],
    },
    { fromX: 120, fromBlur: 10, fromOpacity: 0, duration: 0.5, easing: 'tegas' }
  ),

  // ---------------------------------------------------------------- Premiere
  T(
    'pr-luma-wipe',
    'Luma Wipe',
    'premiere',
    'transition',
    'menengah',
    'Scene baru menyapu mengikuti gradasi cahaya, bukan garis keras.',
    'Transisi halus yang tetap terasa sinematik.',
    ['Arah mengikuti cahaya', 'Tepi lembut', 'Durasi 0,7 s'],
    ['Tentukan arah cahaya di footage.', 'Pakai kind lens dengan tepi soft.', 'Gerakkan searah sumber cahaya.', 'Hindari pada shot gelap total.'],
    ['luma', 'wipe', 'sinematik', 'premiere'],
    { kind: 'lens', duration: 0.72, easing: 'inOutSine', energy: 1, params: { dir: 'right', edge: 'soft' } },
    { fromX: 280, fromBlur: 8, fromOpacity: 0.5, duration: 0.72, easing: 'halus' }
  ),
  T(
    'pr-zoom-punch',
    'Zoom Punch',
    'premiere',
    'transition',
    'pemula',
    'Zoom cepat ke arah scene baru dengan hentakan singkat.',
    'Menambah bobot pada pernyataan penting.',
    ['Zoom 1,15×', 'Durasi 0,35 s', 'Satu aksen hentak'],
    ['Pilih momen penegasan.', 'Pakai kind zoom.', 'Tambahkan aksen zoom.', 'Jangan ulang di scene berikutnya.'],
    ['zoom', 'punch', 'premiere', 'energi'],
    { kind: 'zoom', duration: 0.36, easing: 'inOutExpo', energy: 3, params: { intensity: 1.4, fx: 'zoom' } },
    { fromScale: 1.3, fromOpacity: 0.4, duration: 0.36, easing: 'tegas' }
  ),
  T(
    'pr-film-roll',
    'Film Roll',
    'premiere',
    'transition',
    'menengah',
    'Gulungan film bergerak vertikal memindahkan scene seperti proyektor.',
    'Memberi nuansa retro dan editorial.',
    ['Arah vertikal', 'Durasi 0,8 s', 'Kontras tinggi'],
    ['Siapkan dua scene.', 'Pakai kind filmroll.', 'Arahkan ke atas untuk maju.', 'Tambahkan grain tipis setelahnya.'],
    ['film', 'retro', 'roll', 'premiere'],
    { kind: 'filmroll', duration: 0.8, easing: 'inOutCubic', energy: 2, params: { dir: 'up' } },
    { fromY: 300, fromOpacity: 0.5, duration: 0.8, easing: 'halus' }
  ),
  A(
    'pr-lower-third',
    'Lower Third Slide',
    'premiere',
    '2d',
    'pemula',
    'Nama dan jabatan masuk dari bawah dengan garis aksen.',
    'Identitas pembicara tampil rapi tanpa menutup wajah.',
    ['Tampil 3–4 detik', '80 px dari tepi aman', 'Satu garis aksen'],
    ['Siapkan nama, jabatan, garis.', 'Geser grup dari y 60.', 'Fade 0 → 1 dalam 0,35 s.', 'Keluarkan setelah 3,5 s.'],
    ['lower-third', 'nama', 'premiere', 'broadcast'],
    { kind: 'in', duration: 0.45, easing: 'outCubic', from: { y: 60, alpha: 0 } },
    { fromY: 60, fromOpacity: 0, duration: 0.45, easing: 'halus' }
  ),
  T(
    'pr-cross-dissolve',
    'Cross Dissolve',
    'premiere',
    'transition',
    'pemula',
    'Pudar silang klasik antar dua shot dengan durasi terkontrol.',
    'Transisi paling netral untuk wawancara dan narasi.',
    ['Durasi 0,5–1 s', 'Tanpa aksen', 'Kontinuitas warna'],
    ['Pilih dua shot dengan exposure mirip.', 'Pakai kind fade tanpa warna.', 'Atur 0,6 s.', 'Hindari pada gerakan cepat.'],
    ['fade', 'dissolve', 'premiere', 'naratif'],
    { kind: 'fade', duration: 0.6, easing: 'inOutSine', energy: 1, params: {} },
    { fromOpacity: 0, duration: 0.6, easing: 'halus' }
  ),

  // ------------------------------------------------------------ After Effects
  A(
    'ae-kinetic-cascade',
    'Kinetic Type Cascade',
    'aftereffects',
    'kinetic',
    'lanjut',
    'Huruf muncul berurutan dengan scramble singkat lalu mengunci kata.',
    'Menarik perhatian pada headline pembuka.',
    ['Per huruf', 'Scramble 120 ms', 'Offset 18 ms'],
    ['Pecah headline per huruf.', 'Aktifkan scramble.', 'Atur overlap 0,2.', 'Kunci semua huruf sebelum 0,8 s.'],
    ['kinetic', 'teks', 'headline', 'aftereffects'],
    { kind: 'in', duration: 0.7, easing: 'outCubic', text: { mode: 'char', from: { y: 26, alpha: 0 }, overlap: 0.25, scramble: true } },
    { fromY: 26, fromOpacity: 0, duration: 0.7, easing: 'halus' }
  ),
  A(
    'ae-parallax-push',
    'Parallax 3D Push',
    'aftereffects',
    '3d',
    'lanjut',
    'Latar belakang bergerak lebih lambat dari objek depan, memberi kedalaman.',
    'Menghidupkan komposisi statis tanpa kamera 3D sungguhan.',
    ['Depan 1×, tengah 0,6×, belakang 0,3×', 'Blur hanya di belakang', 'Satu arah'],
    ['Pisahkan minimal dua layer.', 'Geser layer depan 40 px.', 'Geser belakang 12 px dengan blur 4.', 'Selesaikan dalam 0,9 s.'],
    ['parallax', '3d', 'depth', 'aftereffects'],
    {
      kind: 'in',
      duration: 0.95,
      easing: 'outSine',
      keyframes: [
        { t: 0, x: -40, scale: 1.06, blur: 6, alpha: 0, easing: 'outSine' },
        { t: 0.75, x: 4, scale: 1.01, blur: 1, alpha: 1 },
        { t: 1, x: 0, scale: 1, blur: 0 },
      ],
    },
    { fromX: -40, fromScale: 1.06, fromBlur: 6, fromOpacity: 0, duration: 0.95, easing: 'halus' }
  ),
  A(
    'ae-neon-pop',
    'Neon Glow Pop',
    'aftereffects',
    'mg',
    'menengah',
    'Elemen menyala dari gelap dengan kilau singkat lalu stabil.',
    'Cocok untuk promo malam, gaming, dan musik.',
    ['Kilau 1 frame', 'Skala 0,94 → 1', 'Warna kontras'],
    ['Siapkan elemen berwarna terang.', 'Keyframe 0: alpha 0, skala 0,94.', 'Keyframe 0,55: alpha 1, skala 1,02.', 'Akhiri normal.'],
    ['neon', 'glow', 'promo', 'aftereffects'],
    {
      kind: 'in',
      duration: 0.52,
      easing: 'outBack',
      keyframes: [
        { t: 0, scale: 0.94, alpha: 0, easing: 'outCubic' },
        { t: 0.55, scale: 1.02, alpha: 1, easing: 'outBack' },
        { t: 1, scale: 1, alpha: 1 },
      ],
    },
    { fromScale: 0.94, fromOpacity: 0, duration: 0.52, easing: 'membal' }
  ),
  T(
    'ae-shape-burst',
    'Shape Burst',
    'aftereffects',
    'transition',
    'lanjut',
    'Bentuk meledak dari tengah layar lalu membuka scene baru.',
    'Memberi penanda babak atau pergantian tema besar.',
    ['Satu kali per video', 'Pusat layar', 'Aksen kilat'],
    ['Tentukan momen puncak.', 'Pakai kind burst.', 'Arahkan origin ke tengah.', 'Tambahkan aksen kilat putih.'],
    ['burst', 'shape', 'aftereffects', 'puncak'],
    { kind: 'burst', duration: 0.55, easing: 'outExpo', energy: 3, params: { origin: 'center', intensity: 1.4, fx: 'kilat' } },
    { fromScale: 0.2, fromOpacity: 0, duration: 0.55, easing: 'tegas' }
  ),
  A(
    'ae-text-highlight',
    'Text Highlight Sweep',
    'aftereffects',
    'kinetic',
    'menengah',
    'Kata kunci disorot satu per satu seperti stabilo bergerak.',
    'Membantu audiens menangkap inti kalimat panjang.',
    ['Satu highlight per kalimat', 'Durasi 0,5 s', 'Warna aksen'],
    ['Siapkan teks per baris.', 'Aktifkan highlight.', 'Atur overlap 0,5.', 'Pilih satu kata kunci saja.'],
    ['highlight', 'teks', 'aftereffects', 'penekanan'],
    { kind: 'in', duration: 0.55, easing: 'outCubic', text: { mode: 'line', from: { alpha: 0 }, overlap: 0.5, highlight: true } },
    { fromOpacity: 0, duration: 0.55, easing: 'halus' }
  ),
];

export const MOTION_RECIPE_COUNT = MOTION_RECIPES.length;

export const motionSource = (id: MotionSourceId): MotionSource =>
  MOTION_SOURCES.find((s) => s.id === id) || MOTION_SOURCES[0];

export const recipeCode = (recipe: MotionRecipe): string => JSON.stringify(recipe.code, null, 2);

export function findRecipe(id: string): MotionRecipe | undefined {
  return MOTION_RECIPES.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */
/* Riset mendalam: dari topik singkat menjadi rencana gerak per detik  */
/* ------------------------------------------------------------------ */

export type Platform = 'tiktok' | 'reels' | 'shorts' | 'youtube';

export interface ResearchInput {
  topic: string;
  audience: string;
  goal: string;
  source: MotionSourceId | 'mix';
  platform: Platform;
  durationSec: number;
  tone?: string;
  keywords?: string;
}

export interface ResearchBeat {
  index: number;
  start: number;
  end: number;
  role: string;
  onScreen: string;
  motion: string;
  recipeIds: string[];
  transition: string;
}

export interface ResearchBrief {
  title: string;
  topic: string;
  audience: string;
  goal: string;
  platform: Platform;
  durationSec: number;
  sourceLabel: string;
  positioning: string;
  bigIdea: string;
  hookOptions: string[];
  beats: ResearchBeat[];
  assetChecklist: string[];
  soundDesign: string[];
  ctaOptions: string[];
  researchQuestions: string[];
  validationChecklist: string[];
  recommendedRecipes: MotionRecipe[];
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
  shorts: 'YouTube Shorts',
  youtube: 'YouTube',
};

const clampDuration = (n: number) => Math.max(12, Math.min(90, Math.round(n || 28)));

function pickRecipes(source: MotionSourceId | 'mix', category: MotionCategory, count: number): MotionRecipe[] {
  const pool = MOTION_RECIPES.filter((r) => (source === 'mix' || r.source === source) && r.category === category);
  const fallback = MOTION_RECIPES.filter((r) => r.category === category);
  const list = pool.length ? pool : fallback;
  return list.slice(0, count);
}

function ids(list: MotionRecipe[]): string[] {
  return list.map((r) => r.id);
}

export function buildResearchBrief(input: ResearchInput): ResearchBrief {
  const topic = input.topic.trim() || 'Produk baru yang ingin dikenal lebih cepat';
  const audience = input.audience.trim() || 'pemilik usaha kecil dan kreator pemula';
  const goal = input.goal.trim() || 'menaikkan jumlah orang yang menyimpan dan membagikan video';
  const tone = (input.tone || 'yakin, hangat, tidak bertele-tele').trim();
  const keywords = (input.keywords || '')
    .split(/[,;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const duration = clampDuration(input.durationSec);
  const src = input.source;
  const sourceLabel = src === 'mix' ? 'Campuran (CapCut + Figma + Premiere + Alight Motion)' : motionSource(src).name;

  const hooks = [
    `Kalau kamu ${audience.split(',')[0]}, berhenti scroll — ${topic} ini mengubah cara kerjanya.`,
    `3 detik untuk tahu kenapa ${topic} terasa beda.`,
    `${topic}: hal yang biasanya baru disadari setelah mencoba.`,
    `Jangan beli/bikin apa pun sebelum lihat ${keywords[0] || topic} ini.`,
  ];

  const beatCount = duration <= 18 ? 5 : duration <= 32 ? 6 : 7;
  const segment = duration / beatCount;
  const roles =
    beatCount === 5
      ? ['Hook', 'Masalah', 'Demo', 'Bukti', 'CTA']
      : beatCount === 6
        ? ['Hook', 'Masalah', 'Janji', 'Demo', 'Bukti', 'CTA']
        : ['Hook', 'Masalah', 'Janji', 'Demo 1', 'Demo 2', 'Bukti', 'CTA'];

  const recipes = {
    hook: [...pickRecipes(src, 'kinetic', 1), ...pickRecipes(src, 'mg', 1)],
    body: [...pickRecipes(src, '2d', 1), ...pickRecipes(src, 'ui', 1), ...pickRecipes(src, 'mg', 1)],
    depth: [...pickRecipes(src, '3d', 1), ...pickRecipes(src, 'kinetic', 1)],
    trans: [...pickRecipes(src, 'transition', 1)],
  };

  const onScreen: Record<string, string> = {
    Hook: `Teks besar: “${topic}” + 1 kalimat pemicu rasa penasaran`,
    Masalah: `Tunjukkan kebiasaan lama ${audience} yang bikin lambat/boros`,
    Janji: `Satu kalimat hasil akhir yang konkret (angka bila ada)`,
    Demo: `Langkah 1–3 memakai ${keywords[0] || topic} dalam gerak cepat`,
    'Demo 1': `Langkah pertama + close-up detail paling penting`,
    'Demo 2': `Langkah kedua + perbandingan sebelum/sesudah`,
    Bukti: `Testimoni singkat, angka, atau reaksi nyata`,
    CTA: `Satu ajakan jelas: ${goal}`,
  };

  const motionFor: Record<string, string> = {
    Hook: `Kinetic type + pop sinkron beat (${ids(recipes.hook).join(', ') || 'beat pop'})`,
    Masalah: 'Geser horizontal pendek + blur tipis, jangan lebih dari 2 gerak',
    Janji: `Smart animate / glide halus (${recipes.body[1]?.name || 'Smart Animate Glide'})`,
    Demo: `Mask reveal + stagger; ganti fokus tiap 2–3 detik (${recipes.body.map((r) => r.name).join(', ')})`,
    'Demo 1': `Mask reveal produk + lower third (${recipes.body[0]?.name || 'Mask Lingkaran Reveal'})`,
    'Demo 2': `Parallax ringan + highlight teks (${recipes.body[2]?.name || 'Text Highlight Sweep'})`,
    Bukti: `Kartu bukti masuk spring, angka di-highlight (${recipes.depth[1]?.name || 'Spring Modal'})`,
    CTA: `Tombol/teks CTA masuk dengan spring, tahan 2 detik terakhir`,
  };

  const beats: ResearchBeat[] = roles.map((role, i) => {
    const start = +(i * segment).toFixed(2);
    const end = +((i + 1) * segment).toFixed(2);
    return {
      index: i + 1,
      start,
      end,
      role,
      onScreen: onScreen[role] || `Detail pendukung ${role.toLowerCase()}`,
      motion: motionFor[role] || 'Satu gerak penegas, sisanya diam',
      recipeIds:
        role === 'Hook'
          ? ids(recipes.hook)
          : role === 'CTA'
            ? ids([...recipes.depth.slice(1), ...recipes.trans])
            : ids(recipes.body),
      transition: i === 0 ? 'cut dingin' : recipes.trans[0]?.name || 'Cross Dissolve',
    };
  });

  return {
    title: `Riset Gerak: ${topic}`,
    topic,
    audience,
    goal,
    platform: input.platform,
    durationSec: duration,
    sourceLabel,
    positioning: `${topic} diposisikan untuk ${audience}, dengan nada ${tone}. Fokus pesan: ${goal}.`,
    bigIdea: `Satu ide besar: ${topic} bukan sekadar ${keywords[1] || 'pilihan baru'}, tetapi cara paling cepat menuju ${keywords[0] || 'hasil yang terlihat'}.`,
    hookOptions: hooks,
    beats,
    assetChecklist: [
      'Logo/wordmark versi terang & gelap',
      '3–5 shot produk/demo vertikal 9:16',
      '1 layar bukti (angka, ulasan, atau sebelum-sesudah)',
      'Ikon pendukung gaya garis konsisten',
      'Musik 1 track + 3 efek suara (whoosh, pop, klik)',
      'Font judul + font isi (maksimal 2 keluarga)',
    ],
    soundDesign: [
      'Ketukan kuat di 0,0 s untuk hook; jangan mulai dengan intro panjang.',
      'Whoosh tepat di transisi utama, volume −18 dB agar tidak menutupi narasi.',
      'Turunkan musik 6 dB saat angka/bukti muncul.',
      'Hentikan musik 0,3 s sebelum CTA, lalu kembalikan di ketukan.',
    ],
    ctaOptions: [
      `Simpan video ini sebelum ${keywords[0] || 'mencobanya'} besok.`,
      `Tulis “${keywords[0] || 'MULAI'}” kalau mau versi langkah lengkapnya.`,
      `Bagikan ke satu orang yang butuh ${topic}.`,
    ],
    researchQuestions: [
      `Apa satu keberatan terbesar ${audience} tentang ${topic}?`,
      `Bukti apa yang paling cepat dipercaya: angka, demo, atau testimoni?`,
      `Adegan mana yang bisa dipahami tanpa suara?`,
      `Di detik ke berapa penonton biasanya berhenti menonton?`,
      `Apakah CTA masih terasa wajar setelah ${duration} detik?`,
    ],
    validationChecklist: [
      'Hook terbaca dalam 1,5 detik pertama di layar 5 inci.',
      'Maksimal 2 keluarga font dan 3 warna aksen.',
      'Tidak ada transisi berat berturut-turut.',
      'Setiap scene punya satu titik fokus.',
      'CTA terlihat minimal 2 detik dan kontras terhadap latar.',
      `Durasi akhir ≤ ${duration} detik untuk ${PLATFORM_LABEL[input.platform]}.`,
    ],
    recommendedRecipes: [...recipes.hook, ...recipes.body, ...recipes.depth, ...recipes.trans].filter(
      (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i
    ),
  };
}

export function briefToMarkdown(brief: ResearchBrief): string {
  const lines: string[] = [
    `# ${brief.title}`,
    '',
    `- **Platform:** ${PLATFORM_LABEL[brief.platform]}`,
    `- **Durasi target:** ${brief.durationSec} detik`,
    `- **Referensi gerak:** ${brief.sourceLabel}`,
    `- **Audiens:** ${brief.audience}`,
    `- **Tujuan:** ${brief.goal}`,
    '',
    '## Positioning',
    brief.positioning,
    '',
    '## Ide besar',
    brief.bigIdea,
    '',
    '## Pilihan hook',
    ...brief.hookOptions.map((h) => `- ${h}`),
    '',
    '## Rencana per beat',
    '| # | Waktu | Peran | Di layar | Gerak | Transisi |',
    '| --- | --- | --- | --- | --- | --- |',
    ...brief.beats.map(
      (b) => `| ${b.index} | ${b.start}s–${b.end}s | ${b.role} | ${b.onScreen} | ${b.motion} | ${b.transition} |`
    ),
    '',
    '## Checklist aset',
    ...brief.assetChecklist.map((x) => `- [ ] ${x}`),
    '',
    '## Sound design',
    ...brief.soundDesign.map((x) => `- ${x}`),
    '',
    '## Pilihan CTA',
    ...brief.ctaOptions.map((x) => `- ${x}`),
    '',
    '## Pertanyaan riset',
    ...brief.researchQuestions.map((x) => `- ${x}`),
    '',
    '## Validasi sebelum publish',
    ...brief.validationChecklist.map((x) => `- [ ] ${x}`),
    '',
    '## Resep gerak yang dipakai',
    ...brief.recommendedRecipes.map((r) => `- **${r.name}** (${motionSource(r.source).name}, ${r.level}) — ${r.summary}`),
    '',
    '> Istilah aplikasi dipakai sebagai referensi alur kerja, bukan klaim afiliasi.',
  ];
  return lines.join('\n');
}

export const PLATFORM_OPTIONS = (Object.keys(PLATFORM_LABEL) as Platform[]).map((id) => ({
  value: id,
  label: PLATFORM_LABEL[id],
}));
