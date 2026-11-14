import { EasingId, ease, clamp, hash01 } from '../easing';

/**
 * Transition Pack — 9000+ transisi antar scene (58 jenis render × 5 aksen).
 * Setiap transisi = `kind` (algoritma gambar) + parameter. Admin bisa menambah transisi
 * lewat kode JSON (kind + params), atau mode "custom" dengan pose keluar/masuk + mask.
 */

export type TransitionKind =
  | 'cut'
  | 'fade'
  | 'slide'
  | 'push'
  | 'wipe'
  | 'iris'
  | 'shape'
  | 'zoom'
  | 'blinds'
  | 'grid'
  | 'stripes'
  | 'spin'
  | 'flip'
  | 'cube'
  | 'whip'
  | 'glitch'
  | 'flash'
  | 'blur'
  | 'split'
  | 'clock'
  | 'pixelate'
  | 'ink'
  | 'slice'
  | 'colorwipe'
  | 'burst'
  | 'shake'
  | 'card'
  | 'dolly'
  | 'shatter'
  | 'sand'
  | 'wave'
  | 'zigzag'
  | 'dots'
  | 'rings'
  | 'fan'
  | 'pie'
  | 'checker'
  | 'carousel'
  | 'tilt'
  | 'stretch'
  | 'colorbars'
  | 'scan'
  | 'diagblinds'
  | 'filmroll'
  | 'swing'
  | 'curtain'
  | 'spotlight'
  | 'flytiles'
  | 'tear'
  | 'roll'
  | 'slats'
  | 'pagecurl'
  | 'tilesout'
  | 'lens'
  | 'brush'
  | 'melt'
  | 'bubbles'
  | 'toss'
  | 'custom';

export interface TransitionParams {
  dir?: 'left' | 'right' | 'up' | 'down' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
  count?: number;
  angle?: number;
  origin?: 'center' | 'tl' | 'tr' | 'bl' | 'br';
  shape?: 'circle' | 'diamond' | 'square' | 'star' | 'heart' | 'hexagon' | 'triangle';
  color?: 'black' | 'white' | 'primary' | 'secondary';
  edge?: 'hard' | 'soft' | 'glow';
  intensity?: number;
  reverse?: boolean;
  order?: 'random' | 'diagonal' | 'rows';
  /** custom */
  outFrom?: CustomPose;
  outTo?: CustomPose;
  inFrom?: CustomPose;
  inTo?: CustomPose;
  mask?: 'none' | 'circle' | 'rect' | 'diamond';
  /** mode khusus jenis tertentu (ubin: shrink/spin/fall, lempar: foto) */
  mode?: string;
  /** aksen di atas transisi: kilat putih, kilat warna, zoom hentak, getar, cahaya bocor */
  fx?: 'kilat' | 'warna' | 'zoom' | 'getar' | 'cahaya';
}

interface CustomPose {
  x?: number;
  y?: number;
  scale?: number;
  rot?: number;
  alpha?: number;
}

export interface TransitionSpec {
  id: string;
  name: string;
  group: string;
  kind: TransitionKind;
  tags: string[];
  duration: number;
  easing: EasingId;
  params: TransitionParams;
  energy: 1 | 2 | 3;
  author?: 'builtin' | 'admin';
}

/** Aksen yang bisa ditempel ke transisi mana pun (id transisi: `<id>~<aksen>`). */
export const TRANSITION_FX: Array<{ id: NonNullable<TransitionParams['fx']>; label: string; tag: string }> = [
  { id: 'kilat', label: 'Kilat Putih', tag: 'kilat' },
  { id: 'warna', label: 'Kilat Warna', tag: 'warna' },
  { id: 'zoom', label: 'Zoom Hentak', tag: 'zoom' },
  { id: 'getar', label: 'Getar', tag: 'getar' },
  { id: 'cahaya', label: 'Cahaya Bocor', tag: 'cahaya' },
];

export const TRANSITION_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'dasar', label: 'Dasar' },
  { id: 'geser', label: 'Geser & Dorong' },
  { id: 'sapu', label: 'Sapu (Wipe)' },
  { id: 'bentuk', label: 'Bentuk & Iris' },
  { id: 'zoom', label: 'Zoom & Kamera' },
  { id: 'pola', label: 'Pola & Bilah' },
  { id: 'efek', label: 'Efek & Glitch' },
  { id: '3d', label: '3D & Putar' },
  { id: 'hancur', label: 'Kaca Pecah & Pasir' },
  { id: 'custom', label: 'Custom Admin' },
];

const DIR8: Array<[NonNullable<TransitionParams['dir']>, string]> = [
  ['left', 'Kiri'],
  ['right', 'Kanan'],
  ['up', 'Atas'],
  ['down', 'Bawah'],
  ['up-left', 'Kiri Atas'],
  ['up-right', 'Kanan Atas'],
  ['down-left', 'Kiri Bawah'],
  ['down-right', 'Kanan Bawah'],
];
const DIR4 = DIR8.slice(0, 4);
const EASE3: Array<[string, string, EasingId]> = [
  ['halus', 'Halus', 'inOutCubic'],
  ['tegas', 'Tegas', 'inOutExpo'],
  ['membal', 'Membal', 'inOutBack'],
];

