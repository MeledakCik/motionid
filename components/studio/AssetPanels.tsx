'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, Trash2, Upload } from 'lucide-react';
import type { FontId, ProjectDoc, TextLayer } from '@/lib/studio/types';
import { canvasSize, uid } from '@/lib/studio/types';
import { useStudio } from '@/store/useStudio';
import { allComponents, COMPONENT_GROUPS, COMPONENT_STYLES, getComponent } from '@/lib/studio/packs/components';
import { allIcons, ICON_GROUP_LIST, iconSvgMarkup } from '@/lib/studio/packs/icons';
import { getLayout, getTemplate, LAYOUTS, rankTemplates, THEMES, TEMPLATES } from '@/lib/studio/packs/templates';
import { applyTemplate, makeComponent, makeIcon, makeImage, makeText, recolorDoc, themeOf } from '@/lib/studio/builder';
import { MUSIC_TRACKS } from '@/lib/studio/music';
import { compressImage } from '@/lib/studio/persist';
import { FONT_LIST, fontLabel, fontStack } from '@/lib/studio/fonts';
import { ChipRow, ColorField, cx, LazyVisible, SearchBox, Section, Segmented, Slider } from './ui';
import { ComponentThumb, TemplateThumb } from './Thumbs';

const PAGE = 24;

function useDocBase() {
  const doc = useStudio((s) => s.doc)!;
  return { doc, ...canvasSize(doc.aspect) };
}

function MoreButton({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <button type="button" onClick={onMore} className="mk-btn-ghost mt-3 w-full text-xs">
      Tampilkan lagi ({total - shown} tersisa)
    </button>
  );
}

