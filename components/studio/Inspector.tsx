'use client';

import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Palette, Shuffle, ArrowDownToLine, ArrowUpToLine, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock, Wand2 } from 'lucide-react';
import type { ComponentLayer, FontId, IconLayer, ImageLayer, Layer, ShapeLayer, TextLayer } from '@/lib/studio/types';
import { canvasSize } from '@/lib/studio/types';
import { currentLayer, Tool, useStudio } from '@/store/useStudio';
import { getComponent } from '@/lib/studio/packs/components';
import { getAnimation } from '@/lib/studio/packs/animations';
import { getIcon, iconSvgMarkup } from '@/lib/studio/packs/icons';
import { getTransition } from '@/lib/studio/packs/transitions';
import { FONT_LIST, fontLabel, fontStack } from '@/lib/studio/fonts';
import { ColorField, cx, Field, NumberField, Section, Segmented, Slider } from './ui';

function useSwatches() {
  const p = useStudio((s) => s.doc!.theme.palette);
  return [p.text, p.primary, p.secondary, p.bg, p.muted, '#FFFFFF', '#111111'];
}

export function LayerActions({ layer, compact }: { layer: Layer; compact?: boolean }) {
  const st = useStudio.getState();
  return (
    <div className={cx('flex flex-wrap gap-1', compact && 'justify-between')}>
      <button type="button" className="mk-btn-icon" title="Ke depan" onClick={() => st.moveLayer(layer.id, 'up')}>
        <ChevronUp className="h-4 w-4" />
      </button>
      <button type="button" className="mk-btn-icon" title="Ke belakang" onClick={() => st.moveLayer(layer.id, 'down')}>
        <ChevronDown className="h-4 w-4" />
      </button>
      <button type="button" className="mk-btn-icon" title="Paling depan" onClick={() => st.moveLayer(layer.id, 'top')}>
        <ArrowUpToLine className="h-4 w-4" />
      </button>
      <button type="button" className="mk-btn-icon" title="Paling belakang" onClick={() => st.moveLayer(layer.id, 'bottom')}>
        <ArrowDownToLine className="h-4 w-4" />
      </button>
      <button type="button" className="mk-btn-icon" title={layer.locked ? 'Buka kunci' : 'Kunci'} onClick={() => st.updateLayer(layer.id, { locked: !layer.locked })}>
        {layer.locked ? <Lock className="h-4 w-4 text-mk-amber" /> : <Unlock className="h-4 w-4" />}
      </button>
      <button type="button" className="mk-btn-icon" title="Duplikat (Ctrl+D)" onClick={() => st.duplicateLayer(layer.id)}>
        <Copy className="h-4 w-4" />
      </button>
      <button type="button" className="mk-btn-icon hover:!bg-red-500/20 hover:!text-red-300" title="Hapus (Del)" onClick={() => st.removeLayer(layer.id)}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Inspector({ onOpenTool }: { onOpenTool: (t: Tool) => void }) {
  const doc = useStudio((s) => s.doc)!;
  const layer = useStudio(currentLayer);
  const mode = useStudio((s) => s.mode);
  if (!layer) return <SceneInspector onOpenTool={onOpenTool} />;
  return <LayerInspector layer={layer} pro={mode === 'pro'} onOpenTool={onOpenTool} aspect={doc.aspect} />;
}

function LayerInspector({ layer, pro, onOpenTool, aspect }: { layer: Layer; pro: boolean; onOpenTool: (t: Tool) => void; aspect: string }) {
  const up = useStudio((s) => s.updateLayer);
  const live = (patch: Partial<Layer>) => up(layer.id, patch, true);
  const endDrag = useStudio((s) => s.endDrag);
  const sceneDur = useStudio((s) => s.doc!.scenes[s.sceneIdx].duration);
  const sw = useSwatches();
  const { w: W, h: H } = canvasSize(aspect as never);
  const animName = layer.animIn ? getAnimation(layer.animIn.id)?.name : null;
  return (
    <div>
      <Section title={layer.name} right={<span className="rounded bg-mk-panel-3 px-1.5 py-0.5 text-[10px] font-bold uppercase text-mk-muted">{layer.kind}</span>}>
        <LayerActions layer={layer} />
      </Section>

      {layer.kind === 'text' && <TextProps layer={layer} pro={pro} />}
      {layer.kind === 'component' && <ComponentProps layer={layer} />}
      {layer.kind === 'icon' && <IconProps layer={layer} onOpenTool={onOpenTool} />}
      {layer.kind === 'image' && <ImageProps layer={layer} />}
      {layer.kind === 'shape' && <ShapeProps layer={layer} />}

      <Section title="Animasi">
        <button type="button" onClick={() => onOpenTool('animasi')} className="flex w-full items-center justify-between rounded-xl border border-mk-line bg-mk-ink px-3 py-2.5 text-left text-xs hover:border-mk-coral/60">
          <span>
            <span className="block font-bold">{animName || 'Tanpa animasi masuk'}</span>
            <span className="text-[10px] text-mk-dim">
              {layer.animLoop ? `Loop: ${getAnimation(layer.animLoop)?.name}` : 'Tanpa loop'}
              {layer.animOut ? ` · Keluar: ${getAnimation(layer.animOut.id)?.name}` : ''}
            </span>
          </span>
          <Wand2 className="h-4 w-4 text-mk-coral" />
        </button>
      </Section>

      <Section title="Posisi & ukuran">
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField label="X" value={layer.x} onChange={(v) => up(layer.id, { x: v })} />
          <NumberField label="Y" value={layer.y} onChange={(v) => up(layer.id, { y: v })} />
          <NumberField label="L" value={layer.w} min={10} onChange={(v) => up(layer.id, { w: v })} />
          <NumberField label="T" value={layer.h} min={10} onChange={(v) => up(layer.id, { h: v })} />
          <NumberField label="°" value={layer.rotation} onChange={(v) => up(layer.id, { rotation: v })} />
          <NumberField label="%" value={Math.round(layer.opacity * 100)} min={0} max={100} onChange={(v) => up(layer.id, { opacity: v / 100 })} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" className="mk-btn-ghost px-2 py-1.5 text-[11px]" onClick={() => up(layer.id, { x: Math.round((W - layer.w) / 2) })}>
            Tengah ↔
          </button>
          <button type="button" className="mk-btn-ghost px-2 py-1.5 text-[11px]" onClick={() => up(layer.id, { y: Math.round((H - layer.h) / 2) })}>
            Tengah ↕
          </button>
          <button type="button" className="mk-btn-ghost px-2 py-1.5 text-[11px]" onClick={() => up(layer.id, { rotation: 0 })}>
            Reset putar
          </button>
        </div>
      </Section>

      {pro && (
        <Section title="Waktu tampil (detik dalam scene)">
          <Slider label="Mulai" value={layer.start} min={0} max={Math.max(0.1, sceneDur - 0.2)} step={0.05} onChange={(v) => live({ start: v })} onCommit={endDrag} format={(v) => `${v.toFixed(2)}s`} />
          <Slider label="Selesai" value={layer.end ?? sceneDur} min={layer.start + 0.2} max={sceneDur} step={0.05} onChange={(v) => live({ end: v >= sceneDur - 0.01 ? null : v })} onCommit={endDrag} format={(v) => (v >= sceneDur - 0.01 ? 'akhir scene' : `${v.toFixed(2)}s`)} />
        </Section>
      )}

      {pro && layer.kind !== 'text' && (
        <Section title="Bayangan">
          <label className="flex items-center gap-2 text-xs text-mk-muted">
            <input type="checkbox" className="accent-[#FF6A3D]" checked={!!layer.shadow} onChange={(e) => up(layer.id, { shadow: e.target.checked ? { color: 'rgba(0,0,0,0.45)', blur: 36, x: 0, y: 18 } : null })} />
            Aktifkan bayangan
          </label>
          {layer.shadow && <Slider label="Blur" value={layer.shadow.blur} min={0} max={100} onChange={(v) => live({ shadow: { ...layer.shadow!, blur: v } })} onCommit={endDrag} />}
        </Section>
      )}
      <div className="hidden">{sw.length}</div>
    </div>
  );
}

function TextProps({ layer, pro }: { layer: TextLayer; pro: boolean }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const sw = useSwatches();
  const set = (p: Partial<TextLayer>) => up(layer.id, p);
  const live = (p: Partial<TextLayer>) => up(layer.id, p, true);
  return (
    <>
      <Section title="Teks">
        <textarea
          id="mk-text-editor"
          value={layer.text}
          onChange={(e) => live({ text: e.target.value })}
          onBlur={endDrag}
          rows={3}
          className="mk-input resize-none text-sm"
          placeholder="Ketik teks…"
        />
        <Slider label="Ukuran" value={layer.size} min={16} max={400} onChange={(v) => live({ size: v })} onCommit={endDrag} format={(v) => `${Math.round(v)}px`} />
        <ColorField label="Warna" value={layer.color} onChange={(c) => set({ color: c })} swatches={sw} />
        <div className="grid grid-cols-2 gap-2">
          <Segmented
            size="sm"
            value={layer.align}
            onChange={(v) => set({ align: v })}
            options={[
              { value: 'left', label: <AlignLeft className="h-3.5 w-3.5" />, title: 'Rata kiri' },
              { value: 'center', label: <AlignCenter className="h-3.5 w-3.5" />, title: 'Tengah' },
              { value: 'right', label: <AlignRight className="h-3.5 w-3.5" />, title: 'Rata kanan' },
            ]}
          />
          <Segmented
            size="sm"
            value={String(layer.weight >= 800 ? 800 : layer.weight >= 600 ? 600 : 400)}
            onChange={(v) => set({ weight: Number(v) })}
            options={[
              { value: '400', label: 'Reg' },
              { value: '600', label: 'Semi' },
              { value: '800', label: 'Tebal' },
            ]}
          />
        </div>
        <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
          {FONT_LIST.map((f: FontId) => (
            <button key={f} type="button" onClick={() => set({ font: f })} className={cx('mk-chip shrink-0', layer.font === f && 'mk-chip-on')} style={{ fontFamily: fontStack(f) }}>
              {fontLabel(f)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={cx('mk-chip', layer.uppercase && 'mk-chip-on')} onClick={() => set({ uppercase: !layer.uppercase })}>
            AA Kapital
          </button>
          <button type="button" className={cx('mk-chip', layer.italic && 'mk-chip-on')} onClick={() => set({ italic: !layer.italic })}>
            <i>Miring</i>
          </button>
          <button type="button" className={cx('mk-chip', !!layer.highlight && 'mk-chip-on')} onClick={() => set({ highlight: layer.highlight ? null : { color: sw[1], padding: 18, radius: 10 } })}>
            Sorot
          </button>
          <button type="button" className={cx('mk-chip', !!layer.stroke && 'mk-chip-on')} onClick={() => set({ stroke: layer.stroke ? null : { color: '#000000', width: 6 } })}>
            Outline
          </button>
          <button type="button" className={cx('mk-chip', !!layer.shadow && 'mk-chip-on')} onClick={() => set({ shadow: layer.shadow ? null : { color: 'rgba(0,0,0,0.6)', blur: 24, x: 0, y: 8 } })}>
            Bayangan
          </button>
        </div>
        {layer.highlight && <ColorField label="Warna sorot" value={layer.highlight.color} onChange={(c) => set({ highlight: { ...layer.highlight!, color: c } })} swatches={sw} />}
        {layer.stroke && (
          <>
            <ColorField label="Warna outline" value={layer.stroke.color} onChange={(c) => set({ stroke: { ...layer.stroke!, color: c } })} swatches={sw} />
            <Slider label="Tebal outline" value={layer.stroke.width} min={1} max={24} onChange={(v) => live({ stroke: { ...layer.stroke!, width: v } })} onCommit={endDrag} />
          </>
        )}
      </Section>
      {pro && (
        <Section title="Spasi">
          <Slider label="Jarak baris" value={layer.lineHeight} min={0.8} max={2} step={0.02} onChange={(v) => live({ lineHeight: v })} onCommit={endDrag} />
          <Slider label="Jarak huruf" value={layer.letterSpacing} min={-6} max={30} onChange={(v) => live({ letterSpacing: v })} onCommit={endDrag} />
          <Field label="Kata berwarna aksen (pisah koma)">
            <input className="mk-input py-2 text-xs" value={(layer.emphasisWords || []).join(', ')} onChange={(e) => live({ emphasisWords: e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) })} onBlur={endDrag} />
          </Field>
          {layer.emphasisColor && <ColorField label="Warna aksen" value={layer.emphasisColor} onChange={(c) => set({ emphasisColor: c })} swatches={sw} />}
        </Section>
      )}
    </>
  );
}

function ComponentProps({ layer }: { layer: ComponentLayer }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const doc = useStudio((s) => s.doc!);
  const sw = useSwatches();
  const def = getComponent(layer.componentId);
  if (!def) return <Section><p className="text-xs text-mk-dim">Komponen tidak ditemukan (mungkin dihapus admin).</p></Section>;
  const P = { ...def.defaults, ...layer.props };
  const setProp = (k: string, v: string) => up(layer.id, { props: { ...layer.props, [k]: v } }, true);
  const assets = Object.keys(doc.assets);
  return (
    <>
      <Section title={def.name}>
        {def.fields.map((f) =>
          f.key === 'image' ? (
            <div key={f.key}>
              <span className="mb-1 block text-[11px] font-semibold text-mk-muted">Foto di layar</span>
              {assets.length ? (
                <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
                  {assets.map((id) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={id} src={doc.assets[id]} alt="" onClick={() => up(layer.id, { props: { ...layer.props, image: id } })} className={cx('h-12 w-12 shrink-0 cursor-pointer rounded-lg object-cover', P.image === id && 'ring-2 ring-mk-coral')} />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-mk-dim">Unggah foto di menu Foto.</p>
              )}
            </div>
          ) : (
            <Field key={f.key} label={f.label} hint={f.hint}>
              {f.multiline ? (
                <textarea rows={2} className="mk-input resize-none py-2 text-xs" value={P[f.key] ?? ''} onChange={(e) => setProp(f.key, e.target.value)} onBlur={endDrag} />
              ) : (
                <input className="mk-input py-2 text-xs" value={P[f.key] ?? ''} onChange={(e) => setProp(f.key, e.target.value)} onBlur={endDrag} />
              )}
            </Field>
          )
        )}
      </Section>
      <Section title="Warna komponen">
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Utama" value={layer.colors.primary} onChange={(c) => up(layer.id, { colors: { ...layer.colors, primary: c } })} swatches={sw.slice(0, 4)} />
          <ColorField label="Kedua" value={layer.colors.secondary} onChange={(c) => up(layer.id, { colors: { ...layer.colors, secondary: c } })} swatches={sw.slice(0, 4)} />
          <ColorField label="Teks" value={layer.colors.text} onChange={(c) => up(layer.id, { colors: { ...layer.colors, text: c } })} swatches={['#FFFFFF', '#111111']} />
          <ColorField label="Permukaan" value={layer.colors.surface} onChange={(c) => up(layer.id, { colors: { ...layer.colors, surface: c } })} swatches={[doc.theme.palette.surface, '#FFFFFF', '#111111']} />
        </div>
      </Section>
    </>
  );
}

function IconProps({ layer, onOpenTool }: { layer: IconLayer; onOpenTool: (t: Tool) => void }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const sw = useSwatches();
  const ic = getIcon(layer.iconId);
  return (
    <Section title="Ikon">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mk-ink p-2.5" style={{ color: layer.color }} dangerouslySetInnerHTML={{ __html: ic ? iconSvgMarkup(ic, 'currentColor') : '' }} />
        <button type="button" className="mk-btn-ghost flex-1 text-xs" onClick={() => onOpenTool('ikon')}>
          Ganti ikon
        </button>
      </div>
      <ColorField label="Warna ikon" value={layer.color} onChange={(c) => up(layer.id, { color: c })} swatches={sw} />
      <Slider label="Tebal garis" value={layer.strokeWidth} min={0.8} max={4} step={0.1} onChange={(v) => up(layer.id, { strokeWidth: v }, true)} onCommit={endDrag} />
      <Segmented
        size="sm"
        value={layer.bg?.shape || 'none'}
        onChange={(v) => up(layer.id, { bg: v === 'none' ? null : { shape: v as 'circle', color: layer.bg?.color || sw[1] } })}
        options={[
          { value: 'none', label: 'Polos' },
          { value: 'circle', label: 'Bulat' },
          { value: 'squircle', label: 'Kotak' },
        ]}
      />
      {layer.bg && <ColorField label="Warna latar ikon" value={layer.bg.color} onChange={(c) => up(layer.id, { bg: { ...layer.bg!, color: c } })} swatches={sw} />}
    </Section>
  );
}

function ImageProps({ layer }: { layer: ImageLayer }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const doc = useStudio((s) => s.doc!);
  const assets = Object.keys(doc.assets);
  return (
    <Section title="Foto">
      {assets.length > 0 && (
        <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
          {assets.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={id} src={doc.assets[id]} alt="" onClick={() => up(layer.id, { src: id })} className={cx('h-12 w-12 shrink-0 cursor-pointer rounded-lg object-cover', layer.src === id && 'ring-2 ring-mk-coral')} />
          ))}
        </div>
      )}
      <Segmented size="sm" value={layer.mask || 'none'} onChange={(v) => up(layer.id, { mask: v })} options={[{ value: 'none', label: 'Kotak' }, { value: 'circle', label: 'Bulat' }, { value: 'arch', label: 'Lengkung' }]} />
      <Segmented size="sm" value={layer.fit} onChange={(v) => up(layer.id, { fit: v })} options={[{ value: 'cover', label: 'Isi penuh' }, { value: 'contain', label: 'Utuh' }]} />
      <Slider label="Sudut membulat" value={layer.radius} min={0} max={300} onChange={(v) => up(layer.id, { radius: v }, true)} onCommit={endDrag} />
      <Slider label="Bingkai" value={layer.border?.width || 0} min={0} max={30} onChange={(v) => up(layer.id, { border: v ? { color: layer.border?.color || '#FFFFFF', width: v } : null }, true)} onCommit={endDrag} />
      {layer.border && <ColorField label="Warna bingkai" value={layer.border.color} onChange={(c) => up(layer.id, { border: { ...layer.border!, color: c } })} swatches={['#FFFFFF', '#111111', doc.theme.palette.primary]} />}
    </Section>
  );
}

function ShapeProps({ layer }: { layer: ShapeLayer }) {
  const up = useStudio((s) => s.updateLayer);
  const endDrag = useStudio((s) => s.endDrag);
  const sw = useSwatches();
  return (
    <Section title="Bentuk">
      <div className="grid grid-cols-4 gap-1">
        {(['rect', 'circle', 'triangle', 'star', 'blob', 'arrow', 'line'] as const).map((sh) => (
          <button key={sh} type="button" onClick={() => up(layer.id, { shape: sh })} className={cx('rounded-lg border px-1 py-1.5 text-[10px] font-bold capitalize', layer.shape === sh ? 'border-mk-coral bg-mk-coral/15' : 'border-mk-line bg-mk-panel-2 text-mk-muted')}>
            {sh}
          </button>
        ))}
      </div>
      <ColorField label="Isi" value={layer.fill.startsWith('#') ? layer.fill : '#FFFFFF'} onChange={(c) => up(layer.id, { fill: c })} swatches={sw} />
      {layer.shape === 'rect' && <Slider label="Sudut" value={layer.radius} min={0} max={400} onChange={(v) => up(layer.id, { radius: v }, true)} onCommit={endDrag} />}
      <Slider label="Garis tepi" value={layer.stroke?.width || 0} min={0} max={20} onChange={(v) => up(layer.id, { stroke: v ? { color: layer.stroke?.color || '#111111', width: v } : null }, true)} onCommit={endDrag} />
    </Section>
  );
}

function SceneInspector({ onOpenTool }: { onOpenTool: (t: Tool) => void }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const st = useStudio.getState();
  const scene = doc.scenes[sceneIdx];
  return (
    <div>
      <Section title={`Scene ${sceneIdx + 1} dari ${doc.scenes.length}`}>
        <Field label="Nama scene">
          <input className="mk-input py-2 text-xs" value={scene.name} onChange={(e) => st.live((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i === sceneIdx ? { ...s, name: e.target.value } : s)) }))} onBlur={st.endDrag} />
        </Field>
        <Slider label="Durasi" value={scene.duration} min={1} max={15} step={0.1} onChange={(v) => st.live((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i === sceneIdx ? { ...s, duration: v } : s)) }))} onCommit={st.endDrag} format={(v) => `${v.toFixed(1)} dtk`} />
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => onOpenTool('latar')}>
            <Palette className="h-3.5 w-3.5" /> Latar
          </button>
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => onOpenTool('transisi')} disabled={sceneIdx === 0}>
            <Shuffle className="h-3.5 w-3.5" /> {sceneIdx === 0 ? 'Scene pertama' : getTransition(scene.transition.id).name.split(' · ')[0]}
          </button>
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => st.duplicateScene(sceneIdx)}>
            Duplikat scene
          </button>
          <button type="button" className="mk-btn-ghost text-[11px] hover:!text-red-300" onClick={() => st.removeScene(sceneIdx)} disabled={doc.scenes.length <= 1}>
            Hapus scene
          </button>
        </div>
      </Section>
      <Section title="Pengaturan video">
        <label className="flex items-center gap-2 text-xs text-mk-muted">
          <input type="checkbox" className="accent-[#FF6A3D]" checked={doc.showProgress} onChange={(e) => st.commit((d) => ({ ...d, showProgress: e.target.checked }))} /> Tampilkan progress bar
        </label>
        <Field label="Watermark (opsional)">
          <input className="mk-input py-2 text-xs" placeholder="@akunkamu" value={doc.watermark || ''} onChange={(e) => st.live((d) => ({ ...d, watermark: e.target.value }))} onBlur={st.endDrag} />
        </Field>
      </Section>
      <Section>
        <p className="text-[11px] leading-relaxed text-mk-dim">
          Tips: ketuk elemen di kanvas untuk memilih, seret untuk memindah, tarik titik sudut untuk mengubah ukuran. Ketuk dua kali pada teks untuk mengetik langsung.
        </p>
      </Section>
    </div>
  );
}

