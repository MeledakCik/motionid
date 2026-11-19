'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  Component as ComponentIcon,
  Group,
  Image as ImageIcon,
  PenTool,
  Layers,
  ListOrdered,
  LayoutTemplate,
  Loader2,
  Music,
  Palette,
  Redo2,
  Shapes,
  SlidersHorizontal,
  Smile,
  Shuffle,
  CloudRain,
  Trash2,
  Type,
  Undo2,
  Ungroup,
  Wand2,
  X,
} from 'lucide-react';
import type { Aspect, IconLayer, ProjectDoc } from '@/lib/studio/types';
import { currentLayer, placeholderList, Tool, useStudio } from '@/store/useStudio';
import { loginHref, useUser } from '@/lib/studio/useUser';
import { PlaybackClock } from '@/lib/studio/clock';
import { saveProject } from '@/lib/studio/persist';
import { changeAspect } from '@/lib/studio/builder';
import { loadTraining } from '@/lib/studio/training';
import { Renderer, sceneStarts, settleTime } from '@/lib/studio/renderer';
import { cx, Dropdown, Logo, RatioIcon, Segmented, useMediaQuery } from './ui';
import Stage from './Stage';
import Timeline from './Timeline';
import { BackgroundPanel, ElementsPanel, IconsPanel, MediaPanel, MusicPanel, TemplatePanel, TextPanel } from './AssetPanels';
import { AnimationPanel, EffectsPanel, TransitionPanel } from './MotionPanels';
import { ComponentsPanel } from './DesignPanels';
import { RecipePanel } from './RecipePanel';
import { BLANK_TEMPLATE } from '@/lib/studio/vector';
import { Inspector, LayersPanel } from './Inspector';
import ExportDialog from './ExportDialog';

const TOOLS: Array<{ id: Tool; label: string; icon: React.ComponentType<{ className?: string }>; pro?: boolean }> = [
  { id: 'template', label: 'Template', icon: LayoutTemplate },
  { id: 'teks', label: 'Teks', icon: Type },
  { id: 'foto', label: 'Media', icon: ImageIcon },
  { id: 'elemen', label: 'Elemen', icon: Shapes },
  { id: 'komponen', label: 'Komponen', icon: ComponentIcon },
  { id: 'resep', label: 'Cara buat', icon: ListOrdered },
  { id: 'ikon', label: 'Ikon', icon: Smile },
  { id: 'latar', label: 'Latar', icon: Palette },
  { id: 'efek', label: 'Efek', icon: CloudRain },
  { id: 'musik', label: 'Musik', icon: Music },
  { id: 'transisi', label: 'Transisi', icon: Shuffle, pro: true },
  { id: 'animasi', label: 'Animasi', icon: Wand2, pro: true },
  { id: 'layer', label: 'Lapisan', icon: Layers, pro: true },
];

const TOOL_TITLE: Record<Tool, string> = {
  efek: 'Efek (370+)',
  template: 'Template (360)',
  teks: 'Teks',
  foto: 'Video & Foto',
  elemen: 'Elemen siap pakai',
  komponen: 'Komponen saya',
  resep: 'Cara pembuatan',
  ikon: 'Ikon',
  latar: 'Latar & Warna',
  musik: 'Musik',
  transisi: 'Transisi',
  animasi: 'Animasi',
  layer: 'Lapisan',
  properti: 'Edit elemen',
};

function makeThumb(doc: ProjectDoc): string | undefined {
  try {
    const c = document.createElement('canvas');
    c.width = 180;
    c.height = Math.round((180 * (doc.aspect === '16:9' ? 1080 : doc.aspect === '1:1' ? 1080 : doc.aspect === '4:5' ? 1350 : 1920)) / (doc.aspect === '16:9' ? 1920 : 1080));
    const r = new Renderer({ allowBlur: false, particleScale: 0.3 });
    r.setDoc({ ...doc, showProgress: false });
    r.renderScene(c.getContext('2d')!, c.width, c.height, doc.scenes[0], settleTime(doc.scenes[0]));
    return c.toDataURL('image/jpeg', 0.6);
  } catch {
    return undefined;
  }
}

