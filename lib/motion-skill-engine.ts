/**
 * MotionID v4.5 — Claude Opus 5.5 Motion Skill & CapCut AI Lab Choreographer
 * Mengimplementasikan Hooke's Law Damped Spring Solver (F = -kx - cv),
 * simulasi kursor otomatis (Bezier Pointer Path + Shockwave Ripple),
 * serta Virtual 3D Camera Focus Zoom & Staggered Word Reveal.
 */

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function solveSpring(
  t: number,
  { stiffness = 210, damping = 15, mass = 1 }: SpringConfig = {}
): number {
  const clamped = Math.max(0, Math.min(2.5, t));
  if (clamped <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * w0 * clamped);
    return 1 - env * (Math.cos(wd * clamped) + ((zeta * w0) / wd) * Math.sin(wd * clamped));
  }
  return 1 - (1 + w0 * clamped) * Math.exp(-w0 * clamped);
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

export interface CursorKeyframeState {
  x: number;
  y: number;
  isPressed: boolean;
  rippleProgress: number;
}

export function computeCursorChoreography(
  progress: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): CursorKeyframeState {
  const moveT = smoothStep(0.36, 0.55, progress);
  const arcLift = Math.sin(moveT * Math.PI) * 18;
  return {
    x: startX + (targetX - startX) * moveT,
    y: startY + (targetY - startY) * moveT - arcLift,
    isPressed: progress > 0.54 && progress < 0.63,
    rippleProgress: smoothStep(0.55, 0.78, progress),
  };
}
