import type { Fill, ImageLayer, Layer, ProjectDoc, Scene, ShapeLayer, TextLayer } from './types';
import { canvasSize, docDuration } from './types';
import { combinePose, evalIn, evalLoop, getAnimation, IDENTITY, Pose, TextAnimSpec } from './packs/animations';
import { drawTransition, getTransition } from './packs/transitions';
import { drawComponent, getComponent } from './packs/components';
import { drawIcon } from './packs/icons';
import { cameraTransform, drawEffect, drawPostEffect, EffectCtx, EffectSpec, getEffect } from './packs/effects';
import { canvasFamily } from './fonts';
import { clamp, ease, hash01 } from './easing';
import { rgba } from './color';
import { setSpacing, wrapLines } from './text';

/**
 * Renderer kanvas tunggal untuk preview editor DAN export video, supaya hasil export
 * identik dengan yang dilihat user. Waktu bersifat deterministik (frame = waktu),
 * jadi video tidak pernah patah-patah walaupun perangkat lambat.
 */

export interface RenderOptions {
  allowBlur: boolean;
  particleScale: number;
}

export function sceneStarts(doc: ProjectDoc): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const s of doc.scenes) {
    out.push(acc);
    acc += s.duration;
  }
  return out;
}

export function locate(doc: ProjectDoc, t: number): { idx: number; local: number } {
  let acc = 0;
  for (let i = 0; i < doc.scenes.length; i++) {
    const d = doc.scenes[i].duration;
    if (t < acc + d || i === doc.scenes.length - 1) return { idx: i, local: Math.max(0, t - acc) };
    acc += d;
  }
  return { idx: 0, local: 0 };
}

const imgCache = new Map<string, HTMLImageElement>();
const imgWaiting = new Set<string>();

interface TextItem {
  text: string;
  x: number;
  y: number;
  w: number;
  line: number;
  emph: boolean;
}
interface TextLayout {
  px: number;
  lineH: number;
  lines: Array<{ text: string; x: number; y: number; w: number }>;
  words: TextItem[];
  chars: TextItem[];
  family: string;
  font: string;
}

const layoutCache = new WeakMap<TextLayer, TextLayout>();

export class Renderer {
  doc: ProjectDoc | null = null;
  opts: RenderOptions;
  /** layer yang disembunyikan sementara (mis. saat teks diedit langsung di kanvas) */
  skipLayerId: string | null = null;
  onAssetLoaded?: () => void;
  private bufA: HTMLCanvasElement | null = null;
  private bufB: HTMLCanvasElement | null = null;
  private noisePattern: CanvasPattern | null = null;

  constructor(opts: Partial<RenderOptions> = {}) {
    this.opts = { allowBlur: true, particleScale: 1, ...opts };
  }

  setDoc(doc: ProjectDoc) {
    this.doc = doc;
  }

  resolveSrc(src?: string): string | undefined {
    if (!src) return undefined;
    return this.doc?.assets[src] || src;
  }

  image(src?: string): HTMLImageElement | null {
    const url = this.resolveSrc(src);
    if (!url) return null;
    const hit = imgCache.get(url);
    if (hit && hit.complete && hit.naturalWidth) return hit;
    if (!hit && !imgWaiting.has(url)) {
      imgWaiting.add(url);
      const im = new Image();
      im.decoding = 'async';
      if (!url.startsWith('data:')) im.crossOrigin = 'anonymous';
      im.onload = () => {
        imgWaiting.delete(url);
        this.onAssetLoaded?.();
      };
      im.onerror = () => imgWaiting.delete(url);
      im.src = url;
      imgCache.set(url, im);
    }
    return null;
  }

  /** Muat semua gambar yang dipakai dokumen (wajib sebelum export). */
  async preload(): Promise<void> {
    const doc = this.doc;
    if (!doc) return;
    const srcs = new Set<string>();
    doc.scenes.forEach((s) => {
      if (s.background.type === 'image' && s.background.src) srcs.add(s.background.src);
      s.layers.forEach((l) => {
        if (l.kind === 'image') srcs.add(l.src);
        if (l.kind === 'component' && l.props.image) srcs.add(l.props.image);
      });
    });
    await Promise.all(
      [...srcs].map(
        (s) =>
          new Promise<void>((res) => {
            const url = this.resolveSrc(s);
            if (!url) return res();
            const hit = imgCache.get(url);
            if (hit?.complete && hit.naturalWidth) return res();
            const im = hit || new Image();
            if (!url.startsWith('data:')) im.crossOrigin = 'anonymous';
            im.onload = () => res();
            im.onerror = () => res();
            if (!hit) {
              im.src = url;
              imgCache.set(url, im);
            }
            if (im.complete) res();
          })
      )
    );
  }

