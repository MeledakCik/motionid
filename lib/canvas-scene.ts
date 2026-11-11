import type { AnimationType, GeneratedScriptResult } from './smart-engine';
import type { ProjectStyleConfig, TemplateId } from '@/store/useEditorStore';

/**
 * Renderer canvas untuk export video. Dibuat mengikuti gaya preview:
 * teks muncul kata demi kata, gambar Ken Burns, partikel, push-in kamera,
 * wipe + light sweep antar scene. Tiga layout: Quote (Q*), Promo (P*), Edukasi (E*).
 */

export interface FrameOptions {
  script: GeneratedScriptResult;
  style: ProjectStyleConfig;
  templateId: TemplateId;
  sceneIdx: number;
  sceneElapsed: number;
  sceneDur: number;
  elapsedSec: number;
  overallProgress: number;
  images: Map<string, HTMLImageElement | null>;
  family: string;
}

/* ---------------------------- util ---------------------------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function rgba(color: string, a: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || '').trim());
  if (!m) return `rgba(255,255,255,${a})`;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2 + panX, y + (h - dh) / 2 + panY, dw, dh);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  family: string,
  maxW: number,
  startPx: number,
  minPx: number,
  lhRatio: number,
  maxH: number
) {
  let px = startPx;
  let lines: string[] = [];
  for (; px >= minPx; px -= 2) {
    ctx.font = `${weight} ${px}px ${family}`;
    lines = wrapLines(ctx, text, maxW);
    if (lines.length * px * lhRatio <= maxH) break;
  }
  px = Math.max(px, minPx);
  ctx.font = `${weight} ${px}px ${family}`;
  lines = wrapLines(ctx, text, maxW);
  return { px, lines, lh: px * lhRatio };
}

/* --------------------- teks kata demi kata --------------------- */
function stepFor(anim: AnimationType) {
  return anim === 'typewriter' ? 0.07 : 0.085;
}

export const revealCursor = { x: 0, y: 0, h: 0 };

/** Menggambar baris teks dengan reveal per kata. Mengembalikan waktu selesai (detik). */
function drawReveal(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y0: number,
  lh: number,
  align: 'center' | 'left',
  t: number,
  anim: AnimationType,
  color: string,
  accent: string,
  startDelay = 0.08,
  highlightCaps = true,
  opts: { mode?: 'reveal' | 'karaoke'; step?: number } = {}
): number {
  const step = opts.step ?? stepFor(anim);
  const karaoke = opts.mode === 'karaoke';
  const dur = anim === 'typewriter' ? 0.12 : 0.5;
  const spaceW = ctx.measureText(' ').width;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let idx = 0;
  lines.forEach((line, li) => {
    const words = line.split(' ');
    const widths = words.map((w) => ctx.measureText(w).width);
    const lineW = widths.reduce((a, b) => a + b, 0) + spaceW * (words.length - 1);
    let cursor = align === 'center' ? x - lineW / 2 : x;
    const y = y0 + li * lh;

    words.forEach((word, wi) => {
      const p = clamp((t - startDelay - idx * step) / dur);
      const ww = widths[wi];
      if (karaoke) {
        const since = t - (startDelay + idx * step);
        const current = since >= 0 && since < 0.3;
        const sc = current ? 1 + 0.12 * Math.sin((since / 0.3) * Math.PI) : 1;
        ctx.save();
        ctx.globalAlpha *= since >= 0 ? 1 : 0.25;
        ctx.translate(cursor + ww / 2, y);
        ctx.scale(sc, sc);
        ctx.fillStyle = current ? accent : color;
        ctx.fillText(word, 0, 0);
        ctx.restore();
        if (since >= 0) {
          revealCursor.x = cursor + ww;
          revealCursor.y = y;
        }
      } else if (p > 0) {
        let alpha = 1;
        let dy = 0;
        let sc = 1;
        switch (anim) {
          case 'pop':
            sc = 0.4 + 0.6 * easeOutBack(p);
            alpha = clamp(p * 3);
            break;
          case 'bounce':
            dy = -50 * (1 - easeOutBounce(p));
            alpha = clamp(p * 4);
            break;
          case 'zoom':
            sc = 1.8 - 0.8 * easeOutCubic(p);
            alpha = easeOutCubic(p);
            break;
          case 'slide-up':
            dy = 34 * (1 - easeOutCubic(p));
            alpha = easeOutCubic(p);
            break;
          case 'typewriter':
            alpha = 1;
            break;
          default:
            dy = 10 * (1 - easeOutCubic(p));
            alpha = easeOutCubic(p);
        }
        const important = highlightCaps ? /\d|^[A-Z0-9!?]{3,}$/.test(word) : /\d/.test(word);
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.translate(cursor + ww / 2, y + dy);
        ctx.scale(sc, sc);
        ctx.fillStyle = important ? accent : color;
        ctx.fillText(word, 0, 0);
        ctx.restore();
        revealCursor.x = cursor + ww;
        revealCursor.y = y + dy;
      }
      cursor += ww + spaceW;
      idx += 1;
    });
  });
  return startDelay + idx * step + dur;
}

