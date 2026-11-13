'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CategoryType,
  SceneItem,
  StudioWidgetType,
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
  forgetTrainingRow,
  loadTrainingIntoEngine,
} from '@/lib/training';
import { createClient } from '@/lib/supabase/client';
import { useEditorStore, type FontFamilyName } from '@/store/useEditorStore';
import { ensureCanvasFont, resolveCanvasFamily } from '@/components/templates/fonts';

export type WidgetRigType = StudioWidgetType;
export type CameraMotionType = EngineCameraMotionType;

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com').toLowerCase();

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

export const CATEGORY_PRESETS: TrainedVideoPresetItem[] = CATEGORY_PRESET_SOURCES.map((src) => {
  const result = generateScript(src.topic, src.category, {
    seed: src.seed,
    customStoreName: src.store,
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

/** Baris ai_training_data (type video_motion/ui_blueprint) → preset yang bisa dipakai semua user. */
function rowToPreset(row: TrainingRow): TrainedVideoPresetItem | null {
  if (row.type !== 'video_motion' && row.type !== 'ui_blueprint') return null;
  const meta = (row.metadata_json || {}) as Record<string, unknown>;
  const rawScenes = Array.isArray(meta.scenes_blueprint)
    ? (meta.scenes_blueprint as Array<Partial<StudioSceneItem>>)
    : [];
  if (!rawScenes.length) return null;
  const blueprint: StudioSceneItem[] = rawScenes.map((sc, i) => ({
    stepBadge: String(sc.stepBadge ?? `Scene ${i + 1}`),
    title: String(sc.title ?? ''),
    subtext: String(sc.subtext ?? ''),
    widgetType: normalizeWidgetType(sc.widgetType),
    primaryInput: String(sc.primaryInput ?? ''),
    secondaryInput: String(sc.secondaryInput ?? ''),
    duration: Number(sc.duration) || 3.4,
    cameraMotion: isCameraMotion(sc.cameraMotion) ? sc.cameraMotion : 'spring-slide-vertical',
    paletteId: String(sc.paletteId || 'depup-lavender'),
  }));
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
}

export default function MotionStudioEngine({ initialRole = 'user' }: MotionStudioEngineProps) {
  const storeTopic = useEditorStore((s) => s.topic);
  const storeScript = useEditorStore((s) => s.script);
  const storeCategory = useEditorStore((s) => s.category);

  // Mode admin hanya untuk akun admin. Route /admin sudah dijaga middleware dan dicek ulang di sini;
  // izin tulis yang sebenarnya ditegakkan RLS di database (lihat supabase/migration.sql).
  const [isAdmin, setIsAdmin] = useState(initialRole === 'admin');
  const [roleModeState, setRoleMode] = useState<'user' | 'admin'>(initialRole);
  const roleMode: 'user' | 'admin' = isAdmin ? roleModeState : 'user';
  const [leftTab, setLeftTab] = useState<'prompt' | 'templates' | 'widgets' | 'layers'>('prompt');
  const [adminTab, setAdminTab] = useState<'video' | 'blueprint' | 'physics' | 'rules'>('video');

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
  const [trainedVideos, setTrainedVideos] = useState<TrainedVideoPresetItem[]>(BUILT_IN_PRESETS);
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
  const [ruleContent, setRuleContent] = useState('Promo {product} cuma {price} di {store}! 🔥');
  const [ruleSubtext, setRuleSubtext] = useState('Selama persediaan masih ada.');
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
            setTrainedVideos([...CATEGORY_PRESETS, ...fromDb, ...INITIAL_TRAINED_VIDEOS]);
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
      const wType = normalizeWidgetType(scene.widgetType);
      const S = Math.min(W, H);
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
      ctx.font = `700 ${Math.round(W * 0.036)}px ${canvasFont}`;
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
      const words = String(scene.title || '')
        .trim()
        .split(/\s+/);
      ctx.font = `800 ${titleFontSize}px ${canvasFont}`;
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
          wType === 'kinetic_showcase_card' && wIdx === activeWordIdx;
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
      ctx.font = `500 ${subFontSize}px ${canvasFont}`;
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

      if (wType === 'terminal_build_card') {
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
      canvasFont,
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
    const topic = smartPrompt.trim();
    if (!topic) {
      showToast('Tulis topik videonya dulu.');
      return;
    }
    const storeMeta = useEditorStore.getState().script?.extractedMeta;
    const result = generateScript(topic, studioCategory, {
      customStoreName: studioCategory === 'promo' ? storeMeta?.storeName || undefined : undefined,
    });

    // Preset simpanan admin dengan kata kunci yang cocok ikut menentukan gaya (kamera & palet).
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
    const camera: CameraMotionType =
      cameraChoice !== 'auto'
        ? cameraChoice
        : matched?.cameraMotion || suggestCameraMotion(studioCategory);
    const paletteId =
      matched && palettes[matched.paletteId] ? matched.paletteId : result.suggestedStyle.paletteId;

    setScenes(sceneItemsToStudio(result.scenes, camera, paletteId));
    setFontName(result.suggestedStyle.font);
    setActiveSceneIndex(0);
    setCurrentTime(0);
    showToast(
      matched
        ? `Script baru dibuat dengan gaya preset "${matched.title}".`
        : 'Script baru dibuat. Klik lagi untuk variasi kalimat lain.'
    );
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

  const widgetFields = WIDGET_FIELDS[normalizeWidgetType(activeScene?.widgetType)];

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
                    ['prompt', 'Generator'],
                    ['templates', 'Template'],
                    ['widgets', 'Komponen'],
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
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-300">Kategori video</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={studioCategory === opt.value}
                          onClick={() => setStudioCategory(opt.value)}
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
                      {CATEGORY_HINTS[studioCategory].hint}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="studio-camera" className="block text-[11px] font-semibold text-slate-300">
                      Gerak kamera
                    </label>
                    <select
                      id="studio-camera"
                      value={cameraChoice}
                      onChange={(e) => setCameraChoice(e.target.value as 'auto' | CameraMotionType)}
                      className="w-full bg-[#181b26] border border-[#282c3e] rounded-xl px-2 py-1.5 text-[11px] text-white"
                    >
                      {CAMERA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateFromPrompt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg"
                  >
                    Buat script & scene
                  </button>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Klik lagi untuk variasi kalimat lain. Semua teks bisa diedit di panel kanan.
                  </p>
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
                        if (vid.category !== 'saas') setStudioCategory(vid.category);
                        setFontName(suggestedFontFor(vid.category));
                        setActiveSceneIndex(0);
                        setCurrentTime(0);
                        showToast(`Template "${vid.title}" diterapkan.`);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedTemplateId === vid.id
                          ? 'bg-[#1c2033] border-indigo-500'
                          : 'bg-[#171a24] border-[#262b3d] hover:border-[#3a425e]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                          {CATEGORY_LABEL[vid.category]}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {vid.scenesBlueprint.length} scene
                        </span>
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

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#1b1f2e] border border-indigo-500/50 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
