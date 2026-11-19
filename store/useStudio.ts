import { create } from 'zustand';
import type { GroupLayer, Layer, ProjectDoc, Scene, SymbolDef } from '@/lib/studio/types';
import { canvasSize, uid } from '@/lib/studio/types';
import { AlignOp, alignLayers, cloneLayer, hasKeys, instanceOf, makeGroup, splitPosePatch, splitScene, symbolFromGroup, syncSymbol, ungroup, upsertKey } from '@/lib/studio/vector';

/**
 * Store editor v6. Semua update bersifat immutable (structural sharing) sehingga
 * undo/redo murah walau dokumen berisi foto.
 */

export type Tool = 'efek' | 'template' | 'teks' | 'elemen' | 'ikon' | 'foto' | 'latar' | 'transisi' | 'animasi' | 'musik' | 'layer' | 'properti' | 'komponen';

/** Alat kanvas gaya Figma / Illustrator. */
export type DrawTool = 'select' | 'rect' | 'ellipse' | 'line' | 'pen' | 'pencil' | 'text';

export interface Isolation {
  group: Omit<GroupLayer, 'children'>;
  childIds: string[];
}

interface StudioState {
  doc: ProjectDoc | null;
  past: ProjectDoc[];
  future: ProjectDoc[];
  sceneIdx: number;
  layerId: string | null;
  tool: Tool | null;
  mode: 'mudah' | 'pro';
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error' | 'local';
  dragBase: ProjectDoc | null;
  /** seleksi ganda (selalu berisi layerId bila ada) */
  selIds: string[];
  drawTool: DrawTool;
  /** id layer path yang sedang diedit titiknya */
  pathEdit: string | null;
  /** sedang mengedit isi grup / komponen */
  isolation: Isolation | null;
  /** waktu lokal scene saat ini (didaftarkan Editor dari jam playback) */
  localTime: () => number;
  seekLocal: (t: number) => void;
  /** waktu lokal scene terakhir saat jeda (untuk panel keyframe) */
  playhead: number;

  load: (doc: ProjectDoc) => void;
  commit: (fn: (d: ProjectDoc) => ProjectDoc) => void;
  /** update tanpa history (saat drag) — panggil endDrag() untuk mencatat 1 langkah undo */
  live: (fn: (d: ProjectDoc) => ProjectDoc) => void;
  endDrag: () => void;
  undo: () => void;
  redo: () => void;
  selectScene: (i: number) => void;
  selectLayer: (id: string | null) => void;
  setTool: (t: Tool | null) => void;
  setMode: (m: 'mudah' | 'pro') => void;
  setSaveStatus: (s: StudioState['saveStatus']) => void;

  updateLayer: (id: string, patch: Partial<Layer>, liveOnly?: boolean) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  moveLayer: (id: string, dir: 'up' | 'down' | 'top' | 'bottom') => void;
  updateScene: (idx: number, patch: Partial<Scene>) => void;
  addScene: (afterIdx: number) => void;
  duplicateScene: (idx: number) => void;
  removeScene: (idx: number) => void;
  moveScene: (idx: number, dir: -1 | 1) => void;

  setSelection: (ids: string[]) => void;
  setDrawTool: (t: DrawTool) => void;
  setPathEdit: (id: string | null) => void;
  removeSelected: () => void;
  alignSelected: (op: AlignOp) => void;
  groupSelected: () => void;
  ungroupLayer: (id: string) => void;
  makeSymbol: (name: string) => SymbolDef | null;
  insertSymbol: (sym: SymbolDef) => void;
  detachInstance: (id: string) => void;
  enterGroup: (id: string) => void;
  exitGroup: () => void;
  splitAtPlayhead: () => boolean;
}

const HISTORY = 60;

function mapScene(d: ProjectDoc, idx: number, fn: (s: Scene) => Scene): ProjectDoc {
  return { ...d, scenes: d.scenes.map((s, i) => (i === idx ? fn(s) : s)) };
}

