/** Utilitas warna kecil untuk renderer. */
export function parseHex(color: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(color: string, a: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0, Math.min(1, a))})`;
}

export function luminance(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Hitam atau putih, mana yang lebih kontras di atas `bg`. */
export function readableOn(bg: string, dark = '#14100E', light = '#FFFFFF'): string {
  return luminance(bg) > 0.42 ? dark : light;
}

export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  if (!x || !y) return a;
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function shade(color: string, amt: number): string {
  return amt >= 0 ? mix(color, '#FFFFFF', amt) : mix(color, '#000000', -amt);
}
