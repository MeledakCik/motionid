'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AnimationType,
  AspectRatioType,
  COLOR_PALETTES,
  CUSTOM_IMAGE_ASSETS,
  MUSIC_TRACKS,
} from '@/lib/smart-engine';
import {
  FontFamilyName,
  TemplateId,
  useEditorStore,
} from '@/store/useEditorStore';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import { GRADIENT_PRESETS } from '@/components/templates/types';
import { exportProjectToVideo } from '@/lib/video-exporter';
import { createClient } from '@/lib/supabase/client';
import {
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Download,
  Copy,
  Check,
  Music,
  Upload,
  ArrowLeft,
  Save,
  AlertTriangle,
  Brain,
  Trash2,
} from 'lucide-react';

const FONT_OPTIONS: FontFamilyName[] = [
  'Poppins',
  'Montserrat',
  'Bebas Neue',
  'Playfair Display',
  'Space Grotesk',
  'Anton',
];

const ANIMATION_OPTIONS: { id: AnimationType; label: string }[] = [
  { id: 'pop', label: 'Pop Elastic' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'fade', label: 'Fade Smooth' },
  { id: 'zoom', label: 'Zoom Punch' },
];

const TEMPLATE_LIST: { id: TemplateId; name: string; cat: string }[] = [
  { id: 'Q1', name: 'Q1 • Aura Gradient', cat: 'Quote' },
  { id: 'Q2', name: 'Q2 • Typewriter Blur', cat: 'Quote' },
  { id: 'Q3', name: 'Q3 • Karaoke Word', cat: 'Quote' },
  { id: 'P1', name: 'P1 • Harga Jumbo', cat: 'Promo' },
  { id: 'P2', name: 'P2 • Before-After', cat: 'Promo' },
  { id: 'P3', name: 'P3 • Countdown Timer', cat: 'Promo' },
  { id: 'E1', name: 'E1 • 3 Cara Angka', cat: 'Edukasi' },
  { id: 'E2', name: 'E2 • Fakta Pop', cat: 'Edukasi' },
  { id: 'E3', name: 'E3 • Quiz Q&A', cat: 'Edukasi' },
];

/**
 * Halaman Editor 3-Kolom (/editor/[id]):
 * - Auto-save ke tabel `projects` di Supabase dengan debounce 2 detik (insert / update).
 * - Mendukung Upload Banyak Gambar milik User (Multi-Image Motion Graphic per Scene)
 *   serta koleksi gambar `picsum.photos`.
 * - Akses cepat ke `/admin` khusus untuk `kakangkasyaf@gmail.com`.
 */
