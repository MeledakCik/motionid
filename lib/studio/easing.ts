/** Kumpulan easing (t: 0..1 -> 0..1, boleh overshoot untuk back/elastic). */
export type EasingId =
  | 'linear'
  | 'inOutSine'
  | 'outSine'
  | 'outQuad'
  | 'inOutQuad'
  | 'outCubic'
  | 'inCubic'
  | 'inOutCubic'
  | 'outQuart'
  | 'inOutQuart'
  | 'outExpo'
  | 'inExpo'
  | 'inOutExpo'
  | 'outBack'
  | 'inOutBack'
  | 'outElastic'
  | 'outBounce'
  | 'spring'
  | 'snap';

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

function outBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export const EASINGS: Record<EasingId, (t: number) => number> = {
  linear: (t) => t,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  inOutBack: (t) =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,
  outElastic: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  outBounce,
  spring: (t) => 1 - Math.exp(-6.5 * t) * Math.cos(t * 11),
  snap: (t) => (t < 0.7 ? 1.06 * (1 - Math.pow(1 - t / 0.7, 3)) : 1.06 - 0.06 * ((t - 0.7) / 0.3)),
};

export function ease(id: EasingId | string | undefined, t: number): number {
  const f = EASINGS[(id as EasingId) || 'outCubic'] || EASINGS.outCubic;
  return f(Math.min(1, Math.max(0, t)));
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** angka acak deterministik 0..1 */
export function hash01(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
