import { EasingId, ease, clamp } from '../easing';

/**
 * Animation Pack — 300+ animasi elemen (masuk/keluar + loop/emphasis).
 * Semua animasi bersifat deklaratif (spec JSON), jadi admin bisa menambah animasi baru
 * lewat kode JSON tanpa menjalankan JavaScript asing di browser user.
 */

export interface Pose {
  x: number;
  y: number;
  scale: number;
  sx: number;
  sy: number;
  rot: number;
  alpha: number;
  blur: number;
  skew: number;
}

export const IDENTITY: Pose = { x: 0, y: 0, scale: 1, sx: 1, sy: 1, rot: 0, alpha: 1, blur: 0, skew: 0 };

export type ClipKind = 'left' | 'right' | 'up' | 'down' | 'center-h' | 'center-v' | 'circle' | 'diagonal';
export type TextMode = 'char' | 'word' | 'line';

export interface TextAnimSpec {
  mode: TextMode;
  from: Partial<Pose>;
  /** 0 = item muncul berurutan penuh, 0.9 = hampir bersamaan */
  overlap: number;
  scramble?: boolean;
  cursor?: boolean;
  highlight?: boolean;
}

export interface Keyframe extends Partial<Pose> {
  t: number;
  easing?: EasingId;
}

export interface LoopSpec {
  wave: 'sin' | 'pulse' | 'shake' | 'bounce' | 'spin' | 'flash' | 'heartbeat' | 'wobble';
  amp: Partial<Pose>;
  period: number;
}

export interface AnimSpec {
  id: string;
  name: string;
  group: string;
  kind: 'in' | 'loop';
  tags: string[];
  easing: EasingId;
  duration: number;
  from?: Partial<Pose>;
  keyframes?: Keyframe[];
  clip?: ClipKind;
  text?: TextAnimSpec;
  loop?: LoopSpec;
  author?: 'builtin' | 'admin';
}

export const ANIM_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'dasar', label: 'Dasar' },
  { id: 'geser', label: 'Geser' },
  { id: 'skala', label: 'Pop & Skala' },
  { id: 'putar', label: 'Putar & Flip' },
  { id: 'blur', label: 'Blur & Fokus' },
  { id: 'reveal', label: 'Wipe Reveal' },
  { id: 'teks', label: 'Animasi Teks' },
  { id: 'fisika', label: 'Pantul & Elastis' },
  { id: 'stylish', label: 'Stylish' },
  { id: 'loop', label: 'Loop / Emphasis' },
  { id: 'custom', label: 'Custom Admin' },
];

const EASE_VARIANTS: Array<{ key: string; label: string; easing: EasingId }> = [
  { key: 'halus', label: 'Halus', easing: 'outCubic' },
  { key: 'tegas', label: 'Tegas', easing: 'outExpo' },
  { key: 'membal', label: 'Membal', easing: 'outBack' },
];

const DIRS: Array<{ key: string; label: string; x: number; y: number }> = [
  { key: 'atas', label: 'dari Bawah', x: 0, y: 1 },
  { key: 'bawah', label: 'dari Atas', x: 0, y: -1 },
  { key: 'kiri', label: 'dari Kanan', x: 1, y: 0 },
  { key: 'kanan', label: 'dari Kiri', x: -1, y: 0 },
  { key: 'kiri-atas', label: 'dari Kanan Bawah', x: 0.7, y: 0.7 },
  { key: 'kanan-atas', label: 'dari Kiri Bawah', x: -0.7, y: 0.7 },
  { key: 'kiri-bawah', label: 'dari Kanan Atas', x: 0.7, y: -0.7 },
  { key: 'kanan-bawah', label: 'dari Kiri Atas', x: -0.7, y: -0.7 },
];

