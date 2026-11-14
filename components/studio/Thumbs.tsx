'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { ContentPlan, ProjectDoc } from '@/lib/studio/types';
import { canvasSize } from '@/lib/studio/types';
import { drawComponent, getComponent } from '@/lib/studio/packs/components';
import { AnimSpec, evalIn, evalLoop } from '@/lib/studio/packs/animations';
import { drawTransition, TransitionSpec } from '@/lib/studio/packs/transitions';
import { cameraTransform, drawEffect, drawPostEffect, EffectCtx, EffectSpec } from '@/lib/studio/packs/effects';
import { Renderer, settleTime } from '@/lib/studio/renderer';
import { buildScenes, themeOf } from '@/lib/studio/builder';
import { getTemplate, getTheme } from '@/lib/studio/packs/templates';
import { canvasFamily } from '@/lib/studio/fonts';
import { getDeviceProfile } from '@/lib/studio/device';

function useHoverLoop(ref: React.RefObject<HTMLCanvasElement>, draw: (p: number, t: number) => void, period = 1.4, autoplay = false) {
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let raf = 0;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      draw((t % period) / period, t);
      raf = requestAnimationFrame(loop);
    };
    const on = () => {
      start = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const off = () => {
      cancelAnimationFrame(raf);
      draw(0.62, 2);
    };
    draw(0.62, 2);
    if (autoplay && getDeviceProfile().tier !== 'low') on();
    const host = c.parentElement || c;
    host.addEventListener('pointerenter', on);
    host.addEventListener('pointerleave', off);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerenter', on);
      host.removeEventListener('pointerleave', off);
    };
  }, [ref, draw, period, autoplay]);
}