  private buffer(which: 'A' | 'B', w: number, h: number): HTMLCanvasElement {
    let c = which === 'A' ? this.bufA : this.bufB;
    if (!c) {
      c = document.createElement('canvas');
      if (which === 'A') this.bufA = c;
      else this.bufB = c;
    }
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    return c;
  }

  /** Render frame pada waktu global `t` (detik). */
  render(ctx: CanvasRenderingContext2D, pw: number, ph: number, t: number) {
    const doc = this.doc;
    if (!doc || !doc.scenes.length) return;
    const starts = sceneStarts(doc);
    const { idx, local } = locate(doc, t);
    const scene = doc.scenes[idx];
    const tr = idx > 0 ? getTransition(scene.transition?.id) : null;
    const tdur = tr ? Math.min(scene.transition.duration || tr.duration, scene.duration * 0.6, doc.scenes[idx - 1].duration * 0.6) : 0;

    if (tr && tr.kind !== 'cut' && local < tdur) {
      const A = this.buffer('A', pw, ph);
      const B = this.buffer('B', pw, ph);
      const prev = doc.scenes[idx - 1];
      this.renderScene(A.getContext('2d')!, pw, ph, prev, t - starts[idx - 1]);
      this.renderScene(B.getContext('2d')!, pw, ph, scene, local);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      drawTransition(ctx, tr, local / tdur, A, B, pw, ph, { primary: doc.theme.palette.primary, secondary: doc.theme.palette.secondary }, this.opts.allowBlur);
      ctx.restore();
    } else {
      this.renderScene(ctx, pw, ph, scene, local);
    }
    if (doc.showProgress) this.drawProgress(ctx, pw, ph, t / Math.max(0.01, docDuration(doc)));
    if (doc.watermark) this.drawWatermark(ctx, pw, ph, doc.watermark);
  }

  renderScene(ctx: CanvasRenderingContext2D, pw: number, ph: number, scene: Scene, local: number) {
    const doc = this.doc!;
    const { w: BW, h: BH } = canvasSize(doc.aspect);
    const s = pw / BW;
    const fx = (scene.effects || [])
      .map((r) => ({ spec: getEffect(r.id), amount: r.amount ?? 1 }))
      .filter((f): f is { spec: EffectSpec; amount: number } => !!f.spec);
    const ec: EffectCtx = {
      W: BW,
      H: BH,
      t: local,
      dur: scene.duration,
      primary: doc.theme.palette.primary,
      secondary: doc.theme.palette.secondary,
      ps: this.opts.particleScale,
      allowBlur: this.opts.allowBlur,
    };
    ctx.save();
    ctx.setTransform(s, 0, 0, ph / BH, 0, 0);
    // efek kamera (guncang / denyut) membungkus seluruh scene
    for (const f of fx) {
      if (f.spec.layer !== 'camera') continue;
      const cam = cameraTransform(f.spec, ec, f.amount);
      ctx.translate(BW / 2 + cam.x, BH / 2 + cam.y);
      ctx.rotate(cam.r);
      ctx.scale(cam.s, cam.s);
      ctx.translate(-BW / 2, -BH / 2);
    }
    this.drawBackground(ctx, BW, BH, scene.background, local, scene.duration);
    for (const f of fx) if (f.spec.layer === 'under') drawEffect(ctx, f.spec, ec, f.amount);
    for (const layer of scene.layers) {
      if (layer.hidden || layer.id === this.skipLayerId) continue;
      this.drawLayer(ctx, layer, local);
    }
    for (const f of fx) if (f.spec.layer === 'over') drawEffect(ctx, f.spec, ec, f.amount);
    ctx.restore();
    for (const f of fx) if (f.spec.layer === 'post') drawPostEffect(ctx, f.spec, ec, pw, ph, f.amount);
  }

