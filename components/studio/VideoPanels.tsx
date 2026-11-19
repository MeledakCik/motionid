'use client';

import React, { useRef, useState } from 'react';
import { Cloud, CloudOff, Film, Link2, Plus, Scissors, Volume2, VolumeX } from 'lucide-react';
import type { MediaInfo, VideoLayer } from '@/lib/studio/types';
import { canvasSize } from '@/lib/studio/types';
import { clipLength, makeVideoLayer, registerVideo, relinkVideo, uploadVideo } from '@/lib/studio/media';
import { useStudio } from '@/store/useStudio';
import { cx, Section, Segmented, Slider } from './ui';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};

/** Simpan media ke dokumen lalu unggah ke cloud di belakang layar. */
function useMediaSaver() {
  const commit = useStudio((s) => s.commit);
  const live = useStudio((s) => s.live);
  return async (info: MediaInfo, onStatus: (m: string) => void) => {
    commit((d) => ({ ...d, media: { ...(d.media || {}), [info.id]: info } }));
    const up = await uploadVideo(info);
    if (up.path) {
      live((d) => ({ ...d, media: { ...(d.media || {}), [info.id]: { ...(d.media?.[info.id] || info), remote: up.path! } } }));
      useStudio.getState().endDrag();
      onStatus('Video tersimpan di cloud, bisa dibuka di perangkat lain.');
    } else onStatus(up.error ? `Video hanya tersimpan di perangkat ini (${up.error}).` : 'Video tersimpan di perangkat ini. Masuk untuk menyimpannya ke cloud.');
  };
}