export function ComponentThumb({ id, colors, heading, body }: { id: string; colors: { primary: string; secondary: string; text: string; surface: string }; heading: string; body: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const def = getComponent(id);
  const draw = React.useCallback(
    (_p: number, t: number) => {
      const c = ref.current;
      if (!c || !def) return;
      const ctx = c.getContext('2d')!;
      const W = c.width;
      const H = c.height;
      ctx.clearRect(0, 0, W, H);
      const s = Math.min((W * 0.86) / def.size.w, (H * 0.8) / def.size.h);
      const w = def.size.w * s;
      const h = def.size.h * s;
      ctx.save();
      ctx.translate((W - w) / 2, (H - h) / 2);
      drawComponent(ctx, def, w, h, {}, colors, { heading: canvasFamily(heading as never), body: canvasFamily(body as never), t, allowBlur: false });
      ctx.restore();
    },
    [def, colors, heading, body]
  );
  useHoverLoop(ref, draw, 3);
  return <canvas ref={ref} width={200} height={130} className="h-full w-full" />;
}

const frameCache = new Map<string, HTMLCanvasElement>();
function demoFrame(label: string, bg: string, fg: string, w: number, h: number) {
  const key = `${label}${bg}${w}x${h}`;
  let c = frameCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, bg);
  g.addColorStop(1, '#00000055');
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.fillStyle = fg;
  x.font = `900 ${h * 0.45}px ${canvasFamily('Plus Jakarta Sans')}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(label, w / 2, h / 2);
  frameCache.set(key, c);
  return c;
}

export function TransitionThumb({ spec, primary, secondary }: { spec: TransitionSpec; primary: string; secondary: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = React.useCallback(
    (p: number) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      const A = demoFrame('A', '#3A2A24', '#FFF3EA', c.width, c.height);
      const B = demoFrame('B', primary, '#120E0C', c.width, c.height);
      const q = Math.min(1, Math.max(0, (p - 0.15) / 0.7));
      ctx.clearRect(0, 0, c.width, c.height);
      drawTransition(ctx, spec, q, A, B, c.width, c.height, { primary, secondary }, false);
    },
    [spec, primary, secondary]
  );
  useHoverLoop(ref, draw, Math.max(1.2, spec.duration * 2.4));
  return <canvas ref={ref} width={160} height={100} className="h-full w-full" />;
}

export function AnimationThumb({ spec, color }: { spec: AnimSpec; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = React.useCallback(
    (p: number, t: number) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      const W = c.width;
      const H = c.height;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const k = W / 1080 * 3.2;
      let alpha = 1;
      if (spec.kind === 'loop') {
        const ps = evalLoop(spec, t);
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        ctx.scale(ps.scale * ps.sx, ps.scale * ps.sy);
        alpha = ps.alpha;
      } else {
        const q = Math.min(1, Math.max(0, (p - 0.1) / 0.6));
        const ev = evalIn(spec, q);
        const ps = ev.pose;
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        if (ps.skew) ctx.transform(1, 0, Math.tan((ps.skew * Math.PI) / 180), 1, 0, 0);
        ctx.scale(Math.max(0.001, Math.abs(ps.scale * ps.sx)) * Math.sign(ps.scale * ps.sx || 1), Math.max(0.001, Math.abs(ps.scale * ps.sy)) * Math.sign(ps.scale * ps.sy || 1));
        alpha = ps.alpha;
        if (ev.clip) {
          ctx.beginPath();
          const e = ev.clip.p;
          ctx.rect(-W / 2, -H / 2, W * e, H);
          ctx.clip();
        }
        if (ev.text) {
          const words = ['Aa', 'Bb', 'Cc'];
          const n = words.length;
          ctx.font = `800 ${H * 0.26}px ${canvasFamily('Plus Jakarta Sans')}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          words.forEach((w, i) => {
            const st = (i / n) * (1 - ev.text!.spec.overlap);
            const ip = Math.min(1, Math.max(0, (ev.text!.p - st) / (1 / n + ev.text!.spec.overlap)));
            const f = ev.text!.spec.from;
            ctx.save();
            ctx.globalAlpha = (f.alpha ?? 1) + (1 - (f.alpha ?? 1)) * ip;
            ctx.translate((i - 1) * W * 0.27 + (f.x ?? 0) * k * 0.4 * (1 - ip), (f.y ?? 0) * k * 0.4 * (1 - ip));
            const sc = (f.scale ?? 1) + (1 - (f.scale ?? 1)) * ip;
            ctx.scale(sc, sc);
            ctx.fillStyle = i === 1 ? color : '#FFF3EA';
            ctx.fillText(w, 0, 0);
            ctx.restore();
          });
          ctx.restore();
          return;
        }
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.roundRect(-W * 0.22, -H * 0.3, W * 0.44, H * 0.6, 12);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#120E0C';
      ctx.font = `900 ${H * 0.26}px ${canvasFamily('Plus Jakarta Sans')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Aa', 0, 2);
      ctx.restore();
    },
    [spec, color]
  );
  useHoverLoop(ref, draw, spec.kind === 'loop' ? spec.loop?.period || 1.5 : Math.max(1.2, spec.duration * 1.8));
  return <canvas ref={ref} width={160} height={100} className="h-full w-full" />;
}

/** Thumbnail template: render scene hook dari plan yang sama. */
export function TemplateThumb({ plan, templateId, aspect, assets, live }: { plan: ContentPlan; templateId: string; aspect: ProjectDoc['aspect']; assets: Record<string, string>; live?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const doc = useMemo<ProjectDoc>(() => {
    const tp = getTemplate(templateId);
    const miniPlan = { ...plan, items: plan.items.slice(0, 2) };
    return {
      version: 6,
      id: 'thumb',
      title: '',
      aspect,
      templateId,
      theme: themeOf(getTheme(tp.themeId)),
      scenes: buildScenes(miniPlan, templateId, aspect, Object.keys(assets), 1),
      assets,
      music: { id: 'none', volume: 0 },
      plan: miniPlan,
      showProgress: false,
    };
  }, [plan, templateId, aspect, assets]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = new Renderer({ allowBlur: false, particleScale: 0.4 });
    r.setDoc(doc);
    const ctx = c.getContext('2d')!;
    const sc = doc.scenes[0];
    let raf = 0;
    let start = 0;
    const paint = (t: number) => r.render(ctx, c.width, c.height, t);
    r.onAssetLoaded = () => paint(settleTime(sc));
    paint(settleTime(sc));
    if (live) {
      const total = doc.scenes.reduce((a, s) => a + s.duration, 0);
      const loop = (now: number) => {
        if (!start) start = now;
        paint(((now - start) / 1000) % total);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, [doc, live]);
  const { w, h } = canvasSize(aspect);
  const tw = 180;
  return <canvas ref={ref} width={tw} height={Math.round((tw * h) / w)} className="h-full w-full object-cover" />;
}

/** Thumbnail efek: contoh latar + kartu teks + efek (beranimasi saat disentuh). */
export function EffectThumb({ spec, primary, secondary, autoplay, w = 160, h = 100 }: { spec: EffectSpec; primary: string; secondary: string; autoplay?: boolean; w?: number; h?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = React.useCallback(
    (_p: number, t: number) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext('2d')!;
      const W = 1080;
      const H = Math.round((1080 * c.height) / c.width);
      const s = c.width / W;
      const ec: EffectCtx = { W, H, t, dur: 4, primary, secondary, ps: 0.6, allowBlur: false };
      ctx.setTransform(s, 0, 0, s, 0, 0);
      if (spec.layer === 'camera') {
        const cam = cameraTransform(spec, ec, 1.4);
        ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
        ctx.rotate(cam.r);
        ctx.scale(cam.s, cam.s);
        ctx.translate(-W / 2, -H / 2);
      }
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#2A1D18');
      g.addColorStop(1, '#4A2C20');
      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, W + 120, H + 120);
      if (spec.layer === 'under') drawEffect(ctx, spec, ec);
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.roundRect(W * 0.2, H * 0.36, W * 0.6, H * 0.28, 40);
      ctx.fill();
      ctx.fillStyle = '#120E0C';
      ctx.font = `900 ${H * 0.13}px ${canvasFamily('Plus Jakarta Sans')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PROMO', W / 2, H / 2 + 4);
      if (spec.layer === 'over') drawEffect(ctx, spec, ec);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (spec.layer === 'post') drawPostEffect(ctx, spec, ec, c.width, c.height);
    },
    [spec, primary, secondary]
  );
  useHoverLoop(ref, draw, 4, autoplay);
  return <canvas ref={ref} width={w} height={h} className="h-full w-full" />;
}
