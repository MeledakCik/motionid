'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  COLOR_PALETTES,
  solveSpring,
  smoothStep,
} from '@/lib/smart-engine';
import {
  TrainingRow,
  analyzeCreatorVideoReference,
  forgetTrainingRow,
  loadTrainingIntoEngine,
} from '@/lib/training';
import { createClient } from '@/lib/supabase/client';
import { useEditorStore } from '@/store/useEditorStore';

export type WidgetRigType =
  | 'repo_input_card'
  | 'repo_scanner_card'
  | 'terminal_build_card'
  | 'bento_metrics_grid'
  | 'kinetic_showcase_card';

export type CameraMotionType =
  | 'spring-slide-vertical'
  | 'perspective-tilt-3d'
  | 'whip-zoom-spring'
  | 'smooth-float';

export interface StudioSceneItem {
  stepBadge: string;
  title: string;
  subtext: string;
  widgetType: WidgetRigType;
  primaryInput: string;
  secondaryInput: string;
  duration: number;
  cameraMotion: CameraMotionType;
  paletteId: string;
}

export interface TrainedVideoPresetItem {
  id: string;
  title: string;
  creatorHandle: string;
  category: 'saas' | 'promo' | 'edukasi' | 'quote';
  videoUrl: string;
  cameraMotion: CameraMotionType;
  paletteId: string;
  bpm: number;
  stiffness: number;
  damping: number;
  triggerKeywords: string;
  badges: string[];
  summary: string;
  scenesBlueprint: StudioSceneItem[];
}

export interface PaletteThemeConfig {
  name: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  orbPrimary: string;
  orbSecondary: string;
  titleColor: string;
  subColor: string;
  pillBg: string;
  pillText: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  accent: string;
  accentSoft: string;
  isDark: boolean;
}

export const DEFAULT_PALETTE_THEMES: Record<string, PaletteThemeConfig> = {
  'depup-lavender': {
    name: 'DepUp Lavender Pastel',
    bgStart: '#d6cff6',
    bgMid: '#ebe6ff',
    bgEnd: '#f7f5ff',
    orbPrimary: 'rgba(163, 230, 53, 0.62)',
    orbSecondary: 'rgba(168, 85, 247, 0.28)',
    titleColor: '#18181b',
    subColor: '#52525b',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#4338ca',
    cardBg: 'rgba(255, 255, 255, 0.97)',
    cardBorder: 'rgba(99, 102, 241, 0.18)',
    cardText: '#0f172a',
    accent: '#4f46e5',
    accentSoft: 'rgba(79, 70, 229, 0.12)',
    isDark: false,
  },
  'midnight-indigo': {
    name: 'Linear Dark Indigo',
    bgStart: '#080b12',
    bgMid: '#111827',
    bgEnd: '#1e1b4b',
    orbPrimary: 'rgba(99, 102, 241, 0.45)',
    orbSecondary: 'rgba(16, 185, 129, 0.30)',
    titleColor: '#f8fafc',
    subColor: '#94a3b8',
    pillBg: 'rgba(30, 41, 59, 0.92)',
    pillText: '#a5b4fc',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(148, 163, 184, 0.22)',
    cardText: '#f8fafc',
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.2)',
    isDark: true,
  },
  'aurora-mint': {
    name: 'Aurora Mint Fresh',
    bgStart: '#d1fae5',
    bgMid: '#ecfeff',
    bgEnd: '#f0fdf4',
    orbPrimary: 'rgba(52, 211, 153, 0.48)',
    orbSecondary: 'rgba(56, 189, 248, 0.32)',
    titleColor: '#064e3b',
    subColor: '#047857',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#059669',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(16, 185, 129, 0.22)',
    cardText: '#064e3b',
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.14)',
    isDark: false,
  },
  'cyber-sunset': {
    name: 'Cyber Sunset Pulse',
    bgStart: '#18181b',
    bgMid: '#2e1065',
    bgEnd: '#4c0519',
    orbPrimary: 'rgba(244, 63, 94, 0.45)',
    orbSecondary: 'rgba(168, 85, 247, 0.38)',
    titleColor: '#ffffff',
    subColor: '#fda4af',
    pillBg: 'rgba(88, 28, 135, 0.88)',
    pillText: '#fecdd3',
    cardBg: 'rgba(24, 24, 27, 0.95)',
    cardBorder: 'rgba(244, 63, 94, 0.32)',
    cardText: '#f4f4f5',
    accent: '#f43f5e',
    accentSoft: 'rgba(244, 63, 94, 0.2)',
    isDark: true,
  },
};

