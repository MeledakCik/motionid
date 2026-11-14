'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Layer, TextLayer } from '@/lib/studio/types';
import { canvasSize, docDuration } from '@/lib/studio/types';
import { layerAt, locate, Renderer, sceneStarts, settleTime } from '@/lib/studio/renderer';
import { PlaybackClock } from '@/lib/studio/clock';
import { getDeviceProfile } from '@/lib/studio/device';
import { ensureFonts, fontStack } from '@/lib/studio/fonts';
import { useStudio } from '@/store/useStudio';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot';
interface DragState {
  kind: 'move' | 'resize' | 'rotate';
  handle?: Handle;
  id: string;
  startX: number;
  startY: number;
  orig: Pick<Layer, 'x' | 'y' | 'w' | 'h' | 'rotation'>;
  keepRatio: boolean;
  moved: boolean;
}

const SNAP = 14;

export default function Stage({ clock, onRequestEdit }: { clock: PlaybackClock; onRequestEdit?: () => void }) {
  const doc = useStudio((s) => s.doc);
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layerId = useStudio((s) => s.layerId);
  const selectLayer = useStudio((s) => s.selectLayer);
  const selectScene = useStudio((s) => s.selectScene);
  const updateLayer = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [box, setBox] = useState({ w: 270, h: 480 });
  const [playing, setPlaying] = useState(false);
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [editingText, setEditingText] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const profile = useMemo(() => getDeviceProfile(), []);

  const base = doc ? canvasSize(doc.aspect) : { w: 1080, h: 1920 };
  const scale = box.w / base.w;

  // ukuran tampilan mengikuti container
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const ar = base.w / base.h;
      let w = r.width - 16;
      let h = w / ar;
      if (h > r.height - 16) {
        h = r.height - 16;
        w = h * ar;
      }
      setBox({ w: Math.max(120, Math.floor(w)), h: Math.max(120, Math.floor(h)) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [base.w, base.h]);

  // ukuran piksel kanvas (dibatasi untuk HP lemah)
  const px = useMemo(() => {
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, profile.tier === 'high' ? 2 : 1.5) : 1;
    let w = Math.round(box.w * dpr);
    const maxW = base.w > base.h ? profile.previewMaxW * 1.6 : profile.previewMaxW;
    if (w > maxW) w = Math.round(maxW);
    return { w, h: Math.round((w * base.h) / base.w) };
  }, [box.w, base.w, base.h, profile]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    const r = rendererRef.current;
    if (!c || !r || !r.doc) return;
    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) return;
    r.render(ctx, c.width, c.height, clock.time);
  }, [clock]);

  // renderer + font
  useEffect(() => {
    const r = new Renderer({ allowBlur: profile.allowBlur, particleScale: profile.particleScale });
    r.onAssetLoaded = () => requestAnimationFrame(draw);
    rendererRef.current = r;
    return () => {
      rendererRef.current = null;
    };
  }, [profile, draw]);

  useEffect(() => {
    if (!doc || !rendererRef.current) return;
    rendererRef.current.setDoc(doc);
    clock.setDuration(docDuration(doc));
    clock.setMusic(doc.music.id, doc.music.volume);
    draw();
  }, [doc, clock, draw]);

  useEffect(() => {
    if (!doc) return;
    const fonts = new Set([doc.theme.headingFont, doc.theme.bodyFont]);
    doc.scenes.forEach((s) => s.layers.forEach((l) => l.kind === 'text' && fonts.add(l.font)));
    ensureFonts([...fonts]).then(draw);
  }, [doc, draw]);

  // jam → kanvas (tanpa React re-render per frame)
  useEffect(() => {
    let lastIdx = -1;
    let lastFrame = 0;
    const minGap = 1000 / profile.previewFps - 2;
    return clock.subscribe((t, isPlaying) => {
      const now = performance.now();
      if (isPlaying && now - lastFrame < minGap) return;
      lastFrame = now;
      draw();
      setPlaying((p) => (p !== isPlaying ? isPlaying : p));
      const d = useStudio.getState().doc;
      if (d && isPlaying) {
        const { idx } = locate(d, t);
        if (idx !== lastIdx) {
          lastIdx = idx;
          if (idx !== useStudio.getState().sceneIdx) useStudio.setState({ sceneIdx: idx, layerId: null });
        }
      }
    });
  }, [clock, draw, profile.previewFps]);

  useEffect(() => {
    draw();
  }, [px.w, px.h, draw]);

  // pindah scene saat berhenti → tampilkan pose akhir supaya mudah diedit
  useEffect(() => {
    const d = useStudio.getState().doc;
    if (!d || clock.playing) return;
    const st = sceneStarts(d)[sceneIdx] ?? 0;
    const sc = d.scenes[sceneIdx];
    const { idx } = locate(d, clock.time);
    if (idx !== sceneIdx || clock.time < st + 0.01) clock.seek(st + (sc ? settleTime(sc) : 0.5));
  }, [sceneIdx, clock]);

  const scene = doc?.scenes[sceneIdx];
  const selected = scene?.layers.find((l) => l.id === layerId) || null;

  const toBase = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * base.w, y: ((e.clientY - r.top) / r.height) * base.h };
  };

  const ensureEditable = () => {
    if (clock.playing) clock.pause();
    const d = useStudio.getState().doc;
    if (!d) return;
    const st = sceneStarts(d)[sceneIdx] ?? 0;
    const sc = d.scenes[sceneIdx];
    const { idx } = locate(d, clock.time);
    if (idx !== sceneIdx && sc) clock.seek(st + settleTime(sc));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scene || e.button > 0) return;
    ensureEditable();
    const p = toBase(e);
    const hit = layerAt(scene, p.x, p.y);
    if (!hit) {
      selectLayer(null);
      return;
    }
    selectLayer(hit.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { kind: 'move', id: hit.id, startX: p.x, startY: p.y, orig: { x: hit.x, y: hit.y, w: hit.w, h: hit.h, rotation: hit.rotation }, keepRatio: false, moved: false };
  };

  const startHandle = (e: React.PointerEvent, h: Handle) => {
    if (!selected) return;
    e.stopPropagation();
    ensureEditable();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toBase(e);
    const ratioKinds = selected.kind === 'icon' || selected.kind === 'image' || selected.kind === 'component';
    dragRef.current = {
      kind: h === 'rot' ? 'rotate' : 'resize',
      handle: h,
      id: selected.id,
      startX: p.x,
      startY: p.y,
      orig: { x: selected.x, y: selected.y, w: selected.w, h: selected.h, rotation: selected.rotation },
      keepRatio: ratioKinds && h.length === 2,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toBase(e);
    let dx = p.x - d.startX;
    let dy = p.y - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4 / scale) return;
    d.moved = true;
    const o = d.orig;
    if (d.kind === 'move') {
      let nx = o.x + dx;
      let ny = o.y + dy;
      const cxv = nx + o.w / 2;
      const cyv = ny + o.h / 2;
      let gx: number | null = null;
      let gy: number | null = null;
      const tx = [base.w / 2, base.w * 0.08, base.w * 0.92];
      const ty = [base.h / 2, base.h * 0.1, base.h * 0.9];
      if (!e.altKey) {
        if (Math.abs(cxv - tx[0]) < SNAP / scale) (nx = tx[0] - o.w / 2), (gx = tx[0]);
        else if (Math.abs(nx - tx[1]) < SNAP / scale) (nx = tx[1]), (gx = tx[1]);
        else if (Math.abs(nx + o.w - tx[2]) < SNAP / scale) (nx = tx[2] - o.w), (gx = tx[2]);
        if (Math.abs(cyv - ty[0]) < SNAP / scale) (ny = ty[0] - o.h / 2), (gy = ty[0]);
        else if (Math.abs(ny - ty[1]) < SNAP / scale) (ny = ty[1]), (gy = ty[1]);
        else if (Math.abs(ny + o.h - ty[2]) < SNAP / scale) (ny = ty[2] - o.h), (gy = ty[2]);
      }
      setGuides({ x: gx, y: gy });
      updateLayer(d.id, { x: Math.round(nx), y: Math.round(ny) }, true);
    } else if (d.kind === 'rotate') {
      const cxv = o.x + o.w / 2;
      const cyv = o.y + o.h / 2;
      let ang = (Math.atan2(p.y - cyv, p.x - cxv) * 180) / Math.PI + 90;
      const near = Math.round(ang / 45) * 45;
      if (e.shiftKey || Math.abs(ang - near) < 4) ang = near;
      ang = ((ang + 540) % 360) - 180;
      updateLayer(d.id, { rotation: Math.round(ang) }, true);
    } else {
      // ubah ukuran dalam ruang lokal layer (mendukung rotasi)
      const a = (-o.rotation * Math.PI) / 180;
      const ldx = dx * Math.cos(a) - dy * Math.sin(a);
      const ldy = dx * Math.sin(a) + dy * Math.cos(a);
      const h = d.handle!;
      let w = o.w;
      let hh = o.h;
      if (h.includes('e')) w = o.w + ldx;
      if (h.includes('w')) w = o.w - ldx;
      if (h.includes('s')) hh = o.h + ldy;
      if (h.includes('n')) hh = o.h - ldy;
      if (d.keepRatio || e.shiftKey) {
        const r = o.w / o.h;
        if (Math.abs(w / o.w) > Math.abs(hh / o.h)) hh = w / r;
        else w = hh * r;
      }
      w = Math.max(24, w);
      hh = Math.max(24, hh);
      // geser pusat sesuai offset lokal
      const ca = Math.cos(-a);
      const sa = Math.sin(-a);
      const shiftLX = h.includes('w') ? o.w - w : 0;
      const shiftLY = h.includes('n') ? o.h - hh : 0;
      const centerLX = shiftLX + w / 2 - o.w / 2;
      const centerLY = shiftLY + hh / 2 - o.h / 2;
      const gcx = o.x + o.w / 2 + centerLX * ca - centerLY * sa;
      const gcy = o.y + o.h / 2 + centerLX * sa + centerLY * ca;
      const patch: Partial<Layer> = { w: Math.round(w), h: Math.round(hh), x: Math.round(gcx - w / 2), y: Math.round(gcy - hh / 2) };
      // ukuran font teks ikut membesar saat tarik sudut
      const L = scene?.layers.find((l) => l.id === d.id);
      if (L?.kind === 'text' && h.length === 2) (patch as Partial<TextLayer>).size = Math.max(12, Math.round(((L as TextLayer).size * w) / Math.max(1, L.w)));
      updateLayer(d.id, patch, true);
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    setGuides({ x: null, y: null });
    if (d?.moved) endDrag();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!scene) return;
    const p = toBase(e);
    const hit = layerAt(scene, p.x, p.y);
    if (hit?.kind === 'text') {
      selectLayer(hit.id);
      setEditingText(hit.id);
      if (rendererRef.current) rendererRef.current.skipLayerId = hit.id;
      draw();
    } else if (hit) onRequestEdit?.();
  };

  const finishTextEdit = (value?: string) => {
    if (editingText && value !== undefined) {
      const L = scene?.layers.find((l) => l.id === editingText) as TextLayer | undefined;
      if (L && L.text !== value) updateLayer(editingText, { text: value } as Partial<TextLayer>);
    }
    setEditingText(null);
    if (rendererRef.current) rendererRef.current.skipLayerId = null;
    requestAnimationFrame(draw);
  };

  // pintasan keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
      const st = useStudio.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        st.redo();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        clock.toggle();
        return;
      }
      if (!st.layerId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        st.removeLayer(st.layerId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        st.duplicateLayer(st.layerId);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const L = st.doc?.scenes[st.sceneIdx]?.layers.find((l) => l.id === st.layerId);
        if (!L) return;
        const k = e.shiftKey ? 20 : 4;
        const dx = e.key === 'ArrowLeft' ? -k : e.key === 'ArrowRight' ? k : 0;
        const dy = e.key === 'ArrowUp' ? -k : e.key === 'ArrowDown' ? k : 0;
        st.updateLayer(L.id, { x: L.x + dx, y: L.y + dy });
      } else if (e.key === 'Escape') st.selectLayer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock]);

  // swipe kiri/kanan di area kosong untuk ganti scene (HP)
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  const editingLayer = editingText ? (scene?.layers.find((l) => l.id === editingText) as TextLayer | undefined) : undefined;

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      onTouchStart={(e) => (swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() })}
      onTouchEnd={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s || dragRef.current || useStudio.getState().layerId) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 50 && Date.now() - s.t < 500) selectScene(sceneIdx + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="relative shadow-mk-card" style={{ width: box.w, height: box.h }}>
        <canvas
          ref={canvasRef}
          width={px.w}
          height={px.h}
          className="block h-full w-full touch-none select-none rounded-[14px] bg-black"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
        />

        {/* garis bantu snap */}
        {guides.x !== null && <div className="pointer-events-none absolute top-0 h-full w-px bg-mk-coral" style={{ left: guides.x * scale }} />}
        {guides.y !== null && <div className="pointer-events-none absolute left-0 h-px w-full bg-mk-coral" style={{ top: guides.y * scale }} />}

        {/* kotak seleksi gaya Figma */}
        {selected && !playing && !editingText && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: selected.x * scale,
              top: selected.y * scale,
              width: selected.w * scale,
              height: selected.h * scale,
              transform: `rotate(${selected.rotation}deg)`,
            }}
          >
            <div className="absolute inset-0 rounded-[2px] border-[1.5px] border-mk-coral" />
            {!selected.locked &&
              (['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as Handle[]).map((h) => {
                const pos: Record<string, React.CSSProperties> = {
                  nw: { left: 0, top: 0, cursor: 'nwse-resize' },
                  n: { left: '50%', top: 0, cursor: 'ns-resize' },
                  ne: { left: '100%', top: 0, cursor: 'nesw-resize' },
                  e: { left: '100%', top: '50%', cursor: 'ew-resize' },
                  se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
                  s: { left: '50%', top: '100%', cursor: 'ns-resize' },
                  sw: { left: 0, top: '100%', cursor: 'nesw-resize' },
                  w: { left: 0, top: '50%', cursor: 'ew-resize' },
                };
                const small = selected.w * scale < 60 || selected.h * scale < 40;
                if (small && h.length === 1) return null;
                return (
                  <span
                    key={h}
                    onPointerDown={(e) => startHandle(e, h)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="pointer-events-auto absolute -ml-2 -mt-2 flex h-4 w-4 touch-none items-center justify-center"
                    style={pos[h]}
                  >
                    <span className={`block border-[1.5px] border-mk-coral bg-white ${h.length === 1 ? 'h-2 w-2 rounded-[2px]' : 'h-2.5 w-2.5 rounded-[3px]'}`} />
                  </span>
                );
              })}
            {!selected.locked && (
              <span
                onPointerDown={(e) => startHandle(e, 'rot')}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="pointer-events-auto absolute left-1/2 -top-8 -ml-3 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-full border-[1.5px] border-mk-coral bg-white text-[11px] text-mk-ink"
                title="Putar"
              >
                ↻
              </span>
            )}
            <span className="absolute -bottom-6 left-0 whitespace-nowrap rounded bg-mk-coral px-1.5 py-0.5 text-[10px] font-bold text-mk-ink">
              {Math.round(selected.w)} × {Math.round(selected.h)}
            </span>
          </div>
        )}

        {/* edit teks langsung di kanvas */}
        {editingLayer && (
          <textarea
            autoFocus
            defaultValue={editingLayer.text}
            onBlur={(e) => finishTextEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') finishTextEdit(undefined);
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur();
            }}
            className="absolute resize-none overflow-hidden rounded border-2 border-mk-coral bg-black/30 p-0 outline-none"
            style={{
              left: editingLayer.x * scale,
              top: editingLayer.y * scale,
              width: editingLayer.w * scale,
              height: editingLayer.h * scale,
              transform: `rotate(${editingLayer.rotation}deg)`,
              fontFamily: fontStack(editingLayer.font),
              fontSize: Math.max(10, editingLayer.size * scale * 0.9),
              fontWeight: editingLayer.weight,
              lineHeight: editingLayer.lineHeight,
              color: editingLayer.color,
              textAlign: editingLayer.align,
              textTransform: editingLayer.uppercase ? 'uppercase' : undefined,
            }}
          />
        )}
      </div>
    </div>
  );
}