function buildLibrary(): AnimSpec[] {
  const L: AnimSpec[] = [];
  const add = (a: Omit<AnimSpec, 'author'>) => L.push({ ...a, author: 'builtin' });

  // ---- Dasar
  add({ id: 'none', name: 'Tanpa Animasi', group: 'dasar', kind: 'in', tags: ['diam'], easing: 'linear', duration: 0.01, from: {} });
  [
    ['fade', 'Muncul Pelan', 0.6, 'inOutSine'],
    ['fade-fast', 'Muncul Cepat', 0.3, 'outQuad'],
    ['fade-slow', 'Muncul Lambat', 1.2, 'inOutSine'],
  ].forEach(([id, name, d, e]) =>
    add({ id: id as string, name: name as string, group: 'dasar', kind: 'in', tags: ['fade', 'lembut'], easing: e as EasingId, duration: d as number, from: { alpha: 0 } })
  );

  // ---- Geser: 8 arah × 2 jarak × 3 easing = 48
  for (const dir of DIRS) {
    for (const [dk, dl, dist] of [
      ['pendek', 'Pendek', 70],
      ['jauh', 'Jauh', 420],
    ] as const) {
      for (const ev of EASE_VARIANTS) {
        add({
          id: `geser-${dir.key}-${dk}-${ev.key}`,
          name: `Geser ${dir.label} · ${dl} · ${ev.label}`,
          group: 'geser',
          kind: 'in',
          tags: ['geser', 'slide', dir.key, ev.key],
          easing: ev.easing,
          duration: dk === 'jauh' ? 0.7 : 0.55,
          from: { x: dir.x * dist, y: dir.y * dist, alpha: 0 },
        });
      }
    }
  }

  // ---- Pop & skala: 6 skala awal × 3 easing = 18
  for (const [k, l, s] of [
    ['nol', 'dari Nol', 0],
    ['kecil', 'dari Kecil', 0.5],
    ['sedang', 'Halus', 0.85],
    ['besar', 'dari Besar', 1.6],
    ['raksasa', 'Raksasa', 3],
    ['pipih', 'Pipih', 1],
  ] as const) {
    for (const ev of EASE_VARIANTS) {
      add({
        id: `pop-${k}-${ev.key}`,
        name: `Pop ${l} · ${ev.label}`,
        group: 'skala',
        kind: 'in',
        tags: ['pop', 'zoom', 'skala', ev.key],
        easing: ev.easing,
        duration: 0.55,
        from: k === 'pipih' ? { sy: 0, alpha: 0 } : { scale: s, alpha: 0 },
      });
    }
  }
  // Stretch horizontal/vertikal × 3 = 6
  for (const [k, l, f] of [
    ['h', 'Melebar', { sx: 0, alpha: 0 }],
    ['v', 'Meninggi', { sy: 0, alpha: 0 }],
  ] as const) {
    for (const ev of EASE_VARIANTS) {
      add({ id: `stretch-${k}-${ev.key}`, name: `Stretch ${l} · ${ev.label}`, group: 'skala', kind: 'in', tags: ['stretch'], easing: ev.easing, duration: 0.5, from: f });
    }
  }

  for (const [dk, dl, deg] of [
    ['kiri', 'Kiri', -25],
    ['kanan', 'Kanan', 25],
  ] as const) {
    for (const ev of EASE_VARIANTS) {
      add({ id: `pop-putar-${dk}-${ev.key}`, name: `Pop Berputar ${dl} · ${ev.label}`, group: 'skala', kind: 'in', tags: ['pop', 'putar'], easing: ev.easing, duration: 0.6, from: { scale: 0.3, rot: deg, alpha: 0 } });
    }
  }
  for (const [sk, sl, d] of [
    ['cepat', 'Cepat', 0.5],
    ['normal', 'Normal', 0.9],
    ['lambat', 'Lambat', 1.4],
  ] as const) {
    add({ id: `melayang-masuk-${sk}`, name: `Melayang Masuk · ${sl}`, group: 'dasar', kind: 'in', tags: ['lembut', 'float'], easing: 'inOutSine', duration: d, from: { y: 40, blur: 6, alpha: 0 } });
  }

  // ---- Putar & flip
  for (const deg of [-360, -180, -90, -30, -12, 12, 30, 90, 180, 360]) {
    for (const ev of [EASE_VARIANTS[0], EASE_VARIANTS[2]]) {
      add({
        id: `putar-${deg < 0 ? 'kiri' : 'kanan'}-${Math.abs(deg)}-${ev.key}`,
        name: `Putar ${Math.abs(deg)}° ${deg < 0 ? 'Kiri' : 'Kanan'} · ${ev.label}`,
        group: 'putar',
        kind: 'in',
        tags: ['putar', 'rotate'],
        easing: ev.easing,
        duration: Math.abs(deg) > 90 ? 0.8 : 0.6,
        from: { rot: deg, scale: Math.abs(deg) > 90 ? 0.2 : 0.8, alpha: 0 },
      });
    }
  }
  for (const [k, l, f] of [
    ['x', 'Flip Horizontal', { sx: -1, alpha: 0 }],
    ['y', 'Flip Vertikal', { sy: -1, alpha: 0 }],
    ['kartu', 'Balik Kartu', { sx: 0, rot: 8, alpha: 0 }],
    ['koin', 'Koin Berputar', { sx: -0.2, scale: 0.6, alpha: 0 }],
  ] as const) {
    for (const ev of EASE_VARIANTS) {
      add({ id: `flip-${k}-${ev.key}`, name: `${l} · ${ev.label}`, group: 'putar', kind: 'in', tags: ['flip', '3d'], easing: ev.easing, duration: 0.65, from: f });
    }
  }

  // ---- Blur & fokus
  for (const [k, l, f] of [
    ['fokus', 'Tarik Fokus', { blur: 24, alpha: 0 }],
    ['fokus-zoom', 'Fokus + Zoom', { blur: 20, scale: 1.25, alpha: 0 }],
    ['fokus-kecil', 'Fokus dari Kecil', { blur: 16, scale: 0.7, alpha: 0 }],
    ['fokus-naik', 'Fokus Naik', { blur: 18, y: 120, alpha: 0 }],
    ['fokus-turun', 'Fokus Turun', { blur: 18, y: -120, alpha: 0 }],
    ['fokus-kiri', 'Fokus dari Kanan', { blur: 18, x: 160, alpha: 0 }],
    ['fokus-kanan', 'Fokus dari Kiri', { blur: 18, x: -160, alpha: 0 }],
    ['kabut', 'Kabut Tipis', { blur: 40, alpha: 0, scale: 1.05 }],
  ] as const) {
    for (const ev of [EASE_VARIANTS[0], EASE_VARIANTS[1]]) {
      add({ id: `blur-${k}-${ev.key}`, name: `${l} · ${ev.label}`, group: 'blur', kind: 'in', tags: ['blur', 'sinematik'], easing: ev.easing, duration: 0.8, from: f });
    }
  }

  // ---- Wipe reveal: 8 bentuk × 3 easing = 24 (+ 8 dengan geser = 32)
  const clips: Array<[ClipKind, string]> = [
    ['left', 'Sapu ke Kanan'],
    ['right', 'Sapu ke Kiri'],
    ['up', 'Sapu ke Atas'],
    ['down', 'Sapu ke Bawah'],
    ['center-h', 'Buka dari Tengah'],
    ['center-v', 'Buka Vertikal'],
    ['circle', 'Lingkaran Iris'],
    ['diagonal', 'Sapu Diagonal'],
  ];
  for (const [c, l] of clips) {
    for (const ev of EASE_VARIANTS) {
      add({ id: `wipe-${c}-${ev.key}`, name: `${l} · ${ev.label}`, group: 'reveal', kind: 'in', tags: ['wipe', 'reveal', 'mask'], easing: ev.easing === 'outBack' ? 'inOutQuart' : ev.easing, duration: 0.7, clip: c, from: {} });
    }
    add({ id: `wipe-${c}-geser`, name: `${l} + Geser`, group: 'reveal', kind: 'in', tags: ['wipe', 'reveal'], easing: 'outExpo', duration: 0.8, clip: c, from: { x: c === 'left' ? -60 : c === 'right' ? 60 : 0, y: c === 'up' ? 60 : c === 'down' ? -60 : 0 } });
  }

  // ---- Animasi teks: mode × gaya × kecepatan
  const textStyles: Array<[string, string, Partial<Pose>, Partial<TextAnimSpec>]> = [
    ['muncul', 'Muncul', { alpha: 0 }, {}],
    ['naik', 'Naik', { y: 60, alpha: 0 }, {}],
    ['turun', 'Turun', { y: -60, alpha: 0 }, {}],
    ['pop', 'Pop', { scale: 0.2, alpha: 0 }, {}],
    ['putar', 'Putar', { rot: -40, y: 30, alpha: 0 }, {}],
    ['blur', 'Blur', { blur: 14, alpha: 0 }, {}],
    ['jatuh', 'Jatuh', { y: -160, rot: 12, alpha: 0 }, {}],
    ['lebar', 'Melebar', { sx: 0, alpha: 0 }, {}],
    ['miring', 'Miring', { skew: 30, x: 40, alpha: 0 }, {}],
  ];
  const textModes: Array<[TextMode, string]> = [
    ['char', 'per Huruf'],
    ['word', 'per Kata'],
    ['line', 'per Baris'],
  ];
  const speeds: Array<[string, string, number, number]> = [
    ['cepat', 'Cepat', 0.6, 0.55],
    ['normal', 'Normal', 1.0, 0.4],
    ['lambat', 'Lambat', 1.6, 0.25],
  ];
  for (const [mk, ml] of textModes) {
    for (const [sk, sl, from] of textStyles) {
      for (const [spk, spl, dur, ov] of speeds) {
        add({
          id: `teks-${mk}-${sk}-${spk}`,
          name: `${sl} ${ml} · ${spl}`,
          group: 'teks',
          kind: 'in',
          tags: ['teks', mk, sk],
          easing: sk === 'pop' || sk === 'jatuh' ? 'outBack' : 'outCubic',
          duration: mk === 'char' ? dur * 1.2 : dur,
          from: {},
          text: { mode: mk, from, overlap: ov },
        });
      }
    }
  }
  for (const [spk, spl, dur] of speeds) {
    add({ id: `teks-ketik-${spk}`, name: `Mesin Ketik + Kursor · ${spl}`, group: 'teks', kind: 'in', tags: ['teks', 'ketik', 'typewriter'], easing: 'linear', duration: dur * 1.5, from: {}, text: { mode: 'char', from: { alpha: 0 }, overlap: 0, cursor: true } });
    add({ id: `teks-decode-${spk}`, name: `Decode Acak · ${spl}`, group: 'teks', kind: 'in', tags: ['teks', 'glitch', 'hacker'], easing: 'linear', duration: dur * 1.3, from: {}, text: { mode: 'char', from: { alpha: 0.4 }, overlap: 0.6, scramble: true } });
    add({ id: `teks-sorot-${spk}`, name: `Sorot Stabilo · ${spl}`, group: 'teks', kind: 'in', tags: ['teks', 'highlight', 'karaoke'], easing: 'outCubic', duration: dur * 1.2, from: {}, text: { mode: 'word', from: { alpha: 0.35 }, overlap: 0.2, highlight: true } });
  }

  // ---- Fisika: pantul & elastis
  for (const [k, l, f, e] of [
    ['jatuh-pantul', 'Jatuh Memantul', { y: -500 }, 'outBounce'],
    ['naik-pantul', 'Lompat Memantul', { y: 500 }, 'outBounce'],
    ['elastis', 'Elastis', { scale: 0 }, 'outElastic'],
    ['elastis-x', 'Elastis Melebar', { sx: 0 }, 'outElastic'],
    ['elastis-y', 'Elastis Meninggi', { sy: 0 }, 'outElastic'],
    ['pegas', 'Pegas', { scale: 0.3, y: 80 }, 'spring'],
    ['pegas-kiri', 'Pegas dari Kanan', { x: 300 }, 'spring'],
    ['pegas-kanan', 'Pegas dari Kiri', { x: -300 }, 'spring'],
    ['pegas-putar', 'Pegas Berputar', { rot: -90, scale: 0.4 }, 'spring'],
    ['snap', 'Snap Kilat', { scale: 0.6 }, 'snap'],
  ] as const) {
    for (const [dk, dl, mult] of [
      ['lembut', 'Lembut', 0.6],
      ['kuat', 'Kuat', 1],
    ] as const) {
      const f2: Partial<Pose> = {};
      Object.entries(f).forEach(([kk, vv]) => {
        const key = kk as keyof Pose;
        const base = IDENTITY[key];
        (f2 as Record<string, number>)[key] = base + ((vv as number) - base) * mult;
      });
      add({ id: `fisika-${k}-${dk}`, name: `${l} · ${dl}`, group: 'fisika', kind: 'in', tags: ['pantul', 'elastis', 'fisika'], easing: e as EasingId, duration: e === 'outBounce' ? 1 : 0.9, from: { ...f2, alpha: 0 } });
    }
  }

  // ---- Stylish (keyframes)
  const kfs: Array<[string, string, Keyframe[]]> = [
    ['glitch-masuk', 'Glitch Masuk', [
      { t: 0, alpha: 0, x: -30 }, { t: 0.15, alpha: 1, x: 24, skew: 20 }, { t: 0.3, x: -16, skew: -12 }, { t: 0.45, x: 8, skew: 0 }, { t: 1, x: 0 },
    ]],
    ['tumbuk', 'Tumbuk Layar', [{ t: 0, scale: 2.4, alpha: 0 }, { t: 0.5, scale: 0.92, alpha: 1, easing: 'inCubic' }, { t: 1, scale: 1, easing: 'outBack' }]],
    ['ayun', 'Ayunan Bandul', [{ t: 0, rot: -40, alpha: 0 }, { t: 0.4, rot: 20, alpha: 1 }, { t: 0.7, rot: -8 }, { t: 1, rot: 0 }]],
    ['jelly', 'Jelly', [{ t: 0, sx: 0.3, sy: 1.6, alpha: 0 }, { t: 0.35, sx: 1.3, sy: 0.75, alpha: 1 }, { t: 0.6, sx: 0.9, sy: 1.1 }, { t: 0.8, sx: 1.05, sy: 0.96 }, { t: 1, sx: 1, sy: 1 }]],
    ['karet', 'Karet', [{ t: 0, sx: 1, alpha: 0 }, { t: 0.3, sx: 1.35, sy: 0.75, alpha: 1 }, { t: 0.45, sx: 0.8, sy: 1.25 }, { t: 0.6, sx: 1.15, sy: 0.85 }, { t: 1, sx: 1, sy: 1 }]],
    ['tada', 'Tada!', [{ t: 0, scale: 0.6, alpha: 0 }, { t: 0.2, scale: 0.9, rot: -4, alpha: 1 }, { t: 0.4, scale: 1.12, rot: 4 }, { t: 0.6, rot: -4 }, { t: 0.8, rot: 3 }, { t: 1, scale: 1, rot: 0 }]],
    ['meluncur-rem', 'Meluncur + Rem', [{ t: 0, x: -700, skew: -25, alpha: 0 }, { t: 0.55, x: 30, skew: 12, alpha: 1 }, { t: 0.8, x: -8, skew: -4 }, { t: 1, x: 0, skew: 0 }]],
    ['meluncur-rem-kiri', 'Meluncur + Rem (Kanan)', [{ t: 0, x: 700, skew: 25, alpha: 0 }, { t: 0.55, x: -30, skew: -12, alpha: 1 }, { t: 0.8, x: 8, skew: 4 }, { t: 1, x: 0, skew: 0 }]],
    ['roket', 'Roket Naik', [{ t: 0, y: 700, sy: 1.6, sx: 0.7, alpha: 0 }, { t: 0.6, y: -30, sy: 0.9, sx: 1.08, alpha: 1 }, { t: 1, y: 0, sy: 1, sx: 1 }]],
    ['kilat', 'Kilat Kamera', [{ t: 0, alpha: 0, scale: 1.3, blur: 30 }, { t: 0.2, alpha: 1, scale: 1.05, blur: 0 }, { t: 1, scale: 1 }]],
    ['zoom-tembus', 'Zoom Tembus', [{ t: 0, scale: 6, alpha: 0, blur: 30 }, { t: 0.7, scale: 0.95, alpha: 1, blur: 0 }, { t: 1, scale: 1 }]],
    ['spiral', 'Spiral Masuk', [{ t: 0, rot: 540, scale: 0, alpha: 0 }, { t: 1, rot: 0, scale: 1, alpha: 1, easing: 'outCubic' }]],
    ['ombak', 'Ombak', [{ t: 0, y: 80, rot: -6, alpha: 0 }, { t: 0.35, y: -20, rot: 4, alpha: 1 }, { t: 0.7, y: 8, rot: -2 }, { t: 1, y: 0, rot: 0 }]],
    ['denyut-masuk', 'Denyut Masuk', [{ t: 0, scale: 0, alpha: 0 }, { t: 0.4, scale: 1.2, alpha: 1 }, { t: 0.55, scale: 0.95 }, { t: 0.7, scale: 1.08 }, { t: 1, scale: 1 }]],
  ];
  for (const [k, l, frames] of kfs) {
    for (const [sk, sl, d] of [
      ['cepat', 'Cepat', 0.55],
      ['normal', 'Normal', 0.9],
    ] as const) {
      add({ id: `gaya-${k}-${sk}`, name: `${l} · ${sl}`, group: 'stylish', kind: 'in', tags: ['stylish', k], easing: 'outCubic', duration: d, keyframes: frames });
    }
  }

  // ---- Loop / emphasis: 13 gelombang × 3 intensitas = 39
  const loops: Array<[string, string, LoopSpec['wave'], Partial<Pose>, number]> = [
    ['denyut', 'Denyut', 'pulse', { scale: 0.08 }, 1.2],
    ['detak', 'Detak Jantung', 'heartbeat', { scale: 0.12 }, 1.1],
    ['melayang', 'Melayang', 'sin', { y: 18 }, 2.4],
    ['goyang', 'Goyang', 'sin', { rot: 5 }, 1.6],
    ['getar', 'Getar', 'shake', { x: 8 }, 0.25],
    ['lompat', 'Lompat', 'bounce', { y: -40 }, 0.9],
    ['putar', 'Putar Terus', 'spin', { rot: 360 }, 4],
    ['kedip', 'Kedip', 'flash', { alpha: 0.6 }, 0.9],
    ['napas', 'Bernapas', 'sin', { scale: 0.04 }, 3],
    ['ayun', 'Ayun Kiri-Kanan', 'sin', { x: 22 }, 2],
    ['wobble', 'Wobble', 'wobble', { rot: 8, x: 10 }, 1.4],
    ['jelly', 'Jelly Loop', 'sin', { sx: 0.06, sy: -0.06 }, 0.9],
    ['zoom-pelan', 'Zoom Pelan', 'sin', { scale: 0.1 }, 5],
  ];
  for (const [k, l, wave, amp, period] of loops) {
    for (const [ik, il, m] of [
      ['lembut', 'Lembut', 0.5],
      ['sedang', 'Sedang', 1],
      ['kuat', 'Kuat', 1.8],
    ] as const) {
      const a: Partial<Pose> = {};
      Object.entries(amp).forEach(([kk, vv]) => ((a as Record<string, number>)[kk] = (vv as number) * (wave === 'spin' ? 1 : m)));
      add({ id: `loop-${k}-${ik}`, name: `${l} · ${il}`, group: 'loop', kind: 'loop', tags: ['loop', k], easing: 'linear', duration: period, loop: { wave, amp: a, period: wave === 'spin' ? period / m : period } });
    }
  }
  return L;
}