/* --------------------------- latar --------------------------- */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  o: FrameOptions,
  sceneImg: HTMLImageElement | null,
  fullBleed: boolean
) {
  const { style, elapsedSec, sceneElapsed, sceneDur } = o;
  const c = style.colors;

  if (style.backgroundType === 'solid') {
    ctx.fillStyle = style.solidColor || c.bgPrimary;
    ctx.fillRect(0, 0, W, H);
  } else if (fullBleed && sceneImg) {
    const p = clamp(sceneElapsed / (sceneDur + 0.5));
    drawCover(ctx, sceneImg, 0, 0, W, H, 1.02 + 0.16 * p, 14 * p, -8 * p);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(5,8,20,0.55)');
    g.addColorStop(1, 'rgba(5,8,20,0.78)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const a = elapsedSec * 0.18;
    const dx = Math.cos(a) * W * 0.6;
    const dy = Math.sin(a) * H * 0.6;
    const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    g.addColorStop(0, c.bgPrimary);
    g.addColorStop(1, c.bgSecondary);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Aurora orbs
  for (let k = 0; k < 3; k++) {
    const x = W * (0.15 + 0.35 * k) + Math.sin(elapsedSec * 0.7 + k * 2) * W * 0.08;
    const y = H * (0.2 + 0.28 * k) + Math.cos(elapsedSec * 0.6 + k) * H * 0.06;
    const r = W * 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(k === 1 ? c.bgSecondary : c.accentColor, k === 1 ? 0.35 : 0.26));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Partikel naik
  const count = 18;
  for (let i = 0; i < count; i++) {
    const speed = 40 + seeded(i, 3) * 70;
    const size = 2.5 + seeded(i, 2) * 6;
    const yy = H + 20 - ((elapsedSec * speed + seeded(i, 4) * H * 1.4) % (H + 40));
    const xx = seeded(i, 1) * W + Math.sin(elapsedSec + i) * 14;
    const life = clamp(yy / H);
    ctx.globalAlpha = Math.sin(life * Math.PI) * (0.25 + seeded(i, 6) * 0.45);
    ctx.fillStyle = c.accentColor;
    ctx.beginPath();
    ctx.arc(xx, yy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ------------------------- layout Quote ------------------------- */
function drawQuote(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, elapsedSec, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const cx = W / 2;
  const maxW = W * 0.82;

  const fit = fitLines(ctx, scene.text, 800, family, maxW, 58 * u, 34 * u, 1.28, H * 0.5);
  const lines = fit.lines;
  const lh = fit.lh;
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${28 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, W * 0.7) : [];
  const subLh = 40 * u;

  const emojiH = style.showEmoji ? 96 * u : 0;
  const pillH = 46 * u;
  const blockH = emojiH + pillH + 28 * u + lines.length * lh + (hasSub ? 40 * u + subLines.length * subLh : 0);
  let y = (H - blockH) / 2;

  if (style.showEmoji && scene.emoji) {
    const bob = Math.sin(elapsedSec * 2.4) * 8 * u;
    const e = easeOutBack(clamp(t / 0.5));
    ctx.save();
    ctx.translate(cx, y + 48 * u + bob);
    ctx.scale(e, e);
    ctx.font = `${72 * u}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji, 0, 0);
    ctx.restore();
  }
  y += emojiH;

  // Role pill
  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp((t - 0.1) / 0.4));
  ctx.font = `700 ${20 * u}px ${family}`;
  setLetterSpacing(ctx, 5 * u);
  const roleText = scene.role.toUpperCase();
  const rw = ctx.measureText(roleText).width + 48 * u;
  roundRect(ctx, cx - rw / 2, y, rw, pillH, pillH / 2);
  ctx.strokeStyle = rgba('#ffffff', 0.25);
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.fillStyle = c.accentColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, cx, y + pillH / 2 + 1);
  setLetterSpacing(ctx, 0);
  ctx.restore();
  y += pillH + 28 * u;

  // Teks utama
  ctx.save();
  ctx.font = `800 ${fit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18 * u;
  const isQ2 = o.templateId === 'Q2';
  const isQ3 = o.templateId === 'Q3';
  const nWords = scene.text.split(/\s+/).length;
  const end = drawReveal(
    ctx, lines, cx, y + lh / 2, lh, 'center', t,
    isQ2 ? 'typewriter' : scene.animation,
    c.textColor, c.accentColor, 0.08, true,
    isQ3
      ? { mode: 'karaoke', step: Math.max(0.12, (o.sceneDur * 0.72) / nWords) }
      : isQ2
      ? { step: Math.max(0.05, Math.min(0.12, (o.sceneDur * 0.6) / nWords)) }
      : {}
  );
  if (isQ2 && Math.floor(elapsedSec * 2.2) % 2 === 0) {
    ctx.fillStyle = c.accentColor;
    ctx.fillRect(revealCursor.x + 6 * u, revealCursor.y - fit.px * 0.5, 4 * u, fit.px);
  }
  ctx.restore();
  y += lines.length * lh;

  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end + 0.1) / 0.5));
    y += 14 * u;
    ctx.fillStyle = c.accentColor;
    ctx.fillRect(cx - 60 * u * sp, y, 120 * u * sp, 3 * u);
    y += 26 * u;
    ctx.save();
    ctx.globalAlpha = sp * 0.9;
    ctx.font = `500 ${28 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, cx, y + i * subLh + (1 - sp) * 14 * u));
    ctx.restore();
  }
}

/* ------------------------- layout Promo ------------------------- */
function drawPromoJumbo(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  u: number,
  o: FrameOptions,
  sceneImg: HTMLImageElement | null
) {
  const { script, style, sceneIdx, sceneElapsed: t, sceneDur, elapsedSec, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const cx = W / 2;
  const pad = 48 * u;

  // Baris atas: toko + sticker diskon
  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp(t / 0.4));
  ctx.font = `700 ${22 * u}px ${family}`;
  setLetterSpacing(ctx, 2 * u);
  const store = script.extractedMeta.storeName.toUpperCase();
  const sw = ctx.measureText(store).width + 40 * u;
  roundRect(ctx, pad, H * 0.055, sw, 52 * u, 26 * u);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.fillStyle = c.textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(store, pad + 20 * u, H * 0.055 + 27 * u);
  setLetterSpacing(ctx, 0);
  ctx.restore();

  // Sticker DISKON berdenyut
  ctx.save();
  const pulse = 1 + Math.sin(elapsedSec * 7) * 0.07;
  ctx.translate(W - pad - 130 * u, H * 0.055 + 26 * u);
  ctx.rotate(Math.sin(elapsedSec * 7) * 0.07);
  ctx.scale(pulse * easeOutBack(clamp(t / 0.5)), pulse * easeOutBack(clamp(t / 0.5)));
  ctx.font = `900 ${22 * u}px ${family}`;
  const label = '⚡ DISKON SPESIAL!';
  const lw = ctx.measureText(label).width + 44 * u;
  roundRect(ctx, -lw / 2, -27 * u, lw, 54 * u, 27 * u);
  ctx.fillStyle = c.accentColor;
  ctx.shadowColor = rgba(c.accentColor, 0.6);
  ctx.shadowBlur = 18 * u;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.badgeTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 2);
  ctx.restore();

  // Kartu gambar produk
  const cs = Math.min(W * 0.5, H * 0.3);
  const cardX = cx - cs / 2;
  const cardY = H * 0.14;
  const cardP = easeOutBack(clamp((t - 0.1) / 0.6));
  ctx.save();
  ctx.translate(cx, cardY + cs / 2);
  ctx.scale(cardP, cardP);
  ctx.translate(-cx, -(cardY + cs / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40 * u;
  roundRect(ctx, cardX, cardY, cs, cs, 44 * u);
  ctx.fillStyle = c.bgSecondary;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  roundRect(ctx, cardX, cardY, cs, cs, 44 * u);
  ctx.clip();
  if (sceneImg) {
    const p = clamp(t / (sceneDur + 1));
    drawCover(ctx, sceneImg, cardX, cardY, cs, cs, 1.02 + 0.16 * p, 14 * p * (sceneIdx % 2 ? -1 : 1), -8 * p);
  } else {
    const g = ctx.createLinearGradient(cardX, cardY, cardX + cs, cardY + cs);
    g.addColorStop(0, c.accentColor);
    g.addColorStop(1, c.bgSecondary);
    ctx.fillStyle = g;
    ctx.fillRect(cardX, cardY, cs, cs);
    ctx.font = `${cs * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji || '✨', cx, cardY + cs / 2 + Math.sin(elapsedSec * 2) * 8 * u);
  }
  ctx.restore();
  roundRect(ctx, cardX, cardY, cs, cs, 44 * u);
  ctx.lineWidth = 8 * u;
  ctx.strokeStyle = c.accentColor;
  ctx.stroke();
  if (style.showEmoji && sceneImg && scene.emoji) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(cardX + cs - 38 * u, cardY + cs - 38 * u, 30 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${34 * u}px sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji, cardX + cs - 38 * u, cardY + cs - 36 * u);
  }
  ctx.restore();

  // Panel headline + harga
  const pfit = fitLines(ctx, scene.text.toUpperCase(), 900, family, W - pad * 2 - 56 * u, 46 * u, 30 * u, 1.26, H * 0.2);
  const lines = pfit.lines;
  const lh = pfit.lh;
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${26 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, W - pad * 2 - 56 * u) : [];
  const priceH = 96 * u;
  const panelH = 36 * u + lines.length * lh + 20 * u + priceH + (hasSub ? 18 * u + subLines.length * 36 * u : 0) + 24 * u;
  const panelY = cardY + cs + 36 * u;
  const slide = easeOutCubic(clamp((t - 0.2) / 0.5));
  ctx.save();
  ctx.globalAlpha = slide;
  ctx.translate(0, (1 - slide) * 40 * u);
  roundRect(ctx, pad, panelY, W - pad * 2, panelH, 36 * u);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `900 ${pfit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12 * u;
  const end = drawReveal(ctx, lines, cx, panelY + 36 * u + lh / 2, lh, 'center', t, scene.animation, c.textColor, c.accentColor, 0.25, false);
  ctx.restore();

  // Badge harga pop
  const pp = easeOutBack(clamp((t - Math.min(end, 1.2) + 0.1) / 0.5));
  const priceY = panelY + 36 * u + lines.length * lh + 20 * u;
  ctx.save();
  ctx.translate(cx, priceY + priceH / 2);
  ctx.scale(Math.max(0.001, pp), Math.max(0.001, pp));
  ctx.font = `900 ${60 * u}px ${family}`;
  const price = script.extractedMeta.priceText;
  const pw = ctx.measureText(price).width + 64 * u;
  roundRect(ctx, -pw / 2, -priceH / 2, pw, priceH, 28 * u);
  ctx.fillStyle = c.accentColor;
  ctx.shadowColor = rgba(c.accentColor, 0.5);
  ctx.shadowBlur = 22 * u;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.badgeTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(price, 0, 3 * u);
  ctx.restore();

  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end - 0.2) / 0.5));
    ctx.save();
    ctx.globalAlpha = sp * 0.92;
    ctx.font = `500 ${26 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, cx, priceY + priceH + 34 * u + i * 36 * u));
    ctx.restore();
  }
}

