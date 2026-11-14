import { EasingId, ease, clamp, hash01 } from '../easing';

/**
 * Transition Pack — 300+ transisi antar scene.
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

export const TRANSITION_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'dasar', label: 'Dasar' },
  { id: 'geser', label: 'Geser & Dorong' },
  { id: 'sapu', label: 'Sapu (Wipe)' },
  { id: 'bentuk', label: 'Bentuk & Iris' },
  { id: 'zoom', label: 'Zoom & Kamera' },
  { id: 'pola', label: 'Pola & Bilah' },
  { id: 'efek', label: 'Efek & Glitch' },
  { id: '3d', label: '3D & Putar' },
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
  return L;
}

const LIB = buildLibrary();
const BY_ID = new Map(LIB.map((t) => [t.id, t]));

export function allTransitions(): TransitionSpec[] {
  return LIB;
}
export function getTransition(id?: string): TransitionSpec {
  return (id && BY_ID.get(id)) || BY_ID.get('fade-none-normal')!;
}
export function hasTransition(id: string) {
  return BY_ID.has(id);
}
export function registerTransition(spec: TransitionSpec) {
  const idx = LIB.findIndex((t) => t.id === spec.id);
  if (idx >= 0) LIB[idx] = spec;
  else LIB.push(spec);
  BY_ID.set(spec.id, spec);
}
export function unregisterTransition(id: string) {
  const idx = LIB.findIndex((t) => t.id === id);
  if (idx >= 0) LIB.splice(idx, 1);
  BY_ID.delete(id);
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

function shapePath(ctx: CanvasRenderingContext2D, shape: TransitionParams['shape'], cx: number, cy: number, r: number, rot = 0) {
  ctx.beginPath();
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
      const [dx, dy] = dirVec(P.dir);
      drawFull(ctx, A, W, H);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 40;
      drawTransformed(ctx, B, W, H, -dx * W * (1 - e), -dy * H * (1 - e));
      break;
    }

    case 'push': {
      const [dx, dy] = dirVec(P.dir);
      drawTransformed(ctx, A, W, H, dx * W * e, dy * H * e);
      drawTransformed(ctx, B, W, H, -dx * W * (1 - e), -dy * H * (1 - e));
      break;
    }

    case 'card': {
      const [dx, dy] = dirVec(P.dir);
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
          ctx.beginPath();
          if (vertical) ctx.rect(0, i * segs, W, segs + 1);
          else ctx.rect(i * segs, 0, segs + 1, H);
          ctx.clip();
          const dirSign = n === 2 ? (i === 0 ? -1 : 1) : i % 2 ? 1 : -1;
          const off = dirSign * (vertical ? H : W) * e * (n === 2 ? 0.5 : 1);
          ctx.drawImage(A, vertical ? 0 : off, vertical ? off : 0, W, H);
          ctx.restore();
        }
      } else {
        drawFull(ctx, A, W, H);
        for (let i = 0; i < n; i++) {
          ctx.save();
          const segs = vertical ? H / n : W / n;
          ctx.beginPath();
          if (vertical) ctx.rect(0, i * segs, W, segs + 1);
          else ctx.rect(i * segs, 0, segs + 1, H);
          ctx.clip();
          const dirSign = i % 2 ? 1 : -1;
          const off = dirSign * (vertical ? H : W) * (1 - e) * 0.5;
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
  'whip', 'glitch', 'flash', 'blur', 'split', 'clock', 'pixelate', 'ink', 'slice', 'colorwipe', 'burst', 'shake', 'card', 'dolly', 'custom',
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
