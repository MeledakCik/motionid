'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Plus, SkipBack } from 'lucide-react';
import type { ProjectDoc, Scene } from '@/lib/studio/types';
import { canvasSize, docDuration } from '@/lib/studio/types';
import { Renderer, sceneStarts, settleTime } from '@/lib/studio/renderer';
import { getTransition } from '@/lib/studio/packs/transitions';
import type { PlaybackClock } from '@/lib/studio/clock';
import { Tool, useStudio } from '@/store/useStudio';
import { cx, useMediaQuery } from './ui';

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};

let thumbRenderer: Renderer | null = null;
function SceneThumb({ doc, scene }: { doc: ProjectDoc; scene: Scene }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const id = window.setTimeout(() => {
      if (!thumbRenderer) thumbRenderer = new Renderer({ allowBlur: false, particleScale: 0.3 });
      thumbRenderer.setDoc({ ...doc, showProgress: false, watermark: undefined });
      thumbRenderer.onAssetLoaded = () => thumbRenderer?.renderScene(c.getContext('2d')!, c.width, c.height, scene, settleTime(scene));
      thumbRenderer.renderScene(c.getContext('2d')!, c.width, c.height, scene, settleTime(scene));
    }, 120);
    return () => window.clearTimeout(id);
  }, [doc, scene]);
  const { w, h } = canvasSize(doc.aspect);
  const tw = 48;
  return <canvas ref={ref} width={tw} height={Math.round((tw * h) / w)} className="h-full w-auto rounded-md bg-black" />;
}

