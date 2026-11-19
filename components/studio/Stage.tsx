'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Circle, MousePointer2, PenTool, Pencil, Slash, Square, Type } from 'lucide-react';
import type { Layer, PathLayer, TextLayer } from '@/lib/studio/types';
import { canvasSize, docDuration } from '@/lib/studio/types';
import { layerAt, locate, Renderer, sceneStarts, settleTime } from '@/lib/studio/renderer';
import { PlaybackClock } from '@/lib/studio/clock';
import { getDeviceProfile } from '@/lib/studio/device';
import { ensureFonts, fontStack } from '@/lib/studio/fonts';
import { makeShape, makeText } from '@/lib/studio/builder';
import { AbsPoint, bounds, pathFromAbs, pathToAbs, posed, setPathAbs, simplify, smoothPoints } from '@/lib/studio/vector';
import { DrawTool, useStudio } from '@/store/useStudio';
import { cx } from './ui';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot';
interface DragState {
  kind: 'move' | 'resize' | 'rotate';
  handle?: Handle;
  id: string;
  startX: number;
  startY: number;
  orig: Pick<Layer, 'x' | 'y' | 'w' | 'h' | 'rotation'>;
  /** layer lain yang ikut digeser (seleksi ganda) */
  others: Array<{ id: string; x: number; y: number }>;
  keepRatio: boolean;
  moved: boolean;
}

/** Draf saat menggambar dengan alat bentuk / garis / pensil / kotak seleksi. */
type Draft =
  | { kind: 'rect' | 'ellipse' | 'marquee'; x0: number; y0: number; x1: number; y1: number; shift: boolean; alt: boolean }
  | { kind: 'line'; x0: number; y0: number; x1: number; y1: number; shift: boolean; alt: boolean }
  | { kind: 'pencil'; pts: Array<{ x: number; y: number }> };

const SNAP = 14;

export const DRAW_TOOLS: Array<{ id: DrawTool; label: string; key: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'select', label: 'Pilih', key: 'V', icon: MousePointer2 },
  { id: 'rect', label: 'Persegi', key: 'R', icon: Square },
  { id: 'ellipse', label: 'Elips', key: 'O', icon: Circle },
  { id: 'line', label: 'Garis', key: 'L', icon: Slash },
  { id: 'pen', label: 'Pena', key: 'P', icon: PenTool },
  { id: 'pencil', label: 'Pensil', key: 'N', icon: Pencil },
  { id: 'text', label: 'Teks', key: 'T', icon: Type },
];

const TOOL_HINT: Partial<Record<DrawTool, string>> = {
  rect: 'Seret untuk menggambar persegi. Tahan Shift agar sama sisi.',
  ellipse: 'Seret untuk menggambar elips. Tahan Shift agar bulat sempurna.',
  line: 'Seret untuk menarik garis. Tahan Shift untuk sudut 45°.',
  pen: 'Klik untuk titik, seret untuk lengkungan. Klik titik pertama untuk menutup. Enter selesai, Esc batal.',
  pencil: 'Gambar bebas dengan jari atau mouse. Garis dirapikan otomatis.',
  text: 'Klik di kanvas untuk menaruh teks.',
};