const LIB: AnimSpec[] = buildLibrary();
const BY_ID = new Map(LIB.map((a) => [a.id, a]));

export function allAnimations(kind?: 'in' | 'loop'): AnimSpec[] {
  return kind ? LIB.filter((a) => a.kind === kind) : LIB;
}
export function getAnimation(id?: string | null): AnimSpec | undefined {
  return id ? BY_ID.get(id) : undefined;
}
export function registerAnimation(spec: AnimSpec) {
  const idx = LIB.findIndex((a) => a.id === spec.id);
  if (idx >= 0) LIB[idx] = spec;
  else LIB.push(spec);
  BY_ID.set(spec.id, spec);
}
export function unregisterAnimation(id: string) {
  const idx = LIB.findIndex((a) => a.id === id);
  if (idx >= 0) LIB.splice(idx, 1);
  BY_ID.delete(id);
}

/* ------------------------------------------------------------------ */
/* Evaluasi                                                            */
/* ------------------------------------------------------------------ */
function lerpPose(a: Partial<Pose>, b: Partial<Pose>, t: number): Pose {
  const out = { ...IDENTITY };
  (Object.keys(IDENTITY) as Array<keyof Pose>).forEach((k) => {
    const va = a[k] ?? IDENTITY[k];
    const vb = b[k] ?? IDENTITY[k];
    out[k] = va + (vb - va) * t;
  });
  return out;
}

