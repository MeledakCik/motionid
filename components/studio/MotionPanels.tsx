'use client';

import React, { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { useStudio, currentLayer } from '@/store/useStudio';
import { allTransitions, getTransition, TRANSITION_GROUPS } from '@/lib/studio/packs/transitions';
import { allAnimations, ANIM_GROUPS, getAnimation } from '@/lib/studio/packs/animations';
import { sceneStarts } from '@/lib/studio/renderer';
import type { PlaybackClock } from '@/lib/studio/clock';
import { ChipRow, cx, LazyVisible, SearchBox, Section, Segmented, Slider } from './ui';
import { AnimationThumb, EffectThumb, TransitionThumb } from './Thumbs';
import { allEffects, EFFECT_GROUPS, getEffect } from '@/lib/studio/packs/effects';

const PAGE = 30;

export function TransitionPanel({ clock }: { clock: PlaybackClock }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const updateScene = useStudio((s) => s.updateScene);
  const commit = useStudio((s) => s.commit);
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const target = Math.max(1, sceneIdx);
  const scene = doc.scenes[target];
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return allTransitions().filter((t) => (group === 'all' || t.group === group) && (!qq || t.name.toLowerCase().includes(qq) || t.tags.some((g) => g.includes(qq))));
  }, [group, q]);

  if (doc.scenes.length < 2) return <p className="p-5 text-center text-sm text-mk-dim">Tambah minimal 2 scene untuk memakai transisi.</p>;

  const preview = () => {
    const st = sceneStarts(doc)[target];
    clock.seek(Math.max(0, st - 0.6));
    clock.play();
  };
  const apply = (id: string) => {
    const spec = getTransition(id);
    updateScene(target, { transition: { id, duration: spec.duration } });
    setTimeout(preview, 30);
  };
  const cur = getTransition(scene.transition.id);
  return (
    <div>
      <Section title={`Transisi ke scene ${target + 1}`} right={<span className="text-[10px] text-mk-dim">{allTransitions().length} transisi</span>}>
        <div className="flex items-center justify-between rounded-xl bg-mk-ink px-3 py-2 text-xs">
          <span className="font-bold">{cur.name}</span>
          <button type="button" className="text-mk-coral" onClick={preview}>
            ▶ Lihat
          </button>
        </div>
        <Slider label="Durasi" value={scene.transition.duration} min={0.15} max={1.6} step={0.05} onChange={(v) => updateScene(target, { transition: { ...scene.transition, duration: v } })} format={(v) => `${v.toFixed(2)} dtk`} />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="mk-btn-ghost text-[11px]"
            onClick={() => commit((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i > 0 ? { ...s, transition: { ...scene.transition } } : s)) }))}
          >
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
                  if (t.id === prev) t = pool[(pool.indexOf(t) + 7) % pool.length];
                  prev = t.id;
                  return { ...s, transition: { id: t.id, duration: t.duration } };
                }),
              }));
            }}
          >
            <Shuffle className="h-3.5 w-3.5" /> Acak (beda semua)
          </button>
        </div>
        <SearchBox value={q} onChange={(v) => (setQ(v), setLimit(PAGE))} placeholder="Cari transisi… (zoom, glitch, sapu)" />
        <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua' }, ...TRANSITION_GROUPS]} />
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.slice(0, limit).map((t) => (
          <button key={t.id} type="button" onClick={() => apply(t.id)} className={cx('overflow-hidden rounded-xl border text-left transition', scene.transition.id === t.id ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
            <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
              <TransitionThumb spec={t} primary={doc.theme.palette.primary} secondary={doc.theme.palette.secondary} />
            </LazyVisible>
            <div className="truncate px-1.5 py-1 text-[10px] font-semibold text-mk-muted">{t.name}</div>
          </button>
        ))}
      </div>
      <div className="px-3 pb-4">
        {limit < list.length && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mk-btn-ghost w-full text-xs">
            Tampilkan lagi ({list.length - limit})
          </button>
        )}
      </div>
    </div>
  );
}

