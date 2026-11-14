import { create } from 'zustand';
import type { Layer, ProjectDoc, Scene } from '@/lib/studio/types';
import { uid } from '@/lib/studio/types';

/**
 * Store editor v6. Semua update bersifat immutable (structural sharing) sehingga
 * undo/redo murah walau dokumen berisi foto.
 */

export type Tool = 'template' | 'teks' | 'elemen' | 'ikon' | 'foto' | 'latar' | 'transisi' | 'animasi' | 'musik' | 'layer' | 'properti';

interface StudioState {
  doc: ProjectDoc | null;
  past: ProjectDoc[];
  future: ProjectDoc[];
  sceneIdx: number;
  layerId: string | null;
  tool: Tool | null;
  mode: 'mudah' | 'pro';
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  dragBase: ProjectDoc | null;

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

  load: (doc) => set({ doc, past: [], future: [], sceneIdx: 0, layerId: null, saveStatus: 'saved' }),

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
    set({ sceneIdx: Math.max(0, Math.min(doc.scenes.length - 1, i)), layerId: null });
  },
  selectLayer: (id) => set({ layerId: id }),
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
    const fn = (d: ProjectDoc) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }));
    if (liveOnly) get().live(fn);
    else get().commit(fn);
  },

  addLayer: (layer) => {
    const { sceneIdx } = get();
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: [...s.layers, layer] })));
    set({ layerId: layer.id });
  },

  removeLayer: (id) => {
    const { sceneIdx } = get();
    get().commit((d) => mapScene(d, sceneIdx, (s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) })));
    set({ layerId: null });
  },

  duplicateLayer: (id) => {
    const { sceneIdx, doc } = get();
    const src = doc?.scenes[sceneIdx]?.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = { ...src, id: uid('ly'), x: src.x + 40, y: src.y + 40, name: `${src.name} (salinan)` } as Layer;
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
    const copy: Scene = { ...src, id: uid('sc'), name: `${src.name} (salinan)`, layers: src.layers.map((l) => ({ ...l, id: uid('ly') }) as Layer) };
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
}));

export function currentScene(s: Pick<StudioState, 'doc' | 'sceneIdx'>): Scene | null {
  return s.doc?.scenes[s.sceneIdx] || null;
}
export function currentLayer(s: Pick<StudioState, 'doc' | 'sceneIdx' | 'layerId'>): Layer | null {
  const sc = currentScene(s);
  return (s.layerId && sc?.layers.find((l) => l.id === s.layerId)) || null;
}
