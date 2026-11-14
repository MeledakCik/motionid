import type { FontId } from './types';

/**
 * next/font mengganti nama family menjadi hash, jadi kanvas harus membaca nilai
 * CSS variable yang didaftarkan di app/layout.tsx.
 */
const FONT_VARS: Record<FontId, { cssVar: string; fallback: string; label: string }> = {
  Poppins: { cssVar: '--font-poppins', fallback: 'sans-serif', label: 'Poppins' },
  Montserrat: { cssVar: '--font-montserrat', fallback: 'sans-serif', label: 'Montserrat' },
  'Bebas Neue': { cssVar: '--font-bebas', fallback: 'Impact, sans-serif', label: 'Bebas Neue' },
  'Playfair Display': { cssVar: '--font-playfair', fallback: 'Georgia, serif', label: 'Playfair' },
  'Space Grotesk': { cssVar: '--font-space', fallback: 'sans-serif', label: 'Space Grotesk' },
  Anton: { cssVar: '--font-anton', fallback: 'Impact, sans-serif', label: 'Anton' },
  'Plus Jakarta Sans': { cssVar: '--font-jakarta', fallback: 'sans-serif', label: 'Jakarta Sans' },
};

export const FONT_LIST = Object.keys(FONT_VARS) as FontId[];
export const fontLabel = (f: FontId) => FONT_VARS[f]?.label || f;

const resolvedCache = new Map<FontId, string>();

export function fontStack(font: FontId): string {
  const f = FONT_VARS[font] || FONT_VARS.Poppins;
  return `var(${f.cssVar}), ${f.fallback}`;
}

export function canvasFamily(font: FontId): string {
  const hit = resolvedCache.get(font);
  if (hit) return hit;
  const f = FONT_VARS[font] || FONT_VARS.Poppins;
  if (typeof document === 'undefined') return f.fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(f.cssVar).trim();
  const fam = resolved ? `${resolved}, ${f.fallback}` : f.fallback;
  if (resolved) resolvedCache.set(font, fam);
  return fam;
}

export async function ensureFonts(fonts: FontId[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const uniq = Array.from(new Set(fonts));
  try {
    await Promise.all(
      uniq.flatMap((f) => {
        const fam = canvasFamily(f);
        return [400, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${fam}`).catch(() => []));
      })
    );
  } catch {
    // pakai fallback
  }
}