export function poseFromKeyframes(frames: Keyframe[], p: number): Pose {
  if (!frames.length) return { ...IDENTITY };
  const sorted = [...frames].sort((a, b) => a.t - b.t);
  if (p <= sorted[0].t) return lerpPose(sorted[0], sorted[0], 0);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (p <= b.t) {
      const local = (p - a.t) / Math.max(1e-6, b.t - a.t);
      // easing keyframe menimpa nilai a; kunci yang tidak disebut diwarisi dari frame sebelumnya
      const filledA: Partial<Pose> = {};
      const filledB: Partial<Pose> = {};
      (Object.keys(IDENTITY) as Array<keyof Pose>).forEach((k) => {
        let va: number | undefined;
        for (let j = i - 1; j >= 0 && va === undefined; j--) va = sorted[j][k];
        let vb: number | undefined = b[k];
        if (vb === undefined) {
          for (let j = i + 1; j < sorted.length && vb === undefined; j++) vb = sorted[j][k];
        }
        filledA[k] = va ?? IDENTITY[k];
        filledB[k] = vb ?? (k === 'alpha' ? 1 : filledA[k]);
      });
      return lerpPose(filledA, filledB, ease(b.easing || 'inOutSine', local));
    }
  }
  const last: Partial<Pose> = {};
  (Object.keys(IDENTITY) as Array<keyof Pose>).forEach((k) => {
    for (let j = sorted.length - 1; j >= 0 && last[k] === undefined; j--) last[k] = sorted[j][k];
  });
  return lerpPose(last, last, 0);
}