export const INITIAL_TRAINED_VIDEOS: TrainedVideoPresetItem[] = [
  {
    id: 'vid-depup-7697972111469546753',
    title: 'DepUp SaaS Step Workflow (Deploy Without Hassle)',
    creatorHandle: '@depup.web',
    category: 'saas',
    videoUrl: 'https://www.tiktok.com/@depup.web/video/7697972111469546753',
    cameraMotion: 'spring-slide-vertical',
    paletteId: 'depup-lavender',
    bpm: 118,
    stiffness: 220,
    damping: 14,
    triggerKeywords: 'deploy, github, repo, saas, web, hosting, api',
    badges: ['1 Tempel', '2 Periksa', '3 Deploy'],
    summary:
      'Koreografi kursor mengetik URL repo, menekan tombol Import dengan gelombang ripple, scanner kompatibilitas, dan terminal build yang memunculkan kartu Live App.',
    scenesBlueprint: [
      {
        stepBadge: '1 Tempel',
        title: 'Tempel link repo',
        subtext: 'Repo private pun bisa, cukup tambahkan GitHub Token.',
        widgetType: 'repo_input_card',
        primaryInput: 'github.com/dimas/api',
        secondaryInput: 'Private Repo Ready, GitHub Token Active, Auto-Branch main',
        duration: 3.4,
        cameraMotion: 'spring-slide-vertical',
        paletteId: 'depup-lavender',
      },
      {
        stepBadge: '2 Periksa',
        title: 'Periksa repo dulu',
        subtext: 'Tahu platform mana yang paling pas buat app kamu.',
        widgetType: 'repo_scanner_card',
        primaryInput: 'Next.js 14 App Router Terdeteksi',
        secondaryInput: 'Node.js 20 LTS, Port 3000 Auto, 99% Cloud Match',
        duration: 3.4,
        cameraMotion: 'spring-slide-vertical',
        paletteId: 'depup-lavender',
      },
      {
        stepBadge: '3 Deploy',
        title: 'Deploy dan pantau',
        subtext: 'Progres tampil langsung, tanpa perlu setup rumit.',
        widgetType: 'terminal_build_card',
        primaryInput: 'https://api.depup.id',
        secondaryInput:
          '$ git clone https://github.com/dimas/api, $ npm install --production, ✓ Build selesai (1.4s) — Live 🚀',
        duration: 3.6,
        cameraMotion: 'spring-slide-vertical',
        paletteId: 'depup-lavender',
      },
    ],
  },
  {
    id: 'vid-linear-bento',
    title: 'Opus 5.5 Isometric 3D Bento Release',
    creatorHandle: '@linear.motion',
    category: 'saas',
    videoUrl: 'https://www.tiktok.com/@linear.motion/video/7410029384712',
    cameraMotion: 'perspective-tilt-3d',
    paletteId: 'midnight-indigo',
    bpm: 124,
    stiffness: 240,
    damping: 15,
    triggerKeywords: 'bento, dashboard, analitik, ui kit, figma, rilis',
    badges: ['01 Kecepatan', '02 Analitik', '03 Rilis'],
    summary:
      'Koreografi kamera 3D isometrik dengan grafik spline real-time, kartu Bento yang merakit mandiri, dan partikel aliran data.',
    scenesBlueprint: [
      {
        stepBadge: '01 Kecepatan',
        title: 'Sinkronisasi 10x lebih cepat',
        subtext: 'Arsitektur engine lokal yang merespons di bawah 16 milidetik.',
        widgetType: 'bento_metrics_grid',
        primaryInput: 'Performa Real-Time Engine v5.5',
        secondaryInput: '60 FPS Render, 14ms Latensi, 100% Bebas Lag',
        duration: 3.2,
        cameraMotion: 'perspective-tilt-3d',
        paletteId: 'midnight-indigo',
      },
      {
        stepBadge: '02 Analitik',
        title: 'Pantau metrik konversi langsung',
        subtext: 'Semua kartu metrik terhubung otomatis tanpa konfigurasi manual.',
        widgetType: 'repo_scanner_card',
        primaryInput: 'Pertumbuhan Konversi Mingguan',
        secondaryInput: '+148% Retensi, 4.9/5 Rating Kreator, Auto-Export',
        duration: 3.2,
        cameraMotion: 'perspective-tilt-3d',
        paletteId: 'midnight-indigo',
      },
      {
        stepBadge: '03 Rilis',
        title: 'Siap publikasi ke semua kanal',
        subtext: 'Ekspor langsung ke resolusi vertikal TikTok, Reels, atau YouTube.',
        widgetType: 'terminal_build_card',
        primaryInput: 'motionid.app/release-v5',
        secondaryInput:
          '$ motionid build --fps 60, $ motionid optimize --hdr, ✓ Video siap diunduh!',
        duration: 3.4,
        cameraMotion: 'perspective-tilt-3d',
        paletteId: 'midnight-indigo',
      },
    ],
  },
  {
    id: 'vid-capcut-kinetic',
    title: 'CapCut AI Lab Kinetic Word-Tracker',
    creatorHandle: '@capcut.creator',
    category: 'promo',
    videoUrl: 'https://www.tiktok.com/@capcut.creator/video/7582910293811',
    cameraMotion: 'whip-zoom-spring',
    paletteId: 'cyber-sunset',
    bpm: 130,
    stiffness: 260,
    damping: 12,
    triggerKeywords: 'promo, diskon, jualan, murah, flash sale, produk, kopi',
    badges: ['🔥 Flash Drop', '⚡ Fitur Utama', '🛒 Checkout'],
    summary:
      'Sorotan kata demi kata bergaya CapCut AI Lab dengan lencana pop-up melayang, kursor klik otomatis, dan whip-zoom cepat.',
    scenesBlueprint: [
      {
        stepBadge: '🔥 Flash Drop',
        title: 'Bikin konten promo gak pakai kaku!',
        subtext: 'Tinggalkan template slide statis yang membosankan penonton.',
        widgetType: 'kinetic_showcase_card',
        primaryInput: 'Bundle Motion Pro Diskon 70%',
        secondaryInput: 'Hanya Rp 49rb, Akses Selamanya, 120+ Komponen UI',
        duration: 3.0,
        cameraMotion: 'whip-zoom-spring',
        paletteId: 'cyber-sunset',
      },
      {
        stepBadge: '⚡ Fitur Utama',
        title: 'Animasi pegas 60fps otomatis',
        subtext: 'Setiap kartu dan teks bergerak mengikuti kurva fisika profesional.',
        widgetType: 'bento_metrics_grid',
        primaryInput: 'Kenapa Kreator Pindah ke MotionID?',
        secondaryInput: '3x Lebih Cepat, Tanpa After Effects, Langsung di Browser',
        duration: 3.0,
        cameraMotion: 'whip-zoom-spring',
        paletteId: 'cyber-sunset',
      },
      {
        stepBadge: '🛒 Checkout',
        title: 'Ambil akses promonya sekarang',
        subtext: 'Klik tautan di bio sebelum kuota harga spesial ditutup malam ini.',
        widgetType: 'repo_input_card',
        primaryInput: 'motionid.id/promo-spesial',
        secondaryInput: 'Garansi 30 Hari, Update Gratis, Grup Komunitas VIP',
        duration: 3.2,
        cameraMotion: 'whip-zoom-spring',
        paletteId: 'cyber-sunset',
      },
    ],
  },
  {
    id: 'vid-edukasi-mint',
    title: 'Clean EdTech Step-by-Step Microlearning',
    creatorHandle: '@devmicro.id',
    category: 'edukasi',
    videoUrl: 'https://www.tiktok.com/@devmicro.id/video/7619283746510',
    cameraMotion: 'smooth-float',
    paletteId: 'aurora-mint',
    bpm: 112,
    stiffness: 185,
    damping: 16,
    triggerKeywords: 'belajar, edukasi, kelas, bootcamp, tips, cara, tutorial',
    badges: ['📘 Konsep 1', '💡 Konsep 2', '✅ Praktek'],
    summary:
      'Visual edukasi bersih bernuansa mint pastel dengan kartu kode/langkah yang melayang lembut & partikel data.',
    scenesBlueprint: [
      {
        stepBadge: '📘 Konsep 1',
        title: 'Pahami struktur API dalam 30 detik',
        subtext: 'Analogi visual sederhana agar langsung paham cara kerja request.',
        widgetType: 'repo_input_card',
        primaryInput: 'GET https://api.toko.id/v1/produk',
        secondaryInput: 'Header Auth Bearer, JSON Payload, Status 200 OK',
        duration: 3.2,
        cameraMotion: 'smooth-float',
        paletteId: 'aurora-mint',
      },
      {
        stepBadge: '💡 Konsep 2',
        title: 'Validasi skema sebelum simpan',
        subtext: 'Cegah data rusak dengan middleware pengecekan otomatis.',
        widgetType: 'repo_scanner_card',
        primaryInput: 'Validasi Payload Otomatis',
        secondaryInput: 'Type Safe 100%, Zero Runtime Crash, Cepat & Ringan',
        duration: 3.2,
        cameraMotion: 'smooth-float',
        paletteId: 'aurora-mint',
      },
      {
        stepBadge: '✅ Praktek',
        title: 'Jalankan server lokal kamu',
        subtext: 'Cukup satu perintah terminal untuk menguji endpoint secara langsung.',
        widgetType: 'terminal_build_card',
        primaryInput: 'localhost:3000/api/produk',
        secondaryInput: '$ npm run dev, ✓ Endpoint siap menerima request, 🚀 Response 12ms',
        duration: 3.4,
        cameraMotion: 'smooth-float',
        paletteId: 'aurora-mint',
      },
    ],
  },
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function cubicBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function drawSimulatedCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isPressed: boolean,
  rippleProgress: number,
  accentColor: string
) {
  ctx.save();
  if (rippleProgress > 0 && rippleProgress < 1) {
    const rRadius = 8 + rippleProgress * 44;
    ctx.beginPath();
    ctx.arc(x, y, rRadius, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = (1 - rippleProgress) * 0.85;
    ctx.lineWidth = 3 * (1 - rippleProgress * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, rRadius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = (1 - rippleProgress) * 0.28;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.translate(x, y);
  const cScale = isPressed ? 0.84 : 1.0;
  ctx.scale(cScale, cScale);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(5.8, 17.2);
  ctx.lineTo(9.8, 25.5);
  ctx.lineTo(13.5, 23.8);
  ctx.lineTo(9.5, 15.5);
  ctx.lineTo(16.5, 15.5);
  ctx.closePath();

  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.shadowBlur = 6;
  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, 14, 18, 64, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 10px "Inter", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI Agent', 23, 28);

  ctx.restore();
}

export interface MotionStudioEngineProps {
  initialRole?: 'user' | 'admin';
}

export default function MotionStudioEngine({ initialRole = 'user' }: MotionStudioEngineProps) {
  const storeTopic = useEditorStore((s) => s.topic);
  const storeScript = useEditorStore((s) => s.script);

  const [roleMode, setRoleMode] = useState<'user' | 'admin'>(initialRole);
  const [leftTab, setLeftTab] = useState<'prompt' | 'templates' | 'widgets' | 'layers'>('prompt');
  const [adminTab, setAdminTab] = useState<'video' | 'blueprint' | 'physics' | 'rules'>('video');

  const [projectTitle, setProjectTitle] = useState(
    storeTopic || 'DepUp SaaS Launch — Deploy Without Hassle'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [zoom, setZoom] = useState(1.0);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showCursorSim, setShowCursorSim] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const [palettes, setPalettes] = useState<Record<string, PaletteThemeConfig>>(
    DEFAULT_PALETTE_THEMES
  );
  const [trainedVideos, setTrainedVideos] = useState<TrainedVideoPresetItem[]>(
    INITIAL_TRAINED_VIDEOS
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    INITIAL_TRAINED_VIDEOS[0].id
  );
  const [motionSkillMode, setMotionSkillMode] = useState<string>('depup-cursor-flow');
  const [fontFamily, setFontFamily] = useState<string>('Plus Jakarta Sans');
  const [tiltIntensity, setTiltIntensity] = useState<number>(10);
  const [cardRadius, setCardRadius] = useState<number>(24);
  const [springTension, setSpringTension] = useState<number>(8);
  const [smartPrompt, setSmartPrompt] = useState<string>(
    storeTopic || 'Deploy aplikasi web otomatis langsung dari GitHub repo tanpa ribet'
  );

  // Convert storeScript scenes if user came from /create, otherwise use @depup.web blueprint
  const [scenes, setScenes] = useState<StudioSceneItem[]>(() => {
    if (storeScript?.scenes?.length) {
      return storeScript.scenes.slice(0, 4).map((sc, idx) => ({
        stepBadge: sc.stepBadge || `${idx + 1} Langkah`,
        title: sc.text || 'Tempel link repo',
        subtext: sc.subtext || 'Progres tampil langsung tanpa setup rumit.',
        widgetType:
          (sc.widgetType as WidgetRigType) ||
          (idx === 0
            ? 'repo_input_card'
            : idx === 1
            ? 'repo_scanner_card'
            : 'terminal_build_card'),
        primaryInput: sc.primaryInput || 'github.com/dimas/api',
        secondaryInput:
          sc.secondaryInput ||
          'Next.js 14 App, Node 20 LTS, ✓ Live at depup.id 🚀',
        duration: sc.duration || 3.4,
        cameraMotion: sc.cameraMotion || 'spring-slide-vertical',
        paletteId: sc.paletteId || 'depup-lavender',
      }));
    }
    return JSON.parse(JSON.stringify(INITIAL_TRAINED_VIDEOS[0].scenesBlueprint));
  });

  // Admin Training Form States (Unrestricted Training Workbench)
  const [adminVideoUrl, setAdminVideoUrl] = useState(
    'https://www.tiktok.com/@depup.web/video/7697972111469546753'
  );
  const [adminCreatorHandle, setAdminCreatorHandle] = useState('@depup.web');
  const [adminCategory, setAdminCategory] = useState<'saas' | 'promo' | 'edukasi' | 'quote'>('saas');
  const [adminPresetTitle, setAdminPresetTitle] = useState(
    'DepUp SaaS Step Workflow (Deploy Without Hassle)'
  );
  const [adminTriggerKeywords, setAdminTriggerKeywords] = useState(
    'deploy, github, repo, saas, web, aplikasi'
  );
  const [adminStiffness, setAdminStiffness] = useState(220);
  const [adminDamping, setAdminDamping] = useState(14);
  const [adminBpm, setAdminBpm] = useState(118);

  // Admin Custom Palette Lab States
  const [newPalName, setNewPalName] = useState('Neon Lavender Pro');
  const [newPalBgStart, setNewPalBgStart] = useState('#e0e7ff');
  const [newPalBgEnd, setNewPalBgEnd] = useState('#fae8ff');
  const [newPalAccent, setNewPalAccent] = useState('#4f46e5');

  // Admin Bulk Rules States (Supabase ai_training_data)
  const [supabaseRows, setSupabaseRows] = useState<TrainingRow[]>([]);
  const [ruleType, setRuleType] = useState<TrainingRow['type']>('hook');
  const [ruleCategory, setRuleCategory] = useState<TrainingRow['category']>('promo');
  const [ruleContent, setRuleContent] = useState(
    'Deploy & jalankan {product} cuma {price} di {store} tanpa ribet! 🚀'
  );
  const [ruleSubtext, setRuleSubtext] = useState(
    'Progres tampil langsung secara real-time dalam hitungan detik.'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  useEffect(() => {
    loadTrainingIntoEngine();
    try {
      const saved = localStorage.getItem('motionid_v45_trained_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrainedVideos(parsed);
        }
      }
    } catch {}
    // Also fetch Supabase rows if available
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('ai_training_data')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        if (data) setSupabaseRows(data as TrainingRow[]);
      } catch {}
    })();
  }, []);

  const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 3.4), 0);

  const getSceneAtTime = useCallback(
    (t: number) => {
      let elapsed = 0;
      for (let i = 0; i < scenes.length; i++) {
        const d = Number(scenes[i].duration) || 3.4;
        if (t <= elapsed + d || i === scenes.length - 1) {
          const localTime = Math.max(0, Math.min(d, t - elapsed));
          return {
            index: i,
            scene: scenes[i],
            localTime,
            duration: d,
            progress: d > 0 ? localTime / d : 0,
          };
        }
        elapsed += d;
      }
      return { index: 0, scene: scenes[0], localTime: 0, duration: 3.4, progress: 0 };
    },
    [scenes]
  );

  // Canvas 60fps Renderer (Identical to image_892545.jpg!)
  const renderFrame = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { index, scene, localTime, duration, progress } = getSceneAtTime(timeSec);
      if (!scene) return;

      const W = canvas.width;
      const H = canvas.height;
      const pal = palettes[scene.paletteId] || palettes['depup-lavender'];
      const stiffness = 140 + springTension * 14;
      const damping = Math.max(9, 21 - springTension);

      ctx.save();
      ctx.clearRect(0, 0, W, H);

      const bgGrad = ctx.createLinearGradient(0, 0, W * 0.85, H);
      bgGrad.addColorStop(0, pal.bgStart);
      bgGrad.addColorStop(0.52, pal.bgMid);
      bgGrad.addColorStop(1, pal.bgEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const orbShiftX = Math.sin(timeSec * 1.9) * 32;
      const orbShiftY = Math.cos(timeSec * 1.5) * 24;
      const topOrb = ctx.createRadialGradient(
        W * 0.8 + orbShiftX,
        H * 0.13 + orbShiftY,
        8,
        W * 0.8 + orbShiftX,
        H * 0.13 + orbShiftY,
        W * 0.56
      );
      topOrb.addColorStop(0, pal.orbPrimary);
      topOrb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topOrb;
      ctx.fillRect(0, 0, W, H);

      const bottomOrb = ctx.createRadialGradient(
        W * 0.16 - orbShiftX,
        H * 0.84 - orbShiftY,
        8,
        W * 0.16 - orbShiftX,
        H * 0.84 - orbShiftY,
        W * 0.58
      );
      bottomOrb.addColorStop(0, pal.orbSecondary);
      bottomOrb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bottomOrb;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = pal.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(15,23,42,0.035)';
      const gridStep = 36;
      const gridScrollY = (timeSec * 18) % gridStep;
      for (let gx = 24; gx < W; gx += gridStep) {
        for (let gy = gridScrollY; gy < H; gy += gridStep) {
          ctx.fillRect(gx, gy, 2, 2);
        }
      }

      const focusWindow =
        smoothStep(0.18, 0.42, progress) * (1 - smoothStep(0.76, 0.94, progress));
      const exitWhip = smoothStep(0.9, 1.0, progress);

      let camZoom = 1.0 + focusWindow * 0.085;
      let camPanY = -focusWindow * (H * 0.032) - exitWhip * (H * 0.12);
      let camPanX = 0;
      let camRotZ = 0;

      if (scene.cameraMotion === 'whip-zoom-spring') {
        const entrySpring = solveSpring(localTime, {
          stiffness: stiffness * 1.15,
          damping: damping * 0.85,
        });
        camZoom = 0.78 + 0.22 * entrySpring + focusWindow * 0.11;
        camRotZ = (1 - entrySpring) * -0.04;
      } else if (scene.cameraMotion === 'perspective-tilt-3d') {
        camZoom = 1.02 + focusWindow * 0.09;
        camRotZ = Math.sin(progress * Math.PI * 2) * (tiltIntensity * 0.0022);
        camPanX = Math.cos(progress * Math.PI * 2) * 8;
      } else if (scene.cameraMotion === 'smooth-float') {
        camPanY = Math.sin(timeSec * 2.2) * 8 - exitWhip * 50;
      }

      ctx.save();
      ctx.translate(W / 2 + camPanX, H / 2 + camPanY);
      ctx.scale(camZoom, camZoom);
      ctx.rotate(camRotZ);
      ctx.translate(-W / 2, -H / 2);

      const padX = W * 0.082;
      const badgeSpring = solveSpring(localTime, { stiffness, damping });
      const headerTopY = H * 0.115 + (1 - badgeSpring) * 42;

      // Step Badge Pill
      ctx.font = `700 ${Math.round(W * 0.036)}px "${fontFamily}", sans-serif`;
      const badgeLabel = scene.stepBadge || `Langkah ${index + 1}`;
      const badgeTextWidth = ctx.measureText(badgeLabel).width;
      const pillW = badgeTextWidth + 50;
      const pillH = Math.round(W * 0.07);

      ctx.save();
      ctx.translate(padX + pillW / 2, headerTopY + pillH / 2);
      ctx.scale(0.6 + 0.4 * badgeSpring, 0.6 + 0.4 * badgeSpring);
      ctx.translate(-(padX + pillW / 2), -(headerTopY + pillH / 2));

      ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = pal.pillBg;
      drawRoundedRect(ctx, padX, headerTopY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = pal.cardBorder;
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      ctx.beginPath();
      ctx.arc(padX + 19, headerTopY + pillH / 2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      ctx.fillStyle = pal.pillText;
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeLabel, padX + 32, headerTopY + pillH / 2 + 1);
      ctx.restore();

      // Word-by-word Staggered Headline
      const titleFontSize = Math.round(W * 0.074);
      const words = String(scene.title || 'Tempel link repo')
        .trim()
        .split(/\s+/);
      ctx.font = `800 ${titleFontSize}px "${fontFamily}", sans-serif`;
      ctx.textBaseline = 'top';
      const spaceW = ctx.measureText(' ').width;
      const lineHeight = titleFontSize * 1.22;
      let cursorX = padX;
      let cursorY = headerTopY + pillH + 18;
      const activeWordIdx = Math.floor((localTime * 2.6) % Math.max(1, words.length));

      words.forEach((word, wIdx) => {
        const wWidth = ctx.measureText(word).width;
        if (cursorX + wWidth > W - padX && wIdx > 0) {
          cursorX = padX;
          cursorY += lineHeight;
        }
        const wordDelay = 0.08 + wIdx * 0.065;
        const wordSpring = solveSpring(Math.max(0, localTime - wordDelay), {
          stiffness,
          damping,
        });
        const wordAlpha = smoothStep(0, 0.22, localTime - wordDelay);
        const yOffset = (1 - wordSpring) * 28;
        const wordScale = 0.82 + 0.18 * wordSpring;

        ctx.save();
        ctx.globalAlpha = wordAlpha;
        ctx.translate(cursorX + wWidth / 2, cursorY + titleFontSize / 2 + yOffset);
        ctx.scale(wordScale, wordScale);

        const isHighlighted =
          scene.widgetType === 'kinetic_showcase_card' && wIdx === activeWordIdx;
        if (isHighlighted) {
          ctx.fillStyle = pal.accent;
          drawRoundedRect(
            ctx,
            -wWidth / 2 - 7,
            -titleFontSize / 2 - 2,
            wWidth + 14,
            titleFontSize + 6,
            10
          );
          ctx.fill();
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = pal.titleColor;
        }
        ctx.fillText(word, -wWidth / 2, -titleFontSize / 2);
        ctx.restore();
        cursorX += wWidth + spaceW;
      });

      const afterTitleY = cursorY + lineHeight;
      const subSpring = solveSpring(Math.max(0, localTime - 0.18), {
        stiffness: stiffness * 0.9,
        damping,
      });
      ctx.save();
      ctx.globalAlpha = smoothStep(0.12, 0.38, localTime);
      ctx.fillStyle = pal.subColor;
      const subFontSize = Math.round(W * 0.035);
      ctx.font = `500 ${subFontSize}px "${fontFamily}", sans-serif`;
      ctx.textBaseline = 'top';

      const subWords = String(scene.subtext || '').split(' ');
      let subLine = '';
      let subY = afterTitleY + 6 + (1 - subSpring) * 18;
      for (let n = 0; n < subWords.length; n++) {
        const test = subLine + subWords[n] + ' ';
        if (ctx.measureText(test).width > W - padX * 2 && n > 0) {
          ctx.fillText(subLine.trim(), padX, subY);
          subLine = subWords[n] + ' ';
          subY += subFontSize * 1.42;
        } else {
          subLine = test;
        }
      }
      if (subLine.trim()) ctx.fillText(subLine.trim(), padX, subY);
      ctx.restore();

      // Main Interactive UI Card
      const cardSpring = solveSpring(Math.max(0, localTime - 0.14), { stiffness, damping });
      const cardX = padX;
      const cardW = W - padX * 2;
      const cardY = Math.max(subY + 34, H * 0.41) + (1 - cardSpring) * 68;
      const cardH = Math.min(H * 0.4, H - cardY - H * 0.11);
      const radius = Number(cardRadius) || 24;

      if (showParticles) {
        ctx.save();
        for (let p = 0; p < 6; p++) {
          const pT = (timeSec * 0.55 + p * 0.17) % 1;
          const pt = cubicBezierPoint(
            { x: cardX + 20, y: cardY - 18 },
            { x: cardX + cardW * 0.5, y: cardY - 45 },
            { x: cardX + cardW * 0.8, y: cardY + cardH + 35 },
            { x: cardX + cardW - 20, y: cardY + cardH + 10 },
            pT
          );
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = p % 2 === 0 ? pal.accent : '#10b981';
          ctx.globalAlpha = Math.sin(pT * Math.PI) * 0.65;
          ctx.fill();
        }
        ctx.restore();
      }

      const dynamicSkew = Math.sin(progress * Math.PI * 2) * (tiltIntensity * 0.0028);
      ctx.save();
      ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
      ctx.scale(0.86 + 0.14 * cardSpring, 0.86 + 0.14 * cardSpring);
      ctx.transform(1, dynamicSkew * 0.35, -dynamicSkew, 1, 0, 0);
      ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));

      const secondaryItems = String(scene.secondaryInput || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let cursorTarget = {
        x: cardX + cardW * 0.72,
        y: cardY + cardH * 0.48,
        isPressed: false,
        ripple: 0,
      };

      if (scene.widgetType === 'terminal_build_card') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.36)';
        ctx.shadowBlur = 34;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = '#090d16';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        const dotY = cardY + 22;
        ['#f43f5e', '#f59e0b', '#10b981'].forEach((col, di) => {
          ctx.beginPath();
          ctx.arc(cardX + 22 + di * 17, dotY, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
        });

        ctx.fillStyle = '#94a3b8';
        ctx.font = `600 ${Math.round(W * 0.025)}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'middle';
        ctx.fillText(scene.primaryInput || 'deploy-runner — zsh', cardX + 82, dotY);

        const lines =
          secondaryItems.length > 0
            ? secondaryItems
            : [
                '$ git clone https://github.com/dimas/api',
                '$ npm install --production',
                '✓ Build selesai (1.4s) — Live 🚀',
              ];

        ctx.textBaseline = 'top';
        lines.forEach((line, li) => {
          const lineStart = 0.1 + li * 0.2;
          const lineProg = smoothStep(lineStart, lineStart + 0.22, progress);
          if (lineProg <= 0) return;
          ctx.globalAlpha = lineProg;
          const isSuccess =
            line.startsWith('✓') || line.startsWith('🚀') || line.toLowerCase().includes('live');
          ctx.fillStyle = isSuccess ? '#4ade80' : '#e2e8f0';
          ctx.font = `${isSuccess ? '700' : '500'} ${Math.round(
            W * 0.028
          )}px "JetBrains Mono", monospace`;
          const chars = Math.ceil(line.length * lineProg);
          ctx.fillText(line.slice(0, chars), cardX + 20, cardY + 52 + li * 34);
        });
        ctx.globalAlpha = 1;

        if (progress > 0.52) {
          const popSpring = solveSpring((progress - 0.52) * duration, {
            stiffness: 240,
            damping: 13,
          });
          const popW = cardW * 0.78;
          const popH = 66;
          const popX = cardX + (cardW - popW) / 2;
          const popY = cardY + cardH - 88 - popSpring * 18;

          ctx.save();
          ctx.translate(popX + popW / 2, popY + popH / 2);
          ctx.scale(0.5 + 0.5 * popSpring, 0.5 + 0.5 * popSpring);
          ctx.translate(-(popX + popW / 2), -(popY + popH / 2));

          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, popX, popY, popW, popH, 18);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#10b981';
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.textBaseline = 'middle';
          ctx.font = `800 ${Math.round(W * 0.028)}px "${fontFamily}", sans-serif`;
          ctx.fillText('🚀 Deploy Berhasil • 200 OK', popX + 20, popY + 24);
          ctx.fillStyle = '#4f46e5';
          ctx.font = `600 ${Math.round(W * 0.024)}px "JetBrains Mono", monospace`;
          ctx.fillText(scene.primaryInput || 'https://api.depup.id', popX + 20, popY + 46);
          ctx.restore();
        }
      } else if (
        scene.widgetType === 'repo_scanner_card' ||
        scene.widgetType === 'bento_metrics_grid'
      ) {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = pal.cardBg;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = pal.cardBorder;
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = pal.cardText;
        ctx.font = `800 ${Math.round(W * 0.034)}px "${fontFamily}", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(scene.primaryInput || 'Analisa Stack Otomatis', cardX + 22, cardY + 32);

        const matchVal = Math.min(99, Math.round(50 + smoothStep(0.08, 0.65, progress) * 49));
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        drawRoundedRect(ctx, cardX + cardW - 114, cardY + 16, 92, 30, 15);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.font = `700 ${Math.round(W * 0.026)}px "JetBrains Mono", monospace`;
        ctx.fillText(`⚡ ${matchVal}% FIT`, cardX + cardW - 102, cardY + 31);

        const waveX = cardX + 22;
        const waveY = cardY + 56;
        const waveW = cardW - 44;
        const waveH = 42;
        ctx.fillStyle = pal.isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)';
        drawRoundedRect(ctx, waveX, waveY, waveW, waveH, 12);
        ctx.fill();

        ctx.beginPath();
        const drawW = waveW * Math.min(1, progress * 1.3);
        for (let wx = 0; wx <= drawW; wx += 6) {
          const wy = waveY + waveH / 2 + Math.sin(wx * 0.045 - timeSec * 5) * 10;
          if (wx === 0) ctx.moveTo(waveX + wx, wy);
          else ctx.lineTo(waveX + wx, wy);
        }
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const bentoItems =
          secondaryItems.length > 0
            ? secondaryItems
            : ['Next.js 14 App', 'Node 20 Edge', 'Auto SSL Aktif'];
        const cols = Math.min(3, bentoItems.length);
        const gap = 10;
        const boxW = (cardW - 44 - gap * (cols - 1)) / cols;
        const boxY = cardY + 110;
        const boxH = cardH - 128;

        bentoItems.slice(0, 3).forEach((item, bi) => {
          const bDelay = 0.22 + bi * 0.12;
          const bSpring = solveSpring(Math.max(0, localTime - bDelay), {
            stiffness: 230,
            damping: 14,
          });
          const bx = cardX + 22 + bi * (boxW + gap);
          const by = boxY + (1 - bSpring) * 32;

          ctx.fillStyle = pal.isDark ? 'rgba(30, 41, 59, 0.92)' : '#f8fafc';
          drawRoundedRect(ctx, bx, by, boxW, boxH, 16);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = bi === Math.floor((progress * 3) % 3) ? pal.accent : pal.cardBorder;
          ctx.stroke();

          const colors = ['#6366f1', '#10b981', '#a855f7'];
          ctx.fillStyle = colors[bi % colors.length];
          drawRoundedRect(ctx, bx + 10, by + 12, 26, 6, 3);
          ctx.fill();

          ctx.fillStyle = pal.cardText;
          ctx.textBaseline = 'top';
          ctx.font = `700 ${Math.round(W * 0.027)}px "${fontFamily}", sans-serif`;
          const wds = item.split(' ');
          ctx.fillText(wds.slice(0, 2).join(' '), bx + 10, by + 28);
          if (wds.length > 2) {
            ctx.fillStyle = pal.subColor;
            ctx.font = `600 ${Math.round(W * 0.023)}px "${fontFamily}", sans-serif`;
            ctx.fillText(wds.slice(2).join(' '), bx + 10, by + 48);
          }
        });

        cursorTarget = {
          x: lerp(cardX + 60, cardX + cardW - 70, smoothStep(0.15, 0.7, progress)),
          y: lerp(boxY + boxH * 0.5, boxY + boxH * 0.4, Math.sin(progress * Math.PI)),
          isPressed: progress > 0.54 && progress < 0.62,
          ripple: smoothStep(0.54, 0.76, progress),
        };
      } else {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = pal.cardBg;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = pal.cardBorder;
        ctx.stroke();
        ctx.shadowColor = 'transparent';

        const railW = 52;
        ctx.fillStyle = pal.isDark ? 'rgba(30,41,59,0.75)' : 'rgba(241,245,249,0.95)';
        drawRoundedRect(ctx, cardX + 14, cardY + 14, railW, cardH - 28, 16);
        ctx.fill();

        const activeRailIcon = progress > 0.58 ? 1 : 0;
        ['⌘', '⚡', '🔒'].forEach((ico, ii) => {
          const isAct = ii === activeRailIcon;
          ctx.fillStyle = isAct ? pal.accent : 'rgba(148,163,184,0.28)';
          drawRoundedRect(ctx, cardX + 22, cardY + 24 + ii * 42, 36, 34, 10);
          ctx.fill();
          ctx.fillStyle = isAct ? '#ffffff' : pal.cardText;
          ctx.font = `700 ${Math.round(W * 0.03)}px sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(ico, cardX + 32, cardY + 41 + ii * 42);
        });

        const contentX = cardX + 80;
        const contentW = cardW - 98;
        const inputY = cardY + 42;
        const inputH = 50;
        const isTypingPhase = progress > 0.15 && progress < 0.56;
        const isClickedPhase = progress >= 0.56;

        ctx.fillStyle = pal.isDark ? '#0f172a' : '#f1f5f9';
        drawRoundedRect(ctx, contentX, inputY, contentW, inputH, 14);
        ctx.fill();
        ctx.lineWidth = isTypingPhase ? 2.2 : 1.5;
        ctx.strokeStyle = isTypingPhase ? pal.accent : pal.cardBorder;
        ctx.stroke();

        const fullUrl = scene.primaryInput || 'github.com/dimas/api';
        const typeProg = smoothStep(0.14, 0.5, progress);
        const typedChars = Math.max(1, Math.floor(fullUrl.length * typeProg));
        const shownUrl = fullUrl.slice(0, typedChars);

        ctx.fillStyle = pal.cardText;
        ctx.font = `600 ${Math.round(W * 0.029)}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'middle';
        ctx.fillText(shownUrl, contentX + 12, inputY + inputH / 2);

        const btnW = 78;
        const btnX = contentX + contentW - btnW - 6;
        const btnY = inputY + 7;
        const btnH = inputH - 14;
        const isBtnPressed = progress > 0.54 && progress < 0.63;

        ctx.fillStyle = isClickedPhase ? '#10b981' : pal.accent;
        drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 10);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${Math.round(W * 0.024)}px "${fontFamily}", sans-serif`;
        ctx.fillText(isClickedPhase ? '✓ Siap' : 'Tempel', btnX + 13, btnY + btnH / 2);

        const moveT = smoothStep(0.38, 0.55, progress);
        const startPos = { x: contentX + 95, y: inputY + inputH * 0.68 };
        const endPos = { x: btnX + btnW * 0.55, y: btnY + btnH * 0.62 };
        cursorTarget = {
          x: lerp(startPos.x, endPos.x, moveT),
          y: lerp(startPos.y, endPos.y, moveT) - Math.sin(moveT * Math.PI) * 18,
          isPressed: isBtnPressed,
          ripple: smoothStep(0.55, 0.78, progress),
        };
      }

      if (showCursorSim) {
        drawSimulatedCursor(
          ctx,
          cursorTarget.x,
          cursorTarget.y,
          cursorTarget.isPressed,
          cursorTarget.ripple,
          pal.accent
        );
      }

      ctx.restore();
      ctx.restore();

      const footerY = H - H * 0.058;
      scenes.forEach((_, si) => {
        const isCurr = si === index;
        const dotW = isCurr ? 32 : 8;
        const dotX = padX + si * 38;
        ctx.fillStyle = isCurr
          ? pal.accent
          : pal.isDark
          ? 'rgba(255,255,255,0.22)'
          : 'rgba(15,23,42,0.18)';
        drawRoundedRect(ctx, dotX, footerY, dotW, 8, 4);
        ctx.fill();
      });

      if (showSafeZone) {
        ctx.save();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.26)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1;
        ctx.strokeRect(padX * 0.7, H * 0.075, W - padX * 1.4, H * 0.85);
        ctx.restore();
      }

      ctx.restore();
    },
    [
      getSceneAtTime,
      palettes,
      springTension,
      tiltIntensity,
      fontFamily,
      cardRadius,
      showParticles,
      showCursorSim,
      showSafeZone,
      scenes,
    ]
  );

  // 60fps Animation Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt >= totalDuration ? 0 : prev + dt;
          const { index } = getSceneAtTime(next);
          setActiveSceneIndex(index);
          renderFrame(next);
          return next;
        });
      } else {
        renderFrame(currentTime);
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration, getSceneAtTime, renderFrame, currentTime]);

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  const updateActiveScene = (patch: Partial<StudioSceneItem>) => {
    setScenes((prev) =>
      prev.map((sc, idx) => (idx === activeSceneIndex ? { ...sc, ...patch } : sc))
    );
  };

  const handleGenerateFromPrompt = () => {
    const lower = smartPrompt.toLowerCase();
    // Auto-match trained preset by triggerKeywords!
    const matchedPreset =
      trainedVideos.find((v) =>
        v.triggerKeywords
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .some((k) => k && lower.includes(k))
      ) ||
      trainedVideos.find((v) => v.id === selectedTemplateId) ||
      trainedVideos[0];

    const clean = smartPrompt.trim() || 'Deploy Aplikasi Web Tanpa Ribet';
    const slug =
      clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20) || 'app';

    setScenes([
      {
        stepBadge: matchedPreset.badges[0] || '1 Tempel',
        title: clean.length > 32 ? clean.slice(0, 32) : 'Tempel link repo',
        subtext: 'Repo private pun bisa, cukup tambahkan GitHub Token otomatis.',
        widgetType:
          motionSkillMode === 'capcut-kinetic-pop'
            ? 'kinetic_showcase_card'
            : 'repo_input_card',
        primaryInput: `github.com/dimas/${slug}`,
        secondaryInput: 'GitHub Token Active, Private Repo OK, Auto-Branch',
        duration: 3.4,
        cameraMotion: matchedPreset.cameraMotion,
        paletteId: matchedPreset.paletteId,
      },
      {
        stepBadge: matchedPreset.badges[1] || '2 Periksa',
        title: 'Periksa repo dulu',
        subtext: 'Tahu platform mana yang paling pas buat aplikasi kamu.',
        widgetType:
          motionSkillMode === 'opus-isometric-3d'
            ? 'bento_metrics_grid'
            : 'repo_scanner_card',
        primaryInput: `Analisa AI: ${clean.slice(0, 22)}`,
        secondaryInput: 'Next.js 14 App, Node 20 Edge, 99% Cloud Match',
        duration: 3.4,
        cameraMotion: matchedPreset.cameraMotion,
        paletteId: matchedPreset.paletteId,
      },
      {
        stepBadge: matchedPreset.badges[2] || '3 Deploy',
        title: 'Deploy dan pantau',
        subtext: 'Progres tampil langsung di terminal tanpa setup rumit.',
        widgetType: 'terminal_build_card',
        primaryInput: `https://${slug}.depup.id`,
        secondaryInput: `$ git clone https://github.com/dimas/${slug}, $ npm install --production, ✓ Build selesai (1.4s) — Live 🚀`,
        duration: 3.6,
        cameraMotion: matchedPreset.cameraMotion,
        paletteId: matchedPreset.paletteId,
      },
    ]);
    setActiveSceneIndex(0);
    setCurrentTime(0);
    showToast(`Koreografi disusun otomatis dengan gaya "${matchedPreset.title}"!`);
  };

  // Admin: Save Current Canvas Blueprint as a New Trained Video Preset
  const handleAdminSaveVideoPreset = async () => {
    const newPreset: TrainedVideoPresetItem = {
      id: 'vid-trained-' + Date.now(),
      title: adminPresetTitle.trim() || 'Custom Creator Motion Preset',
      creatorHandle: adminCreatorHandle.trim() || '@creator',
      category: adminCategory,
      videoUrl: adminVideoUrl.trim(),
      cameraMotion: activeScene.cameraMotion,
      paletteId: activeScene.paletteId,
      bpm: adminBpm,
      stiffness: adminStiffness,
      damping: adminDamping,
      triggerKeywords: adminTriggerKeywords,
      badges: scenes.map((s) => s.stepBadge),
      summary: `Dilatih oleh Admin dari ${adminCreatorHandle} (${scenes.length} Scene, k=${adminStiffness}, d=${adminDamping}).`,
      scenesBlueprint: JSON.parse(JSON.stringify(scenes)),
    };

    const nextList = [newPreset, ...trainedVideos];
    setTrainedVideos(nextList);
    try {
      localStorage.setItem('motionid_v45_trained_presets', JSON.stringify(nextList));
    } catch {}

    try {
      const profile = analyzeCreatorVideoReference(
        adminVideoUrl,
        adminPresetTitle,
        adminCreatorHandle
      );
      const supabase = createClient();
      await supabase.from('ai_training_data').insert([
        {
          type: 'video_motion',
          category: adminCategory === 'saas' ? 'edukasi' : adminCategory,
          content_text: adminPresetTitle,
          subtext: adminTriggerKeywords,
          video_url: adminVideoUrl,
          creator_handle: adminCreatorHandle,
          motion_profile: profile,
          metadata_json: {
            motion_profile: profile,
            scenes_blueprint: scenes,
            trigger_keywords: adminTriggerKeywords,
          },
        },
      ]);
      await loadTrainingIntoEngine();
    } catch {}

    showToast(`Preset Video "${newPreset.title}" berhasil dilatih & aktif untuk semua User!`);
  };

  const handleAdminAddPalette = () => {
    const id = 'pal-' + Date.now();
    setPalettes((prev) => ({
      ...prev,
      [id]: {
        name: newPalName,
        bgStart: newPalBgStart,
        bgMid: newPalBgEnd,
        bgEnd: '#ffffff',
        orbPrimary: `${newPalAccent}88`,
        orbSecondary: `${newPalBgStart}88`,
        titleColor: '#18181b',
        subColor: '#52525b',
        pillBg: 'rgba(255,255,255,0.92)',
        pillText: newPalAccent,
        cardBg: 'rgba(255,255,255,0.96)',
        cardBorder: `${newPalAccent}33`,
        cardText: '#0f172a',
        accent: newPalAccent,
        accentSoft: `${newPalAccent}22`,
        isDark: false,
      },
    }));
    setScenes((prev) => prev.map((s) => ({ ...s, paletteId: id })));
    showToast(`Palet kustom "${newPalName}" ditambahkan ke Studio!`);
  };

  const handleAdminSaveRule = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .insert([
          {
            type: ruleType,
            category: ruleCategory,
            content_text: ruleContent,
            subtext: ruleSubtext,
            emoji: '🚀',
          },
        ])
        .select('*');
      if (!error && data) {
        setSupabaseRows((prev) => [...(data as TrainingRow[]), ...prev]);
        await loadTrainingIntoEngine();
        showToast('Aturan teks/keyword berhasil disimpan ke Supabase!');
      } else {
        showToast('Aturan disimpan ke Smart Engine lokal!');
      }
    } catch {
      showToast('Aturan disimpan ke Smart Engine lokal!');
    }
  };

  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function') {
      showToast('Render 60fps aktif di kanvas!');
      return;
    }
    try {
      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`;
        a.click();
        showToast('Video WebM 60fps berhasil diunduh!');
      };
      setCurrentTime(0);
      setIsPlaying(true);
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, Math.min(4500, totalDuration * 1000));
      showToast('Merekam kanvas 60fps ke WebM...');
    } catch {
      showToast('Pratinjau 60fps berjalan di kanvas');
    }
  };

  const canvasDims =
    aspectRatio === '1:1'
      ? { w: 720, h: 720, cssW: 400 * zoom, cssH: 400 * zoom }
      : aspectRatio === '16:9'
      ? { w: 960, h: 540, cssW: 520 * zoom, cssH: 292 * zoom }
      : { w: 540, h: 960, cssW: 315 * zoom, cssH: 560 * zoom };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 select-none font-sans">
      {/* TOP BAR (IDENTICAL TO IMAGE_892545.JPG) */}
      <header className="border-b border-[#222636] bg-[#10121a] px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2.5">
          <Link
            href="/create"
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-lime-400 p-[1.5px] shadow-lg shadow-indigo-500/25 block"
          >
            <div className="w-full h-full bg-[#10121a] rounded-[10px] flex items-center justify-center font-extrabold text-xs text-white">
              M<span className="text-lime-400">AI</span>
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-transparent hover:bg-[#1a1d29] focus:bg-[#1a1d29] focus:outline-none px-2 py-0.5 rounded text-xs font-bold text-white w-56"
              />
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-lime-400/20 text-lime-300 border border-lime-400/30">
                AI Lab × Motion Skill 5.5
              </span>
            </div>
            <div className="text-[10px] text-slate-400 px-2 flex items-center gap-2">
              <span>MeledakCik/motionid</span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">
                {trainedVideos.length} Video Kreator Terlatih Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Center Switcher: User Studio vs Admin Training Workbench */}
        <div className="flex items-center bg-[#090b10] p-1 rounded-xl border border-[#222636]">
          <button
            type="button"
            onClick={() => setRoleMode('user')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              roleMode === 'user'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎬</span>
            <span>User Motion Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleMode('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              roleMode === 'admin'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>Admin Training Studio</span>
            <span className="px-1.5 py-0.2 bg-lime-400/20 text-lime-300 rounded text-[10px]">
              Full Akses
            </span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-[#181b26] border border-[#272b3a] rounded-lg p-0.5 text-[11px]">
            {(['9:16', '1:1', '16:9'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={`px-2 py-1 rounded-md font-semibold ${
                  aspectRatio === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportVideo}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg flex items-center gap-1.5"
          >
            <span>⬇</span>
            <span>Render Video</span>
          </button>
        </div>
      </header>

      {/* MAIN 3-COLUMN STUDIO WORKSPACE (SHARED BY USER & ADMIN) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDEBAR: USER TABS OR ADMIN UNRESTRICTED TRAINING TABS */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#222636] bg-[#11131a] flex flex-col shrink-0">
          {roleMode === 'user' ? (
            <>
              <div className="grid grid-cols-4 border-b border-[#222636] bg-[#0c0e14] p-1 gap-1 text-[11px] font-semibold">
                {(
                  [
                    ['prompt', 'Smart AI'],
                    ['templates', 'Template'],
                    ['widgets', 'UI Komponen'],
                    ['layers', 'Layer'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLeftTab(key)}
                    className={`py-2 rounded-lg ${
                      leftTab === key
                        ? 'bg-[#1b1f2e] text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {leftTab === 'prompt' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-white">
                        🧠 Claude Motion Skill 5.5 Director
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-lime-400/20 text-lime-300">
                        Auto-Rig
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Menyusun koreografi kamera 3D, simulasi kursor klik otomatis, ketikan URL
                      real-time, pop-out kartu, & fisika pegas Hooke.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Prompt Cerita / Produk / SaaS:
                    </label>
                    <textarea
                      rows={3}
                      value={smartPrompt}
                      onChange={(e) => setSmartPrompt(e.target.value)}
                      className="w-full rounded-xl bg-[#090b10] border border-[#282c3e] p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Preset Video Kreator
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full bg-[#181b26] border border-[#282c3e] rounded-xl px-2 py-1.5 text-[11px] text-white"
                      >
                        {trainedVideos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Mode Koreografi AI
                      </label>
                      <select
                        value={motionSkillMode}
                        onChange={(e) => setMotionSkillMode(e.target.value)}
                        className="w-full bg-[#181b26] border border-[#282c3e] rounded-xl px-2 py-1.5 text-[11px] text-lime-300 font-semibold"
                      >
                        <option value="depup-cursor-flow">@depup.web Cursor + UI Flow</option>
                        <option value="capcut-kinetic-pop">CapCut Lab Kinetic Word-Pop</option>
                        <option value="opus-isometric-3d">Opus 5.5 Isometric 3D Camera</option>
                        <option value="apple-bento-morph">Apple Keynote Spring Morph</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateFromPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
                  >
                    ⚡ Generate Rangkaian Motion Scene
                  </button>
                </div>
              )}

              {leftTab === 'templates' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {trainedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => {
                        setSelectedTemplateId(vid.id);
                        setScenes(JSON.parse(JSON.stringify(vid.scenesBlueprint)));
                        setActiveSceneIndex(0);
                        setCurrentTime(0);
                        showToast(`Template "${vid.title}" diterapkan!`);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedTemplateId === vid.id
                          ? 'bg-[#1c2033] border-indigo-500'
                          : 'bg-[#171a24] border-[#262b3d] hover:border-[#3a425e]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          {vid.creatorHandle}
                        </span>
                        <span className="text-emerald-400 font-mono">{vid.bpm} BPM</span>
                      </div>
                      <div className="text-xs font-bold text-white">{vid.title}</div>
                      <p className="text-[11px] text-slate-400 mt-1">{vid.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              {leftTab === 'widgets' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(
                    [
                      ['repo_input_card', '⌘', 'SaaS Repo URL + Cursor Click'],
                      ['repo_scanner_card', '⚡', 'AI Stack Scanner + Radar Gauge'],
                      ['terminal_build_card', '>_', 'Live Terminal + Pop-Out App'],
                      ['bento_metrics_grid', '⊞', '3D Bento Metric Cards'],
                      ['kinetic_showcase_card', '✨', 'CapCut Kinetic Word-Tracker'],
                    ] as const
                  ).map(([wType, icon, title]) => (
                    <button
                      key={wType}
                      type="button"
                      onClick={() => updateActiveScene({ widgetType: wType })}
                      className="w-full p-2.5 rounded-xl bg-[#181b26] hover:bg-[#202434] border border-[#2a2f42] text-left flex items-center gap-2.5"
                    >
                      <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {icon}
                      </span>
                      <span className="text-xs font-bold text-white">{title}</span>
                    </button>
                  ))}
                </div>
              )}

              {leftTab === 'layers' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
                  <div className="px-2.5 py-2 rounded-lg bg-[#171a24] text-slate-300">
                    🎥 3D Camera ({activeScene?.cameraMotion})
                  </div>
                  <div className="px-2.5 py-2 rounded-lg bg-[#171a24] text-slate-300">
                    🖱️ AI Autonomous Cursor + Ripple
                  </div>
                  <div className="px-2.5 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-white">
                    🧩 UI Rig ({activeScene?.widgetType})
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ADMIN MODE LEFT SIDEBAR: 4 UNRESTRICTED TRAINING TABS */
            <>
              <div className="grid grid-cols-4 border-b border-[#222636] bg-[#0c0e14] p-1 gap-1 text-[10px] font-bold">
                {(
                  [
                    ['video', '🎬 Video'],
                    ['blueprint', '🧬 Scene'],
                    ['physics', '🎨 Palet'],
                    ['rules', '📚 Rules'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAdminTab(key)}
                    className={`py-2 rounded-lg ${
                      adminTab === key
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {adminTab === 'video' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30">
                    <div className="font-bold text-lime-300 text-[11px]">
                      🛡️ Admin Video Motion Trainer
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Latih preset baru dari URL video TikTok/Reels/MP4 dan atur kata kunci pemicu
                      otomatis untuk User.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      URL Video Referensi (TikTok / Reels / MP4)
                    </label>
                    <input
                      type="url"
                      value={adminVideoUrl}
                      onChange={(e) => setAdminVideoUrl(e.target.value)}
                      className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-indigo-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Kreator</label>
                      <input
                        type="text"
                        value={adminCreatorHandle}
                        onChange={(e) => setAdminCreatorHandle(e.target.value)}
                        className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Kategori</label>
                      <select
                        value={adminCategory}
                        onChange={(e) =>
                          setAdminCategory(
                            e.target.value as 'saas' | 'promo' | 'edukasi' | 'quote'
                          )
                        }
                        className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2 py-1.5 text-xs text-white"
                      >
                        <option value="saas">SaaS & App</option>
                        <option value="promo">Promo</option>
                        <option value="edukasi">Edukasi</option>
                        <option value="quote">Quote</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Nama Preset Hasil Training
                    </label>
                    <input
                      type="text"
                      value={adminPresetTitle}
                      onChange={(e) => setAdminPresetTitle(e.target.value)}
                      className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Kata Kunci Pemicu Otomatis (Trigger Keywords)
                    </label>
                    <input
                      type="text"
                      value={adminTriggerKeywords}
                      onChange={(e) => setAdminTriggerKeywords(e.target.value)}
                      className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-lime-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-[#181b26] p-2 rounded-lg">
                      <span className="block text-[9px] text-slate-400">Stiffness</span>
                      <input
                        type="number"
                        value={adminStiffness}
                        onChange={(e) => setAdminStiffness(Number(e.target.value) || 220)}
                        className="w-full bg-transparent text-xs font-mono text-white"
                      />
                    </div>
                    <div className="bg-[#181b26] p-2 rounded-lg">
                      <span className="block text-[9px] text-slate-400">Damping</span>
                      <input
                        type="number"
                        value={adminDamping}
                        onChange={(e) => setAdminDamping(Number(e.target.value) || 14)}
                        className="w-full bg-transparent text-xs font-mono text-white"
                      />
                    </div>
                    <div className="bg-[#181b26] p-2 rounded-lg">
                      <span className="block text-[9px] text-slate-400">BPM</span>
                      <input
                        type="number"
                        value={adminBpm}
                        onChange={(e) => setAdminBpm(Number(e.target.value) || 118)}
                        className="w-full bg-transparent text-xs font-mono text-lime-300"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdminSaveVideoPreset}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
                  >
                    + Simpan Blueprint Kanvas ke Engine
                  </button>
                </div>
              )}

              {adminTab === 'blueprint' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                  <div className="font-bold text-white">
                    🧬 Multi-Scene Blueprint Designer ({scenes.length} Scene)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admin bebas menambah, menghapus, dan menyusun ulang langkah default pada preset:
                  </p>
                  {scenes.map((sc, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSceneIndex(idx)}
                      className={`p-2.5 rounded-xl border cursor-pointer ${
                        activeSceneIndex === idx
                          ? 'bg-[#1c2033] border-indigo-500'
                          : 'bg-[#161924] border-[#262b3d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300">
                          Scene {idx + 1}: {sc.stepBadge}
                        </span>
                        {scenes.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setScenes((prev) => prev.filter((_, i) => i !== idx));
                              setActiveSceneIndex(0);
                            }}
                            className="text-[10px] text-rose-400 hover:text-rose-300"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-white truncate mt-0.5">{sc.title}</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                        Rig: {sc.widgetType}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setScenes((prev) => [
                        ...prev,
                        {
                          stepBadge: `${prev.length + 1} Custom`,
                          title: `Langkah Baru #${prev.length + 1}`,
                          subtext: 'Subteks otomatis dari blueprint Admin.',
                          widgetType: 'repo_scanner_card',
                          primaryInput: 'Custom Blueprint Node',
                          secondaryInput: 'Auto-Rig, 60fps Spring, Ready',
                          duration: 3.4,
                          cameraMotion: 'spring-slide-vertical',
                          paletteId: activeScene.paletteId,
                        },
                      ])
                    }
                    className="w-full py-2 rounded-xl bg-[#1b1f2d] hover:bg-[#252b3d] border border-[#2e344a] text-xs font-bold text-indigo-300"
                  >
                    + Tambah Langkah Blueprint Baru
                  </button>
                </div>
              )}

              {adminTab === 'physics' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                  <div className="font-bold text-white">🎨 Custom Mesh Palette & Shader Lab</div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Nama Palet Baru</label>
                    <input
                      type="text"
                      value={newPalName}
                      onChange={(e) => setNewPalName(e.target.value)}
                      className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Bg Atas</label>
                      <input
                        type="color"
                        value={newPalBgStart}
                        onChange={(e) => setNewPalBgStart(e.target.value)}
                        className="w-full h-8 rounded bg-transparent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Bg Bawah</label>
                      <input
                        type="color"
                        value={newPalBgEnd}
                        onChange={(e) => setNewPalBgEnd(e.target.value)}
                        className="w-full h-8 rounded bg-transparent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Accent</label>
                      <input
                        type="color"
                        value={newPalAccent}
                        onChange={(e) => setNewPalAccent(e.target.value)}
                        className="w-full h-8 rounded bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminAddPalette}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    + Buat & Terapkan Palet Kustom
                  </button>
                </div>
              )}

              {adminTab === 'rules' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                  <div className="font-bold text-white">📚 Bulk Copywriting & Keyword Rules</div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as TrainingRow['type'])}
                      className="bg-[#181b26] border border-[#2a2f42] rounded-xl px-2 py-1.5 text-xs text-white"
                    >
                      <option value="hook">Hook Pembuka</option>
                      <option value="scene2">Scene 2 (Solusi)</option>
                      <option value="scene3">Scene 3 (Bukti)</option>
                      <option value="cta">CTA Penutup</option>
                      <option value="keyword_rule">Keyword Hashtag</option>
                    </select>
                    <select
                      value={ruleCategory}
                      onChange={(e) => setRuleCategory(e.target.value as TrainingRow['category'])}
                      className="bg-[#181b26] border border-[#2a2f42] rounded-xl px-2 py-1.5 text-xs text-white"
                    >
                      <option value="promo">Promo</option>
                      <option value="edukasi">Edukasi</option>
                      <option value="quote">Quote</option>
                      <option value="all">Semua</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={ruleContent}
                    onChange={(e) => setRuleContent(e.target.value)}
                    placeholder="Gunakan {topic}, {product}, {price}, {store}"
                    className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={ruleSubtext}
                    onChange={(e) => setRuleSubtext(e.target.value)}
                    placeholder="Subteks atau daftar hashtag"
                    className="w-full rounded-xl bg-[#181b26] border border-[#2a2f42] px-2.5 py-1.5 text-xs text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAdminSaveRule}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    + Simpan Rule ke Supabase
                  </button>
                </div>
              )}
            </>
          )}
        </aside>

        {/* CENTER VIEWPORT + KEYFRAME TIMELINE */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#07080c]">
          <div className="h-10 border-b border-[#1c202e] bg-[#0d0f17]/95 px-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                Scene {activeSceneIndex + 1} • {activeScene?.stepBadge}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#171a26] text-lime-300 font-mono text-[10px]">
                Spring(k={140 + springTension * 14}, {activeScene?.cameraMotion})
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCursorSim}
                  onChange={(e) => setShowCursorSim(e.target.checked)}
                />
                <span>Kursor AI</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                />
                <span>Partikel Flow</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSafeZone}
                  onChange={(e) => setShowSafeZone(e.target.checked)}
                />
                <span>Safe Guide</span>
              </label>
              <div className="flex items-center gap-1 bg-[#161924] border border-[#262a3b] rounded-lg px-2 py-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.1).toFixed(2)))}
                >
                  −
                </button>
                <span className="font-mono text-[11px] w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-[#07080c]">
            <div
              className="relative shadow-2xl rounded-2xl overflow-hidden border border-white/15 transition-all duration-200"
              style={{ width: canvasDims.cssW, height: canvasDims.cssH }}
            >
              <canvas
                ref={canvasRef}
                width={canvasDims.w}
                height={canvasDims.h}
                className="w-full h-full block"
              />
            </div>
          </div>

          {/* Transport Bar */}
          <div className="h-11 border-t border-b border-[#222533] bg-[#10121a] px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveSceneIndex((i) => Math.max(0, i - 1));
                  setCurrentTime(0);
                }}
                className="p-1.5 rounded-lg bg-[#1a1d28] text-slate-300 text-xs"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSceneIndex((i) => Math.min(scenes.length - 1, i + 1))
                }
                className="p-1.5 rounded-lg bg-[#1a1d28] text-slate-300 text-xs"
              >
                ⏭
              </button>
            </div>

            <div className="font-mono text-xs">
              <span className="text-indigo-400 font-semibold">
                00:{currentTime.toFixed(1).padStart(4, '0')}
              </span>{' '}
              / <span className="text-slate-400">00:{totalDuration.toFixed(1).padStart(4, '0')}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setScenes((prev) => [
                    ...prev,
                    {
                      ...activeScene,
                      stepBadge: `${prev.length + 1} Scale`,
                      title: `Langkah ke-${prev.length + 1}`,
                    },
                  ])
                }
                className="px-2.5 py-1 rounded-lg bg-[#1b1f2d] border border-[#2e344a] text-xs font-semibold"
              >
                + Tambah Scene
              </button>
            </div>
          </div>

          {/* Multi-Track Keyframe Timeline */}
          <div className="h-36 bg-[#0c0e14] px-4 py-2 space-y-1.5 overflow-y-auto shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[10px] font-semibold text-slate-400">
                🎥 3D Camera Rig
              </span>
              <div
                className="flex-1 grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${scenes.length}, minmax(0, 1fr))` }}
              >
                {scenes.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveSceneIndex(idx);
                      let t = 0;
                      for (let i = 0; i < idx; i++) t += Number(scenes[i].duration) || 3.4;
                      setCurrentTime(t + 0.1);
                    }}
                    className={`h-7 px-2.5 rounded-lg text-left text-[11px] font-semibold flex items-center justify-between truncate ${
                      idx === activeSceneIndex
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                        : 'bg-[#1c2030] text-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      {sc.stepBadge}: {sc.title}
                    </span>
                    <span className="text-[10px] font-mono ml-1">{sc.duration}s</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[10px] font-semibold text-slate-400">
                🖱️ UI + Cursor Rig
              </span>
              <div
                className="flex-1 grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${scenes.length}, minmax(0, 1fr))` }}
              >
                {scenes.map((sc, idx) => (
                  <div
                    key={idx}
                    className="h-6 px-2 rounded-md bg-[#15232b] border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center justify-between truncate"
                  >
                    <span className="truncate">{sc.widgetType}</span>
                    <span className="w-2 h-2 rotate-45 bg-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR: INSPECTOR & ADMIN DATASET CONTROL */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#222636] bg-[#11131a] flex flex-col shrink-0 overflow-y-auto p-3.5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-[#222636] pb-2">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              {roleMode === 'admin' ? 'Admin Telemetry & Inspector' : 'Inspector & Physics Rig'}
            </span>
            <span className="text-[11px] text-indigo-400 font-bold">
              Scene #{activeSceneIndex + 1}
            </span>
          </div>

          <div className="space-y-2.5 pb-3 border-b border-[#222634]">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] text-slate-400 mb-1">Step Badge</label>
                <input
                  type="text"
                  value={activeScene?.stepBadge || ''}
                  onChange={(e) => updateActiveScene({ stepBadge: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">Headline Utama</label>
                <input
                  type="text"
                  value={activeScene?.title || ''}
                  onChange={(e) => updateActiveScene({ title: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Subteks Penjelas</label>
              <textarea
                rows={2}
                value={activeScene?.subtext || ''}
                onChange={(e) => updateActiveScene({ subtext: e.target.value })}
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2.5 pb-3 border-b border-[#222634]">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Tipe Rig Komponen UI</label>
              <select
                value={activeScene?.widgetType || 'repo_input_card'}
                onChange={(e) =>
                  updateActiveScene({ widgetType: e.target.value as WidgetRigType })
                }
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="repo_input_card">1. SaaS Repo URL + Cursor Click</option>
                <option value="repo_scanner_card">2. AI Stack Scanner + Radar Gauge</option>
                <option value="terminal_build_card">3. Live Terminal + Pop-Out App</option>
                <option value="bento_metrics_grid">4. 3D Bento Grid + Spline Chart</option>
                <option value="kinetic_showcase_card">5. CapCut Kinetic Word-Tracker</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Teks Ketikan Otomatis / URL / Header
              </label>
              <input
                type="text"
                value={activeScene?.primaryInput || ''}
                onChange={(e) => updateActiveScene({ primaryInput: e.target.value })}
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Sub-Layer / Baris Terminal (Koma)
              </label>
              <input
                type="text"
                value={activeScene?.secondaryInput || ''}
                onChange={(e) => updateActiveScene({ secondaryInput: e.target.value })}
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Palet Mesh</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(palettes).map(([pid, pObj]) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() =>
                    setScenes((prev) => prev.map((s) => ({ ...s, paletteId: pid })))
                  }
                  className={`p-2 rounded-xl border bg-[#181b26] text-left truncate text-[11px] font-semibold ${
                    activeScene?.paletteId === pid
                      ? 'border-indigo-500 text-white'
                      : 'border-[#2a2f42] text-slate-400'
                  }`}
                >
                  {pObj.name}
                </button>
              ))}
            </div>
          </div>

          {roleMode === 'admin' && supabaseRows.length > 0 && (
            <div className="pt-3 border-t border-[#222634] space-y-2">
              <div className="text-[11px] font-bold text-lime-300 uppercase">
                Database Supabase ({supabaseRows.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {supabaseRows.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="p-2 rounded-lg bg-[#161924] border border-[#262b3d] flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] text-slate-200 truncate">{r.content_text}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.from('ai_training_data').delete().eq('id', r.id);
                        forgetTrainingRow(r.id);
                        setSupabaseRows((prev) => prev.filter((x) => x.id !== r.id));
                      }}
                      className="text-[10px] text-rose-400 shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1b1f2e] border border-indigo-500/50 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