export default function Timeline({ clock, onOpenTool }: { clock: PlaybackClock; onOpenTool: (t: Tool) => void }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layerId = useStudio((s) => s.layerId);
  const mode = useStudio((s) => s.mode);
  const st = useStudio.getState();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const pps = desktop ? 56 : 34;
  const timeRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const starts = useMemo(() => sceneStarts(doc), [doc]);
  const total = docDuration(doc);

  useEffect(
    () =>
      clock.subscribe((t, p) => {
        if (timeRef.current) timeRef.current.textContent = fmt(t);
        if (headRef.current) headRef.current.style.transform = `translateX(${t * pps}px)`;
        setPlaying((old) => (old !== p ? p : old));
        if (p && stripRef.current) {
          const x = t * pps;
          const el = stripRef.current;
          if (x < el.scrollLeft + 20 || x > el.scrollLeft + el.clientWidth - 40) el.scrollLeft = x - 40;
        }
      }),
    [clock, pps]
  );
  useEffect(() => {
    if (timeRef.current) timeRef.current.textContent = fmt(clock.time);
    if (headRef.current) headRef.current.style.transform = `translateX(${clock.time * pps}px)`;
  }, [pps, clock, doc]);

  const resizing = useRef<{ idx: number; x: number; d: number } | null>(null);
  const seekFromEvent = (e: React.PointerEvent) => {
    const el = stripRef.current!;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left + el.scrollLeft - 12;
    const t = Math.max(0, Math.min(total - 0.01, x / pps));
    clock.pause();
    clock.seek(t);
    let idx = 0;
    starts.forEach((s, i) => t >= s && (idx = i));
    if (idx !== useStudio.getState().sceneIdx) useStudio.setState({ sceneIdx: idx, layerId: null });
  };

  const scene = doc.scenes[sceneIdx];
  const trackW = desktop ? 520 : 300;

  return (
    <div className="select-none border-t border-mk-line bg-mk-panel">
      {/* kontrol */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button type="button" className="mk-btn-icon" onClick={() => (clock.pause(), clock.seek(0))} title="Ke awal">
          <SkipBack className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => clock.toggle()} className="flex h-9 w-9 items-center justify-center rounded-full bg-mk-grad text-mk-ink shadow-mk-glow" title="Putar / jeda (Spasi)">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <span className="font-mono text-xs tabular-nums text-mk-cream">
          <span ref={timeRef}>0:00.0</span>
          <span className="text-mk-dim"> / {fmt(total)}</span>
        </span>
        <span className="ml-auto text-[11px] font-semibold text-mk-dim">
          Scene {sceneIdx + 1}/{doc.scenes.length}
        </span>
        <button type="button" className="mk-btn-ghost px-2.5 py-1.5 text-[11px]" onClick={() => st.addScene(sceneIdx)}>
          <Plus className="h-3.5 w-3.5" /> Scene
        </button>
      </div>

      {/* strip scene */}
      <div ref={stripRef} className="mk-scroll relative overflow-x-auto px-3 pb-2" onPointerDown={(e) => (e.target as HTMLElement).dataset.strip && seekFromEvent(e)}>
        <div className="relative flex h-[68px] items-stretch" style={{ width: total * pps + 60 }} data-strip="1">
          {doc.scenes.map((s, i) => {
            const w = s.duration * pps;
            const tr = i > 0 ? getTransition(s.transition.id) : null;
            return (
              <div
                key={s.id}
                className={cx('group relative mr-0 flex shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg border-2 px-1 py-1', i === sceneIdx ? 'border-mk-coral bg-mk-coral/10' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}
                style={{ width: w - 2, marginRight: 2 }}
                onClick={() => {
                  clock.pause();
                  st.selectScene(i);
                }}
              >
                <div className="h-full shrink-0">
                  <SceneThumb doc={doc} scene={s} />
                </div>
                {w > 90 && (
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-bold">{s.name.replace(/^\d+\.\s*/, '')}</div>
                    <div className="text-[10px] text-mk-dim">{s.duration.toFixed(1)}s</div>
                  </div>
                )}
                {/* tarik untuk ubah durasi */}
                <span
                  className="absolute right-0 top-0 h-full w-3 cursor-ew-resize touch-none bg-mk-coral/0 group-hover:bg-mk-coral/40"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    resizing.current = { idx: i, x: e.clientX, d: s.duration };
                  }}
                  onPointerMove={(e) => {
                    const r = resizing.current;
                    if (!r) return;
                    const d = Math.max(1, Math.min(15, Math.round((r.d + (e.clientX - r.x) / pps) * 10) / 10));
                    st.live((doc2) => ({ ...doc2, scenes: doc2.scenes.map((sc, k) => (k === r.idx ? { ...sc, duration: d } : sc)) }));
                  }}
                  onPointerUp={() => {
                    resizing.current = null;
                    st.endDrag();
                  }}
                />
                {tr && (
                  <button
                    type="button"
                    title={`Transisi: ${tr.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      st.selectScene(i);
                      onOpenTool('transisi');
                    }}
                    className="absolute -left-0.5 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md border border-mk-line-2 bg-mk-ink text-[10px] text-mk-amber shadow"
                  >
                    ⇄
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => st.addScene(doc.scenes.length - 1)} className="ml-1 flex w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-mk-line-2 text-mk-muted hover:border-mk-coral hover:text-mk-coral" title="Tambah scene">
            <Plus className="h-4 w-4" />
          </button>
          <div ref={headRef} className="pointer-events-none absolute -top-1 left-0 z-20 h-[76px] w-0.5 bg-mk-cream shadow-[0_0_6px_rgba(255,255,255,0.8)]">
            <span className="absolute -left-[5px] -top-1 h-3 w-3 rounded-full bg-mk-cream" />
          </div>
        </div>
      </div>

      {/* track layer (mode Pro) */}
      {mode === 'pro' && scene && scene.layers.length > 0 && (
        <div className="mk-scroll max-h-40 overflow-y-auto border-t border-mk-line px-3 py-2">
          {[...scene.layers].reverse().map((l) => {
            const s = l.start / scene.duration;
            const e = (l.end ?? scene.duration) / scene.duration;
            return (
              <div key={l.id} className="flex items-center gap-2 py-0.5">
                <span onClick={() => st.selectLayer(l.id)} className={cx('w-24 shrink-0 cursor-pointer truncate text-[10px] font-semibold', layerId === l.id ? 'text-mk-coral' : 'text-mk-muted')}>
                  {l.kind === 'text' ? l.text : l.name}
                </span>
                <div className="relative h-5 flex-1 rounded bg-mk-ink" style={{ maxWidth: trackW }}>
                  <TrackBar
                    left={s}
                    right={e}
                    active={layerId === l.id}
                    onSelect={() => st.selectLayer(l.id)}
                    onChange={(a, b) => st.updateLayer(l.id, { start: Math.max(0, Math.round(a * scene.duration * 20) / 20), end: b >= 0.995 ? null : Math.round(b * scene.duration * 20) / 20 }, true)}
                    onEnd={st.endDrag}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackBar({ left, right, active, onChange, onEnd, onSelect }: { left: number; right: number; active: boolean; onChange: (a: number, b: number) => void; onEnd: () => void; onSelect: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'move' | 'l' | 'r'; x: number; a: number; b: number } | null>(null);
  const begin = (mode: 'move' | 'l' | 'r') => (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, a: left, b: right };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const host = ref.current?.parentElement;
    if (!d || !host) return;
    const dx = (e.clientX - d.x) / host.clientWidth;
    if (d.mode === 'move') {
      const w = d.b - d.a;
      const a = Math.max(0, Math.min(1 - w, d.a + dx));
      onChange(a, a + w);
    } else if (d.mode === 'l') onChange(Math.max(0, Math.min(d.b - 0.05, d.a + dx)), d.b);
    else onChange(d.a, Math.min(1, Math.max(d.a + 0.05, d.b + dx)));
  };
  const up = () => {
    if (drag.current) onEnd();
    drag.current = null;
  };
  return (
    <div
      ref={ref}
      className={cx('absolute top-0.5 h-4 cursor-grab touch-none rounded', active ? 'bg-mk-coral' : 'bg-mk-coral/45')}
      style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%` }}
      onPointerDown={begin('move')}
      onPointerMove={move}
      onPointerUp={up}
    >
      <span className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l bg-white/40" onPointerDown={begin('l')} onPointerMove={move} onPointerUp={up} />
      <span className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r bg-white/40" onPointerDown={begin('r')} onPointerMove={move} onPointerUp={up} />
    </div>
  );
}