export interface InEval {
  pose: Pose;
  clip?: { kind: ClipKind; p: number };
  text?: { spec: TextAnimSpec; p: number; easing: EasingId };
}

/** p = 0..1 progres animasi masuk (untuk keluar, panggil dengan 1 - progres). */
export function evalIn(spec: AnimSpec, p: number): InEval {
  const t = clamp(p);
  if (spec.text) {
    return { pose: { ...IDENTITY }, text: { spec: spec.text, p: t, easing: spec.easing } };
  }
  if (spec.keyframes?.length) {
    return { pose: poseFromKeyframes(spec.keyframes, t) };
  }
  const e = ease(spec.easing, t);
  const pose = lerpPose(spec.from || {}, {}, e);
  // alpha tidak boleh overshoot
  pose.alpha = clamp((spec.from?.alpha ?? 1) + (1 - (spec.from?.alpha ?? 1)) * clamp(t * 1.8));
  if (spec.from?.alpha === undefined) pose.alpha = 1;
  if (spec.clip) return { pose, clip: { kind: spec.clip, p: e } };
  return { pose };
}

export function evalLoop(spec: AnimSpec, tSec: number): Pose {
  const pose = { ...IDENTITY };
  const lp = spec.loop;
  if (!lp) return pose;
  const ph = (tSec / Math.max(0.05, lp.period)) % 1;
  let w = 0;
  switch (lp.wave) {
    case 'sin':
      w = Math.sin(ph * Math.PI * 2);
      break;
    case 'pulse':
      w = (Math.sin(ph * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      break;
    case 'heartbeat':
      w = ph < 0.15 ? Math.sin((ph / 0.15) * Math.PI) : ph < 0.35 ? 0.6 * Math.sin(((ph - 0.2) / 0.15) * Math.PI) * (ph > 0.2 ? 1 : 0) : 0;
      break;
    case 'shake':
      w = Math.sin(ph * Math.PI * 2 * 3) * (1 - ((tSec * 0.7) % 1) * 0.3);
      break;
    case 'bounce':
      w = Math.abs(Math.sin(ph * Math.PI));
      break;
    case 'spin':
      w = ph;
      break;
    case 'flash':
      w = ph < 0.5 ? 0 : 1;
      break;
    case 'wobble':
      w = Math.sin(ph * Math.PI * 2) * Math.cos(ph * Math.PI * 4);
      break;
  }
  (Object.keys(lp.amp) as Array<keyof Pose>).forEach((k) => {
    const a = lp.amp[k] ?? 0;
    if (k === 'alpha') pose.alpha = 1 - a * w;
    else if (k === 'scale' || k === 'sx' || k === 'sy') pose[k] = 1 + a * w;
    else pose[k] = a * w;
  });
  return pose;
}

export function combinePose(a: Pose, b: Pose): Pose {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    scale: a.scale * b.scale,
    sx: a.sx * b.sx,
    sy: a.sy * b.sy,
    rot: a.rot + b.rot,
    alpha: a.alpha * b.alpha,
    blur: Math.max(a.blur, b.blur),
    skew: a.skew + b.skew,
  };
}

/* ------------------------------------------------------------------ */
/* Parser kode admin                                                   */
/* ------------------------------------------------------------------ */
const POSE_KEYS = Object.keys(IDENTITY) as Array<keyof Pose>;
function cleanPose(raw: unknown): Partial<Pose> {
  const out: Partial<Pose> = {};
  if (!raw || typeof raw !== 'object') return out;
  POSE_KEYS.forEach((k) => {
    const v = (raw as Record<string, unknown>)[k] ?? (raw as Record<string, unknown>)[k === 'alpha' ? 'opacity' : k === 'rot' ? 'rotate' : '_'];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.max(-5000, Math.min(5000, v));
  });
  return out;
}

export function parseAnimationCode(raw: string, fallbackName = 'Animasi Custom'): { ok: boolean; error?: string; spec?: AnimSpec } {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `JSON tidak valid: ${(e as Error).message}` };
  }
  if (!j || typeof j !== 'object') return { ok: false, error: 'Kode harus berupa objek JSON.' };
  const kind = j.kind === 'loop' ? 'loop' : 'in';
  const spec: AnimSpec = {
    id: String(j.id || `custom-anim-${Date.now()}`),
    name: String(j.name || fallbackName),
    group: 'custom',
    kind,
    tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(String) : ['custom'],
    easing: (typeof j.easing === 'string' ? j.easing : 'outCubic') as EasingId,
    duration: Math.max(0.1, Math.min(10, Number(j.duration) || 0.8)),
    author: 'admin',
  };
  if (kind === 'loop') {
    const lp = (j.loop || {}) as Record<string, unknown>;
    const waves = ['sin', 'pulse', 'shake', 'bounce', 'spin', 'flash', 'heartbeat', 'wobble'];
    spec.loop = {
      wave: (waves.includes(String(lp.wave)) ? lp.wave : 'sin') as LoopSpec['wave'],
      amp: cleanPose(lp.amp),
      period: Math.max(0.1, Number(lp.period) || spec.duration),
    };
    if (!Object.keys(spec.loop.amp).length) return { ok: false, error: 'loop.amp wajib diisi, contoh {"scale":0.08}.' };
    return { ok: true, spec };
  }
  if (Array.isArray(j.keyframes)) {
    spec.keyframes = (j.keyframes as unknown[])
      .map((k) => {
        const kk = k as Record<string, unknown>;
        return { ...cleanPose(kk), t: clampNum(Number(kk.t)), easing: typeof kk.easing === 'string' ? (kk.easing as EasingId) : undefined };
      })
      .filter((k) => Number.isFinite(k.t));
    if (spec.keyframes.length < 2) return { ok: false, error: 'keyframes minimal 2 titik (t: 0 dan t: 1).' };
  } else {
    spec.from = cleanPose(j.from);
  }
  if (typeof j.clip === 'string') spec.clip = j.clip as ClipKind;
  if (j.text && typeof j.text === 'object') {
    const t = j.text as Record<string, unknown>;
    spec.text = {
      mode: (['char', 'word', 'line'].includes(String(t.mode)) ? t.mode : 'word') as TextMode,
      from: cleanPose(t.from),
      overlap: clampNum(Number(t.overlap ?? 0.4)),
      scramble: !!t.scramble,
      cursor: !!t.cursor,
      highlight: !!t.highlight,
    };
  }
  if (!spec.keyframes && !spec.text && !spec.clip && !Object.keys(spec.from || {}).length) {
    return { ok: false, error: 'Isi salah satu: "from", "keyframes", "clip", atau "text".' };
  }
  return { ok: true, spec };
}
function clampNum(v: number) {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

export const ANIMATION_CODE_EXAMPLE = `{
  "name": "Lompat Masuk Miring",
  "kind": "in",
  "duration": 0.8,
  "keyframes": [
    { "t": 0,   "y": 300, "rot": -20, "alpha": 0 },
    { "t": 0.6, "y": -30, "rot": 6,   "alpha": 1, "easing": "outCubic" },
    { "t": 1,   "y": 0,   "rot": 0,   "easing": "outBack" }
  ]
}`;