/* ------------------------ layout Edukasi ------------------------ */
function drawEdukasi(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const pad = 64 * u;
  const total = script.scenes.length;
  const n = sceneIdx + 1;

  // Watermark angka besar
  ctx.save();
  ctx.globalAlpha = 0.09 * easeOutCubic(clamp(t / 0.6));
  ctx.font = `900 ${420 * u}px ${family}`;
  ctx.fillStyle = c.accentColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`0${n}`, W + 30 * u - (1 - easeOutCubic(clamp(t / 0.8))) * 80 * u, -40 * u);
  ctx.restore();

  // Badge langkah
  const bp = easeOutBack(clamp(t / 0.5));
  ctx.save();
  ctx.translate(pad + 42 * u, H * 0.09 + 42 * u);
  ctx.scale(bp, bp);
  roundRect(ctx, -42 * u, -42 * u, 84 * u, 84 * u, 26 * u);
  ctx.fillStyle = c.accentColor;
  ctx.shadowColor = rgba(c.accentColor, 0.5);
  ctx.shadowBlur = 20 * u;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.badgeTextColor;
  ctx.font = `900 ${46 * u}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 0, 3 * u);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp((t - 0.15) / 0.4));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${18 * u}px ${family}`;
  setLetterSpacing(ctx, 4 * u);
  ctx.fillStyle = rgba(c.textColor, 0.7);
  ctx.fillText(`LANGKAH ${n} DARI ${total}`, pad + 110 * u, H * 0.09 + 24 * u);
  setLetterSpacing(ctx, 0);
  ctx.font = `800 ${26 * u}px ${family}`;
  ctx.fillStyle = c.accentColor;
  ctx.fillText(scene.role, pad + 110 * u, H * 0.09 + 60 * u);
  ctx.restore();

  // Teks utama (rata kiri)
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${27 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, W - pad * 2 - 64 * u) : [];
  const subLh = 38 * u;
  const emojiH = style.showEmoji ? 90 * u : 0;
  const subH = hasSub ? 44 * u + subLines.length * subLh : 0;
  const availH = H - 130 * u - H * 0.2 - emojiH - subH - 30 * u;
  const efit = fitLines(ctx, scene.text, 800, family, W - pad * 2, 56 * u, 32 * u, 1.28, Math.max(availH, 120 * u));
  const lines = efit.lines;
  const lh = efit.lh;
  const blockH = emojiH + lines.length * lh + subH;
  let y = Math.max(H * 0.2, (H - blockH) / 2);

  if (style.showEmoji && scene.emoji) {
    const e = easeOutBack(clamp((t - 0.1) / 0.5));
    ctx.save();
    ctx.translate(pad + 36 * u, y + 36 * u);
    ctx.scale(e, e);
    ctx.rotate(Math.sin(o.elapsedSec * 2) * 0.08);
    ctx.font = `${64 * u}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji, 0, 0);
    ctx.restore();
  }
  y += emojiH;

  ctx.save();
  ctx.font = `800 ${efit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 14 * u;
  const end = drawReveal(ctx, lines, pad, y + lh / 2, lh, 'left', t, scene.animation, c.textColor, c.accentColor);
  ctx.restore();
  y += lines.length * lh + 30 * u;

  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end + 0.1) / 0.5));
    const bh = subLines.length * subLh + 40 * u;
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.translate((1 - sp) * -40 * u, 0);
    roundRect(ctx, pad, y, W - pad * 2, bh, 22 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill();
    ctx.fillStyle = c.accentColor;
    ctx.fillRect(pad, y + 6 * u, 8 * u, bh - 12 * u);
    ctx.font = `500 ${27 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, pad + 36 * u, y + 20 * u + subLh / 2 + i * subLh));
    ctx.restore();
  }

  // Indikator langkah
  const dotY = H - 110 * u;
  let dx = pad;
  for (let i = 0; i < total; i++) {
    const active = i === sceneIdx;
    const w = active ? 64 * u : 20 * u;
    roundRect(ctx, dx, dotY, w, 10 * u, 5 * u);
    ctx.fillStyle = active ? c.accentColor : 'rgba(255,255,255,0.28)';
    ctx.fill();
    dx += w + 12 * u;
  }
}


/* ----------------- helper kartu kaca + pill ----------------- */
function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill = 0.1) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = `rgba(255,255,255,${fill})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  u: number,
  family: string,
  bg: string,
  fg: string,
  align: 'left' | 'center' = 'left',
  scale = 1
) {
  ctx.save();
  ctx.font = `900 ${20 * u}px ${family}`;
  setLetterSpacing(ctx, 2 * u);
  const w = ctx.measureText(text).width + 44 * u;
  const h = 48 * u;
  const px = align === 'center' ? x - w / 2 : x;
  ctx.translate(px + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  roundRect(ctx, -w / 2, -h / 2, w, h, 14 * u);
  ctx.fillStyle = bg;
  ctx.shadowColor = rgba(bg, 0.5);
  ctx.shadowBlur = 18 * u;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2 * u);
  setLetterSpacing(ctx, 0);
  ctx.restore();
  return { w, h };
}

