'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  Component,
  Diamond,
  Group,
  PenTool,
  Plus,
  SquareDashedMousePointer,
  Trash2,
  Ungroup,
  Unlink,
} from 'lucide-react';
import type { GroupLayer, Layer, PathLayer, ProjectDoc, Scene, SymbolDef } from '@/lib/studio/types';
import { canvasSize } from '@/lib/studio/types';
import { Renderer } from '@/lib/studio/renderer';
import { countInstances, hasKeys, instanceOf, KEY_EASES, poseAt, presetKeys, upsertKey } from '@/lib/studio/vector';
import type { AlignOp } from '@/lib/studio/vector';
import { loadLibrary, removeFromLibrary, saveToLibrary } from '@/lib/studio/symbol-lib';
import { useStudio } from '@/store/useStudio';
import { ColorField, cx, Section, Segmented, Slider } from './ui';

function useSwatches() {
  const p = useStudio((s) => s.doc!.theme.palette);
  return Array.from(new Set([p.text, p.primary, p.secondary, p.bg, p.muted, '#FFFFFF', '#111111'].map((c) => c.toUpperCase())));
}

/* ------------------------------------------------------------------ */
/* perataan (Figma)                                                    */
/* ------------------------------------------------------------------ */

const ALIGN: Array<{ op: AlignOp; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { op: 'left', label: 'Rata kiri', icon: AlignStartVertical },
  { op: 'hcenter', label: 'Tengah horizontal', icon: AlignCenterVertical },
  { op: 'right', label: 'Rata kanan', icon: AlignEndVertical },
  { op: 'top', label: 'Rata atas', icon: AlignStartHorizontal },
  { op: 'vcenter', label: 'Tengah vertikal', icon: AlignCenterHorizontal },
  { op: 'bottom', label: 'Rata bawah', icon: AlignEndHorizontal },
];

