'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BACKGROUND_STYLES,
  BackgroundStyle,
  CategoryType,
  HEADLINE_ANIMS,
  HeadlineAnim,
  SCENE_LAYOUTS,
  SCENE_TRANSITIONS,
  SceneItem,
  SceneLayout,
  SceneTransition,
  StudioWidgetType,
  StylePack,
  StyleRecipe,
  addStylePackToEngine,
  analyzePrompt,
  getStylePacks,
  normalizeStylePack,
  paletteIdOfPack,
  removeStylePackFromEngine,
  styleFieldsFor,
  CameraMotionType as EngineCameraMotionType,
  generateScript,
  normalizeWidgetType,
  priceToNumber,
  solveSpring,
  smoothStep,
  suggestCameraMotion,
  suggestedFontFor,
} from '@/lib/smart-engine';
import {
  TrainingRow,
  analyzeCreatorVideoReference,
  applyTrainingRow,
  forgetTrainingRow,
  loadTrainingIntoEngine,
} from '@/lib/training';
import { createClient } from '@/lib/supabase/client';
import { useEditorStore, type FontFamilyName } from '@/store/useEditorStore';
import { ensureCanvasFont, resolveCanvasFamily } from '@/components/templates/fonts';
import {
  AnimationSpec,
  ComponentStyleSpec,
  TEMPLATE_STYLE_VARIANTS,
  TransitionSpec,
  componentPackPreviewStyle,
  creativePackCounts,
  findAnimationPack,
  findComponentPack,
  findIconPack,
  findTransitionPack,
  getAnimationPacks,
  getComponentPacks,
  getIconPacks,
  getTransitionPacks,
  parseAnimationCode,
  parseComponentCode,
  parseSvgIcon,
  parseTransitionCode,
} from '@/lib/creative-packs';

export type WidgetRigType = StudioWidgetType;
export type CameraMotionType = EngineCameraMotionType;

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com').toLowerCase();

export interface SceneTransform {
  /** Geser horizontal, -0.5..0.5 dari lebar kanvas. */
  x: number;
  /** Geser vertikal, -0.5..0.5 dari tinggi kanvas. */
  y: number;
  scale: number;
  /** Derajat. */
  rotation: number;
  opacity: number;
}

export interface StudioSceneItem {
  layout?: SceneLayout;
  transition?: SceneTransition;
  bgStyle?: BackgroundStyle;
  headlineAnim?: HeadlineAnim;
  decor?: string;
  emphasis?: string;
  stepBadge: string;
  title: string;
  subtext: string;
  widgetType: WidgetRigType;
  primaryInput: string;
  secondaryInput: string;
  duration: number;
  cameraMotion: CameraMotionType;
  paletteId: string;
  /** Transformasi bebas ala Figma: posisi, skala, rotasi, transparansi. */
  transform?: SceneTransform;
  iconPackId?: string;
  componentPackId?: string;
  transitionPackId?: string;
  animationPackId?: string;
  /** Override radius kartu untuk scene ini. */
  radius?: number;
  /** Kode tampilan komponen dari inspector (gaya Figma). */
  componentCode?: string;
  componentStyle?: Partial<ComponentStyleSpec>;
  /** Simpan hasil parse agar renderer tidak membaca kode setiap frame. */
  customTransition?: TransitionSpec;
  customAnimation?: AnimationSpec;
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
  /** true untuk preset hasil simpanan admin (dari database). */
  isTrained?: boolean;
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
  'candy-pop': {
    name: 'Candy Pop',
    bgStart: '#ffe4f1',
    bgMid: '#fbcfe8',
    bgEnd: '#e9d5ff',
    orbPrimary: 'rgba(236, 72, 153, 0.3)',
    orbSecondary: 'rgba(167, 139, 250, 0.35)',
    titleColor: '#3b0a2a',
    subColor: '#6b2150',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#be185d',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(219, 39, 119, 0.18)',
    cardText: '#2a0a1e',
    accent: '#db2777',
    accentSoft: 'rgba(219, 39, 119, 0.12)',
    isDark: false,
  },
  'ocean-fresh': {
    name: 'Biru Segar',
    bgStart: '#e0f2fe',
    bgMid: '#bae6fd',
    bgEnd: '#a5f3fc',
    orbPrimary: 'rgba(14, 165, 233, 0.3)',
    orbSecondary: 'rgba(255, 255, 255, 0.5)',
    titleColor: '#082f49',
    subColor: '#0c4a6e',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#0369a1',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(3, 105, 161, 0.18)',
    cardText: '#082f49',
    accent: '#0369a1',
    accentSoft: 'rgba(3, 105, 161, 0.12)',
    isDark: false,
  },
  'mono-noir': {
    name: 'Hitam Tegas',
    bgStart: '#0a0a0a',
    bgMid: '#171717',
    bgEnd: '#262626',
    orbPrimary: 'rgba(250, 204, 21, 0.18)',
    orbSecondary: 'rgba(255, 255, 255, 0.06)',
    titleColor: '#fafafa',
    subColor: '#a3a3a3',
    pillBg: 'rgba(38, 38, 38, 0.9)',
    pillText: '#facc15',
    cardBg: 'rgba(23, 23, 23, 0.96)',
    cardBorder: 'rgba(250, 204, 21, 0.35)',
    cardText: '#fafafa',
    accent: '#facc15',
    accentSoft: 'rgba(250, 204, 21, 0.16)',
    isDark: true,
  },
  'royal-gold': {
    name: 'Emas Mewah',
    bgStart: '#07130e',
    bgMid: '#0c1a14',
    bgEnd: '#1c1917',
    orbPrimary: 'rgba(212, 175, 55, 0.22)',
    orbSecondary: 'rgba(16, 185, 129, 0.12)',
    titleColor: '#fdf8e7',
    subColor: '#d6cfb4',
    pillBg: 'rgba(28, 25, 23, 0.85)',
    pillText: '#e7c75f',
    cardBg: 'rgba(253, 250, 240, 0.97)',
    cardBorder: 'rgba(212, 175, 55, 0.45)',
    cardText: '#1c1917',
    accent: '#b8912c',
    accentSoft: 'rgba(184, 145, 44, 0.16)',
    isDark: true,
  },
  'sunset-warm': {
    name: 'Senja Hangat',
    bgStart: '#ffedd5',
    bgMid: '#fed7aa',
    bgEnd: '#fecdd3',
    orbPrimary: 'rgba(234, 88, 12, 0.28)',
    orbSecondary: 'rgba(244, 63, 94, 0.22)',
    titleColor: '#431407',
    subColor: '#7c2d12',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#c2410c',
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBorder: 'rgba(234, 88, 12, 0.2)',
    cardText: '#431407',
    accent: '#ea580c',
    accentSoft: 'rgba(234, 88, 12, 0.12)',
    isDark: false,
  },
  'paper-clean': {
    name: 'Kertas Bersih',
    bgStart: '#fafaf9',
    bgMid: '#f5f5f4',
    bgEnd: '#e7e5e4',
    orbPrimary: 'rgba(29, 78, 216, 0.12)',
    orbSecondary: 'rgba(255, 255, 255, 0.6)',
    titleColor: '#0c0a09',
    subColor: '#57534e',
    pillBg: 'rgba(255, 255, 255, 0.95)',
    pillText: '#1d4ed8',
    cardBg: '#ffffff',
    cardBorder: 'rgba(12, 10, 9, 0.12)',
    cardText: '#0c0a09',
    accent: '#1d4ed8',
    accentSoft: 'rgba(29, 78, 216, 0.1)',
    isDark: false,
  },
  'cocoa-cream': {
    name: 'Kopi Krim',
    bgStart: '#f5ebe0',
    bgMid: '#ede0d4',
    bgEnd: '#e3d5ca',
    orbPrimary: 'rgba(127, 79, 36, 0.25)',
    orbSecondary: 'rgba(255, 255, 255, 0.5)',
    titleColor: '#2b1a0e',
    subColor: '#5e3b1f',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#7f4f24',
    cardBg: 'rgba(255, 252, 247, 0.97)',
    cardBorder: 'rgba(127, 79, 36, 0.2)',
    cardText: '#2b1a0e',
    accent: '#7f4f24',
    accentSoft: 'rgba(127, 79, 36, 0.12)',
    isDark: false,
  },
  'promo-pop': {
    name: 'Kuning Promo',
    bgStart: '#fff1c1',
    bgMid: '#ffe08a',
    bgEnd: '#ffc94d',
    orbPrimary: 'rgba(239, 68, 68, 0.32)',
    orbSecondary: 'rgba(255, 255, 255, 0.55)',
    titleColor: '#1c1206',
    subColor: '#5b4310',
    pillBg: 'rgba(255, 255, 255, 0.92)',
    pillText: '#b91c1c',
    cardBg: 'rgba(255, 255, 255, 0.97)',
    cardBorder: 'rgba(185, 28, 28, 0.18)',
    cardText: '#1c1206',
    accent: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.12)',
    isDark: false,
  },
  'quote-ink': {
    name: 'Tinta Malam',
    bgStart: '#0b1026',
    bgMid: '#151a3a',
    bgEnd: '#241a3d',
    orbPrimary: 'rgba(244, 194, 122, 0.22)',
    orbSecondary: 'rgba(129, 140, 248, 0.2)',
    titleColor: '#f8f5ee',
    subColor: '#c7c2d6',
    pillBg: 'rgba(30, 27, 60, 0.85)',
    pillText: '#f4c27a',
    cardBg: 'rgba(250, 247, 240, 0.97)',
    cardBorder: 'rgba(244, 194, 122, 0.35)',
    cardText: '#1f1b2e',
    accent: '#c08a3e',
    accentSoft: 'rgba(192, 138, 62, 0.16)',
    isDark: true,
  },
  'depup-lavender': {
    name: 'Lavender Pastel',
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
    name: 'Indigo Malam',
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
    name: 'Mint Segar',
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
    name: 'Sunset Neon',
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
    title: 'Demo aplikasi: 3 langkah deploy',
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
    title: 'Demo aplikasi: rilis fitur 3D',
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
    title: 'Promo produk digital',
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
      'Sorotan kata demi kata dengan lencana pop-up melayang, kursor klik otomatis, dan whip-zoom cepat.',
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
    title: 'Edukasi teknologi singkat',
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

const CATEGORY_LABEL: Record<TrainedVideoPresetItem['category'], string> = {
  promo: 'Promo',
  quote: 'Quote',
  edukasi: 'Edukasi',
  saas: 'Demo aplikasi',
};

const CATEGORY_OPTIONS: Array<{ value: CategoryType; label: string }> = [
  { value: 'promo', label: 'Promo' },
  { value: 'quote', label: 'Quote' },
  { value: 'edukasi', label: 'Edukasi' },
];

const CATEGORY_HINTS: Record<CategoryType, { placeholder: string; hint: string }> = {
  promo: {
    placeholder: 'promo kopi susu gula aren dari 25rb jadi 18rb',
    hint: 'Sebut produk dan harganya. Tulis "dari … jadi …" supaya muncul harga coret.',
  },
  quote: {
    placeholder: 'kata-kata buat yang lagi capek kerja',
    hint: 'Sebut suasananya: capek, galau, semangat, cinta, atau syukur.',
  },
  edukasi: {
    placeholder: '3 cara mengatur keuangan di usia 20an',
    hint: 'Awali dengan angka ("3 cara …") supaya jadi daftar langkah bernomor.',
  },
};

const CAMERA_OPTIONS: Array<{ value: 'auto' | CameraMotionType; label: string }> = [
  { value: 'auto', label: 'Otomatis (sesuai kategori)' },
  { value: 'spring-slide-vertical', label: 'Geser pegas' },
  { value: 'whip-zoom-spring', label: 'Zoom cepat' },
  { value: 'perspective-tilt-3d', label: 'Miring 3D' },
  { value: 'smooth-float', label: 'Melayang tenang' },
];

const CAMERA_MOTIONS: CameraMotionType[] = [
  'spring-slide-vertical',
  'perspective-tilt-3d',
  'whip-zoom-spring',
  'smooth-float',
];

function isCameraMotion(value: unknown): value is CameraMotionType {
  return typeof value === 'string' && (CAMERA_MOTIONS as string[]).includes(value);
}

const WIDGET_OPTIONS: Array<{ value: StudioWidgetType; icon: string; label: string }> = [
  { value: 'price_tag_card', icon: '🏷️', label: 'Kartu harga & diskon' },
  { value: 'checklist_card', icon: '✓', label: 'Daftar poin / langkah' },
  { value: 'step_number_card', icon: '3', label: 'Angka besar + keterangan' },
  { value: 'quote_card', icon: '❝', label: 'Kartu kutipan' },
  { value: 'cta_button_card', icon: '👆', label: 'Tombol ajakan (CTA)' },
  { value: 'kinetic_showcase_card', icon: '✨', label: 'Sorot kata di judul' },
  { value: 'repo_input_card', icon: '⌘', label: 'Demo aplikasi: input + klik' },
  { value: 'repo_scanner_card', icon: '⚡', label: 'Demo aplikasi: kartu analisis' },
  { value: 'terminal_build_card', icon: '>_', label: 'Demo aplikasi: terminal' },
  { value: 'bento_metrics_grid', icon: '⊞', label: 'Demo aplikasi: grid metrik' },
];

const WIDGET_FIELDS: Record<
  StudioWidgetType,
  { primary: string; secondary: string; primaryHint: string; secondaryHint: string }
> = {
  price_tag_card: {
    primary: 'Nama produk',
    secondary: 'Harga promo | harga normal | label stiker | nama toko',
    primaryHint: 'Kopi Susu Gula Aren',
    secondaryHint: 'Rp18rb | Rp25rb | Hemat 28% | Kopi Senja',
  },
  checklist_card: {
    primary: 'Judul daftar (opsional)',
    secondary: 'Poin-poin, pisahkan dengan |',
    primaryHint: 'Kenapa harus ini?',
    secondaryHint: '1. Langkah pertama | 2. Langkah kedua',
  },
  step_number_card: {
    primary: 'Angka atau simbol besar',
    secondary: 'Keterangan (baris pertama tebal), pisahkan dengan |',
    primaryHint: '3',
    secondaryHint: 'cara | mengatur keuangan',
  },
  quote_card: {
    primary: 'Isi kutipan',
    secondary: 'Tanda tangan (opsional)',
    primaryHint: 'Pelan-pelan saja, yang penting tidak berhenti.',
    secondaryHint: '@akunmu',
  },
  cta_button_card: {
    primary: 'Teks tombol',
    secondary: 'Info tambahan, pisahkan dengan |',
    primaryHint: 'Pesan Sekarang',
    secondaryHint: 'Kopi Senja | Link di bio',
  },
  kinetic_showcase_card: {
    primary: 'Teks yang diketik',
    secondary: 'Label tambahan, pisahkan dengan koma',
    primaryHint: 'contoh.com/promo',
    secondaryHint: 'Label 1, Label 2',
  },
  repo_input_card: {
    primary: 'Teks yang diketik (URL/input)',
    secondary: 'Label tambahan, pisahkan dengan koma',
    primaryHint: 'github.com/nama/repo',
    secondaryHint: 'Label 1, Label 2',
  },
  repo_scanner_card: {
    primary: 'Judul kartu',
    secondary: 'Isi kotak metrik, pisahkan dengan koma',
    primaryHint: 'Analisis otomatis',
    secondaryHint: 'Metrik 1, Metrik 2, Metrik 3',
  },
  terminal_build_card: {
    primary: 'Judul terminal / URL hasil',
    secondary: 'Baris terminal, pisahkan dengan koma',
    primaryHint: 'https://aplikasimu.id',
    secondaryHint: '$ npm run build, ✓ Selesai',
  },
  bento_metrics_grid: {
    primary: 'Judul kartu',
    secondary: 'Isi kotak metrik, pisahkan dengan koma',
    primaryHint: 'Performa minggu ini',
    secondaryHint: 'Metrik 1, Metrik 2, Metrik 3',
  },
};

const FONT_OPTIONS: FontFamilyName[] = [
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'Space Grotesk',
  'Bebas Neue',
  'Anton',
];

/** Ubah scene hasil generator (SceneItem) menjadi scene studio. */
function sceneItemsToStudio(
  items: SceneItem[],
  camera?: CameraMotionType,
  paletteId?: string
): StudioSceneItem[] {
  return items.map((sc, idx) => ({
    stepBadge: sc.stepBadge || `Scene ${idx + 1}`,
    title: sc.text || '',
    subtext: sc.subtext || '',
    widgetType: normalizeWidgetType(sc.widgetType),
    primaryInput: sc.primaryInput || '',
    secondaryInput: sc.secondaryInput || '',
    duration: Number(sc.duration) || 3.4,
    cameraMotion: camera || sc.cameraMotion || 'spring-slide-vertical',
    paletteId: paletteId || sc.paletteId || 'depup-lavender',
    layout: sc.layout,
    transition: sc.transition,
    bgStyle: sc.bgStyle,
    headlineAnim: sc.headlineAnim,
    decor: sc.decor,
    emphasis: sc.emphasis,
  }));
}

// Contoh bawaan per kategori. seed tetap → isi sama di server & browser.
const CATEGORY_PRESET_SOURCES: Array<{
  id: string;
  category: CategoryType;
  title: string;
  summary: string;
  topic: string;
  store?: string;
  seed: number;
}> = [
  {
    id: 'preset-promo-harga-coret',
    category: 'promo',
    title: 'Promo UMKM dengan harga coret',
    summary: 'Produk, keunggulan, harga promo dengan harga coret, lalu tombol pesan.',
    topic: 'promo kopi susu gula aren dari 25rb jadi 18rb',
    store: 'Kopi Senja Kita',
    seed: 11,
  },
  {
    id: 'preset-quote-pengingat',
    category: 'quote',
    title: 'Quote pengingat yang menenangkan',
    summary: 'Tiga kartu kutipan serif yang muncul pelan, ditutup ajakan simpan.',
    topic: 'kata-kata buat yang lagi capek kerja',
    seed: 5,
  },
  {
    id: 'preset-edukasi-langkah',
    category: 'edukasi',
    title: 'Edukasi langkah bernomor',
    summary: 'Angka besar sebagai pembuka, daftar langkah bercentang, tips penting, ajakan simpan.',
    topic: '3 cara mengatur keuangan di usia 20an',
    seed: 3,
  },
];

const PRESET_PACK: Record<CategoryType, string> = {
  promo: 'poster-promo',
  quote: 'ink-quote',
  edukasi: 'mint-study',
};

export const CATEGORY_PRESETS: TrainedVideoPresetItem[] = CATEGORY_PRESET_SOURCES.map((src) => {
  const result = generateScript(src.topic, src.category, {
    seed: src.seed,
    customStoreName: src.store,
    stylePackId: PRESET_PACK[src.category],
    variant: 'A',
  });
  const blueprint = sceneItemsToStudio(
    result.scenes,
    suggestCameraMotion(src.category),
    result.suggestedStyle.paletteId
  );
  return {
    id: src.id,
    title: src.title,
    creatorHandle: '',
    category: src.category,
    videoUrl: '',
    cameraMotion: blueprint[0].cameraMotion,
    paletteId: result.suggestedStyle.paletteId,
    bpm: result.suggestedMusic.bpm,
    stiffness: 220,
    damping: 14,
    triggerKeywords: '',
    badges: blueprint.map((b) => b.stepBadge),
    summary: src.summary,
    scenesBlueprint: blueprint,
  };
});

const BUILT_IN_PRESETS: TrainedVideoPresetItem[] = [...CATEGORY_PRESETS, ...INITIAL_TRAINED_VIDEOS];

/**
 * 300+ template siap pakai: tiap preset dasar diperbanyak dengan variasi palet,
 * kamera, transisi, latar, dan animasi judul. Semua tetap bisa diedit di studio.
 */
const TEMPLATE_LIBRARY: TrainedVideoPresetItem[] = BUILT_IN_PRESETS.flatMap((base, baseIndex) =>
  TEMPLATE_STYLE_VARIANTS.map((variant, variantIndex) => ({
    ...base,
    id: `${base.id}-lib-${baseIndex}-${variantIndex}`,
    title: `${base.title} · ${variant.name}`,
    summary: `${base.summary} Varian ${variant.name.toLowerCase()} siap edit.`,
    cameraMotion: variant.cameraMotion as CameraMotionType,
    paletteId: variant.paletteId,
    bpm: Math.max(80, Math.round(base.bpm * variant.bpmScale)),
    triggerKeywords: base.triggerKeywords,
    scenesBlueprint: base.scenesBlueprint.map((scene) => ({
      ...scene,
      cameraMotion: variant.cameraMotion as CameraMotionType,
      paletteId: variant.paletteId,
      transition: variant.transition as SceneTransition,
      bgStyle: variant.bgStyle as BackgroundStyle,
      headlineAnim: variant.headlineAnim as HeadlineAnim,
      layout:
        scene.layout === 'center-text' ? scene.layout : (variant.layout as SceneLayout),
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    })),
  }))
);

/** Baris ai_training_data (type video_motion/ui_blueprint) → preset yang bisa dipakai semua user. */
function rowToPreset(row: TrainingRow): TrainedVideoPresetItem | null {
  if (row.type !== 'video_motion' && row.type !== 'ui_blueprint') return null;
  const meta = (row.metadata_json || {}) as Record<string, unknown>;
  const rawScenes = Array.isArray(meta.scenes_blueprint)
    ? (meta.scenes_blueprint as Array<Partial<StudioSceneItem>>)
    : [];
  if (!rawScenes.length) return null;
  const blueprint: StudioSceneItem[] = rawScenes.map(sanitizeStudioScene);
  const rawCategory = String(meta.preset_category || row.category || 'saas');
  const category: TrainedVideoPresetItem['category'] =
    rawCategory === 'promo' || rawCategory === 'quote' || rawCategory === 'edukasi'
      ? rawCategory
      : 'saas';
  return {
    id: `db-${row.id}`,
    title: row.content_text || 'Preset admin',
    creatorHandle: row.creator_handle || '',
    category,
    videoUrl: row.video_url || '',
    cameraMotion: blueprint[0].cameraMotion,
    paletteId: blueprint[0].paletteId,
    bpm: Number(row.motion_profile?.bpm) || Number(meta.bpm) || 120,
    stiffness: Number(meta.stiffness) || 220,
    damping: Number(meta.damping) || 14,
    triggerKeywords: String(meta.trigger_keywords ?? row.subtext ?? ''),
    badges: blueprint.map((b) => b.stepBadge),
    summary: `Preset dari admin, ${blueprint.length} scene`,
    scenesBlueprint: blueprint,
    isTrained: true,
  };
}

/* ---------- Helper teks & gambar kanvas ---------- */

/** "a | b | c" → [a, b, c]. Tanpa "|", dipisah koma (kecuali koma desimal seperti 1,5jt). */
function splitItems(raw: string | undefined): string[] {
  const text = String(raw || '').trim();
  if (!text) return [];
  const parts = text.includes('|') ? text.split('|') : text.split(/,(?!\d)/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function isPriceText(value: string): boolean {
  const t = value.trim();
  return /^rp\.?\s*\d/i.test(t) || /^\d[\d.,]*\s*(rb|ribu|k|jt|juta)?$/i.test(t);
}

function breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const out: string[] = [];
  let chunk = '';
  for (const ch of Array.from(word)) {
    if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
      out.push(chunk);
      chunk = ch;
    } else {
      chunk += ch;
    }
  }
  if (chunk) out.push(chunk);
  return out;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const raw of String(text).split(/\s+/).filter(Boolean)) {
    const pieces = ctx.measureText(raw).width > maxWidth ? breakLongWord(ctx, raw, maxWidth) : [raw];
    for (const word of pieces) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Bungkus teks; kecilkan font sampai muat di maxLines (sisanya diberi elipsis). Mengatur ctx.font. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight: number,
  family: string
): { lines: string[]; size: number } {
  let size = Math.max(minSize, startSize);
  for (;;) {
    ctx.font = `${weight} ${Math.round(size)}px ${family}`;
    const width = Math.max(10, maxWidth);
    const lines = wrapText(ctx, text, width);
    const wordTooLong = String(text)
      .split(/\s+/)
      .some((w) => w && ctx.measureText(w).width > width);
    if (lines.length <= maxLines && (!wordTooLong || size <= minSize)) {
      return { lines: lines.length ? lines : [''], size };
    }
    if (size <= minSize) {
      const kept = lines.slice(0, maxLines);
      kept[kept.length - 1] = ellipsize(ctx, `${kept[kept.length - 1]}…`, maxWidth);
      return { lines: kept, size };
    }
    size = Math.max(minSize, size * 0.9);
  }
}

/** Warna teks yang terbaca di atas warna latar (hex). */
function readableOn(color: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#111827' : '#ffffff';
}

function drawCheck(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  progress: number
) {
  const k = Math.max(0, Math.min(1, progress));
  const p1 = { x: cx - size * 0.42, y: cy + size * 0.02 };
  const p2 = { x: cx - size * 0.12, y: cy + size * 0.32 };
  const p3 = { x: cx + size * 0.44, y: cy - size * 0.3 };
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.17);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  if (k < 0.4) {
    const u = k / 0.4;
    ctx.lineTo(lerp(p1.x, p2.x, u), lerp(p1.y, p2.y, u));
  } else {
    const u = (k - 0.4) / 0.6;
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(lerp(p2.x, p3.x, u), lerp(p2.y, p3.y, u));
  }
  ctx.stroke();
  ctx.restore();
}