/* ------------------------------ Template ------------------------------ */
export function TemplatePanel() {
  const { doc } = useDocBase();
  const commit = useStudio((s) => s.commit);
  const [tab, setTab] = useState<'cocok' | 'semua'>('cocok');
  const [layout, setLayout] = useState('all');
  const [theme, setTheme] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const [confirm, setConfirm] = useState<string | null>(null);
  const ranked = useMemo(
    () => rankTemplates({ intent: doc.plan.intent, mood: doc.plan.mood, keywords: doc.plan.keywords, hasPhotos: Object.keys(doc.assets).length > 0 }, 18),
    [doc.plan, doc.assets]
  );
  const list = tab === 'cocok' ? ranked : TEMPLATES.filter((t) => (layout === 'all' || t.layoutId === layout) && (theme === 'all' || t.themeId === theme));
  const apply = (id: string) => {
    commit((d) => applyTemplate(d, id));
    setConfirm(null);
  };
  return (
    <div>
      <Section>
        <Segmented value={tab} onChange={(v) => (setTab(v), setLimit(PAGE))} options={[{ value: 'cocok', label: '✨ Cocok untuk prompt' }, { value: 'semua', label: `Semua (${TEMPLATES.length})` }]} />
        {tab === 'semua' && (
          <div className="space-y-2">
            <ChipRow value={layout} onChange={(v) => (setLayout(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua layout' }, ...LAYOUTS.map((l) => ({ id: l.id, label: l.name }))]} />
            <ChipRow value={theme} onChange={(v) => (setTheme(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua warna' }, ...THEMES.map((t) => ({ id: t.id, label: t.name }))]} />
          </div>
        )}
        <p className="text-[11px] text-mk-dim">Ganti template = susunan & warna baru, teks dan fotomu tetap dipakai.</p>
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-3">
        {list.slice(0, limit).map((t) => {
          const active = doc.templateId === t.id;
          const L = getLayout(t.layoutId);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => (active ? null : setConfirm(t.id))}
              className={cx('group relative overflow-hidden rounded-xl border text-left transition', active ? 'border-mk-coral ring-2 ring-mk-coral/40' : 'border-mk-line hover:border-mk-line-2')}
              title={`${t.name} — ${L.desc}`}
            >
              <LazyVisible minH={120} className="aspect-[9/14] bg-mk-ink">
                <TemplateThumb plan={doc.plan} templateId={t.id} aspect={doc.aspect} assets={doc.assets} />
              </LazyVisible>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1.5 pt-5">
                <div className="truncate text-[10px] font-bold">{t.name}</div>
              </div>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mk-coral text-mk-ink">
                  <Check className="h-3 w-3" />
                </span>
              )}
              {confirm === t.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/80 p-2 text-center">
                  <span className="text-[10px] font-semibold">Terapkan? Posisi elemen akan disusun ulang.</span>
                  <span className="flex gap-1">
                    <span role="button" tabIndex={0} onClick={(e) => (e.stopPropagation(), apply(t.id))} className="rounded-lg bg-mk-coral px-2 py-1 text-[10px] font-bold text-mk-ink">
                      Ya
                    </span>
                    <span role="button" tabIndex={0} onClick={(e) => (e.stopPropagation(), setConfirm(null))} className="rounded-lg bg-mk-panel-3 px-2 py-1 text-[10px] font-bold">
                      Batal
                    </span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-4">
        <MoreButton shown={Math.min(limit, list.length)} total={list.length} onMore={() => setLimit((l) => l + PAGE)} />
      </div>
    </div>
  );
}

/* -------------------------------- Teks -------------------------------- */
const TEXT_PRESETS: Array<{ id: string; label: string; make: (doc: ProjectDoc, W: number, H: number) => Partial<TextLayer> & { text: string; h: number } }> = [
  { id: 'judul', label: 'Judul Besar', make: (d) => ({ text: 'Judul Menarik', size: 120, weight: 800, font: d.theme.headingFont, h: 300 }) },
  { id: 'sub', label: 'Sub Judul', make: (d) => ({ text: 'Sub judul singkat', size: 64, weight: 700, font: d.theme.headingFont, h: 160 }) },
  { id: 'body', label: 'Teks Isi', make: (d) => ({ text: 'Tulis penjelasan di sini', size: 44, weight: 500, font: d.theme.bodyFont, color: d.theme.palette.muted, h: 140, lineHeight: 1.3 }) },
  { id: 'sorot', label: 'Teks Disorot', make: (d) => ({ text: 'DISKON 50%', size: 96, weight: 900, font: d.theme.headingFont, highlight: { color: d.theme.palette.primary, padding: 18, radius: 10 }, color: '#111111', uppercase: true, h: 180 }) },
  { id: 'outline', label: 'Teks Outline', make: (d) => ({ text: 'WAJIB COBA', size: 110, weight: 900, font: 'Anton', color: '#FFFFFF', stroke: { color: d.theme.palette.primary, width: 6 }, h: 200 }) },
  { id: 'subtitle', label: 'Subtitle TikTok', make: () => ({ text: 'Ini rahasianya…', size: 72, weight: 900, font: 'Montserrat', color: '#FFFFFF', stroke: { color: '#000000', width: 7 }, h: 160 }) },
  { id: 'serif', label: 'Kutipan Elegan', make: () => ({ text: '“Pelan-pelan saja, yang penting tidak berhenti.”', size: 76, weight: 600, font: 'Playfair Display', italic: true, h: 360, lineHeight: 1.25 }) },
  { id: 'neon', label: 'Neon Glow', make: (d) => ({ text: 'MALAM INI', size: 120, weight: 400, font: 'Bebas Neue', color: '#FFFFFF', shadow: { color: d.theme.palette.primary, blur: 30, x: 0, y: 0 }, h: 200 }) },
];

export function TextPanel() {
  const { doc, w: W, h: H } = useDocBase();
  const addLayer = useStudio((s) => s.addLayer);
  return (
    <div>
      <Section title="Tambah teks">
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((p) => {
            const o = p.make(doc, W, H);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const cw = W * 0.84;
                  const layer = makeText({ theme: doc.theme }, o.text, (W - cw) / 2, H / 2 - o.h / 2, cw, o.h, { ...o, name: p.label, animIn: { id: 'teks-word-naik-normal', duration: 1, delay: 0.1 } });
                  addLayer(layer);
                }}
                className="mk-card-2 flex h-16 items-center justify-center overflow-hidden px-2 text-center transition hover:border-mk-coral/60"
              >
                <span
                  className="truncate"
                  style={{
                    fontFamily: fontStack((o.font as FontId) || doc.theme.headingFont),
                    fontWeight: o.weight,
                    fontStyle: o.italic ? 'italic' : undefined,
                    fontSize: p.id === 'body' ? 12 : 15,
                    background: o.highlight ? o.highlight.color : undefined,
                    color: o.highlight ? '#111' : undefined,
                    padding: o.highlight ? '0 6px' : undefined,
                    WebkitTextStroke: o.stroke ? `0.6px ${o.stroke.color}` : undefined,
                    textShadow: o.shadow ? `0 0 10px ${o.shadow.color}` : undefined,
                  }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Font proyek">
        <FontThemePicker />
      </Section>
    </div>
  );
}

function FontThemePicker() {
  const doc = useStudio((s) => s.doc)!;
  const commit = useStudio((s) => s.commit);
  const setFont = (role: 'headingFont' | 'bodyFont', f: FontId) =>
    commit((d) => ({
      ...d,
      theme: { ...d.theme, [role]: f },
      scenes: d.scenes.map((s) => ({ ...s, layers: s.layers.map((l) => (l.kind === 'text' && l.font === d.theme[role] ? { ...l, font: f } : l)) })),
    }));
  return (
    <div className="space-y-2">
      {(['headingFont', 'bodyFont'] as const).map((role) => (
        <div key={role}>
          <span className="mb-1 block text-[11px] font-semibold text-mk-muted">{role === 'headingFont' ? 'Judul' : 'Isi'}</span>
          <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
            {FONT_LIST.map((f) => (
              <button key={f} type="button" onClick={() => setFont(role, f)} className={cx('mk-chip shrink-0', doc.theme[role] === f && 'mk-chip-on')} style={{ fontFamily: fontStack(f) }}>
                {fontLabel(f)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Komponen ------------------------------ */
export function ElementsPanel() {
  const { doc, w: W, h: H } = useDocBase();
  const addLayer = useStudio((s) => s.addLayer);
  const [group, setGroup] = useState('all');
  const [style, setStyle] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const p = doc.theme.palette;
  const colors = useMemo(() => ({ primary: p.primary, secondary: p.secondary, text: p.text, surface: p.surface }), [p]);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return allComponents().filter(
      (c) => (group === 'all' || c.group === group) && (style === 'all' || c.styleId === style) && (!qq || c.name.toLowerCase().includes(qq) || c.tags.some((t) => t.includes(qq)))
    );
  }, [group, style, q]);
  const add = (id: string) => {
    const def = getComponent(id)!;
    const maxW = W * 0.84;
    const s = Math.min(1, maxW / def.size.w, (H * 0.6) / def.size.h);
    const w = def.size.w * s;
    const h = def.size.h * s;
    addLayer(makeComponent({ theme: doc.theme }, id, (W - w) / 2, (H - h) / 2, w, h, {}, { animIn: { id: 'pop-kecil-membal', duration: 0.55, delay: 0.1 } }));
  };
  return (
    <div>
      <Section>
        <SearchBox value={q} onChange={(v) => (setQ(v), setLimit(PAGE))} placeholder={`Cari ${allComponents().length} komponen… (harga, tombol, chat)`} />
        <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua' }, ...COMPONENT_GROUPS]} />
        <ChipRow value={style} onChange={(v) => (setStyle(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua gaya' }, ...COMPONENT_STYLES]} />
      </Section>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-2">
        {list.slice(0, limit).map((c) => (
          <button key={c.id} type="button" onClick={() => add(c.id)} className="mk-card-2 group overflow-hidden text-left transition hover:border-mk-coral/60" title={c.name}>
            <LazyVisible minH={90} className="aspect-[20/13] bg-[radial-gradient(circle_at_30%_20%,#3a2a24,#120e0c)]">
              <ComponentThumb id={c.id} colors={colors} heading={doc.theme.headingFont} body={doc.theme.bodyFont} />
            </LazyVisible>
            <div className="truncate px-2 py-1.5 text-[10px] font-semibold text-mk-muted group-hover:text-mk-cream">
              {c.name}
              {c.author === 'admin' && <span className="ml-1 rounded bg-mk-coral/20 px-1 text-mk-coral">baru</span>}
            </div>
          </button>
        ))}
      </div>
      {!list.length && <p className="px-4 pb-6 text-center text-xs text-mk-dim">Tidak ada komponen yang cocok.</p>}
      <div className="px-3 pb-4">
        <MoreButton shown={Math.min(limit, list.length)} total={list.length} onMore={() => setLimit((l) => l + PAGE)} />
      </div>
    </div>
  );
}

/* -------------------------------- Ikon -------------------------------- */
export function IconsPanel({ onPick }: { onPick?: (id: string) => void }) {
  const { doc, w: W, h: H } = useDocBase();
  const addLayer = useStudio((s) => s.addLayer);
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(60);
  const [withBg, setWithBg] = useState(true);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return allIcons().filter((i) => (group === 'all' || i.group === group) && (!qq || i.id.includes(qq) || i.tags.some((t) => t.includes(qq))));
  }, [group, q]);
  const p = doc.theme.palette;
  const add = (id: string) => {
    if (onPick) return onPick(id);
    const s = Math.round(Math.min(W, H) * 0.2);
    addLayer(makeIcon({ theme: doc.theme }, id, (W - s) / 2, (H - s) / 2, s, withBg ? { animIn: { id: 'pop-kecil-membal', duration: 0.55, delay: 0.1 } } : { bg: null, color: p.primary, animIn: { id: 'pop-kecil-membal', duration: 0.55, delay: 0.1 } }));
  };
  return (
    <div>
      <Section>
        <SearchBox value={q} onChange={(v) => (setQ(v), setLimit(60))} placeholder={`Cari ${allIcons().length} ikon… (kopi, diskon, kirim)`} />
        <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(60))} options={[{ id: 'all', label: 'Semua' }, ...ICON_GROUP_LIST.map((g) => ({ id: g.id, label: g.label }))]} />
        {!onPick && (
          <label className="flex items-center gap-2 text-xs text-mk-muted">
            <input type="checkbox" checked={withBg} onChange={(e) => setWithBg(e.target.checked)} className="accent-[#FF6A3D]" />
            Pakai latar bulat warna tema
          </label>
        )}
      </Section>
      <div className="grid grid-cols-6 gap-1.5 p-3 sm:grid-cols-8 lg:grid-cols-6">
        {list.slice(0, limit).map((ic) => (
          <button
            key={ic.id}
            type="button"
            onClick={() => add(ic.id)}
            title={ic.name}
            className="flex aspect-square items-center justify-center rounded-xl border border-mk-line bg-mk-panel-2 p-2.5 text-mk-cream transition hover:border-mk-coral/60 hover:text-mk-coral"
            dangerouslySetInnerHTML={{ __html: iconSvgMarkup(ic, 'currentColor', 1.8) }}
          />
        ))}
      </div>
      <div className="px-3 pb-4">
        <MoreButton shown={Math.min(limit, list.length)} total={list.length} onMore={() => setLimit((l) => l + 90)} />
      </div>
    </div>
  );
}

/* ------------------------------ Foto / Media ------------------------------ */
export function MediaPanel() {
  const { doc, w: W, h: H } = useDocBase();
  const commit = useStudio((s) => s.commit);
  const addLayer = useStudio((s) => s.addLayer);
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const updateScene = useStudio((s) => s.updateScene);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const ids = Object.keys(doc.assets);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const add: Record<string, string> = {};
    for (const f of Array.from(files).slice(0, 12)) {
      if (!f.type.startsWith('image/')) continue;
      try {
        add[uid('img')] = await compressImage(f);
      } catch {
        // lewati file rusak
      }
    }
    commit((d) => ({ ...d, assets: { ...d.assets, ...add } }));
    setBusy(false);
  };

  return (
    <div>
      <Section title="Foto kamu">
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-mk-line-2 bg-mk-ink px-4 py-5 text-center transition hover:border-mk-coral/70">
          <Upload className="h-5 w-5 text-mk-coral" />
          <span className="text-sm font-bold">{busy ? 'Memproses foto…' : 'Unggah foto produk / latar'}</span>
          <span className="text-[11px] text-mk-dim">JPG/PNG, otomatis dikompres agar ringan</span>
        </button>
      </Section>
      {ids.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-3">
          {ids.map((id) => (
            <div key={id} className="mk-card-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.assets[id]} alt="" className="aspect-square w-full object-cover" />
              <div className="grid grid-cols-3 gap-1 p-1.5">
                <button type="button" title="Jadikan latar scene ini" onClick={() => updateScene(sceneIdx, { background: { type: 'image', color: doc.theme.palette.bg, src: id, fit: 'cover', dim: 0.45, kenBurns: true } })} className="rounded-lg bg-mk-panel-3 py-1 text-[10px] font-bold hover:bg-mk-coral hover:text-mk-ink">
                  Latar
                </button>
                <button
                  type="button"
                  title="Tambah sebagai elemen foto"
                  onClick={() => {
                    const w = W * 0.7;
                    const h = Math.min(H * 0.45, w * 1.1);
                    addLayer(makeImage(id, (W - w) / 2, (H - h) / 2, w, h, { border: { color: '#FFFFFF', width: 8 }, animIn: { id: 'pop-sedang-membal', duration: 0.55, delay: 0.1 }, shadow: { color: 'rgba(0,0,0,0.45)', blur: 40, x: 0, y: 20 } }));
                  }}
                  className="rounded-lg bg-mk-panel-3 py-1 text-[10px] font-bold hover:bg-mk-coral hover:text-mk-ink"
                >
                  <ImagePlus className="mx-auto h-3.5 w-3.5" />
                </button>
                <button type="button" title="Hapus foto" onClick={() => commit((d) => { const a = { ...d.assets }; delete a[id]; return { ...d, assets: a }; })} className="rounded-lg bg-mk-panel-3 py-1 text-[10px] hover:bg-red-500/80">
                  <Trash2 className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {ids.length > 0 && (
        <Section>
          <button type="button" className="mk-btn-ghost w-full text-xs" onClick={() => commit((d) => applyTemplate(d, d.templateId))}>
            Susun ulang semua scene memakai foto ini
          </button>
        </Section>
      )}
    </div>
  );
}

/* -------------------------------- Latar -------------------------------- */
const PATTERNS = ['none', 'dots', 'grid', 'rays', 'blobs', 'stripes', 'waves', 'halftone', 'bokeh', 'noise'] as const;
const PATTERN_LABEL: Record<string, string> = { none: 'Polos', dots: 'Titik', grid: 'Grid', rays: 'Sinar', blobs: 'Blob', stripes: 'Garis', waves: 'Ombak', halftone: 'Halftone', bokeh: 'Bokeh', noise: 'Film' };

export function BackgroundPanel() {
  const { doc } = useDocBase();
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const updateScene = useStudio((s) => s.updateScene);
  const commit = useStudio((s) => s.commit);
  const scene = doc.scenes[sceneIdx];
  const bg = scene.background;
  const p = doc.theme.palette;
  const sw = [p.bg, p.bg2, p.primary, p.secondary, p.surface, '#000000', '#FFFFFF'];
  const set = (patch: Partial<typeof bg>) => updateScene(sceneIdx, { background: { ...bg, ...patch } });
  return (
    <div>
      <Section title={`Latar scene ${sceneIdx + 1}`}>
        <Segmented
          value={bg.type}
          onChange={(v) => set(v === 'image' ? { type: 'image', src: bg.src || Object.keys(doc.assets)[0] } : { type: v, colors: bg.colors?.length ? bg.colors : [p.bg, p.bg2] })}
          options={[
            { value: 'solid', label: 'Polos' },
            { value: 'gradient', label: 'Gradien' },
            { value: 'image', label: 'Foto' },
          ]}
        />
        {bg.type === 'solid' && <ColorField label="Warna" value={bg.color} onChange={(c) => set({ color: c })} swatches={sw} />}
        {bg.type === 'gradient' && (
          <>
            <ColorField label="Warna 1" value={bg.colors?.[0] || p.bg} onChange={(c) => set({ colors: [c, ...(bg.colors || [p.bg2]).slice(1)] })} swatches={sw} />
            <ColorField label="Warna 2" value={bg.colors?.[1] || p.bg2} onChange={(c) => set({ colors: [(bg.colors || [p.bg])[0], c, ...(bg.colors || []).slice(2)] })} swatches={sw} />
            <Slider label="Sudut" value={bg.angle ?? 160} min={0} max={360} onChange={(v) => set({ angle: v })} format={(v) => `${v}°`} />
          </>
        )}
        {bg.type === 'image' && (
          <>
            {Object.keys(doc.assets).length === 0 ? (
              <p className="text-xs text-mk-dim">Unggah foto dulu di menu Foto.</p>
            ) : (
              <div className="mk-noscroll flex gap-1.5 overflow-x-auto">
                {Object.keys(doc.assets).map((id) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={id} src={doc.assets[id]} alt="" onClick={() => set({ src: id })} className={cx('h-14 w-14 shrink-0 cursor-pointer rounded-lg object-cover', bg.src === id && 'ring-2 ring-mk-coral')} />
                ))}
              </div>
            )}
            <Slider label="Gelapkan" value={bg.dim ?? 0.4} min={0} max={0.9} step={0.05} onChange={(v) => set({ dim: v })} format={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="Blur" value={bg.blur ?? 0} min={0} max={30} onChange={(v) => set({ blur: v })} />
            <label className="flex items-center gap-2 text-xs text-mk-muted">
              <input type="checkbox" checked={!!bg.kenBurns} onChange={(e) => set({ kenBurns: e.target.checked })} className="accent-[#FF6A3D]" /> Zoom pelan (Ken Burns)
            </label>
          </>
        )}
      </Section>
      <Section title="Pola animasi">
        <div className="grid grid-cols-5 gap-1.5">
          {PATTERNS.map((pt) => (
            <button key={pt} type="button" onClick={() => set({ pattern: pt, patternColor: bg.patternColor || p.primary, patternOpacity: bg.patternOpacity ?? 0.14 })} className={cx('rounded-lg border px-1 py-2 text-[10px] font-bold', (bg.pattern || 'none') === pt ? 'border-mk-coral bg-mk-coral/15' : 'border-mk-line bg-mk-panel-2 text-mk-muted')}>
              {PATTERN_LABEL[pt]}
            </button>
          ))}
        </div>
        {bg.pattern && bg.pattern !== 'none' && <Slider label="Kekuatan pola" value={bg.patternOpacity ?? 0.14} min={0.03} max={0.5} step={0.01} onChange={(v) => set({ patternOpacity: v })} format={(v) => `${Math.round(v * 100)}%`} />}
        <button type="button" className="mk-btn-ghost w-full text-xs" onClick={() => commit((d) => ({ ...d, scenes: d.scenes.map((s) => ({ ...s, background: { ...bg } })) }))}>
          Terapkan latar ini ke semua scene
        </button>
      </Section>
      <Section title="Warna tema (seluruh video)">
        <div className="grid grid-cols-6 gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.name}
              onClick={() => commit((d) => recolorDoc(d, themeOf(t)))}
              className={cx('overflow-hidden rounded-lg border-2', doc.theme.palette.primary === t.palette.primary && doc.theme.palette.bg === t.palette.bg ? 'border-mk-cream' : 'border-transparent')}
            >
              <div className="flex h-7">
                <span className="flex-1" style={{ background: t.palette.bg }} />
                <span className="flex-1" style={{ background: t.palette.primary }} />
                <span className="flex-1" style={{ background: t.palette.secondary }} />
              </div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-mk-dim">Semua teks, ikon & komponen ikut berganti warna.</p>
      </Section>
    </div>
  );
}

/* -------------------------------- Musik -------------------------------- */
export function MusicPanel() {
  const { doc } = useDocBase();
  const commit = useStudio((s) => s.commit);
  const live = useStudio((s) => s.live);
  const endDrag = useStudio((s) => s.endDrag);
  return (
    <div>
      <Section title="Musik latar (bebas royalti, dibuat otomatis)">
        <div className="space-y-1.5">
          {MUSIC_TRACKS.map((t) => (
            <button key={t.id} type="button" onClick={() => commit((d) => ({ ...d, music: { ...d.music, id: t.id } }))} className={cx('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left', doc.music.id === t.id ? 'border-mk-coral bg-mk-coral/10' : 'border-mk-line bg-mk-panel-2')}>
              <span>
                <span className="block text-sm font-bold">{t.name}</span>
                <span className="text-[11px] text-mk-dim">{t.mood}{t.bpm ? ` · ${t.bpm} BPM` : ''}</span>
              </span>
              {doc.music.id === t.id && <Check className="h-4 w-4 text-mk-coral" />}
            </button>
          ))}
        </div>
        <Slider label="Volume" value={doc.music.volume} min={0} max={1} step={0.05} onChange={(v) => live((d) => ({ ...d, music: { ...d.music, volume: v } }))} onCommit={endDrag} format={(v) => `${Math.round(v * 100)}%`} />
        <p className="text-[11px] text-mk-dim">Tekan ▶ untuk mendengar. Musik ikut masuk ke file MP4.</p>
      </Section>
    </div>
  );
}

export { getTemplate };
