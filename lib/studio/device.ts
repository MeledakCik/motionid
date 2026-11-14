/**
 * Deteksi kemampuan perangkat supaya HP menengah ke bawah tetap lancar:
 * resolusi preview, jumlah partikel, efek blur, dan FPS preview disesuaikan.
 */
export interface DeviceProfile {
  tier: 'low' | 'mid' | 'high';
  /** lebar maksimum kanvas preview (piksel) */
  previewMaxW: number;
  previewFps: number;
  allowBlur: boolean;
  particleScale: number;
}

let cached: DeviceProfile | null = null;

export function getDeviceProfile(): DeviceProfile {
  if (cached) return cached;
  if (typeof navigator === 'undefined') {
    return { tier: 'mid', previewMaxW: 540, previewFps: 30, allowBlur: true, particleScale: 0.7 };
  }
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
  const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;

  let tier: DeviceProfile['tier'] = 'high';
  if (mem <= 3 || cores <= 4 || saveData) tier = 'low';
  else if (mobile || mem <= 6 || cores <= 6) tier = 'mid';

  cached =
    tier === 'low'
      ? { tier, previewMaxW: 360, previewFps: 30, allowBlur: false, particleScale: 0.35 }
      : tier === 'mid'
      ? { tier, previewMaxW: 540, previewFps: 30, allowBlur: true, particleScale: 0.7 }
      : { tier, previewMaxW: 720, previewFps: 60, allowBlur: true, particleScale: 1 };
  return cached;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