export function AnimationPanel({ clock }: { clock: PlaybackClock }) {
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
    return allAnimations(kind).filter((a) => (group === 'all' || a.group === group || kind === 'loop') && (!qq || a.name.toLowerCase().includes(qq) || a.tags.some((g) => g.includes(qq))));
  }, [group, q, kind]);

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
        <Segmented value={slot} onChange={(v) => (setSlot(v), setLimit(PAGE), setGroup('all'))} options={[{ value: 'in', label: 'Masuk' }, { value: 'out', label: 'Keluar' }, { value: 'loop', label: 'Loop' }]} />
        {ref && (
          <div className="grid grid-cols-2 gap-3">
            <Slider label="Durasi" value={ref.duration} min={0.1} max={3} step={0.05} onChange={(v) => updateLayer(layer.id, slot === 'in' ? { animIn: { ...ref, duration: v } } : { animOut: { ...ref, duration: v } })} format={(v) => `${v.toFixed(2)}s`} />
            {slot === 'in' && <Slider label="Jeda" value={ref.delay || 0} min={0} max={3} step={0.05} onChange={(v) => updateLayer(layer.id, { animIn: { ...ref, delay: v } })} format={(v) => `${v.toFixed(2)}s`} />}
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
        {kind === 'in' && <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua' }, ...ANIM_GROUPS.filter((g) => g.id !== 'loop')]} />}
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.slice(0, limit).map((a) => (
          <button key={a.id} type="button" onClick={() => apply(a.id)} className={cx('overflow-hidden rounded-xl border text-left transition', currentId === a.id ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
            <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
              <AnimationThumb spec={a} color={doc.theme.palette.primary} />
            </LazyVisible>
            <div className="truncate px-1.5 py-1 text-[10px] font-semibold text-mk-muted">{a.name}</div>
          </button>
        ))}
      </div>
      <div className="px-3 pb-4">
        {limit < list.length && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mk-btn-ghost w-full text-xs">
            Tampilkan lagi ({list.length - limit})
          </button>
        )}
      </div>
    </div>
  );
}

export function EffectsPanel({ clock }: { clock: PlaybackClock }) {
  const doc = useStudio((s) => s.doc)!;
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const updateScene = useStudio((s) => s.updateScene);
  const commit = useStudio((s) => s.commit);
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const scene = doc.scenes[sceneIdx];
  const active = scene.effects || [];
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return allEffects().filter((e) => (group === 'all' || e.group === group) && (!qq || e.name.toLowerCase().includes(qq) || e.tags.some((g) => g.includes(qq))));
  }, [group, q]);

  const play = () => {
    const st = sceneStarts(doc)[sceneIdx];
    clock.seek(st);
    clock.play();
  };
  const toggle = (id: string) => {
    const on = active.some((a) => a.id === id);
    const kind = getEffect(id)?.kind;
    // satu efek per jenis: ganti varian jenis yang sama
    const next = on ? active.filter((a) => a.id !== id) : [...active.filter((a) => getEffect(a.id)?.kind !== kind), { id, amount: 1 }].slice(-4);
    updateScene(sceneIdx, { effects: next });
    if (!on) setTimeout(play, 30);
  };

  return (
    <div>
      <Section title={`Efek scene ${sceneIdx + 1}`} right={<span className="text-[10px] text-mk-dim">{allEffects().length} efek</span>}>
        {active.length === 0 ? (
          <p className="text-[11px] text-mk-dim">Belum ada efek. Pilih di bawah — maksimal 4 efek per scene.</p>
        ) : (
          <div className="space-y-2">
            {active.map((a) => {
              const e = getEffect(a.id);
              if (!e) return null;
              return (
                <div key={a.id} className="rounded-xl bg-mk-ink p-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="truncate">{e.name}</span>
                    <button type="button" className="text-mk-dim hover:text-red-300" onClick={() => toggle(a.id)}>
                      Hapus
                    </button>
                  </div>
                  <Slider
                    label="Kekuatan"
                    value={a.amount ?? 1}
                    min={0.2}
                    max={2}
                    step={0.05}
                    onChange={(v) => useStudio.getState().live((d) => ({ ...d, scenes: d.scenes.map((s, i) => (i === sceneIdx ? { ...s, effects: (s.effects || []).map((x) => (x.id === a.id ? { ...x, amount: v } : x)) } : s)) }))}
                    onCommit={useStudio.getState().endDrag}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => commit((d) => ({ ...d, scenes: d.scenes.map((s) => ({ ...s, effects: active.map((x) => ({ ...x })) })) }))}>
            Pakai di semua scene
          </button>
          <button type="button" className="mk-btn-ghost text-[11px]" onClick={() => updateScene(sceneIdx, { effects: [] })} disabled={!active.length}>
            Hapus semua efek
          </button>
        </div>
        <SearchBox value={q} onChange={(v) => (setQ(v), setLimit(PAGE))} placeholder="Cari efek… (hujan, kaca pecah, pasir, confetti)" />
        <ChipRow value={group} onChange={(v) => (setGroup(v), setLimit(PAGE))} options={[{ id: 'all', label: 'Semua' }, ...EFFECT_GROUPS]} />
      </Section>
      <div className="grid grid-cols-3 gap-2 p-3 lg:grid-cols-2">
        {list.slice(0, limit).map((e) => {
          const on = active.some((a) => a.id === e.id);
          return (
            <button key={e.id} type="button" onClick={() => toggle(e.id)} className={cx('overflow-hidden rounded-xl border text-left transition', on ? 'border-mk-coral ring-2 ring-mk-coral/30' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
              <LazyVisible minH={60} className="aspect-[16/10] bg-mk-ink">
                <EffectThumb spec={e} primary={doc.theme.palette.primary} secondary={doc.theme.palette.secondary} />
              </LazyVisible>
              <div className="truncate px-1.5 py-1 text-[10px] font-semibold text-mk-muted">{e.name}</div>
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-4">
        {limit < list.length && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mk-btn-ghost w-full text-xs">
            Tampilkan lagi ({list.length - limit})
          </button>
        )}
      </div>
    </div>
  );
}
