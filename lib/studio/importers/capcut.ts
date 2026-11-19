/**
 * Impor proyek CapCut desktop (draft_content.json).
 * Setiap klip di track video utama menjadi satu scene; overlay, teks, dan keyframe
 * ikut dipindahkan sehingga susunan edit CapCut terlihat & bisa diedit.
 * File video tidak ikut di dalam draft → disambungkan ulang dari perangkat user.
 * Catatan: template dari pustaka CapCut & proyek CapCut HP terenkripsi, tidak bisa dibaca.
 */
import type { Keyframe, Layer, MediaInfo, Scene, ShapeLayer, TextLayer, VideoLayer } from '../types';
import { canvasSize, uid } from '../types';
import { fitFor, ImportError, ImportResult, newImportDoc, rgbaFrom01, tidyKeys } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;
const US = 1_000_000;

export function isCapcut(j: Any): boolean {
  return !!j && typeof j === 'object' && Array.isArray(j.tracks) && !!j.materials;
}

const KF_EASE: Record<string, string> = { Line: 'linear', EaseIn: 'inCubic', EaseOut: 'outCubic', FreeCurveInOut: 'inOutCubic' };

interface Pose {
  x: number;
  y: number;
  sx: number;
  sy: number;
  r: number;
  a: number;
}

/** Pose klip pada waktu relatif segmen (μs), memperhitungkan common_keyframes. */
function poseAt(seg: Any, rel: number): Pose {
  const c = seg.clip || {};
  const p: Pose = { x: c.transform?.x ?? 0, y: c.transform?.y ?? 0, sx: c.scale?.x ?? 1, sy: c.scale?.y ?? c.scale?.x ?? 1, r: c.rotation ?? 0, a: c.alpha ?? 1 };
  for (const g of seg.common_keyframes || []) {
    const list: Any[] = [...(g.keyframe_list || [])].sort((a, b) => a.time_offset - b.time_offset);
    if (!list.length) continue;
    let v: number;
    if (rel <= list[0].time_offset) v = list[0].values?.[0];
    else if (rel >= list[list.length - 1].time_offset) v = list[list.length - 1].values?.[0];
    else {
      const i = list.findIndex((k, j) => j < list.length - 1 && rel < list[j + 1].time_offset && rel >= k.time_offset);
      const a = list[i];
      const b = list[i + 1];
      const u = (rel - a.time_offset) / Math.max(1, b.time_offset - a.time_offset);
      const e = a.curveType === 'EaseIn' ? u * u * u : a.curveType === 'EaseOut' ? 1 - Math.pow(1 - u, 3) : a.curveType === 'FreeCurveInOut' ? (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) : u;
      v = a.values[0] + (b.values[0] - a.values[0]) * e;
    }
    if (typeof v !== 'number' || isNaN(v)) continue;
    switch (g.property_type) {
      case 'KFTypePositionX':
        p.x = v;
        break;
      case 'KFTypePositionY':
        p.y = v;
        break;
      case 'KFTypeScaleX':
        p.sx = v;
        if (seg.uniform_scale?.on) p.sy = v;
        break;
      case 'KFTypeScaleY':
        p.sy = v;
        break;
      case 'KFTypeRotation':
        p.r = v;
        break;
      case 'KFTypeAlpha':
        p.a = v;
        break;
    }
  }
  return p;
}

function keyTimes(seg: Any): Array<{ t: number; ease: string }> {
  const out: Array<{ t: number; ease: string }> = [];
  for (const g of seg.common_keyframes || []) for (const k of g.keyframe_list || []) out.push({ t: Number(k.time_offset), ease: KF_EASE[k.curveType] || 'linear' });
  return out;
}

const base = (p: string) => (p || '').split(/[\\/]/).pop() || 'video';