function buildLibrary(): TransitionSpec[] {
  const L: TransitionSpec[] = [];
  const add = (t: Omit<TransitionSpec, 'author'>) => L.push({ ...t, author: 'builtin' });

  add({ id: 'cut', name: 'Potong Langsung', group: 'dasar', kind: 'cut', tags: ['cut'], duration: 0.01, easing: 'linear', params: {}, energy: 3 });
  for (const [c, cl] of [
    ['none', 'Silang'],
    ['black', 'via Hitam'],
    ['white', 'via Putih'],
    ['primary', 'via Warna Brand'],
  ] as const) {
    for (const [sk, sl, d] of [
      ['cepat', 'Cepat', 0.35],
      ['normal', 'Normal', 0.6],
      ['lambat', 'Lambat', 1],
    ] as const) {
      add({ id: `fade-${c}-${sk}`, name: `Pudar ${cl} · ${sl}`, group: 'dasar', kind: 'fade', tags: ['fade', 'lembut'], duration: d, easing: 'inOutSine', params: c === 'none' ? {} : { color: c }, energy: 1 });
    }
  }
  for (const [k, l, i] of [
    ['ringan', 'Ringan', 8],
    ['sedang', 'Sedang', 18],
    ['berat', 'Berat', 32],
  ] as const) {
    add({ id: `blur-${k}`, name: `Larut Blur · ${l}`, group: 'dasar', kind: 'blur', tags: ['blur', 'dreamy'], duration: 0.7, easing: 'inOutSine', params: { intensity: i }, energy: 1 });
  }

  for (const [d, dl] of DIR8) {
    for (const [ek, el, e] of EASE3) {
      add({ id: `slide-${d}-${ek}`, name: `Tutup dari ${dl} · ${el}`, group: 'geser', kind: 'slide', tags: ['slide', d], duration: 0.55, easing: e, params: { dir: d }, energy: 2 });
      add({ id: `push-${d}-${ek}`, name: `Dorong ke ${dl} · ${el}`, group: 'geser', kind: 'push', tags: ['push', d], duration: 0.55, easing: e, params: { dir: d }, energy: 2 });
    }
  }
  for (const [d, dl] of DIR4) {
    add({ id: `card-${d}`, name: `Tumpuk Kartu ${dl}`, group: 'geser', kind: 'card', tags: ['card', 'stack'], duration: 0.65, easing: 'outCubic', params: { dir: d }, energy: 2 });
    add({ id: `whip-${d}`, name: `Whip Pan ${dl}`, group: 'geser', kind: 'whip', tags: ['whip', 'cepat', 'blur'], duration: 0.4, easing: 'inOutQuart', params: { dir: d }, energy: 3 });
    add({ id: `whip-${d}-kuat`, name: `Whip Pan ${dl} · Kuat`, group: 'geser', kind: 'whip', tags: ['whip', 'cepat'], duration: 0.32, easing: 'inOutExpo', params: { dir: d, intensity: 2 }, energy: 3 });
  }

  for (const [d, dl] of DIR8) {
    for (const [ek, el] of [
      ['hard', 'Tajam'],
      ['soft', 'Lembut'],
      ['glow', 'Bercahaya'],
    ] as const) {
      add({ id: `wipe-${d}-${ek}`, name: `Sapu ${dl} · ${el}`, group: 'sapu', kind: 'wipe', tags: ['wipe', d], duration: 0.6, easing: 'inOutCubic', params: { dir: d, edge: ek }, energy: 2 });
    }
    for (const [ck, cl] of [
      ['primary', 'Brand'],
      ['secondary', 'Aksen'],
    ] as const) {
      add({ id: `colorwipe-${d}-${ck}`, name: `Sapu Warna ${cl} ${dl}`, group: 'sapu', kind: 'colorwipe', tags: ['colorwipe', 'brand'], duration: 0.7, easing: 'inOutQuart', params: { dir: d, color: ck }, energy: 3 });
    }
  }
  for (const a of [15, 30, 60, 75]) {
    for (const rev of [false, true]) {
      add({ id: `wipe-sudut-${a}${rev ? '-balik' : ''}`, name: `Sapu Miring ${a}°${rev ? ' Balik' : ''}`, group: 'sapu', kind: 'wipe', tags: ['wipe', 'diagonal'], duration: 0.6, easing: 'inOutCubic', params: { angle: a, reverse: rev, edge: 'soft' }, energy: 2 });
    }
  }
  for (const [o, ol] of [
    ['center', 'Tengah'],
    ['tl', 'Kiri Atas'],
    ['tr', 'Kanan Atas'],
    ['bl', 'Kiri Bawah'],
    ['br', 'Kanan Bawah'],
  ] as const) {
    for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
      add({ id: `iris-${o}-${ek}`, name: `Iris Buka ${ol} · ${el}`, group: 'bentuk', kind: 'iris', tags: ['iris', 'lingkaran'], duration: 0.65, easing: e, params: { origin: o }, energy: 2 });
    }
    add({ id: `iris-${o}-tutup`, name: `Iris Tutup ${ol}`, group: 'bentuk', kind: 'iris', tags: ['iris'], duration: 0.7, easing: 'inOutCubic', params: { origin: o, reverse: true }, energy: 2 });
    add({ id: `clock-${o}`, name: `Jarum Jam ${ol}`, group: 'bentuk', kind: 'clock', tags: ['clock', 'radial'], duration: 0.7, easing: 'inOutSine', params: { origin: o }, energy: 2 });
  }
  for (const [s, sl] of [
    ['diamond', 'Berlian'],
    ['square', 'Kotak'],
    ['star', 'Bintang'],
    ['heart', 'Hati'],
    ['hexagon', 'Heksagon'],
    ['triangle', 'Segitiga'],
  ] as const) {
    for (const [ek, el, e] of [EASE3[0], EASE3[2]]) {
      add({ id: `shape-${s}-${ek}`, name: `Bentuk ${sl} · ${el}`, group: 'bentuk', kind: 'shape', tags: ['shape', s], duration: 0.7, easing: e, params: { shape: s }, energy: 2 });
    }
    add({ id: `shape-${s}-putar`, name: `Bentuk ${sl} Berputar`, group: 'bentuk', kind: 'shape', tags: ['shape', s, 'putar'], duration: 0.75, easing: 'inOutCubic', params: { shape: s, angle: 180 }, energy: 3 });
  }
  for (const n of [3, 5, 8]) {
    add({ id: `burst-${n}`, name: `Sinar Burst ${n * 2} Bilah`, group: 'bentuk', kind: 'burst', tags: ['burst', 'sinar'], duration: 0.7, easing: 'inOutCubic', params: { count: n * 2 }, energy: 3 });
    add({ id: `ink-${n}`, name: `Tinta Menyebar ${n}`, group: 'bentuk', kind: 'ink', tags: ['ink', 'organik'], duration: 0.8, easing: 'inOutSine', params: { count: n + 3 }, energy: 2 });
  }

  for (const [k, l, p] of [
    ['masuk', 'Zoom Masuk', { reverse: false }],
    ['keluar', 'Zoom Keluar', { reverse: true }],
  ] as const) {
    for (const [ik, il, i] of [
      ['halus', 'Halus', 0.4],
      ['sedang', 'Sedang', 1],
      ['kuat', 'Kuat', 2.2],
    ] as const) {
      add({ id: `zoom-${k}-${ik}`, name: `${l} · ${il}`, group: 'zoom', kind: 'zoom', tags: ['zoom', 'kamera'], duration: 0.6, easing: 'inOutCubic', params: { ...p, intensity: i }, energy: i > 1 ? 3 : 2 });
      add({ id: `zoom-${k}-putar-${ik}`, name: `${l} Putar · ${il}`, group: 'zoom', kind: 'zoom', tags: ['zoom', 'putar'], duration: 0.65, easing: 'inOutExpo', params: { ...p, intensity: i, angle: 25 * i }, energy: 3 });
    }
  }
  for (const [k, l, i] of [
    ['lembut', 'Lembut', 0.6],
    ['sedang', 'Sedang', 1],
    ['dramatis', 'Dramatis', 1.6],
  ] as const) {
    add({ id: `dolly-${k}`, name: `Dolly Kamera · ${l}`, group: 'zoom', kind: 'dolly', tags: ['dolly', 'sinematik'], duration: 0.8, easing: 'inOutQuart', params: { intensity: i }, energy: 2 });
    add({ id: `shake-${k}`, name: `Guncang Kamera · ${l}`, group: 'zoom', kind: 'shake', tags: ['shake', 'impact'], duration: 0.45, easing: 'outCubic', params: { intensity: i }, energy: 3 });
  }

  for (const [dk, dl] of [
    ['h', 'Horizontal'],
    ['v', 'Vertikal'],
  ] as const) {
    for (const n of [4, 6, 10, 16]) {
      for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
        add({ id: `blinds-${dk}-${n}-${ek}`, name: `Kerai ${dl} ${n} · ${el}`, group: 'pola', kind: 'blinds', tags: ['blinds', 'kerai'], duration: 0.6, easing: e, params: { dir: dk === 'h' ? 'down' : 'right', count: n }, energy: 2 });
      }
    }
  }
  for (const n of [3, 4, 6, 8]) {
    for (const [ok, ol] of [
      ['random', 'Acak'],
      ['diagonal', 'Diagonal'],
      ['rows', 'Baris'],
    ] as const) {
      add({ id: `grid-${n}-${ok}`, name: `Ubin ${n}×${n} ${ol}`, group: 'pola', kind: 'grid', tags: ['grid', 'mosaic'], duration: 0.75, easing: 'outBack', params: { count: n, order: ok }, energy: 2 });
    }
  }
  for (const [d, dl] of DIR4) {
    for (const n of [3, 5, 8]) {
      add({ id: `stripes-${d}-${n}`, name: `Bilah Meluncur ${dl} ${n}`, group: 'pola', kind: 'stripes', tags: ['stripes', 'bars'], duration: 0.7, easing: 'inOutQuart', params: { dir: d, count: n }, energy: 3 });
    }
  }
  for (const n of [2, 3, 5]) {
    for (const rev of [false, true]) {
      add({ id: `slice-${n}${rev ? '-balik' : ''}`, name: `Tebas Diagonal ${n}${rev ? ' Balik' : ''}`, group: 'pola', kind: 'slice', tags: ['slice', 'tebas'], duration: 0.6, easing: 'inOutExpo', params: { count: n, reverse: rev }, energy: 3 });
    }
  }
  for (const [k, l, p] of [
    ['pintu-h', 'Pintu Buka Horizontal', { dir: 'left' as const }],
    ['pintu-v', 'Pintu Buka Vertikal', { dir: 'up' as const }],
    ['pintu-h-tutup', 'Pintu Tutup Horizontal', { dir: 'left' as const, reverse: true }],
    ['pintu-v-tutup', 'Pintu Tutup Vertikal', { dir: 'up' as const, reverse: true }],
    ['belah-3', 'Belah Tiga', { dir: 'left' as const, count: 3 }],
    ['belah-3-v', 'Belah Tiga Vertikal', { dir: 'up' as const, count: 3 }],
  ] as const) {
    add({ id: `split-${k}`, name: l, group: 'pola', kind: 'split', tags: ['split', 'pintu'], duration: 0.65, easing: 'inOutCubic', params: p, energy: 2 });
  }

  for (const [k, l, i] of [
    ['rgb', 'Glitch RGB', 1],
    ['iris', 'Glitch Irisan', 2],
    ['blok', 'Glitch Blok', 3],
  ] as const) {
    for (const [ik, il, m] of [
      ['ringan', 'Ringan', 0.5],
      ['sedang', 'Sedang', 1],
      ['berat', 'Berat', 1.8],
    ] as const) {
      add({ id: `glitch-${k}-${ik}`, name: `${l} · ${il}`, group: 'efek', kind: 'glitch', tags: ['glitch', 'cyber'], duration: 0.45, easing: 'linear', params: { count: i, intensity: m }, energy: 3 });
    }
  }
  for (const [c, cl] of [
    ['white', 'Putih'],
    ['primary', 'Brand'],
    ['secondary', 'Aksen'],
  ] as const) {
    for (const [ik, il, i] of [
      ['kilat', 'Kilat', 0.6],
      ['blitz', 'Blitz', 1],
      ['bocor', 'Light Leak', 1.4],
    ] as const) {
      add({ id: `flash-${c}-${ik}`, name: `Kilatan ${cl} · ${il}`, group: 'efek', kind: 'flash', tags: ['flash', 'cahaya'], duration: 0.45 * i + 0.1, easing: 'inOutSine', params: { color: c, intensity: i }, energy: 3 });
    }
  }
  for (const [k, l, i] of [
    ['halus', 'Halus', 12],
    ['sedang', 'Sedang', 24],
    ['kasar', 'Kasar', 48],
  ] as const) {
    add({ id: `pixel-${k}`, name: `Piksel · ${l}`, group: 'efek', kind: 'pixelate', tags: ['pixel', 'retro', 'game'], duration: 0.6, easing: 'inOutSine', params: { intensity: i }, energy: 2 });
  }

  // Kaca pecah & pasir
  for (const [o, ol] of [
    ['center', 'Tengah'],
    ['tl', 'Kiri Atas'],
    ['tr', 'Kanan Atas'],
    ['bl', 'Kiri Bawah'],
    ['br', 'Kanan Bawah'],
  ] as const) {
    add({ id: `shatter-${o}`, name: `Kaca Pecah ${ol}`, group: 'hancur', kind: 'shatter', tags: ['kaca', 'pecah', 'shatter'], duration: 0.9, easing: 'inCubic', params: { origin: o, count: 7 }, energy: 3 });
    add({ id: `shatter-${o}-halus`, name: `Kaca Pecah Halus ${ol}`, group: 'hancur', kind: 'shatter', tags: ['kaca', 'pecah'], duration: 1, easing: 'inCubic', params: { origin: o, count: 11 }, energy: 3 });
  }
  for (const [d, dl] of DIR4) {
    add({ id: `sand-${d}`, name: `Jadi Pasir ke ${dl}`, group: 'hancur', kind: 'sand', tags: ['pasir', 'sand', 'thanos', 'debu'], duration: 1.1, easing: 'linear', params: { dir: d, count: 28 }, energy: 2 });
    add({ id: `sand-${d}-halus`, name: `Jadi Pasir Halus ke ${dl}`, group: 'hancur', kind: 'sand', tags: ['pasir', 'sand'], duration: 1.3, easing: 'linear', params: { dir: d, count: 40 }, energy: 2 });
  }

  // Variasi tambahan
  for (const [sk, sl, d] of [
    ['cepat', 'Cepat', 0.35],
    ['normal', 'Normal', 0.6],
    ['lambat', 'Lambat', 1],
  ] as const) {
    add({ id: `fade-secondary-${sk}`, name: `Pudar via Warna Aksen · ${sl}`, group: 'dasar', kind: 'fade', tags: ['fade'], duration: d, easing: 'inOutSine', params: { color: 'secondary' }, energy: 1 });
  }
  for (const n of [5, 10]) {
    for (const [ok, ol] of [
      ['random', 'Acak'],
      ['diagonal', 'Diagonal'],
      ['rows', 'Baris'],
    ] as const) {
      add({ id: `grid-${n}-${ok}`, name: `Ubin ${n}×${n} ${ol}`, group: 'pola', kind: 'grid', tags: ['grid', 'mosaic'], duration: 0.8, easing: 'outBack', params: { count: n, order: ok }, energy: 2 });
    }
  }
  for (const [dk, dl] of [
    ['h', 'Horizontal'],
    ['v', 'Vertikal'],
  ] as const) {
    for (const n of [20, 28]) {
      for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
        add({ id: `blinds-${dk}-${n}-${ek}`, name: `Kerai Rapat ${dl} ${n} · ${el}`, group: 'pola', kind: 'blinds', tags: ['blinds'], duration: 0.6, easing: e, params: { dir: dk === 'h' ? 'down' : 'right', count: n }, energy: 2 });
      }
    }
  }
  for (const [d, dl] of DIR4) add({ id: `stripes-${d}-12`, name: `Bilah Meluncur ${dl} 12`, group: 'pola', kind: 'stripes', tags: ['stripes'], duration: 0.75, easing: 'inOutQuart', params: { dir: d, count: 12 }, energy: 3 });
  for (const [d, dl] of DIR8.slice(4)) {
    add({ id: `whip-${d}`, name: `Whip Pan ${dl}`, group: 'geser', kind: 'whip', tags: ['whip'], duration: 0.4, easing: 'inOutQuart', params: { dir: d }, energy: 3 });
    add({ id: `card-${d}`, name: `Tumpuk Kartu ${dl}`, group: 'geser', kind: 'card', tags: ['card'], duration: 0.65, easing: 'outCubic', params: { dir: d }, energy: 2 });
  }
  for (const a of [105, 120, 135, 150, 165]) {
    for (const rev of [false, true]) {
      add({ id: `wipe-sudut-${a}${rev ? '-balik' : ''}`, name: `Sapu Miring ${a}°${rev ? ' Balik' : ''}`, group: 'sapu', kind: 'wipe', tags: ['wipe', 'diagonal'], duration: 0.6, easing: 'inOutCubic', params: { angle: a, reverse: rev, edge: 'soft' }, energy: 2 });
    }
  }
  for (const [d, dl] of [
    ['right', 'Searah Jarum'],
    ['left', 'Berlawanan'],
  ] as const) {
    add({ id: `spin-${d}`, name: `Putar ${dl}`, group: '3d', kind: 'spin', tags: ['spin', 'putar'], duration: 0.7, easing: 'inOutCubic', params: { dir: d }, energy: 3 });
    add({ id: `spin-${d}-zoom`, name: `Putar ${dl} + Zoom`, group: '3d', kind: 'spin', tags: ['spin', 'zoom'], duration: 0.75, easing: 'inOutExpo', params: { dir: d, intensity: 2 }, energy: 3 });
  }
  for (const [d, dl] of DIR4) {
    add({ id: `flip-${d}`, name: `Balik 3D ${dl}`, group: '3d', kind: 'flip', tags: ['flip', '3d'], duration: 0.7, easing: 'inOutCubic', params: { dir: d }, energy: 2 });
    add({ id: `cube-${d}`, name: `Kubus 3D ${dl}`, group: '3d', kind: 'cube', tags: ['cube', '3d'], duration: 0.7, easing: 'inOutCubic', params: { dir: d }, energy: 2 });
  }

  /* ================================================================ */
  /* Pack Ekstra v7 — 16 jenis render baru + variasi gerak             */
  /* Setiap variasi punya kombinasi parameter yang berbeda (tidak ada  */
  /* dua transisi dengan kind + params + easing + durasi yang sama).   */
  /* ================================================================ */
  const COL4: Array<[NonNullable<TransitionParams['color']>, string]> = [
    ['primary', 'Brand'],
    ['secondary', 'Aksen'],
    ['white', 'Putih'],
    ['black', 'Hitam'],
  ];
  const ORIG5: Array<[NonNullable<TransitionParams['origin']>, string]> = [
    ['center', 'Tengah'],
    ['tl', 'Kiri Atas'],
    ['tr', 'Kanan Atas'],
    ['bl', 'Kiri Bawah'],
    ['br', 'Kanan Bawah'],
  ];

  // Geser & Dorong dengan karakter gerak baru (pantul, kenyal, pegas, sentak)
  for (const [d, dl] of DIR8) {
    for (const [ek, el, e] of [
      ['pantul', 'Memantul', 'outBounce'],
      ['kenyal', 'Kenyal', 'outElastic'],
      ['pegas', 'Pegas', 'spring'],
      ['sentak', 'Sentak', 'snap'],
    ] as const) {
      add({ id: `slide-${d}-${ek}`, name: `Tutup dari ${dl} · ${el}`, group: 'geser', kind: 'slide', tags: ['slide', d, ek], duration: 0.7, easing: e, params: { dir: d }, energy: 3 });
      add({ id: `push-${d}-${ek}`, name: `Dorong ke ${dl} · ${el}`, group: 'geser', kind: 'push', tags: ['push', d, ek], duration: 0.7, easing: e, params: { dir: d }, energy: 3 });
    }
  }

  // 1. Gelombang — sapu dengan tepi sinus
  for (const [d, dl] of DIR4) {
    for (const n of [2, 3, 5, 8]) {
      for (const [ak, al, a] of [
        ['landai', 'Landai', 0.04],
        ['sedang', 'Sedang', 0.08],
        ['tinggi', 'Tinggi', 0.14],
      ] as const) {
        for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
          add({ id: `wave-${d}-${n}-${ak}-${ek}`, name: `Gelombang ${dl} ${n} Lekuk ${al} · ${el}`, group: 'sapu', kind: 'wave', tags: ['wave', 'gelombang', 'air', d], duration: 0.75, easing: e, params: { dir: d, count: n, intensity: a }, energy: 2 });
        }
      }
    }
  }

  // 2. Gerigi — sapu dengan tepi zigzag (+ garis warna opsional)
  for (const [d, dl] of DIR4) {
    for (const n of [4, 8, 14]) {
      for (const [ak, al, a] of [
        ['halus', 'Halus', 0.05],
        ['tajam', 'Tajam', 0.1],
      ] as const) {
        for (const [ck, cl] of [
          ['polos', ''],
          ['primary', ' + Garis Brand'],
        ] as const) {
          add({ id: `zigzag-${d}-${n}-${ak}-${ck}`, name: `Gerigi ${dl} ${n} ${al}${cl}`, group: 'sapu', kind: 'zigzag', tags: ['zigzag', 'gerigi', d], duration: 0.65, easing: 'inOutCubic', params: ck === 'polos' ? { dir: d, count: n, intensity: a } : { dir: d, count: n, intensity: a, color: ck }, energy: 2 });
        }
      }
    }
  }

  // 3. Titik Halftone — sel berbentuk yang tumbuh membuka scene baru
  for (const [s, sl] of [
    ['circle', 'Bulat'],
    ['diamond', 'Berlian'],
    ['square', 'Kotak'],
    ['star', 'Bintang'],
    ['hexagon', 'Heksagon'],
    ['heart', 'Hati'],
  ] as const) {
    for (const n of [6, 9, 12, 16]) {
      for (const [ok, ol] of [
        ['random', 'Acak'],
        ['diagonal', 'Diagonal'],
        ['rows', 'Baris'],
      ] as const) {
        add({ id: `dots-${s}-${n}-${ok}`, name: `Titik ${sl} ${n} ${ol}`, group: 'pola', kind: 'dots', tags: ['dots', 'halftone', 'titik', s], duration: 0.8, easing: 'outCubic', params: { shape: s, count: n, order: ok }, energy: 2 });
      }
    }
  }

  // 4. Cincin Konsentris
  for (const [o, ol] of ORIG5) {
    for (const n of [3, 5, 8, 12]) {
      for (const rev of [false, true]) {
        add({ id: `rings-${o}-${n}${rev ? '-luar' : ''}`, name: `Cincin ${n} ${ol}${rev ? ' dari Luar' : ''}`, group: 'bentuk', kind: 'rings', tags: ['rings', 'cincin', 'riak', 'lingkaran'], duration: 0.8, easing: 'inOutSine', params: { origin: o, count: n, reverse: rev }, energy: 2 });
      }
    }
  }

  // 5. Kipas — beberapa jarum menyapu bersamaan
  for (const [o, ol] of ORIG5) {
    for (const n of [2, 3, 4, 6, 8]) {
      for (const rev of [false, true]) {
        add({ id: `fan-${o}-${n}${rev ? '-balik' : ''}`, name: `Kipas ${n} Bilah ${ol}${rev ? ' Berlawanan' : ''}`, group: 'bentuk', kind: 'fan', tags: ['fan', 'kipas', 'radial', 'clock'], duration: 0.7, easing: 'inOutCubic', params: { origin: o, count: n, reverse: rev }, energy: 2 });
      }
    }
  }

  // 6. Papan Catur
  for (const n of [4, 6, 8, 12]) {
    for (const [mk, ml, dir] of [
      ['xy', 'Tumbuh', undefined],
      ['x', 'Lipat Horizontal', 'left'],
      ['y', 'Lipat Vertikal', 'up'],
    ] as const) {
      for (const [ok, ol] of [
        ['catur', 'Catur'],
        ['acak', 'Acak'],
      ] as const) {
        for (const [ek, el, e] of [
          ['halus', 'Halus', 'inOutCubic'],
          ['membal', 'Membal', 'outBack'],
        ] as const) {
          add({ id: `checker-${n}-${mk}-${ok}-${ek}`, name: `Papan ${ol} ${n} ${ml} · ${el}`, group: 'pola', kind: 'checker', tags: ['checker', 'catur', 'kotak'], duration: 0.8, easing: e, params: { count: n, ...(dir ? { dir } : {}), order: ok === 'acak' ? 'random' : 'diagonal' }, energy: 2 });
        }
      }
    }
  }

  // 7. Karusel — scene mengecil, bergeser seperti slide aplikasi
  for (const [d, dl] of DIR8) {
    for (const [sk, sl, s] of [
      ['dekat', 'Dekat', 0.85],
      ['jauh', 'Jauh', 0.7],
    ] as const) {
      for (const [ek, el, e] of EASE3) {
        add({ id: `carousel-${d}-${sk}-${ek}`, name: `Karusel ${dl} ${sl} · ${el}`, group: 'geser', kind: 'carousel', tags: ['carousel', 'karusel', 'slide', 'app'], duration: 0.8, easing: e, params: { dir: d, intensity: s }, energy: 2 });
      }
    }
  }

  // 8. Miring Geser — slide dengan skew dinamis
  for (const [d, dl] of DIR4) {
    for (const a of [10, 20, 35]) {
      for (const [ek, el, e] of EASE3) {
        add({ id: `tilt-${d}-${a}-${ek}`, name: `Geser Miring ${dl} ${a}° · ${el}`, group: 'geser', kind: 'tilt', tags: ['tilt', 'miring', 'skew', d], duration: 0.6, easing: e, params: { dir: d, angle: a }, energy: 3 });
      }
    }
  }

  // 9. Regang — scene meregang lalu scene baru kembali normal
  for (const [d, dl] of DIR4) {
    for (const [ik, il, i] of [
      ['ringan', 'Ringan', 1.6],
      ['sedang', 'Sedang', 3],
      ['ekstrem', 'Ekstrem', 6],
    ] as const) {
      for (const [ek, el, e] of [
        ['halus', 'Halus', 'inOutCubic'],
        ['tegas', 'Tegas', 'inOutExpo'],
      ] as const) {
        add({ id: `stretch-${d}-${ik}-${ek}`, name: `Regang ke ${dl} ${il} · ${el}`, group: 'efek', kind: 'stretch', tags: ['stretch', 'regang', 'elastis', d], duration: 0.55, easing: e, params: { dir: d, intensity: i }, energy: 3 });
      }
    }
  }

  // 10. Bilah Warna — balok warna menyapu lalu membuka
  for (const [d, dl] of DIR4) {
    for (const n of [1, 3, 5, 8]) {
      for (const [c, cl] of COL4) {
        add({ id: `colorbars-${d}-${n}-${c}`, name: `Balok ${cl} ${n} ke ${dl}`, group: 'sapu', kind: 'colorbars', tags: ['colorbars', 'balok', 'brand', d], duration: 0.85, easing: 'inOutQuart', params: { dir: d, count: n, color: c }, energy: 3 });
      }
    }
  }

  // 11. Pindai Cahaya — garis bercahaya membuka scene
  for (const [d, dl] of DIR4) {
    for (const [c, cl] of COL4) {
      for (const [wk, wl, w] of [
        ['tipis', 'Tipis', 1],
        ['tebal', 'Tebal', 3],
      ] as const) {
        add({ id: `scan-${d}-${c}-${wk}`, name: `Pindai ${cl} ${wl} ke ${dl}`, group: 'efek', kind: 'scan', tags: ['scan', 'pindai', 'laser', 'cahaya'], duration: 0.7, easing: 'inOutSine', params: { dir: d, color: c, intensity: w }, energy: 2 });
      }
    }
  }

  // 12. Kerai Diagonal
  for (const a of [30, 45, 60, 120, 135, 150]) {
    for (const n of [4, 8, 14]) {
      for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
        add({ id: `diagblinds-${a}-${n}-${ek}`, name: `Kerai Miring ${a}° ${n} · ${el}`, group: 'pola', kind: 'diagblinds', tags: ['blinds', 'kerai', 'diagonal'], duration: 0.65, easing: e, params: { angle: a, count: n }, energy: 2 });
      }
    }
  }

  // 13. Gulungan Film
  for (const [d, dl] of DIR4) {
    for (const [ek, el, e] of EASE3) {
      add({ id: `filmroll-${d}-${ek}`, name: `Gulungan Film ke ${dl} · ${el}`, group: 'geser', kind: 'filmroll', tags: ['film', 'sinema', 'retro', 'roll'], duration: 0.9, easing: e, params: { dir: d }, energy: 2 });
    }
  }

  // 14. Potongan Pie
  for (const n of [3, 4, 6, 8, 12]) {
    for (const [ok, ol, order, rev] of [
      ['urut', 'Searah', 'rows', false],
      ['balik', 'Berlawanan', 'rows', true],
      ['acak', 'Acak', 'random', false],
    ] as const) {
      for (const [ek, el, e] of [EASE3[0], EASE3[2]]) {
        add({ id: `pie-${n}-${ok}-${ek}`, name: `Potongan Pie ${n} ${ol} · ${el}`, group: 'bentuk', kind: 'pie', tags: ['pie', 'radial', 'potongan'], duration: 0.8, easing: e, params: { count: n, order, reverse: rev }, energy: 2 });
      }
    }
  }

  // 15. Ayun Pintu
  for (const [d, dl] of DIR4) {
    for (const [ek, el, e] of [
      ['halus', 'Halus', 'inOutCubic'],
      ['membal', 'Membal', 'outBack'],
      ['pantul', 'Memantul', 'outBounce'],
      ['kenyal', 'Kenyal', 'outElastic'],
      ['pegas', 'Pegas', 'spring'],
    ] as const) {
      add({ id: `swing-${d}-${ek}`, name: `Ayun Pintu dari ${dl} · ${el}`, group: '3d', kind: 'swing', tags: ['swing', 'ayun', 'pintu', '3d'], duration: 0.8, easing: e, params: { dir: d }, energy: 2 });
    }
  }

  // 16. Tirai Panggung
  for (const [ax, axl] of [
    ['left', 'Samping'],
    ['up', 'Atas-Bawah'],
  ] as const) {
    for (const [c, cl] of COL4) {
      for (const [fk, fl, f] of [
        ['polos', 'Polos', 0],
        ['lipit', 'Berlipit', 1],
      ] as const) {
        for (const [ek, el, e] of [EASE3[0], EASE3[1]]) {
          add({ id: `curtain-${ax}-${c}-${fk}-${ek}`, name: `Tirai ${axl} ${cl} ${fl} · ${el}`, group: 'sapu', kind: 'curtain', tags: ['curtain', 'tirai', 'panggung', 'reveal'], duration: 1, easing: e, params: { dir: ax, color: c, intensity: f }, energy: 2 });
        }
      }
    }
  }

  /* ================================================================ */
  /* Pack v8 — 12 jenis render baru                                    */
  /* ================================================================ */
  const DIR4L: Array<[NonNullable<TransitionParams['dir']>, string]> = DIR8.slice(0, 4);

  // Lampu Sorot
  for (const [d, dl] of DIR4L) {
    for (const n of [1, 2, 3]) {
      for (const [ek, el] of [
        ['hard', 'Tajam'],
        ['soft', 'Lembut'],
      ] as const) {
        for (const [rk, rl] of [
          ['polos', ''],
          ['white', ' + Cincin'],
        ] as const) {
          add({ id: `spotlight-${d}-${n}-${ek}-${rk}`, name: `Lampu Sorot ${n} dari ${dl} · ${el}${rl}`, group: 'bentuk', kind: 'spotlight', tags: ['spotlight', 'sorot', 'panggung', 'lampu'], duration: 1, easing: 'inOutCubic', params: { dir: d, count: n, edge: ek, ...(rk === 'white' ? { color: 'white' as const } : {}) }, energy: 2 });
        }
      }
    }
  }

  // Ubin Terbang
  for (const [d, dl] of DIR4L) {
    for (const n of [4, 6, 9]) {
      for (const [ok, ol] of [
        ['rows', 'Berurutan'],
        ['diagonal', 'Diagonal'],
        ['random', 'Acak'],
      ] as const) {
        for (const [ak, al, a, e] of [
          ['lurus', 'Lurus', 0, 'outBack'],
          ['putar', 'Berputar', 45, 'outCubic'],
        ] as const) {
          add({ id: `flytiles-${d}-${n}-${ok}-${ak}`, name: `Ubin Terbang ke ${dl} ${n} ${ol} · ${al}`, group: 'pola', kind: 'flytiles', tags: ['tiles', 'ubin', 'terbang', 'mosaic'], duration: 0.95, easing: e, params: { dir: d, count: n, order: ok, angle: a }, energy: 3 });
        }
      }
    }
  }

  // Sobek Kertas
  for (const [ax, axl] of [
    ['left', 'Tegak'],
    ['up', 'Mendatar'],
  ] as const) {
    for (const n of [8, 14, 24]) {
      for (const [ik, il, i] of [
        ['halus', 'Halus', 0.5],
        ['sedang', 'Sedang', 1],
        ['kasar', 'Kasar', 1.6],
      ] as const) {
        for (const [ck, cl] of [
          ['polos', ''],
          ['white', ' + Serat Putih'],
        ] as const) {
          add({ id: `tear-${ax}-${n}-${ik}-${ck}`, name: `Sobek Kertas ${axl} ${n} ${il}${cl}`, group: 'hancur', kind: 'tear', tags: ['tear', 'sobek', 'kertas', 'paper'], duration: 0.85, easing: 'inOutCubic', params: { dir: ax, count: n, intensity: i, ...(ck === 'white' ? { color: 'white' as const } : {}) }, energy: 3 });
        }
      }
    }
  }

  // Gulung Kertas
  for (const [d, dl] of DIR4L) {
    for (const [ik, il, i] of [
      ['tipis', 'Tipis', 0.04],
      ['tebal', 'Tebal', 0.08],
    ] as const) {
      for (const [ek, el, e] of [
        ['halus', 'Halus', 'inOutCubic'],
        ['cepat', 'Cepat', 'outCubic'],
        ['tegas', 'Tegas', 'inOutQuart'],
      ] as const) {
        add({ id: `roll-${d}-${ik}-${ek}`, name: `Gulung Kertas ke ${dl} ${il} · ${el}`, group: '3d', kind: 'roll', tags: ['roll', 'gulung', 'kertas', 'scroll'], duration: 0.85, easing: e, params: { dir: d, intensity: i }, energy: 2 });
      }
    }
  }

  // Kerai Putar 3D
  for (const [ax, axl] of [
    ['left', 'Tegak'],
    ['up', 'Mendatar'],
  ] as const) {
    for (const n of [4, 6, 10, 16]) {
      for (const [ok, ol, order, rev] of [
        ['urut', 'Berurutan', 'rows', false],
        ['balik', 'Terbalik', 'rows', true],
        ['tengah', 'dari Tengah', 'diagonal', false],
        ['acak', 'Acak', 'random', false],
      ] as const) {
        for (const [bk, bl] of [
          ['hitam', ''],
          ['primary', ' · Latar Brand'],
        ] as const) {
          add({ id: `slats-${ax}-${n}-${ok}-${bk}`, name: `Kerai Putar 3D ${axl} ${n} ${ol}${bl}`, group: '3d', kind: 'slats', tags: ['slats', 'kerai', '3d', 'putar'], duration: 0.9, easing: 'inOutSine', params: { dir: ax, count: n, order, reverse: rev, ...(bk === 'primary' ? { color: 'primary' as const } : {}) }, energy: 2 });
        }
      }
    }
  }

  // Lipat Sudut
  for (const [o, ol] of ORIG5.slice(1)) {
    for (const a of [-20, 0, 20]) {
      for (const [ck, cl] of [
        ['kertas', 'Kertas'],
        ['primary', 'Brand'],
      ] as const) {
        for (const [ek, el, e] of [
          ['halus', 'Halus', 'inOutCubic'],
          ['lembut', 'Lembut', 'inOutSine'],
        ] as const) {
          add({ id: `pagecurl-${o}-${a}-${ck}-${ek}`, name: `Lipat Sudut ${ol}${a ? ` ${a > 0 ? '+' : ''}${a}°` : ''} ${cl} · ${el}`, group: '3d', kind: 'pagecurl', tags: ['pagecurl', 'lipat', 'halaman', 'buku'], duration: 0.9, easing: e, params: { origin: o, angle: a, ...(ck === 'primary' ? { color: 'primary' as const } : {}) }, energy: 2 });
        }
      }
    }
  }

  // Ubin Mengecil / Berputar / Jatuh
  for (const n of [4, 6, 8, 12]) {
    for (const [ok, ol] of [
      ['rows', 'Berurutan'],
      ['diagonal', 'Diagonal'],
      ['random', 'Acak'],
    ] as const) {
      for (const [mk, ml, e] of [
        ['shrink', 'Mengecil', 'inOutCubic'],
        ['spin', 'Berputar', 'inOutCubic'],
        ['fall', 'Berjatuhan', 'inCubic'],
      ] as const) {
        add({ id: `tilesout-${n}-${ok}-${mk}`, name: `Ubin ${ml} ${n} ${ol}`, group: 'hancur', kind: 'tilesout', tags: ['tiles', 'ubin', 'hancur', mk], duration: 0.9, easing: e, params: { count: n, order: ok, mode: mk }, energy: 3 });
      }
    }
  }

  // Lensa Zoom
  for (const [o, ol] of ORIG5) {
    for (const [mk, ml, m] of [
      ['ringan', 'Ringan', 1.4],
      ['kuat', 'Kuat', 2.2],
    ] as const) {
      for (const [ck, cl] of [
        ['polos', ''],
        ['white', ' + Cincin Putih'],
        ['primary', ' + Cincin Brand'],
      ] as const) {
        add({ id: `lens-${o}-${mk}-${ck}`, name: `Lensa Zoom ${ol} ${ml}${cl}`, group: 'zoom', kind: 'lens', tags: ['lens', 'lensa', 'zoom', 'kaca pembesar'], duration: 0.8, easing: 'inOutCubic', params: { origin: o, intensity: m, ...(ck !== 'polos' ? { color: ck } : {}) }, energy: 2 });
      }
    }
  }

  // Sapuan Kuas
  for (const [ax, axl] of [
    ['left', 'Mendatar'],
    ['up', 'Tegak'],
  ] as const) {
    for (const n of [3, 4, 6, 8]) {
      for (const a of [0, 12]) {
        for (const [ek, el, e] of [
          ['halus', 'Halus', 'inOutCubic'],
          ['cepat', 'Cepat', 'outCubic'],
        ] as const) {
          add({ id: `brush-${ax}-${n}-${a}-${ek}`, name: `Sapuan Kuas ${axl} ${n}${a ? ' Miring' : ''} · ${el}`, group: 'sapu', kind: 'brush', tags: ['brush', 'kuas', 'cat', 'paint'], duration: 1, easing: e, params: { dir: ax, count: n, angle: a }, energy: 2 });
        }
      }
    }
  }

  // Leleh
  for (const [d, dl] of DIR4L) {
    for (const n of [12, 24, 48]) {
      for (const [sk, sl, s] of [
        ['rata', 'Rata', 0.3],
        ['acak', 'Acak', 0.9],
      ] as const) {
        for (const [ek, el, e] of [
          ['pelan', 'Pelan', 'inCubic'],
          ['tajam', 'Tajam', 'inExpo'],
        ] as const) {
          add({ id: `melt-${d}-${n}-${sk}-${ek}`, name: `Leleh ke ${dl} ${n} ${sl} · ${el}`, group: 'hancur', kind: 'melt', tags: ['melt', 'leleh', 'drip', 'cair'], duration: 1, easing: e, params: { dir: d, count: n, intensity: s }, energy: 2 });
        }
      }
    }
  }

  // Gelembung Acak
  for (const [s, sl] of [
    ['circle', 'Bulat'],
    ['hexagon', 'Heksagon'],
    ['star', 'Bintang'],
    ['heart', 'Hati'],
  ] as const) {
    for (const n of [8, 16, 28, 45]) {
      for (const [ck, cl] of [
        ['polos', ''],
        ['white', ' + Garis Putih'],
        ['primary', ' + Garis Brand'],
      ] as const) {
        add({ id: `bubbles-${s}-${n}-${ck}`, name: `Gelembung ${sl} ${n}${cl}`, group: 'bentuk', kind: 'bubbles', tags: ['bubbles', 'gelembung', 'acak', s], duration: 0.9, easing: 'inOutSine', params: { shape: s, count: n, ...(ck !== 'polos' ? { color: ck } : {}) }, energy: 2 });
      }
    }
  }

  // Lempar Foto
  for (const [d, dl] of DIR8) {
    for (const a of [15, 40]) {
      for (const [mk, ml] of [
        ['polos', ''],
        ['foto', ' Berbingkai'],
      ] as const) {
        for (const [ek, el, e] of [
          ['cepat', 'Cepat', 'inCubic'],
          ['ayun', 'Ayun', 'inOutBack'],
        ] as const) {
          add({ id: `toss-${d}-${a}-${mk}-${ek}`, name: `Lempar Foto ke ${dl}${ml} ${a}° · ${el}`, group: 'geser', kind: 'toss', tags: ['toss', 'lempar', 'foto', 'polaroid'], duration: 0.8, easing: e, params: { dir: d, angle: a, ...(mk === 'foto' ? { mode: 'foto' } : {}) }, energy: 3 });
        }
      }
    }
  }

  return L;
}