export const useStudio = create<StudioState>((set, get) => ({
  doc: null,
  past: [],
  future: [],
  sceneIdx: 0,
  layerId: null,
  tool: null,
  mode: 'mudah',
  saveStatus: 'saved',
  dragBase: null,
  selIds: [],
  drawTool: 'select',
  pathEdit: null,
  isolation: null,
  localTime: () => 0,
  seekLocal: () => {},
  playhead: 0,

  load: (doc) => set({ doc, past: [], future: [], sceneIdx: 0, layerId: null, selIds: [], pathEdit: null, isolation: null, saveStatus: 'saved' }),

  commit: (fn) => {
    const { doc, past } = get();
    if (!doc) return;
    const next = fn(doc);
    if (next === doc) return;
    set({ doc: next, past: [...past.slice(-HISTORY + 1), doc], future: [], saveStatus: 'unsaved' });
  },

  live: (fn) => {
    const { doc, dragBase } = get();
    if (!doc) return;
    set({ doc: fn(doc), dragBase: dragBase || doc, saveStatus: 'unsaved' });
  },

  endDrag: () => {
    const { dragBase, past, doc } = get();
    if (!dragBase || dragBase === doc) return set({ dragBase: null });
    set({ past: [...past.slice(-HISTORY + 1), dragBase], future: [], dragBase: null });
  },

  undo: () => {
    const { past, doc, future } = get();
    if (!past.length || !doc) return;
    const prev = past[past.length - 1];
    set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future].slice(0, HISTORY), saveStatus: 'unsaved', sceneIdx: Math.min(get().sceneIdx, prev.scenes.length - 1) });
  },

  redo: () => {
    const { past, doc, future } = get();
    if (!future.length || !doc) return;
    const next = future[0];
    set({ doc: next, past: [...past, doc], future: future.slice(1), saveStatus: 'unsaved', sceneIdx: Math.min(get().sceneIdx, next.scenes.length - 1) });
  },

  selectScene: (i) => {
    const doc = get().doc;
    if (!doc) return;
    if (get().isolation) get().exitGroup();
    set({ sceneIdx: Math.max(0, Math.min(doc.scenes.length - 1, i)), layerId: null, selIds: [], pathEdit: null });
  },
  selectLayer: (id) => set((s) => ({ layerId: id, selIds: id ? [id] : [], pathEdit: s.pathEdit === id ? id : null })),
  setTool: (t) => set({ tool: t }),
  setMode: (m) => {
    try {
      localStorage.setItem('motionku:mode', m);
    } catch {
      // abaikan
    }
    set({ mode: m });
  },
  setSaveStatus: (s) => set({ saveStatus: s }),

  updateLayer: (id, patch, liveOnly) => {
    const { sceneIdx } = get();
    // mengubah isi (teks / props / foto) = user sudah mengganti teks contoh
    const content = 'text' in patch || 'props' in patch || 'src' in patch;
    const t = get().localTime();
    const apply = (l: Layer): Layer => {
      let p: Partial<Layer> = patch;
      // layer beranimasi keyframe: ubah posisi/putar/transparansi = rekam keyframe di waktu ini (gaya After Effects)
      if (hasKeys(l) && !('keyframes' in patch)) {
        const { pose, rest } = splitPosePatch(patch);
        if (Object.keys(pose).length) p = { ...rest, keyframes: upsertKey(l, t, pose) };
      }
      return { ...l, ...p, ...(content && l.placeholder ? { placeholder: false } : {}) } as Layer;
    };
    const fn = (d: ProjectDoc) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? apply(l) : l)) }));
    if (liveOnly) get().live(fn);
    else get().commit(fn);
  },

  addLayer: (layer) => {
    const { sceneIdx } = get();
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: [...s.layers, layer] })));
    const iso = get().isolation;
    set({ layerId: layer.id, selIds: [layer.id], ...(iso ? { isolation: { ...iso, childIds: [...iso.childIds, layer.id] } } : {}) });
  },

  removeLayer: (id) => {
    const { sceneIdx } = get();
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) })));
    set({ layerId: null, selIds: [], pathEdit: null });
  },

  duplicateLayer: (id) => {
    const { sceneIdx, doc } = get();
    const src = doc?.scenes[sceneIdx]?.layers.find((l) => l.id === id);
    if (!src) return;
    const moved = { ...src, x: src.x + 40, y: src.y + 40, keyframes: src.keyframes?.map((k) => ({ ...k, x: k.x + 40, y: k.y + 40 })), name: `${src.name} (salinan)` } as Layer;
    const copy = cloneLayer(moved);
    get().commit((d) =>
      mapScene(d, sceneIdx, (s) => {
        const i = s.layers.findIndex((l) => l.id === id);
        const layers = [...s.layers];
        layers.splice(i + 1, 0, copy);
        return { ...s, layers };
      })
    );
    set({ layerId: copy.id });
  },

  moveLayer: (id, dir) => {
    const { sceneIdx } = get();
    get().commit((d) =>
      mapScene(d, sceneIdx, (s) => {
        const layers = [...s.layers];
        const i = layers.findIndex((l) => l.id === id);
        if (i < 0) return s;
        const [l] = layers.splice(i, 1);
        const j = dir === 'top' ? layers.length : dir === 'bottom' ? 0 : dir === 'up' ? Math.min(layers.length, i + 1) : Math.max(0, i - 1);
        layers.splice(j, 0, l);
        return { ...s, layers };
      })
    );
  },

  updateScene: (idx, patch) => get().commit((d) => mapScene(d, idx, (s) => ({ ...s, ...patch }))),

  addScene: (afterIdx) => {
    const { doc } = get();
    if (!doc) return;
    const ref = doc.scenes[afterIdx] || doc.scenes[0];
    const scene: Scene = {
      id: uid('sc'),
      name: `Scene ${doc.scenes.length + 1}`,
      role: 'info',
      duration: 3,
      background: { ...ref.background },
      layers: [],
      transition: { ...ref.transition },
    };
    get().commit((d) => {
      const scenes = [...d.scenes];
      scenes.splice(afterIdx + 1, 0, scene);
      return { ...d, scenes };
    });
    set({ sceneIdx: afterIdx + 1, layerId: null });
  },

  duplicateScene: (idx) => {
    const { doc } = get();
    const src = doc?.scenes[idx];
    if (!src) return;
    const copy: Scene = { ...src, id: uid('sc'), name: `${src.name} (salinan)`, layers: src.layers.map(cloneLayer) };
    get().commit((d) => {
      const scenes = [...d.scenes];
      scenes.splice(idx + 1, 0, copy);
      return { ...d, scenes };
    });
    set({ sceneIdx: idx + 1, layerId: null });
  },

  removeScene: (idx) => {
    const { doc } = get();
    if (!doc || doc.scenes.length <= 1) return;
    get().commit((d) => ({ ...d, scenes: d.scenes.filter((_, i) => i !== idx) }));
    set({ sceneIdx: Math.max(0, idx - 1), layerId: null });
  },

  moveScene: (idx, dir) => {
    const { doc } = get();
    if (!doc) return;
    const j = idx + dir;
    if (j < 0 || j >= doc.scenes.length) return;
    get().commit((d) => {
      const scenes = [...d.scenes];
      [scenes[idx], scenes[j]] = [scenes[j], scenes[idx]];
      return { ...d, scenes };
    });
    set({ sceneIdx: j });
  },

  setSelection: (ids) => set({ selIds: ids, layerId: ids.length ? ids[ids.length - 1] : null, pathEdit: null }),
  setDrawTool: (t) => set({ drawTool: t, pathEdit: null }),
  setPathEdit: (id) => set({ pathEdit: id, ...(id ? { layerId: id, selIds: [id] } : {}) }),

  removeSelected: () => {
    const { sceneIdx, selIds } = get();
    if (!selIds.length) return;
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.filter((l) => !selIds.includes(l.id)) })));
    set({ layerId: null, selIds: [], pathEdit: null });
  },

  alignSelected: (op) => {
    const { sceneIdx, selIds, doc } = get();
    if (!doc) return;
    const { w, h } = canvasSize(doc.aspect);
    const ls = doc.scenes[sceneIdx].layers.filter((l) => selIds.includes(l.id) && !l.locked);
    if (!ls.length) return;
    const pos = alignLayers(ls, op, w, h);
    ls.forEach((l, i) => {
      const p = pos.get(l.id);
      if (!p) return;
      // satu langkah undo untuk semua
      if (i === 0) get().updateLayer(l.id, p);
      else get().updateLayer(l.id, p, true);
    });
    get().endDrag();
  },

  groupSelected: () => {
    const { sceneIdx, selIds, doc } = get();
    if (!doc || selIds.length < 2) return;
    const scene = doc.scenes[sceneIdx];
    const picked = scene.layers.filter((l) => selIds.includes(l.id));
    const g = makeGroup(picked, `Grup ${scene.layers.filter((l) => l.kind === 'group').length + 1}`);
    const at = scene.layers.findIndex((l) => selIds.includes(l.id));
    get().commit((d) =>
      mapScene(d, sceneIdx, (s) => {
        const rest = s.layers.filter((l) => !selIds.includes(l.id));
        const before = s.layers.slice(0, at).filter((l) => !selIds.includes(l.id)).length;
        rest.splice(before, 0, g);
        return { ...s, layers: rest };
      })
    );
    set({ layerId: g.id, selIds: [g.id] });
  },

  ungroupLayer: (id) => {
    const { sceneIdx, doc } = get();
    const g = doc?.scenes[sceneIdx].layers.find((l) => l.id === id);
    if (!g || g.kind !== 'group') return;
    const kids = ungroup(g);
    get().commit((d) =>
      mapScene(d, sceneIdx, (s) => {
        const i = s.layers.findIndex((l) => l.id === id);
        const layers = [...s.layers];
        layers.splice(i, 1, ...kids);
        return { ...s, layers };
      })
    );
    set({ layerId: kids[kids.length - 1]?.id || null, selIds: kids.map((k) => k.id) });
  },

  makeSymbol: (name) => {
    const st = get();
    if (!st.doc) return null;
    if (st.selIds.length > 1) st.groupSelected();
    const s2 = get();
    const g = s2.doc!.scenes[s2.sceneIdx].layers.find((l) => l.id === s2.layerId);
    if (!g) return null;
    const grp: GroupLayer = g.kind === 'group' ? g : makeGroup([g], name);
    const sym = symbolFromGroup(grp, name.trim() || 'Komponen');
    const inst: GroupLayer = { ...grp, name: sym.name, symbolId: sym.id };
    s2.commit((d) => ({ ...mapScene(d, s2.sceneIdx, (sc) => ({ ...sc, layers: sc.layers.map((l) => (l.id === g.id ? inst : l)) })), symbols: { ...(d.symbols || {}), [sym.id]: sym } }));
    set({ layerId: inst.id, selIds: [inst.id] });
    return sym;
  },

  insertSymbol: (sym) => {
    const { doc } = get();
    if (!doc) return;
    const { w, h } = canvasSize(doc.aspect);
    const inst = instanceOf(sym, w, h);
    if (!doc.symbols?.[sym.id]) get().commit((d) => ({ ...d, symbols: { ...(d.symbols || {}), [sym.id]: sym } }));
    get().addLayer(inst);
  },

  detachInstance: (id) => {
    const { sceneIdx } = get();
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.map((l) => (l.id === id && l.kind === 'group' ? { ...l, symbolId: undefined } : l)) })));
  },

  enterGroup: (id) => {
    const { sceneIdx, doc } = get();
    const g = doc?.scenes[sceneIdx].layers.find((l) => l.id === id);
    if (!g || g.kind !== 'group') return;
    const kids = ungroup(g);
    const { children: _c, ...meta } = g;
    void _c;
    get().commit((d) =>
      mapScene(d, sceneIdx, (s) => {
        const i = s.layers.findIndex((l) => l.id === id);
        const layers = [...s.layers];
        layers.splice(i, 1, ...kids);
        return { ...s, layers };
      })
    );
    set({ isolation: { group: meta, childIds: kids.map((k) => k.id) }, layerId: null, selIds: [] });
  },

  exitGroup: () => {
    const { isolation, sceneIdx, doc } = get();
    set({ isolation: null });
    if (!isolation || !doc) return;
    const scene = doc.scenes[sceneIdx];
    const kids = scene.layers.filter((l) => isolation.childIds.includes(l.id));
    if (!kids.length) return;
    const fresh = makeGroup(kids, isolation.group.name);
    const og = isolation.group;
    const dx = fresh.x - og.x;
    const dy = fresh.y - og.y;
    const g: GroupLayer = {
      ...og,
      x: fresh.x,
      y: fresh.y,
      w: fresh.w,
      h: fresh.h,
      cw: fresh.cw,
      ch: fresh.ch,
      rotation: 0,
      opacity: og.opacity,
      children: fresh.children,
      keyframes: og.keyframes?.map((k) => ({ ...k, x: k.x + dx, y: k.y + dy })),
    };
    get().commit((d) => {
      let next = mapScene(d, sceneIdx, (s) => {
        const at = s.layers.findIndex((l) => isolation.childIds.includes(l.id));
        const layers = s.layers.filter((l) => !isolation.childIds.includes(l.id));
        const before = s.layers.slice(0, at).filter((l) => !isolation.childIds.includes(l.id)).length;
        layers.splice(before, 0, g);
        return { ...s, layers };
      });
      // komponen utama berubah → semua instance ikut berubah (gaya Figma)
      if (og.symbolId && next.symbols?.[og.symbolId]) {
        const sym = { ...next.symbols[og.symbolId], w: g.cw, h: g.ch, children: g.children };
        next = syncSymbol(next, sym, g.id);
      }
      return next;
    });
    set({ layerId: g.id, selIds: [g.id] });
  },

  splitAtPlayhead: () => {
    const { sceneIdx, doc } = get();
    const sc = doc?.scenes[sceneIdx];
    if (!sc) return false;
    const parts = splitScene(sc, get().localTime());
    if (!parts) return false;
    get().commit((d) => {
      const scenes = [...d.scenes];
      scenes.splice(sceneIdx, 1, parts[0], parts[1]);
      return { ...d, scenes };
    });
    set({ sceneIdx: sceneIdx + 1, layerId: null, selIds: [] });
    return true;
  },
}));

export function currentScene(s: Pick<StudioState, 'doc' | 'sceneIdx'>): Scene | null {
  return s.doc?.scenes[s.sceneIdx] || null;
}
export function selectedLayers(s: Pick<StudioState, 'doc' | 'sceneIdx' | 'selIds'>): Layer[] {
  const sc = currentScene(s);
  return sc ? sc.layers.filter((l) => s.selIds.includes(l.id)) : [];
}
export function currentLayer(s: Pick<StudioState, 'doc' | 'sceneIdx' | 'layerId'>): Layer | null {
  const sc = currentScene(s);
  return (s.layerId && sc?.layers.find((l) => l.id === s.layerId)) || null;
}

/** Daftar layer berisi teks contoh yang belum diganti. */
export function placeholderList(doc: ProjectDoc | null): Array<{ sceneIdx: number; layerId: string; name: string }> {
  if (!doc) return [];
  const out: Array<{ sceneIdx: number; layerId: string; name: string }> = [];
  doc.scenes.forEach((s, i) => s.layers.forEach((l) => l.placeholder && !l.hidden && out.push({ sceneIdx: i, layerId: l.id, name: l.kind === 'text' ? l.text : l.name })));
  return out;
}
