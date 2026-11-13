"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  AnimationType,
  CameraMotionType as EngineCameraMotionType,
  CategoryType,
  COLOR_PALETTES,
  computeCursorChoreography,
  CursorAnimationMode,
  CursorVisualSkin,
  generateScript,
  GOOGLE_VISUAL_DATA_PACKS,
  GoogleDataPackItem,
  matchBestDataPack,
  SceneTransition,
  solveSpring,
  synthesizeAllSceneImagesFromDataPack,
  synthesizeDataPackSceneImage,
} from '@/lib/smart-engine';
import {
  NON_REPEATING_ANIMATION_PACKS,
  NON_REPEATING_TRANSITION_PACKS,
} from '@/lib/creative-packs';

export type WidgetRigType =
  | 'step-paste-card'
  | 'step-check-card'
  | 'step-deploy-card'
  | 'terminal-log-box'
  | 'metric-flip-counter'
  | 'price-slash-sticker'
  | 'countdown-flash-bar'
  | 'before-after-slider'
  | 'quiz-poll-card'
  | 'quote-glass-frame';

export type CameraMotionType = EngineCameraMotionType;

export interface SceneTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotateDeg: number;
}

export interface StudioSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  subtitle: string;
  badgeText: string;
  priceTag: string;
  durationSec: number;
  transition: SceneTransition;
  animation: AnimationType;
  cameraMotion: CameraMotionType;
  widgetType: WidgetRigType;
  imageUrl: string;
  packId: string;
  packTitle: string;
  compositionStyle: string;
}

export interface TrainedVideoPresetItem {
  id: string;
  creatorHandle: string;
  sourceUrl: string;
  styleName: string;
  cursorMode: CursorAnimationMode;
  transitions: SceneTransition[];
  animations: AnimationType[];
}

export interface PaletteThemeConfig {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  textPrimary: string;
}

export const DEFAULT_PALETTE_THEMES: Record<string, PaletteThemeConfig> = {
  'cyber-violet': {
    id: 'cyber-violet',
    name: 'Cyber Violet Studio',
    bgPrimary: '#070815',
    bgSecondary: '#1E1B4B',
    accent: '#38BDF8',
    textPrimary: '#F8FAFC',
  },
  'promo-fire': {
    id: 'promo-fire',
    name: 'Promo UMKM Merah Emas',
    bgPrimary: '#1F0606',
    bgSecondary: '#7F1D1D',
    accent: '#FACC15',
    textPrimary: '#FFFFFF',
  },
  'kopi-senja': {
    id: 'kopi-senja',
    name: 'Roastery Kopi Aren',
    bgPrimary: '#140B05',
    bgSecondary: '#451A03',
    accent: '#F59E0B',
    textPrimary: '#FFFBEB',
  },
  'emerald-cuan': {
    id: 'emerald-cuan',
    name: 'Emerald Growth Cuan',
    bgPrimary: '#02140C',
    bgSecondary: '#064E3B',
    accent: '#34D399',
    textPrimary: '#ECFDF5',
  },
};

export interface MotionStudioEngineProps {
  mode?: 'user' | 'admin';
  initialTopic?: string;
  initialCategory?: CategoryType;
  projectId?: string;
}