const LIB = buildLibrary();
const BY_ID = new Map(LIB.map((t) => [t.id, t]));

/* Varian aksen (`<id>~<aksen>`) dibuat saat dibutuhkan agar pack tetap ringan dimuat. */
const fxAllowed = (t: TransitionSpec, fx: string) =>
  t.author === 'builtin' && t.kind !== 'cut' && !((fx === 'kilat' || fx === 'warna') && t.kind === 'flash') && !(fx === 'getar' && t.kind === 'shake') && !(fx === 'zoom' && (t.kind === 'zoom' || t.kind === 'dolly'));
const ACCENTS = new Map<string, TransitionSpec>();
function accentOf(id: string): TransitionSpec | undefined {
  const hit = ACCENTS.get(id);
  if (hit) return hit;
  const i = id.lastIndexOf('~');
  if (i < 0) return undefined;
  const base = BY_ID.get(id.slice(0, i));
  const fx = TRANSITION_FX.find((f) => f.id === id.slice(i + 1));
  if (!base || !fx || !fxAllowed(base, fx.id)) return undefined;
  const v: TransitionSpec = { ...base, id, name: `${base.name} + ${fx.label}`, tags: [...base.tags, fx.tag], params: { ...base.params, fx: fx.id }, energy: 3 };
  ACCENTS.set(id, v);
  return v;
}
let FULL: TransitionSpec[] | null = null;
/** Semua transisi termasuk varian aksen (dibuat sekali saat pertama dipanggil). */
export function allTransitions(): TransitionSpec[] {
  if (!FULL) {
    FULL = [...LIB];
    for (const fx of TRANSITION_FX) for (const t of LIB) if (fxAllowed(t, fx.id)) FULL.push(accentOf(`${t.id}~${fx.id}`)!);
  }
  return FULL;
}
/** Jumlah semua transisi (tanpa membuat daftar lengkap). */
export function transitionCount(): number {
  if (FULL) return FULL.length;
  let n = LIB.length;
  for (const fx of TRANSITION_FX) for (const t of LIB) if (fxAllowed(t, fx.id)) n++;
  return n;
}
export function getTransition(id?: string): TransitionSpec {
  return (id && (BY_ID.get(id) || accentOf(id))) || BY_ID.get('fade-none-normal')!;
}
export function hasTransition(id: string) {
  return BY_ID.has(id) || !!accentOf(id);
}
export function registerTransition(spec: TransitionSpec) {
  const idx = LIB.findIndex((t) => t.id === spec.id);
  if (idx >= 0) LIB[idx] = spec;
  else LIB.push(spec);
  BY_ID.set(spec.id, spec);
  FULL = null;
}
export function unregisterTransition(id: string) {
  const idx = LIB.findIndex((t) => t.id === id);
  if (idx >= 0) LIB.splice(idx, 1);
  BY_ID.delete(id);
  FULL = null;
}

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */
type Src = CanvasImageSource;