export function LayersPanel() {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layerId = useStudio((s) => s.layerId);
  const st = useStudio.getState();
  const layers = [...doc.scenes[sceneIdx].layers].reverse();
  return (
    <div className="p-3">
      {!layers.length && <p className="p-4 text-center text-xs text-mk-dim">Scene ini belum punya elemen.</p>}
      <div className="space-y-1">
        {layers.map((l) => (
          <div key={l.id} onClick={() => st.selectLayer(l.id)} className={cx('flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2', layerId === l.id ? 'border-mk-coral/70 bg-mk-coral/10' : 'border-transparent hover:bg-mk-panel-2')}>
            <span className="w-14 shrink-0 rounded bg-mk-panel-3 px-1 py-0.5 text-center text-[9px] font-bold uppercase text-mk-muted">{l.kind}</span>
            <span className={cx('min-w-0 flex-1 truncate text-xs font-semibold', l.hidden && 'opacity-40')}>{l.kind === 'text' ? l.text : l.name}</span>
            <button type="button" className="mk-btn-icon h-7 w-7" onClick={(e) => (e.stopPropagation(), st.updateLayer(l.id, { hidden: !l.hidden }))} title="Sembunyikan">
              {l.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button type="button" className="mk-btn-icon h-7 w-7" onClick={(e) => (e.stopPropagation(), st.updateLayer(l.id, { locked: !l.locked }))} title="Kunci">
              {l.locked ? <Lock className="h-3.5 w-3.5 text-mk-amber" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