/** Stiker diskon bergerigi (gaya poster promo). */
function drawSticker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  text: string,
  color: string,
  family: string,
  pop: number,
  timeSec: number
) {
  if (pop <= 0.001 || r <= 4) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.22 + Math.sin(timeSec * 3) * 0.04);
  const sc = (0.3 + 0.7 * pop) * (1 + Math.sin(timeSec * 5) * 0.025);
  ctx.scale(sc, sc);
  ctx.globalAlpha = Math.min(1, pop * 1.6);
  const spikes = 14;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.84;
    const a = (Math.PI * i) / spikes;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  const fit = fitText(ctx, text, r * 1.45, 2, r * 0.4, r * 0.2, 900, family);
  ctx.fillStyle = readableOn(color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = fit.size * 1.05;
  fit.lines.forEach((ln, i) => ctx.fillText(ln, 0, -((fit.lines.length - 1) * lh) / 2 + i * lh));
  ctx.restore();
}

/* ---------- Gaya visual: label, palet dari paket, latar, dekorasi, transisi ---------- */

const INPUT_CLS =
  'w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-[11px] text-white';

const LAYOUT_LABELS: Record<SceneLayout, string> = {
  stack: 'Judul di atas',
  'card-first': 'Kartu di atas',
  'center-text': 'Teks besar di tengah',
};
const TRANSITION_LABELS: Record<SceneTransition, string> = {
  cut: 'Potong langsung',
  fade: 'Pudar',
  slide: 'Geser',
  'push-up': 'Dorong ke atas',
  zoom: 'Zoom',
  wipe: 'Sapu',
  flash: 'Kilat',
};
const BG_LABELS: Record<BackgroundStyle, string> = {
  mesh: 'Titik halus',
  sunburst: 'Sinar',
  stripes: 'Garis miring',
  blobs: 'Gumpalan warna',
  spotlight: 'Sorot lampu',
  confetti: 'Konfeti',
  waves: 'Gelombang',
  grid: 'Kisi',
};
const ANIM_LABELS: Record<HeadlineAnim, string> = {
  'spring-words': 'Kata memantul',
  typewriter: 'Mengetik',
  'rise-lines': 'Baris naik',
  pop: 'Pop besar',
  marker: 'Stabilo',
};
const VARIANT_LABEL: Record<'A' | 'B' | 'C', string> = { A: 'lengkap', B: 'alternatif', C: 'ringkas' };
const ENERGY_LABEL: Record<'calm' | 'medium' | 'high', string> = { calm: 'tenang', medium: 'sedang', high: 'tinggi' };