export interface TransitionColors {
  primary: string;
  secondary: string;
}

function dirVec(dir: TransitionParams['dir']): [number, number] {
  switch (dir) {
    case 'right':
      return [1, 0];
    case 'up':
      return [0, -1];
    case 'down':
      return [0, 1];
    case 'up-left':
      return [-0.7071, -0.7071];
    case 'up-right':
      return [0.7071, -0.7071];
    case 'down-left':
      return [-0.7071, 0.7071];
    case 'down-right':
      return [0.7071, 0.7071];
    default:
      return [-1, 0];
  }
}

/** Arah dengan komponen penuh (-1/0/1): untuk diagonal, scene digeser selebar & setinggi layar. */
function dirFull(dir: TransitionParams['dir']): [number, number] {
  const [x, y] = dirVec(dir);
  return [Math.sign(Math.round(x * 100)), Math.sign(Math.round(y * 100))];
}

function originPt(o: TransitionParams['origin'], W: number, H: number): [number, number] {
  switch (o) {
    case 'tl':
      return [0, 0];
    case 'tr':
      return [W, 0];
    case 'bl':
      return [0, H];
    case 'br':
      return [W, H];
    default:
      return [W / 2, H / 2];
  }
}

function colorOf(c: TransitionParams['color'], cols: TransitionColors): string {
  if (c === 'white') return '#FFFFFF';
  if (c === 'black') return '#000000';
  if (c === 'secondary') return cols.secondary;
  return cols.primary;
}

function shapePath(ctx: CanvasRenderingContext2D, shape: TransitionParams['shape'], cx: number, cy: number, r: number, rot = 0, fresh = true) {
  if (fresh) ctx.beginPath();
  const poly = (n: number, inner?: number) => {
    const steps = inner ? n * 2 : n;
    for (let i = 0; i < steps; i++) {
      const a = rot + (i / steps) * Math.PI * 2 - Math.PI / 2;
      const rr = inner && i % 2 ? r * inner : r;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  };
  switch (shape) {
    case 'diamond':
      poly(4);
      break;
    case 'square':
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.rect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
      ctx.restore();
      break;
    case 'star':
      poly(5, 0.48);
      break;
    case 'hexagon':
      poly(6);
      break;
    case 'triangle':
      poly(3);
      break;
    case 'heart': {
      const s = r / 16;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.moveTo(0, 5 * s);
      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3) * s;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
        ctx.lineTo(x, y);
      }
      ctx.restore();
      ctx.closePath();
      break;
    }
    default:
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
}

function drawFull(ctx: CanvasRenderingContext2D, src: Src, W: number, H: number) {
  ctx.drawImage(src, 0, 0, W, H);
}

function drawTransformed(ctx: CanvasRenderingContext2D, src: Src, W: number, H: number, x: number, y: number, s = 1, rot = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(W / 2 + x, H / 2 + y);
  if (rot) ctx.rotate(rot);
  if (s !== 1) ctx.scale(s, s);
  ctx.drawImage(src, -W / 2, -H / 2, W, H);
  ctx.restore();
}

/**
 * Menggambar transisi. `A` = scene lama, `B` = scene baru (keduanya kanvas berukuran W×H).
 * `p` = progres linear 0..1.
 */