export default function EditorPage({ params }: { params: { id: string } }) {
  const {
    title,
    topic,
    category,
    templateId,
    script,
    style,
    activeSceneIndex,
    isPlaying,
    saveStatus,
    setActiveSceneIndex,
    setIsPlaying,
    setTemplateId,
    updateScene,
    updateStyle,
    updateColors,
    addUserImages,
    removeUserImage,
    randomizeProject,
    setSaveStatus,
  } = useEditorStore();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const activeScene = script.scenes[activeSceneIndex] || script.scenes[0];
  const totalDuration = script.scenes.reduce((acc, s) => acc + s.duration, 0);

  // Playback otomatis antar scene saat isPlaying = true
  useEffect(() => {
    if (!isPlaying) return;
    const currentDurationMs = (activeScene?.duration || 3) * 1000;
    const timer = setTimeout(() => {
      const nextIndex = (activeSceneIndex + 1) % script.scenes.length;
      setActiveSceneIndex(nextIndex);
    }, currentDurationMs);
    return () => clearTimeout(timer);
  }, [isPlaying, activeSceneIndex, activeScene?.duration, script.scenes.length, setActiveSceneIndex]);

  // Auto-save ke tabel `projects` di Supabase setiap 2 detik (Debounce)
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            params.id
          );

          if (isValidUuid) {
            await supabase.from('projects').upsert(
              {
                id: params.id,
                user_id: user.id,
                title,
                topic,
                category,
                template_id: templateId,
                script_json: script,
                style_json: style,
                user_images: style.userImages,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          } else {
            await supabase
              .from('projects')
              .update({
                title,
                topic,
                category,
                template_id: templateId,
                script_json: script,
                style_json: style,
                user_images: style.userImages,
                updated_at: new Date().toISOString(),
              })
              .eq('id', params.id)
              .eq('user_id', user.id);
          }
        }
      } catch {
        // Tetap aman jika sedang berjalan tanpa koneksi Supabase
      }
      setSaveStatus('saved');
    }, 2000);

    return () => clearTimeout(timer);
  }, [script, style, templateId, title, topic, category, saveStatus, params.id, setSaveStatus]);

  // Upload Banyak Gambar User Sekaligus (Multi-Image Motion Graphic)
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const localUrls = files.map((f) => URL.createObjectURL(f));
    addUserImages(localUrls);

    try {
      const supabase = createClient();
      const uploadedPublicUrls: string[] = [];

      for (const file of files) {
        const filePath = `user-images/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from('project-backgrounds')
          .upload(filePath, file, { upsert: true });

        if (!error) {
          const { data } = supabase.storage
            .from('project-backgrounds')
            .getPublicUrl(filePath);
          if (data?.publicUrl) {
            uploadedPublicUrls.push(data.publicUrl);
          }
        }
      }

      if (uploadedPublicUrls.length > 0) {
        addUserImages(uploadedPublicUrls);
      }
    } catch {
      // Gunakan ObjectURL lokal
    }
  };

  // Jalankan Export Video di Browser selama total durasi semua scene
  const handleStartExport = async () => {
    setExportModalOpen(true);
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);
    setExportStatusText(`Merekam 0s / ${totalDuration}s...`);
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }

    try {
      const { url } = await exportProjectToVideo(
        script,
        style,
        templateId,
        (pct, statusText) => {
          setExportProgress(pct);
          setExportStatusText(statusText);
        }
      );
      setExportedVideoUrl(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Browser ini tidak mendukung MediaRecorder API. Gunakan Google Chrome Desktop versi terbaru.';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadMp4 = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `motionku-${templateId.toLowerCase()}-${params.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCaption = () => {
    const fullText = `${script.caption}\n\n${script.hashtags.join(' ')}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText);
    }
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const activeSceneImage =
    activeScene?.imageUrl ||
    style.userImages[activeSceneIndex % Math.max(1, style.userImages.length)] ||
    style.backgroundImageUrl;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header Editor */}
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold line-clamp-1">{title}</h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Kategori: {category.toUpperCase()}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Save className="w-3 h-3" />
                {saveStatus === 'saving'
                  ? 'Menyimpan ke tabel projects Supabase...'
                  : saveStatus === 'unsaved'
                  ? 'Menunggu auto-save (debounce 2s)...'
                  : 'Tersimpan di Supabase'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Admin Training</span>
          </Link>

          <button
            type="button"
            onClick={randomizeProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-300 transition"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Acak Lagi / Generate Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleStartExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-xs font-bold text-white shadow-lg hover:opacity-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MP4</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column CapCut Web Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* KOLOM KIRI: List Scene & Pilihan 9 Template */}
        <aside className="col-span-3 border-r border-white/10 bg-slate-900/50 p-4 overflow-y-auto space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Scene ({script.scenes.length})
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold">
                Total: {totalDuration}s
              </span>
            </div>

            <div className="space-y-2">
              {script.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`w-full p-3 rounded-2xl border text-left transition ${
                    activeSceneIndex === idx
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                      : 'bg-slate-950/70 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold uppercase text-violet-300">
                      Scene {scene.sceneNumber} • {scene.role}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10">
                      {scene.duration}s
                    </span>
                  </div>
                  <p className="text-xs font-semibold line-clamp-2">
                    {scene.emoji} {scene.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Pilih Template (9 Variasi)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {TEMPLATE_LIST.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplateId(tpl.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                    templateId === tpl.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tpl.name}</span>
                  <span className="text-[10px] opacity-75">{tpl.cat}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* KOLOM TENGAH: Live Preview Video + Rasio + Timeline */}
        <main className="col-span-5 bg-slate-950 flex flex-col items-center justify-between p-4 overflow-hidden">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1 rounded-xl">
            {(['9:16', '1:1', '16:9'] as AspectRatioType[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateStyle({ aspectRatio: ratio })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  style.aspectRatio === ratio
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <div className="my-auto flex items-center justify-center w-full py-2">
            <div
              className={`relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/15 transition-all duration-300 ${
                style.aspectRatio === '9:16'
                  ? 'w-[280px] h-[498px]'
                  : style.aspectRatio === '1:1'
                  ? 'w-[360px] h-[360px]'
                  : 'w-[440px] h-[248px]'
              }`}
            >
              <TemplateRenderer
                templateId={templateId}
                script={script}
                colors={style.colors}
                font={style.font}
                music={style.music}
                background={{
                  type: style.backgroundType,
                  solidColor: style.solidColor,
                  gradientPreset: style.gradientPreset,
                  imageUrl: activeSceneImage,
                }}
                activeSceneIndex={activeSceneIndex}
                showSubtitle={style.showSubtitle}
                showEmoji={style.showEmoji}
                showProgressBar={style.showProgressBar}
              />

              {style.showProgressBar && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${((activeSceneIndex + 1) / script.scenes.length) * 100}%`,
                      backgroundColor: style.colors.accentColor,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSceneIndex(0);
                  setIsPlaying(true);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-white/10">
              {script.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`p-2 rounded-xl text-left transition ${
                    activeSceneIndex === idx
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-bold">
                    S{scene.sceneNumber} ({scene.duration}s)
                  </div>
                  <div className="text-[10px] truncate opacity-80">{scene.text}</div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* KOLOM KANAN: Panel Edit Lengkap + Galeri Multi-Gambar User */}
        <aside className="col-span-4 border-l border-white/10 bg-slate-900/50 p-4 overflow-y-auto space-y-5">
          {/* Edit Teks Scene Aktif */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
            <label className="text-xs font-bold uppercase text-violet-300 block">
              Edit Teks Scene {activeScene.sceneNumber} ({activeScene.role})
            </label>
            <textarea
              rows={3}
              value={activeScene.text}
              onChange={(e) => updateScene(activeSceneIndex, { text: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs focus:outline-none focus:border-violet-500"
            />
            <input
              type="text"
              value={activeScene.subtext}
              onChange={(e) => updateScene(activeSceneIndex, { subtext: e.target.value })}
              placeholder="Subtext / Subtitle tambahan..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs"
            />
          </div>

          {/* Galeri Gambar User untuk Video Motion Graphic (Multi-Image Upload) */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-cyan-300 block">
                📸 Galeri Gambar Anda (Slideshow per Scene)
              </label>
              <span className="text-[10px] text-slate-400">
                {style.userImages.length} Gambar
              </span>
            </div>

            <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-dashed border-cyan-400/50 text-xs font-bold text-cyan-200 cursor-pointer transition">
              <Upload className="w-4 h-4 text-cyan-300" />
              <span>Masukkan Gambar-Gambar Anda (Bisa Pilih Banyak)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultiImageUpload}
                className="hidden"
              />
            </label>

            {style.userImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {style.userImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-white/20 h-16 bg-slate-900"
                  >
                    <img
                      src={imgUrl}
                      alt={`User asset ${idx + 1}`}
                      onClick={() => {
                        updateScene(activeSceneIndex, { imageUrl: imgUrl });
                        updateStyle({ backgroundType: 'upload', backgroundImageUrl: imgUrl });
                      }}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => removeUserImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center py-0.5">
                      Scene {(idx % script.scenes.length) + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pilihan Gambar Preset Picsum.photos */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Atau Pilih Background Picsum.photos:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {CUSTOM_IMAGE_ASSETS.slice(0, 4).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      updateScene(activeSceneIndex, { imageUrl: asset.url });
                      updateStyle({
                        backgroundType: 'picsum',
                        backgroundImageUrl: asset.url,
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-left truncate"
                  >
                    🖼️ {asset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilih Animasi Masuk & Durasi per Scene */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                Animasi Masuk
              </label>
              <select
                value={activeScene.animation}
                onChange={(e) =>
                  updateScene(activeSceneIndex, {
                    animation: e.target.value as AnimationType,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs"
              >
                {ANIMATION_OPTIONS.map((anim) => (
                  <option key={anim.id} value={anim.id}>
                    {anim.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                Durasi Scene
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[2, 3, 4, 5].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateScene(activeSceneIndex, { duration: sec })}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      activeScene.duration === sec
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilih Font (6 Google Fonts) */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold uppercase text-slate-400 block">
              Pilih Tipografi (6 Google Fonts)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((fontName) => (
                <button
                  key={fontName}
                  type="button"
                  onClick={() => updateStyle({ font: fontName })}
                  style={{ fontFamily: fontName }}
                  className={`px-3 py-2 rounded-xl border text-xs text-left truncate ${
                    style.font === fontName
                      ? 'bg-violet-600/20 border-violet-500 text-white'
                      : 'bg-slate-900 border-white/10 text-slate-300'
                  }`}
                >
                  {fontName}
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Palet Warna (8 Preset + Custom Color Picker) */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold uppercase text-slate-400 block">
              Palet Warna (8 Preset + Custom Picker)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => updateColors(pal)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 ${
                    style.colors.id === pal.id
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-white/10 bg-slate-900'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${pal.bgPrimary}, ${pal.accentColor})`,
                    }}
                  />
                  <span className="text-[11px] font-medium truncate">{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Musik Latar (5 Track CDN & Lokal) */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
            <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pilih Musik Latar (5 MP3 CDN &amp; Lokal)</span>
            </label>
            <div className="space-y-1.5">
              {MUSIC_TRACKS.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => updateStyle({ music: track })}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs ${
                    style.music.id === track.id
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                      : 'bg-slate-900 border-white/5 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold">{track.title}</div>
                    <div className="text-[10px] opacity-70">{track.description}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30">
                    {track.bpm} BPM
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Export Video MP4 */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Export Video MP4 &amp; Caption TikTok</h3>
                <p className="text-[11px] text-slate-400">
                  Dirender di browser dengan HTML5 Canvas + MediaRecorder + AudioContext
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Tutup ✕
              </button>
            </div>

            {exportError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Perekaman Video Tidak Didukung</span>
                </div>
                <p>{exportError}</p>
              </div>
            )}

            {isExporting ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-150"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <p className="font-bold text-cyan-300">{exportStatusText}</p>
                  <span className="font-mono font-bold text-slate-300">{exportProgress}%</span>
                </div>
              </div>
            ) : (
              exportedVideoUrl && (
                <div className="space-y-4">
                  <video
                    src={exportedVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-48 max-h-72 mx-auto rounded-2xl border border-white/15 shadow-lg bg-black"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadMp4}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download MP4</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 font-extrabold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCaption ? 'Tersalin!' : 'Copy Caption + Hashtag'}</span>
                    </button>
                  </div>
                </div>
              )
            )}

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-amber-400">
                  Caption + Hashtag Otomatis
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? 'Tersalin!' : 'Copy Caption + Hashtag'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{script.caption}</p>
              <p className="text-xs font-semibold text-cyan-400">
                {script.hashtags.join(' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