/** Preview SVG aman: hanya path, bukan HTML mentah dari admin. */
function SafeSvgPreview({
  paths,
  className = 'w-6 h-6',
  fallbackColor = '#7C6CFF',
}: {
  paths: Array<{ d: string; fill?: string; stroke?: string; strokeWidth?: number }>;
  className?: string;
  fallbackColor?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths.map((part, index) => (
        <path
          key={index}
          d={part.d}
          fill={part.fill && part.fill !== 'none' ? part.fill : fallbackColor}
          stroke={part.stroke && part.stroke !== 'none' ? part.stroke : 'none'}
          strokeWidth={part.strokeWidth || 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string> | Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  const entries = Array.isArray(options) ? options : (Object.entries(options) as Array<[T, string]>);
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-400 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={INPUT_CLS}>
        {entries.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function sanitizeVisual(sc: Partial<StudioSceneItem>): Partial<StudioSceneItem> {
  const out: Partial<StudioSceneItem> = {};
  if (sc.layout && (SCENE_LAYOUTS as readonly string[]).includes(sc.layout)) out.layout = sc.layout;
  if (sc.transition && (SCENE_TRANSITIONS as readonly string[]).includes(sc.transition)) out.transition = sc.transition;
  if (sc.bgStyle && (BACKGROUND_STYLES as readonly string[]).includes(sc.bgStyle)) out.bgStyle = sc.bgStyle;
  if (sc.headlineAnim && (HEADLINE_ANIMS as readonly string[]).includes(sc.headlineAnim)) out.headlineAnim = sc.headlineAnim;
  if (typeof sc.decor === 'string') out.decor = sc.decor.slice(0, 24);
  if (typeof sc.emphasis === 'string') out.emphasis = sc.emphasis.slice(0, 200);
  if (sc.transform && typeof sc.transform === 'object') {
    const t = sc.transform as Partial<SceneTransform>;
    out.transform = {
      x: Math.max(-0.5, Math.min(0.5, Number(t.x) || 0)),
      y: Math.max(-0.5, Math.min(0.5, Number(t.y) || 0)),
      scale: Math.max(0.3, Math.min(2, Number(t.scale) || 1)),
      rotation: Math.max(-45, Math.min(45, Number(t.rotation) || 0)),
      opacity: Math.max(0.05, Math.min(1, Number(t.opacity) || 1)),
    };
  }
  if (typeof sc.iconPackId === 'string') out.iconPackId = sc.iconPackId.slice(0, 120);
  if (typeof sc.componentPackId === 'string') out.componentPackId = sc.componentPackId.slice(0, 120);
  if (typeof sc.transitionPackId === 'string') out.transitionPackId = sc.transitionPackId.slice(0, 120);
  if (typeof sc.animationPackId === 'string') out.animationPackId = sc.animationPackId.slice(0, 120);
  if (typeof sc.radius === 'number') out.radius = Math.max(0, Math.min(64, sc.radius));
  if (typeof sc.componentCode === 'string') out.componentCode = sc.componentCode.slice(0, 2000);
  if (sc.componentStyle && typeof sc.componentStyle === 'object') out.componentStyle = sc.componentStyle;
  return out;
}

/** Scene dari database/JSON → scene studio yang aman dirender. */
function sanitizeStudioScene(sc: Partial<StudioSceneItem>, i: number): StudioSceneItem {
  return {
    stepBadge: String(sc.stepBadge ?? `Scene ${i + 1}`),
    title: String(sc.title ?? ''),
    subtext: String(sc.subtext ?? ''),
    widgetType: normalizeWidgetType(sc.widgetType),
    primaryInput: String(sc.primaryInput ?? ''),
    secondaryInput: String(sc.secondaryInput ?? ''),
    duration: Math.min(15, Math.max(1, Number(sc.duration) || 3.4)),
    cameraMotion: isCameraMotion(sc.cameraMotion) ? sc.cameraMotion : 'spring-slide-vertical',
    paletteId: String(sc.paletteId || 'depup-lavender'),
    ...sanitizeVisual(sc),
  };
}

function recipeChips(r: StyleRecipe): string[] {
  const k = r.keys;
  return [
    k.industry ? `topik: ${k.industry}` : '',
    `suasana: ${k.mood}`,
    k.colorHint ? `warna: ${k.colorHint}` : '',
    `energi: ${ENERGY_LABEL[k.energy]}`,
    k.platform ? `platform: ${k.platform}` : '',
    k.urgent ? 'mendesak' : '',
    ...k.emphasis.slice(0, 4).map((w) => `tonjolkan: ${w}`),
  ].filter(Boolean);
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x888888;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

function lumOf(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Aksen digelapkan/diterangkan sampai terbaca sebagai teks di atas latar. */
function readableAccent(accent: string, dark: boolean): string {
  let out = accent;
  for (let i = 0; i < 6; i++) {
    const l = lumOf(out);
    if (!dark && l > 0.5) out = mixHex(out, '#000000', 0.22);
    else if (dark && l < 0.38) out = mixHex(out, '#ffffff', 0.22);
    else break;
  }
  return out;
}

/** Palet studio dari 3 warna (paket gaya hasil training admin / ekstraksi video). */
function themeFromColors(
  name: string,
  c: { bgStart: string; bgEnd: string; accent: string; isDark: boolean }
): PaletteThemeConfig {
  const dark = c.isDark;
  const accent = readableAccent(c.accent, dark);
  return {
    name,
    bgStart: c.bgStart,
    bgMid: mixHex(c.bgStart, c.bgEnd, 0.5),
    bgEnd: c.bgEnd,
    orbPrimary: rgba(accent, dark ? 0.24 : 0.28),
    orbSecondary: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.5)',
    titleColor: dark ? '#f8fafc' : '#0f172a',
    subColor: dark ? '#cbd5e1' : '#334155',
    pillBg: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.92)',
    pillText: dark ? '#f8fafc' : accent,
    cardBg: dark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)',
    cardBorder: rgba(accent, 0.3),
    cardText: dark ? '#f8fafc' : '#0f172a',
    accent: accent,
    accentSoft: rgba(accent, 0.14),
    isDark: dark,
  };
}

const packThemeCache = new Map<string, PaletteThemeConfig>();

function resolvePalette(
  palettes: Record<string, PaletteThemeConfig>,
  id: string | undefined
): PaletteThemeConfig {
  if (id && palettes[id]) return palettes[id];
  if (id && id.startsWith('pack-')) {
    const pack = getStylePacks().find((p) => paletteIdOfPack(p) === id);
    if (pack?.colors) {
      const key = `${id}:${pack.colors.bgStart}${pack.colors.bgEnd}${pack.colors.accent}${pack.colors.isDark}`;
      let theme = packThemeCache.get(key);
      if (!theme) {
        theme = themeFromColors(pack.name, pack.colors);
        packThemeCache.set(key, theme);
      }
      return theme;
    }
  }
  return palettes['depup-lavender'] || DEFAULT_PALETTE_THEMES['depup-lavender'];
}

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Pola latar di atas gradien palet. */
function drawBackgroundStyle(
  ctx: CanvasRenderingContext2D,
  style: BackgroundStyle,
  W: number,
  H: number,
  t: number,
  pal: PaletteThemeConfig
) {
  const S = Math.min(W, H);
  const soft = pal.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.38)';
  const ink = pal.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)';
  ctx.save();
  if (style === 'sunburst') {
    const rays = 18;
    const R = Math.hypot(W, H);
    ctx.translate(W / 2, H * 0.4);
    ctx.rotate(t * 0.12);
    ctx.fillStyle = soft;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a, a + Math.PI / rays);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'stripes') {
    const w = S * 0.07;
    const D = Math.hypot(W, H);
    const off = (t * 40) % (w * 2);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.6);
    ctx.fillStyle = ink;
    for (let x = -D; x < D; x += w * 2) ctx.fillRect(x + off, -D, w, D * 2);
  } else if (style === 'blobs') {
    const spots: Array<[number, number, string]> = [
      [0.2, 0.25, pal.orbPrimary],
      [0.85, 0.55, pal.accentSoft],
      [0.3, 0.85, pal.orbSecondary],
    ];
    spots.forEach(([x, y, col], i) => {
      const bx = W * x + Math.sin(t * 0.7 + i * 2) * S * 0.08;
      const by = H * y + Math.cos(t * 0.6 + i) * S * 0.08;
      const r = S * (0.42 + 0.05 * Math.sin(t + i));
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  } else if (style === 'spotlight') {
    const lx = W / 2 + Math.sin(t * 0.5) * W * 0.12;
    const g = ctx.createRadialGradient(lx, -H * 0.05, 0, lx, -H * 0.05, H * 0.95);
    g.addColorStop(0, pal.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.45)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H / 2, S * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, pal.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  } else if (style === 'confetti') {
    const colors = [pal.accent, '#facc15', '#22c55e', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 42; i++) {
      const speed = 30 + hash01(i + 3) * 70;
      const x = hash01(i) * W + Math.sin(t * 1.3 + i) * 14;
      const y = ((hash01(i + 7) * (H + 60) + t * speed) % (H + 60)) - 30;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * (1 + hash01(i + 11) * 2) + i);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-S * 0.008, -S * 0.013, S * 0.016, S * 0.026);
      ctx.restore();
    }
  } else if (style === 'waves') {
    for (let k = 0; k < 3; k++) {
      const baseY = H * (0.8 + k * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) {
        ctx.lineTo(x, baseY + Math.sin(x * 0.012 + t * 1.4 + k * 1.7) * S * 0.025);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = k === 1 ? pal.accentSoft : soft;
      ctx.fill();
    }
  } else if (style === 'grid') {
    const step = S * 0.075;
    const off = (t * 22) % step;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    for (let x = (W / 2) % step; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = off; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

type GraphemeSegmenter = { segment(input: string): Iterable<{ segment: string }> };

function splitEmoji(text: string): string[] {
  const Seg = (
    Intl as unknown as {
      Segmenter?: new (locale?: string, options?: { granularity: string }) => GraphemeSegmenter;
    }
  ).Segmenter;
  const parts = Seg
    ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (x) => x.segment)
    : Array.from(text);
  return parts.filter((p) => p.trim() && p !== '\uFE0F' && p !== '\u200D');
}

const DECOR_SPOTS: Array<[number, number]> = [
  [0.88, 0.09],
  [0.1, 0.9],
  [0.94, 0.6],
  [0.07, 0.44],
  [0.8, 0.93],
  [0.93, 0.32],
];

/** Emoji dekorasi melayang di latar (sesuai topik prompt). */
function drawDecor(
  ctx: CanvasRenderingContext2D,
  decor: string | undefined,
  W: number,
  H: number,
  t: number,
  localTime: number,
  sceneIndex: number
) {
  const icons = splitEmoji(decor || '').slice(0, 4);
  if (!icons.length) return;
  const S = Math.min(W, H);
  const pop = solveSpring(Math.max(0, localTime - 0.2), { stiffness: 180, damping: 12 });
  if (pop <= 0.01) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < Math.min(3, icons.length); i++) {
    const [sx, sy] = DECOR_SPOTS[(sceneIndex * 2 + i) % DECOR_SPOTS.length];
    const size = S * (0.07 + 0.02 * hash01(sceneIndex * 3 + i));
    ctx.save();
    ctx.translate(W * sx, H * sy + Math.sin(t * 1.6 + i * 2) * S * 0.012);
    ctx.rotate(Math.sin(t * 0.9 + i) * 0.22);
    ctx.scale(pop, pop);
    ctx.globalAlpha = 0.92;
    ctx.font = `${Math.round(size)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(icons[(i + sceneIndex) % icons.length], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Gambar icon pack SVG sebagai badge dekoratif (tanpa script, hanya path). */
function drawIconPack(
  ctx: CanvasRenderingContext2D,
  icon: { paths: Array<{ d: string; fill?: string; stroke?: string; strokeWidth?: number }>; color: string; accent: string },
  W: number,
  H: number,
  t: number,
  localTime: number,
  sceneIndex: number,
  pal: PaletteThemeConfig
) {
  if (!icon.paths.length) return;
  const S = Math.min(W, H);
  const pop = solveSpring(Math.max(0, localTime - 0.18), { stiffness: 190, damping: 13 });
  if (pop <= 0.01) return;
  const [sx, sy] = DECOR_SPOTS[(sceneIndex * 3 + 2) % DECOR_SPOTS.length];
  const size = S * 0.135;
  const x = W * sx;
  const y = H * sy + Math.sin(t * 1.5 + sceneIndex) * S * 0.01;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.8 + sceneIndex) * 0.05);
  ctx.scale(pop, pop);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = pal.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.72)';
  ctx.strokeStyle = `${icon.accent}66`;
  ctx.lineWidth = Math.max(1, S * 0.002);
  drawRoundedRect(ctx, -size * 0.62, -size * 0.62, size * 1.24, size * 1.24, size * 0.34);
  ctx.fill();
  ctx.stroke();
  const iconSize = size * 0.68;
  ctx.translate(-iconSize / 2, -iconSize / 2);
  ctx.scale(iconSize / 24, iconSize / 24);
  for (const part of icon.paths) {
    try {
      const path = new Path2D(part.d);
      ctx.fillStyle = part.fill && part.fill !== 'none' ? part.fill : icon.color;
      ctx.strokeStyle = part.stroke && part.stroke !== 'none' ? part.stroke : icon.accent;
      ctx.lineWidth = Math.max(1, part.strokeWidth || 0);
      if (part.fill !== 'none') ctx.fill(path);
      if (part.stroke && part.stroke !== 'none') ctx.stroke(path);
    } catch {
      // Path SVG tidak valid dari input admin: lewati supaya render tetap jalan.
    }
  }
  ctx.restore();
}

interface WordBox {
  text: string;
  x: number;
  w: number;
}

function layoutWords(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
): Array<{ words: WordBox[]; width: number }> {
  const lines: Array<{ words: WordBox[]; width: number }> = [];
  const space = ctx.measureText(' ').width;
  let cur: { words: WordBox[]; width: number } = { words: [], width: 0 };
  for (const word of String(text).trim().split(/\s+/).filter(Boolean)) {
    const w = ctx.measureText(word).width;
    if (cur.words.length && cur.width + space + w > maxW) {
      lines.push(cur);
      cur = { words: [], width: 0 };
    }
    const x = cur.words.length ? cur.width + space : 0;
    cur.words.push({ text: word, x, w });
    cur.width = x + w;
  }
  if (cur.words.length) lines.push(cur);
  return lines;
}

const layerCache = new Map<string, HTMLCanvasElement>();

function getLayerCanvas(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  let c = layerCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    layerCache.set(key, c);
  }
  return c;
}

/** Tempel layer konten ke kanvas utama dengan transisi masuk/keluar scene. */
function compositeScene(
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  W: number,
  H: number,
  transition: SceneTransition,
  localTime: number,
  duration: number,
  isLast: boolean,
  timeSec: number,
  custom?: TransitionSpec | null
) {
  const enter = smoothStep(0, 0.38, localTime);
  const exit = isLast ? 0 : smoothStep(duration - 0.26, duration, localTime);
  const eo = 1 - Math.pow(1 - enter, 3);
  const ei = exit * exit * exit;
  ctx.save();
  if (custom) {
    const moveX = ((1 - eo) - ei) * custom.fromX * 0.01 * W;
    const moveY = ((1 - eo) - ei) * custom.fromY * 0.01 * H;
    const scale = 1 + (custom.fromScale - 1) * (1 - eo) - (1 - custom.fromScale) * ei * 0.35;
    ctx.translate(W / 2 + moveX, H / 2 + moveY);
    ctx.rotate(((1 - eo) * custom.fromRotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = (custom.fade ? enter : 1) * (1 - exit * (custom.fade ? 1 : 0.55));
    if (custom.wipe) {
      ctx.beginPath();
      ctx.rect(0, 0, W * eo, H);
      ctx.clip();
    }
    ctx.drawImage(layer, 0, 0, W, H);
    ctx.restore();
    if (custom.flash) {
      const f = Math.max(0, 1 - smoothStep(0, custom.duration * 0.6, localTime)) * 0.75;
      if (f > 0) {
        ctx.save();
        ctx.globalAlpha = f;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    return;
  }
  if (transition === 'fade') {
    ctx.globalAlpha = enter * (1 - exit);
  } else if (transition === 'slide') {
    ctx.translate((1 - eo) * W * 0.55 - ei * W * 0.55, 0);
    ctx.globalAlpha = Math.min(1, enter * 1.5) * (1 - exit * 0.7);
  } else if (transition === 'push-up') {
    ctx.translate(0, (1 - eo) * H * 0.3 - ei * H * 0.25);
    ctx.globalAlpha = Math.min(1, enter * 1.6) * (1 - exit);
  } else if (transition === 'zoom') {
    const sc = 1 + (1 - eo) * 0.22 - exit * 0.1;
    ctx.translate(W / 2, H / 2);
    ctx.scale(sc, sc);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = Math.min(1, enter * 1.8) * (1 - exit);
  } else if (transition === 'wipe') {
    ctx.beginPath();
    ctx.rect(0, 0, W * eo, H);
    ctx.clip();
    ctx.globalAlpha = 1 - exit;
  } else if (transition === 'flash') {
    const shake = (1 - smoothStep(0, 0.25, localTime)) * 6;
    ctx.translate(Math.sin(timeSec * 90) * shake, 0);
    ctx.globalAlpha = 1 - exit * 0.9;
  }
  ctx.drawImage(layer, 0, 0, W, H);
  ctx.restore();
  if (transition === 'flash') {
    const f = 1 - smoothStep(0, 0.2, localTime);
    if (f > 0) {
      ctx.save();
      ctx.globalAlpha = f * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}

/* ---------- Export video ---------- */

const EXPORT_SIZES: Record<'9:16' | '1:1' | '16:9', { w: number; h: number }> = {
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '16:9': { w: 1920, h: 1080 },
};

/** Format rekaman terbaik yang didukung browser: MP4 dulu (Safari, Chrome baru), lalu WebM. */
function pickRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return (
    candidates.find((type) => {
      try {
        return MediaRecorder.isTypeSupported(type);
      } catch {
        return false;
      }
    }) || ''
  );
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/** Ketukan sederhana (kick, hi-hat, bass) yang disintesis di browser, sesuai BPM gaya. */
function scheduleBeat(ac: AudioContext, dest: AudioNode, bpm: number, duration: number) {
  const master = ac.createGain();
  master.gain.value = 0.5;
  master.connect(dest);
  const start = ac.currentTime + 0.05;
  const beat = 60 / Math.min(170, Math.max(70, bpm || 118));
  const noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.1), ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const bassNotes = [55, 55, 65.41, 49];
  for (let i = 0; i * beat < duration; i++) {
    const t = start + i * beat;
    const kick = ac.createOscillator();
    const kg = ac.createGain();
    kick.frequency.setValueAtTime(150, t);
    kick.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    kg.gain.setValueAtTime(0.9, t);
    kg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    kick.connect(kg).connect(master);
    kick.start(t);
    kick.stop(t + 0.32);
    const ht = t + beat / 2;
    if (ht - start < duration) {
      const hat = ac.createBufferSource();
      hat.buffer = noise;
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const hg = ac.createGain();
      hg.gain.setValueAtTime(0.22, ht);
      hg.gain.exponentialRampToValueAtTime(0.001, ht + 0.06);
      hat.connect(hp).connect(hg).connect(master);
      hat.start(ht);
      hat.stop(ht + 0.07);
    }
    if (i % 4 === 0) {
      const bass = ac.createOscillator();
      bass.type = 'triangle';
      bass.frequency.value = bassNotes[(i / 4) % bassNotes.length];
      const bg = ac.createGain();
      const len = Math.min(beat * 4, duration - i * beat);
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.1, len - 0.05));
      bass.connect(bg).connect(master);
      bass.start(t);
      bass.stop(t + Math.max(0.1, len));
    }
  }
  master.gain.setValueAtTime(0.5, start + Math.max(0, duration - 0.6));
  master.gain.linearRampToValueAtTime(0, start + duration);
}

/* ---------- Analisis video/gambar referensi (dijalankan di browser admin) ---------- */

interface ColorAnalysis {
  bgStart: string;
  bgEnd: string;
  accent: string;
  isDark: boolean;
  colorful: number;
}

type ColorBins = Map<number, { n: number; r: number; g: number; b: number }>;

function addPixels(bins: ColorBins, data: Uint8ClampedArray, step: number) {
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const entry = bins.get(key);
    if (entry) {
      entry.n++;
      entry.r += r;
      entry.g += g;
      entry.b += b;
    } else {
      bins.set(key, { n: 1, r, g, b });
    }
  }
}

function summarizeColors(bins: ColorBins): ColorAnalysis {
  type C = { n: number; r: number; g: number; b: number };
  const list: C[] = Array.from(bins.values())
    .map((x) => ({ n: x.n, r: x.r / x.n, g: x.g / x.n, b: x.b / x.n }))
    .sort((a, b) => b.n - a.n);
  const total = list.reduce((a, c) => a + c.n, 0) || 1;
  const sat = (c: C) => {
    const mx = Math.max(c.r, c.g, c.b);
    const mn = Math.min(c.r, c.g, c.b);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };
  const lum = (c: C) => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  const dist = (a: C, b: C) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  const first: C = list[0] || { n: 1, r: 240, g: 240, b: 240 };
  const second = list.find((c) => dist(c, first) > 60 && c.n > total * 0.03);
  const accent = list
    .filter((c) => c.n > total * 0.004 && sat(c) > 0.45 && lum(c) > 0.12 && lum(c) < 0.92 && dist(c, first) > 80)
    .sort((a, b) => sat(b) * Math.sqrt(b.n) - sat(a) * Math.sqrt(a.n))[0];
  const avgLum = list.reduce((a, c) => a + lum(c) * c.n, 0) / total;
  const isDark = avgLum < 0.45;
  const hex = (c: C) => rgbToHex(c.r, c.g, c.b);
  return {
    bgStart: hex(first),
    bgEnd: second ? hex(second) : rgbToHex(first.r * 0.85, first.g * 0.85, first.b * 0.85),
    accent: accent ? hex(accent) : isDark ? '#facc15' : '#dc2626',
    isDark,
    colorful: list.filter((c) => c.n > total * 0.01 && sat(c) > 0.4).length,
  };
}

function waitMedia(el: HTMLMediaElement, eventName: 'loadeddata' | 'seeked', ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      el.removeEventListener(eventName, done);
      el.removeEventListener('error', fail);
    };
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error('format video tidak didukung browser ini'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('waktu habis saat membaca video'));
    }, ms);
    el.addEventListener(eventName, done);
    el.addEventListener('error', fail);
  });
}

/**
 * Analisis video referensi langsung di browser: warna dominan, banyaknya gerak, potongan adegan,
 * kilatan, dan bagian layar yang paling ramai. Hasilnya berupa usulan paket gaya yang bisa diedit.
 */
async function analyzeVideoFile(file: File): Promise<{
  frames: string[];
  notes: string[];
  tags: string[];
  suggestion: Partial<StylePack>;
}> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    video.src = url;
    await waitMedia(video, 'loadeddata', 15000);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (!duration || !video.videoWidth) throw new Error('durasi video tidak terbaca');
    const N = Math.min(48, Math.max(12, Math.round(duration * 3)));
    const sw = 64;
    const sh = Math.max(32, Math.round((sw * video.videoHeight) / video.videoWidth));
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    const thumb = document.createElement('canvas');
    thumb.width = 90;
    thumb.height = Math.round((90 * video.videoHeight) / video.videoWidth);
    const tctx = thumb.getContext('2d');
    if (!sctx || !tctx) throw new Error('kanvas tidak tersedia');
    const bins: ColorBins = new Map();
    const frames: string[] = [];
    const thumbAt = [Math.floor(N * 0.2), Math.floor(N * 0.5), Math.floor(N * 0.8)];
    const band = [0, 0, 0];
    let prev: Float32Array | null = null;
    let prevMean = 0;
    let diffSum = 0;
    let diffCount = 0;
    let cuts = 0;
    let flashes = 0;
    let used = 0;
    for (let i = 0; i < N; i++) {
      try {
        video.currentTime = ((i + 0.5) * duration) / N;
        await waitMedia(video, 'seeked', 5000);
      } catch {
        continue;
      }
      sctx.drawImage(video, 0, 0, sw, sh);
      const data = sctx.getImageData(0, 0, sw, sh).data;
      addPixels(bins, data, 2);
      const luma = new Float32Array(sw * sh);
      let mean = 0;
      for (let p = 0, q = 0; p < data.length; p += 4, q++) {
        const l = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
        luma[q] = l;
        mean += l;
      }
      mean /= luma.length;
      for (let y = 0; y < sh; y++) {
        const third = Math.min(2, Math.floor((y / sh) * 3));
        for (let x = 1; x < sw; x++) band[third] += Math.abs(luma[y * sw + x] - luma[y * sw + x - 1]);
      }
      if (prev) {
        let d = 0;
        for (let q = 0; q < luma.length; q++) d += Math.abs(luma[q] - prev[q]);
        d /= luma.length;
        diffSum += d;
        diffCount++;
        if (d > 0.14) cuts++;
        if (mean - prevMean > 0.2) flashes++;
      }
      prev = luma;
      prevMean = mean;
      used++;
      if (thumbAt.indexOf(i) >= 0) {
        tctx.drawImage(video, 0, 0, thumb.width, thumb.height);
        frames.push(thumb.toDataURL('image/jpeg', 0.7));
      }
    }
    if (used < 4) throw new Error('frame video tidak bisa dibaca');
    const colors = summarizeColors(bins);
    const motion = Math.min(1, (diffCount ? diffSum / diffCount : 0) / 0.12);
    const cutsPerMin = cuts / (duration / 60);
    const focus = (['atas', 'tengah', 'bawah'] as const)[band.indexOf(Math.max(band[0], band[1], band[2]))];
    const energy = motion > 0.55 || cutsPerMin > 40 ? 'tinggi' : motion < 0.22 && cutsPerMin < 15 ? 'rendah' : 'sedang';
    const suggestion: Partial<StylePack> = {
      colors: { bgStart: colors.bgStart, bgEnd: colors.bgEnd, accent: colors.accent, isDark: colors.isDark },
      pace: energy === 'tinggi' ? 0.85 : energy === 'rendah' ? 1.15 : 1,
      transition: flashes >= 2 ? 'flash' : energy === 'tinggi' ? 'zoom' : energy === 'rendah' ? 'fade' : 'push-up',
      camera: energy === 'tinggi' ? 'whip-zoom-spring' : energy === 'rendah' ? 'smooth-float' : 'spring-slide-vertical',
      headlineAnim:
        energy === 'tinggi' ? 'pop' : energy === 'rendah' ? (colors.isDark ? 'typewriter' : 'rise-lines') : 'spring-words',
      layout: focus === 'bawah' ? 'card-first' : focus === 'tengah' ? 'mixed' : 'stack',
      bgStyle: colors.isDark
        ? energy === 'tinggi'
          ? 'stripes'
          : 'spotlight'
        : colors.colorful >= 4
        ? energy === 'tinggi'
          ? 'confetti'
          : 'blobs'
        : energy === 'tinggi'
        ? 'sunburst'
        : 'mesh',
      font: colors.isDark && energy === 'rendah' ? 'Playfair Display' : energy === 'tinggi' ? 'Montserrat' : 'Poppins',
    };
    const tags = [
      energy === 'tinggi' ? 'tegas' : energy === 'rendah' ? 'tenang' : '',
      colors.isDark ? 'gelap' : '',
      colors.colorful >= 4 ? 'ceria' : '',
    ].filter(Boolean);
    const notes = [
      `Dibaca dari ${used} cuplikan frame (durasi ${duration.toFixed(1)} detik).`,
      `Warna dominan ${colors.bgStart} dan ${colors.bgEnd}, aksen ${colors.accent}${colors.isDark ? ', tema gelap' : ''}.`,
      `Gerak ${energy} (${Math.round(motion * 100)}/100), sekitar ${Math.round(cutsPerMin)} potongan adegan per menit.`,
      `Detail paling ramai di bagian ${focus} layar${flashes ? `, ${flashes} kilatan terang` : ''}.`,
      'Teks, font, dan jenis efek tidak bisa dibaca otomatis. Sesuaikan di form di bawah.',
    ];
    return { frames, notes, tags, suggestion };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute('src');
    video.load();
  }
}

async function analyzeImageColors(src: string): Promise<ColorAnalysis> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('gambar tidak bisa dimuat'));
    img.src = src;
  });
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = Math.max(32, Math.round((96 * img.naturalHeight) / (img.naturalWidth || 96)));
  const cx = c.getContext('2d', { willReadFrequently: true });
  if (!cx) throw new Error('kanvas tidak tersedia');
  cx.drawImage(img, 0, 0, c.width, c.height);
  const bins: ColorBins = new Map();
  addPixels(bins, cx.getImageData(0, 0, c.width, c.height).data, 1);
  return summarizeColors(bins);
}

const TAG_STOPWORDS = new Set([
  'yang', 'dan', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'buat', 'banget', 'sama', 'jadi',
  'karena', 'kalau', 'atau', 'juga', 'aja', 'the', 'and', 'for', 'with', 'you', 'your', 'video', 'part',
]);
const TAG_NOISE = ['fyp', 'foryou', 'foryoupage', 'viral', 'xyzbca', 'trending', 'masukberanda'];

/** Kata pemicu dari judul/caption referensi: hashtag + kata kunci + topik yang terbaca. */
function tagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const hashtags = (lower.match(/#[a-z0-9_]+/g) || [])
    .map((h) => h.slice(1))
    .filter((h) => TAG_NOISE.indexOf(h) < 0);
  const keys = analyzePrompt(lower, 'promo');
  const words = lower
    .replace(/#[a-z0-9_]+/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !TAG_STOPWORDS.has(w));
  return Array.from(new Set([...hashtags, keys.industry, ...keys.styleHints, keys.colorHint, ...words]))
    .filter(Boolean)
    .slice(0, 10);
}

/* ---------- Simpan proyek ---------- */

type SaveState = 'idle' | 'loading' | 'loadfail' | 'saving' | 'saved' | 'error' | 'local';

interface StudioSnapshot {
  version: 1;
  scenes: StudioSceneItem[];
  fontName: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  category: CategoryType;
  savedAt: string;
}

const TEMPLATE_BY_CATEGORY: Record<CategoryType, string> = { promo: 'P1', quote: 'Q1', edukasi: 'E1' };

function isUuid(value: string | undefined): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isCategory(value: unknown): value is CategoryType {
  return value === 'promo' || value === 'quote' || value === 'edukasi';
}

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

  ctx.restore();
}

export interface MotionStudioEngineProps {
  initialRole?: 'user' | 'admin';
  /** Id proyek di tabel projects (route /editor/[id]). */
  projectId?: string;
}

export default function MotionStudioEngine({ initialRole = 'user', projectId }: MotionStudioEngineProps) {
  const storeTopic = useEditorStore((s) => s.topic);
  const storeScript = useEditorStore((s) => s.script);
  const storeCategory = useEditorStore((s) => s.category);

  // Mode admin hanya untuk akun admin. Route /admin sudah dijaga middleware dan dicek ulang di sini;
  // izin tulis yang sebenarnya ditegakkan RLS di database (lihat supabase/migration.sql).
  const [isAdmin, setIsAdmin] = useState(initialRole === 'admin');
  const [roleModeState, setRoleMode] = useState<'user' | 'admin'>(initialRole);
  const roleMode: 'user' | 'admin' = isAdmin ? roleModeState : 'user';
  const [leftTab, setLeftTab] = useState<'prompt' | 'templates' | 'packs' | 'widgets' | 'layers'>('prompt');
  const [adminTab, setAdminTab] = useState<'video' | 'blueprint' | 'physics' | 'rules' | 'code'>('video');
  const [mobilePanel, setMobilePanel] = useState<'canvas' | 'library' | 'inspector'>('canvas');
  const [showWelcome, setShowWelcome] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'all' | 'saas' | CategoryType>('all');
  const [templateLimit, setTemplateLimit] = useState(36);
  const [packKind, setPackKind] = useState<'icon' | 'component' | 'transition' | 'animation'>('icon');
  const [packSearch, setPackSearch] = useState('');
  const [packLimit, setPackLimit] = useState(36);
  const [adminCodeKind, setAdminCodeKind] = useState<'icon' | 'component' | 'transition' | 'animation'>('icon');
  const [adminCodeName, setAdminCodeName] = useState('');
  const [adminCodeTags, setAdminCodeTags] = useState('');
  const [adminCodeCategory, setAdminCodeCategory] = useState<'all' | CategoryType>('all');
  const [adminCodeText, setAdminCodeText] = useState(
    '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.7 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z" fill="#7C6CFF"/></svg>'
  );

  const [projectTitle, setProjectTitle] = useState(storeTopic || 'Proyek tanpa judul');
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
  const [trainedVideos, setTrainedVideos] = useState<TrainedVideoPresetItem[]>(TEMPLATE_LIBRARY);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    (CATEGORY_PRESETS.find((p) => p.category === storeCategory) || CATEGORY_PRESETS[0]).id
  );
  const [studioCategory, setStudioCategory] = useState<CategoryType>(storeCategory);
  const [cameraChoice, setCameraChoice] = useState<'auto' | CameraMotionType>('auto');
  const [fontName, setFontName] = useState<FontFamilyName>(
    storeScript?.suggestedStyle?.font || suggestedFontFor(storeCategory)
  );
  // Nama font asli dari next/font (berupa hash). Awalnya 'sans-serif' agar render server & browser sama.
  const [canvasFont, setCanvasFont] = useState<string>('sans-serif');
  const [stylePackChoice, setStylePackChoice] = useState<string>('auto');
  const [storeName, setStoreName] = useState<string>(
    projectId ? storeScript?.extractedMeta?.storeName || '' : ''
  );
  const [lastRecipe, setLastRecipe] = useState<StyleRecipe | null>(storeScript?.recipe || null);
  const [beatBpm, setBeatBpm] = useState<number>(storeScript?.suggestedMusic?.bpm || 118);
  const [withBeat, setWithBeat] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportResult, setExportResult] = useState<{ url: string; name: string; type: string } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(projectId ? 'loading' : 'idle');

  // Admin: trainer gaya dari video/link referensi
  const [refName, setRefName] = useState('');
  const [refTags, setRefTags] = useState('');
  const [refCats, setRefCats] = useState<CategoryType[]>([]);
  const [refColors, setRefColors] = useState({ bgStart: '#fff1c1', bgEnd: '#ffc94d', accent: '#dc2626', isDark: false });
  const [refBg, setRefBg] = useState<BackgroundStyle>('sunburst');
  const [refLayout, setRefLayout] = useState<SceneLayout | 'mixed'>('mixed');
  const [refTransition, setRefTransition] = useState<SceneTransition>('zoom');
  const [refAnim, setRefAnim] = useState<HeadlineAnim>('spring-words');
  const [refFont, setRefFont] = useState<FontFamilyName>('Montserrat');
  const [refCamera, setRefCamera] = useState<CameraMotionType>('whip-zoom-spring');
  const [refPace, setRefPace] = useState(1);
  const [refDecor, setRefDecor] = useState('');
  const [refLink, setRefLink] = useState('');
  const [refSource, setRefSource] = useState<{
    kind: 'file' | 'link';
    label: string;
    url?: string;
    author?: string;
    thumbs: string[];
    notes: string[];
  } | null>(null);
  const [refBusy, setRefBusy] = useState(false);
  const [tiltIntensity, setTiltIntensity] = useState<number>(10);
  const [cardRadius, setCardRadius] = useState<number>(24);
  const [springTension, setSpringTension] = useState<number>(8);
  const [smartPrompt, setSmartPrompt] = useState<string>(storeTopic || '');

  // Scene awal: dari script hasil /create (atau contoh bawaan store), sesuai kategorinya.
  const [scenes, setScenes] = useState<StudioSceneItem[]>(() => {
    if (storeScript?.scenes?.length) return sceneItemsToStudio(storeScript.scenes);
    const preset = CATEGORY_PRESETS.find((p) => p.category === storeCategory) || CATEGORY_PRESETS[0];
    return JSON.parse(JSON.stringify(preset.scenesBlueprint));
  });

  // Admin Training Form States (Unrestricted Training Workbench)
  const [adminVideoUrl, setAdminVideoUrl] = useState('');
  const [adminCreatorHandle, setAdminCreatorHandle] = useState('');
  const [adminCategory, setAdminCategory] = useState<'saas' | 'promo' | 'edukasi' | 'quote'>('saas');
  const [adminPresetTitle, setAdminPresetTitle] = useState('');
  const [adminTriggerKeywords, setAdminTriggerKeywords] = useState('');
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
  const [ruleContent, setRuleContent] = useState('Promo {product} cuma {price} di {store}! 🔥');
  const [ruleSubtext, setRuleSubtext] = useState('Selama persediaan masih ada.');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStageRef = useRef<HTMLDivElement | null>(null);
  const [canvasStage, setCanvasStage] = useState({ w: 0, h: 0 });
  const timeRef = useRef(0);
  const exportingRef = useRef(false);
  const projectReadyRef = useRef(false);
  const scriptBaseRef = useRef<Record<string, unknown>>(
    storeScript
      ? { hook: storeScript.hook, caption: storeScript.caption, hashtags: storeScript.hashtags }
      : {}
  );
  const router = useRouter();

  const seekTo = useCallback((t: number) => {
    timeRef.current = Math.max(0, t);
    setCurrentTime(timeRef.current);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  useEffect(() => {
    const el = canvasStageRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const next = { w: el.clientWidth, h: el.clientHeight };
      setCanvasStage((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };
    const updateNextFrame = () => {
      frame = requestAnimationFrame(() => {
        update();
        frame = requestAnimationFrame(update);
      });
    };
    update();
    updateNextFrame();
    window.addEventListener('resize', update);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(el);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [mobilePanel]);

  useEffect(() => {
    loadTrainingIntoEngine();
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: userData }, { data }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('ai_training_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
        ]);
        if (!alive) return;
        const email = (userData.user?.email || '').toLowerCase();
        setIsAdmin(email !== '' && email === ADMIN_EMAIL);
        if (data) {
          const rows = data as TrainingRow[];
          setSupabaseRows(rows);
          // Preset simpanan admin (database) tersedia untuk semua user.
          const fromDb = rows
            .map(rowToPreset)
            .filter((p): p is TrainedVideoPresetItem => p !== null);
          if (fromDb.length) {
            setTrainedVideos([...fromDb, ...TEMPLATE_LIBRARY]);
          }
        }
      } catch {
        if (alive) setIsAdmin(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Font kanvas memakai font yang benar-benar dimuat next/font (lihat components/templates/fonts.ts).
  useEffect(() => {
    let alive = true;
    setCanvasFont(resolveCanvasFamily(fontName));
    ensureCanvasFont(fontName).then(() => {
      if (alive) setCanvasFont(resolveCanvasFamily(fontName));
    });
    return () => {
      alive = false;
    };
  }, [fontName]);

  // Buka proyek dari database (/editor/[id])
  useEffect(() => {
    if (!projectId) return;
    if (!isUuid(projectId)) {
      setSaveState('local');
      return;
    }
    let alive = true;
    setSaveState('loading');
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, topic, category, script_json, style_json')
          .eq('id', projectId)
          .maybeSingle();
        if (!alive) return;
        if (error || !data) {
          setSaveState('loadfail');
          showToast(error ? `Gagal memuat proyek: ${error.message}` : 'Proyek tidak ditemukan atau bukan milikmu.');
          return;
        }
        const script = (data.script_json || {}) as Record<string, unknown>;
        const style = (data.style_json || {}) as Record<string, unknown>;
        scriptBaseRef.current = script;
        const savedMeta = script.extractedMeta as { storeName?: unknown } | undefined;
        if (savedMeta && typeof savedMeta.storeName === 'string') setStoreName(savedMeta.storeName);
        const studio = script.studio as Partial<StudioSnapshot> | undefined;
        const restored =
          studio && Array.isArray(studio.scenes) && studio.scenes.length
            ? studio.scenes.map(sanitizeStudioScene)
            : Array.isArray(script.scenes) && script.scenes.length
            ? sceneItemsToStudio(script.scenes as SceneItem[])
            : null;
        if (restored && restored.length) {
          setScenes(restored);
          setActiveSceneIndex(0);
          seekTo(0);
        }
        if (data.title) setProjectTitle(String(data.title));
        if (data.topic) setSmartPrompt(String(data.topic));
        if (isCategory(data.category)) setStudioCategory(data.category);
        const font = studio?.fontName || style.font;
        if (typeof font === 'string' && (FONT_OPTIONS as string[]).indexOf(font) >= 0) {
          setFontName(font as FontFamilyName);
        }
        const ar = studio?.aspectRatio || style.aspectRatio;
        if (ar === '9:16' || ar === '1:1' || ar === '16:9') setAspectRatio(ar);
        if (script.recipe && typeof script.recipe === 'object') setLastRecipe(script.recipe as StyleRecipe);
        projectReadyRef.current = true;
        setSaveState('saved');
      } catch {
        if (alive) {
          setSaveState('loadfail');
          showToast('Gagal memuat proyek. Periksa koneksi internet.');
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Simpan otomatis 1,5 detik setelah perubahan terakhir
  useEffect(() => {
    if (!isUuid(projectId) || !projectReadyRef.current) return;
    const timer = setTimeout(async () => {
      try {
        setSaveState('saving');
        const supabase = createClient();
        const snapshot: StudioSnapshot = {
          version: 1,
          scenes,
          fontName,
          aspectRatio,
          category: studioCategory,
          savedAt: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('projects')
          .update({
            title: projectTitle.trim() || 'Proyek tanpa judul',
            topic: smartPrompt,
            category: studioCategory,
            script_json: { ...scriptBaseRef.current, studio: snapshot },
            style_json: { font: fontName, aspectRatio },
          })
          .eq('id', projectId)
          .select('id');
        if (error || !data?.length) {
          setSaveState('error');
          showToast(error ? `Gagal menyimpan: ${error.message}` : 'Gagal menyimpan: proyek ini bukan milikmu.');
        } else {
          setSaveState('saved');
        }
      } catch {
        setSaveState('error');
      }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, scenes, projectTitle, smartPrompt, studioCategory, fontName, aspectRatio]);

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

  // Renderer kanvas. target/pixelRatio dipakai saat export (kanvas 1080p terpisah).
  const renderFrame = useCallback(
    (timeSec: number, target?: HTMLCanvasElement, pixelRatio = 1, forExport = false) => {
      const canvas = target || canvasRef.current;
      if (!canvas) return;
      const mainCtx = canvas.getContext('2d');
      if (!mainCtx) return;
      let ctx: CanvasRenderingContext2D = mainCtx;
      const ratio = target ? pixelRatio : 1;

      const { index, scene, localTime, duration, progress } = getSceneAtTime(timeSec);
      if (!scene) return;

      const W = canvas.width / ratio;
      const H = canvas.height / ratio;
      let pal = resolvePalette(palettes, scene.paletteId);
      const componentPack = findComponentPack(scene.componentPackId);
      const sceneStyle: Partial<ComponentStyleSpec> = {
        ...(componentPack?.style || {}),
        ...(scene.componentStyle ||
          (scene.componentCode ? parseComponentCode(scene.componentCode) : {})),
      };
      if (sceneStyle.background) pal = { ...pal, cardBg: sceneStyle.background };
      if (sceneStyle.foreground) pal = { ...pal, cardText: sceneStyle.foreground };
      if (sceneStyle.border) pal = { ...pal, cardBorder: sceneStyle.border };
      if (sceneStyle.accent) pal = { ...pal, accent: sceneStyle.accent, accentSoft: `${sceneStyle.accent}22` };
      const wType = normalizeWidgetType(scene.widgetType);
      const S = Math.min(W, H);
      const stiffness = 140 + springTension * 14;
      const damping = Math.max(9, 21 - springTension);

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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

      if (!scene.bgStyle || scene.bgStyle === 'mesh') {
        ctx.fillStyle = pal.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(15,23,42,0.035)';
        const gridStep = 36;
        const gridScrollY = (timeSec * 18) % gridStep;
        for (let gx = 24; gx < W; gx += gridStep) {
          for (let gy = gridScrollY; gy < H; gy += gridStep) {
            ctx.fillRect(gx, gy, 2, 2);
          }
        }
      } else {
        drawBackgroundStyle(ctx, scene.bgStyle, W, H, timeSec, pal);
      }
      drawDecor(ctx, scene.decor, W, H, timeSec, localTime, index);
      if (scene.iconPackId) {
        const iconPack = findIconPack(scene.iconPackId);
        if (iconPack) drawIconPack(ctx, iconPack, W, H, timeSec, localTime, index, pal);
      }

      // Konten scene digambar di layer terpisah supaya transisi bisa menggerakkan semuanya sekaligus
      const layer = getLayerCanvas(canvas.width, canvas.height);
      const layerCtx = layer.getContext('2d');
      if (!layerCtx) {
        ctx.restore();
        return;
      }
      layerCtx.setTransform(1, 0, 0, 1, 0, 0);
      layerCtx.clearRect(0, 0, layer.width, layer.height);
      layerCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx = layerCtx;
      ctx.save();

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

      // Transformasi bebas ala Figma (drag di kanvas atau slider inspector).
      const tf = scene.transform;
      if (tf) {
        ctx.globalAlpha *= Math.max(0.05, Math.min(1, tf.opacity ?? 1));
        ctx.translate(W / 2 + (tf.x || 0) * W, H / 2 + (tf.y || 0) * H);
        ctx.rotate(((tf.rotation || 0) * Math.PI) / 180);
        const tfScale = Math.max(0.3, Math.min(2, tf.scale || 1));
        ctx.scale(tfScale, tfScale);
        ctx.translate(-W / 2, -H / 2);
      }

      const U = Math.min(W, H * 0.75);
      const landscape = W > H * 1.15;
      const layout: SceneLayout =
        scene.layout === 'center-text' ? 'center-text' : landscape ? 'stack' : scene.layout || 'stack';
      const centered = layout === 'center-text';
      const padX = landscape ? W * 0.06 : W * 0.082;
      const textW = landscape && !centered ? W * 0.43 : W - padX * 2;
      const badgeSpring = solveSpring(localTime, { stiffness, damping });

      ctx.font = `700 ${Math.round(U * 0.036)}px ${canvasFont}`;
      const badgeLabel = scene.stepBadge || `Langkah ${index + 1}`;
      const pillW = ctx.measureText(badgeLabel).width + U * 0.093;
      const pillH = Math.round(U * 0.07);

      // Ukur judul; dikecilkan otomatis bila terlalu panjang
      let titleFontSize = Math.round(U * (centered ? 0.094 : 0.074));
      let titleLines: Array<{ words: WordBox[]; width: number }> = [];
      for (;;) {
        ctx.font = `800 ${titleFontSize}px ${canvasFont}`;
        titleLines = layoutWords(ctx, String(scene.title || ''), textW);
        const tooWide = titleLines.some((l) => l.width > textW * 1.02);
        if ((!tooWide && titleLines.length <= (centered ? 6 : 5)) || titleFontSize <= U * 0.048) break;
        titleFontSize = Math.round(titleFontSize * 0.9);
      }
      const lineHeight = titleFontSize * 1.2;
      const titleH = titleLines.length * lineHeight;

      const subFontSize = Math.round(U * 0.035);
      ctx.font = `500 ${subFontSize}px ${canvasFont}`;
      const subLines = scene.subtext ? wrapText(ctx, String(scene.subtext), textW) : [];
      const subLH = subFontSize * 1.42;
      const subH = subLines.length ? subLines.length * subLH + 6 : 0;

      // Posisi blok sesuai layout
      let badgeY: number;
      let titleY: number;
      let cardX = padX;
      let cardW = W - padX * 2;
      let cardY0: number;
      let cardH: number;
      if (centered) {
        const blockH = pillH + 18 + titleH + subH;
        badgeY = Math.max(H * 0.08, (H - blockH) / 2 - H * 0.03);
        titleY = badgeY + pillH + 18;
        cardY0 = H;
        cardH = 0;
      } else if (landscape) {
        const blockH = pillH + 18 + titleH + subH;
        badgeY = Math.max(H * 0.08, (H - blockH) / 2);
        titleY = badgeY + pillH + 18;
        cardX = W * 0.53;
        cardW = W * 0.41;
        cardY0 = H * 0.16;
        cardH = H * 0.68;
      } else if (layout === 'card-first') {
        badgeY = H * 0.105;
        cardY0 = badgeY + pillH + 22;
        cardH = Math.max(H * 0.24, Math.min(H * 0.38, H * 0.89 - cardY0 - titleH - subH - 30));
        titleY = cardY0 + cardH + 28;
      } else {
        badgeY = H * 0.115;
        titleY = badgeY + pillH + 18;
        cardY0 = Math.max(titleY + titleH + subH + 30, H * 0.41);
        cardH = Math.min(H * 0.4, H - cardY0 - H * 0.11);
      }
      const headerTopY = badgeY + (1 - badgeSpring) * 42;
      const pillX = centered ? (W - pillW) / 2 : padX;

      // Step Badge Pill
      ctx.font = `700 ${Math.round(U * 0.036)}px ${canvasFont}`;
      ctx.save();
      ctx.translate(pillX + pillW / 2, headerTopY + pillH / 2);
      ctx.scale(0.6 + 0.4 * badgeSpring, 0.6 + 0.4 * badgeSpring);
      ctx.translate(-(pillX + pillW / 2), -(headerTopY + pillH / 2));
      ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = pal.pillBg;
      drawRoundedRect(ctx, pillX, headerTopY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = pal.cardBorder;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(pillX + pillH * 0.5, headerTopY + pillH / 2, U * 0.0085, 0, Math.PI * 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
      ctx.fillStyle = pal.pillText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeLabel, pillX + pillH * 0.85, headerTopY + pillH / 2 + 1);
      ctx.restore();

      // Judul dengan animasi sesuai gaya; kata kunci dari prompt diberi warna aksen
      const anim: HeadlineAnim = scene.headlineAnim || 'spring-words';
      const customAnim = scene.customAnimation || findAnimationPack(scene.animationPackId)?.spec || null;
      const emphasisKeys = new Set(
        String(scene.emphasis || '')
          .split('|')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean)
      );
      const isEmphasis = (w: string) =>
        emphasisKeys.size > 0 && emphasisKeys.has(w.toLowerCase().replace(/[^a-z0-9%]/g, ''));
      const totalWords = titleLines.reduce((a, l) => a + l.words.length, 0);
      const activeWordIdx = Math.floor((localTime * 2.6) % Math.max(1, totalWords));
      let charsLeft = anim === 'typewriter' ? Math.floor(Math.max(0, localTime - 0.1) * 26) : Infinity;
      let caret: { x: number; y: number } | null = null;
      const titleBaseY = titleY + (1 - badgeSpring) * 30;
      let baseAlpha = 1;

      ctx.save();
      ctx.font = `800 ${titleFontSize}px ${canvasFont}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      if (anim === 'pop') {
        const sp = solveSpring(Math.max(0, localTime - 0.05), { stiffness: 260, damping: 11 });
        const cx0 = centered ? W / 2 : padX + textW / 2;
        const cy0 = titleBaseY + titleH / 2;
        baseAlpha = Math.min(1, sp * 1.6);
        ctx.translate(cx0, cy0);
        ctx.rotate((1 - sp) * -0.07);
        const sc = 1.35 - 0.35 * sp;
        ctx.scale(sc, sc);
        ctx.translate(-cx0, -cy0);
      }
      let wordIdx = 0;
      titleLines.forEach((line, li) => {
        const lineX = centered ? (W - line.width) / 2 : padX;
        const lineY = titleBaseY + li * lineHeight;
        let lineDy = 0;
        if (anim === 'rise-lines') {
          const delay = 0.06 + li * 0.12;
          const sp = solveSpring(Math.max(0, localTime - delay), { stiffness, damping });
          lineDy = (1 - sp) * lineHeight;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, lineY - titleFontSize * 0.15, W, lineHeight + titleFontSize * 0.2);
          ctx.clip();
        }
        line.words.forEach((wd) => {
          const idx = wordIdx++;
          let alpha = 1;
          let dy = lineDy;
          let dx = 0;
          let rot = 0;
          let scale = 1;
          let text = wd.text;
          if (customAnim) {
            const delay = 0.06 + idx * customAnim.stagger;
            const sp = solveSpring(Math.max(0, localTime - delay), {
              stiffness: stiffness * 1.05,
              damping: damping * 0.92,
            });
            const appear = smoothStep(0, Math.max(0.14, customAnim.duration * 0.7), localTime - delay);
            alpha = customAnim.fade ? appear : 1;
            dx = (1 - sp) * customAnim.fromX * titleFontSize * 0.02;
            dy = (1 - sp) * customAnim.fromY * titleFontSize * 0.02;
            scale = 1 + (customAnim.fromScale - 1) * (1 - sp);
            rot = ((1 - sp) * customAnim.fromRotate * Math.PI) / 180;
          } else if (anim === 'spring-words' || anim === 'marker') {
            const delay = 0.08 + idx * 0.065;
            const sp = solveSpring(Math.max(0, localTime - delay), { stiffness, damping });
            alpha = smoothStep(0, 0.22, localTime - delay);
            dy = (1 - sp) * 28;
            scale = 0.82 + 0.18 * sp;
          } else if (anim === 'typewriter') {
            if (charsLeft <= 0) return;
            text = wd.text.slice(0, charsLeft);
            charsLeft -= wd.text.length + 1;
          }
          const emph = isEmphasis(wd.text);
          const kinetic = wType === 'kinetic_showcase_card' && idx === activeWordIdx;
          ctx.save();
          ctx.globalAlpha = alpha * baseAlpha;
          ctx.translate(lineX + wd.x + wd.w / 2 + dx, lineY + titleFontSize / 2 + dy);
          if (rot) ctx.rotate(rot);
          ctx.scale(scale, scale);
          if (kinetic || (emph && anim === 'marker')) {
            const grow = kinetic ? 1 : smoothStep(0.25 + idx * 0.065, 0.55 + idx * 0.065, localTime);
            if (grow > 0) {
              ctx.fillStyle = pal.accent;
              drawRoundedRect(ctx, -wd.w / 2 - 7, -titleFontSize / 2 - 2, (wd.w + 14) * grow, titleFontSize + 6, 10);
              ctx.fill();
            }
            ctx.fillStyle = grow > 0.5 ? readableOn(pal.accent) : emph ? pal.accent : pal.titleColor;
          } else {
            ctx.fillStyle = emph ? pal.accent : pal.titleColor;
          }
          ctx.fillText(text, -wd.w / 2, -titleFontSize / 2);
          ctx.restore();
          if (anim === 'typewriter' && !customAnim) {
            caret = { x: lineX + wd.x + ctx.measureText(text).width, y: lineY };
          }
        });
        if (anim === 'rise-lines') ctx.restore();
      });
      const caretPos = caret as { x: number; y: number } | null;
      if (anim === 'typewriter' && caretPos && Math.floor(timeSec * 2.2) % 2 === 0) {
        ctx.fillStyle = pal.accent;
        ctx.fillRect(caretPos.x + 4, caretPos.y + titleFontSize * 0.08, Math.max(2, U * 0.006), titleFontSize * 0.86);
      }
      ctx.restore();

      const subSpring = solveSpring(Math.max(0, localTime - 0.18), {
        stiffness: stiffness * 0.9,
        damping,
      });
      const subY = titleBaseY + titleH + 6 + (1 - subSpring) * 18;
      ctx.save();
      ctx.globalAlpha = smoothStep(0.12, 0.38, localTime);
      ctx.fillStyle = pal.subColor;
      ctx.font = `500 ${subFontSize}px ${canvasFont}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = centered ? 'center' : 'left';
      subLines.forEach((ln, i) => ctx.fillText(ln, centered ? W / 2 : padX, subY + i * subLH));
      ctx.restore();

      // Kartu utama
      const cardSpring = solveSpring(Math.max(0, localTime - 0.14), { stiffness, damping });
      const cardY = cardY0 + (1 - cardSpring) * (layout === 'card-first' ? -40 : 68);
      const radius = Number(scene.radius) || componentPack?.style.radius || Number(cardRadius) || 24;

      if (showParticles && cardH > 0) {
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

      const secondaryItems = splitItems(scene.secondaryInput);

      let cursorTarget: { x: number; y: number; isPressed: boolean; ripple: number } | null = {
        x: cardX + cardW * 0.72,
        y: cardY + cardH * 0.48,
        isPressed: false,
        ripple: 0,
      };

      const paintCard = () => {
        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = pal.cardBg;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = pal.cardBorder;
        ctx.stroke();
        ctx.restore();
      };

      if (centered) {
        cursorTarget = null;
      } else if (wType === 'terminal_build_card') {
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
          ctx.font = `800 ${Math.round(W * 0.028)}px ${canvasFont}`;
          ctx.fillText('🚀 Deploy Berhasil • 200 OK', popX + 20, popY + 24);
          ctx.fillStyle = '#4f46e5';
          ctx.font = `600 ${Math.round(W * 0.024)}px "JetBrains Mono", monospace`;
          ctx.fillText(scene.primaryInput || 'https://api.depup.id', popX + 20, popY + 46);
          ctx.restore();
        }
      } else if (wType === 'repo_scanner_card' || wType === 'bento_metrics_grid') {
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
        ctx.font = `800 ${Math.round(W * 0.034)}px ${canvasFont}`;
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
          ctx.font = `700 ${Math.round(W * 0.027)}px ${canvasFont}`;
          const wds = item.split(' ');
          ctx.fillText(wds.slice(0, 2).join(' '), bx + 10, by + 28);
          if (wds.length > 2) {
            ctx.fillStyle = pal.subColor;
            ctx.font = `600 ${Math.round(W * 0.023)}px ${canvasFont}`;
            ctx.fillText(wds.slice(2).join(' '), bx + 10, by + 48);
          }
        });

        cursorTarget = {
          x: lerp(cardX + 60, cardX + cardW - 70, smoothStep(0.15, 0.7, progress)),
          y: lerp(boxY + boxH * 0.5, boxY + boxH * 0.4, Math.sin(progress * Math.PI)),
          isPressed: progress > 0.54 && progress < 0.62,
          ripple: smoothStep(0.54, 0.76, progress),
        };
      } else if (wType === 'price_tag_card') {
        // Promo: nama produk, harga normal dicoret, harga promo besar, stiker diskon
        cursorTarget = null;
        if (cardH > S * 0.12) {
          paintCard();
          const items = splitItems(scene.secondaryInput);
          const priceItems = items
            .filter(isPriceText)
            .map((t) => ({ t, v: priceToNumber(t) ?? Number.NaN }));
          const labels = items.filter((t) => !isPriceText(t));
          let promoPrice = '';
          let normalPrice = '';
          if (priceItems.length >= 2) {
            const sorted = [...priceItems].sort((a, b) =>
              Number.isNaN(a.v) ? 1 : Number.isNaN(b.v) ? -1 : a.v - b.v
            );
            promoPrice = sorted[0].t;
            const top = sorted[sorted.length - 1];
            if (top.v > sorted[0].v) normalPrice = top.t;
          } else if (priceItems.length === 1) {
            promoPrice = priceItems[0].t;
          }
          const pv = priceToNumber(promoPrice);
          const nv = priceToNumber(normalPrice);
          const pct = pv && nv && nv > pv ? Math.round((1 - pv / nv) * 100) : null;
          const stickerText = labels[0] || (pct ? `Hemat ${pct}%` : 'Promo');
          const footnote = labels[1] || '';
          const padIn = S * 0.05;
          const innerX = cardX + padIn;
          const innerW = cardW - padIn * 2;
          const stickerR = Math.min(S * 0.095, cardH * 0.26);
          const reserve = promoPrice ? stickerR * 2 + S * 0.02 : 0;
          const bottom = cardY + cardH - padIn;
          let y = cardY + padIn;

          ctx.save();
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          if (footnote) {
            ctx.globalAlpha = 0.65 * smoothStep(0.02, 0.2, progress);
            ctx.fillStyle = pal.cardText;
            ctx.font = `600 ${Math.round(S * 0.027)}px ${canvasFont}`;
            ctx.fillText(ellipsize(ctx, `🏪 ${footnote}`, innerW - reserve), innerX, y);
            y += S * 0.05;
          }
          const prod = fitText(
            ctx,
            scene.primaryInput || 'Promo spesial',
            innerW - reserve,
            2,
            S * 0.058,
            S * 0.036,
            800,
            canvasFont
          );
          ctx.globalAlpha = smoothStep(0.04, 0.22, progress);
          ctx.fillStyle = pal.cardText;
          prod.lines.forEach((ln, li) => ctx.fillText(ln, innerX, y + li * prod.size * 1.18));
          y += prod.lines.length * prod.size * 1.18 + S * 0.03;
          ctx.restore();

          if (promoPrice) {
            if (normalPrice) {
              const nSize = S * 0.042;
              ctx.save();
              ctx.textBaseline = 'top';
              ctx.globalAlpha = 0.6 * smoothStep(0.1, 0.28, progress);
              ctx.fillStyle = pal.cardText;
              ctx.font = `600 ${Math.round(nSize)}px ${canvasFont}`;
              ctx.fillText(normalPrice, innerX, y);
              const nW = ctx.measureText(normalPrice).width;
              const strike = smoothStep(0.28, 0.46, progress);
              if (strike > 0) {
                ctx.globalAlpha = 0.9;
                ctx.strokeStyle = pal.accent;
                ctx.lineWidth = Math.max(2, S * 0.006);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(innerX - 4, y + nSize * 0.55);
                ctx.lineTo(innerX - 4 + (nW + 8) * strike, y + nSize * 0.5);
                ctx.stroke();
              }
              ctx.restore();
              y += nSize * 1.4;
            }
            const pop = solveSpring(Math.max(0, localTime - duration * 0.38), {
              stiffness: 260,
              damping: 13,
            });
            const maxSize = Math.max(S * 0.06, Math.min(S * 0.15, (bottom - y) * 0.95));
            const pf = fitText(ctx, promoPrice, innerW, 1, maxSize, S * 0.05, 900, canvasFont);
            if (pop > 0.001) {
              const pw = ctx.measureText(pf.lines[0]).width;
              ctx.save();
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              ctx.translate(innerX + pw / 2, y + pf.size / 2);
              const ps = 0.4 + 0.6 * pop;
              ctx.scale(ps, ps);
              ctx.globalAlpha = Math.min(1, pop * 1.5);
              ctx.fillStyle = pal.accent;
              ctx.fillText(pf.lines[0], -pw / 2, -pf.size / 2);
              ctx.restore();
            }
            drawSticker(
              ctx,
              cardX + cardW - padIn - stickerR,
              cardY + padIn + stickerR,
              stickerR,
              stickerText,
              pal.accent,
              canvasFont,
              solveSpring(Math.max(0, localTime - duration * 0.5), { stiffness: 240, damping: 12 }),
              timeSec
            );
          } else {
            // Tanpa harga: label besar sebagai pemancing ("Promo spesial")
            const avail = bottom - y;
            if (avail > S * 0.06) {
              const pop = solveSpring(Math.max(0, localTime - 0.25), { stiffness: 240, damping: 12 });
              const tf = fitText(
                ctx,
                stickerText,
                innerW - S * 0.1,
                2,
                Math.min(S * 0.075, avail * 0.38),
                S * 0.04,
                900,
                canvasFont
              );
              const lh = tf.size * 1.12;
              const boxH = Math.min(avail, tf.lines.length * lh + S * 0.06);
              const boxW = Math.min(
                innerW,
                Math.max(...tf.lines.map((l) => ctx.measureText(l).width)) + S * 0.1
              );
              const by = y + (avail - boxH) / 2;
              const pulse = 1 + Math.sin(timeSec * 4) * 0.02 * pop;
              ctx.save();
              ctx.translate(innerX + boxW / 2, by + boxH / 2);
              ctx.rotate(-0.04 * pop);
              ctx.scale((0.6 + 0.4 * pop) * pulse, (0.6 + 0.4 * pop) * pulse);
              ctx.globalAlpha = Math.min(1, pop * 1.5);
              ctx.fillStyle = pal.accent;
              drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, Math.min(boxH / 2, S * 0.05));
              ctx.fill();
              ctx.fillStyle = readableOn(pal.accent);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.font = `900 ${Math.round(tf.size)}px ${canvasFont}`;
              tf.lines.forEach((ln, li) =>
                ctx.fillText(ln, 0, -((tf.lines.length - 1) * lh) / 2 + li * lh)
              );
              ctx.restore();
            }
          }
        }
      } else if (wType === 'checklist_card') {
        // Daftar poin: muncul satu per satu lalu dicentang. "1. teks" → bulatan bernomor.
        cursorTarget = null;
        if (cardH > S * 0.12) {
          paintCard();
          const raw = splitItems(scene.secondaryInput).slice(0, 6);
          const items = raw.length ? raw : ['Tulis poin pertama', 'Tulis poin kedua', 'Tulis poin ketiga'];
          const padIn = S * 0.045;
          let top = cardY + padIn;
          const header = (scene.primaryInput || '').trim();
          if (header) {
            const hf = fitText(ctx, header, cardW - padIn * 2, 1, S * 0.038, S * 0.028, 800, canvasFont);
            ctx.save();
            ctx.fillStyle = pal.cardText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(hf.lines[0], cardX + padIn, top);
            ctx.restore();
            top += hf.size * 1.6;
          }
          const n = items.length;
          const rowH = Math.max(S * 0.06, Math.min(S * 0.16, (cardY + cardH - padIn - top) / n));
          top += Math.max(0, (cardY + cardH - padIn - top - rowH * n) / 2);
          const badgeR = Math.min(S * 0.034, rowH * 0.32);
          const textX = cardX + padIn + badgeR * 2 + S * 0.03;
          const textW = cardX + cardW - padIn - textX;
          const span = 0.55 / n;
          items.forEach((item, i) => {
            const m = item.match(/^(\d{1,2})[.)]\s*(.*)$/);
            const num = m ? m[1] : '';
            const label = m ? m[2] : item;
            const start = 0.08 + i * span;
            const appear = smoothStep(start, start + 0.1, progress);
            if (appear <= 0) return;
            const tick = smoothStep(start + 0.06, start + 0.16, progress);
            const rowY = top + i * rowH;
            const cy = rowY + rowH / 2;
            ctx.save();
            ctx.globalAlpha = appear;
            ctx.translate((1 - appear) * S * 0.05, 0);
            if (progress >= start && progress < start + span + 0.08) {
              ctx.fillStyle = pal.accentSoft;
              drawRoundedRect(
                ctx,
                cardX + padIn * 0.5,
                rowY + rowH * 0.08,
                cardW - padIn,
                rowH * 0.84,
                Math.min(14, rowH * 0.3)
              );
              ctx.fill();
            }
            const bx = cardX + padIn + badgeR;
            ctx.beginPath();
            ctx.arc(bx, cy, badgeR, 0, Math.PI * 2);
            ctx.fillStyle = tick > 0.5 ? pal.accent : pal.accentSoft;
            ctx.fill();
            const ink = tick > 0.5 ? readableOn(pal.accent) : pal.accent;
            if (num) {
              ctx.fillStyle = ink;
              ctx.font = `800 ${Math.round(badgeR * 1.05)}px ${canvasFont}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(num, bx, cy + 1);
            } else {
              drawCheck(ctx, bx, cy, badgeR * 1.15, ink, Math.max(0.15, tick));
            }
            const tf = fitText(ctx, label, textW, 2, Math.min(S * 0.04, rowH * 0.36), S * 0.024, 700, canvasFont);
            ctx.fillStyle = pal.cardText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const lh = tf.size * 1.22;
            tf.lines.forEach((ln, li) =>
              ctx.fillText(ln, textX, cy - ((tf.lines.length - 1) * lh) / 2 + li * lh)
            );
            ctx.restore();
          });
        }
      } else if (wType === 'step_number_card') {
        // Angka/simbol besar (mis. "3" atau "!") dengan keterangan di sampingnya
        cursorTarget = null;
        if (cardH > S * 0.12) {
          paintCard();
          const glyph = (scene.primaryInput || '').trim() || String(index + 1);
          const lines = splitItems(scene.secondaryInput);
          const padIn = S * 0.05;
          const hasText = lines.length > 0;
          const circR = Math.min(
            (hasText ? cardW * 0.36 : cardW - padIn * 2) / 2,
            (cardH - padIn * 2) / 2
          );
          const gcx = hasText ? cardX + padIn + circR : cardX + cardW / 2;
          const gcy = cardY + cardH / 2;
          const pop = solveSpring(Math.max(0, localTime - 0.12), { stiffness: 200, damping: 12 });
          ctx.save();
          ctx.globalAlpha = Math.min(1, pop * 1.4);
          ctx.beginPath();
          ctx.arc(gcx, gcy, circR * (0.55 + 0.45 * pop), 0, Math.PI * 2);
          ctx.fillStyle = pal.accentSoft;
          ctx.fill();
          const gf = fitText(ctx, glyph, circR * 1.6, 1, circR * 1.35, S * 0.05, 900, canvasFont);
          ctx.translate(gcx, gcy);
          ctx.rotate((1 - pop) * -0.3);
          ctx.scale(0.5 + 0.5 * pop, 0.5 + 0.5 * pop);
          ctx.fillStyle = pal.accent;
          ctx.font = `900 ${Math.round(gf.size)}px ${canvasFont}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(gf.lines[0], 0, gf.size * 0.04);
          ctx.restore();
          if (hasText) {
            const tx = gcx + circR + S * 0.04;
            const tw = cardX + cardW - padIn - tx;
            const appear = smoothStep(0.16, 0.38, progress);
            if (appear > 0 && tw > S * 0.1) {
              const first = fitText(ctx, lines[0], tw, lines.length > 1 ? 2 : 5, S * 0.052, S * 0.03, 800, canvasFont);
              const restText = lines.slice(1).join(' ');
              const rest = restText ? fitText(ctx, restText, tw, 4, S * 0.034, S * 0.024, 500, canvasFont) : null;
              const firstLH = first.size * 1.18;
              const restLH = rest ? rest.size * 1.35 : 0;
              const totalH =
                first.lines.length * firstLH + (rest ? S * 0.015 + rest.lines.length * restLH : 0);
              let ty = gcy - totalH / 2;
              ctx.save();
              ctx.globalAlpha = appear;
              ctx.translate((1 - appear) * S * 0.04, 0);
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              ctx.fillStyle = pal.cardText;
              ctx.font = `800 ${Math.round(first.size)}px ${canvasFont}`;
              first.lines.forEach((ln) => {
                ctx.fillText(ln, tx, ty);
                ty += firstLH;
              });
              if (rest) {
                ty += S * 0.015;
                ctx.globalAlpha = appear * 0.72;
                ctx.font = `500 ${Math.round(rest.size)}px ${canvasFont}`;
                rest.lines.forEach((ln) => {
                  ctx.fillText(ln, tx, ty);
                  ty += restLH;
                });
              }
              ctx.restore();
            }
          }
        }
      } else if (wType === 'quote_card') {
        // Kutipan: tanda kutip besar, teks muncul seperti diketik, lalu digaris bawahi
        cursorTarget = null;
        if (cardH > S * 0.12) {
          paintCard();
          const quote = (scene.primaryInput || '').trim() || 'Tulis kutipanmu di sini.';
          const signature = splitItems(scene.secondaryInput)[0] || '';
          const padIn = S * 0.06;
          const glyphSize = Math.min(S * 0.2, cardH * 0.36);
          ctx.save();
          ctx.globalAlpha = 0.85 * smoothStep(0, 0.14, progress);
          ctx.fillStyle = pal.accent;
          ctx.font = `700 ${Math.round(glyphSize)}px Georgia, 'Times New Roman', serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('“', cardX + padIn * 0.7, cardY + padIn * 0.25);
          ctx.restore();
          const qTop = cardY + padIn * 0.25 + glyphSize * 0.62;
          const sigH = signature ? S * 0.06 : 0;
          const qAvail = cardY + cardH - padIn * 0.8 - sigH - qTop;
          if (qAvail > S * 0.04) {
            const maxLines = Math.max(1, Math.min(6, Math.floor(qAvail / (S * 0.034 * 1.32))));
            const qf = fitText(ctx, quote, cardW - padIn * 2, maxLines, S * 0.056, S * 0.03, 700, canvasFont);
            const lh = qf.size * 1.32;
            const y0 = qTop + Math.max(0, (qAvail - qf.lines.length * lh) / 2);
            const total = qf.lines.reduce((acc, l) => acc + l.length, 0);
            let remaining = Math.floor(total * smoothStep(0.05, 0.52, progress));
            ctx.save();
            ctx.fillStyle = pal.cardText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = `700 ${Math.round(qf.size)}px ${canvasFont}`;
            qf.lines.forEach((ln, li) => {
              if (remaining <= 0) return;
              ctx.fillText(ln.slice(0, remaining), cardX + padIn, y0 + li * lh);
              remaining -= ln.length;
            });
            const ul = smoothStep(0.55, 0.75, progress);
            if (ul > 0) {
              const last = qf.lines[qf.lines.length - 1];
              const lw = ctx.measureText(last).width;
              const uy = y0 + (qf.lines.length - 1) * lh + qf.size * 1.1;
              ctx.strokeStyle = pal.accent;
              ctx.lineWidth = Math.max(3, S * 0.007);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cardX + padIn, uy);
              ctx.lineTo(cardX + padIn + lw * ul, uy);
              ctx.stroke();
            }
            ctx.restore();
          }
          if (signature) {
            ctx.save();
            ctx.globalAlpha = 0.7 * smoothStep(0.58, 0.78, progress);
            ctx.fillStyle = pal.cardText;
            ctx.font = `600 ${Math.round(S * 0.03)}px ${canvasFont}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`— ${signature}`, cardX + cardW - padIn, cardY + cardH - padIn * 0.7);
            ctx.restore();
          }
        }
      } else if (wType === 'cta_button_card') {
        // Tombol ajakan yang diklik kursor, plus chip info (nama toko, link di bio, dll.)
        cursorTarget = null;
        if (cardH > S * 0.12) {
          paintCard();
          const label = (scene.primaryInput || '').trim() || 'Pesan Sekarang';
          const chips = splitItems(scene.secondaryInput).slice(0, 4);
          const padIn = S * 0.05;
          const chipH = S * 0.058;
          const chipGap = S * 0.035;
          const btnH = Math.min(S * 0.13, (cardH - padIn * 2 - (chips.length ? chipH + chipGap : 0)) * 0.9);
          const btnW = Math.min(cardW - padIn * 2, Math.max(S * 0.45, cardW * 0.78));
          const btnX = cardX + (cardW - btnW) / 2;
          const blockH = btnH + (chips.length ? chipGap + chipH : 0);
          const btnY = cardY + (cardH - blockH) / 2;
          const clicked = progress >= 0.58;
          const pressed = progress > 0.54 && progress < 0.63;
          const enter = solveSpring(Math.max(0, localTime - 0.1), { stiffness: 220, damping: 14 });
          if (btnH > S * 0.04) {
            if (!clicked) {
              const pulse = (Math.sin(timeSec * 5) + 1) / 2;
              const g = S * 0.012 + pulse * S * 0.012;
              ctx.save();
              ctx.globalAlpha = (0.14 + 0.16 * pulse) * enter;
              ctx.fillStyle = pal.accent;
              drawRoundedRect(ctx, btnX - g, btnY - g, btnW + g * 2, btnH + g * 2, (btnH + g * 2) / 2);
              ctx.fill();
              ctx.restore();
            }
            ctx.save();
            ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
            const bs = (pressed ? 0.95 : 1) * (0.7 + 0.3 * enter);
            ctx.scale(bs, bs);
            ctx.globalAlpha = Math.min(1, enter * 1.4);
            const fillCol = clicked ? '#10b981' : pal.accent;
            ctx.fillStyle = fillCol;
            drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
            ctx.fill();
            const bf = fitText(ctx, clicked ? `✓ ${label}` : label, btnW - btnH * 0.7, 1, btnH * 0.36, btnH * 0.22, 800, canvasFont);
            ctx.fillStyle = readableOn(fillCol);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bf.lines[0], 0, 1);
            ctx.restore();
          }
          if (chips.length) {
            ctx.save();
            ctx.font = `600 ${Math.round(S * 0.027)}px ${canvasFont}`;
            const maxRow = cardW - padIn * 2;
            const widths = chips.map((c) => Math.min(ctx.measureText(c).width + S * 0.05, maxRow));
            const rowWidth = (k: number) =>
              widths.slice(0, k).reduce((a, b) => a + b, 0) + S * 0.02 * (k - 1);
            let count = chips.length;
            while (count > 1 && rowWidth(count) > maxRow) count--;
            let cx0 = cardX + (cardW - rowWidth(count)) / 2;
            const cy0 = btnY + btnH + chipGap;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < count; i++) {
              const a = smoothStep(0.18 + i * 0.08, 0.34 + i * 0.08, progress);
              const dy = (1 - a) * S * 0.02;
              ctx.globalAlpha = a;
              ctx.fillStyle = pal.accentSoft;
              drawRoundedRect(ctx, cx0, cy0 + dy, widths[i], chipH, chipH / 2);
              ctx.fill();
              ctx.fillStyle = pal.cardText;
              ctx.fillText(
                ellipsize(ctx, chips[i], widths[i] - S * 0.04),
                cx0 + widths[i] / 2,
                cy0 + chipH / 2 + dy
              );
              cx0 += widths[i] + S * 0.02;
            }
            ctx.restore();
          }
          const moveT = smoothStep(0.3, 0.54, progress);
          const startPos = { x: btnX + btnW * 0.92, y: btnY + btnH + S * 0.16 };
          const endPos = { x: btnX + btnW * 0.6, y: btnY + btnH * 0.62 };
          cursorTarget = {
            x: lerp(startPos.x, endPos.x, moveT),
            y: lerp(startPos.y, endPos.y, moveT) - Math.sin(moveT * Math.PI) * 18,
            isPressed: pressed,
            ripple: smoothStep(0.55, 0.78, progress),
          };
        }
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
        ctx.font = `700 ${Math.round(W * 0.024)}px ${canvasFont}`;
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

      if (showCursorSim && cursorTarget) {
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
      ctx.restore();
      ctx = mainCtx;
      compositeScene(
        ctx,
        layer,
        W,
        H,
        scene.transition || 'fade',
        localTime,
        duration,
        index === scenes.length - 1,
        timeSec,
        scene.customTransition || findTransitionPack(scene.transitionPackId)?.spec || null
      );

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

      if (showSafeZone && !forExport) {
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
      canvasFont,
      cardRadius,
      showParticles,
      showCursorSim,
      showSafeZone,
      scenes,
    ]
  );

  // Loop animasi: waktu disimpan di ref, React hanya diperbarui ±8x per detik (bukan 60x)
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let lastUi = 0;
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (!exportingRef.current) {
        if (isPlaying && totalDuration > 0) {
          let next = timeRef.current + dt;
          if (next >= totalDuration) next = 0;
          timeRef.current = next;
          if (now - lastUi > 120) {
            lastUi = now;
            setCurrentTime(next);
            const { index } = getSceneAtTime(next);
            setActiveSceneIndex((prev) => (prev === index ? prev : index));
          }
        }
        renderFrame(timeRef.current);
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration, getSceneAtTime, renderFrame]);

  const sceneStartTime = (i: number) =>
    scenes.slice(0, Math.max(0, i)).reduce((acc, sc) => acc + (Number(sc.duration) || 3.4), 0);

  const jumpToScene = (i: number) => {
    const idx = Math.max(0, Math.min(scenes.length - 1, i));
    setActiveSceneIndex(idx);
    seekTo(sceneStartTime(idx) + 0.05);
  };

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  const updateActiveScene = (patch: Partial<StudioSceneItem>) => {
    setScenes((prev) =>
      prev.map((sc, idx) => (idx === activeSceneIndex ? { ...sc, ...patch } : sc))
    );
  };

  const sceneTransform: SceneTransform = {
    x: activeScene?.transform?.x ?? 0,
    y: activeScene?.transform?.y ?? 0,
    scale: activeScene?.transform?.scale ?? 1,
    rotation: activeScene?.transform?.rotation ?? 0,
    opacity: activeScene?.transform?.opacity ?? 1,
  };

  const setSceneTransform = (patch: Partial<SceneTransform>) => {
    updateActiveScene({ transform: { ...sceneTransform, ...patch } });
  };

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    index: number;
    base: SceneTransform;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      index: activeSceneIndex,
      base: sceneTransform,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.width;
    const dy = (event.clientY - drag.startY) / drag.height;
    const nextX = Math.max(-0.5, Math.min(0.5, drag.base.x + dx));
    const nextY = Math.max(-0.5, Math.min(0.5, drag.base.y + dy));
    setScenes((prev) =>
      prev.map((scene, idx) =>
        idx === drag.index ? { ...scene, transform: { ...drag.base, x: nextX, y: nextY } } : scene
      )
    );
  };

  const endCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current && event.currentTarget.hasPointerCapture(dragRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  const applyComponentCodeToScene = (code: string) => {
    const style = parseComponentCode(code);
    updateActiveScene({
      componentCode: code,
      componentStyle: { ...(activeScene?.componentStyle || {}), ...style },
    });
  };

  const applyTemplate = (vid: TrainedVideoPresetItem) => {
    setSelectedTemplateId(vid.id);
    setScenes(JSON.parse(JSON.stringify(vid.scenesBlueprint)));
    if (vid.category !== 'saas') setStudioCategory(vid.category);
    setFontName(suggestedFontFor(vid.category));
    setActiveSceneIndex(0);
    seekTo(0);
    showToast(`Template "${vid.title}" diterapkan. Semua teks & tampilan bisa diedit.`);
  };

  const handleGenerateFromPrompt = () => {
    const topic = smartPrompt.trim();
    if (!topic) {
      showToast('Tulis topik videonya dulu.');
      return;
    }
    const result = generateScript(topic, studioCategory, {
      customStoreName: studioCategory === 'promo' && storeName.trim() ? storeName.trim() : undefined,
      stylePackId: stylePackChoice === 'auto' ? undefined : stylePackChoice,
    });

    // Template simpanan admin dengan kata kunci yang cocok ikut menentukan palet & kamera
    const lower = topic.toLowerCase();
    const matched = trainedVideos.find(
      (v) =>
        v.isTrained &&
        (v.category === studioCategory || v.category === 'saas') &&
        v.triggerKeywords
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .some((k) => k.length > 2 && lower.includes(k))
    );
    const camera = cameraChoice !== 'auto' ? cameraChoice : undefined;
    let next = sceneItemsToStudio(result.scenes, camera);
    if (matched && palettes[matched.paletteId]) {
      next = next.map((sc) => ({
        ...sc,
        paletteId: matched.paletteId,
        cameraMotion: camera || matched.cameraMotion,
      }));
    }
    setScenes(next);
    setFontName(result.suggestedStyle.font);
    setBeatBpm(result.suggestedMusic.bpm);
    setLastRecipe(result.recipe || null);
    scriptBaseRef.current = {
      ...scriptBaseRef.current,
      hook: result.hook,
      caption: result.caption,
      hashtags: result.hashtags,
      recipe: result.recipe,
      extractedMeta: result.extractedMeta,
    };
    const ar = result.recipe?.keys.aspect;
    if (ar) setAspectRatio(ar);
    setActiveSceneIndex(0);
    seekTo(0);
    showToast(
      matched
        ? `Gaya "${result.recipe?.packName}" + template "${matched.title}". Klik lagi untuk variasi lain.`
        : `Gaya "${result.recipe?.packName}", ${next.length} scene${ar ? `, rasio ${ar}` : ''}. Klik lagi untuk variasi lain.`
    );
  };

  /** Ganti gaya visual semua scene (teks tetap). */
  const handleShuffleStyle = () => {
    const keys = analyzePrompt(smartPrompt || projectTitle, studioCategory);
    const current = scenes[0]?.paletteId;
    const candidates = getStylePacks().filter(
      (p) =>
        p.id !== 'preview-admin' &&
        (!p.categories || p.categories.includes(studioCategory)) &&
        paletteIdOfPack(p) !== current
    );
    const pack = candidates[Math.floor(Math.random() * candidates.length)] || getStylePacks()[0];
    setScenes((prev) =>
      prev.map((sc, i) => ({
        ...sc,
        ...styleFieldsFor(pack, i, sc.widgetType, true, keys, Math.random, sc.layout === 'center-text' ? 'center-text' : undefined),
      }))
    );
    setFontName(pack.font);
    setLastRecipe((r) => (r ? { ...r, packId: pack.id, packName: pack.name } : r));
    showToast(`Gaya diganti ke "${pack.name}". Teks tidak berubah.`);
  };

  const handleSaveAsProject = async () => {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showToast('Masuk dulu untuk menyimpan proyek.');
        return;
      }
      setSaveState('saving');
      const snapshot: StudioSnapshot = {
        version: 1,
        scenes,
        fontName,
        aspectRatio,
        category: studioCategory,
        savedAt: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: userData.user.id,
            title: projectTitle.trim() || 'Proyek tanpa judul',
            topic: smartPrompt,
            category: studioCategory,
            template_id: TEMPLATE_BY_CATEGORY[studioCategory],
            script_json: { ...scriptBaseRef.current, studio: snapshot },
            style_json: { font: fontName, aspectRatio },
            status: 'draft',
          },
        ])
        .select('id')
        .single();
      if (error || !data) {
        setSaveState('error');
        showToast(`Gagal menyimpan: ${error?.message || 'database tidak mengembalikan data'}`);
        return;
      }
      showToast('Proyek tersimpan. Perubahan berikutnya disimpan otomatis.');
      router.replace(`/editor/${data.id}`);
    } catch {
      setSaveState('error');
      showToast('Gagal menyimpan. Periksa koneksi atau konfigurasi Supabase.');
    }
  };

  /* ---------- Admin: trainer gaya dari referensi ---------- */

  const applyStyleForm = (st: Partial<StylePack>) => {
    if (st.colors) setRefColors(st.colors);
    if (st.bgStyle) setRefBg(st.bgStyle);
    if (st.layout) setRefLayout(st.layout);
    if (st.transition) setRefTransition(st.transition);
    if (st.headlineAnim) setRefAnim(st.headlineAnim);
    if (st.font) setRefFont(st.font);
    if (st.camera) setRefCamera(st.camera);
    if (st.pace) setRefPace(st.pace);
  };

  const refFormPack = () => ({
    name: refName.trim() || 'Gaya referensi',
    tags: refTags,
    categories: refCats,
    colors: refColors,
    bgStyle: refBg,
    layout: refLayout,
    transition: refTransition,
    headlineAnim: refAnim,
    font: refFont,
    camera: refCamera,
    pace: refPace,
    decor: refDecor.trim() || undefined,
  });

  const handleRefFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) {
      showToast('File terlalu besar (maksimal 300 MB).');
      return;
    }
    setRefBusy(true);
    try {
      const result = await analyzeVideoFile(file);
      applyStyleForm(result.suggestion);
      setRefName((n) => n || file.name.replace(/\.[^.]+$/, '').slice(0, 50));
      setRefTags((t) => t || result.tags.join(', '));
      setRefSource({ kind: 'file', label: file.name, thumbs: result.frames, notes: result.notes });
      showToast('Video dianalisis. Cek dan sesuaikan gayanya sebelum disimpan.');
    } catch (err) {
      showToast(`Video tidak bisa dianalisis: ${err instanceof Error ? err.message : 'format tidak didukung'}`);
    } finally {
      setRefBusy(false);
    }
  };

  const handleRefLink = async () => {
    const url = refLink.trim();
    if (!url) return;
    setRefBusy(true);
    try {
      const res = await fetch(`/api/reference?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const title: string = data.title || '';
      let colors: ColorAnalysis | null = null;
      let thumb = '';
      if (data.thumbnailUrl) {
        thumb = `/api/reference?thumb=${encodeURIComponent(data.thumbnailUrl)}`;
        try {
          colors = await analyzeImageColors(thumb);
        } catch {
          colors = null;
        }
      }
      if (colors) {
        applyStyleForm({
          colors: { bgStart: colors.bgStart, bgEnd: colors.bgEnd, accent: colors.accent, isDark: colors.isDark },
          bgStyle: colors.isDark ? 'spotlight' : colors.colorful >= 4 ? 'blobs' : 'mesh',
        });
      }
      setRefName((n) => n || title.replace(/#\S+/g, '').trim().slice(0, 50) || 'Gaya referensi');
      setRefTags((t) => t || tagsFromText(title).join(', '));
      setRefSource({
        kind: 'link',
        label: `${data.provider} • ${data.author || 'kreator'}`,
        url,
        author: data.author || undefined,
        thumbs: thumb ? [thumb] : [],
        notes: [
          title ? `Judul: ${title.slice(0, 140)}` : 'Judul tidak tersedia.',
          colors
            ? `Warna dari thumbnail: ${colors.bgStart}, ${colors.bgEnd}, aksen ${colors.accent}.`
            : 'Warna thumbnail tidak terbaca.',
          'Gerak, tempo, dan transisi tidak bisa dibaca dari link. Atur manual, atau unggah file videonya.',
        ],
      });
    } catch (err) {
      showToast(`Link tidak bisa dibaca: ${err instanceof Error ? err.message : 'coba lagi'}`);
    } finally {
      setRefBusy(false);
    }
  };

  const handlePreviewStyle = () => {
    const pack = normalizeStylePack(refFormPack(), 'preview-admin', refName || 'Pratinjau');
    if (!pack) return;
    addStylePackToEngine(pack);
    const keys = analyzePrompt(smartPrompt || projectTitle, studioCategory);
    setScenes((prev) =>
      prev.map((sc, i) => ({
        ...sc,
        ...styleFieldsFor(pack, i, sc.widgetType, true, keys, Math.random, sc.layout === 'center-text' ? 'center-text' : undefined),
      }))
    );
    setFontName(pack.font);
    showToast('Gaya dicoba di kanvas (belum disimpan).');
  };

  const handleSaveStyle = async () => {
    if (!isAdmin) {
      showToast('Hanya admin yang bisa menyimpan gaya.');
      return;
    }
    if (!refTags.trim()) {
      showToast('Isi kata pemicu dulu supaya gaya ini bisa dipilih generator.');
      return;
    }
    const form = refFormPack();
    setRefBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .insert([
          {
            type: 'video_motion',
            category: refCats.length === 1 ? refCats[0] : 'all',
            content_text: form.name,
            subtext: refTags,
            video_url: refSource?.url || null,
            creator_handle: refSource?.author || null,
            motion_profile: {},
            metadata_json: {
              style_pack: form,
              source: refSource?.kind || 'manual',
              analysis_notes: refSource?.notes || [],
            },
          },
        ])
        .select('*')
        .single();
      if (error || !data) {
        showToast(`Gaya gagal disimpan: ${error?.message || 'database tidak mengembalikan data'}`);
        return;
      }
      const row = data as TrainingRow;
      const pack = normalizeStylePack(form, `db-${row.id}`, form.name);
      if (pack) addStylePackToEngine(pack);
      removeStylePackFromEngine('preview-admin');
      setSupabaseRows((prev) => [row, ...prev]);
      showToast(`Gaya "${form.name}" tersimpan. Prompt dengan kata pemicunya akan memakai gaya ini.`);
    } catch (err) {
      showToast(`Gaya gagal disimpan: ${err instanceof Error ? err.message : 'koneksi bermasalah'}`);
    } finally {
      setRefBusy(false);
    }
  };

  const handleShareExport = async () => {
    if (!exportResult) return;
    try {
      const blob = await fetch(exportResult.url).then((r) => r.blob());
      const file = new File([blob], exportResult.name, { type: exportResult.type });
      const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
      if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: projectTitle });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
    triggerDownload(exportResult.url, exportResult.name);
    showToast('Browser ini tidak bisa membagikan file langsung, jadi videonya diunduh.');
  };

  // Admin: Save Current Canvas Blueprint as a New Trained Video Preset
  const handleAdminSaveVideoPreset = async () => {
    if (!isAdmin) {
      showToast('Hanya admin yang bisa menyimpan preset.');
      return;
    }
    const title = adminPresetTitle.trim() || 'Preset tanpa judul';
    const profile = analyzeCreatorVideoReference(adminVideoUrl, adminPresetTitle, adminCreatorHandle);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .insert([
          {
            type: 'video_motion',
            // 'saas' disimpan sebagai 'all' agar lolos constraint kategori skema lama
            category: adminCategory === 'saas' ? 'all' : adminCategory,
            content_text: title,
            subtext: adminTriggerKeywords,
            video_url: adminVideoUrl.trim() || null,
            creator_handle: adminCreatorHandle.trim() || null,
            motion_profile: profile,
            metadata_json: {
              preset_category: adminCategory,
              scenes_blueprint: scenes,
              trigger_keywords: adminTriggerKeywords,
              stiffness: adminStiffness,
              damping: adminDamping,
              bpm: adminBpm,
            },
          },
        ])
        .select('*')
        .single();
      if (error || !data) {
        showToast(`Preset gagal disimpan: ${error?.message || 'database tidak mengembalikan data'}`);
        return;
      }
      const row = data as TrainingRow;
      const preset = rowToPreset(row);
      setSupabaseRows((prev) => [row, ...prev]);
      if (preset) setTrainedVideos((prev) => [preset, ...prev.filter((p) => p.id !== preset.id)]);
      showToast(`Preset "${title}" tersimpan dan tersedia untuk semua user.`);
    } catch (err) {
      showToast(`Preset gagal disimpan: ${err instanceof Error ? err.message : 'koneksi bermasalah'}`);
    }
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

  const handleAdminSaveCreativeCode = async () => {
    if (!isAdmin) {
      showToast('Hanya admin yang bisa menyimpan pack.');
      return;
    }
    if (!adminCodeName.trim()) {
      showToast('Beri nama pack-nya dulu.');
      return;
    }
    if (!adminCodeText.trim()) {
      showToast('Tempel kode / SVG-nya dulu.');
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .insert([
          {
            type: `${adminCodeKind}_pack`,
            category: adminCodeCategory,
            content_text: adminCodeName.trim(),
            subtext: adminCodeTags.trim() || 'admin, kustom',
            metadata_json: {
              kind: adminCodeKind,
              code: adminCodeText,
              ...(adminCodeKind === 'icon' ? { svg: adminCodeText } : {}),
            },
          },
        ])
        .select('*')
        .single();
      if (error || !data) {
        showToast(`Pack gagal disimpan: ${error?.message || 'database tidak mengembalikan data'}`);
        return;
      }
      const row = data as TrainingRow;
      applyTrainingRow(row);
      setSupabaseRows((prev) => [row, ...prev]);
      setAdminCodeName('');
      setAdminCodeTags('');
      showToast(`Pack "${row.content_text}" tersimpan dan langsung tersedia untuk user.`);
    } catch (err) {
      showToast(`Pack gagal disimpan: ${err instanceof Error ? err.message : 'koneksi bermasalah'}`);
    }
  };

  const handleAdminSaveRule = async () => {
    if (!isAdmin) {
      showToast('Hanya admin yang bisa menyimpan aturan.');
      return;
    }
    if (!ruleContent.trim()) {
      showToast('Isi teks aturannya dulu.');
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .insert([
          {
            type: ruleType,
            category: ruleCategory,
            content_text: ruleContent.trim(),
            subtext: ruleSubtext.trim() || null,
            emoji: '✨',
          },
        ])
        .select('*');
      if (error || !data) {
        showToast(`Aturan gagal disimpan: ${error?.message || 'database tidak mengembalikan data'}`);
        return;
      }
      setSupabaseRows((prev) => [...(data as TrainingRow[]), ...prev]);
      await loadTrainingIntoEngine();
      showToast('Aturan tersimpan dan langsung dipakai generator.');
    } catch (err) {
      showToast(`Aturan gagal disimpan: ${err instanceof Error ? err.message : 'koneksi bermasalah'}`);
    }
  };

  const handleExportVideo = async () => {
    if (exportingRef.current) return;
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      showToast('Browser ini belum bisa merekam video. Pakai Chrome, Edge, atau Safari terbaru.');
      return;
    }
    const mime = pickRecorderMime();
    if (!mime) {
      showToast('Browser ini tidak mendukung perekaman MP4 maupun WebM.');
      return;
    }
    const size = EXPORT_SIZES[aspectRatio];
    const out = document.createElement('canvas');
    out.width = size.w;
    out.height = size.h;
    if (typeof out.captureStream !== 'function') {
      showToast('Browser ini belum bisa merekam kanvas.');
      return;
    }
    const ratio = size.w / canvasDims.w;
    // AudioContext dibuat langsung saat klik (aturan autoplay browser)
    let audio: AudioContext | null = null;
    if (withBeat && typeof AudioContext !== 'undefined') audio = new AudioContext();
    exportingRef.current = true;
    setIsPlaying(false);
    setExportProgress(0);
    if (exportResult) {
      URL.revokeObjectURL(exportResult.url);
      setExportResult(null);
    }
    showToast('Merekam video… jangan pindah tab sampai selesai.');
    try {
      await ensureCanvasFont(fontName);
      const stream = out.captureStream(30);
      if (audio) {
        const dest = audio.createMediaStreamDestination();
        scheduleBeat(audio, dest, beatBpm, totalDuration);
        dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      renderFrame(0, out, ratio, true);
      recorder.start(250);
      const t0 = performance.now();
      await new Promise<void>((resolve) => {
        let lastUi = 0;
        const tick = (now: number) => {
          const t = (now - t0) / 1000;
          renderFrame(Math.min(t, totalDuration - 0.001), out, ratio, true);
          if (now - lastUi > 200) {
            lastUi = now;
            setExportProgress(Math.min(1, t / totalDuration));
          }
          if (t >= totalDuration + 0.15) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((track) => track.stop());
      const type = mime.split(';')[0];
      const ext = type === 'video/mp4' ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type });
      if (!blob.size) throw new Error('hasil rekaman kosong');
      const name = `${slugify(projectTitle) || 'motionku'}-${aspectRatio.replace(':', 'x')}.${ext}`;
      const url = URL.createObjectURL(blob);
      setExportResult({ url, name, type });
      triggerDownload(url, name);
      showToast(
        ext === 'mp4'
          ? `Video MP4 ${size.w}×${size.h} (${totalDuration.toFixed(1)} detik) siap.`
          : `Video WebM ${size.w}×${size.h} siap. Kalau aplikasi menolak WebM, ubah dulu ke MP4.`
      );
    } catch (err) {
      showToast(`Render gagal: ${err instanceof Error ? err.message : 'kesalahan tidak dikenal'}`);
    } finally {
      if (audio) audio.close().catch(() => undefined);
      exportingRef.current = false;
      setExportProgress(null);
      setIsPlaying(true);
    }
  };

  const canvasDims =
    aspectRatio === '1:1'
      ? { w: 720, h: 720, cssW: 400 * zoom, cssH: 400 * zoom }
      : aspectRatio === '16:9'
      ? { w: 960, h: 540, cssW: 520 * zoom, cssH: 292 * zoom }
      : { w: 540, h: 960, cssW: 315 * zoom, cssH: 560 * zoom };

  // Kanvas selalu diskalakan agar muat di area tengah (lebar DAN tinggi),
  // lalu zoom pengguna menjadi pengali dari ukuran "fit" tersebut.
  const stagePadding = 24;
  const fitScale =
    canvasStage.w > 0 && canvasStage.h > 0
      ? Math.min(
          (canvasStage.w - stagePadding * 2) / canvasDims.w,
          (canvasStage.h - stagePadding * 2) / canvasDims.h
        )
      : 0;
  const displayScale = fitScale > 0 ? Math.max(0.12, fitScale) * zoom : 0;
  const canvasCssW = displayScale > 0 ? Math.round(canvasDims.w * displayScale) : canvasDims.cssW;
  const canvasCssH = displayScale > 0 ? Math.round(canvasDims.h * displayScale) : canvasDims.cssH;

  const widgetFields = WIDGET_FIELDS[normalizeWidgetType(activeScene?.widgetType)];

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return trainedVideos.filter((vid) => {
      if (templateCategory !== 'all' && vid.category !== templateCategory) return false;
      if (!query) return true;
      return (
        vid.title.toLowerCase().includes(query) ||
        vid.summary.toLowerCase().includes(query) ||
        vid.triggerKeywords.toLowerCase().includes(query) ||
        CATEGORY_LABEL[vid.category].toLowerCase().includes(query)
      );
    });
  }, [trainedVideos, templateSearch, templateCategory]);

  const visibleTemplates = filteredTemplates.slice(0, templateLimit);

  const packCounts = creativePackCounts();
  const packSource = useMemo(() => {
    if (packKind === 'icon') return getIconPacks();
    if (packKind === 'component') return getComponentPacks();
    if (packKind === 'transition') return getTransitionPacks();
    return getAnimationPacks();
  }, [packKind, supabaseRows]);
  const filteredPacks = useMemo(() => {
    const query = packSearch.trim().toLowerCase();
    if (!query) return packSource;
    return packSource.filter(
      (pack) =>
        pack.name.toLowerCase().includes(query) ||
        pack.tags.join(' ').toLowerCase().includes(query) ||
        pack.author.includes(query)
    );
  }, [packSource, packSearch]);
  const visiblePacks = filteredPacks.slice(0, packLimit);
  const activeIconPack = findIconPack(activeScene?.iconPackId);
  const activeComponentPack = findComponentPack(activeScene?.componentPackId);
  const activeTransitionPack = findTransitionPack(activeScene?.transitionPackId);
  const activeAnimationPack = findAnimationPack(activeScene?.animationPackId);
  const adminCodePreviewPaths = useMemo(
    () => (adminCodeKind === 'icon' ? parseSvgIcon(adminCodeText) : []),
    [adminCodeKind, adminCodeText]
  );
  const adminCodePreviewStyle = useMemo(
    () => (adminCodeKind === 'component' ? parseComponentCode(adminCodeText) : {}),
    [adminCodeKind, adminCodeText]
  );

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#090a0f] text-slate-100 select-none font-sans pb-14 lg:pb-0 mk-studio">
      {/* TOP BAR (IDENTICAL TO IMAGE_892545.JPG) */}
      <header className="shrink-0 border-b border-[#222636] bg-[#10121a] px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30">
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
                className="bg-transparent hover:bg-[#1a1d29] focus:bg-[#1a1d29] focus:outline-none px-2 py-0.5 rounded text-xs font-bold text-white w-36 sm:w-56"
              />
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-lime-400/20 text-lime-300 border border-lime-400/30">
                {CATEGORY_LABEL[studioCategory]}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 px-2 flex items-center gap-2">
              <span
                className={
                  saveState === 'error' || saveState === 'loadfail' ? 'text-rose-400' : saveState === 'saved' ? 'text-emerald-400' : ''
                }
              >
                {{
                  idle: 'Draf, belum disimpan',
                  loading: 'Memuat proyek…',
                  loadfail: 'Gagal memuat proyek',
                  saving: 'Menyimpan…',
                  saved: 'Tersimpan',
                  error: 'Gagal menyimpan',
                  local: 'Belum tersimpan di akun',
                }[saveState]}
              </span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">
                {trainedVideos.length} preset tersedia
              </span>
            </div>
          </div>
        </div>

        {/* Center Switcher: hanya tampil untuk akun admin */}
        {isAdmin && (
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
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#181b26] border border-[#272b3a] rounded-lg p-0.5 text-[11px]">
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

          {(!projectId || saveState === 'local') && (
            <button
              type="button"
              onClick={handleSaveAsProject}
              disabled={saveState === 'saving'}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1d2130] border border-[#2a2f42] text-slate-200 disabled:opacity-50"
            >
              Simpan proyek
            </button>
          )}
          <button
            type="button"
            onClick={handleExportVideo}
            disabled={exportProgress !== null}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg flex items-center gap-1.5 disabled:opacity-80"
          >
            <span>⬇</span>
            <span>
              {exportProgress !== null ? `Merekam ${Math.round(exportProgress * 100)}%` : 'Render Video'}
            </span>
          </button>
        </div>
      </header>

      {exportResult && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-xs">
          <span className="text-emerald-300 font-semibold">Video siap: {exportResult.name}</span>
          <button
            type="button"
            onClick={() => triggerDownload(exportResult.url, exportResult.name)}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
          >
            Unduh lagi
          </button>
          <button
            type="button"
            onClick={handleShareExport}
            className="px-2.5 py-1 rounded-lg bg-[#1d2130] border border-[#2a2f42] text-slate-200 font-semibold"
          >
            Bagikan ke TikTok / IG / WA
          </button>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => {
              URL.revokeObjectURL(exportResult.url);
              setExportResult(null);
            }}
            className="ml-auto px-2 text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN STUDIO WORKSPACE (SHARED BY USER & ADMIN) */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDEBAR: USER TABS OR ADMIN UNRESTRICTED TRAINING TABS */}
        <aside className={`${mobilePanel === 'library' ? 'flex' : 'hidden'} flex-1 lg:flex-none lg:flex w-full lg:w-80 min-h-0 border-b lg:border-b-0 lg:border-r border-[#222636] bg-[#11131a] flex-col shrink-0 overflow-hidden`}>
          {roleMode === 'user' ? (
            <>
              <div className="grid grid-cols-5 border-b border-[#222636] bg-[#0c0e14] p-1 gap-1 text-[10px] font-semibold">
                {(
                  [
                    ['prompt', 'Mulai'],
                    ['templates', 'Template'],
                    ['packs', 'Pack'],
                    ['widgets', 'Komponen'],
                    ['layers', 'Layer'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    onClick={() => setLeftTab(key)}
                    className={`py-2 rounded-lg ${
                      leftTab === key
                        ? 'bg-[#1b1f2e] text-[#C8F169] border border-[#C8F169]/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {leftTab === 'prompt' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {showWelcome && (
                    <div className="rounded-2xl border border-[#C8F169]/25 bg-gradient-to-br from-[#7C6CFF]/15 via-[#171a24] to-[#C8F169]/10 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold text-[#C8F169]">Baru di MotionKu?</div>
                          <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                            Cukup 3 langkah: tulis ide, pilih template, lalu edit di kanvas.
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Tutup panduan"
                          onClick={() => setShowWelcome(false)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <ol className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                        <li className="rounded-lg bg-black/20 px-2 py-1.5"><b className="text-white">1.</b> Tulis ide</li>
                        <li className="rounded-lg bg-black/20 px-2 py-1.5"><b className="text-white">2.</b> Pilih template</li>
                        <li className="rounded-lg bg-black/20 px-2 py-1.5"><b className="text-white">3.</b> Edit & render</li>
                      </ol>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLeftTab('templates')}
                          className="flex-1 py-1.5 rounded-lg bg-[#C8F169] text-[#0e0a24] font-bold text-[10px]"
                        >
                          Lihat {trainedVideos.length}+ template
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeftTab('packs')}
                          className="flex-1 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white font-semibold text-[10px]"
                        >
                          Buka pack
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-300">Kategori video</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={studioCategory === opt.value}
                          onClick={() => {
                            setStudioCategory(opt.value);
                            setStylePackChoice('auto');
                          }}
                          className={`py-2 rounded-lg text-[11px] font-semibold border transition ${
                            studioCategory === opt.value
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-[#181b26] border-[#282c3e] text-slate-300 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="studio-topic" className="block text-[11px] font-semibold text-slate-300">
                      Topik video
                    </label>
                    <textarea
                      id="studio-topic"
                      rows={3}
                      value={smartPrompt}
                      onChange={(e) => setSmartPrompt(e.target.value)}
                      placeholder={CATEGORY_HINTS[studioCategory].placeholder}
                      className="w-full rounded-xl bg-[#090b10] border border-[#282c3e] p-2.5 text-xs text-white placeholder:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {CATEGORY_HINTS[studioCategory].hint} Tambahkan suasana, warna, atau platform (mis. &quot;aesthetic
                      hangat&quot;, &quot;merah tegas&quot;, &quot;buat story WA&quot;) supaya gayanya ikut menyesuaikan.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '☕ Promo kopi', text: 'promo kopi susu gula aren dari 25rb jadi 18rb, hangat', cat: 'promo' as CategoryType },
                        { label: '🌙 Quote malam', text: 'kata-kata buat yang lagi capek kerja', cat: 'quote' as CategoryType },
                        { label: '💡 Tips cepat', text: '3 cara mengatur keuangan di usia 20an', cat: 'edukasi' as CategoryType },
                      ].map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => {
                            setStudioCategory(sample.cat);
                            setSmartPrompt(sample.text);
                          }}
                          className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white hover:border-[#7C6CFF]/60"
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {studioCategory === 'promo' && (
                    <label className="block">
                      <span className="block text-[11px] font-semibold text-slate-300 mb-1">Nama toko (opsional)</span>
                      <input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Kedai Kopi Senja"
                        className={INPUT_CLS}
                      />
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    <OptionSelect
                      label="Gaya visual"
                      value={stylePackChoice}
                      options={[
                        ['auto', 'Otomatis dari prompt'] as [string, string],
                        ...getStylePacks()
                          .filter(
                            (p) => p.id !== 'preview-admin' && (!p.categories || p.categories.includes(studioCategory))
                          )
                          .map((p) => [p.id, p.trained ? `${p.name} (admin)` : p.name] as [string, string]),
                      ]}
                      onChange={setStylePackChoice}
                    />
                    <OptionSelect
                      label="Gerak kamera"
                      value={cameraChoice}
                      options={CAMERA_OPTIONS.map((o) => [o.value, o.label] as ['auto' | CameraMotionType, string])}
                      onChange={setCameraChoice}
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerateFromPrompt}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
                    >
                      Buat script & scene
                    </button>
                    <button
                      type="button"
                      onClick={handleShuffleStyle}
                      title="Ganti gaya visual, teks tetap"
                      className="px-3 rounded-xl bg-[#1d2130] border border-[#2a2f42] text-slate-200 font-semibold text-xs"
                    >
                      🎲 Acak gaya
                    </button>
                  </div>

                  {lastRecipe && (
                    <div className="rounded-xl border border-[#282c3e] bg-[#0d1017] p-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold text-slate-400">Terbaca dari prompt</div>
                      <div className="flex flex-wrap gap-1">
                        {recipeChips(lastRecipe).map((chip) => (
                          <span key={chip} className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-200 text-[10px]">
                            {chip}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Gaya <b>{lastRecipe.packName}</b>, susunan {VARIANT_LABEL[lastRecipe.variant]}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Klik lagi untuk variasi kalimat, gaya, dan susunan scene lain. Semua teks bisa diedit di panel kanan.
                  </p>
                </div>
              )}

              {leftTab === 'templates' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="space-y-1.5">
                    <label htmlFor="template-search" className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Cari template
                    </label>
                    <input
                      id="template-search"
                      value={templateSearch}
                      onChange={(e) => {
                        setTemplateSearch(e.target.value);
                        setTemplateLimit(36);
                      }}
                      placeholder="promo kopi, quote, edukasi…"
                      className={INPUT_CLS}
                    />
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {(
                        [
                          ['all', 'Semua'],
                          ['promo', 'Promo'],
                          ['quote', 'Quote'],
                          ['edukasi', 'Edukasi'],
                          ['saas', 'Demo'],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setTemplateCategory(value);
                            setTemplateLimit(36);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border ${
                            templateCategory === value
                              ? 'bg-[#C8F169] text-[#0e0a24] border-[#C8F169]'
                              : 'bg-[#181b26] text-slate-300 border-[#2a2f42]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{filteredTemplates.length} template cocok</span>
                      <span className="text-[#C8F169] font-semibold">{trainedVideos.length}+ siap pakai</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {visibleTemplates.map((vid) => {
                      const pal = palettes[vid.paletteId];
                      return (
                        <button
                          key={vid.id}
                          type="button"
                          onClick={() => applyTemplate(vid)}
                          className={`text-left rounded-xl border overflow-hidden transition ${
                            selectedTemplateId === vid.id
                              ? 'border-[#C8F169] ring-1 ring-[#C8F169]/40'
                              : 'border-[#262b3d] hover:border-[#7C6CFF]/70'
                          }`}
                        >
                          <div
                            className="h-14 relative"
                            style={{
                              background: `linear-gradient(135deg, ${pal?.bgStart || '#171a24'}, ${pal?.bgMid || '#1c2033'} 55%, ${pal?.bgEnd || '#0e0a24'})`,
                            }}
                          >
                            <span
                              className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold"
                              style={{ background: pal?.pillBg || '#fff', color: pal?.pillText || '#111' }}
                            >
                              {CATEGORY_LABEL[vid.category]}
                            </span>
                            <span
                              className="absolute bottom-1.5 left-1.5 right-1.5 h-1.5 rounded-full"
                              style={{ background: pal?.accent || '#C8F169' }}
                            />
                          </div>
                          <div className="p-1.5 bg-[#171a24] space-y-0.5">
                            <div className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{vid.title}</div>
                            <div className="text-[9px] text-slate-500">
                              {vid.scenesBlueprint.length} scene · {vid.bpm} BPM
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {visibleTemplates.length < filteredTemplates.length && (
                    <button
                      type="button"
                      onClick={() => setTemplateLimit((n) => n + 36)}
                      className="w-full py-2 rounded-xl bg-[#7C6CFF]/15 border border-[#7C6CFF]/40 text-[11px] font-bold text-[#c9c1ff]"
                    >
                      Muat 36 template lagi
                    </button>
                  )}
                  {!filteredTemplates.length && (
                    <div className="text-center text-[11px] text-slate-500 py-8">
                      Tidak ada template yang cocok. Coba kata kunci lain.
                    </div>
                  )}
                </div>
              )}

              {leftTab === 'packs' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="rounded-xl border border-[#282c3e] bg-[#0d1017] p-2">
                    <div className="text-[10px] font-bold text-[#C8F169]">Creative Packs</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Tempel ikon, gaya kartu, transisi, atau animasi ke scene yang sedang aktif.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ['icon', 'Ikon', packCounts.icon],
                        ['component', 'Komponen', packCounts.component],
                        ['transition', 'Transisi', packCounts.transition],
                        ['animation', 'Animasi', packCounts.animation],
                      ] as const
                    ).map(([kind, label, count]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setPackKind(kind);
                          setPackLimit(36);
                        }}
                        className={`p-2 rounded-xl border text-left ${
                          packKind === kind
                            ? 'bg-[#7C6CFF]/20 border-[#7C6CFF] text-white'
                            : 'bg-[#181b26] border-[#2a2f42] text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold">{label}</div>
                        <div className="text-[9px] text-[#C8F169]">{count}+ pack</div>
                      </button>
                    ))}
                  </div>
                  <input
                    value={packSearch}
                    onChange={(e) => {
                      setPackSearch(e.target.value);
                      setPackLimit(36);
                    }}
                    placeholder={`Cari ${packKind === 'icon' ? 'ikon' : packKind === 'component' ? 'gaya kartu' : packKind}…`}
                    className={INPUT_CLS}
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{filteredPacks.length} pack</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveScene({
                          iconPackId: undefined,
                          componentPackId: undefined,
                          transitionPackId: undefined,
                          animationPackId: undefined,
                          componentCode: undefined,
                          componentStyle: undefined,
                          customTransition: undefined,
                          customAnimation: undefined,
                          radius: undefined,
                        })
                      }
                      className="text-rose-300 hover:text-rose-200"
                    >
                      Reset pack scene
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visiblePacks.map((pack) => {
                      const isActive =
                        (pack.kind === 'icon' && activeScene?.iconPackId === pack.id) ||
                        (pack.kind === 'component' && activeScene?.componentPackId === pack.id) ||
                        (pack.kind === 'transition' && activeScene?.transitionPackId === pack.id) ||
                        (pack.kind === 'animation' && activeScene?.animationPackId === pack.id);
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => {
                            if (pack.kind === 'icon') {
                              updateActiveScene({ iconPackId: pack.id });
                              showToast(`Ikon "${pack.name}" dipasang.`);
                            } else if (pack.kind === 'component') {
                              updateActiveScene({ componentPackId: pack.id, radius: pack.style.radius });
                              showToast(`Komponen "${pack.name}" dipasang.`);
                            } else if (pack.kind === 'transition') {
                              updateActiveScene({ transitionPackId: pack.id, customTransition: pack.spec });
                              showToast(`Transisi "${pack.name}" dipasang.`);
                            } else {
                              updateActiveScene({ animationPackId: pack.id, customAnimation: pack.spec });
                              showToast(`Animasi "${pack.name}" dipasang.`);
                            }
                          }}
                          className={`rounded-xl border overflow-hidden text-left ${
                            isActive
                              ? 'border-[#C8F169] ring-1 ring-[#C8F169]/40'
                              : 'border-[#262b3d] hover:border-[#7C6CFF]/70'
                          }`}
                        >
                          <div className="h-12 flex items-center justify-center bg-[#0d1017] relative overflow-hidden">
                            {pack.kind === 'icon' && (
                              <SafeSvgPreview paths={pack.paths} className="w-7 h-7" fallbackColor={pack.color} />
                            )}
                            {pack.kind === 'component' && (
                              <div className="w-14 h-7 rounded-md" style={componentPackPreviewStyle(pack)} />
                            )}
                            {(pack.kind === 'transition' || pack.kind === 'animation') && (
                              <div
                                className="w-8 h-8 rounded-lg"
                                style={{
                                  background: 'linear-gradient(135deg, #7C6CFF, #C8F169)',
                                  animation: 'mk-pack-demo 1.3s ease-in-out infinite',
                                  animationDirection:
                                    pack.spec.duration > 0.6 ? 'alternate' : 'alternate-reverse',
                                }}
                              />
                            )}
                            {pack.author === 'admin' && (
                              <span className="absolute right-1 top-1 px-1 rounded bg-[#C8F169] text-[#0e0a24] text-[8px] font-bold">
                                adm
                              </span>
                            )}
                          </div>
                          <div className="p-1.5 bg-[#171a24]">
                            <div className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{pack.name}</div>
                            <div className="text-[8px] text-slate-500 truncate">{pack.tags.slice(0, 3).join(' · ')}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {visiblePacks.length < filteredPacks.length && (
                    <button
                      type="button"
                      onClick={() => setPackLimit((n) => n + 36)}
                      className="w-full py-2 rounded-xl bg-[#7C6CFF]/15 border border-[#7C6CFF]/40 text-[11px] font-bold text-[#c9c1ff]"
                    >
                      Muat 36 pack lagi
                    </button>
                  )}
                  <div className="rounded-xl border border-[#282c3e] bg-[#0d1017] p-2 space-y-1 text-[10px] text-slate-400">
                    <div className="font-semibold text-slate-200">Terpasang di scene ini</div>
                    <div>Ikon: {activeIconPack?.name || '—'}</div>
                    <div>Komponen: {activeComponentPack?.name || '—'}</div>
                    <div>Transisi: {activeTransitionPack?.name || activeScene?.transition || '—'}</div>
                    <div>Animasi: {activeAnimationPack?.name || activeScene?.headlineAnim || '—'}</div>
                  </div>
                </div>
              )}

              {leftTab === 'widgets' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(
                    [
                      ['price_tag_card', '🏷️', 'Kartu harga & diskon'],
                      ['checklist_card', '✓', 'Daftar poin / langkah'],
                      ['step_number_card', '3', 'Angka besar + keterangan'],
                      ['quote_card', '❝', 'Kartu kutipan'],
                      ['cta_button_card', '👆', 'Tombol ajakan (CTA)'],
                      ['kinetic_showcase_card', '✨', 'Sorot kata di judul'],
                      ['repo_input_card', '⌘', 'Demo aplikasi: input + klik'],
                      ['repo_scanner_card', '⚡', 'Demo aplikasi: kartu analisis'],
                      ['terminal_build_card', '>_', 'Demo aplikasi: terminal'],
                      ['bento_metrics_grid', '⊞', 'Demo aplikasi: grid metrik'],
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
              <div className="grid grid-cols-5 border-b border-[#222636] bg-[#0c0e14] p-1 gap-1 text-[10px] font-bold">
                {(
                  [
                    ['video', '🎬 Ref'],
                    ['blueprint', '🧬 Scene'],
                    ['physics', '🎨 Palet'],
                    ['rules', '📚 Rules'],
                    ['code', '🧩 Kode'],
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
                <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-bold text-lime-300">1. Sumber referensi</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      File video dianalisis langsung di browser: warna, banyaknya gerak, potongan adegan, dan posisi
                      konten. Dari link YouTube/TikTok hanya judul, kreator, dan warna thumbnail yang bisa dibaca.
                    </p>
                    <label className="block">
                      <span className="block text-[10px] text-slate-400 mb-1">Unggah video referensi (MP4/WebM/MOV)</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleRefFile}
                        disabled={refBusy}
                        className="block w-full text-[11px] text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
                      />
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={refLink}
                        onChange={(e) => setRefLink(e.target.value)}
                        placeholder="https://www.tiktok.com/@akun/video/…"
                        aria-label="Link YouTube atau TikTok"
                        className={`${INPUT_CLS} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        onClick={handleRefLink}
                        disabled={refBusy || !refLink.trim()}
                        className="px-3 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
                      >
                        Baca link
                      </button>
                    </div>
                    {refBusy && <p className="text-[10px] text-indigo-300">Menganalisis…</p>}
                    {refSource && (
                      <div className="rounded-xl border border-[#2a2f42] bg-[#11141c] p-2 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-200 break-all">{refSource.label}</div>
                        {refSource.thumbs.length > 0 && (
                          <div className="flex gap-1">
                            {refSource.thumbs.map((src, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={src} alt={`Cuplikan ${i + 1}`} className="h-20 rounded-md object-cover" />
                            ))}
                          </div>
                        )}
                        <ul className="text-[10px] text-slate-400 space-y-0.5">
                          {refSource.notes.map((n, i) => (
                            <li key={i}>• {n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-[11px] font-bold text-lime-300">2. Gaya yang dilatih</h3>
                    <label className="block">
                      <span className="block text-[10px] text-slate-400 mb-1">Nama gaya</span>
                      <input value={refName} onChange={(e) => setRefName(e.target.value)} placeholder="Promo kopi hangat" className={INPUT_CLS} />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] text-slate-400 mb-1">Kata pemicu (pisahkan koma)</span>
                      <input value={refTags} onChange={(e) => setRefTags(e.target.value)} placeholder="kopi, hangat, aesthetic" className={INPUT_CLS} />
                    </label>
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">Kategori (kosongkan untuk semua)</span>
                      <div className="flex gap-1.5">
                        {CATEGORY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={refCats.includes(opt.value)}
                            onClick={() =>
                              setRefCats((prev) =>
                                prev.includes(opt.value) ? prev.filter((c) => c !== opt.value) : [...prev, opt.value]
                              )
                            }
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold ${
                              refCats.includes(opt.value)
                                ? 'bg-lime-400 text-[#0b0d12] border-lime-300'
                                : 'bg-[#181b26] border-[#2a2f42] text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['bgStart', 'Latar 1'],
                          ['bgEnd', 'Latar 2'],
                          ['accent', 'Aksen'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block">
                          <span className="block text-[10px] text-slate-400 mb-1">{label}</span>
                          <input
                            type="color"
                            value={refColors[key]}
                            onChange={(e) => setRefColors((c) => ({ ...c, [key]: e.target.value }))}
                            className="w-full h-8 rounded-lg bg-transparent border border-[#2a2f42]"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={refColors.isDark}
                        onChange={(e) => setRefColors((c) => ({ ...c, isDark: e.target.checked }))}
                      />
                      Tema gelap
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <OptionSelect label="Latar" value={refBg} options={BG_LABELS} onChange={setRefBg} />
                      <OptionSelect
                        label="Layout"
                        value={refLayout}
                        options={[['mixed', 'Campuran (bervariasi)'], ...(Object.entries(LAYOUT_LABELS) as Array<[SceneLayout, string]>)] as Array<[SceneLayout | 'mixed', string]>}
                        onChange={setRefLayout}
                      />
                      <OptionSelect label="Transisi" value={refTransition} options={TRANSITION_LABELS} onChange={setRefTransition} />
                      <OptionSelect label="Animasi judul" value={refAnim} options={ANIM_LABELS} onChange={setRefAnim} />
                      <OptionSelect
                        label="Font"
                        value={refFont}
                        options={FONT_OPTIONS.map((f) => [f, f] as [FontFamilyName, string])}
                        onChange={setRefFont}
                      />
                      <OptionSelect
                        label="Kamera"
                        value={refCamera}
                        options={CAMERA_OPTIONS.filter((o) => o.value !== 'auto').map(
                          (o) => [o.value, o.label] as [CameraMotionType, string]
                        )}
                        onChange={setRefCamera}
                      />
                    </div>
                    <label className="block">
                      <span className="block text-[10px] text-slate-400 mb-1">
                        Tempo {refPace.toFixed(2)}× ({refPace < 0.95 ? 'lebih cepat' : refPace > 1.05 ? 'lebih pelan' : 'normal'})
                      </span>
                      <input
                        type="range"
                        min={0.7}
                        max={1.4}
                        step={0.05}
                        value={refPace}
                        onChange={(e) => setRefPace(Number(e.target.value))}
                        className="w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] text-slate-400 mb-1">Ikon dekorasi (kosongkan = otomatis dari topik)</span>
                      <input value={refDecor} onChange={(e) => setRefDecor(e.target.value)} placeholder="☕✨" className={INPUT_CLS} />
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handlePreviewStyle}
                        className="py-2 rounded-xl bg-[#1d2130] border border-[#2a2f42] text-slate-200 font-semibold"
                      >
                        Coba di kanvas
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStyle}
                        disabled={refBusy}
                        className="py-2 rounded-xl bg-lime-400 text-[#0b0d12] font-bold disabled:opacity-50"
                      >
                        Simpan untuk semua user
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Kalau prompt user mengandung kata pemicu, generator memprioritaskan gaya ini.
                    </p>
                  </section>

                  <section className="space-y-2 border-t border-[#222636] pt-3">
                    <h3 className="text-[11px] font-bold text-lime-300">3. Simpan scene sekarang sebagai template</h3>
                    <input
                      value={adminPresetTitle}
                      onChange={(e) => setAdminPresetTitle(e.target.value)}
                      placeholder="Judul template"
                      aria-label="Judul template"
                      className={INPUT_CLS}
                    />
                    <input
                      value={adminTriggerKeywords}
                      onChange={(e) => setAdminTriggerKeywords(e.target.value)}
                      placeholder="kata kunci, pisahkan koma"
                      aria-label="Kata kunci template"
                      className={INPUT_CLS}
                    />
                    <select
                      value={adminCategory}
                      onChange={(e) => setAdminCategory(e.target.value as typeof adminCategory)}
                      aria-label="Kategori template"
                      className={INPUT_CLS}
                    >
                      <option value="promo">Promo</option>
                      <option value="quote">Quote</option>
                      <option value="edukasi">Edukasi</option>
                      <option value="saas">Demo aplikasi</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAdminSaveVideoPreset}
                      className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Simpan template
                    </button>
                  </section>
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

              {adminTab === 'code' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                  <div className="font-bold text-white">🧩 Training kode pack</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Tempel SVG ikon, kode komponen, kode transisi, atau kode animasi. Langsung tersedia untuk semua user
                    setelah disimpan.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ['icon', 'SVG ikon'],
                        ['component', 'Kode komponen'],
                        ['transition', 'Kode transisi'],
                        ['animation', 'Kode animasi'],
                      ] as const
                    ).map(([kind, label]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setAdminCodeKind(kind);
                          setAdminCodeText(
                            kind === 'icon'
                              ? '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 17.7 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9z" fill="#7C6CFF"/></svg>'
                              : kind === 'component'
                              ? 'background: rgba(255,255,255,0.96);\ncolor: #171225;\nborder: #7C6CFF55;\nradius: 26;\nshadow: 28;\nopacity: 1;\naccent: #7C6CFF;'
                              : kind === 'transition'
                              ? 'fromX=-45; fromY=0; scale=0.94; rotate=-2; fade=1; duration=0.45s; ease=ease-out;'
                              : 'fromY=36; scale=0.86; rotate=-3; stagger=0.06; fade=1; duration=0.45s; ease=ease-out;'
                          );
                        }}
                        className={`py-2 rounded-xl border font-bold text-[10px] ${
                          adminCodeKind === kind
                            ? 'bg-[#7C6CFF] text-white border-[#7C6CFF]'
                            : 'bg-[#181b26] border-[#2a2f42] text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={adminCodeName}
                    onChange={(e) => setAdminCodeName(e.target.value)}
                    placeholder="Nama pack (mis. Ikon Bintang Neon)"
                    className={INPUT_CLS}
                  />
                  <input
                    value={adminCodeTags}
                    onChange={(e) => setAdminCodeTags(e.target.value)}
                    placeholder="Kata kunci, pisahkan koma"
                    className={INPUT_CLS}
                  />
                  <select
                    value={adminCodeCategory}
                    onChange={(e) => setAdminCodeCategory(e.target.value as typeof adminCodeCategory)}
                    className={INPUT_CLS}
                  >
                    <option value="all">Semua kategori</option>
                    <option value="promo">Promo</option>
                    <option value="quote">Quote</option>
                    <option value="edukasi">Edukasi</option>
                  </select>
                  <textarea
                    rows={7}
                    value={adminCodeText}
                    onChange={(e) => setAdminCodeText(e.target.value)}
                    spellCheck={false}
                    className="w-full rounded-xl bg-[#090b10] border border-[#2a2f42] p-2 text-[10px] font-mono text-lime-200"
                    placeholder={
                      adminCodeKind === 'icon'
                        ? '<svg viewBox="0 0 24 24"><path d="..." fill="#7C6CFF"/></svg>'
                        : adminCodeKind === 'component'
                        ? 'background: ...; color: ...; border: ...; radius: ...;'
                        : 'fromX=...; fromY=...; scale=...; duration=...;'
                    }
                  />
                  <div className="rounded-xl border border-[#2a2f42] bg-[#0d1017] p-2">
                    <div className="text-[9px] uppercase font-bold text-slate-400 mb-1.5">Pratinjau</div>
                    {adminCodeKind === 'icon' ? (
                      <SafeSvgPreview paths={adminCodePreviewPaths} className="w-10 h-10 mx-auto" />
                    ) : adminCodeKind === 'component' ? (
                      <div
                        className="mx-auto w-36 h-14 rounded-xl flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: adminCodePreviewStyle.background || '#ffffff',
                          color: adminCodePreviewStyle.foreground || '#0f172a',
                          border: `1.5px solid ${adminCodePreviewStyle.border || '#7C6CFF55'}`,
                          borderRadius: Math.min(24, adminCodePreviewStyle.radius ?? 20),
                        }}
                      >
                        Komponen
                      </div>
                    ) : (
                      <div className="h-14 flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, #7C6CFF, #C8F169)',
                            animation: 'mk-pack-demo 1.2s ease-in-out infinite alternate',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminSaveCreativeCode}
                    className="w-full py-2 rounded-xl bg-[#C8F169] text-[#0e0a24] font-black text-xs"
                  >
                    + Simpan pack ke Supabase
                  </button>
                  <p className="text-[10px] text-slate-500">
                    Tersedia sekarang: {packCounts.icon}+ ikon · {packCounts.component}+ komponen ·{' '}
                    {packCounts.transition}+ transisi · {packCounts.animation}+ animasi.
                  </p>
                </div>
              )}
            </>
          )}
        </aside>

        {/* CENTER VIEWPORT + KEYFRAME TIMELINE */}
        <section className={`${mobilePanel === 'canvas' ? 'flex' : 'hidden'} lg:flex flex-1 min-h-0 flex-col min-w-0 bg-[#07080c]`}>
          <div className="shrink-0 min-h-10 border-b border-[#1c202e] bg-[#0d0f17]/95 px-3 py-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                Scene {activeSceneIndex + 1} • {activeScene?.stepBadge}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#171a26] text-lime-300 font-mono text-[10px]">
                Spring(k={140 + springTension * 14}, {activeScene?.cameraMotion})
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
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
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                <input type="checkbox" checked={withBeat} onChange={(e) => setWithBeat(e.target.checked)} />
                <span>Ketukan musik saat render</span>
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

          <div ref={canvasStageRef} className="flex-1 min-h-0 relative flex overflow-auto p-3 bg-[#07080c]">
            <div
              className="relative m-auto shadow-2xl rounded-2xl overflow-hidden border border-white/15"
              style={{ width: canvasCssW, height: canvasCssH }}
            >
              <canvas
                ref={canvasRef}
                width={canvasDims.w}
                height={canvasDims.h}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={endCanvasPointer}
                onPointerCancel={endCanvasPointer}
                className={`w-full h-full block touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                title="Tarik untuk menggeser tampilan scene (seperti Figma)."
              />
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-[#C8F169]/40">
                <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded bg-[#C8F169] text-[#0e0a24] text-[8px] font-bold">
                  Scene {activeSceneIndex + 1} · geser bebas
                </span>
                {[
                  '-left-1 -top-1',
                  '-right-1 -top-1',
                  '-left-1 -bottom-1',
                  '-right-1 -bottom-1',
                ].map((pos) => (
                  <span key={pos} className={`absolute w-2 h-2 rounded-sm bg-[#C8F169] ${pos}`} />
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-[9px] text-white/80">
                X {Math.round(sceneTransform.x * 100)}% · Y {Math.round(sceneTransform.y * 100)}% · {Math.round(sceneTransform.scale * 100)}%
              </div>
            </div>
          </div>

          {/* Transport Bar */}
          <div className="shrink-0 h-11 border-t border-b border-[#222533] bg-[#10121a] px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Scene sebelumnya"
                onClick={() => jumpToScene(activeSceneIndex - 1)}
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
                aria-label="Scene berikutnya"
                onClick={() => jumpToScene(activeSceneIndex + 1)}
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
                      stepBadge: `Scene ${prev.length + 1}`,
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
          <div className="shrink-0 h-24 sm:h-36 bg-[#0c0e14] px-2 sm:px-4 py-2 space-y-1.5 overflow-y-auto">
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
                      seekTo(t + 0.1);
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
        <aside className={`${mobilePanel === 'inspector' ? 'flex' : 'hidden'} flex-1 lg:flex-none lg:flex w-full lg:w-80 min-h-0 border-t lg:border-t-0 lg:border-l border-[#222636] bg-[#11131a] flex-col shrink-0 overflow-y-auto p-3.5 space-y-4 text-xs`}>
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

          <div className="space-y-2 rounded-xl border border-[#7C6CFF]/35 bg-[#7C6CFF]/5 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#c9c1ff]">🎛️ Desain bebas (Figma-style)</span>
              <button
                type="button"
                onClick={() =>
                  updateActiveScene({
                    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                  })
                }
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-200"
              >
                Reset
              </button>
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Tarik langsung di kanvas, atau atur angka di bawah. Semua perubahan hanya untuk scene aktif.
            </p>
            {(
              [
                ['x', 'Geser X', -0.5, 0.5, 0.01],
                ['y', 'Geser Y', -0.5, 0.5, 0.01],
                ['scale', 'Skala', 0.4, 1.8, 0.01],
                ['rotation', 'Rotasi', -30, 30, 1],
                ['opacity', 'Opasitas', 0.1, 1, 0.01],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <label key={key} className="block">
                <span className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{label}</span>
                  <span className="font-mono text-slate-200">
                    {key === 'rotation'
                      ? `${Math.round(sceneTransform[key])}°`
                      : key === 'scale' || key === 'opacity'
                      ? `${Math.round(sceneTransform[key] * 100)}%`
                      : `${Math.round(sceneTransform[key] * 100)}`}
                  </span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={sceneTransform[key]}
                  onChange={(e) => setSceneTransform({ [key]: Number(e.target.value) })}
                  className="w-full accent-[#C8F169]"
                />
              </label>
            ))}
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  ['Kiri', { x: -0.12, y: 0 }],
                  ['Tengah', { x: 0, y: 0 }],
                  ['Kanan', { x: 0.12, y: 0 }],
                  ['Atas', { x: 0, y: -0.12 }],
                  ['Bawah', { x: 0, y: 0.12 }],
                ] as const
              ).map(([label, patch]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSceneTransform(patch)}
                  className="py-1 rounded bg-[#181b26] border border-[#2a2f42] text-[9px] text-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="flex justify-between text-[10px] text-slate-400">
                <span>Radius kartu</span>
                <span className="font-mono">{activeScene?.radius ?? activeComponentPack?.style.radius ?? cardRadius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={64}
                step={1}
                value={activeScene?.radius ?? activeComponentPack?.style.radius ?? cardRadius}
                onChange={(e) => updateActiveScene({ radius: Number(e.target.value) })}
                className="w-full accent-[#C8F169]"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] text-slate-400 mb-1">
                Kode tampilan komponen (CSS ringkas)
              </span>
              <textarea
                rows={3}
                value={activeScene?.componentCode || ''}
                onChange={(e) => applyComponentCodeToScene(e.target.value)}
                placeholder={'background: #ffffff;\ncolor: #0f172a;\nborder: #7C6CFF55;\nradius: 26;\naccent: #7C6CFF;'}
                className="w-full bg-[#090b10] border border-[#2a2f42] rounded-lg p-2 text-[10px] font-mono text-lime-200"
              />
            </label>
          </div>

          <div className="space-y-2.5 pb-3 border-b border-[#222634]">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Komponen di kartu</label>
              <select
                value={normalizeWidgetType(activeScene?.widgetType)}
                onChange={(e) =>
                  updateActiveScene({ widgetType: e.target.value as WidgetRigType })
                }
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {WIDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">{widgetFields.primary}</label>
              <input
                type="text"
                placeholder={widgetFields.primaryHint}
                value={activeScene?.primaryInput || ''}
                onChange={(e) => updateActiveScene({ primaryInput: e.target.value })}
                className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">{widgetFields.secondary}</label>
              <input
                type="text"
                placeholder={widgetFields.secondaryHint}
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

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Gaya scene ini</div>
            <div className="grid grid-cols-2 gap-1.5">
              <OptionSelect
                label="Layout"
                value={activeScene?.layout || 'stack'}
                options={LAYOUT_LABELS}
                onChange={(v) => updateActiveScene({ layout: v })}
              />
              <OptionSelect
                label="Transisi masuk"
                value={activeScene?.transition || 'fade'}
                options={TRANSITION_LABELS}
                onChange={(v) => updateActiveScene({ transition: v })}
              />
              <OptionSelect
                label="Latar"
                value={activeScene?.bgStyle || 'mesh'}
                options={BG_LABELS}
                onChange={(v) => updateActiveScene({ bgStyle: v })}
              />
              <OptionSelect
                label="Animasi judul"
                value={activeScene?.headlineAnim || 'spring-words'}
                options={ANIM_LABELS}
                onChange={(v) => updateActiveScene({ headlineAnim: v })}
              />
            </div>
            <label className="block">
              <span className="block text-[10px] text-slate-400 mb-1">Ikon dekorasi (emoji)</span>
              <input
                value={activeScene?.decor || ''}
                onChange={(e) => updateActiveScene({ decor: e.target.value })}
                placeholder="☕✨"
                className={INPUT_CLS}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const v = {
                  transition: activeScene?.transition,
                  bgStyle: activeScene?.bgStyle,
                  headlineAnim: activeScene?.headlineAnim,
                  decor: activeScene?.decor,
                  paletteId: activeScene?.paletteId,
                };
                setScenes((prev) => prev.map((sc) => ({ ...sc, ...v, paletteId: v.paletteId || sc.paletteId })));
                showToast('Latar, transisi, animasi, dan palet scene ini diterapkan ke semua scene.');
              }}
              className="w-full py-1.5 rounded-lg bg-[#1d2130] border border-[#2a2f42] text-[11px] text-slate-200"
            >
              Terapkan ke semua scene
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="studio-font" className="block text-[11px] font-bold text-slate-400 uppercase">
              Font
            </label>
            <select
              id="studio-font"
              value={fontName}
              onChange={(e) => setFontName(e.target.value as FontFamilyName)}
              className="w-full bg-[#181b26] border border-[#2a2f42] rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
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
                        if (!window.confirm(`Hapus "${r.content_text}" dari data training?`)) return;
                        const supabase = createClient();
                        const { data: deleted, error } = await supabase
                          .from('ai_training_data')
                          .delete()
                          .eq('id', r.id)
                          .select('id');
                        if (error || !deleted?.length) {
                          showToast(`Gagal menghapus: ${error?.message || 'tidak punya izin admin'}`);
                          return;
                        }
                        forgetTrainingRow(r.id);
                        setSupabaseRows((prev) => prev.filter((x) => x.id !== r.id));
                        setTrainedVideos((prev) => prev.filter((p) => p.id !== `db-${r.id}`));
                        showToast('Data training dihapus.');
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

      {/* MOBILE NAV: kanvas, aset, pengaturan — hemat ruang untuk device menengah ke bawah */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0c0e14]/95 backdrop-blur border-t border-[#222636] grid grid-cols-3 gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
        {(
          [
            ['canvas', '🎬 Kanvas'],
            ['library', '🧩 Aset'],
            ['inspector', '🎛️ Atur'],
          ] as const
        ).map(([panel, label]) => (
          <button
            key={panel}
            type="button"
            onClick={() => setMobilePanel(panel)}
            className={`my-1.5 rounded-xl text-[11px] font-bold ${
              mobilePanel === panel
                ? 'bg-[#7C6CFF] text-white'
                : 'bg-[#181b26] text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1b1f2e] border border-indigo-500/50 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