export function drawTransition(
  ctx: CanvasRenderingContext2D,
  spec: TransitionSpec,
  rawP: number,
  A: Src,
  B: Src,
  W: number,
  H: number,
  cols: TransitionColors,
  allowBlur = true
) {
  const p = clamp(rawP);
  const e = ease(spec.easing, p);
  const P = spec.params;
  const diag = Math.hypot(W, H);
  ctx.save();
  const fx = P.fx;
  const bump = Math.sin(Math.PI * p);
  if (fx === 'zoom' && bump > 0) {
    const zs = 1 + 0.14 * bump;
    ctx.translate(W / 2, H / 2);
    ctx.scale(zs, zs);
    ctx.translate(-W / 2, -H / 2);
  } else if (fx === 'getar' && bump > 0) {
    const amp = 0.022 * Math.min(W, H) * bump;
    const f = Math.floor(p * 36);
    const zs = 1 + 0.05 * bump;
    ctx.translate(W / 2 + (hash01(f, 3) - 0.5) * 2 * amp, H / 2 + (hash01(f, 9) - 0.5) * 2 * amp);
    ctx.scale(zs, zs);
    ctx.translate(-W / 2, -H / 2);
  }
  ctx.save();
  switch (spec.kind) {
    case 'cut':
      drawFull(ctx, p < 0.5 ? A : B, W, H);
      break;

    case 'fade': {
      if (!P.color) {
        drawFull(ctx, A, W, H);
        ctx.globalAlpha = e;
        drawFull(ctx, B, W, H);
      } else {
        const c = colorOf(P.color, cols);
        drawFull(ctx, p < 0.5 ? A : B, W, H);
        ctx.globalAlpha = 1 - Math.abs(p - 0.5) * 2;
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, W, H);
      }
      break;
    }

    case 'blur': {
      const b = (P.intensity || 16) * Math.sin(p * Math.PI);
      if (allowBlur) ctx.filter = `blur(${b * (W / 1080)}px)`;
      drawFull(ctx, A, W, H);
      ctx.globalAlpha = e;
      drawFull(ctx, B, W, H);
      ctx.filter = 'none';
      break;
    }

    case 'slide': {
      const [dx, dy] = dirFull(P.dir);
      drawFull(ctx, A, W, H);
      ctx.shadowColor = `rgba(0,0,0,${(0.45 * clamp(p * 4)).toFixed(3)})`;
      ctx.shadowBlur = 40;
      drawTransformed(ctx, B, W, H, -dx * W * (1 - e), -dy * H * (1 - e));
      break;
    }

    case 'push': {
      const [dx, dy] = dirFull(P.dir);
      drawTransformed(ctx, A, W, H, dx * W * e, dy * H * e);
      drawTransformed(ctx, B, W, H, -dx * W * (1 - e), -dy * H * (1 - e));
      break;
    }

    case 'card': {
      const [dx, dy] = dirFull(P.dir);
      drawTransformed(ctx, A, W, H, 0, 0, 1 - 0.12 * e, 0, 1 - 0.5 * e);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 50;
      ctx.beginPath();
      const ox = -dx * W * (1 - e);
      const oy = -dy * H * (1 - e);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.roundRect(0, 0, W, H, 40 * (1 - e) * (W / 1080));
      ctx.clip();
      drawFull(ctx, B, W, H);
      ctx.restore();
      break;
    }

    case 'whip': {
      const [dx, dy] = dirVec(P.dir);
      const k = P.intensity || 1;
      const src = p < 0.5 ? A : B;
      const off = p < 0.5 ? e : e - 1;
      const samples = allowBlur ? 5 : 3;
      for (let i = 0; i < samples; i++) {
        const t = off + (i / samples) * 0.12 * k * Math.sin(p * Math.PI);
        ctx.globalAlpha = i === 0 ? 1 : 0.35;
        drawTransformed(ctx, src, W, H, dx * W * t, dy * H * t);
      }
      break;
    }

    case 'wipe': {
      drawFull(ctx, A, W, H);
      const ang = P.angle !== undefined ? (P.angle * Math.PI) / 180 : (() => {
        const [dx, dy] = dirVec(P.dir);
        return Math.atan2(-dy, -dx);
      })();
      const reverse = P.reverse ? -1 : 1;
      const ux = Math.cos(ang) * reverse;
      const uy = Math.sin(ang) * reverse;
      const soft = P.edge === 'soft' ? 0.18 : P.edge === 'glow' ? 0.06 : 0;
      const reach = (Math.abs(ux) * W + Math.abs(uy) * H) / 2;
      const pos = -reach - soft * diag + (2 * reach + 2 * soft * diag) * e;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(Math.atan2(uy, ux));
      ctx.beginPath();
      ctx.rect(-diag, -diag, diag + pos, diag * 2);
      ctx.restore();
      ctx.save();
      ctx.clip();
      drawFull(ctx, B, W, H);
      ctx.restore();
      if (soft || P.edge === 'glow') {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.atan2(uy, ux));
        const g = ctx.createLinearGradient(pos - soft * diag, 0, pos + 2, 0);
        const c = P.edge === 'glow' ? cols.primary : 'rgba(0,0,0,0)';
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, P.edge === 'glow' ? c : 'rgba(0,0,0,0.25)');
        ctx.fillStyle = g;
        ctx.globalCompositeOperation = P.edge === 'glow' ? 'lighter' : 'source-over';
        ctx.fillRect(pos - Math.max(soft, 0.04) * diag, -diag, Math.max(soft, 0.04) * diag, diag * 2);
        ctx.restore();
      }
      break;
    }

    case 'colorwipe': {
      const [dx, dy] = dirVec(P.dir);
      const c = colorOf(P.color, cols);
      const c2 = P.color === 'primary' ? cols.secondary : cols.primary;
      drawFull(ctx, p < 0.5 ? A : B, W, H);
      const span = Math.abs(dx) * W + Math.abs(dy) * H || W;
      const band = (t: number, col: string) => {
        const head = clamp(t * 2);
        const tail = clamp(t * 2 - 1);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.atan2(-dy, -dx));
        ctx.fillStyle = col;
        const a = -span / 2 - 40 + (span + 80) * ease('inOutQuart', tail);
        const b = -span / 2 - 40 + (span + 80) * ease('inOutQuart', head);
        ctx.fillRect(a, -diag, b - a, diag * 2);
        ctx.restore();
      };
      band(clamp(p * 1.12), c2);
      band(clamp(p * 1.12 - 0.12), c);
      break;
    }

    case 'iris': {
      const [ox, oy] = originPt(P.origin, W, H);
      const maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
      if (P.reverse) {
        drawFull(ctx, B, W, H);
        ctx.beginPath();
        ctx.arc(ox, oy, maxR * (1 - e), 0, Math.PI * 2);
        ctx.clip();
        drawFull(ctx, A, W, H);
      } else {
        drawFull(ctx, A, W, H);
        ctx.beginPath();
        ctx.arc(ox, oy, Math.max(0.1, maxR * e), 0, Math.PI * 2);
        ctx.clip();
        drawFull(ctx, B, W, H);
      }
      break;
    }

    case 'shape': {
      drawFull(ctx, A, W, H);
      const r = diag * 1.1 * e;
      shapePath(ctx, P.shape, W / 2, H / 2, Math.max(0.1, r), ((P.angle || 0) * Math.PI * (1 - e)) / 180);
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'clock': {
      const [ox, oy] = originPt(P.origin, W, H);
      drawFull(ctx, A, W, H);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, diag * 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e);
      ctx.closePath();
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'burst': {
      drawFull(ctx, A, W, H);
      const n = P.count || 8;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const w = ((Math.PI * 2) / n) * e;
        ctx.moveTo(W / 2, H / 2);
        ctx.arc(W / 2, H / 2, diag, a0 - w / 2, a0 + w / 2);
        ctx.closePath();
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'ink': {
      drawFull(ctx, A, W, H);
      const n = P.count || 6;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const cx = hash01(i, 3) * W;
        const cy = hash01(i, 7) * H;
        const delay = hash01(i, 11) * 0.35;
        const t = clamp((p - delay) / (1 - delay));
        const r = diag * 0.7 * ease('inOutSine', t);
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'zoom': {
      const k = P.intensity || 1;
      const rot = ((P.angle || 0) * Math.PI) / 180;
      const blurOn = allowBlur && k > 0.9;
      const px = W / 1080;
      if (!P.reverse) {
        // zoom menembus: A membesar, B datang dari besar lalu mengendap (tanpa tepi hitam)
        if (p < 0.5) {
          const t = ease('inCubic', p * 2);
          if (blurOn) ctx.filter = `blur(${t * 10 * k * px}px)`;
          drawTransformed(ctx, A, W, H, 0, 0, 1 + t * k, rot * t);
        } else {
          const t = ease('outCubic', (p - 0.5) * 2);
          if (blurOn) ctx.filter = `blur(${(1 - t) * 10 * k * px}px)`;
          drawTransformed(ctx, B, W, H, 0, 0, 1 + (1 - t) * k * 0.6, -rot * (1 - t));
        }
      } else {
        // zoom keluar: A mengecil di atas B yang redup, lalu B mengendap
        if (p < 0.5) {
          const t = ease('inCubic', p * 2);
          drawTransformed(ctx, B, W, H, 0, 0, 1 + 0.25 * Math.min(1, k), 0);
          ctx.fillStyle = `rgba(0,0,0,${0.55 * (1 - t * 0.6)})`;
          ctx.fillRect(0, 0, W, H);
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 40 * px;
          drawTransformed(ctx, A, W, H, 0, 0, 1 - t * 0.55 * Math.min(1.4, k), rot * t, 1 - t * 0.9);
          ctx.shadowColor = 'transparent';
        } else {
          const t = ease('outCubic', (p - 0.5) * 2);
          drawTransformed(ctx, B, W, H, 0, 0, 1 + 0.25 * Math.min(1, k) * (1 - t), 0);
          ctx.fillStyle = `rgba(0,0,0,${0.22 * (1 - t)})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
      ctx.filter = 'none';
      break;
    }

    case 'dolly': {
      const k = P.intensity || 1;
      drawTransformed(ctx, A, W, H, 0, 0, 1 + 0.35 * k * e, 0, 1);
      drawTransformed(ctx, B, W, H, 0, 0, 1.35 - 0.35 * e, 0, e);
      break;
    }

    case 'shake': {
      const k = (P.intensity || 1) * 40 * (1 - p) * (W / 1080);
      const src = p < 0.35 ? A : B;
      drawTransformed(ctx, src, W, H, Math.sin(p * 60) * k, Math.cos(p * 47) * k, 1.06, Math.sin(p * 30) * 0.02 * (P.intensity || 1));
      if (p > 0.3 && p < 0.42) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0, 0, W, H);
      }
      break;
    }

    case 'blinds': {
      drawFull(ctx, A, W, H);
      const n = P.count || 6;
      const horizontal = P.dir === 'down' || P.dir === 'up';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const local = clamp(e * 1.3 - (i / n) * 0.3);
        if (local <= 0) continue;
        if (horizontal) {
          const bh = H / n;
          ctx.rect(0, i * bh, W, bh * local + 0.5);
        } else {
          const bw = W / n;
          ctx.rect(i * bw, 0, bw * local + 0.5, H);
        }
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'grid': {
      drawFull(ctx, A, W, H);
      const n = P.count || 4;
      const rows = Math.round(n * (H / W)) || n;
      const cw = W / n;
      const ch = H / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < n; c++) {
          const idx = r * n + c;
          const delay =
            P.order === 'diagonal' ? ((r + c) / (rows + n)) * 0.6 : P.order === 'rows' ? (r / rows) * 0.6 : hash01(idx, 5) * 0.6;
          const t = ease(spec.easing, clamp((p - delay) / 0.4));
          if (t <= 0) continue;
          ctx.save();
          ctx.translate(c * cw + cw / 2, r * ch + ch / 2);
          ctx.scale(t, t);
          ctx.beginPath();
          ctx.rect(-cw / 2 - 0.5, -ch / 2 - 0.5, cw + 1, ch + 1);
          ctx.clip();
          ctx.drawImage(B, -(c * cw + cw / 2), -(r * ch + ch / 2), W, H);
          ctx.restore();
        }
      }
      break;
    }

    case 'stripes': {
      const n = P.count || 5;
      const [dx, dy] = dirVec(P.dir);
      drawFull(ctx, A, W, H);
      const horiz = dx !== 0;
      for (let i = 0; i < n; i++) {
        const delay = (i / n) * 0.35;
        const t = ease(spec.easing, clamp((p - delay) / 0.65));
        ctx.save();
        ctx.beginPath();
        if (horiz) ctx.rect(0, (i * H) / n, W, H / n + 1);
        else ctx.rect((i * W) / n, 0, W / n + 1, H);
        ctx.clip();
        ctx.drawImage(B, -dx * W * (1 - t), -dy * H * (1 - t), W, H);
        ctx.restore();
      }
      break;
    }

    case 'slice': {
      const n = P.count || 3;
      drawFull(ctx, A, W, H);
      for (let i = 0; i < n; i++) {
        const delay = (i / n) * 0.3;
        const t = ease(spec.easing, clamp((p - delay) / 0.7));
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(((P.reverse ? -1 : 1) * Math.PI) / 5);
        const bandW = (diag * 1.2) / n;
        const x0 = -diag * 0.6 + i * bandW;
        ctx.beginPath();
        ctx.rect(x0, -diag, bandW + 1, diag * 2);
        ctx.rotate(-((P.reverse ? -1 : 1) * Math.PI) / 5);
        ctx.clip();
        const off = (i % 2 ? 1 : -1) * H * (1 - t);
        ctx.drawImage(B, -W / 2, -H / 2 + off, W, H);
        ctx.restore();
      }
      break;
    }

    case 'split': {
      const n = P.count || 2;
      const vertical = P.dir === 'up' || P.dir === 'down';
      if (!P.reverse) {
        drawFull(ctx, B, W, H);
        for (let i = 0; i < n; i++) {
          ctx.save();
          const segs = vertical ? H / n : W / n;
          const dirSign = n === 2 ? (i === 0 ? -1 : 1) : i % 2 ? 1 : -1;
          const off = dirSign * (vertical ? H : W) * e * (n === 2 ? 0.5 : 1);
          // area potongan ikut bergeser bersama daun pintu agar scene lama benar-benar keluar
          ctx.beginPath();
          if (vertical) ctx.rect(0, i * segs + off, W, segs + 1);
          else ctx.rect(i * segs + off, 0, segs + 1, H);
          ctx.clip();
          ctx.drawImage(A, vertical ? 0 : off, vertical ? off : 0, W, H);
          ctx.restore();
        }
      } else {
        drawFull(ctx, A, W, H);
        for (let i = 0; i < n; i++) {
          ctx.save();
          const segs = vertical ? H / n : W / n;
          const dirSign = n === 2 ? (i === 0 ? -1 : 1) : i % 2 ? 1 : -1;
          const off = dirSign * (vertical ? H : W) * (1 - e) * (n === 2 ? 0.5 : 1);
          ctx.beginPath();
          if (vertical) ctx.rect(0, i * segs + off, W, segs + 1);
          else ctx.rect(i * segs + off, 0, segs + 1, H);
          ctx.clip();
          ctx.drawImage(B, vertical ? 0 : off, vertical ? off : 0, W, H);
          ctx.restore();
        }
      }
      break;
    }

    case 'glitch': {
      const k = P.intensity || 1;
      const src = p < 0.5 ? A : B;
      drawFull(ctx, src, W, H);
      const amt = Math.sin(p * Math.PI) * k;
      if (amt < 0.001) break;
      const strips = 6 + Math.floor(amt * 10);
      for (let i = 0; i < strips; i++) {
        const y = hash01(i, Math.floor(p * 12)) * H;
        const h = (0.02 + hash01(i, 9) * 0.08) * H * (P.count === 3 ? 2 : 1);
        const off = (hash01(i, Math.floor(p * 20) + 3) - 0.5) * W * 0.2 * amt;
        ctx.drawImage(hash01(i, 2) > 0.5 ? B : A, 0, y, W, h, off, y, W, h);
      }
      if (P.count !== 2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * amt;
        drawTransformed(ctx, src, W, H, 14 * amt * (W / 1080), 0);
        ctx.globalAlpha = 0.25 * amt;
        drawTransformed(ctx, src, W, H, -14 * amt * (W / 1080), 0);
      }
      break;
    }

    case 'flash': {
      drawFull(ctx, p < 0.5 ? A : B, W, H);
      const c = colorOf(P.color, cols);
      const peak = 1 - Math.abs(p - 0.5) * 2;
      ctx.globalAlpha = Math.pow(peak, 0.6);
      if ((P.intensity || 1) > 1.2) {
        const g = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, diag);
        g.addColorStop(0, c);
        g.addColorStop(0.6, 'rgba(255,255,255,0.4)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.globalCompositeOperation = 'lighter';
      } else ctx.fillStyle = c;
      ctx.fillRect(0, 0, W, H);
      break;
    }

    case 'pixelate': {
      const src = p < 0.5 ? A : B;
      const amt = Math.sin(p * Math.PI);
      const size = Math.max(1, (P.intensity || 24) * amt * (W / 1080));
      if (size <= 1.2) {
        drawFull(ctx, src, W, H);
        break;
      }
      const sw = Math.max(2, Math.floor(W / size));
      const sh = Math.max(2, Math.floor(H / size));
      const tmp = getScratch(sw, sh);
      const tctx = tmp.getContext('2d')!;
      tctx.imageSmoothingEnabled = true;
      tctx.clearRect(0, 0, sw, sh);
      tctx.drawImage(src, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      break;
    }

    case 'spin': {
      const sign = P.dir === 'left' ? -1 : 1;
      const k = P.intensity || 1;
      const src = p < 0.5 ? A : B;
      const t = p < 0.5 ? ease('inCubic', p * 2) : -(1 - ease('outCubic', (p - 0.5) * 2));
      // putar sambil memperbesar cukup agar sudut kanvas selalu tertutup
      const ang = sign * t * Math.PI * 0.5;
      const cover = Math.abs(Math.cos(ang)) + Math.abs(Math.sin(ang)) * Math.max(W / H, H / W);
      drawTransformed(ctx, src, W, H, 0, 0, Math.max(cover, 1 + Math.abs(t) * 0.4 * k), ang);
      break;
    }

    case 'flip': {
      const vertical = P.dir === 'up' || P.dir === 'down';
      const src = p < 0.5 ? A : B;
      const s = Math.abs(Math.cos(e * Math.PI));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2);
      ctx.scale(vertical ? 1 : Math.max(0.001, s), vertical ? Math.max(0.001, s) : 1);
      ctx.drawImage(src, -W / 2, -H / 2, W, H);
      ctx.fillStyle = `rgba(0,0,0,${(1 - s) * 0.5})`;
      ctx.fillRect(-W / 2, -H / 2, W, H);
      break;
    }

    case 'cube': {
      const [dx, dy] = dirVec(P.dir);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (dx !== 0) {
        const wa = W * (1 - e);
        const wb = W * e;
        const leftFirst = dx < 0;
        ctx.globalAlpha = 1 - e * 0.4;
        ctx.drawImage(A, leftFirst ? 0 : wb, 0, wa, H);
        ctx.globalAlpha = 0.6 + e * 0.4;
        ctx.drawImage(B, leftFirst ? wa : 0, 0, wb, H);
      } else {
        const ha = H * (1 - e);
        const hb = H * e;
        const topFirst = dy < 0;
        ctx.globalAlpha = 1 - e * 0.4;
        ctx.drawImage(A, 0, topFirst ? 0 : hb, W, ha);
        ctx.globalAlpha = 0.6 + e * 0.4;
        ctx.drawImage(B, 0, topFirst ? ha : 0, W, hb);
      }
      break;
    }

    case 'shatter': {
      // B di belakang; A terbelah jadi pecahan segitiga yang terlempar & jatuh
      if (p <= 0.0001) {
        drawFull(ctx, A, W, H);
        break;
      }
      drawFull(ctx, B, W, H);
      const [ox, oy] = originPt(P.origin, W, H);
      const n = P.count || 7;
      const cols = n;
      const rows = Math.round(n * (H / W));
      const cw = W / cols;
      const ch = H / rows;
      const crack = clamp(p / 0.18);
      const fly = clamp((p - 0.18) / 0.82);
      const pt = (c: number, r: number): [number, number] => {
        const jx = c > 0 && c < cols ? (hash01(c * 31 + r, 1) - 0.5) * cw * 0.7 : 0;
        const jy = r > 0 && r < rows ? (hash01(c * 17 + r, 2) - 0.5) * ch * 0.7 : 0;
        return [c * cw + jx, r * ch + jy];
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = pt(c, r);
          const b = pt(c + 1, r);
          const d = pt(c, r + 1);
          const e = pt(c + 1, r + 1);
          const tris: Array<Array<[number, number]>> = (c + r) % 2 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
          tris.forEach((tri, ti) => {
            const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
            const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
            const dx = cx - ox;
            const dy = cy - oy;
            const dist = Math.hypot(dx, dy) / Math.hypot(W, H);
            const delay = dist * 0.28;
            const f = ease('inCubic', clamp((fly - delay) / (1 - delay)));
            const id = (r * cols + c) * 2 + ti;
            const sp = 0.6 + hash01(id, 3);
            const tx = (dx / (Math.hypot(dx, dy) || 1)) * W * 0.35 * sp * f;
            const ty = (dy / (Math.hypot(dx, dy) || 1)) * H * 0.15 * sp * f + H * 1.8 * f * f;
            const rot = (hash01(id, 4) - 0.5) * 6 * f;
            if (ty > H * 1.5) return;
            ctx.save();
            ctx.globalAlpha = 1 - f * 0.3;
            ctx.translate(cx + tx, cy + ty);
            ctx.rotate(rot);
            ctx.scale(1 - f * 0.25, 1 - f * 0.25);
            ctx.translate(-cx, -cy);
            ctx.beginPath();
            ctx.moveTo(tri[0][0], tri[0][1]);
            ctx.lineTo(tri[1][0], tri[1][1]);
            ctx.lineTo(tri[2][0], tri[2][1]);
            ctx.closePath();
            ctx.save();
            ctx.clip();
            ctx.drawImage(A, 0, 0, W, H);
            ctx.restore();
            ctx.strokeStyle = `rgba(255,255,255,${0.75 * crack})`;
            ctx.lineWidth = Math.max(1, W / 540);
            ctx.stroke();
            ctx.restore();
          });
        }
      }
      if (p < 0.1) {
        ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - p / 0.1)})`;
        ctx.fillRect(0, 0, W, H);
      }
      break;
    }

    case 'sand': {
      // A hancur jadi butiran pasir yang tertiup angin, memperlihatkan B
      drawFull(ctx, B, W, H);
      const [dx, dy] = dirVec(P.dir);
      const cols = P.count || 28;
      const cs = W / cols;
      const rows = Math.ceil(H / cs);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = r * cols + c;
          // urutan hancur: dari sisi berlawanan arah angin + acak
          const along = dx ? (dx > 0 ? c / cols : 1 - c / cols) : dy > 0 ? r / rows : 1 - r / rows;
          const start = (1 - along) * 0.5 + hash01(id, 1) * 0.3;
          const q = clamp((p - start) / 0.4);
          const x = c * cs;
          const y = r * cs;
          if (q <= 0) {
            ctx.drawImage(A, (x / W) * (A as HTMLCanvasElement).width, (y / H) * (A as HTMLCanvasElement).height, (cs / W) * (A as HTMLCanvasElement).width, (cs / H) * (A as HTMLCanvasElement).height, x, y, cs + 0.6, cs + 0.6);
            continue;
          }
          if (q >= 1) continue;
          const drift = q * q;
          const px = x + dx * W * 0.35 * drift + (hash01(id, 2) - 0.5) * cs * 3 * q;
          const py = y + dy * H * 0.2 * drift - H * 0.08 * drift * hash01(id, 3) + (hash01(id, 4) - 0.5) * cs * 2 * q;
          const sz = cs * (1 - q * 0.7);
          ctx.globalAlpha = 1 - q;
          ctx.drawImage(A, (x / W) * (A as HTMLCanvasElement).width, (y / H) * (A as HTMLCanvasElement).height, (cs / W) * (A as HTMLCanvasElement).width, (cs / H) * (A as HTMLCanvasElement).height, px, py, sz, sz);
          ctx.globalAlpha = 1;
        }
      }
      break;
    }

    /* ---------------- Pack Ekstra v7 ---------------- */
    case 'wave':
    case 'zigzag': {
      drawFull(ctx, A, W, H);
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const fwd = horiz ? dx > 0 : dy > 0;
      const L = horiz ? W : H;
      const M = horiz ? H : W;
      const n = P.count || 3;
      const amp = (P.intensity || 0.08) * Math.min(W, H);
      const pos = -amp + (L + amp * 2) * e;
      const pt = (u: number, v: number): [number, number] => (horiz ? [fwd ? u : W - u, v] : [v, fwd ? u : H - u]);
      const steps = spec.kind === 'wave' ? 48 : n * 2;
      const edge: Array<[number, number]> = [];
      for (let i = 0; i <= steps; i++) {
        const v = (i / steps) * M;
        const off = spec.kind === 'wave' ? Math.sin((v / M) * n * Math.PI * 2 + p * 6) : i % 2 ? 1 : -1;
        edge.push(pt(pos + amp * off, v));
      }
      ctx.save();
      ctx.beginPath();
      const s0 = pt(-amp * 2, 0);
      ctx.moveTo(s0[0], s0[1]);
      for (const [x, y] of edge) ctx.lineTo(x, y);
      const s1 = pt(-amp * 2, M);
      ctx.lineTo(s1[0], s1[1]);
      ctx.closePath();
      ctx.clip();
      drawFull(ctx, B, W, H);
      ctx.restore();
      if (P.color && p > 0 && p < 1) {
        ctx.beginPath();
        edge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = colorOf(P.color, cols);
        ctx.lineWidth = Math.max(2, amp * 0.5);
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      break;
    }

    case 'dots': {
      drawFull(ctx, A, W, H);
      const n = P.count || 10;
      const cw = W / n;
      const rows = Math.ceil(H / cw);
      const cover: Record<string, number> = { circle: 0.72, square: 0.72, diamond: 1.02, hexagon: 0.82, triangle: 1.4, star: 1.65, heart: 1.2 };
      const k = cover[P.shape || 'circle'] || 0.75;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < n; c++) {
          const idx = r * n + c;
          const delay = P.order === 'diagonal' ? ((r + c) / (rows + n)) * 0.6 : P.order === 'rows' ? (r / rows) * 0.6 : hash01(idx, 13) * 0.6;
          const t = ease(spec.easing, clamp((p - delay) / 0.4));
          if (t <= 0) continue;
          shapePath(ctx, P.shape, c * cw + cw / 2, r * cw + cw / 2, Math.max(0.1, cw * k * t), 0, false);
        }
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'rings': {
      drawFull(ctx, A, W, H);
      const [ox, oy] = originPt(P.origin, W, H);
      const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 2;
      const n = P.count || 5;
      const w = R / n;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const order = P.reverse ? n - 1 - i : i;
        const t = ease(spec.easing, clamp((p - (order / n) * 0.5) / 0.5));
        if (t <= 0) continue;
        const mid = i * w + w / 2;
        const outer = mid + (w / 2 + 0.5) * t;
        const inner = Math.max(0, mid - (w / 2 + 0.5) * t);
        ctx.moveTo(ox + outer, oy);
        ctx.arc(ox, oy, outer, 0, Math.PI * 2, false);
        if (inner > 0) {
          ctx.moveTo(ox + inner, oy);
          ctx.arc(ox, oy, inner, 0, Math.PI * 2, true);
        }
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'fan': {
      drawFull(ctx, A, W, H);
      const [ox, oy] = originPt(P.origin, W, H);
      const n = P.count || 3;
      const span = (Math.PI * 2) / n;
      const sgn = P.reverse ? -1 : 1;
      if (e > 0) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a0 = -Math.PI / 2 + i * span;
          ctx.moveTo(ox, oy);
          ctx.arc(ox, oy, diag * 1.2, a0, a0 + span * e * sgn, sgn < 0);
          ctx.closePath();
        }
        ctx.clip();
        drawFull(ctx, B, W, H);
      }
      break;
    }

    case 'pie': {
      drawFull(ctx, A, W, H);
      const n = P.count || 6;
      const span = (Math.PI * 2) / n;
      const R = diag * 0.6;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const k = P.order === 'random' ? hash01(i, 17) : (P.reverse ? n - 1 - i : i) / n;
        const t = ease(spec.easing, clamp((p - k * 0.5) / 0.5));
        if (t <= 0) continue;
        const a0 = -Math.PI / 2 + i * span;
        ctx.moveTo(W / 2, H / 2);
        ctx.arc(W / 2, H / 2, Math.max(0.1, R * t), a0, a0 + span + 0.01);
        ctx.closePath();
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      break;
    }

    case 'checker': {
      drawFull(ctx, A, W, H);
      const n = P.count || 6;
      const cw = W / n;
      const rows = Math.ceil(H / cw);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < n; c++) {
          const first = P.order === 'random' ? hash01(r * n + c, 23) < 0.5 : (r + c) % 2 === 0;
          const t = ease(spec.easing, clamp(first ? p * 2 : p * 2 - 1));
          if (t <= 0) continue;
          const sx = c * cw;
          const sy = r * cw;
          const ch = Math.min(cw, H - sy);
          const kx = P.dir === 'up' ? 1 : t;
          const ky = P.dir === 'left' ? 1 : t;
          const dw = cw * kx;
          const dh = ch * ky;
          ctx.drawImage(B, sx, sy, cw, ch, sx + (cw - dw) / 2, sy + (ch - dh) / 2, dw + 0.5, dh + 0.5);
        }
      }
      break;
    }

    case 'carousel': {
      const [dx, dy] = dirFull(P.dir);
      const sMin = P.intensity || 0.8;
      const s = 1 - (1 - sMin) * Math.sin(Math.PI * clamp(e));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const gx = W * 1.06 * s;
      const gy = H * 1.06 * s;
      const ax = dx * gx * e;
      const ay = dy * gy * e;
      drawTransformed(ctx, A, W, H, ax, ay, s, 0, 1 - e * 0.35);
      drawTransformed(ctx, B, W, H, ax - dx * gx, ay - dy * gy, s, 0, 0.65 + e * 0.35);
      break;
    }

    case 'tilt': {
      drawFull(ctx, A, W, H);
      const [dx, dy] = dirVec(P.dir);
      const k0 = Math.tan(((P.angle || 20) * Math.PI) / 180);
      const k = k0 * (1 - clamp(e));
      ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.min(1, e)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.translate(-dx * (W + (k0 * H) / 2) * (1 - e), -dy * (H + (k0 * W) / 2) * (1 - e));
      if (dx !== 0) ctx.transform(1, 0, k * -dx, 1, (k * dx * H) / 2, 0);
      else ctx.transform(1, k * -dy, 0, 1, 0, (k * dy * W) / 2);
      drawFull(ctx, B, W, H);
      break;
    }

    case 'stretch': {
      const [dx, dy] = dirVec(P.dir);
      const k = P.intensity || 3;
      const horiz = dx !== 0;
      const draw = (src: Src, t: number, toward: number) => {
        const sc = 1 + (k - 1) * t * t;
        // jangkar di sisi berlawanan arah regangan
        const ax = horiz ? (toward > 0 ? 0 : W) : 0;
        const ay = horiz ? 0 : toward > 0 ? 0 : H;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.scale(horiz ? sc : 1, horiz ? 1 : sc);
        ctx.translate(-ax, -ay);
        drawFull(ctx, src, W, H);
        ctx.restore();
      };
      const dirSign = horiz ? dx : dy;
      if (e < 0.5) draw(A, e * 2, dirSign);
      else draw(B, (1 - e) * 2, -dirSign);
      break;
    }

    case 'colorbars': {
      drawFull(ctx, A, W, H);
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const fwd = horiz ? dx > 0 : dy > 0;
      const L = horiz ? W : H;
      const M = horiz ? H : W;
      const n = P.count || 3;
      const rectU = (u0: number, u1: number, v0: number, v1: number) => {
        const a = fwd ? u0 : L - u1;
        if (horiz) ctx.rect(a, v0, u1 - u0, v1 - v0);
        else ctx.rect(v0, a, v1 - v0, u1 - u0);
      };
      const col = colorOf(P.color, cols);
      for (let i = 0; i < n; i++) {
        const local = clamp((p - (i / n) * 0.3) / 0.7);
        const lead = ease(spec.easing, clamp(local * 2)) * L;
        const tail = ease(spec.easing, clamp(local * 2 - 1)) * L;
        const v0 = (i * M) / n;
        const v1 = ((i + 1) * M) / n + 0.5;
        if (tail > 0) {
          ctx.save();
          ctx.beginPath();
          rectU(0, tail + 0.5, v0, v1);
          ctx.clip();
          drawFull(ctx, B, W, H);
          ctx.restore();
        }
        if (lead > tail) {
          ctx.beginPath();
          rectU(tail, lead, v0, v1);
          ctx.fillStyle = col;
          ctx.fill();
        }
      }
      break;
    }

    case 'scan': {
      drawFull(ctx, A, W, H);
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const fwd = horiz ? dx > 0 : dy > 0;
      const L = horiz ? W : H;
      const band = Math.max(3, L * 0.012 * (P.intensity || 1));
      const pos = -band + (L + band * 2) * e;
      const a = fwd ? 0 : L - Math.max(0, pos);
      ctx.save();
      ctx.beginPath();
      if (horiz) ctx.rect(a, 0, Math.max(0, pos), H);
      else ctx.rect(0, a, W, Math.max(0, pos));
      ctx.clip();
      drawFull(ctx, B, W, H);
      ctx.restore();
      if (p > 0 && p < 1) {
        const c = fwd ? pos : L - pos;
        const g = horiz ? ctx.createLinearGradient(c - band * 3, 0, c + band * 3, 0) : ctx.createLinearGradient(0, c - band * 3, 0, c + band * 3);
        const col = colorOf(P.color, cols);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.4, col);
        g.addColorStop(0.5, '#FFFFFF');
        g.addColorStop(0.6, col);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.sin(Math.PI * p);
        ctx.fillStyle = g;
        if (horiz) ctx.fillRect(c - band * 3, 0, band * 6, H);
        else ctx.fillRect(0, c - band * 3, W, band * 6);
      }
      break;
    }

    case 'diagblinds': {
      drawFull(ctx, A, W, H);
      const n = P.count || 8;
      const a = ((P.angle || 45) * Math.PI) / 180;
      const sw = diag / n;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(a);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const local = ease(spec.easing, clamp(p * 1.3 - (i / n) * 0.3));
        if (local <= 0) continue;
        ctx.rect(-diag / 2 + i * sw, -diag / 2, sw * local + 0.8, diag);
      }
      ctx.clip();
      ctx.rotate(-a);
      ctx.translate(-W / 2, -H / 2);
      drawFull(ctx, B, W, H);
      break;
    }

    case 'filmroll': {
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const s = 1 - 0.16 * Math.sin(Math.PI * clamp(e));
      ctx.fillStyle = '#0B0B0B';
      ctx.fillRect(0, 0, W, H);
      const gx = W * s * 1.08;
      const gy = H * s * 1.08;
      const ax = dx * gx * e;
      const ay = dy * gy * e;
      drawTransformed(ctx, A, W, H, ax, ay, s);
      drawTransformed(ctx, B, W, H, ax - dx * gx, ay - dy * gy, s);
      // lubang sprocket di dua sisi pita
      const hole = Math.min(W, H) * 0.035;
      const gap = hole * 2.2;
      const shift = horiz ? ax : ay;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const margin = ((horiz ? H : W) * (1 - s)) / 4;
      if (margin > hole * 0.6) {
        const L = horiz ? W : H;
        const M = horiz ? H : W;
        const start = (((shift % gap) + gap) % gap) - gap;
        for (let u = start; u < L + gap; u += gap) {
          for (const v of [margin - hole / 2, M - margin - hole / 2]) {
            if (horiz) ctx.fillRect(u, v, hole, hole * 0.8);
            else ctx.fillRect(v, u, hole * 0.8, hole);
          }
        }
      }
      break;
    }

    case 'swing': {
      drawFull(ctx, A, W, H);
      ctx.fillStyle = `rgba(0,0,0,${0.45 * clamp(p)})`;
      ctx.fillRect(0, 0, W, H);
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const hx = horiz ? (dx > 0 ? 0 : W) : 0;
      const hy = horiz ? 0 : dy > 0 ? 0 : H;
      const k = Math.max(0.001, e);
      const shrink = 1 - 0.12 * (1 - clamp(e));
      if (horiz) {
        ctx.translate(hx, H / 2);
        ctx.scale(k, shrink);
        ctx.translate(-hx, -H / 2);
      } else {
        ctx.translate(W / 2, hy);
        ctx.scale(shrink, k);
        ctx.translate(-W / 2, -hy);
      }
      drawFull(ctx, B, W, H);
      break;
    }

    case 'curtain': {
      const horiz = P.dir !== 'up';
      const closing = p < 0.5;
      const t = closing ? ease(spec.easing, p * 2) : 1 - ease(spec.easing, p * 2 - 1);
      drawFull(ctx, closing ? A : B, W, H);
      const col = colorOf(P.color, cols);
      const L = horiz ? W : H;
      const half = (L / 2) * t;
      const panel = (u0: number, len: number, flip: boolean) => {
        if (len <= 0) return;
        ctx.fillStyle = col;
        if (horiz) ctx.fillRect(u0, 0, len, H);
        else ctx.fillRect(0, u0, W, len);
        if (P.intensity) {
          const folds = 6;
          for (let f = 0; f < folds; f++) {
            const fu = u0 + (len / folds) * f;
            const g = horiz ? ctx.createLinearGradient(fu, 0, fu + len / folds, 0) : ctx.createLinearGradient(0, fu, 0, fu + len / folds);
            g.addColorStop(0, 'rgba(0,0,0,0.28)');
            g.addColorStop(0.5, 'rgba(255,255,255,0.10)');
            g.addColorStop(1, 'rgba(0,0,0,0.28)');
            ctx.fillStyle = g;
            if (horiz) ctx.fillRect(fu, 0, len / folds + 0.5, H);
            else ctx.fillRect(0, fu, W, len / folds + 0.5);
          }
        }
        // bayangan tepi tirai
        const edgeU = flip ? u0 : u0 + len;
        const g2 = horiz ? ctx.createLinearGradient(edgeU - 12, 0, edgeU + 12, 0) : ctx.createLinearGradient(0, edgeU - 12, 0, edgeU + 12);
        g2.addColorStop(0, 'rgba(0,0,0,0)');
        g2.addColorStop(0.5, 'rgba(0,0,0,0.35)');
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        if (horiz) ctx.fillRect(edgeU - 12, 0, 24, H);
        else ctx.fillRect(0, edgeU - 12, W, 24);
      };
      if (half >= 0.5) {
        panel(0, half + 0.5, false);
        panel(L - half - 0.5, half + 0.5, true);
      }
      break;
    }

    /* ---------------- Pack v8 ---------------- */
    case 'spotlight': {
      drawFull(ctx, A, W, H);
      const n = P.count || 1;
      const [dx, dy] = dirVec(P.dir);
      const tm = ease('inOutCubic', clamp(p / 0.55));
      const tg = ease('inOutCubic', clamp((p - 0.55) / 0.45));
      const r0 = Math.min(W, H) * 0.2;
      ctx.fillStyle = `rgba(0,0,0,${0.82 * clamp(p * 4) * (1 - tg)})`;
      ctx.fillRect(0, 0, W, H);
      const spots: Array<[number, number, number]> = [];
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(-dy, -dx) + (i * Math.PI * 2) / n;
        const sx = W / 2 + Math.cos(a) * diag * 0.5;
        const sy = H / 2 + Math.sin(a) * diag * 0.5;
        const ex = W / 2 + (n > 1 ? Math.cos(a) * r0 * 0.9 : 0);
        const ey = H / 2 + (n > 1 ? Math.sin(a) * r0 * 0.9 : 0);
        const r = Math.max(0.1, r0 * Math.min(1, p * 5) + (diag - r0) * tg);
        spots.push([sx + (ex - sx) * tm, sy + (ey - sy) * tm, r]);
      }
      ctx.save();
      ctx.beginPath();
      for (const [x, y, r] of spots) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      if (P.edge === 'soft' && tg < 1) {
        for (const [x, y, r] of spots) {
          const g = ctx.createRadialGradient(x, y, r * 0.65, x, y, r);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, `rgba(0,0,0,${0.55 * (1 - tg)})`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      if (P.color && tg < 1) {
        ctx.globalAlpha = 0.9 * (1 - tg);
        ctx.strokeStyle = colorOf(P.color, cols);
        ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.008);
        for (const [x, y, r] of spots) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }

    case 'flytiles': {
      drawFull(ctx, A, W, H);
      const n = P.count || 6;
      const cw = W / n;
      const rows = Math.ceil(H / cw);
      const [dx, dy] = dirVec(P.dir);
      const rotMax = ((P.angle || 0) * Math.PI) / 180;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < n; c++) {
          const idx = r * n + c;
          const lin = dx !== 0 ? (dx > 0 ? (n - 1 - c) / n : c / n) : dy > 0 ? (rows - 1 - r) / rows : r / rows;
          const delay = (P.order === 'random' ? hash01(idx, 29) : P.order === 'diagonal' ? (r + c) / (rows + n) : lin) * 0.5;
          const lp = clamp((p - delay) / 0.5);
          if (lp <= 0) continue;
          const t = ease(spec.easing, lp);
          const sx = c * cw;
          const sy = r * cw;
          const ch = Math.min(cw, H - sy);
          ctx.save();
          ctx.translate(sx + cw / 2 - dx * W * 0.7 * (1 - t), sy + ch / 2 - dy * H * 0.7 * (1 - t));
          if (rotMax) ctx.rotate(rotMax * (1 - t) * (hash01(idx, 31) - 0.5) * 2);
          const s = 0.5 + 0.5 * t;
          ctx.scale(s, s);
          ctx.drawImage(B, sx, sy, cw, ch, -cw / 2 - 0.5, -ch / 2 - 0.5, cw + 1, ch + 1);
          ctx.restore();
        }
      }
      break;
    }

    case 'tear': {
      if (e <= 0) {
        drawFull(ctx, A, W, H);
        break;
      }
      drawFull(ctx, B, W, H);
      const horizCut = P.dir === 'up' || P.dir === 'down';
      const L = horizCut ? H : W;
      const M = horizCut ? W : H;
      const n = P.count || 14;
      const amp = (P.intensity || 1) * Math.min(W, H) * 0.035;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= n; i++) pts.push([L / 2 + (hash01(i, 37) - 0.5) * 2 * amp, (i / n) * M]);
      const map = (u: number, v: number): [number, number] => (horizCut ? [v, u] : [u, v]);
      const off = e * L * 0.72;
      for (const side of [-1, 1]) {
        ctx.save();
        const [tx, ty] = map(side * off, 0);
        ctx.translate(tx, ty);
        const [px, py] = map(side < 0 ? 0 : L, M / 2);
        ctx.translate(px, py);
        ctx.rotate(side * e * 0.06);
        ctx.translate(-px, -py);
        const edgeU = side < 0 ? -2 : L + 2;
        ctx.beginPath();
        let q = map(edgeU, -2);
        ctx.moveTo(q[0], q[1]);
        for (const [u, v] of pts) {
          q = map(u, v);
          ctx.lineTo(q[0], q[1]);
        }
        q = map(edgeU, M + 2);
        ctx.lineTo(q[0], q[1]);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        drawFull(ctx, A, W, H);
        ctx.restore();
        if (P.color) {
          ctx.beginPath();
          pts.forEach(([u, v], i) => {
            const r = map(u, v);
            if (i) ctx.lineTo(r[0], r[1]);
            else ctx.moveTo(r[0], r[1]);
          });
          ctx.strokeStyle = colorOf(P.color, cols);
          ctx.lineWidth = Math.max(2, amp * 0.35);
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case 'roll': {
      drawFull(ctx, B, W, H);
      const [dx, dy] = dirVec(P.dir);
      const horiz = dx !== 0;
      const L = horiz ? W : H;
      const fwd = horiz ? dx > 0 : dy > 0;
      const rr = Math.max(4, L * (P.intensity || 0.06));
      if (e >= 1) break;
      const a0 = fwd ? e * L : 0;
      const a1 = fwd ? L : L - e * L;
      ctx.save();
      ctx.beginPath();
      if (horiz) ctx.rect(a0, 0, a1 - a0, H);
      else ctx.rect(0, a0, W, a1 - a0);
      ctx.clip();
      drawFull(ctx, A, W, H);
      ctx.restore();
      // bayangan di scene baru, tepat di depan gulungan
      const edge = fwd ? a0 : a1;
      const sh = rr * 1.2;
      ctx.globalAlpha = clamp(e * 8);
      const s0 = fwd ? edge - sh : edge;
      const g = horiz ? ctx.createLinearGradient(s0, 0, s0 + sh, 0) : ctx.createLinearGradient(0, s0, 0, s0 + sh);
      g.addColorStop(fwd ? 0 : 1, 'rgba(0,0,0,0)');
      g.addColorStop(fwd ? 1 : 0, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      if (horiz) ctx.fillRect(s0, 0, sh, H);
      else ctx.fillRect(0, s0, W, sh);
      // silinder gulungan
      const b0 = fwd ? a0 : Math.max(a0, a1 - rr);
      const b1 = fwd ? Math.min(a1, a0 + rr) : a1;
      if (b1 - b0 > 0.5) {
        const g2 = horiz ? ctx.createLinearGradient(b0, 0, b1, 0) : ctx.createLinearGradient(0, b0, 0, b1);
        g2.addColorStop(0, 'rgba(0,0,0,0.45)');
        g2.addColorStop(0.45, 'rgba(255,255,255,0.35)');
        g2.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g2;
        if (horiz) ctx.fillRect(b0, 0, b1 - b0, H);
        else ctx.fillRect(0, b0, W, b1 - b0);
      }
      break;
    }

    case 'slats': {
      const n = P.count || 6;
      const vertical = P.dir !== 'up' && P.dir !== 'down';
      ctx.fillStyle = P.color ? colorOf(P.color, cols) : '#000000';
      ctx.fillRect(0, 0, W, H);
      const L = vertical ? W : H;
      const sw = L / n;
      const mid = (n - 1) / 2 || 1;
      for (let i = 0; i < n; i++) {
        const k = P.order === 'random' ? hash01(i, 41) : P.order === 'diagonal' ? Math.abs(i - (n - 1) / 2) / mid : P.reverse ? (n - 1 - i) / n : i / n;
        const te = ease(spec.easing, clamp((p - k * 0.45) / 0.55));
        const c = Math.cos(Math.PI * te);
        const src = te < 0.5 ? A : B;
        const s = Math.max(0.001, Math.abs(c));
        const u0 = i * sw;
        ctx.save();
        if (vertical) {
          ctx.translate(u0 + sw / 2, 0);
          ctx.scale(s, 1);
          ctx.drawImage(src, u0, 0, sw, H, -sw / 2 - 0.5, 0, sw + 1, H);
          ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - s)})`;
          ctx.fillRect(-sw / 2 - 0.5, 0, sw + 1, H);
        } else {
          ctx.translate(0, u0 + sw / 2);
          ctx.scale(1, s);
          ctx.drawImage(src, 0, u0, W, sw, 0, -sw / 2 - 0.5, W, sw + 1);
          ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - s)})`;
          ctx.fillRect(0, -sw / 2 - 0.5, W, sw + 1);
        }
        ctx.restore();
      }
      break;
    }

    case 'pagecurl': {
      drawFull(ctx, A, W, H);
      const [ox, oy] = originPt(P.origin === 'center' || !P.origin ? 'tr' : P.origin, W, H);
      const ang = Math.atan2(H / 2 - oy, W / 2 - ox) + ((P.angle || 0) * Math.PI) / 180;
      const d0 = Math.cos(ang);
      const d1 = Math.sin(ang);
      const corners: Array<[number, number]> = [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H],
      ];
      const proj = (x: number, y: number) => (x - ox) * d0 + (y - oy) * d1;
      const maxP = Math.max(...corners.map(([x, y]) => proj(x, y)));
      const s = e * maxP * 1.02;
      const peeled: Array<[number, number]> = [];
      for (let i = 0; i < 4; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        const fa = proj(a[0], a[1]) - s;
        const fb = proj(b[0], b[1]) - s;
        if (fa <= 0) peeled.push(a);
        if ((fa <= 0) !== (fb <= 0)) {
          const t = fa / (fa - fb);
          peeled.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
      }
      if (peeled.length > 2) {
        ctx.save();
        ctx.beginPath();
        peeled.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.clip();
        drawFull(ctx, B, W, H);
        ctx.restore();
        if (e > 0 && e < 1) {
          const flap = peeled.map(([x, y]): [number, number] => {
            const k = 2 * (s - proj(x, y));
            return [x + k * d0, y + k * d1];
          });
          ctx.save();
          ctx.beginPath();
          flap.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          if (allowBlur) {
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 24;
          }
          ctx.fillStyle = P.color ? colorOf(P.color, cols) : '#F3EFE6';
          ctx.fill();
          ctx.shadowColor = 'transparent';
          const g = ctx.createLinearGradient(ox + d0 * s, oy + d1 * s, ox + d0 * (s + Math.max(1, s)), oy + d1 * (s + Math.max(1, s)));
          g.addColorStop(0, 'rgba(255,255,255,0.4)');
          g.addColorStop(1, 'rgba(0,0,0,0.22)');
          ctx.fillStyle = g;
          ctx.fill();
          ctx.restore();
        }
      }
      break;
    }

    case 'tilesout': {
      drawFull(ctx, B, W, H);
      const n = P.count || 6;
      const cw = W / n;
      const rows = Math.ceil(H / cw);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < n; c++) {
          const idx = r * n + c;
          const delay = (P.order === 'random' ? hash01(idx, 43) : P.order === 'diagonal' ? (r + c) / (rows + n) : r / rows) * 0.5;
          const t = ease(spec.easing, clamp((p - delay) / 0.5));
          if (t >= 1) continue;
          const sx = c * cw;
          const sy = r * cw;
          const ch = Math.min(cw, H - sy);
          ctx.save();
          if (P.mode === 'fall') {
            ctx.translate(sx + cw / 2 + (hash01(idx, 45) - 0.5) * cw * t, sy + ch / 2 + t * t * H * 1.3);
            ctx.rotate((hash01(idx, 47) - 0.5) * 1.4 * t);
          } else {
            ctx.translate(sx + cw / 2, sy + ch / 2);
            if (P.mode === 'spin') ctx.rotate(t * Math.PI);
            const s = Math.max(0.001, 1 - t);
            ctx.scale(s, s);
          }
          ctx.drawImage(A, sx, sy, cw, ch, -cw / 2 - 0.5, -ch / 2 - 0.5, cw + 1, ch + 1);
          ctx.restore();
        }
      }
      break;
    }

    case 'lens': {
      const [ox, oy] = originPt(P.origin, W, H);
      const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 2;
      const mag = P.intensity || 1.5;
      drawTransformed(ctx, A, W, H, 0, 0, 1 + 0.08 * e);
      const r = Math.max(0.1, R * e);
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.clip();
      const s = 1 + (mag - 1) * (1 - e);
      ctx.translate(ox, oy);
      ctx.scale(s, s);
      ctx.translate(-ox, -oy);
      drawFull(ctx, B, W, H);
      ctx.restore();
      if (P.color && e > 0 && e < 1) {
        ctx.globalAlpha = 1 - e;
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.strokeStyle = colorOf(P.color, cols);
        ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.012);
        ctx.stroke();
      }
      break;
    }

    case 'brush': {
      drawFull(ctx, A, W, H);
      const n = P.count || 4;
      const vertical = P.dir === 'up' || P.dir === 'down';
      const L = vertical ? H : W;
      const M = vertical ? W : H;
      const band = M / n;
      const lw = band * 1.6;
      const slope = Math.tan(((P.angle || 0) * Math.PI) / 180);
      const pat = ctx.createPattern(B, 'no-repeat');
      if (pat) {
        ctx.strokeStyle = pat;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const per = 0.8 / n;
        for (let i = 0; i < n; i++) {
          const local = ease(spec.easing, clamp((p - i * per) / (per + 0.12)));
          if (local <= 0) continue;
          const rev = i % 2 === 1;
          const u0 = -lw / 2;
          const u1 = L + lw / 2;
          const ua = rev ? u1 : u0;
          const ub = ua + (rev ? -1 : 1) * (u1 - u0) * local;
          const v = (i + 0.5) * band;
          ctx.beginPath();
          for (let k = 0; k <= 14; k++) {
            const u = ua + (ub - ua) * (k / 14);
            const vv = v + slope * (u - L / 2) * (rev ? -1 : 1) + Math.sin(u * 0.02 + i * 1.7) * band * 0.06;
            const x = vertical ? vv : u;
            const y = vertical ? u : vv;
            if (k) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      const fin = pat ? clamp((p - 0.88) / 0.12) : e;
      if (fin > 0) {
        ctx.globalAlpha = fin;
        drawFull(ctx, B, W, H);
      }
      break;
    }

    case 'melt': {
      drawFull(ctx, B, W, H);
      const [dx, dy] = dirVec(P.dir);
      const vertical = dy !== 0;
      const sign = vertical ? dy : dx;
      const n = P.count || 24;
      const L = vertical ? H : W;
      const M = vertical ? W : H;
      const cw = M / n;
      const spread = P.intensity || 0.6;
      for (let i = 0; i < n; i++) {
        const t = ease(spec.easing, clamp(p * (1 + hash01(i, 49) * spread)));
        if (t >= 1) continue;
        const stretch = 1 + 0.35 * t;
        const len = L * stretch;
        const off = sign > 0 ? t * L * 1.05 : -t * L * 1.05 - (len - L);
        const m0 = i * cw;
        if (vertical) ctx.drawImage(A, m0, 0, cw, H, m0, off, cw + 0.6, len);
        else ctx.drawImage(A, 0, m0, W, cw, off, m0, len, cw + 0.6);
      }
      break;
    }

    case 'bubbles': {
      drawFull(ctx, A, W, H);
      const n = P.count || 16;
      const cover: Record<string, number> = { circle: 1, hexagon: 1.16, star: 2.15, heart: 1.9, diamond: 1.42, square: 1.34, triangle: 2.05 };
      const kf = cover[P.shape || 'circle'] || 1.2;
      const blobs: Array<[number, number, number, number]> = [];
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const delay = hash01(i, 53) * 0.55;
        const t = clamp((p - delay) / (1 - delay));
        if (t <= 0) continue;
        const x = hash01(i, 59) * W;
        const y = hash01(i, 61) * H;
        const r = Math.max(0.1, diag * kf * Math.pow(ease(spec.easing, t), 1.6));
        shapePath(ctx, P.shape, x, y, r, 0, false);
        blobs.push([x, y, r, t]);
      }
      ctx.clip();
      drawFull(ctx, B, W, H);
      ctx.restore();
      if (P.color) {
        ctx.strokeStyle = colorOf(P.color, cols);
        ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.008);
        for (const [x, y, r, t] of blobs) {
          if (t >= 1) continue;
          ctx.globalAlpha = 0.85 * (1 - t);
          shapePath(ctx, P.shape, x, y, r, 0, true);
          ctx.stroke();
        }
      }
      break;
    }

    case 'toss': {
      const [dx, dy] = dirVec(P.dir);
      drawTransformed(ctx, B, W, H, 0, 0, 1.08 - 0.08 * e);
      if (e >= 1) break;
      const ang = ((P.angle || 20) * Math.PI) / 180;
      const x = dx * W * 2 * e;
      const y = dy * H * 2 * e - Math.sin(Math.PI * clamp(e)) * H * 0.08;
      const s = 1 - 0.18 * clamp(e);
      ctx.save();
      ctx.translate(W / 2 + x, H / 2 + y);
      ctx.rotate(ang * e * (dx < 0 ? -1 : 1));
      ctx.scale(s, s);
      if (allowBlur) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 30;
      }
      if (P.mode === 'foto') {
        const b = Math.min(W, H) * 0.035;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-W / 2 - b, -H / 2 - b, W + b * 2, H + b * 4.5);
        ctx.shadowColor = 'transparent';
      }
      ctx.drawImage(A, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'custom': {
      const lerpP = (a: CustomPose | undefined, b: CustomPose | undefined, t: number) => ({
        x: ((a?.x ?? 0) + ((b?.x ?? 0) - (a?.x ?? 0)) * t) * (W / 1080),
        y: ((a?.y ?? 0) + ((b?.y ?? 0) - (a?.y ?? 0)) * t) * (W / 1080),
        s: (a?.scale ?? 1) + ((b?.scale ?? 1) - (a?.scale ?? 1)) * t,
        r: (((a?.rot ?? 0) + ((b?.rot ?? 0) - (a?.rot ?? 0)) * t) * Math.PI) / 180,
        al: (a?.alpha ?? 1) + ((b?.alpha ?? 1) - (a?.alpha ?? 1)) * t,
      });
      const o = lerpP(P.outFrom, P.outTo, e);
      drawTransformed(ctx, A, W, H, o.x, o.y, o.s, o.r, o.al);
      const i = lerpP(P.inFrom, P.inTo, e);
      ctx.save();
      if (P.mask && P.mask !== 'none') {
        ctx.beginPath();
        const r = diag * 0.6 * e;
        if (P.mask === 'circle') ctx.arc(W / 2, H / 2, Math.max(0.1, r), 0, Math.PI * 2);
        else if (P.mask === 'diamond') shapePath(ctx, 'diamond', W / 2, H / 2, Math.max(0.1, r * 1.5));
        else ctx.rect(W / 2 - (W / 2) * e, H / 2 - (H / 2) * e, W * e, H * e);
        ctx.clip();
      }
      drawTransformed(ctx, B, W, H, i.x, i.y, i.s, i.r, i.al);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
  // ---- aksen (lapisan atas) ----
  if (fx === 'kilat' || fx === 'warna') {
    const a = clamp(1 - Math.abs(p - 0.5) / 0.16) * 0.9;
    if (a > 0) {
      ctx.globalAlpha = a;
      ctx.fillStyle = fx === 'kilat' ? '#FFFFFF' : cols.primary;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  } else if (fx === 'cahaya' && bump > 0.001) {
    ctx.globalCompositeOperation = 'screen';
    const cx = -0.3 * W + 1.6 * W * p;
    const g = ctx.createLinearGradient(cx - W * 0.6, 0, cx + W * 0.6, H * 0.4);
    g.addColorStop(0, 'rgba(255,120,40,0)');
    g.addColorStop(0.45, `rgba(255,140,60,${(0.75 * bump).toFixed(3)})`);
    g.addColorStop(0.6, `rgba(255,220,150,${(0.55 * bump).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

let scratch: HTMLCanvasElement | null = null;
function getScratch(w: number, h: number): HTMLCanvasElement {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w) scratch.width = w;
  if (scratch.height !== h) scratch.height = h;
  return scratch;
}

/* ------------------------------------------------------------------ */
/* Parser kode admin                                                   */
/* ------------------------------------------------------------------ */
const KINDS: TransitionKind[] = [
  'cut', 'fade', 'slide', 'push', 'wipe', 'iris', 'shape', 'zoom', 'blinds', 'grid', 'stripes', 'spin', 'flip', 'cube',
  'whip', 'glitch', 'flash', 'blur', 'split', 'clock', 'pixelate', 'ink', 'slice', 'colorwipe', 'burst', 'shake', 'card', 'dolly', 'shatter', 'sand',
  'wave', 'zigzag', 'dots', 'rings', 'fan', 'pie', 'checker', 'carousel', 'tilt', 'stretch', 'colorbars', 'scan', 'diagblinds', 'filmroll', 'swing', 'curtain',
  'spotlight', 'flytiles', 'tear', 'roll', 'slats', 'pagecurl', 'tilesout', 'lens', 'brush', 'melt', 'bubbles', 'toss', 'custom',
];

export function parseTransitionCode(raw: string, fallbackName = 'Transisi Custom'): { ok: boolean; error?: string; spec?: TransitionSpec } {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `JSON tidak valid: ${(e as Error).message}` };
  }
  const kind = String(j.kind || 'custom') as TransitionKind;
  if (!KINDS.includes(kind)) return { ok: false, error: `"kind" harus salah satu: ${KINDS.join(', ')}` };
  const params = (typeof j.params === 'object' && j.params ? j.params : {}) as TransitionParams;
  if (kind === 'custom') {
    ['outFrom', 'outTo', 'inFrom', 'inTo'].forEach((k) => {
      const v = (j as Record<string, unknown>)[k];
      if (v && typeof v === 'object') (params as Record<string, unknown>)[k] = v;
    });
    if (typeof j.mask === 'string') params.mask = j.mask as TransitionParams['mask'];
    if (!params.inFrom && !params.outTo && !params.mask) return { ok: false, error: 'Mode custom butuh minimal "inFrom", "outTo", atau "mask".' };
  }
  return {
    ok: true,
    spec: {
      id: String(j.id || `custom-tr-${Date.now()}`),
      name: String(j.name || fallbackName),
      group: 'custom',
      kind,
      tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(String) : ['custom'],
      duration: Math.max(0.1, Math.min(3, Number(j.duration) || 0.6)),
      easing: (typeof j.easing === 'string' ? j.easing : 'inOutCubic') as EasingId,
      params,
      energy: ([1, 2, 3].includes(Number(j.energy)) ? Number(j.energy) : 2) as 1 | 2 | 3,
      author: 'admin',
    },
  };
}

export const TRANSITION_CODE_EXAMPLE = `{
  "name": "Lempar Kartu Miring",
  "kind": "custom",
  "duration": 0.7,
  "easing": "inOutCubic",
  "outTo":  { "x": -900, "rot": -25, "scale": 0.8, "alpha": 0.2 },
  "inFrom": { "x": 900,  "rot": 25,  "scale": 0.8 },
  "inTo":   { "x": 0,    "rot": 0,   "scale": 1 },
  "mask": "none"
}`;
