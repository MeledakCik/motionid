/** Utilitas tata letak teks untuk kanvas. */
export function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

/** Kecilkan font sampai teks muat di kotak. */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  maxW: number,
  maxH: number,
  startPx: number,
  minPx = 12,
  lh = 1.15,
  italic = false
): { px: number; lines: string[]; lineH: number } {
  let px = startPx;
  let lines: string[] = [];
  const it = italic ? 'italic ' : '';
  for (; px > minPx; px -= Math.max(1, px * 0.06)) {
    ctx.font = `${it}${weight} ${px}px ${family}`;
    lines = wrapLines(ctx, text, maxW);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * px * lh <= maxH && widest <= maxW * 1.02) return { px, lines, lineH: px * lh };
  }
  px = minPx;
  ctx.font = `${it}${weight} ${px}px ${family}`;
  lines = wrapLines(ctx, text, maxW);
  return { px, lines, lineH: px * lh };
}

export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { family: string; weight: number; color: string; size: number; min?: number; align?: CanvasTextAlign; valign?: 'top' | 'middle' | 'bottom'; lh?: number; upper?: boolean }
) {
  const t = o.upper ? text.toUpperCase() : text;
  const fit = fitText(ctx, t, o.family, o.weight, w, h, o.size, o.min ?? 10, o.lh ?? 1.15);
  ctx.fillStyle = o.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = o.align || 'left';
  const total = fit.lines.length * fit.lineH;
  const y0 = o.valign === 'top' ? y : o.valign === 'bottom' ? y + h - total : y + (h - total) / 2;
  const ax = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
  fit.lines.forEach((ln, i) => ctx.fillText(ln, ax, y0 + fit.lineH * (i + 0.5)));
  return fit;
}