export default function MotionStudioEngine({
  mode = 'user',
  initialTopic = 'Promo Kopi Susu Gula Aren 18rb',
  initialCategory = 'promo',
}: MotionStudioEngineProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [category, setCategory] = useState<CategoryType>(initialCategory);
  const [cursorMode, setCursorMode] = useState<CursorAnimationMode>('single-pro');
  const [cursorSkin, setCursorSkin] = useState<CursorVisualSkin>('figma-pill');
  const [activeTab, setActiveTab] = useState<'datapack' | 'transitions' | 'cursor' | 'admin'>('datapack');
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('cyber-violet');
  const [customPackKeyword, setCustomPackKeyword] = useState('');
  const [statusMessage, setStatusMessage] = useState(
    'Smart Data Pack Image Synthesizer & Non-Repeating Motion Rig aktif.'
  );

  const buildScenesFromTopic = (
    rawTopic: string,
    cat: CategoryType,
    cMode: CursorAnimationMode,
    overridePack?: GoogleDataPackItem
  ): StudioSceneItem[] => {
    const generated = generateScript(rawTopic, cat, {
      cursorMode: cMode,
      useDataPackImages: true,
    });
    const synthImgs = synthesizeAllSceneImagesFromDataPack({
      topic: rawTopic,
      category: cat,
      priceLabel: generated.extractedMeta.priceText,
      scenes: generated.scenes.map((s) => ({ text: s.text, subtext: s.subtext })),
      customPackOverride: overridePack,
    });

    return generated.scenes.map((sc, idx) => ({
      id: sc.id,
      sceneNumber: idx + 1,
      title: sc.text,
      subtitle: sc.subtext,
      badgeText: sc.stepBadge || `0${idx + 1} // SCENE`,
      priceTag: generated.extractedMeta.priceText,
      durationSec: sc.duration || 3,
      transition: sc.transition || NON_REPEATING_TRANSITION_PACKS[idx % NON_REPEATING_TRANSITION_PACKS.length].id,
      animation: sc.animation || NON_REPEATING_ANIMATION_PACKS[idx % NON_REPEATING_ANIMATION_PACKS.length].id,
      cameraMotion: sc.cameraMotion || 'zoom-in',
      widgetType: (sc.widgetType as WidgetRigType) || 'step-paste-card',
      imageUrl: synthImgs[idx]?.dataUri || sc.imageUrl || '',
      packId: synthImgs[idx]?.clusterId || generated.extractedMeta.matchedDataPackId,
      packTitle: synthImgs[idx]?.packTitle || generated.extractedMeta.matchedDataPackTitle,
      compositionStyle: synthImgs[idx]?.compositionStyle || 'glass-3d-product-stage',
    }));
  };

  const [scenes, setScenes] = useState<StudioSceneItem[]>(() =>
    buildScenesFromTopic(initialTopic, initialCategory, 'single-pro')
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImagesRef = useRef<Record<number, HTMLImageElement>>({});

  // Preload synthesized SVG Data-URI images into HTMLImageElement for 60fps canvas rendering
  useEffect(() => {
    scenes.forEach((sc, idx) => {
      if (!sc.imageUrl) return;
      const img = new Image();
      img.src = sc.imageUrl;
      img.onload = () => {
        loadedImagesRef.current[idx] = img;
      };
    });
  }, [scenes]);

  // 60fps playback loop
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setSceneProgress((prev) => {
        const currentScene = scenes[activeSceneIdx] || scenes[0];
        const duration = Math.max(2, currentScene?.durationSec || 3);
        const next = prev + dt / duration;
        if (next >= 1) {
          setActiveSceneIdx((idx) => (idx + 1) % scenes.length);
          return 0;
        }
        return next;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, activeSceneIdx, scenes]);

  // Render current scene + transition + cursor animation onto 60fps HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScene = scenes[activeSceneIdx] || scenes[0];
    if (!currentScene) return;

    const palette =
      DEFAULT_PALETTE_THEMES[selectedPaletteId] || DEFAULT_PALETTE_THEMES['cyber-violet'];
    const W = canvas.width;
    const H = canvas.height;
    const p = sceneProgress;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. Background fill
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, palette.bgPrimary);
    bgGrad.addColorStop(1, palette.bgSecondary);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Non-repeating Transition & Camera Transform
    const entryT = Math.min(1, p / 0.24);
    const springVal = solveSpring(entryT * 1.2, { stiffness: 230, damping: 18 });
    const cursorState = computeCursorChoreography(p, activeSceneIdx, cursorMode, cursorSkin);

    ctx.translate(W / 2 + cursorState.cameraPanX * 1.6, H / 2 + cursorState.cameraPanY * 1.6);

    let camScale = cursorState.cameraZoom;
    let camRot = (cursorState.cameraTiltDeg * Math.PI) / 180;

    if (currentScene.transition === 'whip-left' && p < 0.22) {
      ctx.translate((1 - springVal) * -W * 0.65, 0);
    } else if (currentScene.transition === 'diagonal-slice' && p < 0.22) {
      ctx.translate((1 - springVal) * W * 0.45, (1 - springVal) * -H * 0.45);
      camRot += (1 - springVal) * 0.18;
    } else if (currentScene.transition === 'zoom-punch' && p < 0.25) {
      camScale *= 0.45 + 0.55 * springVal;
    } else if (currentScene.transition === 'morph-card' && p < 0.25) {
      ctx.scale(Math.max(0.15, springVal), 1);
    }

    ctx.rotate(camRot);
    ctx.scale(camScale, camScale);
    ctx.translate(-W / 2, -H / 2);

    // 3. Draw Synthesized Google Data Pack Image
    const synthImg = loadedImagesRef.current[activeSceneIdx];
    if (synthImg) {
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.drawImage(synthImg, 0, 0, W, H);
      ctx.restore();
    }

    // 4. Transition Specific Overlay (Iris / Shutter / Blueprint Wireframe)
    if (currentScene.transition === 'blueprint-wire' && p < 0.35) {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 40, W - 56, H - 80);
    } else if (currentScene.transition === 'shutter-blinds' && p < 0.22) {
      const slats = 6;
      const slatW = W / slats;
      ctx.fillStyle = palette.bgPrimary;
      for (let i = 0; i < slats; i++) {
        ctx.fillRect(i * slatW, 0, slatW * (1 - springVal), H);
      }
    }

    // 5. Kinetic Animated Headline Box
    ctx.save();
    const cardY = H * 0.56 + (1 - springVal) * 45;
    ctx.fillStyle = 'rgba(7, 10, 25, 0.86)';
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(24, cardY, W - 48, 175, 18);
    ctx.fill();
    ctx.stroke();

    // Badge
    ctx.fillStyle = palette.accent;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `${currentScene.badgeText} · TRANSISI: ${currentScene.transition.toUpperCase()}`,
      40,
      cardY + 28
    );

    // Selection highlight box if cursor mode is active
    if (cursorMode !== 'off' && cursorState.highlightProgress > 0.05) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.26)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      const hlW = (W - 84) * cursorState.highlightProgress;
      ctx.fillRect(36, cardY + 38, hlW, 34);
      ctx.strokeRect(36, cardY + 38, hlW, 34);
    }

    // Main Headline Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    const visibleText =
      currentScene.animation === 'typewriter'
        ? currentScene.title.slice(0, Math.max(4, Math.floor(currentScene.title.length * cursorState.typingProgress)))
        : currentScene.title;
    ctx.fillText(visibleText.slice(0, 32), 40, cardY + 62);
    if (visibleText.length > 32) {
      ctx.fillText(visibleText.slice(32, 64), 40, cardY + 86);
    }

    // Subtitle & Data Pack Source
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px sans-serif';
    ctx.fillText(currentScene.subtitle.slice(0, 44), 40, cardY + 116);

    ctx.fillStyle = palette.accent;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `ANIM: ${currentScene.animation.toUpperCase()} · CAM: ${currentScene.cameraMotion.toUpperCase()}`,
      40,
      cardY + 148
    );
    ctx.restore();

    // 6. Draw Cursor Animation Mode Overlay
    if (cursorState.visible) {
      // Multi-agent swarm cursors
      if (cursorMode === 'multi-agent-swarm') {
        cursorState.swarmAgents.forEach((ag) => {
          const ax = (ag.x / 100) * W;
          const ay = (ag.y / 100) * H;
          ctx.save();
          ctx.translate(ax, ay);
          ctx.fillStyle = ag.color;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(14, 9);
          ctx.lineTo(8, 11);
          ctx.lineTo(5, 18);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = ag.color;
          ctx.beginPath();
          ctx.roundRect(12, 10, 88, 18, 9);
          ctx.fill();
          ctx.fillStyle = '#070815';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${ag.name}`, 18, 22);
          ctx.restore();
        });
      }

      // Main Cursor
      const cx = (cursorState.x / 100) * W;
      const cy = (cursorState.y / 100) * H;

      if (cursorMode === 'tutorial-spotlight') {
        ctx.save();
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (cursorState.isClicking) {
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + cursorState.rippleProgress * 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(cursorState.scale, cursorState.scale);
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#070815';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(18, 11);
      ctx.lineTo(10, 14);
      ctx.lineTo(7, 23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pill label
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(14, 14, 96, 20, 10);
      ctx.fill();
      ctx.fillStyle = '#070815';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(cursorState.activeLabel, 22, 28);
      ctx.restore();
    }

    ctx.restore();
  }, [sceneProgress, activeSceneIdx, scenes, cursorMode, cursorSkin, selectedPaletteId]);

  const handleRegenerateAllFromDataPack = (packOverride?: GoogleDataPackItem) => {
    const query = customPackKeyword.trim() || topic;
    const next = buildScenesFromTopic(query, category, cursorMode, packOverride);
    setScenes(next);
    setActiveSceneIdx(0);
    setSceneProgress(0);
    setStatusMessage(
      `Berhasil merakit 4 gambar baru dari "${next[0]?.packTitle}" dengan 4 transisi & animasi berbeda!`
    );
  };

  const handleShuffleNonRepeatingMotions = () => {
    const seed = Date.now();
    const tPool = NON_REPEATING_TRANSITION_PACKS.map((t) => t.id);
    const aPool = NON_REPEATING_ANIMATION_PACKS.map((a) => a.id);
    const cPool: CameraMotionType[] = [
      'zoom-in',
      'dutch-tilt',
      'orbit-3d',
      'pan-drift',
      'handheld-float',
      'zoom-out',
    ];

    setScenes((prev) =>
      prev.map((sc, i) => ({
        ...sc,
        transition: tPool[(seed + i * 3) % tPool.length],
        animation: aPool[(seed + i * 2 + 1) % aPool.length],
        cameraMotion: cPool[(seed + i * 5) % cPool.length],
      }))
    );
    setStatusMessage(
      'Transisi, Animasi, dan Kamera per Scene diacak ulang secara Anti-Kembar (0 duplikasi berurutan).'
    );
  };

  const matchedPackInfo = matchBestDataPack(customPackKeyword || topic, category);

  return (
    <div className="min-h-screen bg-[#070815] text-slate-100">
      {/* Top Studio Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/25 bg-[#0B0E22]/90 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white shadow-lg shadow-indigo-600/30">
            M
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-white">
              MOTIONID STUDIO v5.0 · SMART DATA PACK & CURSOR ENGINE
            </h1>
            <p className="font-mono text-[11px] text-cyan-400">{statusMessage}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleRegenerateAllFromDataPack()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95"
          >
            ⚡ Buat Ulang Gambar Data Pack & Animasi
          </button>
          <button
            onClick={handleShuffleNonRepeatingMotions}
            className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            🔀 Acak Transisi Beda-Beda
          </button>
        </div>
      </header>

      {/* Main 3-Column Figma x CapCut Studio */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 p-5 lg:grid-cols-12">
        {/* Left Column: Scene List & Per-Scene Non-Repeating Matrix */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-4">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              Topik & Kategori Video
            </h2>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ketik topik, misal: promo kopi susu 18rb..."
              className="mb-2.5 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white"
            />
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {(['promo', 'quote', 'edukasi'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setScenes(buildScenesFromTopic(topic, cat, cursorMode));
                  }}
                  className={`rounded-lg py-1.5 text-[11px] font-bold uppercase ${
                    category === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-2.5 text-[11px]">
              <div className="font-mono font-bold text-cyan-300">
                📦 Pack Aktif ({matchedPackInfo.confidence}% Match):
              </div>
              <div className="mt-0.5 font-semibold text-white">{matchedPackInfo.pack.title}</div>
            </div>
          </div>

          {/* 4 Scenes with Distinct Transitions & Animations */}
          <div className="space-y-2.5 rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                4 Scene (Transisi Beda Semua)
              </h2>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                Anti-Kembar
              </span>
            </div>

            {scenes.map((sc, idx) => (
              <div
                key={sc.id}
                onClick={() => {
                  setActiveSceneIdx(idx);
                  setSceneProgress(0);
                }}
                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                  activeSceneIdx === idx
                    ? 'border-cyan-400 bg-indigo-950/60 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-cyan-300">SCENE 0{idx + 1}</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                    {sc.transition}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-semibold text-white">{sc.title}</p>
                <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] text-slate-400">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5">Anim: {sc.animation}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5">Cam: {sc.cameraMotion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: 9:16 Live 60fps Canvas Preview */}
        <div className="flex flex-col items-center lg:col-span-5">
          <div className="mb-3 flex w-full items-center justify-between rounded-xl border border-indigo-500/25 bg-[#0D1127] px-4 py-2">
            <span className="font-mono text-xs font-bold text-cyan-300">
              PREVIEW 9:16 · SCENE 0{activeSceneIdx + 1}/04
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => setSceneProgress(0)}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200"
              >
                ↺ Replay
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border-2 border-indigo-500/40 bg-black shadow-2xl shadow-indigo-950/60">
            <canvas ref={canvasRef} width={360} height={640} className="block h-[540px] w-[304px]" />
          </div>
        </div>

        {/* Right Column: Inspector Tabs (Smart Data Pack, Non-Repeating Transitions, Cursor Mode) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-2">
            <button
              onClick={() => setActiveTab('datapack')}
              className={`rounded-xl py-2 text-xs font-bold ${
                activeTab === 'datapack' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              🖼️ Data Pack
            </button>
            <button
              onClick={() => setActiveTab('transitions')}
              className={`rounded-xl py-2 text-xs font-bold ${
                activeTab === 'transitions' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              🔀 Transisi Beda
            </button>
            <button
              onClick={() => setActiveTab('cursor')}
              className={`rounded-xl py-2 text-xs font-bold ${
                activeTab === 'cursor' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              🖱️ Mode Kursor
            </button>
          </div>

          {activeTab === 'datapack' && (
            <div className="space-y-3 rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-4">
              <h3 className="text-sm font-extrabold text-white">
                Sistem Pembuat Gambar dari Google/Web Data Pack
              </h3>
              <p className="text-xs text-slate-300">
                Engine otomatis merakit vektor produk, gradien atmosferik, stiker harga, dan komposisi poster dari klaster Data Pack sesuai kata kunci.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPackKeyword}
                  onChange={(e) => setCustomPackKeyword(e.target.value)}
                  placeholder="Cari Data Pack (misal: kopi, skincare, nextjs, pb)..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => handleRegenerateAllFromDataPack()}
                  className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-extrabold text-slate-950"
                >
                  Rakit
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {GOOGLE_VISUAL_DATA_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => handleRegenerateAllFromDataPack(pack)}
                    className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 hover:border-cyan-400/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{pack.title}</span>
                      <span
                        style={{ backgroundColor: pack.accentColor }}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] font-black text-slate-950"
                      >
                        {pack.vectorRigType}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      Keywords: {pack.keywords.slice(0, 6).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transitions' && (
            <div className="space-y-3 rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-4">
              <h3 className="text-sm font-extrabold text-white">
                Variasi Transisi & Animasi (Dijamin Berbeda Tiap Scene)
              </h3>
              <p className="text-xs text-slate-300">
                Ubah transisi masuk dan animasi teks untuk Scene 0{activeSceneIdx + 1} atau acak anti-kembar untuk semua scene.
              </p>

              <div>
                <label className="mb-1 block text-xs font-bold text-indigo-300">
                  Transisi Scene 0{activeSceneIdx + 1}:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {NON_REPEATING_TRANSITION_PACKS.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        setScenes((prev) =>
                          prev.map((s, idx) =>
                            idx === activeSceneIdx ? { ...s, transition: tr.id } : s
                          )
                        );
                        setSceneProgress(0);
                      }}
                      className={`rounded-xl border p-2 text-left text-[11px] ${
                        scenes[activeSceneIdx]?.transition === tr.id
                          ? 'border-cyan-400 bg-cyan-500/15 font-bold text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <div>{tr.name}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">{tr.durationMs}ms</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-indigo-300">
                  Animasi Elemen Scene 0{activeSceneIdx + 1}:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {NON_REPEATING_ANIMATION_PACKS.map((an) => (
                    <button
                      key={an.id}
                      onClick={() => {
                        setScenes((prev) =>
                          prev.map((s, idx) =>
                            idx === activeSceneIdx ? { ...s, animation: an.id } : s
                          )
                        );
                        setSceneProgress(0);
                      }}
                      className={`rounded-xl border p-2 text-left text-[11px] ${
                        scenes[activeSceneIdx]?.animation === an.id
                          ? 'border-amber-400 bg-amber-500/15 font-bold text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      {an.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="space-y-3 rounded-2xl border border-indigo-500/25 bg-[#0D1127] p-4">
              <h3 className="text-sm font-extrabold text-white">
                Mode Animasi Kursor Pintar
              </h3>
              <p className="text-xs text-slate-300">
                Pilih gaya koreografi kursor yang berinteraksi langsung dengan elemen video di dalam kanvas:
              </p>

              <div className="space-y-2">
                {(
                  [
                    {
                      id: 'single-pro',
                      title: '🖱️ Single Pro Director (@depup.web Style)',
                      desc: '1 kursor pintar dengan kamera auto-zoom, blok highlight teks kuning, dan efek klik ripple.',
                    },
                    {
                      id: 'multi-agent-swarm',
                      title: '🐝 Multi-Agent Cursor Swarm (@voynann Style)',
                      desc: '5 kursor agen AI (Director, DataPack, MotionRK4, Typography, ShaderFX) merakit scene bareng.',
                    },
                    {
                      id: 'tutorial-spotlight',
                      title: '🔦 Tutorial Spotlight Halo',
                      desc: 'Kursor dengan lingkaran cahaya fokus untuk menyorot harga promo atau langkah tutorial.',
                    },
                    {
                      id: 'off',
                      title: '🚫 Tanpa Kursor (Clean Cinematic)',
                      desc: 'Murni menampilkan transisi & motion graphic tanpa overlay kursor.',
                    },
                  ] as Array<{ id: CursorAnimationMode; title: string; desc: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCursorMode(item.id);
                      setSceneProgress(0);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      cursorMode === item.id
                        ? 'border-amber-400 bg-amber-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{item.title}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