export default function Stage({ clock, onRequestEdit }: { clock: PlaybackClock; onRequestEdit?: () => void }) {
  const doc = useStudio((s) => s.doc);
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layerId = useStudio((s) => s.layerId);
  const selIds = useStudio((s) => s.selIds);
  const drawTool = useStudio((s) => s.drawTool);
  const pathEdit = useStudio((s) => s.pathEdit);
  const isolation = useStudio((s) => s.isolation);
  const selectLayer = useStudio((s) => s.selectLayer);
  const selectScene = useStudio((s) => s.selectScene);
  const updateLayer = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [box, setBox] = useState({ w: 270, h: 480 });
  const [playing, setPlaying] = useState(false);
  const [lt, setLt] = useState(0);
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [editingText, setEditingText] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const [pen, setPen] = useState<AbsPoint[]>([]);
  const penDown = useRef(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const ptDrag = useRef<{ i: number; part: 'a' | 'i' | 'o'; alt: boolean } | null>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const pinch = useRef<{ d: number; z: number; cx: number; cy: number; x: number; y: number } | null>(null);
  const coarse = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches, []);
  const profile = useMemo(() => getDeviceProfile(), []);

  const base = doc ? canvasSize(doc.aspect) : { w: 1080, h: 1920 };
  const scale = box.w / base.w;

  const setDraftBoth = (d: Draft | null) => {
    draftRef.current = d;
    setDraft(d);
  };

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
      r.dispose();
      rendererRef.current = null;
    };
  }, [profile, draw]);

  useEffect(() => {
    if (!doc || !rendererRef.current) return;
    rendererRef.current.setDoc(doc);
    clock.setDuration(docDuration(doc));
    clock.setMusic(doc.music.id, doc.music.volume, doc.audio?.data, doc.narration);
    draw();
  }, [doc, clock, draw]);

  // mode edit isi grup: elemen lain dipudarkan
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.focusIds = isolation ? new Set(isolation.childIds) : null;
    draw();
  }, [isolation, draw]);

  useEffect(() => {
    if (!doc) return;
    const fonts = new Set([doc.theme.headingFont, doc.theme.bodyFont]);
    const walk = (l: Layer) => (l.kind === 'text' ? fonts.add(l.font) : l.kind === 'group' ? l.children.forEach(walk) : null);
    doc.scenes.forEach((s) => s.layers.forEach(walk));
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
      rendererRef.current?.syncMedia(t, isPlaying);
      draw();
      setPlaying((p) => (p !== isPlaying ? isPlaying : p));
      const s = useStudio.getState();
      const d = s.doc;
      if (d && isPlaying) {
        const { idx } = locate(d, t);
        if (idx !== lastIdx) {
          lastIdx = idx;
          if (idx !== s.sceneIdx) useStudio.setState({ sceneIdx: idx, layerId: null, selIds: [] });
        }
      }
      if (d && !isPlaying) {
        const l = Math.max(0, t - (sceneStarts(d)[s.sceneIdx] ?? 0));
        setLt(l);
        if (Math.abs(s.playhead - l) > 0.004) useStudio.setState({ playhead: l });
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
    const l = Math.max(0, clock.time - st);
    setLt(l);
    useStudio.setState({ playhead: l });
  }, [sceneIdx, clock]);

  const scene = doc?.scenes[sceneIdx];
  const pickable = useMemo(() => (scene ? (isolation ? { ...scene, layers: scene.layers.filter((l) => isolation.childIds.includes(l.id)) } : scene) : null), [scene, isolation]);
  const selected = scene?.layers.find((l) => l.id === layerId) || null;
  const selPosed = selected ? posed(selected, lt) : null;
  const multi = selIds.length > 1;

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

  const palette = doc?.theme.palette;
  /** Layer baru dari alat gambar tampil sepanjang scene (atur waktunya nanti di timeline). */
  const atNow = <T extends Layer>(l: T): T => ({ ...l, start: 0, end: null });

  /* -------------------------- pena (Illustrator) -------------------------- */
  const finishPen = useCallback(
    (close: boolean) => {
      const pts = pen;
      setPen([]);
      penDown.current = false;
      if (pts.length < 2 || !palette) return;
      const L = pathFromAbs(pts, close, {
        fill: close ? palette.text : null,
        stroke: { color: close ? palette.text : palette.primary, width: close ? 0 : 10, cap: 'round' },
        name: close ? 'Bentuk pena' : 'Kurva pena',
      });
      if (close && L.stroke) L.stroke = null;
      useStudio.getState().addLayer(atNow(L));
      useStudio.getState().setDrawTool('select');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pen, palette]
  );

  /* -------------------------- pointer -------------------------- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!scene || !pickable || e.button > 0) return;
    ensureEditable();
    const p = toBase(e);
    const st = useStudio.getState();
    const tool = st.drawTool;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (tool === 'pen') {
      const first = pen[0];
      if (first && pen.length >= 2 && Math.hypot(p.x - first.x, p.y - first.y) < 14 / scale) {
        finishPen(true);
        return;
      }
      penDown.current = true;
      setPen((old) => [...old, { x: p.x, y: p.y }]);
      return;
    }
    if (tool === 'rect' || tool === 'ellipse' || tool === 'line') {
      setDraftBoth({ kind: tool, x0: p.x, y0: p.y, x1: p.x, y1: p.y, shift: e.shiftKey, alt: e.altKey });
      return;
    }
    if (tool === 'pencil') {
      setDraftBoth({ kind: 'pencil', pts: [p] });
      return;
    }
    if (tool === 'text' && palette && doc) {
      const w = Math.round(base.w * 0.6);
      const L = atNow(makeText({ theme: doc.theme }, 'Ketik teksmu', Math.round(p.x - w / 2), Math.round(p.y - 60), w, 120, { size: 72, name: 'Teks' }));
      st.addLayer(L);
      st.setDrawTool('select');
      setEditingText(L.id);
      if (rendererRef.current) rendererRef.current.skipLayerId = L.id;
      return;
    }

    // alat pilih
    const hit = layerAt(pickable, p.x, p.y, lt);
    if (!hit) {
      if (!e.shiftKey) selectLayer(null);
      if (!coarse) setDraftBoth({ kind: 'marquee', x0: p.x, y0: p.y, x1: p.x, y1: p.y, shift: e.shiftKey, alt: false });
      return;
    }
    if (e.shiftKey) {
      const ids = st.selIds.includes(hit.id) ? st.selIds.filter((i) => i !== hit.id) : [...st.selIds, hit.id];
      st.setSelection(ids);
      return;
    }
    const keepMulti = st.selIds.length > 1 && st.selIds.includes(hit.id);
    if (!keepMulti) selectLayer(hit.id);
    else useStudio.setState({ layerId: hit.id });
    const hp = posed(hit, lt).layer;
    const others = keepMulti
      ? scene.layers.filter((l) => l.id !== hit.id && st.selIds.includes(l.id) && !l.locked).map((l) => ({ id: l.id, ...(({ x, y }) => ({ x, y }))(posed(l, lt).layer) }))
      : [];
    dragRef.current = { kind: 'move', id: hit.id, startX: p.x, startY: p.y, orig: { x: hp.x, y: hp.y, w: hit.w, h: hit.h, rotation: hp.rotation }, others, keepRatio: false, moved: false };
  };

  const startHandle = (e: React.PointerEvent, h: Handle) => {
    if (!selected || !selPosed) return;
    e.stopPropagation();
    ensureEditable();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toBase(e);
    const ratioKinds = selected.kind === 'icon' || selected.kind === 'image' || selected.kind === 'component' || selected.kind === 'group';
    const sp = selPosed.layer;
    dragRef.current = {
      kind: h === 'rot' ? 'rotate' : 'resize',
      handle: h,
      id: selected.id,
      startX: p.x,
      startY: p.y,
      orig: { x: sp.x, y: sp.y, w: sp.w, h: sp.h, rotation: sp.rotation },
      others: [],
      keepRatio: ratioKinds && h.length === 2,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const tool = useStudio.getState().drawTool;
    if (tool === 'pen') {
      const p = toBase(e);
      setHover(p);
      if (penDown.current && pen.length) {
        // seret = tarik handle lengkung (simetris)
        const last = pen[pen.length - 1];
        const ox = p.x - last.x;
        const oy = p.y - last.y;
        if (Math.hypot(ox, oy) > 3 / scale) setPen((old) => [...old.slice(0, -1), { x: last.x, y: last.y, ox, oy, ix: -ox, iy: -oy }]);
      }
      return;
    }
    const dr = draftRef.current;
    if (dr) {
      const p = toBase(e);
      if (dr.kind === 'pencil') {
        const last = dr.pts[dr.pts.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) > 2 / scale) setDraftBoth({ ...dr, pts: [...dr.pts, p] });
      } else setDraftBoth({ ...dr, x1: p.x, y1: p.y, shift: e.shiftKey, alt: e.altKey });
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    const p = toBase(e);
    const dx = p.x - d.startX;
    const dy = p.y - d.startY;
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
      if (!e.altKey && !d.others.length) {
        if (Math.abs(cxv - tx[0]) < SNAP / scale) (nx = tx[0] - o.w / 2), (gx = tx[0]);
        else if (Math.abs(nx - tx[1]) < SNAP / scale) (nx = tx[1]), (gx = tx[1]);
        else if (Math.abs(nx + o.w - tx[2]) < SNAP / scale) (nx = tx[2] - o.w), (gx = tx[2]);
        if (Math.abs(cyv - ty[0]) < SNAP / scale) (ny = ty[0] - o.h / 2), (gy = ty[0]);
        else if (Math.abs(ny - ty[1]) < SNAP / scale) (ny = ty[1]), (gy = ty[1]);
        else if (Math.abs(ny + o.h - ty[2]) < SNAP / scale) (ny = ty[2] - o.h), (gy = ty[2]);
      }
      setGuides({ x: gx, y: gy });
      updateLayer(d.id, { x: Math.round(nx), y: Math.round(ny) }, true);
      const rdx = nx - o.x;
      const rdy = ny - o.y;
      for (const ot of d.others) updateLayer(ot.id, { x: Math.round(ot.x + rdx), y: Math.round(ot.y + rdy) }, true);
    } else if (d.kind === 'rotate') {
      const cxv = o.x + o.w / 2;
      const cyv = o.y + o.h / 2;
      let ang = (Math.atan2(p.y - cyv, p.x - cxv) * 180) / Math.PI - 90;
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
      w = Math.max(8, w);
      hh = Math.max(8, hh);
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
    penDown.current = false;
    const dr = draftRef.current;
    if (dr && palette && scene) {
      setDraftBoth(null);
      const st = useStudio.getState();
      if (dr.kind === 'marquee') {
        const x0 = Math.min(dr.x0, dr.x1);
        const y0 = Math.min(dr.y0, dr.y1);
        const x1 = Math.max(dr.x0, dr.x1);
        const y1 = Math.max(dr.y0, dr.y1);
        if (x1 - x0 < 6 / scale && y1 - y0 < 6 / scale) return;
        const hits = (pickable?.layers || []).filter((l) => {
          if (l.hidden || l.locked || lt < l.start || (l.end !== null && lt >= l.end)) return false;
          const b = bounds(posed(l, lt).layer);
          return b.x < x1 && b.x + b.w > x0 && b.y < y1 && b.y + b.h > y0;
        });
        st.setSelection(dr.shift ? Array.from(new Set([...st.selIds, ...hits.map((h) => h.id)])) : hits.map((h) => h.id));
        return;
      }
      if (dr.kind === 'pencil') {
        if (dr.pts.length < 3) return;
        const simple = simplify(dr.pts, Math.max(1.5, 2 / scale));
        const first = simple[0];
        const last = simple[simple.length - 1];
        const closed = simple.length > 3 && Math.hypot(first.x - last.x, first.y - last.y) < 24 / scale;
        const pts = closed ? simple.slice(0, -1) : simple;
        const L = pathFromAbs(smoothPoints(pts, closed), closed, { fill: null, stroke: { color: palette.primary, width: 10, cap: 'round' }, name: 'Goresan pensil' });
        st.addLayer(atNow(L));
        return;
      }
      const rect = draftRect(dr);
      const tiny = rect.w < 6 / scale && rect.h < 6 / scale;
      if (dr.kind === 'line') {
        let x1 = dr.x1;
        let y1 = dr.y1;
        if (tiny) (x1 = dr.x0 + 300), (y1 = dr.y0);
        else if (dr.shift) [x1, y1] = snap45(dr.x0, dr.y0, dr.x1, dr.y1);
        st.addLayer(atNow(pathFromAbs([{ x: dr.x0, y: dr.y0 }, { x: x1, y: y1 }], false, { fill: null, stroke: { color: palette.text, width: 8, cap: 'round' }, name: 'Garis' })));
      } else {
        const r = tiny ? { x: dr.x0 - 150, y: dr.y0 - 150, w: 300, h: 300 } : rect;
        const L = makeShape(dr.kind === 'rect' ? 'rect' : 'circle', Math.round(r.x), Math.round(r.y), Math.max(8, Math.round(r.w)), Math.max(8, Math.round(r.h)), dr.kind === 'rect' ? palette.primary : palette.secondary, {
          name: dr.kind === 'rect' ? 'Persegi' : 'Elips',
          radius: dr.kind === 'rect' ? 24 : 0,
        });
        st.addLayer(atNow(L));
      }
      st.setDrawTool('select');
      return;
    }
    const d = dragRef.current;
    dragRef.current = null;
    setGuides({ x: null, y: null });
    if (d?.moved) endDrag();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!pickable) return;
    if (useStudio.getState().drawTool === 'pen') {
      // klik ganda menambah titik ganda; hapus titik duplikat terakhir lalu selesai
      setPen((old) => old.slice(0, -1));
      setTimeout(() => finishPenRef.current(false), 0);
      return;
    }
    const p = toBase(e);
    const hit = layerAt(pickable, p.x, p.y, lt);
    const st = useStudio.getState();
    if (hit?.kind === 'text') {
      selectLayer(hit.id);
      setEditingText(hit.id);
      if (rendererRef.current) rendererRef.current.skipLayerId = hit.id;
      draw();
    } else if (hit?.kind === 'group') st.enterGroup(hit.id);
    else if (hit?.kind === 'path') st.setPathEdit(hit.id);
    else if (hit) onRequestEdit?.();
  };
  const finishPenRef = useRef(finishPen);
  finishPenRef.current = finishPen;

  const finishTextEdit = (value?: string) => {
    if (editingText && value !== undefined) {
      const L = scene?.layers.find((l) => l.id === editingText) as TextLayer | undefined;
      if (L && L.text !== value) updateLayer(editingText, { text: value } as Partial<TextLayer>);
    }
    setEditingText(null);
    if (rendererRef.current) rendererRef.current.skipLayerId = null;
    requestAnimationFrame(draw);
  };

  /* -------------------------- edit titik vektor -------------------------- */
  const editPath = pathEdit && selected?.kind === 'path' && selected.id === pathEdit ? (selPosed!.layer as PathLayer) : null;
  const editAbs = editPath ? pathToAbs(editPath) : null;

  const startPt = (e: React.PointerEvent, i: number, part: 'a' | 'i' | 'o') => {
    e.stopPropagation();
    ensureEditable();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (part === 'a' && e.altKey && editPath && editAbs) {
      // Alt+klik titik: ubah sudut tajam ↔ lengkung
      const abs = editAbs.map((p) => ({ ...p }));
      const q = abs[i];
      if (q.ix !== undefined || q.ox !== undefined) (q.ix = q.iy = q.ox = q.oy = undefined);
      else {
        const prev = abs[(i - 1 + abs.length) % abs.length];
        const next = abs[(i + 1) % abs.length];
        const tx = (next.x - prev.x) / 6;
        const ty = (next.y - prev.y) / 6;
        Object.assign(q, { ix: -tx, iy: -ty, ox: tx, oy: ty });
      }
      updateLayer(editPath.id, pick(setPathAbs(editPath, abs)));
      return;
    }
    ptDrag.current = { i, part, alt: e.altKey };
  };
  const movePt = (e: React.PointerEvent) => {
    const d = ptDrag.current;
    if (!d || !editPath || !editAbs) return;
    const p = toBase(e);
    const abs = editAbs.map((q) => ({ ...q }));
    const q = abs[d.i];
    if (d.part === 'a') (q.x = p.x), (q.y = p.y);
    else {
      const hx = p.x - q.x;
      const hy = p.y - q.y;
      if (d.part === 'o') {
        (q.ox = hx), (q.oy = hy);
        if (!e.altKey && !d.alt) (q.ix = -hx), (q.iy = -hy);
      } else {
        (q.ix = hx), (q.iy = hy);
        if (!e.altKey && !d.alt) (q.ox = -hx), (q.oy = -hy);
      }
    }
    updateLayer(editPath.id, pick(setPathAbs(editPath, abs)), true);
  };
  const upPt = () => {
    if (ptDrag.current) endDrag();
    ptDrag.current = null;
  };
  /** Klik ganda pada garis: sisipkan titik baru di segmen terdekat. */
  const insertPt = (e: React.MouseEvent) => {
    if (!editPath || !editAbs) return;
    e.stopPropagation();
    const p = toBase(e);
    const n = editAbs.length;
    const segs = editPath.closed ? n : n - 1;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < segs; i++) {
      const a = editAbs[i];
      const b = editAbs[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / Math.max(1e-6, dx * dx + dy * dy)));
      const d = Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
      if (d < bestD) (bestD = d), (best = i);
    }
    const abs = [...editAbs];
    abs.splice(best + 1, 0, { x: p.x, y: p.y });
    updateLayer(editPath.id, pick(setPathAbs(editPath, abs)));
  };
  const deletePt = (i: number) => {
    if (!editPath || !editAbs || editAbs.length <= 2) return;
    updateLayer(editPath.id, pick(setPathAbs(editPath, editAbs.filter((_, k) => k !== i))));
  };

  // pintasan keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;
      const st = useStudio.getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (mod && k === 'y') {
        e.preventDefault();
        st.redo();
        return;
      }
      if (st.drawTool === 'pen' && pen.length) {
        if (e.key === 'Enter') return e.preventDefault(), finishPenRef.current(false);
        if (e.key === 'Escape') return setPen([]);
        if (e.key === 'Backspace') return e.preventDefault(), setPen((o) => o.slice(0, -1));
      }
      if (mod && k === 'g') {
        e.preventDefault();
        const L = st.doc?.scenes[st.sceneIdx]?.layers.find((l) => l.id === st.layerId);
        if (e.shiftKey && L?.kind === 'group') st.ungroupLayer(L.id);
        else if (!e.shiftKey) st.groupSelected();
        return;
      }
      if (mod && k === 'a') {
        e.preventDefault();
        const sc = st.doc?.scenes[st.sceneIdx];
        const iso = st.isolation;
        if (sc) st.setSelection(sc.layers.filter((l) => !l.locked && !l.hidden && (!iso || iso.childIds.includes(l.id))).map((l) => l.id));
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        clock.toggle();
        return;
      }
      if (!mod && !e.altKey) {
        const t = DRAW_TOOLS.find((d) => d.key.toLowerCase() === k);
        if (t) {
          st.setDrawTool(t.id);
          return;
        }
      }
      if (e.key === 'Escape') {
        if (st.pathEdit) return st.setPathEdit(null);
        if (st.drawTool !== 'select') return st.setDrawTool('select');
        if (st.layerId || st.selIds.length) return st.selectLayer(null);
        if (st.isolation) return st.exitGroup();
        return;
      }
      if (!st.layerId) return;
      const L = st.doc?.scenes[st.sceneIdx]?.layers.find((l) => l.id === st.layerId);
      if (e.key === 'Enter' && L) {
        e.preventDefault();
        if (L.kind === 'group') st.enterGroup(L.id);
        else if (L.kind === 'path') st.setPathEdit(st.pathEdit ? null : L.id);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        st.removeSelected();
      } else if (mod && k === 'd') {
        e.preventDefault();
        st.duplicateLayer(st.layerId);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 4;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const t = st.localTime();
        const ls = st.doc?.scenes[st.sceneIdx]?.layers.filter((l) => st.selIds.includes(l.id) && !l.locked) || [];
        ls.forEach((l, i) => {
          const pl = posed(l, t).layer;
          st.updateLayer(l.id, { x: pl.x + dx, y: pl.y + dy }, i > 0);
        });
        if (ls.length > 1) st.endDrag();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, pen.length]);

  // ganti alat → batalkan pena yang belum selesai
  useEffect(() => {
    if (drawTool !== 'pen' && pen.length) setPen([]);
    if (drawTool !== 'pen') setHover(null);
  }, [drawTool, pen.length]);

  // swipe kiri/kanan di area kosong untuk ganti scene (HP)
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  const editingLayer = editingText ? (scene?.layers.find((l) => l.id === editingText) as TextLayer | undefined) : undefined;
  const showBox = selected && selPosed && !playing && !editingText && !multi;
  const sp = selPosed?.layer;
  const k = selPosed?.scale ?? 1;
  const multiLayers = multi && scene ? scene.layers.filter((l) => selIds.includes(l.id)) : [];

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          // cubit untuk zoom: batalkan seret layer yang mungkin dimulai jari pertama
          dragRef.current = null;
          setDraftBoth(null);
          swipe.current = null;
          const [a, b] = [e.touches[0], e.touches[1]];
          pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: view.z, cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2, x: view.x, y: view.y };
          return;
        }
        swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
      }}
      onTouchMove={(e) => {
        const p = pinch.current;
        if (!p || e.touches.length < 2) return;
        const [a, b] = [e.touches[0], e.touches[1]];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const z = Math.max(1, Math.min(3, (p.z * d) / Math.max(1, p.d)));
        const cx2 = (a.clientX + b.clientX) / 2;
        const cy2 = (a.clientY + b.clientY) / 2;
        setView(z === 1 ? { z: 1, x: 0, y: 0 } : { z, x: p.x + (cx2 - p.cx), y: p.y + (cy2 - p.cy) });
      }}
      onTouchEnd={(e) => {
        if (pinch.current) {
          if (e.touches.length < 2) pinch.current = null;
          return;
        }
        const s = swipe.current;
        swipe.current = null;
        const st = useStudio.getState();
        if (!s || dragRef.current || st.layerId || st.drawTool !== 'select' || view.z > 1) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 50 && Date.now() - s.t < 500) selectScene(sceneIdx + (dx < 0 ? 1 : -1));
      }}
    >
      <DrawToolbar />

      {/* status: mode edit grup / alat aktif */}
      <div className="pointer-events-none absolute inset-x-2 bottom-3 z-20 flex flex-col items-center gap-1.5">
        {isolation && (
          <div className="mk-glass-deep mk-pop pointer-events-auto flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-xs font-semibold text-white">
            <span className="max-w-[46vw] truncate">
              Mengedit isi {isolation.group.symbolId ? 'komponen' : 'grup'}: <b>{isolation.group.name}</b>
              {isolation.group.symbolId ? ' · semua salinan ikut berubah' : ''}
            </span>
            <button type="button" className="mk-btn-lime px-3 py-1 text-xs" onClick={() => useStudio.getState().exitGroup()}>
              Selesai
            </button>
          </div>
        )}
        {editPath && (
          <div className="mk-glass-deep mk-pop pointer-events-auto flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-xs font-semibold text-white">
            <span className="hidden sm:inline">Seret titik atau handle. Klik ganda garis: tambah titik. Klik ganda titik: hapus. Alt+klik: tajam/lengkung.</span>
            <span className="sm:hidden">Seret titik untuk mengubah bentuk</span>
            <button type="button" className="mk-btn-lime px-3 py-1 text-xs" onClick={() => useStudio.getState().setPathEdit(null)}>
              Selesai
            </button>
          </div>
        )}
        {drawTool !== 'select' && TOOL_HINT[drawTool] && (
          <div className="mk-glass mk-pop pointer-events-auto flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-[11px] font-semibold text-mk-cream">
            <span className="max-w-[60vw]">{TOOL_HINT[drawTool]}</span>
            {drawTool === 'pen' && pen.length >= 2 ? (
              <button type="button" className="mk-btn-primary px-3 py-1 text-[11px]" onClick={() => finishPen(false)}>
                Selesai
              </button>
            ) : (
              <button type="button" className="mk-btn-ghost px-3 py-1 text-[11px]" onClick={() => useStudio.getState().setDrawTool('select')}>
                Batal
              </button>
            )}
          </div>
        )}
      </div>

      {view.z > 1 && (
        <button type="button" onClick={() => setView({ z: 1, x: 0, y: 0 })} className="mk-glass mk-pop mk-float absolute bottom-3 right-3 z-20 rounded-full px-3 py-1.5 text-xs font-bold text-mk-cream">
          {Math.round(view.z * 100)}% · Reset zoom
        </button>
      )}
      <div className="relative shadow-mk-card" style={{ width: box.w, height: box.h, transform: view.z !== 1 ? `translate(${view.x}px, ${view.y}px) scale(${view.z})` : undefined, transformOrigin: 'center' }}>
        <canvas
          ref={canvasRef}
          width={px.w}
          height={px.h}
          className={cx('block h-full w-full touch-none select-none rounded-[14px] bg-black', drawTool !== 'select' && 'cursor-crosshair')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => setHover(null)}
          onDoubleClick={onDoubleClick}
        />

        {/* garis bantu snap */}
        {guides.x !== null && <div className="pointer-events-none absolute top-0 h-full w-px bg-mk-coral" style={{ left: guides.x * scale }} />}
        {guides.y !== null && <div className="pointer-events-none absolute left-0 h-px w-full bg-mk-coral" style={{ top: guides.y * scale }} />}

        {/* draf gambar + pena */}
        {(draft || pen.length > 0) && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${base.w} ${base.h}`}>
            {draft && draft.kind !== 'pencil' && draft.kind !== 'line' && (() => {
              const r = draftRect(draft);
              const sw = 1.5 / scale;
              if (draft.kind === 'marquee') return <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(123,80,255,0.08)" stroke="#7B50FF" strokeWidth={sw} strokeDasharray={`${4 / scale} ${3 / scale}`} />;
              if (draft.kind === 'ellipse') return <ellipse cx={r.x + r.w / 2} cy={r.y + r.h / 2} rx={r.w / 2} ry={r.h / 2} fill={palette?.secondary} fillOpacity={0.6} stroke="#7B50FF" strokeWidth={sw} />;
              return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={24} fill={palette?.primary} fillOpacity={0.6} stroke="#7B50FF" strokeWidth={sw} />;
            })()}
            {draft?.kind === 'line' && (() => {
              const [x1, y1] = draft.shift ? snap45(draft.x0, draft.y0, draft.x1, draft.y1) : [draft.x1, draft.y1];
              return <line x1={draft.x0} y1={draft.y0} x2={x1} y2={y1} stroke={palette?.text} strokeWidth={8} strokeLinecap="round" />;
            })()}
            {draft?.kind === 'pencil' && <polyline points={draft.pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={palette?.primary} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
            {pen.length > 0 && (
              <>
                <path d={svgPath(pen, false) + (hover && !penDown.current ? ` L ${hover.x} ${hover.y}` : '')} fill="none" stroke="#7B50FF" strokeWidth={2 / scale} />
                {pen.map((p, i) => (
                  <g key={i}>
                    {p.ox !== undefined && (
                      <>
                        <line x1={p.x + (p.ix || 0)} y1={p.y + (p.iy || 0)} x2={p.x + p.ox} y2={p.y + (p.oy || 0)} stroke="#7B50FF" strokeWidth={1 / scale} />
                        <circle cx={p.x + p.ox} cy={p.y + (p.oy || 0)} r={3 / scale} fill="#7B50FF" />
                      </>
                    )}
                    <rect x={p.x - 4 / scale} y={p.y - 4 / scale} width={8 / scale} height={8 / scale} fill={i === 0 && pen.length >= 2 ? '#C6F432' : '#fff'} stroke="#7B50FF" strokeWidth={1.5 / scale} />
                  </g>
                ))}
              </>
            )}
          </svg>
        )}

        {/* penanda teks contoh yang harus diganti */}
        {!playing &&
          !editingText &&
          scene?.layers
            .filter((l) => l.placeholder && !l.hidden && l.id !== selected?.id)
            .map((l) => (
              <div
                key={`ph-${l.id}`}
                className="pointer-events-none absolute rounded border-2 border-dashed border-mk-amber/80"
                style={{ left: l.x * scale, top: l.y * scale, width: l.w * scale, height: l.h * scale, transform: `rotate(${l.rotation}deg)` }}
              >
                <span className="absolute -top-2.5 left-1 rounded bg-mk-amber px-1 text-[10px] font-extrabold text-white">CONTOH</span>
              </div>
            ))}

        {/* seleksi ganda */}
        {multi && !playing && (
          <>
            {multiLayers.map((l) => {
              const b = bounds(posed(l, lt).layer);
              return <div key={`m-${l.id}`} className="pointer-events-none absolute border-[1.5px] border-dashed border-mk-coral" style={{ left: b.x * scale, top: b.y * scale, width: b.w * scale, height: b.h * scale }} />;
            })}
            <span className="pointer-events-none absolute left-2 top-2 rounded bg-mk-coral px-1.5 py-0.5 text-[11px] font-bold text-white">{selIds.length} dipilih</span>
          </>
        )}

        {/* kotak seleksi gaya Figma */}
        {showBox && sp && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: (sp.x + (sp.w - sp.w * k) / 2) * scale,
              top: (sp.y + (sp.h - sp.h * k) / 2) * scale,
              width: sp.w * k * scale,
              height: sp.h * k * scale,
              transform: `rotate(${sp.rotation}deg)`,
            }}
          >
            <div className={cx('absolute inset-0 rounded-[2px] border-[1.5px]', editPath ? 'border-dashed border-mk-coral/50' : 'border-mk-coral')} />
            {!selected.locked &&
              !editPath &&
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
                const small = sp.w * k * scale < 60 || sp.h * k * scale < 40;
                if (small && h.length === 1) return null;
                return (
                  <span
                    key={h}
                    onPointerDown={(e) => startHandle(e, h)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className={`pointer-events-auto absolute flex touch-none items-center justify-center ${coarse ? '-ml-5 -mt-5 h-10 w-10' : '-ml-2 -mt-2 h-4 w-4'}`}
                    style={{ ...pos[h], transform: view.z !== 1 ? `scale(${1 / view.z})` : undefined }}
                  >
                    <span className={`block border-[1.5px] border-mk-coral bg-white ${h.length === 1 ? (coarse ? 'h-3 w-3 rounded' : 'h-2 w-2 rounded-[2px]') : coarse ? 'h-4 w-4 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]'}`} />
                  </span>
                );
              })}
            {!selected.locked && !editPath && (
              <span
                onPointerDown={(e) => startHandle(e, 'rot')}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className={`pointer-events-auto absolute left-1/2 flex cursor-grab touch-none items-center justify-center rounded-full border-[1.5px] border-mk-coral bg-white text-mk-coral shadow ${coarse ? '-bottom-14 -ml-5 h-10 w-10 text-base' : '-bottom-9 -ml-3 h-6 w-6 text-[11px]'}`}
                title="Putar"
              >
                ↻
              </span>
            )}
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-mk-coral px-1.5 py-0.5 text-[11px] font-bold text-white">
              {selected.keyframes?.length ? '◆ ' : ''}
              {Math.round(sp.w * k)} × {Math.round(sp.h * k)}
            </span>
          </div>
        )}

        {/* edit titik vektor (gaya Illustrator) */}
        {editPath && editAbs && !playing && (
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${base.w} ${base.h}`} style={{ pointerEvents: 'none' }}>
            <path d={svgPath(editAbs, editPath.closed)} fill="none" stroke="#7B50FF" strokeWidth={1.5 / scale} />
            <path d={svgPath(editAbs, editPath.closed)} fill="none" stroke="transparent" strokeWidth={14 / scale} style={{ pointerEvents: 'stroke', cursor: 'copy' }} onDoubleClick={insertPt} />
            {editAbs.map((p, i) => {
              const r = (coarse ? 9 : 4.5) / scale;
              const hr = (coarse ? 8 : 3.5) / scale;
              return (
                <g key={i}>
                  {p.ix !== undefined && (
                    <>
                      <line x1={p.x} y1={p.y} x2={p.x + p.ix} y2={p.y + (p.iy || 0)} stroke="#7B50FF" strokeWidth={1 / scale} />
                      <circle cx={p.x + p.ix} cy={p.y + (p.iy || 0)} r={hr} fill="#7B50FF" style={{ pointerEvents: 'auto', cursor: 'move', touchAction: 'none' }} onPointerDown={(e) => startPt(e, i, 'i')} onPointerMove={movePt} onPointerUp={upPt} />
                    </>
                  )}
                  {p.ox !== undefined && (
                    <>
                      <line x1={p.x} y1={p.y} x2={p.x + p.ox} y2={p.y + (p.oy || 0)} stroke="#7B50FF" strokeWidth={1 / scale} />
                      <circle cx={p.x + p.ox} cy={p.y + (p.oy || 0)} r={hr} fill="#7B50FF" style={{ pointerEvents: 'auto', cursor: 'move', touchAction: 'none' }} onPointerDown={(e) => startPt(e, i, 'o')} onPointerMove={movePt} onPointerUp={upPt} />
                    </>
                  )}
                  <rect
                    x={p.x - r}
                    y={p.y - r}
                    width={r * 2}
                    height={r * 2}
                    fill="#fff"
                    stroke="#7B50FF"
                    strokeWidth={1.5 / scale}
                    style={{ pointerEvents: 'auto', cursor: 'move', touchAction: 'none' }}
                    onPointerDown={(e) => startPt(e, i, 'a')}
                    onPointerMove={movePt}
                    onPointerUp={upPt}
                    onDoubleClick={(e) => (e.stopPropagation(), deletePt(i))}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* edit teks langsung di kanvas */}
        {editingLayer && (
          <textarea
            autoFocus
            defaultValue={editingLayer.text}
            onFocus={(e) => e.target.select()}
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

/** Bilah alat kanvas (gaya Figma / Illustrator). */
function DrawToolbar() {
  const tool = useStudio((s) => s.drawTool);
  const setTool = useStudio((s) => s.setDrawTool);
  return (
    <div
      role="toolbar"
      aria-label="Alat gambar"
      className="mk-glass mk-pop absolute left-2 top-2 z-20 flex gap-0.5 rounded-2xl p-1 lg:left-3 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col"
    >
      {DRAW_TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={`${t.label} (${t.key})`}
          aria-label={t.label}
          aria-pressed={tool === t.id}
          onClick={() => setTool(t.id)}
          className={cx('flex h-9 w-9 items-center justify-center rounded-xl transition', tool === t.id ? 'bg-mk-coral text-white' : 'text-mk-muted hover:bg-mk-mist hover:text-mk-cream')}
        >
          <t.icon className="h-[18px] w-[18px]" />
        </button>
      ))}
    </div>
  );
}

function draftRect(d: { x0: number; y0: number; x1: number; y1: number; shift: boolean; alt: boolean }) {
  let w = d.x1 - d.x0;
  let h = d.y1 - d.y0;
  if (d.shift) {
    const m = Math.max(Math.abs(w), Math.abs(h));
    w = Math.sign(w || 1) * m;
    h = Math.sign(h || 1) * m;
  }
  if (d.alt) return { x: d.x0 - Math.abs(w), y: d.y0 - Math.abs(h), w: Math.abs(w) * 2, h: Math.abs(h) * 2 };
  return { x: Math.min(d.x0, d.x0 + w), y: Math.min(d.y0, d.y0 + h), w: Math.abs(w), h: Math.abs(h) };
}

function snap45(x0: number, y0: number, x1: number, y1: number): [number, number] {
  const a = Math.round(Math.atan2(y1 - y0, x1 - x0) / (Math.PI / 4)) * (Math.PI / 4);
  const r = Math.hypot(x1 - x0, y1 - y0);
  return [x0 + Math.cos(a) * r, y0 + Math.sin(a) * r];
}

function svgPath(pts: AbsPoint[], closed: boolean): string {
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    if (a.ox !== undefined || b.ix !== undefined) d += ` C ${a.x + (a.ox || 0)} ${a.y + (a.oy || 0)} ${b.x + (b.ix || 0)} ${b.y + (b.iy || 0)} ${b.x} ${b.y}`;
    else d += ` L ${b.x} ${b.y}`;
  }
  return closed ? d + ' Z' : d;
}

function pick(l: PathLayer): Partial<PathLayer> {
  return { x: l.x, y: l.y, w: l.w, h: l.h, points: l.points };
}