/* ---------------------- P2: Before / After ---------------------- */
function drawPromoBA(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const pad = 48 * u;
  const meta = script.extractedMeta;

  pill(ctx, 'BANDINGKAN HARGANYA', pad, H * 0.11, u, family, c.accentColor, c.badgeTextColor, 'left', easeOutBack(clamp(t / 0.45)));
  if (style.showEmoji) {
    ctx.save();
    ctx.font = `${50 * u}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = easeOutCubic(clamp((t - 0.1) / 0.4));
    ctx.fillText(scene.emoji, W - pad, H * 0.11 + 26 * u);
    ctx.restore();
  }

  const fit = fitLines(ctx, scene.text, 800, family, W - pad * 2, 52 * u, 32 * u, 1.28, H * 0.22);
  ctx.save();
  ctx.font = `800 ${fit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12 * u;
  const end = drawReveal(ctx, fit.lines, pad, H * 0.11 + 100 * u, fit.lh, 'left', t, scene.animation, c.textColor, c.accentColor);
  ctx.restore();

  let y = H * 0.11 + 100 * u + fit.lines.length * fit.lh + 10 * u;
  const cw = (W - pad * 2 - 20 * u) / 2;
  const ch = 150 * u;
  const lp = easeOutCubic(clamp((t - 0.35) / 0.5));
  ctx.save();
  ctx.globalAlpha = lp;
  ctx.translate(-(1 - lp) * 60 * u, 0);
  glass(ctx, pad, y, cw, ch, 24 * u);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${18 * u}px ${family}`;
  ctx.fillStyle = rgba(c.textColor, 0.7);
  ctx.fillText('HARGA BIASA', pad + cw / 2, y + 36 * u);
  ctx.font = `800 ${40 * u}px ${family}`;
  ctx.fillStyle = '#fda4af';
  const old = meta.originalPriceText;
  ctx.fillText(old, pad + cw / 2, y + 92 * u);
  const ow = ctx.measureText(old).width;
  const strike = easeOutCubic(clamp((t - 0.9) / 0.4));
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 5 * u;
  ctx.beginPath();
  ctx.moveTo(pad + cw / 2 - ow / 2 - 6 * u, y + 92 * u);
  ctx.lineTo(pad + cw / 2 - ow / 2 - 6 * u + (ow + 12 * u) * strike, y + 92 * u);
  ctx.stroke();
  ctx.restore();

  const rp = easeOutBack(clamp((t - 0.65) / 0.5));
  ctx.save();
  ctx.translate(pad + cw + 20 * u + cw / 2, y + ch / 2);
  ctx.scale(Math.max(0.001, rp), Math.max(0.001, rp));
  roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 24 * u);
  ctx.fillStyle = c.accentColor;
  ctx.shadowColor = rgba(c.accentColor, 0.55);
  ctx.shadowBlur = 26 * u;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.badgeTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${18 * u}px ${family}`;
  ctx.fillText('HARGA PROMO', 0, -38 * u);
  ctx.font = `900 ${50 * u}px ${family}`;
  ctx.fillText(meta.priceText, 0, 14 * u);
  ctx.restore();

  y += ch + 26 * u;
  const rows: [string, string][] = [
    ['✔', `Produk: ${meta.productName}`],
    ['✔', `Lokasi: ${meta.storeName}`],
  ];
  if (style.showSubtitle && scene.subtext) rows.push(['★', scene.subtext]);
  ctx.font = `500 ${25 * u}px ${family}`;
  const rowLines = rows.map(([m, txt]) => ({ m, lines: wrapLines(ctx, txt, W - pad * 2 - 90 * u) }));
  const rowLh = 34 * u;
  const panelH = rowLines.reduce((a, r) => a + r.lines.length * rowLh + 14 * u, 0) + 28 * u;
  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp((t - Math.min(end, 1.0)) / 0.5));
  glass(ctx, pad, y, W - pad * 2, panelH, 26 * u, 0.12);
  let ry = y + 26 * u;
  rowLines.forEach((r, i) => {
    const ip = easeOutCubic(clamp((t - Math.min(end, 1.0) - 0.15 * i) / 0.4));
    ctx.save();
    ctx.globalAlpha *= ip;
    ctx.translate((1 - ip) * 30 * u, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.accentColor;
    ctx.font = `800 ${26 * u}px ${family}`;
    ctx.fillText(r.m, pad + 26 * u, ry + rowLh / 2);
    ctx.font = `500 ${25 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    r.lines.forEach((l, li) => ctx.fillText(l, pad + 66 * u, ry + rowLh / 2 + li * rowLh));
    ctx.restore();
    ry += r.lines.length * rowLh + 14 * u;
  });
  ctx.restore();
}

/* ---------------------- P3: Countdown ---------------------- */
function drawPromoCountdown(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, elapsedSec, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const cx = W / 2;
  const pad = 48 * u;

  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp(t / 0.4));
  ctx.font = `600 ${17 * u}px ${family}`;
  setLetterSpacing(ctx, 4 * u);
  ctx.fillStyle = rgba(c.textColor, 0.8);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BERAKHIR DALAM HITUNGAN DETIK', cx, H * 0.075);
  setLetterSpacing(ctx, 0);
  ctx.restore();

  const sec = 59 - (Math.floor(elapsedSec * 1) % 60);
  const units = ['00', '14', String(sec).padStart(2, '0')];
  const bs = 104 * u;
  const gap = 34 * u;
  const total = bs * 3 + gap * 2;
  let bx = cx - total / 2;
  const frac = elapsedSec % 1;
  units.forEach((txt, i) => {
    const tick = i === 2 ? 1 + 0.12 * Math.pow(1 - frac, 3) : 1;
    ctx.save();
    ctx.translate(bx + bs / 2, H * 0.075 + 30 * u + bs / 2);
    ctx.scale(tick * easeOutBack(clamp(t / 0.5)), tick * easeOutBack(clamp(t / 0.5)));
    roundRect(ctx, -bs / 2, -bs / 2, bs, bs, 24 * u);
    ctx.fillStyle = c.accentColor;
    ctx.shadowColor = rgba(c.accentColor, 0.55);
    ctx.shadowBlur = 20 * u;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = c.badgeTextColor;
    ctx.font = `900 ${54 * u}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 0, 3 * u);
    ctx.restore();
    if (i < 2) {
      ctx.fillStyle = c.textColor;
      ctx.font = `900 ${50 * u}px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(':', bx + bs + gap / 2, H * 0.075 + 30 * u + bs / 2);
    }
    bx += bs + gap;
  });

  // headline tengah
  const fit = fitLines(ctx, scene.text.toUpperCase(), 900, family, W - pad * 2, 56 * u, 34 * u, 1.22, H * 0.3);
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${25 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, W - pad * 2 - 40 * u) : [];
  const emojiH = style.showEmoji ? 100 * u : 0;
  const blockH = emojiH + fit.lines.length * fit.lh + (hasSub ? 30 * u + subLines.length * 34 * u + 30 * u : 0);
  const top = H * 0.075 + 30 * u + bs + 30 * u;
  const bottom = H - 280 * u;
  let y = top + Math.max(0, (bottom - top - blockH) / 2);
  if (style.showEmoji) {
    const e = easeOutBack(clamp((t - 0.1) / 0.5));
    ctx.save();
    ctx.translate(cx, y + 44 * u);
    ctx.scale(e, e);
    ctx.rotate(Math.sin(elapsedSec * 5) * 0.08);
    ctx.font = `${74 * u}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji, 0, 0);
    ctx.restore();
  }
  y += emojiH;
  ctx.save();
  ctx.font = `900 ${fit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 16 * u;
  const end = drawReveal(ctx, fit.lines, cx, y + fit.lh / 2, fit.lh, 'center', t, scene.animation, c.textColor, c.accentColor, 0.1, false);
  ctx.restore();
  y += fit.lines.length * fit.lh + 24 * u;
  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end) / 0.4));
    ctx.save();
    ctx.globalAlpha = sp;
    const sh = subLines.length * 34 * u + 28 * u;
    roundRect(ctx, pad, y, W - pad * 2, sh, 22 * u);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.font = `500 ${25 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, cx, y + 14 * u + 17 * u + i * 34 * u));
    ctx.restore();
  }

  // Banner CTA bawah
  const by = H - 230 * u;
  const bh = 120 * u;
  const bp = easeOutCubic(clamp((t - 0.3) / 0.5));
  ctx.save();
  ctx.globalAlpha = bp;
  ctx.translate(0, (1 - bp) * 60 * u);
  roundRect(ctx, pad, by, W - pad * 2, bh, 30 * u);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${17 * u}px ${family}`;
  ctx.fillStyle = rgba(c.textColor, 0.75);
  ctx.fillText('PROMO HARI INI', pad + 30 * u, by + 38 * u);
  ctx.font = `900 ${46 * u}px ${family}`;
  ctx.fillStyle = c.accentColor;
  ctx.fillText(script.extractedMeta.priceText, pad + 30 * u, by + 82 * u);
  const btnPulse = 1 + Math.sin(elapsedSec * 6) * 0.05;
  ctx.font = `900 ${21 * u}px ${family}`;
  const label = 'KLAIM SEKARANG';
  const lw = ctx.measureText(label).width + 48 * u;
  ctx.translate(W - pad - 30 * u - lw / 2, by + bh / 2);
  ctx.scale(btnPulse, btnPulse);
  roundRect(ctx, -lw / 2, -30 * u, lw, 60 * u, 18 * u);
  ctx.fillStyle = c.accentColor;
  ctx.fill();
  ctx.fillStyle = c.badgeTextColor;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 2 * u);
  ctx.restore();
}

/* ---------------------- E2: Fakta mengejutkan ---------------------- */
function drawFakta(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const cx = W / 2;
  const pad = 56 * u;
  const cardW = W - pad * 2;

  const fit = fitLines(ctx, scene.text, 800, family, cardW - 80 * u, 52 * u, 32 * u, 1.3, H * 0.34);
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${26 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, cardW - 40 * u) : [];
  const cardH = fit.lines.length * fit.lh + 80 * u;
  const blockH = 70 * u + cardH + (hasSub ? 30 * u + subLines.length * 36 * u : 0);
  const y0 = (H - blockH) / 2;

  const pp = easeOutBack(clamp(t / 0.55));
  pill(ctx, `${style.showEmoji ? scene.emoji + '  ' : ''}FAKTA MENGEJUTKAN`, cx, y0, u, family, c.accentColor, c.badgeTextColor, 'center', Math.max(0.001, pp));

  const cp = easeOutBack(clamp((t - 0.12) / 0.6));
  const cardY = y0 + 70 * u;
  ctx.save();
  ctx.translate(cx, cardY + cardH / 2);
  ctx.scale(Math.max(0.001, cp), Math.max(0.001, cp));
  ctx.translate(-cx, -(cardY + cardH / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 36 * u;
  glass(ctx, pad, cardY, cardW, cardH, 40 * u, 0.12);
  ctx.restore();

  ctx.save();
  ctx.font = `800 ${fit.px}px ${family}`;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 10 * u;
  const end = drawReveal(ctx, fit.lines, cx, cardY + 40 * u + fit.lh / 2, fit.lh, 'center', t, scene.animation === 'fade' ? 'pop' : scene.animation, c.textColor, c.accentColor, 0.3);
  ctx.restore();

  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end) / 0.5));
    ctx.save();
    ctx.globalAlpha = sp * 0.9;
    ctx.font = `500 ${26 * u}px ${family}`;
    ctx.fillStyle = c.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, cx, cardY + cardH + 40 * u + i * 36 * u + (1 - sp) * 12 * u));
    ctx.restore();
  }
}

/* ---------------------- E3: Tebak cepat (Q&A) ---------------------- */
function drawQA(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, o: FrameOptions) {
  const { script, style, sceneIdx, sceneElapsed: t, family } = o;
  const scene = script.scenes[sceneIdx];
  const c = style.colors;
  const pad = 56 * u;
  const cardW = W - pad * 2;
  const isQuestion = sceneIdx === 0 || sceneIdx === script.scenes.length - 1;

  const fit = fitLines(ctx, scene.text, 700, family, cardW - 64 * u, 50 * u, 32 * u, 1.3, H * 0.3);
  const hasSub = style.showSubtitle && !!scene.subtext;
  ctx.font = `500 ${25 * u}px ${family}`;
  const subLines = hasSub ? wrapLines(ctx, scene.subtext, cardW - 64 * u) : [];
  const cardH = 32 * u + fit.lines.length * fit.lh + (hasSub ? 40 * u + subLines.length * 34 * u : 0) + 28 * u;
  const blockH = 70 * u + cardH + 30 * u + 82 * u;
  const y0 = (H - blockH) / 2;

  pill(ctx, isQuestion ? '❓ TEBAK CEPAT' : '💡 JAWABAN FAKTA', pad, y0, u, family, c.accentColor, c.badgeTextColor, 'left', Math.max(0.001, easeOutBack(clamp(t / 0.45))));
  if (style.showEmoji) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(clamp((t - 0.1) / 0.4));
    ctx.font = `${52 * u}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(scene.emoji, W - pad, y0 + 26 * u);
    ctx.restore();
  }

  const cardY = y0 + 70 * u;
  const cp = easeOutCubic(clamp((t - 0.1) / 0.5));
  ctx.save();
  ctx.globalAlpha = cp;
  ctx.translate(0, (1 - cp) * 50 * u);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 30 * u;
  roundRect(ctx, pad, cardY, cardW, cardH, 30 * u);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `700 ${fit.px}px ${family}`;
  const end = drawReveal(ctx, fit.lines, pad + 32 * u, cardY + 32 * u + fit.lh / 2, fit.lh, 'left', t, scene.animation, c.textColor, c.accentColor, 0.2);
  ctx.restore();

  let sy = cardY + 32 * u + fit.lines.length * fit.lh;
  if (hasSub) {
    const sp = easeOutCubic(clamp((t - end) / 0.4));
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 32 * u, sy + 16 * u);
    ctx.lineTo(W - pad - 32 * u, sy + 16 * u);
    ctx.stroke();
    ctx.font = `500 ${25 * u}px ${family}`;
    ctx.fillStyle = rgba(c.textColor, 0.85);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    subLines.forEach((l, i) => ctx.fillText(l, pad + 32 * u, sy + 40 * u + i * 34 * u));
    ctx.restore();
  }

  // Pill pilihan A / B
  const oy = cardY + cardH + 30 * u;
  const ow = (cardW - 20 * u) / 2;
  ['Sudah Tahu', 'Baru Tahu!'].forEach((label, i) => {
    const ip = easeOutBack(clamp((t - 0.6 - i * 0.15) / 0.45));
    const hit = !isQuestion && i === 1 && t > 1.4;
    ctx.save();
    const ox = pad + i * (ow + 20 * u);
    ctx.translate(ox + ow / 2, oy + 41 * u);
    ctx.scale(Math.max(0.001, ip) * (hit ? 1.05 + Math.sin(t * 8) * 0.01 : 1), Math.max(0.001, ip) * (hit ? 1.05 : 1));
    roundRect(ctx, -ow / 2, -41 * u, ow, 82 * u, 22 * u);
    ctx.fillStyle = hit ? c.accentColor : 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-ow / 2 + 38 * u, 0, 18 * u, 0, Math.PI * 2);
    ctx.fillStyle = hit ? c.badgeTextColor : c.accentColor;
    ctx.fill();
    ctx.fillStyle = hit ? c.accentColor : c.badgeTextColor;
    ctx.font = `900 ${19 * u}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i === 0 ? 'A' : 'B', -ow / 2 + 38 * u, 1);
    ctx.fillStyle = hit ? c.badgeTextColor : c.textColor;
    ctx.font = `800 ${24 * u}px ${family}`;
    ctx.textAlign = 'left';
    ctx.fillText(label, -ow / 2 + 72 * u, 2 * u);
    ctx.restore();
  });
}

/* ---------------- efek khas tiap template ---------------- */
function drawFX(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  u: number,
  o: FrameOptions,
  phase: 'under' | 'over'
) {
  const { templateId: id, elapsedSec: t, style, family } = o;
  const c = style.colors;
  const bpm = style.music?.bpm || 100;

  if (phase === 'under') {
    if (id === 'Q1') {
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.3 + k / 3) % 1;
        ctx.strokeStyle = rgba(c.accentColor, 0.32 * (1 - p));
        ctx.lineWidth = 3 * u;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(W, H) * (0.12 + p * 0.85), 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (id === 'Q2') {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5 * u;
      for (let i = 0; i < 28; i++) {
        const len = (60 + seeded(i, 7) * 70) * u;
        const speed = 520 + seeded(i, 8) * 520;
        const x = seeded(i, 9) * (W + 200) - 100;
        const y = ((t * speed + seeded(i, 10) * (H + 300)) % (H + 300)) - 150;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.22, y + len);
        ctx.stroke();
      }
    } else if (id === 'E1') {
      const g = 56 * u;
      const off = (t * 14 * u) % g;
      ctx.strokeStyle = rgba(c.accentColor, 0.1);
      ctx.lineWidth = 1.5 * u;
      for (let x = -g + off; x < W + g; x += g) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = -g + off; y < H + g; y += g) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    } else if (id === 'E2') {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(t * 0.12);
      const R = Math.max(W, H);
      const rays = 18;
      for (let i = 0; i < rays; i++) {
        const a0 = (i / rays) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / rays / 2;
        ctx.fillStyle = rgba(c.accentColor, 0.09);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
        ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      const gp = 38 * u;
      ctx.fillStyle = rgba(c.accentColor, 0.16);
      for (let x = gp / 2; x < W; x += gp) {
        for (let y = gp / 2; y < H; y += gp) {
          ctx.beginPath();
          ctx.arc(x, y, 1.6 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (id === 'E3') {
      const glyphs = ['?', '!', '?', '💡', '?', '!'];
      for (let i = 0; i < 10; i++) {
        const yy = H + 60 - ((t * (50 + seeded(i, 3) * 60) + seeded(i, 4) * H * 1.3) % (H + 120));
        const xx = seeded(i, 1) * W;
        ctx.save();
        ctx.globalAlpha = 0.13 + seeded(i, 5) * 0.12;
        ctx.translate(xx, yy);
        ctx.rotate(Math.sin(t + i) * 0.5);
        ctx.fillStyle = c.accentColor;
        ctx.font = `900 ${(46 + seeded(i, 2) * 50) * u}px ${family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyphs[i % glyphs.length], 0, 0);
        ctx.restore();
      }
    }
    return;
  }

  // ---- phase 'over'
  if (id === 'Q3') {
    const n = 26;
    const bw = W / n;
    const w = (bpm / 60) * Math.PI;
    for (let i = 0; i < n; i++) {
      const h = (0.18 + 0.82 * Math.abs(Math.sin(t * w + i * 0.65 + seeded(i, 1) * 3))) * 110 * u;
      ctx.fillStyle = rgba(c.accentColor, 0.5);
      roundRect(ctx, i * bw + bw * 0.18, H - 96 * u - h, bw * 0.64, h, 5 * u);
      ctx.fill();
    }
  } else if (id === 'P1') {
    const cols = [c.accentColor, '#ffffff', '#fbbf24', '#fb7185'];
    for (let i = 0; i < 20; i++) {
      const speed = 130 + seeded(i, 3) * 170;
      const y = ((t * speed + seeded(i, 4) * (H + 80)) % (H + 80)) - 40;
      const x = seeded(i, 1) * W + Math.sin(t * 2 + i) * 20 * u;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * (2 + seeded(i, 5) * 3) + i);
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-6 * u, -3 * u, 12 * u, 6 * u);
      ctx.restore();
    }
  } else if (id === 'P2') {
    const band = (y: number, h: number, bg: string, fg: string, text: string, dir: number) => {
      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(0, y, W, h);
      ctx.font = `900 ${18 * u}px ${family}`;
      ctx.fillStyle = fg;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      setLetterSpacing(ctx, 3 * u);
      const unit = `${text}   •   `;
      const uw = ctx.measureText(unit).width;
      const off = (t * 90 * u * dir) % uw;
      for (let x = -uw + (dir > 0 ? off : -off); x < W + uw; x += uw) ctx.fillText(unit, x, y + h / 2 + 1);
      setLetterSpacing(ctx, 0);
      ctx.restore();
    };
    band(0, 38 * u, c.accentColor, c.badgeTextColor, 'PROMO  •  HEMAT  •  DISKON', 1);
    band(H - 38 * u, 38 * u, 'rgba(0,0,0,0.6)', c.textColor, 'BANDINGKAN HARGANYA', -1);
  } else if (id === 'P3') {
    const pulse = 0.3 + 0.25 * Math.sin(t * 6);
    ctx.save();
    ctx.strokeStyle = rgba(c.accentColor, pulse);
    ctx.lineWidth = 14 * u;
    ctx.strokeRect(7 * u, 7 * u, W - 14 * u, H - 14 * u);
    const sy = ((t * 0.35) % 1) * H;
    const g = ctx.createLinearGradient(0, sy - 60 * u, 0, sy + 60 * u);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, rgba(c.accentColor, 0.16));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, sy - 60 * u, W, 120 * u);
    ctx.restore();
  }
}