export function importCapcut(j: Any, file: string): ImportResult {
  if (!isCapcut(j)) throw new ImportError('File ini bukan draft CapCut (draft_content.json).');
  const cw = Number(j.canvas_config?.width || 1080);
  const ch = Number(j.canvas_config?.height || 1920);
  const fit = fitFor(cw, ch);
  const { w: W, h: H } = canvasSize(fit.aspect);
  const notes = new Set<string>();
  const counts: Record<string, number> = {};
  const mats = j.materials || {};
  const byId = new Map<string, { kind: string; m: Any }>();
  for (const [kind, list] of Object.entries(mats)) if (Array.isArray(list)) for (const m of list as Any[]) if (m?.id) byId.set(String(m.id), { kind, m });

  const tracks: Any[] = j.tracks || [];
  const videoTracks = tracks.filter((t) => t.type === 'video');
  const main = videoTracks.find((t) => Number(t.flag) === 0) || videoTracks[0];
  const segsOf = (t: Any): Any[] => [...(t?.segments || [])].filter((s) => s.visible !== false).sort((a, b) => a.target_timerange.start - b.target_timerange.start);
  const mainSegs = segsOf(main);
  const total = Number(j.duration || Math.max(0, ...tracks.flatMap((t) => (t.segments || []).map((s: Any) => s.target_timerange.start + s.target_timerange.duration))));

  // batas scene = klip di track utama (celah di antaranya juga jadi scene)
  const ranges: Array<{ a: number; b: number; seg?: Any }> = [];
  let cursor = 0;
  for (const s of mainSegs) {
    const a = s.target_timerange.start;
    const b = a + s.target_timerange.duration;
    if (a - cursor > 0.15 * US) ranges.push({ a: cursor, b: a });
    ranges.push({ a, b, seg: s });
    cursor = b;
  }
  if (total - cursor > 0.15 * US || !ranges.length) ranges.push({ a: cursor, b: Math.max(cursor + US, total) });

  const media: Record<string, MediaInfo> = {};
  const mediaFor = (m: Any): string => {
    const id = `cc-${m.id}`;
    if (!media[id]) media[id] = { id, name: m.material_name && !/^[0-9a-f-]{20,}$/i.test(m.material_name) ? m.material_name : base(m.path), kind: 'video', mime: 'video/mp4', duration: Number(m.duration || 0) / US, w: Number(m.width || 1080), h: Number(m.height || 1920), size: 0, missing: true };
    return id;
  };

  /** Satu segmen → layer MotionKu di dalam scene [a, b). */
  const toLayer = (seg: Any, trackType: string, a: number, b: number, sceneDur: number): Layer | null => {
    const ref = byId.get(String(seg.material_id));
    if (!ref) return null;
    const s0 = seg.target_timerange.start;
    const s1 = s0 + seg.target_timerange.duration;
    const from = Math.max(s0, a);
    const to = Math.min(s1, b);
    if (to - from < 0.03 * US) return null;
    const p0 = poseAt(seg, from - s0);
    const cx = W / 2 + p0.x * (W / 2);
    const cy = H / 2 - p0.y * (H / 2);
    let layer: Layer;
    let bw: number;
    let bh: number;
    if (trackType === 'video') {
      const m = ref.m;
      const vw = Number(m.width || 1080);
      const vh = Number(m.height || 1920);
      const s = Math.min(W / vw, H / vh);
      bw = vw * s;
      bh = vh * s;
      if (m.type === 'photo') {
        const ph: ShapeLayer = { id: uid('ly'), kind: 'shape', name: `Foto: ${base(m.path)}`, x: 0, y: 0, w: bw, h: bh, rotation: 0, opacity: 1, start: 0, end: null, shape: 'rect', fill: '#2A1A63', stroke: null, radius: 0 };
        layer = ph;
        notes.add('Foto dari CapCut jadi kotak penanda. Ganti dengan foto aslimu lewat menu Media.');
        counts.foto = (counts.foto || 0) + 1;
      } else {
        const speed = Number(seg.speed || 1);
        const srcStart = Number(seg.source_timerange?.start || 0) / US + ((from - s0) / US) * speed;
        const v: VideoLayer = {
          id: uid('ly'),
          kind: 'video',
          name: base(m.path).replace(/\.[a-z0-9]+$/i, ''),
          x: 0,
          y: 0,
          w: bw,
          h: bh,
          rotation: 0,
          opacity: 1,
          start: 0,
          end: null,
          mediaId: mediaFor(m),
          trimIn: Math.round(srcStart * 100) / 100,
          trimOut: Math.round((srcStart + ((to - from) / US) * speed) * 100) / 100,
          speed,
          volume: Number(seg.volume ?? 1),
          fit: 'contain',
          radius: 0,
        };
        layer = v;
        counts.video = (counts.video || 0) + 1;
      }
    } else if (trackType === 'text') {
      const m = ref.m;
      let content: Any = {};
      try {
        content = typeof m.content === 'string' ? JSON.parse(m.content) : m.content || {};
      } catch {
        content = { text: String(m.content || '') };
      }
      const text = String(content.text ?? m.text ?? m.recognize_text ?? 'Teks').trim() || 'Teks';
      const st = content.styles?.[0] || {};
      const size = Number(st.size || m.font_size || 15) * (W / 1080) * 4.6;
      const lines = text.split('\n');
      bw = Math.min(W * 0.92, Math.max(...lines.map((l) => l.length)) * size * 0.6 + size);
      bh = lines.length * size * 1.3;
      const color = st.fill?.content?.solid?.color ? rgbaFrom01(st.fill.content.solid.color) : m.text_color || '#FFFFFF';
      const t: TextLayer = {
        id: uid('ly'),
        kind: 'text',
        name: text.slice(0, 24),
        x: 0,
        y: 0,
        w: bw,
        h: bh,
        rotation: 0,
        opacity: 1,
        start: 0,
        end: null,
        text,
        font: 'Plus Jakarta Sans',
        size,
        weight: st.bold ? 800 : 600,
        color,
        align: m.alignment === 0 ? 'left' : m.alignment === 2 ? 'right' : 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        stroke: st.strokes?.[0]?.content?.solid?.color ? { color: rgbaFrom01(st.strokes[0].content.solid.color), width: Number(st.strokes[0].width || 0.08) * size * 0.5 } : null,
        highlight: null,
      };
      layer = t;
      counts.teks = (counts.teks || 0) + 1;
    } else return null;

    const sc = (p: Pose) => (Math.abs(p.sx) + Math.abs(p.sy)) / 2;
    const bs = sc(p0) || 1;
    const w = Math.max(1, bw * Math.abs(p0.sx));
    const h = Math.max(1, bh * Math.abs(p0.sy));
    if (layer.kind === 'text') layer = { ...layer, size: layer.size * bs };
    // rotasi CapCut (derajat, searah jarum jam) sama arahnya dengan kanvas MotionKu
    const out = { ...layer, w, h, x: cx - w / 2, y: cy - h / 2, rotation: Math.round(p0.r * 10) / 10, opacity: Math.max(0, Math.min(1, p0.a)) } as Layer;
    out.start = Math.round(((from - a) / US) * 100) / 100;
    out.end = to >= b - 0.02 * US ? null : Math.round(((to - a) / US) * 100) / 100;
    if (out.end !== null && out.end > sceneDur - 0.02) out.end = null;
    const kt = keyTimes(seg).filter((k) => s0 + k.t >= from - 1000 && s0 + k.t <= to + 1000);
    if (kt.length >= 2) {
      const uniq = Array.from(new Map(kt.map((k) => [Math.round(k.t / 10000), k])).values()).sort((x, y) => x.t - y.t);
      const ks: Keyframe[] = uniq.map((k) => {
        const p = poseAt(seg, k.t);
        const ww = w;
        const hh = h;
        return { t: (s0 + k.t - a) / US, x: W / 2 + p.x * (W / 2) - ww / 2, y: H / 2 - p.y * (H / 2) - hh / 2, rotation: p.r, opacity: Math.max(0, Math.min(1, p.a)), scale: sc(p) / bs, ease: k.ease };
      });
      out.keyframes = tidyKeys(ks);
      if (out.keyframes) counts.keys = (counts.keys || 0) + out.keyframes.length;
    }
    // animasi masuk/keluar teks CapCut → keyframe muncul/hilang yang bisa diedit
    const animRef = (seg.extra_material_refs || []).map((id: string) => byId.get(String(id))).find((r: Any) => r?.kind === 'material_animations');
    const anims: Any[] = animRef?.m?.animations || [];
    const inA = anims.find((x) => x.type === 'in');
    const outA = anims.find((x) => x.type === 'out');
    if ((inA || outA) && !out.keyframes) {
      const d0 = out.start;
      const d1 = out.end ?? sceneDur;
      const pose = { x: out.x, y: out.y, rotation: out.rotation, scale: 1 };
      const ks: Keyframe[] = [];
      if (inA) {
        const di = Math.min((Number(inA.duration) || 500000) / US, (d1 - d0) / 2);
        ks.push({ t: d0, ...pose, opacity: 0, scale: /zoom|pop|scale|bounce/i.test(inA.name) ? 0.6 : 1, ease: /bounce|pop/i.test(inA.name) ? 'outBack' : 'outCubic' }, { t: d0 + di, ...pose, opacity: out.opacity, ease: 'linear' });
      }
      if (outA) {
        const dO = Math.min((Number(outA.duration) || 500000) / US, (d1 - d0) / 2);
        ks.push({ t: d1 - dO, ...pose, opacity: out.opacity, ease: 'inCubic' }, { t: d1 - 0.01, ...pose, opacity: 0, ease: 'linear' });
      }
      out.keyframes = tidyKeys(ks);
      out.name = `${out.name} · ${[inA?.name, outA?.name].filter(Boolean).join(' / ')}`;
      counts.anim = (counts.anim || 0) + 1;
    }
    return out;
  };

  const otherTracks = tracks.filter((t) => t !== main && (t.type === 'video' || t.type === 'text'));
  const transitionAfter = new Map<number, { name: string; dur: number }>();
  mainSegs.forEach((s, i) => {
    const tr = (s.extra_material_refs || []).map((id: string) => byId.get(String(id))).find((r: Any) => r?.kind === 'transitions');
    if (tr) transitionAfter.set(i, { name: String(tr.m.name || 'Transisi'), dur: Number(tr.m.duration || 500000) / US });
  });

  let mainIdx = -1;
  const scenes: Scene[] = ranges.map((r, i) => {
    const dur = Math.max(0.3, (r.b - r.a) / US);
    const layers: Layer[] = [];
    if (r.seg) {
      mainIdx++;
      const L = toLayer(r.seg, 'video', r.a, r.b, dur);
      if (L) layers.push(L);
    }
    // track bawah dulu (urutan tracks CapCut: atas = belakang? overlay berikutnya di atas)
    for (const t of otherTracks) for (const s of segsOf(t)) {
      const L = toLayer(s, t.type, r.a, r.b, dur);
      if (L) layers.push(L);
    }
    const prevTr = r.seg && mainIdx > 0 ? transitionAfter.get(mainIdx - 1) : undefined;
    return {
      id: uid('sc'),
      name: r.seg ? `Klip ${mainIdx + 1}${prevTr ? ` (transisi: ${prevTr.name})` : ''}` : `Jeda ${i + 1}`,
      role: 'info',
      duration: Math.round(dur * 100) / 100,
      background: { type: 'solid', color: '#000000' },
      layers,
      transition: prevTr ? { id: 'fade-none-normal', duration: Math.min(1, prevTr.dur) } : { id: 'cut', duration: 0.01 },
    };
  });

  const audios = tracks.filter((t) => t.type === 'audio').flatMap((t) => t.segments || []);
  if (audios.length) notes.add(`${audios.length} audio/musik CapCut tidak ikut (file-nya tidak ada di draft). Tambahkan lewat menu Musik atau suara klip.`);
  const fx = tracks.filter((t) => ['effect', 'filter', 'sticker'].includes(t.type)).flatMap((t) => t.segments || []);
  if (fx.length) notes.add(`${fx.length} efek/filter/stiker CapCut dilewati (formatnya khusus CapCut).`);
  if (Object.keys(media).length) notes.add(`${Object.keys(media).length} file video perlu disambungkan ulang: pilih klip, lalu "Pilih file". Potongan & kecepatan sudah sesuai CapCut.`);
  if (transitionAfter.size) notes.add('Transisi CapCut diganti fade MotionKu (nama aslinya tertulis di nama scene).');

  const doc = newImportDoc(fit, String(j.name || file.replace(/\.json$/i, '') || 'Proyek CapCut'), 'capcut', file);
  const c = counts;
  const parts = [`${scenes.length} scene`, c.video && `${c.video} klip video`, c.teks && `${c.teks} teks`, c.foto && `${c.foto} foto`, c.keys && `${c.keys} keyframe`, c.anim && `${c.anim} animasi teks`].filter(Boolean);
  const nl = [...notes];
  return {
    doc: { ...doc, scenes, media, imported: { from: 'capcut', file, notes: nl } },
    summary: `CapCut: ${parts.join(', ')} · ${(scenes.reduce((s, x) => s + x.duration, 0)).toFixed(1)} dtk · ${cw}×${ch}`,
    notes: nl,
  };
}
