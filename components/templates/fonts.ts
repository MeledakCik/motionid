import type { FontFamilyName } from '@/store/useEditorStore';

/**
 * next/font mengganti nama family jadi hash internal, jadi `font-family: Poppins`
 * tidak pernah cocok. Gunakan CSS variable yang didaftarkan di app/layout.tsx.
 */
const FONT_VARS: Record<FontFamilyName, { cssVar: string; fallback: string }> = {
  Poppins: { cssVar: '--font-poppins', fallback: 'sans-serif' },
  Montserrat: { cssVar: '--font-montserrat', fallback: 'sans-serif' },
  'Bebas Neue': { cssVar: '--font-bebas', fallback: 'Impact, sans-serif' },
  'Playfair Display': { cssVar: '--font-playfair', fallback: 'Georgia, serif' },
  'Space Grotesk': { cssVar: '--font-space', fallback: 'sans-serif' },
  Anton: { cssVar: '--font-anton', fallback: 'Impact, sans-serif' },
};

/** Untuk properti CSS `fontFamily` di React. */
export function fontStack(font: FontFamilyName): string {
  const f = FONT_VARS[font] || FONT_VARS.Poppins;
  return `var(${f.cssVar}), ${f.fallback}`;
}

/** Untuk `ctx.font` di canvas: baca nilai variable yang sudah di-resolve browser. */
export function resolveCanvasFamily(font: FontFamilyName): string {
  const f = FONT_VARS[font] || FONT_VARS.Poppins;
  if (typeof document === 'undefined') return f.fallback;
  const resolved = getComputedStyle(document.body).getPropertyValue(f.cssVar).trim();
  return resolved ? `${resolved}, ${f.fallback}` : f.fallback;
}

/** Pastikan font sudah terunduh sebelum dipakai menggambar di canvas. */
export async function ensureCanvasFont(font: FontFamilyName) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const family = resolveCanvasFamily(font);
  try {
    await Promise.all([
      document.fonts.load(`400 40px ${family}`),
      document.fonts.load(`700 40px ${family}`),
      document.fonts.load(`800 40px ${family}`),
    ]);
  } catch {
    // lanjut dengan fallback
  }
}