export function AlignBar({ many }: { many: boolean }) {
  const align = useStudio((s) => s.alignSelected);
  return (
    <div className="flex flex-wrap gap-1">
      {ALIGN.map((a) => (
        <button key={a.op} type="button" className="mk-btn-icon h-8 w-8" title={many ? a.label : `${a.label} (ke kanvas)`} aria-label={a.label} onClick={() => align(a.op)}>
          <a.icon className="h-4 w-4" />
        </button>
      ))}
      {many && (
        <>
          <button type="button" className="mk-btn-icon h-8 w-8" title="Jarak rata horizontal (min. 3)" aria-label="Jarak rata horizontal" onClick={() => align('hdist')}>
            <AlignHorizontalSpaceAround className="h-4 w-4" />
          </button>
          <button type="button" className="mk-btn-icon h-8 w-8" title="Jarak rata vertikal (min. 3)" aria-label="Jarak rata vertikal" onClick={() => align('vdist')}>
            <AlignVerticalSpaceAround className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* seleksi ganda                                                       */
/* ------------------------------------------------------------------ */

export function MultiInspector() {
  const n = useStudio((s) => s.selIds.length);
  const st = useStudio.getState();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <Section title={`${n} elemen dipilih`}>
        <AlignBar many />
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={st.groupSelected} title="Ctrl+G">
            <Group className="h-3.5 w-3.5" /> Gabung jadi grup
          </button>
          <button type="button" className="mk-btn-ghost text-[11px] hover:!text-red-600" onClick={st.removeSelected}>
            <Trash2 className="h-3.5 w-3.5" /> Hapus semua
          </button>
        </div>
      </Section>
      <MakeComponent name={name} setName={setName} msg={msg} setMsg={setMsg} />
      <Section>
        <p className="text-[11px] leading-relaxed text-mk-dim">Shift+klik untuk menambah atau mengurangi pilihan. Seret di area kosong untuk memilih banyak sekaligus.</p>
      </Section>
    </div>
  );
}

function MakeComponent({ name, setName, msg, setMsg }: { name: string; setName: (v: string) => void; msg: string | null; setMsg: (v: string | null) => void }) {
  const st = useStudio.getState();
  return (
    <Section title="Jadikan komponen">
      <p className="text-[11px] leading-relaxed text-mk-dim">Simpan desain ini untuk dipakai ulang. Ubah satu, semua salinannya ikut berubah.</p>
      <div className="flex gap-1.5">
        <input className="mk-input min-w-0 flex-1 py-2 text-xs" placeholder="Nama, mis. Tombol pesan" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama komponen" />
        <button
          type="button"
          className="mk-btn-primary shrink-0 px-3 text-[11px]"
          onClick={() => {
            const sym = st.makeSymbol(name || 'Komponen');
            if (!sym) return;
            const err = saveToLibrary(sym, useStudio.getState().doc?.assets || {});
            setMsg(err || `"${sym.name}" tersimpan di Komponen saya.`);
            setName('');
          }}
        >
          <Component className="h-3.5 w-3.5" /> Simpan
        </button>
      </div>
      {msg && (
        <p role="status" className="text-[11px] font-semibold text-mk-coral">
          {msg}
        </p>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* vektor (Illustrator)                                                */
/* ------------------------------------------------------------------ */

export function PathProps({ layer }: { layer: PathLayer }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const pathEdit = useStudio((s) => s.pathEdit);
  const st = useStudio.getState();
  const sw = useSwatches();
  const set = (p: Partial<PathLayer>) => up(layer.id, p);
  const live = (p: Partial<PathLayer>) => up(layer.id, p, true);
  return (
    <Section title="Vektor">
      <button type="button" className={cx('w-full text-xs', pathEdit === layer.id ? 'mk-btn-primary' : 'mk-btn-ghost')} onClick={() => st.setPathEdit(pathEdit === layer.id ? null : layer.id)}>
        <PenTool className="h-3.5 w-3.5" /> {pathEdit === layer.id ? 'Selesai edit titik' : `Edit titik (${layer.points.length})`}
      </button>
      <label className="flex items-center gap-2 text-xs text-mk-muted">
        <input type="checkbox" className="accent-[#7B50FF]" checked={layer.closed} onChange={(e) => set({ closed: e.target.checked, fill: e.target.checked ? layer.fill || sw[1] : layer.fill })} /> Bentuk tertutup
      </label>
      {layer.closed && (
        <>
          <label className="flex items-center gap-2 text-xs text-mk-muted">
            <input type="checkbox" className="accent-[#7B50FF]" checked={!!layer.fill} onChange={(e) => set({ fill: e.target.checked ? sw[1] : null })} /> Isi warna
          </label>
          {layer.fill && (
            <>
              <ColorField label={layer.gradient ? 'Warna awal' : 'Warna isi'} value={layer.fill} onChange={(c) => set({ fill: c })} swatches={sw} />
              <label className="flex items-center gap-2 text-xs text-mk-muted">
                <input type="checkbox" className="accent-[#7B50FF]" checked={!!layer.gradient} onChange={(e) => set({ gradient: e.target.checked ? { to: sw[2], angle: 90 } : null })} /> Gradien
              </label>
              {layer.gradient && (
                <>
                  <ColorField label="Warna akhir" value={layer.gradient.to} onChange={(c) => set({ gradient: { ...layer.gradient!, to: c } })} swatches={sw} />
                  <Slider label="Sudut gradien" value={layer.gradient.angle} min={0} max={360} onChange={(v) => live({ gradient: { ...layer.gradient!, angle: v } })} onCommit={endDrag} format={(v) => `${Math.round(v)}°`} />
                </>
              )}
            </>
          )}
        </>
      )}
      <Slider label="Tebal garis" value={layer.stroke?.width || 0} min={0} max={60} onChange={(v) => live({ stroke: v ? { color: layer.stroke?.color || sw[0], width: v, cap: layer.stroke?.cap || 'round' } : null })} onCommit={endDrag} />
      {layer.stroke && (
        <>
          <ColorField label="Warna garis" value={layer.stroke.color} onChange={(c) => set({ stroke: { ...layer.stroke!, color: c } })} swatches={sw} />
          <Segmented
            size="sm"
            value={layer.stroke.cap || 'round'}
            onChange={(v) => set({ stroke: { ...layer.stroke!, cap: v } })}
            options={[
              { value: 'round', label: 'Ujung bulat' },
              { value: 'butt', label: 'Ujung datar' },
            ]}
          />
        </>
      )}
      <Slider label="Efek gambar garis" value={layer.drawOn || 0} min={0} max={4} step={0.1} onChange={(v) => live({ drawOn: v })} onCommit={endDrag} format={(v) => (v ? `${v.toFixed(1)} dtk` : 'mati')} />
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* grup & komponen (Figma)                                             */
/* ------------------------------------------------------------------ */

export function GroupProps({ layer }: { layer: GroupLayer }) {
  const doc = useStudio((s) => s.doc!);
  const st = useStudio.getState();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const sym = layer.symbolId ? doc.symbols?.[layer.symbolId] : undefined;
  const n = sym ? countInstances(doc, sym.id) : 0;
  return (
    <>
      <Section title={sym ? `Komponen: ${sym.name}` : `Grup · ${layer.children.length} elemen`}>
        {sym && <p className="text-[11px] text-mk-dim">{n > 1 ? `Dipakai ${n} kali di proyek ini. Edit isinya, semua salinan ikut berubah.` : 'Edit isinya kapan saja. Salinan berikutnya ikut berubah.'}</p>}
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="mk-btn-primary col-span-2 text-[11px]" onClick={() => st.enterGroup(layer.id)} title="Enter / klik ganda">
            <SquareDashedMousePointer className="h-3.5 w-3.5" /> Edit isi {sym ? 'komponen' : 'grup'}
          </button>
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.ungroupLayer(layer.id)} title="Ctrl+Shift+G">
            <Ungroup className="h-3.5 w-3.5" /> Lepas grup
          </button>
          {sym ? (
            <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.detachInstance(layer.id)}>
              <Unlink className="h-3.5 w-3.5" /> Putus tautan
            </button>
          ) : (
            <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.duplicateLayer(layer.id)}>
              <Plus className="h-3.5 w-3.5" /> Duplikat
            </button>
          )}
        </div>
      </Section>
      {!sym && <MakeComponent name={name} setName={setName} msg={msg} setMsg={setMsg} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* keyframe (After Effects / Alight Motion)                            */
/* ------------------------------------------------------------------ */

const PRESETS: Array<{ id: Parameters<typeof presetKeys>[1]; label: string }> = [
  { id: 'masuk-kiri', label: 'Geser dari kiri' },
  { id: 'masuk-bawah', label: 'Naik' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'putar', label: 'Putar' },
  { id: 'muncul', label: 'Muncul' },
];

export function KeyframeSection({ layer }: { layer: Layer }) {
  const up = useStudio((s) => s.updateLayer);
  const t = useStudio((s) => s.playhead);
  const seek = useStudio((s) => s.seekLocal);
  const W = useStudio((s) => canvasSize(s.doc!.aspect).w);
  const keys = layer.keyframes || [];
  const onKey = keys.find((k) => Math.abs(k.t - t) < 0.04);
  const pose = poseAt(layer, t);
  const setKeys = (ks: Layer['keyframes']) => up(layer.id, { keyframes: ks });
  return (
    <Section
      title="Animasi keyframe"
      right={
        <span className="font-mono text-[11px] tabular-nums text-mk-dim" aria-label="Waktu playhead">
          {t.toFixed(2)} dtk
        </span>
      }
    >
      <button type="button" className={cx('w-full text-xs', onKey ? 'mk-btn-ghost' : 'mk-btn-primary')} onClick={() => setKeys(upsertKey(layer, t))} disabled={!!onKey}>
        <Diamond className="h-3.5 w-3.5" /> {onKey ? 'Sudah ada keyframe di waktu ini' : `Tambah keyframe di ${t.toFixed(2)} dtk`}
      </button>
      {hasKeys(layer) ? (
        <>
          <p className="text-[11px] leading-relaxed text-mk-dim">Pindahkan playhead, lalu geser, putar, atau ubah transparansi elemen. Keyframe tercatat otomatis.</p>
          {onKey && <Slider label="Skala di keyframe ini" value={pose.scale * 100} min={5} max={400} onChange={(v) => setKeys(upsertKey(layer, t, { scale: v / 100 }))} format={(v) => `${Math.round(v)}%`} />}
          <ul className="space-y-1" aria-label="Daftar keyframe">
            {keys.map((k, i) => (
              <li key={`${k.t}-${i}`} className={cx('flex items-center gap-1.5 rounded-xl border px-2 py-1.5', Math.abs(k.t - t) < 0.04 ? 'border-mk-coral bg-mk-coral/10' : 'border-mk-line')}>
                <button type="button" className="flex items-center gap-1 font-mono text-[11px] font-bold tabular-nums text-mk-cream" onClick={() => seek(k.t)} title="Lompat ke keyframe ini">
                  <Diamond className="h-3 w-3 fill-mk-coral text-mk-coral" /> {k.t.toFixed(2)}
                </button>
                {i < keys.length - 1 ? (
                  <select
                    className="ml-auto rounded-lg border border-mk-line bg-white px-1.5 py-1 text-[11px]"
                    value={k.ease}
                    aria-label="Gaya gerak ke keyframe berikutnya"
                    onChange={(e) => setKeys(keys.map((q, j) => (j === i ? { ...q, ease: e.target.value } : q)))}
                  >
                    {KEY_EASES.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="ml-auto text-[11px] text-mk-dim">akhir</span>
                )}
                <button type="button" className="mk-btn-icon h-7 w-7" aria-label={`Hapus keyframe ${k.t.toFixed(2)}`} onClick={() => setKeys(keys.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-[11px] font-semibold text-mk-muted underline hover:text-red-600"
            onClick={() => up(layer.id, { keyframes: [], x: Math.round(pose.x), y: Math.round(pose.y), rotation: Math.round(pose.rotation), opacity: pose.opacity })}
          >
            Hapus semua keyframe
          </button>
        </>
      ) : (
        <>
          <p className="text-[11px] text-mk-dim">Atau mulai dari gerak jadi (0,8 dtk dari playhead):</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="mk-chip" onClick={() => setKeys(presetKeys(layer, p.id, t, 0.8, W))}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* panel Komponen saya                                                 */
/* ------------------------------------------------------------------ */

let thumbR: Renderer | null = null;
function SymbolThumb({ sym, doc }: { sym: SymbolDef; doc: ProjectDoc }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const id = window.setTimeout(() => {
      if (!thumbR) thumbR = new Renderer({ allowBlur: false, particleScale: 0.2 });
      const inst = instanceOf(sym, 1080, 1080);
      const s = Math.min(900 / sym.w, 900 / sym.h);
      const w = sym.w * s;
      const h = sym.h * s;
      const scene: Scene = {
        id: 'thumb',
        name: '',
        role: 'info',
        duration: 30,
        background: { type: 'solid', color: '#F4F1FF' },
        layers: [{ ...inst, x: (1080 - w) / 2, y: (1080 - h) / 2, w, h }],
        transition: { id: 'cut', duration: 0.01 },
      };
      thumbR.setDoc({ ...doc, aspect: '1:1', showProgress: false, watermark: undefined });
      const draw = () => thumbR?.renderScene(c.getContext('2d')!, c.width, c.height, scene, 29);
      thumbR.onAssetLoaded = draw;
      draw();
    }, 60);
    return () => window.clearTimeout(id);
  }, [sym, doc]);
  return <canvas ref={ref} width={160} height={160} className="aspect-square w-full rounded-xl bg-mk-mist" />;
}

export function ComponentsPanel() {
  const doc = useStudio((s) => s.doc!);
  const selCount = useStudio((s) => s.selIds.length);
  const st = useStudio.getState();
  const [lib, setLib] = useState<SymbolDef[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setLib(loadLibrary()), []);
  const local = useMemo(() => Object.values(doc.symbols || {}), [doc.symbols]);
  const libOnly = lib.filter((s) => !doc.symbols?.[s.id]);
  return (
    <div>
      <Section title="Buat komponen sendiri">
        <ol className="list-decimal space-y-0.5 pl-4 text-[11px] leading-relaxed text-mk-muted">
          <li>Gambar dengan alat di kiri kanvas: persegi, elips, garis, pena, pensil, teks.</li>
          <li>Pilih beberapa elemen (Shift+klik atau seret area).</li>
          <li>Beri nama lalu simpan. Komponen bisa dipakai di proyek lain.</li>
        </ol>
        {selCount > 0 ? (
          <div className="flex gap-1.5">
            <input className="mk-input min-w-0 flex-1 py-2 text-xs" placeholder="Nama komponen" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama komponen" />
            <button
              type="button"
              className="mk-btn-primary shrink-0 px-3 text-[11px]"
              onClick={() => {
                const sym = st.makeSymbol(name || 'Komponen');
                if (!sym) return;
                const err = saveToLibrary(sym, doc.assets);
                setMsg(err || `"${sym.name}" tersimpan.`);
                setName('');
                setLib(loadLibrary());
              }}
            >
              Simpan {selCount > 1 ? `${selCount} elemen` : ''}
            </button>
          </div>
        ) : (
          <p className="rounded-xl bg-mk-mist px-3 py-2 text-[11px] text-mk-muted">Pilih elemen di kanvas dulu untuk dijadikan komponen.</p>
        )}
        {msg && (
          <p role="status" className="text-[11px] font-semibold text-mk-coral">
            {msg}
          </p>
        )}
      </Section>

      <Section title={`Di proyek ini (${local.length})`}>
        {local.length ? (
          <div className="grid grid-cols-3 gap-2">
            {local.map((s) => (
              <button key={s.id} type="button" className="group text-left" onClick={() => st.insertSymbol(s)} title={`Tambah ${s.name}`}>
                <SymbolThumb sym={s} doc={doc} />
                <span className="mt-1 block truncate text-[11px] font-semibold group-hover:text-mk-coral">{s.name}</span>
                <span className="block text-[10px] text-mk-dim">{countInstances(doc, s.id)}× dipakai</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-mk-dim">Belum ada komponen di proyek ini.</p>
        )}
      </Section>

      <Section title={`Pustaka di perangkat ini (${libOnly.length})`}>
        {libOnly.length ? (
          <div className="grid grid-cols-3 gap-2">
            {libOnly.map((s) => (
              <div key={s.id} className="group relative">
                <button type="button" className="w-full text-left" onClick={() => st.insertSymbol(s)} title={`Tambah ${s.name}`}>
                  <SymbolThumb sym={s} doc={doc} />
                  <span className="mt-1 block truncate text-[11px] font-semibold group-hover:text-mk-coral">{s.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Hapus ${s.name} dari pustaka`}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-white/90 text-mk-muted shadow hover:text-red-600 group-hover:flex group-focus-within:flex"
                  onClick={() => {
                    removeFromLibrary(s.id);
                    setLib(loadLibrary());
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-mk-dim">Komponen dari proyek lain akan muncul di sini.</p>
        )}
      </Section>
    </div>
  );
}