  /* -------------------------- latar -------------------------- */
  private drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, bg: Fill, t: number, dur: number) {
    ctx.fillStyle = bg.color || '#000';
    ctx.fillRect(0, 0, W, H);
    if (bg.type === 'gradient') {
      const cols = bg.colors?.length ? bg.colors : [bg.color, bg.color];
      const a = (((bg.angle ?? 160) + Math.sin(t * 0.3) * 6) * Math.PI) / 180;
      const r = Math.hypot(W, H) / 2;
      const cx = W / 2;
      const cy = H / 2;
      const g = ctx.createLinearGradient(cx - Math.sin(a) * r, cy + Math.cos(a) * r, cx + Math.sin(a) * r, cy - Math.cos(a) * r);
      cols.forEach((c, i) => g.addColorStop(i / Math.max(1, cols.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else if (bg.type === 'image' && bg.src) {
      const img = this.image(bg.src);
      if (img) {
        const z = bg.kenBurns ? 1.04 + 0.08 * clamp(t / Math.max(1, dur)) : 1;
        const fit = bg.fit === 'contain' ? Math.min(W / img.width, H / img.height) : Math.max(W / img.width, H / img.height);
        const sc = fit * z;
        const dw = img.width * sc;
        const dh = img.height * sc;
        ctx.save();
        if (bg.blur && this.opts.allowBlur) ctx.filter = `blur(${bg.blur}px)`;
        ctx.drawImage(img, (W - dw) / 2 + (bg.kenBurns ? Math.sin(t * 0.4) * 14 : 0), (H - dh) / 2, dw, dh);
        ctx.restore();
      }
      if (bg.dim) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgba(0,0,0,${bg.dim * 0.7})`);
        g.addColorStop(0.5, `rgba(0,0,0,${bg.dim * 0.85})`);
        g.addColorStop(1, `rgba(0,0,0,${Math.min(0.95, bg.dim * 1.2)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
    if (bg.pattern && bg.pattern !== 'none') this.drawPattern(ctx, W, H, bg, t);
  }

  private drawPattern(ctx: CanvasRenderingContext2D, W: number, H: number, bg: Fill, t: number) {
    const col = bg.patternColor || '#FFFFFF';
    const op = bg.patternOpacity ?? 0.12;
    const ps = this.opts.particleScale;
    ctx.save();
    switch (bg.pattern) {
      case 'dots': {
        ctx.fillStyle = rgba(col, op);
        const g = 54;
        const off = (t * 10) % g;
        for (let y = -g; y < H + g; y += g)
          for (let x = 0; x < W + g; x += g) {
            ctx.beginPath();
            ctx.arc(x + ((y / g) % 2 ? g / 2 : 0), y + off, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        break;
      }
      case 'grid': {
        ctx.strokeStyle = rgba(col, op * 0.9);
        ctx.lineWidth = 2;
        const g = 90;
        const off = (t * 18) % g;
        ctx.beginPath();
        for (let x = 0; x <= W; x += g) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
        }
        for (let y = -g + off; y <= H; y += g) {
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
        }
        ctx.stroke();
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        break;
      }
      case 'rays': {
        ctx.translate(W / 2, H * 0.42);
        ctx.rotate(t * 0.12);
        ctx.fillStyle = rgba(col, op * 0.9);
        const n = 18;
        const R = Math.hypot(W, H);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, R, a, a + Math.PI / n);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'stripes': {
        ctx.fillStyle = rgba(col, op * 0.8);
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-Math.PI / 4);
        const g = 110;
        const off = (t * 30) % (g * 2);
        const R = Math.hypot(W, H);
        for (let x = -R + off; x < R; x += g * 2) ctx.fillRect(x, -R, g, R * 2);
        break;
      }
      case 'waves': {
        ctx.strokeStyle = rgba(col, op * 1.2);
        ctx.lineWidth = 4;
        for (let k = 0; k < 7; k++) {
          ctx.beginPath();
          const y0 = H * (0.55 + k * 0.07);
          for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + Math.sin(x / 120 + t * 1.2 + k) * 26);
          ctx.stroke();
        }
        break;
      }
      case 'halftone': {
        ctx.fillStyle = rgba(col, op);
        const g = 40;
        for (let y = 0; y < H + g; y += g)
          for (let x = 0; x < W + g; x += g) {
            const r = 2 + 12 * (x / W) * (1 - y / H) * (0.85 + 0.15 * Math.sin(t + x * 0.01));
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        break;
      }
      case 'blobs':
      case 'bokeh':
      case 'bubbles': {
        const n = Math.round((bg.pattern === 'bokeh' ? 14 : 6) * ps) || 3;
        for (let i = 0; i < n; i++) {
          const r = (bg.pattern === 'bokeh' ? 40 + hash01(i, 2) * 110 : 220 + hash01(i, 2) * 260);
          const x = hash01(i, 5) * W + Math.sin(t * 0.4 + i) * 40;
          const y = hash01(i, 9) * H + Math.cos(t * 0.3 + i * 2) * 50;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rgba(i % 2 ? col : '#FFFFFF', op * (bg.pattern === 'bokeh' ? 2.2 : 1.6)));
          g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'noise': {
        if (!this.noisePattern) {
          const c = document.createElement('canvas');
          c.width = c.height = 128;
          const cx = c.getContext('2d')!;
          const id = cx.createImageData(128, 128);
          for (let i = 0; i < id.data.length; i += 4) {
            const v = Math.floor(hash01(i, 1) * 255);
            id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
            id.data[i + 3] = 40;
          }
          cx.putImageData(id, 0, 0);
          this.noisePattern = ctx.createPattern(c, 'repeat');
        }
        if (this.noisePattern) {
          ctx.globalAlpha = Math.min(1, op * 4);
          ctx.translate(Math.floor(hash01(Math.floor(t * 12), 3) * 128), Math.floor(hash01(Math.floor(t * 12), 4) * 128));
          ctx.fillStyle = this.noisePattern;
          ctx.fillRect(-128, -128, W + 256, H + 256);
        }
        break;
      }
    }
    ctx.restore();
  }

  /* -------------------------- layer -------------------------- */
  layerState(layer: Layer, t: number): { visible: boolean; pose: Pose; clip?: { kind: string; p: number }; text?: { spec: TextAnimSpec; p: number; easing: string }; local: number } {
    const local = t - layer.start;
    if (local < 0 || (layer.end !== null && t >= layer.end)) return { visible: false, pose: IDENTITY, local };
    let pose: Pose = { ...IDENTITY };
    let clip: { kind: string; p: number } | undefined;
    let text: { spec: TextAnimSpec; p: number; easing: string } | undefined;
    let inEnd = 0;
    const aIn = layer.animIn ? getAnimation(layer.animIn.id) : undefined;
    if (aIn && layer.animIn && aIn.id !== 'none') {
      const delay = layer.animIn.delay || 0;
      const dur = Math.max(0.05, layer.animIn.duration || aIn.duration);
      inEnd = delay + dur;
      const p = (local - delay) / dur;
      if (p < 0) return { visible: false, pose, local };
      if (p < 1) {
        const ev = evalIn(aIn, p);
        pose = ev.pose;
        clip = ev.clip;
        text = ev.text;
      }
    }
    const aOut = layer.animOut ? getAnimation(layer.animOut.id) : undefined;
    if (aOut && layer.animOut && layer.end !== null && aOut.id !== 'none') {
      const dur = Math.max(0.05, layer.animOut.duration || aOut.duration);
      const os = layer.end - dur;
      if (t > os) {
        const ev = evalIn(aOut, 1 - (t - os) / dur);
        pose = combinePose(pose, ev.pose);
        clip = ev.clip || clip;
        if (ev.text) text = ev.text;
      }
    }
    if (layer.animLoop && local > inEnd) {
      const lp = getAnimation(layer.animLoop);
      if (lp) {
        const ramp = clamp((local - inEnd) / 0.4);
        const lpPose = evalLoop(lp, local - inEnd);
        const k: Pose = {
          x: lpPose.x * ramp,
          y: lpPose.y * ramp,
          scale: 1 + (lpPose.scale - 1) * ramp,
          sx: 1 + (lpPose.sx - 1) * ramp,
          sy: 1 + (lpPose.sy - 1) * ramp,
          rot: lpPose.rot * ramp,
          alpha: 1 + (lpPose.alpha - 1) * ramp,
          blur: 0,
          skew: lpPose.skew * ramp,
        };
        pose = combinePose(pose, k);
      }
    }
    return { visible: true, pose, clip, text, local };
  }

  drawLayer(ctx: CanvasRenderingContext2D, layer: Layer, t: number) {
    const st = this.layerState(layer, t);
    if (!st.visible) return;
    const { pose } = st;
    const alpha = layer.opacity * clamp(pose.alpha);
    if (alpha <= 0.002) return;
    const cx = layer.x + layer.w / 2 + pose.x;
    const cy = layer.y + layer.h / 2 + pose.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    const rot = ((layer.rotation + pose.rot) * Math.PI) / 180;
    if (rot) ctx.rotate(rot);
    if (pose.skew) ctx.transform(1, 0, Math.tan((pose.skew * Math.PI) / 180), 1, 0, 0);
    const sx = pose.scale * pose.sx;
    const sy = pose.scale * pose.sy;
    if (sx !== 1 || sy !== 1) ctx.scale(Math.abs(sx) < 0.001 ? 0.001 : sx, Math.abs(sy) < 0.001 ? 0.001 : sy);
    ctx.translate(-layer.w / 2, -layer.h / 2);
    if (pose.blur > 0.5 && this.opts.allowBlur) ctx.filter = `blur(${pose.blur}px)`;
    if (st.clip) this.applyClip(ctx, st.clip.kind, st.clip.p, layer.w, layer.h);
    if (layer.shadow && layer.kind !== 'text') {
      ctx.shadowColor = layer.shadow.color;
      ctx.shadowBlur = layer.shadow.blur;
      ctx.shadowOffsetX = layer.shadow.x;
      ctx.shadowOffsetY = layer.shadow.y;
    }
    switch (layer.kind) {
      case 'text':
        this.drawText(ctx, layer, st.text, st.local);
        break;
      case 'image':
        this.drawImageLayer(ctx, layer);
        break;
      case 'icon': {
        if (layer.bg) {
          ctx.beginPath();
          if (layer.bg.shape === 'circle') ctx.arc(layer.w / 2, layer.h / 2, Math.min(layer.w, layer.h) / 2, 0, Math.PI * 2);
          else ctx.roundRect(0, 0, layer.w, layer.h, layer.bg.shape === 'squircle' ? Math.min(layer.w, layer.h) * 0.3 : 8);
          ctx.fillStyle = layer.bg.color;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          const pad = Math.min(layer.w, layer.h) * 0.22;
          drawIcon(ctx, layer.iconId, pad, pad, layer.w - pad * 2, layer.h - pad * 2, layer.color, layer.strokeWidth);
        } else drawIcon(ctx, layer.iconId, 0, 0, layer.w, layer.h, layer.color, layer.strokeWidth);
        break;
      }
      case 'component': {
        const def = getComponent(layer.componentId);
        if (def) {
          drawComponent(ctx, def, layer.w, layer.h, layer.props, layer.colors, {
            heading: canvasFamily(this.doc?.theme.headingFont || 'Poppins'),
            body: canvasFamily(this.doc?.theme.bodyFont || 'Poppins'),
            t: Math.max(0, st.local - (layer.animIn?.delay || 0)),
            allowBlur: this.opts.allowBlur,
            image: (src) => this.image(src),
          });
        }
        break;
      }
      case 'shape':
        this.drawShape(ctx, layer, st.local);
        break;
    }
    ctx.restore();
  }

  private applyClip(ctx: CanvasRenderingContext2D, kind: string, p: number, w: number, h: number) {
    const e = clamp(p);
    ctx.beginPath();
    switch (kind) {
      case 'left':
        ctx.rect(-w * 0.1, -h, w * 1.2 * e, h * 3);
        break;
      case 'right':
        ctx.rect(w * 1.1 - w * 1.2 * e, -h, w * 1.2 * e, h * 3);
        break;
      case 'up':
        ctx.rect(-w, h * 1.1 - h * 1.2 * e, w * 3, h * 1.2 * e);
        break;
      case 'down':
        ctx.rect(-w, -h * 0.1, w * 3, h * 1.2 * e);
        break;
      case 'center-h':
        ctx.rect(w / 2 - (w * 0.6) * e, -h, w * 1.2 * e, h * 3);
        break;
      case 'center-v':
        ctx.rect(-w, h / 2 - h * 0.6 * e, w * 3, h * 1.2 * e);
        break;
      case 'circle':
        ctx.arc(w / 2, h / 2, Math.max(0.1, Math.hypot(w, h) * 0.6 * e), 0, Math.PI * 2);
        break;
      case 'diagonal':
        ctx.moveTo(-w, -h);
        ctx.lineTo(-w + (w * 3) * e, -h);
        ctx.lineTo(-w + (w * 3) * e - w, h * 2);
        ctx.lineTo(-w, h * 2);
        ctx.closePath();
        break;
      default:
        ctx.rect(-w, -h, w * 3, h * 3);
    }
    ctx.clip();
  }

  private textLayout(ctx: CanvasRenderingContext2D, L: TextLayer): TextLayout {
    const hit = layoutCache.get(L);
    const family = canvasFamily(L.font);
    if (hit && hit.family === family) return hit;
    const raw = L.uppercase ? L.text.toUpperCase() : L.text;
    const it = L.italic ? 'italic ' : '';
    setSpacing(ctx, L.letterSpacing);
    let px = L.size;
    let lines: string[] = [];
    const maxW = L.w;
    const maxH = L.h;
    for (; px > 14; px -= Math.max(1, px * 0.05)) {
      ctx.font = `${it}${L.weight} ${px}px ${family}`;
      lines = wrapLines(ctx, raw, maxW);
      const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
      if (lines.length * px * L.lineHeight <= maxH && widest <= maxW * 1.01) break;
    }
    const font = `${it}${L.weight} ${px}px ${family}`;
    ctx.font = font;
    const lineH = px * L.lineHeight;
    const totalH = lines.length * lineH;
    const y0 = (L.h - totalH) / 2;
    const emph = new Set((L.emphasisWords || []).map((w) => w.toLowerCase()));
    const out: TextLayout = { px, lineH, lines: [], words: [], chars: [], family, font };
    const space = ctx.measureText(' ').width;
    lines.forEach((ln, li) => {
      const lw = ctx.measureText(ln).width;
      const lx = L.align === 'center' ? (L.w - lw) / 2 : L.align === 'right' ? L.w - lw : 0;
      const ly = y0 + lineH * (li + 0.5);
      out.lines.push({ text: ln, x: lx, y: ly, w: lw });
      let x = lx;
      ln.split(' ').forEach((word) => {
        const ww = ctx.measureText(word).width;
        const clean = word.toLowerCase().replace(/[^\p{L}\p{N}%.]/gu, '');
        const isEmph = emph.size > 0 && (emph.has(clean) || emph.has(word.toLowerCase()));
        out.words.push({ text: word, x, y: ly, w: ww, line: li, emph: isEmph });
        let cx = x;
        for (const ch of Array.from(word)) {
          const cw = ctx.measureText(ch).width;
          out.chars.push({ text: ch, x: cx, y: ly, w: cw, line: li, emph: isEmph });
          cx += cw;
        }
        x += ww + space;
      });
    });
    layoutCache.set(L, out);
    return out;
  }

  private drawText(ctx: CanvasRenderingContext2D, L: TextLayer, anim: { spec: TextAnimSpec; p: number; easing: string } | undefined, local: number) {
    const lay = this.textLayout(ctx, L);
    ctx.font = lay.font;
    setSpacing(ctx, L.letterSpacing);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const hl = L.highlight;
    const shadowOn = !!L.shadow;

    // blok sorot per baris
    if (hl) {
      const reveal = anim?.spec.highlight ? clamp(anim.p * 1.2) : 1;
      lay.lines.forEach((ln, i) => {
        const lp = anim ? clamp(reveal * lay.lines.length - i) : 1;
        if (lp <= 0) return;
        ctx.beginPath();
        ctx.roundRect(ln.x - hl.padding, ln.y - lay.lineH * 0.5 - hl.padding * 0.2 + lay.lineH * 0.06, (ln.w + hl.padding * 2) * lp, lay.lineH * 0.94 + hl.padding * 0.4 - lay.lineH * 0.06, hl.radius);
        ctx.fillStyle = hl.color;
        ctx.fill();
      });
    }

    const drawItem = (it: TextItem, pose?: Pose, alpha = 1, override?: string) => {
      ctx.save();
      if (pose) {
        const cx = it.x + it.w / 2;
        ctx.translate(cx + pose.x, it.y + pose.y);
        if (pose.rot) ctx.rotate((pose.rot * Math.PI) / 180);
        if (pose.skew) ctx.transform(1, 0, Math.tan((pose.skew * Math.PI) / 180), 1, 0, 0);
        const sx = pose.scale * pose.sx;
        const sy = pose.scale * pose.sy;
        ctx.scale(Math.abs(sx) < 0.001 ? 0.001 : sx, Math.abs(sy) < 0.001 ? 0.001 : sy);
        ctx.translate(-cx, -it.y);
        if (pose.blur > 0.5 && this.opts.allowBlur) ctx.filter = `blur(${pose.blur}px)`;
        ctx.globalAlpha *= clamp(pose.alpha) * alpha;
      } else ctx.globalAlpha *= alpha;
      const txt = override ?? it.text;
      if (shadowOn && L.shadow) {
        ctx.shadowColor = L.shadow.color;
        ctx.shadowBlur = L.shadow.blur;
        ctx.shadowOffsetX = L.shadow.x;
        ctx.shadowOffsetY = L.shadow.y;
      }
      if (L.stroke && L.stroke.width > 0) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = L.stroke.width * 2;
        ctx.strokeStyle = L.stroke.color;
        ctx.strokeText(txt, it.x, it.y);
        ctx.shadowColor = 'transparent';
      }
      ctx.fillStyle = it.emph && L.emphasisColor ? L.emphasisColor : L.color;
      ctx.fillText(txt, it.x, it.y);
      ctx.restore();
    };

    if (!anim) {
      // jalur cepat: gambar per kata hanya bila ada penekanan, selain itu per baris
      if (lay.words.some((w) => w.emph)) lay.words.forEach((w) => drawItem(w));
      else lay.lines.forEach((ln) => drawItem({ text: ln.text, x: ln.x, y: ln.y, w: ln.w, line: 0, emph: false }));
      return;
    }
    const spec = anim.spec;
    const items = spec.mode === 'char' ? lay.chars : spec.mode === 'word' ? lay.words : lay.lines.map((l, i) => ({ text: l.text, x: l.x, y: l.y, w: l.w, line: i, emph: false }));
    const n = items.length || 1;
    const ov = clamp(spec.overlap, 0, 0.95);
    const itemDur = 1 / (1 + (n - 1) * (1 - ov));
    const from = spec.from;
    let lastVisible = -1;
    items.forEach((it, i) => {
      const st = i * itemDur * (1 - ov);
      const p = clamp((anim.p - st) / itemDur);
      if (p <= 0 && !spec.highlight) return;
      if (spec.cursor && p <= 0) return;
      lastVisible = i;
      if (spec.highlight) {
        drawItem(it, undefined, p > 0.5 ? 1 : 0.35 + p);
        return;
      }
      if (spec.cursor) {
        drawItem(it);
        return;
      }
      const e = ease(anim.easing, p);
      const pose: Pose = {
        x: (from.x ?? 0) * (1 - e),
        y: (from.y ?? 0) * (1 - e),
        scale: (from.scale ?? 1) + (1 - (from.scale ?? 1)) * e,
        sx: (from.sx ?? 1) + (1 - (from.sx ?? 1)) * e,
        sy: (from.sy ?? 1) + (1 - (from.sy ?? 1)) * e,
        rot: (from.rot ?? 0) * (1 - e),
        alpha: (from.alpha ?? 1) + (1 - (from.alpha ?? 1)) * clamp(p * 1.6),
        blur: (from.blur ?? 0) * (1 - e),
        skew: (from.skew ?? 0) * (1 - e),
      };
      let override: string | undefined;
      if (spec.scramble && p < 1 && it.text.trim()) {
        const glyphs = '#%&*+=?@ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
        override = glyphs[Math.floor(hash01(i, Math.floor(local * 24)) * glyphs.length)];
      }
      drawItem(it, pose, 1, override);
    });
    if (spec.cursor && Math.floor(local * 2.5) % 2 === 0) {
      const it = items[Math.max(0, lastVisible)];
      if (it) {
        ctx.fillStyle = L.emphasisColor || L.color;
        ctx.fillRect(it.x + it.w + 4, it.y - lay.px * 0.45, Math.max(4, lay.px * 0.08), lay.px * 0.9);
      }
    }
  }

  private drawImageLayer(ctx: CanvasRenderingContext2D, L: ImageLayer) {
    const img = this.image(L.src);
    ctx.save();
    ctx.beginPath();
    if (L.mask === 'circle') ctx.ellipse(L.w / 2, L.h / 2, L.w / 2, L.h / 2, 0, 0, Math.PI * 2);
    else if (L.mask === 'arch') {
      ctx.moveTo(0, L.h);
      ctx.lineTo(0, L.w / 2);
      ctx.arc(L.w / 2, L.w / 2, L.w / 2, Math.PI, 0);
      ctx.lineTo(L.w, L.h);
      ctx.closePath();
    } else ctx.roundRect(0, 0, L.w, L.h, Math.min(L.radius, L.w / 2, L.h / 2));
    if (L.shadow) {
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.shadowColor = 'transparent';
    }
    ctx.clip();
    if (img) {
      const fit = L.fit === 'contain' ? Math.min(L.w / img.width, L.h / img.height) : Math.max(L.w / img.width, L.h / img.height);
      const dw = img.width * fit;
      const dh = img.height * fit;
      ctx.drawImage(img, (L.w - dw) / 2, (L.h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, L.w, L.h);
    }
    ctx.restore();
    if (L.border && L.border.width > 0) {
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      if (L.mask === 'circle') ctx.ellipse(L.w / 2, L.h / 2, L.w / 2, L.h / 2, 0, 0, Math.PI * 2);
      else ctx.roundRect(0, 0, L.w, L.h, Math.min(L.radius, L.w / 2, L.h / 2));
      ctx.lineWidth = L.border.width;
      ctx.strokeStyle = L.border.color;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawShape(ctx: CanvasRenderingContext2D, L: ShapeLayer, t: number) {
    const { w, h } = L;
    ctx.beginPath();
    switch (L.shape) {
      case 'circle':
        ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case 'line':
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        break;
      case 'triangle':
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 ? 0.42 : 1;
          ctx.lineTo(w / 2 + (Math.cos(a) * w * r) / 2, h / 2 + (Math.sin(a) * h * r) / 2);
        }
        ctx.closePath();
        break;
      case 'arrow':
        ctx.moveTo(0, h * 0.35);
        ctx.lineTo(w * 0.6, h * 0.35);
        ctx.lineTo(w * 0.6, 0);
        ctx.lineTo(w, h / 2);
        ctx.lineTo(w * 0.6, h);
        ctx.lineTo(w * 0.6, h * 0.65);
        ctx.lineTo(0, h * 0.65);
        ctx.closePath();
        break;
      case 'blob': {
        const n = 7;
        const pts: Array<[number, number]> = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = 0.42 + 0.08 * Math.sin(t * 0.8 + i * 1.7);
          pts.push([w / 2 + Math.cos(a) * w * r, h / 2 + Math.sin(a) * h * r]);
        }
        for (let i = 0; i <= n; i++) {
          const p0 = pts[i % n];
          const p1 = pts[(i + 1) % n];
          const mx = (p0[0] + p1[0]) / 2;
          const my = (p0[1] + p1[1]) / 2;
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
        }
        ctx.closePath();
        break;
      }
      default:
        ctx.roundRect(0, 0, w, h, Math.min(L.radius, w / 2, h / 2));
    }
    if (L.shape !== 'line') {
      ctx.fillStyle = L.fill;
      ctx.fill();
    }
    ctx.shadowColor = 'transparent';
    if (L.stroke && L.stroke.width > 0) {
      ctx.lineWidth = L.stroke.width;
      ctx.strokeStyle = L.stroke.color;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (L.shape === 'line') {
      ctx.lineWidth = Math.max(2, h);
      ctx.strokeStyle = L.fill;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  private drawProgress(ctx: CanvasRenderingContext2D, pw: number, ph: number, p: number) {
    const u = Math.min(pw, ph) / 1080;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const h = Math.max(3, 8 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, ph - h, pw, h);
    ctx.fillStyle = this.doc?.theme.palette.primary || '#FF6A3D';
    ctx.fillRect(0, ph - h, pw * clamp(p), h);
    ctx.restore();
  }

  private drawWatermark(ctx: CanvasRenderingContext2D, pw: number, ph: number, text: string) {
    const u = Math.min(pw, ph) / 1080;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `700 ${28 * u}px ${canvasFamily('Plus Jakarta Sans')}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, pw - 30 * u, ph - 30 * u);
    ctx.restore();
  }
}

/** Kotak pembatas layer (untuk hit-test editor), tanpa animasi. */
/** Waktu lokal saat semua animasi masuk sudah selesai (dipakai saat mengedit). */
export function settleTime(scene: Scene): number {
  let t = 0;
  for (const l of scene.layers) {
    const a = l.animIn ? (l.animIn.delay || 0) + (l.animIn.duration || 0) : 0;
    t = Math.max(t, l.start + a);
  }
  return Math.min(Math.max(0.05, scene.duration - 0.05), t + 0.15);
}

export function layerAt(scene: Scene, x: number, y: number): Layer | null {
  for (let i = scene.layers.length - 1; i >= 0; i--) {
    const l = scene.layers[i];
    if (l.hidden || l.locked) continue;
    const cx = l.x + l.w / 2;
    const cy = l.y + l.h / 2;
    const a = (-l.rotation * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= l.w / 2 && Math.abs(ly) <= l.h / 2) return l;
  }
  return null;
}