/* ------------------------- frame utama ------------------------- */
export function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, o: FrameOptions) {
  const { script, style, templateId, sceneIdx, sceneElapsed, sceneDur, images } = o;
  const scene = script.scenes[sceneIdx];
  const u = Math.min(W, H) / 720;

  const sceneImgUrl =
    scene.imageUrl ||
    (style.userImages.length ? style.userImages[sceneIdx % style.userImages.length] : '') ||
    style.backgroundImageUrl;
  const sceneImg = (sceneImgUrl && images.get(sceneImgUrl)) || null;

  ctx.clearRect(0, 0, W, H);

  // Kamera push-in pelan sepanjang scene
  const push = 1 + 0.045 * clamp(sceneElapsed / (sceneDur + 0.5));
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(push, push);
  ctx.translate(-W / 2, -H / 2);

  drawBackground(ctx, W, H, o, sceneImg, templateId === 'Q2');
  drawFX(ctx, W, H, u, o, 'under');

  switch (templateId) {
    case 'P1':
      drawPromoJumbo(ctx, W, H, W > H ? u * 0.78 : u, o, sceneImg);
      break;
    case 'P2':
      drawPromoBA(ctx, W, H, W > H ? u * 0.78 : u, o);
      break;
    case 'P3':
      drawPromoCountdown(ctx, W, H, W > H ? u * 0.74 : u, o);
      break;
    case 'E1':
      drawEdukasi(ctx, W, H, u, o);
      break;
    case 'E2':
      drawFakta(ctx, W, H, u, o);
      break;
    case 'E3':
      drawQA(ctx, W, H, u, o);
      break;
    default:
      drawQuote(ctx, W, H, u, o);
  }

  drawFX(ctx, W, H, u, o, 'over');

  ctx.restore();

  // Light sweep + wipe di awal scene
  const accent = style.colors.accentColor;
  if (sceneElapsed < 0.9) {
    const p = clamp(sceneElapsed / 0.9);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sx = -W * 0.4 + W * 1.8 * easeOutCubic(p);
    const g = ctx.createLinearGradient(sx, 0, sx + W * 0.35, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, rgba(accent, 0.33 * (1 - p)));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.transform(1, 0, -0.32, 1, 0, 0);
    ctx.fillRect(sx, -50, W * 0.35, H + 100);
    ctx.restore();
  }
  if (sceneElapsed < 0.55) {
    const p = clamp(sceneElapsed / 0.55);
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - p);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W * (1 - easeInOut(p)), H);
    ctx.restore();
  }

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Progress bar
  if (style.showProgressBar) {
    const bx = 48 * u;
    const bw = W - bx * 2;
    const by = H - 52 * u;
    roundRect(ctx, bx, by, bw, 8 * u, 4 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14 * u;
    roundRect(ctx, bx, by, Math.max(8 * u, bw * o.overallProgress), 8 * u, 4 * u);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
  }
}