export function VideoSection() {
  const doc = useStudio((s) => s.doc!);
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const save = useMediaSaver();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fitScene, setFitScene] = useState(true);
  const { w: W, h: H } = canvasSize(doc.aspect);
  const media = Object.values(doc.media || {});

  const insert = (info: MediaInfo) => {
    const s = useStudio.getState();
    const sc = s.doc!.scenes[s.sceneIdx];
    const want = Math.min(60, Math.max(1, info.duration || sc.duration));
    if (fitScene && Math.abs(want - sc.duration) > 0.05) s.updateScene(s.sceneIdx, { duration: Math.round(want * 10) / 10 });
    const dur = useStudio.getState().doc!.scenes[s.sceneIdx].duration;
    const L = makeVideoLayer(info, W, H, dur);
    // video jadi lapisan paling bawah, seperti klip utama di CapCut
    s.addLayer(L);
    s.moveLayer(L.id, 'bottom');
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      const info = await registerVideo(f);
      setMsg('Mengunggah…');
      insert(info);
      save(info, setMsg);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Klip video">
      <input ref={ref} type="file" accept="video/*" hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-mk-line-2 bg-mk-ink px-4 py-5 text-center transition hover:border-mk-coral/70"
      >
        <Film className="h-5 w-5 text-mk-coral" />
        <span className="text-sm font-bold">{busy ? 'Membaca video…' : 'Tambah klip video'}</span>
        <span className="text-[11px] text-mk-dim">MP4 / MOV / WebM, maks. 300 MB. Bisa dipotong, dipercepat, diatur suaranya.</span>
      </button>
      <label className="flex items-center gap-2 text-[11px] text-mk-muted">
        <input type="checkbox" className="accent-[#7B50FF]" checked={fitScene} onChange={(e) => setFitScene(e.target.checked)} /> Samakan durasi scene dengan panjang klip
      </label>
      {msg && (
        <p role="status" className="text-[11px] font-semibold text-mk-coral">
          {msg}
        </p>
      )}
      {media.length > 0 && (
        <ul className="space-y-1" aria-label="Video di proyek ini">
          {media.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-xl border border-mk-line px-2.5 py-2">
              <Film className="h-4 w-4 shrink-0 text-mk-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{m.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-mk-dim">
                  {m.missing ? 'File belum disambungkan' : fmt(m.duration)}
                  {m.remote ? <Cloud className="h-3 w-3" aria-label="Di cloud" /> : <CloudOff className="h-3 w-3" aria-label="Hanya di perangkat ini" />}
                </span>
              </span>
              <button type="button" className="mk-btn-icon h-7 w-7" title={`Tambah ${m.name} ke scene ${sceneIdx + 1}`} aria-label={`Tambah ${m.name}`} onClick={() => insert(m)}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function VideoProps({ layer }: { layer: VideoLayer }) {
  const doc = useStudio((s) => s.doc!);
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const sceneDur = useStudio((s) => s.doc!.scenes[s.sceneIdx].duration);
  const st = useStudio.getState();
  const save = useMediaSaver();
  const [msg, setMsg] = useState<string | null>(null);
  const relinkRef = useRef<HTMLInputElement>(null);
  const info = doc.media?.[layer.mediaId];
  const srcDur = info?.duration || layer.trimOut || 1;
  const len = clipLength(layer);
  /** Durasi tampil mengikuti potongan klip (CapCut: memotong klip = memendekkan klip di timeline). */
  const withEnd = (p: Partial<VideoLayer>): Partial<VideoLayer> => {
    const n = { ...layer, ...p };
    const e = n.start + clipLength(n);
    return { ...p, end: e >= sceneDur - 0.01 ? null : Math.round(e * 100) / 100 };
  };
  return (
    <Section title="Klip video">
      {(!info || info.missing) && (
        <div className="rounded-xl bg-mk-amber/10 p-3 text-xs">
          <p className="font-bold text-mk-amber">File video belum disambungkan</p>
          <p className="mt-0.5 text-mk-muted">Proyek impor hanya membawa susunan klip. Pilih file aslinya ({info?.name || layer.name}) dari HP / laptopmu.</p>
          <input
            ref={relinkRef}
            type="file"
            accept="video/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f || !info) return;
              try {
                const fixed = await relinkVideo(info, f);
                save(fixed, setMsg);
              } catch (err) {
                setMsg((err as Error).message);
              }
            }}
          />
          <button type="button" className="mk-btn-primary mt-2 px-3 py-1.5 text-xs" onClick={() => relinkRef.current?.click()}>
            <Link2 className="h-3.5 w-3.5" /> Pilih file
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className="text-[11px] font-semibold text-mk-coral">
          {msg}
        </p>
      )}
      <div className="flex items-center justify-between rounded-xl bg-mk-mist px-3 py-2 text-[11px]">
        <span>
          Dipakai <b>{fmt(layer.trimIn)}</b> sampai <b>{fmt(layer.trimOut)}</b> dari {fmt(srcDur)}
        </span>
        <span className="font-bold text-mk-coral">{len.toFixed(1)} dtk</span>
      </div>
      <Slider label="Potong awal" value={layer.trimIn} min={0} max={Math.max(0.1, layer.trimOut - 0.2)} step={0.05} onChange={(v) => up(layer.id, withEnd({ trimIn: v }), true)} onCommit={endDrag} format={fmt} />
      <Slider label="Potong akhir" value={layer.trimOut} min={layer.trimIn + 0.2} max={srcDur} step={0.05} onChange={(v) => up(layer.id, withEnd({ trimOut: v }), true)} onCommit={endDrag} format={fmt} />
      <div>
        <span className="mb-1 block text-[11px] font-semibold text-mk-muted">Kecepatan</span>
        <div className="flex flex-wrap gap-1.5">
          {[0.25, 0.5, 1, 1.5, 2, 3].map((v) => (
            <button key={v} type="button" className={cx('mk-chip', Math.abs(layer.speed - v) < 0.01 && 'mk-chip-on')} onClick={() => up(layer.id, withEnd({ speed: v }))}>
              {v}×
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Slider label="Volume" value={Math.round(layer.volume * 100)} min={0} max={200} onChange={(v) => up(layer.id, { volume: v / 100 }, true)} onCommit={endDrag} format={(v) => `${Math.round(v)}%`} />
        </div>
        <button type="button" className={cx('mk-btn-icon', layer.muted && 'text-mk-amber')} aria-pressed={!!layer.muted} title={layer.muted ? 'Nyalakan suara' : 'Bisukan'} onClick={() => up(layer.id, { muted: !layer.muted })}>
          {layer.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
      <Segmented size="sm" value={layer.fit} onChange={(v) => up(layer.id, { fit: v })} options={[{ value: 'cover', label: 'Isi penuh' }, { value: 'contain', label: 'Utuh' }]} />
      <Slider label="Sudut membulat" value={layer.radius} min={0} max={200} onChange={(v) => up(layer.id, { radius: v }, true)} onCommit={endDrag} />
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.updateScene(st.sceneIdx, { duration: Math.min(60, Math.max(1, Math.round((layer.start + len) * 10) / 10)) })}>
          Durasi scene = klip
        </button>
        <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.splitAtPlayhead()} title="Potong scene (dan klip) di playhead">
          <Scissors className="h-3.5 w-3.5" /> Potong di playhead
        </button>
      </div>
      <p className="text-[11px] text-mk-dim">Ketuk play untuk mendengar suara klip. Suara klip ikut masuk ke MP4 bersama musik & narasi.</p>
    </Section>
  );
}
