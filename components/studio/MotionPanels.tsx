'use client';

import React, { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { useStudio, currentLayer } from '@/store/useStudio';
import { allTransitions, getTransition, hasTransition, TRANSITION_FX, TRANSITION_GROUPS } from '@/lib/studio/packs/transitions';
import { allAnimations, ANIM_GROUPS, getAnimation } from '@/lib/studio/packs/animations';
import { installMotionPresets } from '@/lib/studio/packs/motion-presets';
import { sceneStarts } from '@/lib/studio/renderer';
import type { PlaybackClock } from '@/lib/studio/clock';
import { ChipRow, cx, LazyVisible, SearchBox, Section, Segmented, Slider } from './ui';
import { AnimationThumb, EffectThumb, TransitionThumb } from './Thumbs';
import { allEffects, EFFECT_GROUPS, EFFECT_PALETTES, effectId, effectKinds, getEffect, INTENSITY_LEVELS, splitEffectId } from '@/lib/studio/packs/effects';

const PAGE = 30;

installMotionPresets();

const KIND_LABEL: Record<string, string> = {
  cut: 'Potong',
  fade: 'Pudar',
  blur: 'Larut Blur',
  slide: 'Tutup Geser',
  push: 'Dorong',
  card: 'Tumpuk Kartu',
  whip: 'Whip Pan',
  wipe: 'Sapu',
  colorwipe: 'Sapu Warna',
  iris: 'Iris Lingkaran',
  clock: 'Jarum Jam',
  shape: 'Bentuk',
  burst: 'Sinar Burst',
  ink: 'Tinta',
  zoom: 'Zoom',
  dolly: 'Dolly Kamera',
  shake: 'Guncang',
  blinds: 'Kerai',
  grid: 'Ubin',
  stripes: 'Bilah',
  slice: 'Tebas',
  split: 'Pintu Belah',
  glitch: 'Glitch',
  flash: 'Kilatan',
  pixelate: 'Piksel',
  spin: 'Putar',
  flip: 'Balik 3D',
  cube: 'Kubus 3D',
  shatter: 'Kaca Pecah',
  sand: 'Jadi Pasir',
  wave: 'Gelombang',
  zigzag: 'Gerigi',
  dots: 'Titik Halftone',
  rings: 'Cincin',
  fan: 'Kipas',
  pie: 'Potongan Pie',
  checker: 'Papan Catur',
  carousel: 'Karusel',
  tilt: 'Geser Miring',
  stretch: 'Regang',
  colorbars: 'Balok Warna',
  scan: 'Pindai Cahaya',
  diagblinds: 'Kerai Miring',
  filmroll: 'Gulungan Film',
  swing: 'Ayun Pintu',
  curtain: 'Tirai Panggung',
  spotlight: 'Lampu Sorot',
  flytiles: 'Ubin Terbang',
  tear: 'Sobek Kertas',
  roll: 'Gulung Kertas',
  slats: 'Kerai Putar 3D',
  pagecurl: 'Lipat Sudut',
  tilesout: 'Ubin Runtuh',
  lens: 'Lensa Zoom',
  brush: 'Sapuan Kuas',
  melt: 'Leleh',
  bubbles: 'Gelembung',
  toss: 'Lempar Foto',
  custom: 'Custom',
};

export function TransitionPanel({ clock }: { clock: PlaybackClock }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const updateScene = useStudio((s) => s.updateScene);
  const commit = useStudio((s) => s.commit);
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const target = Math.max(1, sceneIdx);
  const scene = doc.scenes[target];
  const kinds = useMemo(() => {
    const m = new Map<string, ReturnType<typeof allTransitions>>();
    allTransitions().forEach((t) => {
      if (t.params.fx) return; // varian aksen dipilih lewat baris "Aksen"
      const key = t.author === 'admin' ? `custom:${t.id}` : t.kind;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(t);
    });
    return [...m.entries()].map(([key, specs]) => ({ key, label: key.startsWith('custom:') ? specs[0].name : KIND_LABEL[specs[0].kind] || specs[0].kind, group: specs[0].group, specs }));
  }, []);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return kinds.filter((k) => (group === 'all' || k.group === group) && (!qq || k.label.toLowerCase().includes(qq) || k.specs.some((t) => t.name.toLowerCase().includes(qq) || t.tags.some((g) => g.includes(qq)))));
  }, [group, q, kinds]);

  if (doc.scenes.length < 2) return <p className="p-5 text-center text-sm text-mk-dim">Tambah minimal 2 scene untuk memakai transisi.</p>;

  const preview = () => {
    clock.seek(Math.max(0, sceneStarts(doc)[target] - 0.6));
    clock.play();
  };
  const apply = (id: string) => {
    updateScene(target, { transition: { id, duration: getTransition(id).duration } });
    setTimeout(preview, 30);
  };
  const cur = getTransition(scene.transition.id);
  const curFx: string = cur.params.fx || '';
  const baseId = cur.id.split('~')[0];
  const curKind = kinds.find((k) => k.specs.some((t) => t.id === baseId));
  const withFx = (id: string) => (curFx && hasTransition(`${id}~${curFx}`) ? `${id}~${curFx}` : id);
  const fxOptions = [{ id: '', label: 'Tanpa' }, ...TRANSITION_FX].filter((f) => !f.id || hasTransition(`${baseId}~${f.id}`));
  const baseCount = kinds.reduce((a, k) => a + k.specs.length, 0);
  return (
    <div>
      <Section title={`Transisi masuk ke scene ${target + 1}`}>
        <div className="rounded-xl border border-mk-coral/40 bg-mk-ink p-3">
          <div className="flex items-center justify-between text-sm font-extrabold">
            <span>{curKind?.label || cur.name}</span>
            <button type="button" className="text-xs font-bold text-mk-coral" onClick={preview}>
              ▶ Lihat
            </button>
          </div>
          {curKind && curKind.specs.length > 1 && (
            <div className="mk-scroll -mx-1 mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto px-1">
              {curKind.specs.map((t) => (
                <button key={t.id} type="button" onClick={() => apply(withFx(t.id))} className={cx('mk-chip shrink-0 py-1', t.id === baseId && 'mk-chip-on')}>
                  {t.name.replace(new RegExp(`^${curKind.label}\\s*`, 'i'), '') || t.name}
                </button>
              ))}
            </div>
          )}
          {fxOptions.length > 1 && (
            <div className="mt-2">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-mk-dim">Aksen</div>
              <div className="flex flex-wrap gap-1.5">
                {fxOptions.map((f) => (
                  <button key={f.id || 'none'} type="button" onClick={() => apply(f.id ? `${baseId}~${f.id}` : baseId)} className={cx('mk-chip py-1', curFx === f.id && 'mk-chip-on')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Slider label="Durasi" value={scene.transition.duration} min={0.15} max={1.6} step={0.05} onChange={(v) => updateScene(target, { transition: { ...scene.transition, duration: v } })} format={(v) => `${v.toFixed(2)} dtk`} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => commit((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i > 0 ? { ...s, transition: { ...scene.transition } } : s)) }))}>
            Pakai di semua scene
          </button>
          <button
            type="button"
            className="mk-btn-ghost text-[11px]"
            onClick={() => {
              const pool = allTransitions().filter((t) => t.kind !== 'cut');
              let prev = '';
              commit((d) => ({
                ...d,
                scenes: d.scenes.map((s, i) => {
                  if (!i) return s;
                  let t = pool[Math.floor(Math.random() * pool.length)];
                  if (t.kind === prev) t = pool[(pool.indexOf(t) + 37) % pool.length];
                  prev = t.kind;
                  return { ...s, transition: { id: t.id, duration: t.duration } };
                }),
              }));
            }}
          >
            <Shuffle className="h-3.5 w-3.5" /> Acak semua
          </button>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Cari transisi… (zoom, kaca, sapu)" />
        <ChipRow value={group} onChange={setGroup} options={[{ id: 'all', label: 'Semua' }, ...TRANSITION_GROUPS.filter((g) => g.id !== 'custom')]} />
        <p className="text-[11px] text-mk-dim">{kinds.length} jenis · {baseCount} variasi · {allTransitions().length} total dengan aksen</p>
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.map((k) => {
          const on = curKind?.key === k.key;
          return (
            <button key={k.key} type="button" onClick={() => apply(withFx(k.specs[0].id))} className={cx('overflow-hidden rounded-xl border text-left transition', on ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
              <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
                <TransitionThumb spec={k.specs[0]} primary={doc.theme.palette.primary} secondary={doc.theme.palette.secondary} />
              </LazyVisible>
              <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                <span className="truncate text-[11px] font-bold text-mk-cream">{k.label}</span>
                {k.specs.length > 1 && <span className="shrink-0 text-[10px] text-mk-dim">{k.specs.length}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CURATED_IN = [
  'fade', 'geser-atas-pendek-halus', 'geser-kanan-jauh-membal', 'pop-kecil-membal', 'pop-besar-tegas', 'blur-fokus-zoom-halus',
  'wipe-left-halus', 'teks-word-naik-normal', 'teks-word-pop-normal', 'teks-ketik-normal', 'teks-sorot-normal', 'teks-decode-normal',
  'fisika-jatuh-pantul-kuat', 'fisika-elastis-kuat', 'putar-kiri-90-membal', 'flip-kartu-membal', 'gaya-tada-normal', 'gaya-glitch-masuk-cepat',
];
const CURATED_LOOP = ['loop-denyut-sedang', 'loop-melayang-sedang', 'loop-goyang-sedang', 'loop-getar-sedang', 'loop-lompat-sedang', 'loop-detak-sedang', 'loop-kedip-sedang', 'loop-putar-sedang'];

export function AnimationPanel({ clock }: { clock: PlaybackClock }) {
  const mode = useStudio((s) => s.mode);
  const [showAll, setShowAll] = useState(false);
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layer = useStudio(currentLayer);
  const updateLayer = useStudio((s) => s.updateLayer);
  const commit = useStudio((s) => s.commit);
  const [slot, setSlot] = useState<'in' | 'out' | 'loop'>('in');
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const kind = slot === 'loop' ? 'loop' : 'in';
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const base = allAnimations(kind).filter((a) => (group === 'all' || a.group === group || kind === 'loop') && (!qq || a.name.toLowerCase().includes(qq) || a.tags.some((g) => g.includes(qq))));
    if (mode === 'pro' || showAll || qq || group !== 'all') return base;
    const cur = kind === 'loop' ? CURATED_LOOP : CURATED_IN;
    return cur.map((id) => base.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a).concat(base.filter((a) => a.author === 'admin'));
  }, [group, q, kind, mode, showAll]);
  const curated = mode !== 'pro' && !showAll && !q.trim() && group === 'all';

  if (!layer)
    return (
      <div className="space-y-3 p-5 text-center">
        <p className="text-sm text-mk-muted">Pilih elemen di kanvas dulu (ketuk teks / gambar / komponen) untuk memberi animasi.</p>
        <p className="text-[11px] text-mk-dim">{allAnimations('in').length} animasi masuk/keluar + {allAnimations('loop').length} animasi loop tersedia.</p>
      </div>
    );

  const replay = () => {
    const st = sceneStarts(doc)[sceneIdx] + layer.start;
    clock.seek(Math.max(0, st - 0.05));
    clock.play();
    setTimeout(() => clock.pause(), ((layer.animIn?.delay || 0) + (layer.animIn?.duration || 1)) * 1000 + 500);
  };
  const currentId = slot === 'in' ? layer.animIn?.id : slot === 'out' ? layer.animOut?.id : layer.animLoop;
  const apply = (id: string | null) => {
    const spec = id ? getAnimation(id) : undefined;
    if (slot === 'in') updateLayer(layer.id, { animIn: spec ? { id: spec.id, duration: spec.duration, delay: layer.animIn?.delay ?? 0.1 } : null });
    else if (slot === 'out') updateLayer(layer.id, { animOut: spec ? { id: spec.id, duration: Math.min(spec.duration, 0.8) } : null, end: spec && layer.end === null ? doc.scenes[sceneIdx].duration : layer.end });
    else updateLayer(layer.id, { animLoop: id });
    if (slot !== 'out') setTimeout(replay, 30);
  };
  const ref = slot === 'in' ? layer.animIn : slot === 'out' ? layer.animOut : null;
  return (
    <div>
      <Section title={`Animasi: ${layer.name}`}>
        <Segmented value={slot} onChange={(v) => (setSlot(v), setLimit(PAGE), setGroup('all'))} options={[{ value: 'in', label: 'Saat muncul' }, { value: 'out', label: 'Saat hilang' }, { value: 'loop', label: 'Gerak terus' }]} />
        {ref && (
          <div className="grid grid-cols-2 gap-3">
            <Slider label="Durasi" value={ref.duration} min={0.1} max={3} step={0.05} onChange={(v) => updateLayer(layer.id, slot === 'in' ? { animIn: { ...ref, duration: v } } : { animOut: { ...ref, duration: v } })} format={(v) => `${v.toFixed(2)}s`} />
            {slot === 'in' && <Slider label="Mulai setelah" value={ref.delay || 0} min={0} max={3} step={0.05} onChange={(v) => updateLayer(layer.id, { animIn: { ...ref, delay: v } })} format={(v) => `${v.toFixed(2)}s`} />}
          </div>
        )}
        <div className="flex gap-1.5">
          <button type="button" className="mk-btn-ghost flex-1 text-[11px]" onClick={() => apply(null)}>
            Hapus animasi
          </button>
          <button type="button" className="mk-btn-ghost flex-1 text-[11px]" onClick={replay}>
            ▶ Putar ulang
          </button>
        </div>
        {slot === 'in' && (
          <button
            type="button"
            className="mk-btn-ghost w-full text-[11px]"
            onClick={() =>
              commit((d) => ({
                ...d,
                scenes: d.scenes.map((s, i) => (i !== sceneIdx ? s : { ...s, layers: s.layers.map((l, j) => (l.kind === layer.kind ? { ...l, animIn: layer.animIn ? { ...layer.animIn, delay: 0.1 + j * 0.15 } : null } : l)) })),
              }))
            }
          >
            Samakan ke semua {layer.kind === 'text' ? 'teks' : 'elemen sejenis'} di scene ini
          </button>
        )}
        <SearchBox value={q} onChange={(v) => (setQ(v), setLimit(PAGE))} placeholder="Cari animasi… (pop, ketik, pantul)" />
        {kind === 'in' && (mode === 'pro' || showAll) && <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua' }, ...ANIM_GROUPS.filter((g) => g.id !== 'loop')]} />}
        {curated && <p className="text-[11px] text-mk-dim">Menampilkan animasi paling sering dipakai.</p>}
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.slice(0, limit).map((a) => (
          <button key={a.id} type="button" onClick={() => apply(a.id)} className={cx('overflow-hidden rounded-xl border text-left transition', currentId === a.id ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
            <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
              <AnimationThumb spec={a} color={doc.theme.palette.primary} />
            </LazyVisible>
            <div className="truncate px-1.5 py-1 text-[11px] font-semibold text-mk-muted">{a.name}</div>
          </button>
        ))}
      </div>
      <div className="px-3 pb-4">
        {curated ? (
          <button type="button" onClick={() => setShowAll(true)} className="mk-btn-ghost w-full text-xs">
            Lihat semua {allAnimations(kind).length} animasi
          </button>
        ) : (
          limit < list.length && (
            <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mk-btn-ghost w-full text-xs">
              Tampilkan lagi ({list.length - limit})
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function EffectsPanel({ clock }: { clock: PlaybackClock }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const mode = useStudio((s) => s.mode);
  const updateScene = useStudio((s) => s.updateScene);
  const commit = useStudio((s) => s.commit);
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const scene = doc.scenes[sceneIdx];
  const active = scene.effects || [];
  const kinds = useMemo(() => effectKinds(), []);
  const custom = useMemo(() => allEffects().filter((e) => e.author === 'admin'), []);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return kinds.filter((k) => (group === 'all' || k.group === group) && (!qq || k.label.toLowerCase().includes(qq) || k.tags.some((t) => t.includes(qq)) || k.styles.some((s) => s.label.toLowerCase().includes(qq))));
  }, [group, q, kinds]);

  const play = () => {
    clock.seek(sceneStarts(doc)[sceneIdx]);
    clock.play();
  };
  const setEffects = (next: Array<{ id: string; amount?: number }>, preview = true) => {
    updateScene(sceneIdx, { effects: next.slice(-4) });
    if (preview) setTimeout(play, 30);
  };
  const kindOf = (id: string) => getEffect(id)?.kind;
  const toggleKind = (kind: string, style: string) => {
    const has = active.find((a) => kindOf(a.id) === kind);
    if (has) setEffects(active.filter((a) => a !== has), false);
    else setEffects([...active, { id: effectId(kind, style), amount: 1 }]);
  };
  const replace = (oldId: string, newId: string) => setEffects(active.map((a) => (a.id === oldId ? { ...a, id: newId } : a)));

  return (
    <div>
      <Section title={`Efek di scene ${sceneIdx + 1}`}>
        {active.length === 0 ? (
          <p className="text-xs text-mk-dim">Belum ada efek. Ketuk salah satu di bawah — videonya langsung diputar supaya kelihatan hasilnya.</p>
        ) : (
          <div className="space-y-2">
            {active.map((a) => {
              const e = getEffect(a.id);
              if (!e) return null;
              const parts = splitEffectId(a.id);
              const k = kinds.find((x) => x.kind === e.kind);
              return (
                <div key={a.id} className="rounded-xl border border-mk-coral/40 bg-mk-ink p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">{k?.label || e.name}</span>
                    <button type="button" className="text-xs font-bold text-mk-dim hover:text-red-600" onClick={() => setEffects(active.filter((x) => x !== a), false)}>
                      Hapus
                    </button>
                  </div>
                  {parts && k && (
                    <>
                      <div className="mk-scroll -mx-1 mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto px-1">
                        {k.styles.map((st) => {
                          const [base, pal] = parts.style.split('~');
                          return (
                            <button key={st.id} type="button" onClick={() => replace(a.id, effectId(parts.kind, pal && st.palettes.includes(pal) ? `${st.id}~${pal}` : st.id, parts.lvl))} className={cx('mk-chip shrink-0 py-1', base === st.id && 'mk-chip-on')}>
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2">
                        <Segmented size="sm" value={parts.lvl} onChange={(lv) => replace(a.id, effectId(parts.kind, parts.style, lv))} options={INTENSITY_LEVELS.map((l) => ({ value: l.id, label: l.label }))} />
                      </div>
                    </>
                  )}
                  {mode === 'pro' && (
                    <Slider
                      label="Kekuatan halus"
                      value={a.amount ?? 1}
                      min={0.2}
                      max={2}
                      step={0.05}
                      onChange={(v) => useStudio.getState().live((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i === sceneIdx ? { ...s, effects: (s.effects || []).map((x) => (x.id === a.id ? { ...x, amount: v } : x)) } : s)) }))}
                      onCommit={useStudio.getState().endDrag}
                      format={(v) => `${Math.round(v * 100)}%`}
                    />
                  )}
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => commit((d) => ({ ...d, scenes: d.scenes.map((s) => ({ ...s, effects: active.map((x) => ({ ...x })) })) }))}>
                Pakai di semua scene
              </button>
              <button type="button" className="mk-btn-ghost text-[11px]" onClick={play}>
                ▶ Lihat hasil
              </button>
            </div>
          </div>
        )}
        <SearchBox value={q} onChange={setQ} placeholder="Cari efek… (hujan, kaca pecah, pasir)" />
        <ChipRow value={group} onChange={setGroup} options={[{ id: 'all', label: 'Semua' }, ...EFFECT_GROUPS.filter((g) => g.id !== 'custom')]} />
        <p className="text-[11px] text-mk-dim">{kinds.length} jenis efek · tiap jenis punya banyak gaya & 3 tingkat kekuatan ({allEffects().length} kombinasi)</p>
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.map((k) => {
          const on = active.some((a) => kindOf(a.id) === k.kind);
          const spec = getEffect(effectId(k.kind, k.styles[0].id));
          if (!spec) return null;
          return (
            <button key={k.kind} type="button" onClick={() => toggleKind(k.kind, k.styles[0].id)} className={cx('relative overflow-hidden rounded-xl border text-left transition', on ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
              <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
                <EffectThumb spec={spec} primary={doc.theme.palette.primary} secondary={doc.theme.palette.secondary} />
              </LazyVisible>
              <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                <span className="truncate text-[11px] font-bold text-mk-cream">{k.label}</span>
                <span className="shrink-0 text-[10px] text-mk-dim">{k.styles.length} gaya</span>
              </div>
              {on && <span className="absolute right-1 top-1 rounded-full bg-mk-coral px-1.5 text-[10px] font-extrabold text-white">AKTIF</span>}
            </button>
          );
        })}
        {group === 'all' &&
          custom.map((e) => {
            const on = active.some((a) => a.id === e.id);
            return (
              <button key={e.id} type="button" onClick={() => setEffects(on ? active.filter((a) => a.id !== e.id) : [...active, { id: e.id, amount: 1 }], !on)} className={cx('overflow-hidden rounded-xl border text-left', on ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2')}>
                <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
                  <EffectThumb spec={e} primary={doc.theme.palette.primary} secondary={doc.theme.palette.secondary} />
                </LazyVisible>
                <div className="truncate px-1.5 py-1 text-[11px] font-bold">{e.name}</div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