export default function Editor({ initialDoc, admin }: { initialDoc: ProjectDoc; admin?: boolean }) {
  const clock = useMemo(() => new PlaybackClock(), []);
  const doc = useStudio((s) => s.doc);
  const tool = useStudio((s) => s.tool);
  const mode = useStudio((s) => s.mode);
  const layer = useStudio(currentLayer);
  const saveStatus = useStudio((s) => s.saveStatus);
  const st = useStudio.getState();
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [exporting, setExporting] = useState(false);
  const [coach, setCoach] = useState(0);
  const [, setPacks] = useState(0);
  const auth = useUser();
  const guest = !auth.loading && !auth.user;
  const placeholders = useStudio((s) => placeholderList(s.doc));
  const multiSel = useStudio((s) => s.selIds.length > 1);
  const [phCursor, setPhCursor] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    useStudio.getState().load(initialDoc);
    try {
      const m = localStorage.getItem('motionku:mode');
      if (m === 'pro' || m === 'mudah') useStudio.setState({ mode: m });
      if (!localStorage.getItem('motionku:coach')) setCoach(1);
    } catch {
      // abaikan
    }
    loadTraining().then((n) => n && setPacks(n));
    // waktu lokal scene untuk keyframe & potong scene
    const startOf = () => {
      const s = useStudio.getState();
      return s.doc ? sceneStarts(s.doc)[s.sceneIdx] ?? 0 : 0;
    };
    useStudio.setState({
      localTime: () => Math.max(0, clock.time - startOf()),
      seekLocal: (t: number) => {
        clock.pause();
        clock.seek(startOf() + Math.max(0, t));
      },
    });
    return () => clock.dispose();
  }, [initialDoc, clock]);

  // proyek tamu yang baru login → langsung simpan ke cloud
  useEffect(() => {
    if (auth.user && initialDoc && !/^[0-9a-f]{8}-/i.test(useStudio.getState().doc?.id || initialDoc.id)) useStudio.getState().setSaveStatus('unsaved');
  }, [auth.user, initialDoc]);

  // panel default desktop
  useEffect(() => {
    let want: Tool | null = null;
    try {
      // baru diimpor → langsung tampilkan cara pembuatannya
      if (localStorage.getItem('motionku:open-tool') === 'resep') {
        localStorage.removeItem('motionku:open-tool');
        want = 'resep';
      }
    } catch {
      // abaikan
    }
    if (want) useStudio.setState({ tool: want });
    else if (desktop && !useStudio.getState().tool) {
      const d = useStudio.getState().doc;
      useStudio.setState({ tool: d?.imported ? 'resep' : d?.templateId === BLANK_TEMPLATE ? 'komponen' : 'template' });
    }
  }, [desktop]);

  // autosave
  useEffect(() => {
    if (saveStatus !== 'unsaved' || !doc) return;
    const id = window.setTimeout(async () => {
      useStudio.getState().setSaveStatus('saving');
      const thumb = makeThumb(doc);
      const r = await saveProject(doc, thumb);
      const cur = useStudio.getState();
      if (r.id !== doc.id && cur.doc) {
        useStudio.setState({ doc: { ...cur.doc, id: r.id } });
        if (!admin) window.history.replaceState(null, '', `/editor/${r.id}`);
      }
      cur.setSaveStatus(r.error ? 'error' : cur.saveStatus !== 'saving' ? cur.saveStatus : r.remote ? 'saved' : 'local');
    }, 1600);
    return () => window.clearTimeout(id);
  }, [saveStatus, doc, admin]);

  // peringatan sebelum menutup tab bila belum tersimpan
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (useStudio.getState().saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const openTool = useCallback(
    (t: Tool | null) => {
      if (t === 'animasi' || t === 'transisi') clock.pause();
      st.setTool(t);
    },
    [st, clock]
  );

  function jumpPlaceholder() {
    const list = placeholderList(useStudio.getState().doc);
    if (!list.length) return;
    const p = list[phCursor % list.length];
    setPhCursor((c) => c + 1);
    clock.pause();
    useStudio.setState({ sceneIdx: p.sceneIdx, layerId: p.layerId });
    if (!desktop) openTool('properti');
    setTimeout(() => document.getElementById('mk-text-editor')?.focus(), 350);
  }

  if (!doc) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-mk-coral" />
      </div>
    );
  }

  const tools = TOOLS.filter((t) => mode === 'pro' || !t.pro);
  const iconPick = layer?.kind === 'icon' ? (id: string) => st.updateLayer(layer.id, { iconId: id } as Partial<IconLayer>) : undefined;

  const panel = (t: Tool | null) => {
    switch (t) {
      case 'template':
        return <TemplatePanel />;
      case 'teks':
        return <TextPanel />;
      case 'foto':
        return <MediaPanel />;
      case 'elemen':
        return <ElementsPanel />;
      case 'komponen':
        return <ComponentsPanel />;
      case 'resep':
        return <RecipePanel clock={clock} />;
      case 'ikon':
        return <IconsPanel onPick={iconPick} />;
      case 'latar':
        return <BackgroundPanel />;
      case 'musik':
        return <MusicPanel />;
      case 'efek':
        return <EffectsPanel clock={clock} />;
      case 'transisi':
        return <TransitionPanel clock={clock} />;
      case 'animasi':
        return <AnimationPanel clock={clock} />;
      case 'layer':
        return <LayersPanel />;
      case 'properti':
        return <Inspector onOpenTool={openTool} />;
      default:
        return null;
    }
  };

  const saveBadge =
    saveStatus === 'saving' ? (
      <span className="flex items-center gap-1 text-[11px] text-mk-muted" title="Menyimpan">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> <span className="hidden sm:inline">Menyimpan</span>
      </span>
    ) : saveStatus === 'error' || saveStatus === 'local' ? (
      <span className="flex items-center gap-1 text-[11px] text-mk-amber" title="Tersimpan di perangkat ini saja">
        <CloudOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Di HP ini</span>
      </span>
    ) : saveStatus === 'saved' ? (
      <span className="flex items-center gap-1 text-[11px] text-mk-mint" title="Tersimpan">
        <Cloud className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tersimpan</span>
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[11px] text-mk-dim" title="Belum disimpan">
        <span className="h-2 w-2 rounded-full bg-mk-amber" /> <span className="hidden sm:inline">Belum disimpan</span>
      </span>
    );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden text-mk-cream">
      {/* ------------------------- top bar ------------------------- */}
      <header className="mk-glass flex h-14 shrink-0 items-center gap-2 border-b border-white/60 px-2 sm:px-3">
        <Link href={admin ? '/admin' : guest ? '/' : '/dashboard'} className="mk-btn-icon" aria-label="Kembali">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Logo className="hidden text-sm lg:inline-flex" />
        <input
          value={doc.title}
          onChange={(e) => st.live((d) => ({ ...d, title: e.target.value }))}
          onBlur={st.endDrag}
          className="min-w-0 max-w-[180px] flex-1 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-bold outline-none hover:bg-mk-panel-2 focus:bg-mk-panel-2 sm:max-w-xs"
          aria-label="Judul proyek"
        />
        <div className="shrink-0 [&_span]:whitespace-nowrap">{saveBadge}</div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="mk-btn-icon" onClick={st.undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className="mk-btn-icon" onClick={st.redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <Dropdown
            label="Rasio video"
            value={doc.aspect}
            onChange={(v) => st.commit((d) => changeAspect(d, v as Aspect))}
            align="right"
            menuWidth={250}
            className="px-2.5 py-2"
            compactLabel={(o) => (desktop ? o.label : o.value)}
            options={[
              { value: '9:16', label: '9:16 TikTok / Reels', desc: 'Vertikal penuh, Shorts, Status WA', icon: <RatioIcon ratio="9:16" /> },
              { value: '4:5', label: '4:5 Feed Instagram', desc: 'Postingan feed IG & Facebook', icon: <RatioIcon ratio="4:5" /> },
              { value: '1:1', label: '1:1 Kotak', desc: 'Feed, marketplace, katalog', icon: <RatioIcon ratio="1:1" /> },
              { value: '16:9', label: '16:9 YouTube', desc: 'Horizontal, presentasi', icon: <RatioIcon ratio="16:9" /> },
            ]}
          />
          <div className="hidden w-[150px] md:block">
            <Segmented size="sm" value={mode} onChange={st.setMode} options={[{ value: 'mudah', label: 'Mudah' }, { value: 'pro', label: 'Pro' }]} />
          </div>
          <button type="button" className="mk-btn-primary ml-1 px-3 py-2 text-xs sm:px-4" onClick={() => (clock.pause(), setExporting(true))}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ------------------------- desktop: rail + panel ------------------------- */}
        {desktop && (
          <>
            <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-mk-line bg-mk-panel py-2">
              {tools.map((t) => (
                <button key={t.id} type="button" onClick={() => openTool(tool === t.id ? null : t.id)} className={cx('flex w-[62px] flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold transition', tool === t.id ? 'bg-mk-coral/15 text-mk-coral' : 'text-mk-muted hover:bg-mk-panel-2 hover:text-mk-cream')}>
                  <t.icon className="h-5 w-5" />
                  {t.label}
                </button>
              ))}
            </nav>
            {tool && tool !== 'properti' && (
              <aside className="mk-scroll w-[320px] shrink-0 overflow-y-auto border-r border-mk-line bg-mk-panel">
                <div className="mk-glass mk-bar sticky top-0 z-10 flex items-center justify-between border-b border-mk-line px-4 py-2.5">
                  <h3 className="text-sm font-extrabold">{TOOL_TITLE[tool]}</h3>
                  <button type="button" className="mk-btn-icon h-7 w-7" onClick={() => openTool(null)} aria-label="Tutup panel">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {panel(tool)}
              </aside>
            )}
          </>
        )}

        {/* ------------------------- stage ------------------------- */}
        <main className="relative min-w-0 flex-1 bg-mk-dots">
          <Stage clock={clock} onRequestEdit={() => openTool(desktop ? null : 'properti')} />
          <div className="pointer-events-none absolute inset-x-2 top-[3.6rem] z-10 flex flex-col items-center gap-1.5 lg:top-2">
            {guest && (
              <a href={loginHref()} className="mk-glass mk-pop mk-float pointer-events-auto rounded-full px-3 py-1.5 text-[11px] font-semibold text-mk-muted">
                Mode tamu · tersimpan di perangkat ini · <span className="font-bold text-mk-coral">Masuk</span>
              </a>
            )}
            {placeholders.length > 0 && (
              <button type="button" onClick={() => jumpPlaceholder()} className="mk-glass mk-pop mk-float pointer-events-auto rounded-full border border-mk-amber/40 px-3 py-1.5 text-[12px] font-bold text-mk-amber">
                {placeholders.length} teks contoh perlu diganti · <span className="underline">Ganti</span>
              </button>
            )}
          </div>
          {coach > 0 && (
            <div className="mk-glass-deep mk-pop mk-float absolute inset-x-3 bottom-3 z-20 mx-auto max-w-sm animate-mk-up rounded-2xl border border-white/15 p-4 text-white">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-mk-lime">Panduan singkat {coach}/3</div>
              <p className="text-sm font-semibold">
                {coach === 1 && 'Ketuk teks, gambar, atau stiker di video untuk memilihnya. Seret untuk pindah, tarik titik sudut untuk ubah ukuran.'}
                {coach === 2 && (desktop ? 'Pakai menu di kiri untuk ganti template, tambah teks, foto, komponen, dan ikon.' : 'Pakai menu di bawah untuk ganti template, tambah teks, foto, komponen, dan ikon.')}
                {coach === 3 && 'Sudah oke? Tekan tombol Export untuk menyimpan video MP4 yang mulus. Mode Pro membuka transisi, animasi & timeline lengkap.'}
              </p>
              <div className="mt-3 flex justify-between">
                <button type="button" className="text-xs text-white/60 hover:text-white" onClick={() => (setCoach(0), localStorage.setItem('motionku:coach', '1'))}>
                  Lewati
                </button>
                <button
                  type="button"
                  className="mk-btn-lime px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (coach >= 3) {
                      setCoach(0);
                      localStorage.setItem('motionku:coach', '1');
                    } else setCoach(coach + 1);
                  }}
                >
                  {coach >= 3 ? 'Mulai edit' : 'Lanjut'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ------------------------- desktop: inspector ------------------------- */}
        {desktop && (
          <aside className="mk-scroll w-[300px] shrink-0 overflow-y-auto border-l border-mk-line bg-mk-panel">
            <div className="mk-glass mk-bar sticky top-0 z-10 border-b border-mk-line px-4 py-2.5">
              <h3 className="text-sm font-extrabold">{multiSel ? 'Beberapa elemen' : layer ? 'Edit elemen' : 'Pengaturan scene'}</h3>
            </div>
            <Inspector onOpenTool={openTool} />
          </aside>
        )}
      </div>

      {/* ------------------------- HP: panel menempel di bawah video (video tetap terlihat) ------------------------- */}
      {!desktop && tool ? (
        <section className="mk-glass flex h-[min(46vh,420px)] shrink-0 animate-mk-sheet flex-col rounded-t-3xl border-t border-white/70" aria-label={TOOL_TITLE[tool]}>
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-sm font-extrabold">{TOOL_TITLE[tool]}</h3>
            <button type="button" className="mk-btn-primary px-3 py-1.5 text-xs" onClick={() => openTool(null)}>
              <Check className="h-3.5 w-3.5" /> Selesai
            </button>
          </div>
          <div className="mk-scroll min-h-0 flex-1 overflow-y-auto border-t border-mk-line pb-2">{panel(tool)}</div>
        </section>
      ) : (
        /* ------------------------- timeline ------------------------- */
        <Timeline clock={clock} onOpenTool={openTool} />
      )}

      {/* ------------------------- mobile toolbar ------------------------- */}
      {!desktop && (
        <nav className="mk-glass shrink-0 border-t border-white/60 pb-[env(safe-area-inset-bottom)]">
          {layer ? (
            <div className="mk-noscroll flex items-center gap-1 overflow-x-auto px-2 py-1.5">
              <ToolBtn label="Edit" icon={SlidersHorizontal} onClick={() => openTool('properti')} active />
              {layer.kind === 'text' && <ToolBtn label="Ketik" icon={Type} onClick={() => (openTool('properti'), setTimeout(() => document.getElementById('mk-text-editor')?.focus(), 250))} />}
              <ToolBtn label="Animasi" icon={Wand2} onClick={() => openTool('animasi')} />
              {layer.kind === 'icon' && <ToolBtn label="Ganti" icon={Smile} onClick={() => openTool('ikon')} />}
              {layer.kind === 'path' && <ToolBtn label="Titik" icon={PenTool} onClick={() => st.setPathEdit(useStudio.getState().pathEdit ? null : layer.id)} />}
              {layer.kind === 'group' && <ToolBtn label="Isi" icon={Group} onClick={() => st.enterGroup(layer.id)} />}
              {layer.kind === 'group' && <ToolBtn label="Lepas" icon={Ungroup} onClick={() => st.ungroupLayer(layer.id)} />}
              {multiSel && <ToolBtn label="Grup" icon={Group} onClick={() => st.groupSelected()} />}
              <ToolBtn label="Duplikat" icon={Copy} onClick={() => st.duplicateLayer(layer.id)} />
              <ToolBtn label="Depan" icon={Layers} onClick={() => st.moveLayer(layer.id, 'top')} />
              <ToolBtn label="Hapus" icon={Trash2} onClick={() => st.removeSelected()} />
              <ToolBtn label="Selesai" icon={Check} onClick={() => st.selectLayer(null)} />
            </div>
          ) : (
            <div className="mk-noscroll flex items-center gap-1 overflow-x-auto px-2 py-1.5">
              {tools.map((t) => (
                <ToolBtn key={t.id} label={t.label} icon={t.icon} onClick={() => openTool(t.id)} active={tool === t.id} />
              ))}
              <ToolBtn label={mode === 'pro' ? 'Mudah' : 'Pro'} icon={SlidersHorizontal} onClick={() => st.setMode(mode === 'pro' ? 'mudah' : 'pro')} />
            </div>
          )}
        </nav>
      )}


      {exporting && (
        <ExportDialog
          doc={doc}
          guest={guest}
          placeholders={placeholders.length}
          onFixPlaceholders={() => {
            setExporting(false);
            jumpPlaceholder();
          }}
          onBeforeLogin={() => saveProject(useStudio.getState().doc!).then((r) => `/editor/${r.id}`)}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}

function ToolBtn({ label, icon: Icon, onClick, active }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cx('flex min-w-[60px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold', active ? 'text-mk-coral' : 'text-mk-muted active:bg-mk-panel-2')}>
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
