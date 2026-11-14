/**
 * MotionID / MotionKu Smart Engine v5.1 (`lib/smart-engine.ts`)
 * - 100% Kompatibel dengan seluruh kontrak `lib/training.ts`, `app/page.tsx`, `app/create/page.tsx`, `app/editor/*`, dan `app/admin/page.tsx`
 * - Sistem Pembuat Gambar Otomatis dari Data Pack Google/Web (`lib/google-datapack-image-engine.ts`)
 * - Engine Variasi Transisi & Animasi Anti-Kembar (`buildNonRepeatingSequence`)
 * - Mode Animasi Kursor Pintar (`single-pro`, `multi-agent-swarm`, `tutorial-spotlight`, `off`)
 */

import {
  GOOGLE_VISUAL_DATA_PACKS,
  matchBestDataPack,
  synthesizeAllSceneImagesFromDataPack,
  synthesizeDataPackSceneImage,
  type GoogleDataPackItem,
  type SynthesizedSceneImage,
} from '@/lib/google-datapack-image-engine';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
  initialVelocity?: number;
}

export function solveSpring(
  t: number,
  config: SpringConfig = { stiffness: 220, damping: 18, mass: 1 }
): number {
  const clampedT = Math.max(0, Math.min(2.5, t));
  const dt = 1 / 240;
  const steps = Math.floor(clampedT / dt);
  let x = 0;
  let v = config.initialVelocity ?? -1.8;
  const k = config.stiffness;
  const c = config.damping;
  const m = config.mass ?? 1;

  const accel = (pos: number, vel: number) => (-k * (pos - 1) - c * vel) / m;

  for (let i = 0; i < steps; i++) {
    const k1x = v;
    const k1v = accel(x, v);
    const k2x = v + 0.5 * dt * k1v;
    const k2v = accel(x + 0.5 * dt * k1x, v + 0.5 * dt * k1v);
    const k3x = v + 0.5 * dt * k2v;
    const k3v = accel(x + 0.5 * dt * k2x, v + 0.5 * dt * k2v);
    const k4x = v + dt * k3v;
    const k4v = accel(x + dt * k3x, v + dt * k3v);

    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  return x;
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export type CursorAnimationMode =
  | 'off'
  | 'single-pro'
  | 'multi-agent-swarm'
  | 'tutorial-spotlight';

export type CursorVisualSkin =
  | 'macos-pro'
  | 'figma-pill'
  | 'cyber-crosshair'
  | 'neon-touch';

export interface CursorAgentPoint {
  name: string;
  color: string;
  x: number;
  y: number;
  isClicking: boolean;
  actionTag: string;
}

export interface CursorKeyframeState {
  visible: boolean;
  mode: CursorAnimationMode;
  skin: CursorVisualSkin;
  x: number;
  y: number;
  scale: number;
  isClicking: boolean;
  rippleProgress: number;
  highlightProgress: number;
  typingProgress: number;
  cameraZoom: number;
  cameraPanX: number;
  cameraPanY: number;
  cameraTiltDeg: number;
  activeLabel: string;
  swarmAgents: CursorAgentPoint[];
}

export function computeCursorChoreography(
  sceneProgress: number,
  sceneIndex: number = 0,
  mode: CursorAnimationMode = 'single-pro',
  skin: CursorVisualSkin = 'figma-pill'
): CursorKeyframeState {
  const p = Math.max(0, Math.min(1, sceneProgress));

  if (mode === 'off') {
    return {
      visible: false,
      mode: 'off',
      skin,
      x: 50,
      y: 50,
      scale: 1,
      isClicking: false,
      rippleProgress: 0,
      highlightProgress: 0,
      typingProgress: 1,
      cameraZoom: 1,
      cameraPanX: 0,
      cameraPanY: 0,
      cameraTiltDeg: 0,
      activeLabel: '',
      swarmAgents: [],
    };
  }

  const waypointsByScene: Array<Array<{ x: number; y: number; label: string }>> = [
    [
      { x: 82, y: 84, label: 'Init Studio' },
      { x: 34, y: 38, label: 'Select Hook' },
      { x: 66, y: 54, label: 'Drag DataPack' },
      { x: 52, y: 74, label: 'Click CTA' },
    ],
    [
      { x: 18, y: 78, label: 'Inspect Layer' },
      { x: 58, y: 34, label: 'Type Value' },
      { x: 42, y: 62, label: 'Adjust Spring' },
      { x: 72, y: 48, label: 'Lock Frame' },
    ],
    [
      { x: 76, y: 24, label: 'Load Asset Pack' },
      { x: 48, y: 46, label: 'Highlight Proof' },
      { x: 32, y: 68, label: 'Apply Shader' },
      { x: 56, y: 76, label: 'Verify Price' },
    ],
    [
      { x: 24, y: 30, label: 'Final Polish' },
      { x: 50, y: 52, label: 'Focus Offer' },
      { x: 50, y: 78, label: 'Click Action!' },
      { x: 64, y: 82, label: 'Published' },
    ],
  ];

  const pts = waypointsByScene[sceneIndex % waypointsByScene.length];
  let x = pts[0].x;
  let y = pts[0].y;
  let activeLabel = pts[0].label;

  if (p < 0.32) {
    const sp = solveSpring(p / 0.32, { stiffness: 210, damping: 19 });
    x = pts[0].x + (pts[1].x - pts[0].x) * sp;
    y = pts[0].y + (pts[1].y - pts[0].y) * sp;
    activeLabel = pts[1].label;
  } else if (p < 0.68) {
    const sp = solveSpring((p - 0.32) / 0.36, { stiffness: 230, damping: 18 });
    x = pts[1].x + (pts[2].x - pts[1].x) * sp;
    y = pts[1].y + (pts[2].y - pts[1].y) * sp;
    activeLabel = pts[2].label;
  } else {
    const sp = solveSpring((p - 0.68) / 0.32, { stiffness: 260, damping: 17 });
    x = pts[2].x + (pts[3].x - pts[2].x) * sp;
    y = pts[2].y + (pts[3].y - pts[2].y) * sp;
    activeLabel = pts[3].label;
  }

  const clickWindow1 = p > 0.29 && p < 0.39;
  const clickWindow2 = p > 0.67 && p < 0.78;
  const isClicking = clickWindow1 || clickWindow2;
  const rippleProgress = clickWindow1
    ? (p - 0.29) / 0.1
    : clickWindow2
    ? (p - 0.67) / 0.11
    : 0;

  const highlightProgress = smoothStep(0.18, 0.56, p);
  const typingProgress = smoothStep(0.12, 0.64, p);

  const focusBoost =
    mode === 'tutorial-spotlight' ? 0.22 : mode === 'single-pro' ? 0.16 : 0.08;
  const cameraZoom = 1 + Math.sin(p * Math.PI) * focusBoost;
  const cameraPanX = (50 - x) * 0.18 * Math.sin(p * Math.PI);
  const cameraPanY = (50 - y) * 0.14 * Math.sin(p * Math.PI);
  const cameraTiltDeg = Math.sin(p * Math.PI * 2) * (sceneIndex % 2 === 0 ? 1.4 : -1.4);

  const swarmSpecs = [
    { name: 'Director', color: '#F59E0B', phaseOffset: 0.0, radiusX: 18, radiusY: 14, tag: 'Wireframe' },
    { name: 'DataPack', color: '#38BDF8', phaseOffset: 1.25, radiusX: 24, radiusY: 18, tag: 'Synth Image' },
    { name: 'MotionRK4', color: '#A855F7', phaseOffset: 2.5, radiusX: 20, radiusY: 22, tag: 'Spring Rig' },
    { name: 'Typography', color: '#10B981', phaseOffset: 3.75, radiusX: 22, radiusY: 16, tag: 'Highlight' },
    { name: 'ShaderFX', color: '#F43F5E', phaseOffset: 5.0, radiusX: 16, radiusY: 20, tag: 'Color Grade' },
  ];

  const swarmAgents: CursorAgentPoint[] =
    mode === 'multi-agent-swarm'
      ? swarmSpecs.map((ag, idx) => {
          const angle = p * Math.PI * 2.2 + ag.phaseOffset + sceneIndex * 0.9;
          const ax = Math.max(10, Math.min(90, x + Math.cos(angle) * ag.radiusX + (idx - 2) * 5));
          const ay = Math.max(
            12,
            Math.min(88, y + Math.sin(angle) * ag.radiusY + (idx % 2 === 0 ? -6 : 6))
          );
          return {
            name: ag.name,
            color: ag.color,
            x: ax,
            y: ay,
            isClicking: ((p * 10 + idx) % 3) < 0.45,
            actionTag: ag.tag,
          };
        })
      : [];

  return {
    visible: true,
    mode,
    skin,
    x,
    y,
    scale: isClicking ? 0.84 : 1,
    isClicking,
    rippleProgress,
    highlightProgress,
    typingProgress,
    cameraZoom,
    cameraPanX,
    cameraPanY,
    cameraTiltDeg,
    activeLabel,
    swarmAgents,
  };
}

export type CategoryType = 'quote' | 'promo' | 'edukasi';
export type AnimationType = 'pop' | 'slide-up' | 'typewriter' | 'bounce' | 'fade' | 'zoom';
export type AspectRatioType = '9:16' | '1:1' | '16:9';
export type CameraMotionType =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-drift'
  | 'handheld-float'
  | 'dutch-tilt'
  | 'orbit-3d';

export type EngineFontName =
  | 'Poppins'
  | 'Montserrat'
  | 'Bebas Neue'
  | 'Playfair Display'
  | 'Space Grotesk'
  | 'Anton';

export interface EngineTypography {
  headingFont: EngineFontName;
  bodyFont: EngineFontName;
  monoFont: string;
}

/**
 * Mencakup seluruh varian nama widget baik di `app/create/page.tsx`, `app/page.tsx`, maupun `MotionStudioEngine.tsx`
 */
export type WidgetBlueprintType =
  | 'quote_card'
  | 'checklist_card'
  | 'price_tag_card'
  | 'step_number_card'
  | 'cta_button_card'
  | 'repo_input_card'
  | 'repo_scanner_card'
  | 'terminal_build_card'
  | 'bento_metrics_grid'
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

export function normalizeWidgetType(raw?: string): WidgetBlueprintType {
  const valid: WidgetBlueprintType[] = [
    'quote_card',
    'checklist_card',
    'price_tag_card',
    'step_number_card',
    'cta_button_card',
    'repo_input_card',
    'repo_scanner_card',
    'terminal_build_card',
    'bento_metrics_grid',
    'step-paste-card',
    'step-check-card',
    'step-deploy-card',
    'terminal-log-box',
    'metric-flip-counter',
    'price-slash-sticker',
    'countdown-flash-bar',
    'before-after-slider',
    'quiz-poll-card',
    'quote-glass-frame',
  ];
  if (raw && valid.includes(raw as WidgetBlueprintType)) {
    return raw as WidgetBlueprintType;
  }
  return 'quote_card';
}

export interface CustomWidgetBlueprint {
  id: string;
  type: WidgetBlueprintType;
  title: string;
  primaryText: string;
  secondaryText: string;
  badgeText: string;
  accentHex: string;
}

export interface MotionTelemetryProfile {
  fps: number;
  springStiffness: number;
  springDamping: number;
  motionBlurSamples: number;
  cursorActive: boolean;
  tempoBpm?: number;
  cutFrequencySec?: number;
  cameraEnergy?: 'calm' | 'dynamic' | 'hyper';
  transitionSequence?: SceneTransition[];
  animationSequence?: AnimationType[];
}

export interface TrainedVideoPreset {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  videoUrl: string;
  creatorHandle: string;
  profile: MotionTelemetryProfile;
}

export type SceneRole = 'hook' | 'problem' | 'solution' | 'proof' | 'cta';

export type SceneLayout =
  | 'center'
  | 'split-top'
  | 'editorial-left'
  | 'card-stack'
  | 'diagonal-hero'
  | 'magazine'
  | 'bento-grid'
  | 'hud-frame';

export type SceneTransition =
  | 'cut'
  | 'whip-left'
  | 'iris-wipe'
  | 'diagonal-slice'
  | 'zoom-punch'
  | 'glitch-cut'
  | 'morph-card'
  | 'shutter-blinds'
  | 'blueprint-wire';

export type BackgroundStyle =
  | 'aurora'
  | 'mesh'
  | 'grid-cyber'
  | 'sunburst'
  | 'halftone'
  | 'particles'
  | 'minimal-dark'
  | 'datapack-synth';

export type HeadlineAnim =
  | 'word-pop'
  | 'typewriter'
  | 'karaoke'
  | 'kinetic-slide'
  | 'elastic-bounce'
  | 'blur-reveal'
  | 'glitch-decode';

export interface SceneItem {
  id: string;
  sceneNumber: number;
  role: SceneRole;
  text: string;
  subtext: string;
  emoji: string;
  duration: number;
  animation: AnimationType;
  imageUrl?: string;
  stepBadge?: string;
  widgetType?: WidgetBlueprintType;
  primaryInput?: string;
  secondaryInput?: string;
  cameraMotion?: CameraMotionType;
  paletteId?: string;
  layout?: SceneLayout;
  transition?: SceneTransition;
  bgStyle?: BackgroundStyle;
  headlineAnim?: HeadlineAnim;
  decor?: string;
  emphasis?: string;
  dataPackMeta?: {
    clusterId: string;
    packTitle: string;
    compositionStyle: string;
    matchedKeywords: string[];
  };
}

export interface GeneratedMotionScene extends SceneItem {
  telemetry?: MotionTelemetryProfile;
}

export interface MusicTrack {
  id: string;
  name: string;
  mood: 'energetic' | 'slow' | 'chill' | 'dramatic' | 'upbeat';
  bpm: number;
  url: string;
  durationSec: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  background: string;
  secondary: string;
  text: string;
  accent: string;
  gradient: string;
}

export interface StyleSuggestion {
  palette: ColorPalette;
  music: MusicTrack;
  font: EngineFontName;
  moodLabel: string;
  recommendedTemplate: 'Q1' | 'Q2' | 'Q3' | 'P1' | 'P2' | 'P3' | 'E1' | 'E2' | 'E3';
  recommendedFont: EngineFontName;
  moodReason: string;
}

export type TopicMood = 'galau' | 'promo' | 'edukasi' | 'hype' | 'aesthetic' | 'tech' | 'neutral';
export type QuoteMood = 'galau' | 'motivasi' | 'sindir' | 'tenang';

export interface PriceMatch {
  raw: string;
  numeric: number;
  formatted: string;
}

export interface ParsedTopicMeta {
  rawTopic: string;
  cleanTopic: string;
  productName: string;
  priceText: string;
  originalPriceText: string;
  discountPercent: number;
  storeName: string;
  detectedMood: TopicMood;
  keywords: string[];
  matchedDataPackId: string;
  matchedDataPackTitle: string;
}

export interface StylePack {
  id: string;
  name: string;
  category: CategoryType | 'all';
  paletteId: string;
  font: EngineFontName;
  transition: SceneTransition;
  animation: AnimationType;
  headlineAnim: HeadlineAnim;
  bgStyle: BackgroundStyle;
  layout: SceneLayout;
  trained?: boolean;
  description?: string;
  tags?: string[];
  cursorMode?: CursorAnimationMode;
  iconPackId?: string;
  componentPackId?: string;
  transitionPackId?: string;
  animationPackId?: string;
}

export interface StyleRecipe {
  id: string;
  name: string;
  packName: string;
  transitions: SceneTransition[];
  animations: AnimationType[];
  cameraMotions: CameraMotionType[];
  cursorMode: CursorAnimationMode;
  iconPackId?: string;
  componentPackId?: string;
}

export interface GeneratedScriptResult {
  hook: string;
  scenes: SceneItem[];
  caption: string;
  hashtags: string[];
  suggestedMusic: MusicTrack;
  suggestedColor: ColorPalette;
  suggestedStyle: StyleSuggestion;
  extractedMeta: ParsedTopicMeta;
  recipe?: StyleRecipe;
  synthesizedPackImages?: SynthesizedSceneImage[];
}

export interface GenerateOptions {
  customPrice?: string;
  customProductName?: string;
  customStoreName?: string;
  stylePackId?: string;
  priceOverride?: string;
  productOverride?: string;
  storeOverride?: string;
  cursorMode?: CursorAnimationMode;
  useDataPackImages?: boolean;
  seed?: number;
}

export interface SceneTemplateEntry {
  scene2: string;
  scene2Sub: string;
  scene3: string;
  scene3Sub: string;
  emoji2: string;
  emoji3: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'cyber-violet',
    name: 'Cyber Violet Studio',
    background: '#070815',
    secondary: '#1E1B4B',
    text: '#F8FAFC',
    accent: '#38BDF8',
    gradient: 'linear-gradient(135deg, #070815 0%, #1E1B4B 55%, #311042 100%)',
  },
  {
    id: 'promo-fire',
    name: 'Promo Merah Kuning UMKM',
    background: '#1F0606',
    secondary: '#7F1D1D',
    text: '#FFFFFF',
    accent: '#FACC15',
    gradient: 'linear-gradient(135deg, #1F0606 0%, #991B1B 55%, #CA8A04 100%)',
  },
  {
    id: 'kopi-senja',
    name: 'Roastery Kopi Aren',
    background: '#140B05',
    secondary: '#451A03',
    text: '#FFFBEB',
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg, #140B05 0%, #451A03 55%, #78350F 100%)',
  },
  {
    id: 'edu-electric',
    name: 'Edukasi Biru Kristal',
    background: '#040D21',
    secondary: '#1E3A8A',
    text: '#F0F9FF',
    accent: '#22D3EE',
    gradient: 'linear-gradient(135deg, #040D21 0%, #1E3A8A 55%, #0284C7 100%)',
  },
  {
    id: 'midnight-galau',
    name: 'Midnight Deep Talk',
    background: '#060713',
    secondary: '#1E1B4B',
    text: '#E2E8F0',
    accent: '#F472B6',
    gradient: 'linear-gradient(135deg, #060713 0%, #1E1B4B 60%, #4C1D95 100%)',
  },
  {
    id: 'emerald-cuan',
    name: 'Emerald Growth & Finance',
    background: '#02140C',
    secondary: '#064E3B',
    text: '#ECFDF5',
    accent: '#34D399',
    gradient: 'linear-gradient(135deg, #02140C 0%, #064E3B 55%, #047857 100%)',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Aesthetic Glow',
    background: '#18071A',
    secondary: '#701A75',
    text: '#FDF4FF',
    accent: '#FB7185',
    gradient: 'linear-gradient(135deg, #18071A 0%, #701A75 55%, #BE123C 100%)',
  },
  {
    id: 'brutalist-mono',
    name: 'Neo-Brutalist High Contrast',
    background: '#09090B',
    secondary: '#27272A',
    text: '#FAFAFA',
    accent: '#A3E635',
    gradient: 'linear-gradient(135deg, #09090B 0%, #18181B 60%, #3F3F46 100%)',
  },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'upbeat-phonk',
    name: 'TikTok Viral Drift & Beats',
    mood: 'energetic',
    bpm: 138,
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3',
    durationSec: 30,
  },
  {
    id: 'lofi-senja',
    name: 'Midnight Rain Lo-Fi Piano',
    mood: 'slow',
    bpm: 78,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    durationSec: 30,
  },
  {
    id: 'chill-synth',
    name: 'Future Tech & Study Flow',
    mood: 'chill',
    bpm: 105,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    durationSec: 30,
  },
  {
    id: 'promo-funk',
    name: 'UMKM Flash Sale Groove',
    mood: 'upbeat',
    bpm: 124,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    durationSec: 30,
  },
  {
    id: 'cinematic-pulse',
    name: 'Cyberpunk Documentary Pulse',
    mood: 'dramatic',
    bpm: 116,
    url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3',
    durationSec: 30,
  },
];

export const CUSTOM_IMAGE_ASSETS: Record<string, string[]> = {
  promo: GOOGLE_VISUAL_DATA_PACKS.filter((p) => p.clusterId === 'kuliner-kopi-umkm').map((p) =>
    synthesizeDataPackSceneImage({
      topic: p.title,
      sceneText: p.badgeLabels[0],
      sceneIndex: 0,
      customPackOverride: p,
    }).dataUri
  ),
  quote: GOOGLE_VISUAL_DATA_PACKS.filter((p) => p.clusterId === 'quotes-senja-mental').map((p) =>
    synthesizeDataPackSceneImage({
      topic: p.title,
      sceneText: p.badgeLabels[0],
      sceneIndex: 1,
      customPackOverride: p,
    }).dataUri
  ),
  edukasi: GOOGLE_VISUAL_DATA_PACKS.filter(
    (p) => p.clusterId === 'edukasi-sains-kampus' || p.clusterId === 'tech-saas-cyber'
  ).map((p) =>
    synthesizeDataPackSceneImage({
      topic: p.title,
      sceneText: p.badgeLabels[0],
      sceneIndex: 2,
      customPackOverride: p,
    }).dataUri
  ),
};

const STYLE_PACK_REGISTRY: StylePack[] = [
  {
    id: 'pack-depup-cursor',
    name: 'Depup Interactive Cursor Rig',
    category: 'all',
    paletteId: 'cyber-violet',
    font: 'Space Grotesk',
    transition: 'whip-left',
    animation: 'typewriter',
    headlineAnim: 'typewriter',
    bgStyle: 'datapack-synth',
    layout: 'hud-frame',
    trained: true,
    description: 'Gaya @depup.web dengan fokus kamera mengikuti kursor & seleksi teks kuning.',
    tags: ['cursor', 'depup', 'tech'],
    cursorMode: 'single-pro',
  },
  {
    id: 'pack-voynann-swarm',
    name: 'Voynann 5-Agent Blueprint Swarm',
    category: 'edukasi',
    paletteId: 'edu-electric',
    font: 'Space Grotesk',
    transition: 'blueprint-wire',
    animation: 'pop',
    headlineAnim: 'word-pop',
    bgStyle: 'grid-cyber',
    layout: 'bento-grid',
    trained: true,
    description: 'Gaya @voynann dengan 5 kursor agen AI yang merakit rangka wireframe secara kolaboratif.',
    tags: ['voynann', 'swarm', 'blueprint'],
    cursorMode: 'multi-agent-swarm',
  },
  {
    id: 'pack-umkm-flash',
    name: 'UMKM Kopi & Kuliner Burst',
    category: 'promo',
    paletteId: 'promo-fire',
    font: 'Anton',
    transition: 'zoom-punch',
    animation: 'bounce',
    headlineAnim: 'elastic-bounce',
    bgStyle: 'sunburst',
    layout: 'diagonal-hero',
    trained: false,
    description: 'Kontras tinggi merah-emas dengan stiker harga membal dari Google Data Pack.',
    tags: ['promo', 'kuliner', 'kopi'],
    cursorMode: 'tutorial-spotlight',
  },
  {
    id: 'pack-senja-editorial',
    name: 'Midnight Senja Polaroid',
    category: 'quote',
    paletteId: 'midnight-galau',
    font: 'Playfair Display',
    transition: 'iris-wipe',
    animation: 'fade',
    headlineAnim: 'blur-reveal',
    bgStyle: 'aurora',
    layout: 'editorial-left',
    trained: false,
    description: 'Estetika deep talk malam dengan transisi fokus bokeh sinematik.',
    tags: ['quote', 'senja', 'healing'],
    cursorMode: 'off',
  },
];

const TRAINED_VIDEO_PRESETS: TrainedVideoPreset[] = [];
const KEYWORD_RULES_REGISTRY: Array<{ keywords: string[]; category: CategoryType }> = [];

export function normalizeStylePack(
  raw: Record<string, any> | null | undefined,
  fallbackId = `style-${Date.now()}`,
  fallbackName = 'Custom Style Pack'
): StylePack {
  const src = raw || {};
  return {
    id: String(src.id || fallbackId),
    name: String(src.name || fallbackName),
    category: (src.category as CategoryType | 'all') || 'all',
    paletteId: String(src.paletteId || COLOR_PALETTES[0].id),
    font: (src.font as EngineFontName) || 'Space Grotesk',
    transition: (src.transition as SceneTransition) || 'whip-left',
    animation: (src.animation as AnimationType) || 'pop',
    headlineAnim: (src.headlineAnim as HeadlineAnim) || 'word-pop',
    bgStyle: (src.bgStyle as BackgroundStyle) || 'datapack-synth',
    layout: (src.layout as SceneLayout) || 'center',
    trained: Boolean(src.trained ?? true),
    description: String(src.description || 'Trained style pack'),
    tags: Array.isArray(src.tags) ? src.tags.map(String) : ['trained'],
    cursorMode: (src.cursorMode as CursorAnimationMode) || 'single-pro',
    iconPackId: src.iconPackId ? String(src.iconPackId) : undefined,
    componentPackId: src.componentPackId ? String(src.componentPackId) : undefined,
    transitionPackId: src.transitionPackId ? String(src.transitionPackId) : undefined,
    animationPackId: src.animationPackId ? String(src.animationPackId) : undefined,
  };
}

export function getStylePacks(category?: CategoryType | 'all'): StylePack[] {
  if (!category || category === 'all') return [...STYLE_PACK_REGISTRY];
  return STYLE_PACK_REGISTRY.filter((p) => p.category === 'all' || p.category === category);
}

export function addStylePackToEngine(pack: Partial<StylePack> & Record<string, any>): StylePack {
  const normalized = normalizeStylePack(pack, pack.id, pack.name);
  const existingIdx = STYLE_PACK_REGISTRY.findIndex((p) => p.id === normalized.id);
  if (existingIdx >= 0) {
    STYLE_PACK_REGISTRY[existingIdx] = normalized;
  } else {
    STYLE_PACK_REGISTRY.push(normalized);
  }
  return normalized;
}

export function removeStylePackFromEngine(id: string): void {
  const cleanId = id.startsWith('db-') ? id : `db-${id}`;
  const idx = STYLE_PACK_REGISTRY.findIndex((p) => p.id === id || p.id === cleanId);
  if (idx >= 0) STYLE_PACK_REGISTRY.splice(idx, 1);
}

export function addTrainedVideoPresetToEngine(
  presetOrText: Partial<TrainedVideoPreset> | string,
  category: CategoryType = 'promo'
): void {
  if (typeof presetOrText === 'string') {
    try {
      const parsed = JSON.parse(presetOrText);
      TRAINED_VIDEO_PRESETS.push({
        id: String(parsed.id || `preset-${Date.now()}`),
        title: String(parsed.title || 'Trained Creator Video'),
        description: String(parsed.description || presetOrText),
        category: (parsed.category as CategoryType) || category,
        videoUrl: String(parsed.videoUrl || ''),
        creatorHandle: String(parsed.creatorHandle || '@creator'),
        profile: parsed.profile || {
          fps: 60,
          springStiffness: 240,
          springDamping: 18,
          motionBlurSamples: 4,
          cursorActive: true,
        },
      });
    } catch {
      TRAINED_VIDEO_PRESETS.push({
        id: `preset-${Date.now()}`,
        title: presetOrText.slice(0, 40),
        description: presetOrText,
        category,
        videoUrl: '',
        creatorHandle: '@creator',
        profile: {
          fps: 60,
          springStiffness: 240,
          springDamping: 18,
          motionBlurSamples: 4,
          cursorActive: true,
        },
      });
    }
    return;
  }

  TRAINED_VIDEO_PRESETS.push({
    id: String(presetOrText.id || `preset-${Date.now()}`),
    title: String(presetOrText.title || 'Trained Creator Video'),
    description: String(presetOrText.description || ''),
    category: presetOrText.category || category,
    videoUrl: String(presetOrText.videoUrl || ''),
    creatorHandle: String(presetOrText.creatorHandle || '@creator'),
    profile: presetOrText.profile || {
      fps: 60,
      springStiffness: 240,
      springDamping: 18,
      motionBlurSamples: 4,
      cursorActive: true,
    },
  });
}

export function priceToNumber(raw: string, unit?: string): number {
  const cleaned = raw.replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 18000;
  const u = (unit || '').toLowerCase();
  if (u === 'jt' || u === 'juta') return Math.round(num * 1_000_000);
  if (u === 'rb' || u === 'ribu' || u === 'k') return Math.round(num * 1_000);
  return num < 1000 ? Math.round(num * 1000) : Math.round(num);
}

export function findPrices(text: string): PriceMatch[] {
  const regex = /(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?/gi;
  const matches: PriceMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'));
    if (val <= 0) continue;
    if (!m[2] && val < 10) continue;
    const numeric = priceToNumber(m[1], m[2]);
    const formatted =
      numeric >= 1_000_000
        ? `Rp${(numeric / 1_000_000).toFixed(numeric % 1_000_000 === 0 ? 0 : 1)} Juta`
        : `Rp${(numeric / 1_000).toFixed(0)}.000`;
    matches.push({ raw: m[0].trim(), numeric, formatted });
  }
  return matches;
}

const HOOK_BANK: Record<CategoryType, string[]> = {
  promo: [
    'STOP SCROLL! {produk} cuma {harga} doang?!',
    'Jangan beli {produk} sebelum liat promo {harga} ini!',
    'GILA SIH! {produk} seenak ini harganya cuma {harga}!',
    'Warga lokal wajib tahu: {produk} di {toko} turun jadi {harga}!',
    'Bikin nagih parah! {produk} {harga} paling worth it bulan ini!',
    'Seriusan {harga} dapet {produk} seporsi penuh di {toko}?!',
    'Rahasia hemat anak kos: {produk} premium cuma {harga}!',
    'Flash Sale {toko}! {produk} favoritmu didiskon jadi {harga}!',
  ],
  quote: [
    'Dengerin ini kalo lu lagi capek soal {topik}...',
    'Kata-kata soal {topik} ini bakal nampar keras sih...',
    'Pelan-pelan ya, gak semua tentang {topik} harus selesai hari ini.',
    'Suatu saat lu bakal paham kenapa {topik} harus terjadi.',
    'Buat lu yang diem-diem berjuang lewatin {topik} sendirian...',
    'Jangan nyerah dulu, {topik} ini cuma fase pendewasaan.',
    'Kadang yang bikin lelah itu bukan {topik}, tapi ekspektasi kita sendiri.',
    'Baca ini sebelum tidur kalo pikiran lu penuh sama {topik}.',
  ],
  edukasi: [
    '90% orang masih salah paham soal {topik}!',
    '3 Rahasia {topik} yang jarang dibahas di kampus!',
    'Cara paling cerdas kuasai {topik} dalam 60 detik!',
    'Stop lakuin kesalahan ini waktu belajar {topik}!',
    'Kenapa {topik} bisa ngubah cara kerjamu 10x lebih cepat?',
    'Bongkar anatomi {topik} dari nol sampai paham!',
    'Simpan dulu! Ini urutan belajar {topik} biar gak pusing.',
    'Fakta mengejutkan di balik {topik} yang wajib kamu tahu!',
  ],
};

const CTA_BANK: Record<CategoryType, string[]> = {
  promo: [
    'Klik keranjang kuning / mampir ke {toko} sebelum kehabisan!',
    'Komen "MAU {produk}" sekarang biar langsung dikirim promonya!',
    'Share ke temen nongkrong lu, sikat harga {harga} hari ini!',
    'Save video ini & tunjukin ke kasir {toko} buat klaim harga {harga}!',
  ],
  quote: [
    'Save video ini buat pengingat dikala lu butuh tenang.',
    'Share ke seseorang yang lagi butuh denger kalimat ini.',
    'Follow buat catatan perjalanan & deep talk berikutnya.',
    'Tulis "SEMBUH" di komentar kalau kamu siap melangkah lagi.',
  ],
  edukasi: [
    'Save materi {topik} ini biar gak ilang pas lagi butuh!',
    'Follow sekarang buat lanjut ke Part 2 pembahasan {topik}!',
    'Share ke grup kelas / tim kamu biar sama-sama upgrade skill!',
    'Komen bagian mana dari {topik} yang paling bikin penasaran!',
  ],
};

const SCENE_VARIATIONS: Record<CategoryType, SceneTemplateEntry[]> = {
  promo: [
    {
      scene2: 'Racikan {produk} dibuat fresh setiap hari dengan bahan kualitas utama.',
      scene2Sub: 'Tekstur dan rasanya konsisten dari suapan pertama sampai habis.',
      scene3: 'Harga normal dicoret! Khusus hari ini di {toko} cuma {harga} saja.',
      scene3Sub: 'Kuota promo harian terbatas, garansi puas 100%.',
      emoji2: '✨',
      emoji3: '🏷️',
    },
    {
      scene2: 'Banyak yang kira {produk} di {toko} mahal, padahal porsinya melimpah.',
      scene2Sub: 'Diracik langsung dengan standar higienis & kualitas terbaik.',
      scene3: 'Cukup bayar {harga} sudah dapet paket komplit tanpa syarat ribet!',
      scene3Sub: 'Bisa pesan langsung di tempat atau order online sekarang.',
      emoji2: '🔥',
      emoji3: '💸',
    },
    {
      scene2: 'Kenapa {produk} dari {toko} selalu antre dan jadi favorit pelanggan?',
      scene2Sub: 'Karena perpaduan rasa otentik yang gak pelit bumbu maupun topping.',
      scene3: 'Nikmati {produk} spesial ini cukup dengan {harga} khusus minggu ini!',
      scene3Sub: 'Ratusan review bintang 5 sudah membuktikan sendiri.',
      emoji2: '⭐',
      emoji3: '🚀',
    },
  ],
  quote: [
    {
      scene2: 'Kamu sudah berjalan sejauh ini melewati banyak badai tentang {topik}.',
      scene2Sub: 'Tidak apa-apa kalau hari ini langkahmu terasa sedikit lebih lambat.',
      scene3: 'Istirahatlah sejenak, hargai setiap proses kecil yang sudah kamu menangkan.',
      scene3Sub: 'Esok pagi selalu membawa ruang baru untuk tumbuh kembali.',
      emoji2: '🌧️',
      emoji3: '🌅',
    },
    {
      scene2: 'Seringkali kita terlalu keras menilai diri sendiri saat menghadapi {topik}.',
      scene2Sub: 'Padahal setiap luka dan gagal adalah bagian dari peta perjalananmu.',
      scene3: 'Lepaskan yang di luar kendalimu, fokus pada ketenangan hatimu hari ini.',
      scene3Sub: 'Kamu jauh lebih tangguh daripada yang kamu bayangkan.',
      emoji2: '🌙',
      emoji3: '🤍',
    },
  ],
  edukasi: [
    {
      scene2: 'Langkah pertama memahami {topik}: kuasai fondasi intinya, bukan hafalan.',
      scene2Sub: 'Fokus pada 20% konsep kunci yang menghasilkan 80% dampak nyata.',
      scene3: 'Terapkan pola {topik} secara bertahap lewat proyek nyata setiap hari.',
      scene3Sub: 'Konsistensi 15 menit sehari jauh lebih efektif daripada sistem kebut semalam.',
      emoji2: '🧠',
      emoji3: '⚡',
    },
    {
      scene2: 'Kesalahan terbesar saat belajar {topik} adalah terlalu banyak teori tanpa praktik.',
      scene2Sub: 'Gunakan kerangka terstruktur agar alur logikanya langsung menempel.',
      scene3: 'Kombinasikan latihan {topik} dengan evaluasi berkala untuk hasil maksimal.',
      scene3Sub: 'Terbukti mempercepat penguasaan materi hingga 3x lipat.',
      emoji2: '📐',
      emoji3: '🎯',
    },
  ],
};

function resolveCategory(raw?: string): CategoryType {
  if (raw === 'quote' || raw === 'promo' || raw === 'edukasi') return raw;
  return 'promo';
}

export function addCustomHookToEngine(first: string, second?: CategoryType | string): void {
  const isFirstCat = first === 'quote' || first === 'promo' || first === 'edukasi';
  const cat = isFirstCat ? resolveCategory(first) : resolveCategory(second);
  const text = isFirstCat ? String(second || '') : String(first || '');
  if (text.trim()) HOOK_BANK[cat].push(text.trim());
}

export function addCustomCtaToEngine(first: string, second?: CategoryType | string): void {
  const isFirstCat = first === 'quote' || first === 'promo' || first === 'edukasi';
  const cat = isFirstCat ? resolveCategory(first) : resolveCategory(second);
  const text = isFirstCat ? String(second || '') : String(first || '');
  if (text.trim()) CTA_BANK[cat].push(text.trim());
}

export function addCustomSceneToEngine(
  first: string,
  second?: CategoryType | 'scene2' | 'scene3' | string,
  third?: { text: string; subtext?: string; emoji?: string } | string
): void {
  const isFirstCat = first === 'quote' || first === 'promo' || first === 'edukasi';
  const cat = isFirstCat ? resolveCategory(first) : resolveCategory(String(second || 'promo'));
  const text =
    typeof third === 'object' && third !== null
      ? third.text
      : isFirstCat
      ? String(third || second || '')
      : first;
  if (!text.trim()) return;
  SCENE_VARIATIONS[cat].push({
    scene2: text.trim(),
    scene2Sub: typeof third === 'object' && third?.subtext ? third.subtext : 'Dirancang otomatis oleh Smart Engine.',
    scene3: text.trim(),
    scene3Sub: 'Teruji memberikan hasil optimal.',
    emoji2: typeof third === 'object' && third?.emoji ? third.emoji : '✨',
    emoji3: '🚀',
  });
}

export function addCustomImageAssetToEngine(
  asset: { id?: string; title?: string; category?: CategoryType | string; url: string } | string,
  category: CategoryType = 'promo'
): void {
  if (typeof asset === 'string') {
    if (!CUSTOM_IMAGE_ASSETS[category]) CUSTOM_IMAGE_ASSETS[category] = [];
    CUSTOM_IMAGE_ASSETS[category].push(asset);
    return;
  }
  const cat = resolveCategory(String(asset.category || category));
  if (!CUSTOM_IMAGE_ASSETS[cat]) CUSTOM_IMAGE_ASSETS[cat] = [];
  if (asset.url) CUSTOM_IMAGE_ASSETS[cat].push(asset.url);
}

export function addKeywordRuleToEngine(
  keywords: string[] | string,
  second?: string[] | CategoryType | string
): void {
  const kwList = Array.isArray(keywords)
    ? keywords
    : String(keywords || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const cat = Array.isArray(second)
    ? resolveCategory(second[0])
    : resolveCategory(String(second || 'promo'));
  if (kwList.length > 0) {
    KEYWORD_RULES_REGISTRY.push({ keywords: kwList, category: cat });
  }
}

export function buildNonRepeatingSequence<T>(pool: T[], count: number, seed: number = Date.now()): T[] {
  const copy = [...pool];
  let s = seed >>> 0 || 123456789;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const candidate = copy[i % copy.length];
    if (result.length > 0 && candidate === result[result.length - 1] && copy.length > 1) {
      result.push(copy[(i + 1) % copy.length]);
    } else {
      result.push(candidate);
    }
  }
  return result;
}

export function parseTopic(rawTopic: string, opts?: GenerateOptions): ParsedTopicMeta {
  const raw = (rawTopic || 'Promo Kopi Susu Gula Aren 18rb').trim();
  const prices = findPrices(raw);
  const overridePrice = opts?.customPrice?.trim() || opts?.priceOverride?.trim();
  const priceText = overridePrice || (prices[0] ? prices[0].formatted : 'Rp18.000');
  const numericPrice = prices[0] ? prices[0].numeric : 18000;
  const originalPriceNumeric = Math.round((numericPrice * 1.45) / 1000) * 1000;
  const originalPriceText = `Rp${(originalPriceNumeric / 1000).toFixed(0)}.000`;

  const cleanedWords = raw
    .replace(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?/gi, '')
    .replace(/\b(promo|diskon|murah|cuma|hanya|kata-kata|tentang|cara|tips|belajar)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const overrideProduct = opts?.customProductName?.trim() || opts?.productOverride?.trim();
  const productName = overrideProduct || (cleanedWords.length >= 2 ? cleanedWords : raw);
  const storeName =
    opts?.customStoreName?.trim() || opts?.storeOverride?.trim() || 'Studio Official';

  const lower = raw.toLowerCase();
  let detectedMood: TopicMood = 'neutral';
  if (/galau|sedih|capek|lelah|rindu|hati|malam|hujan/.test(lower)) detectedMood = 'galau';
  else if (/promo|diskon|murah|hemat|flash|kopi|ayam|pedas|kuliner/.test(lower)) detectedMood = 'promo';
  else if (/coding|nextjs|react|cyber|ai|web|server|deploy|aplikasi/.test(lower)) detectedMood = 'tech';
  else if (/cara|tips|belajar|kuliah|fakta|skripsi|kampus/.test(lower)) detectedMood = 'edukasi';

  for (const rule of KEYWORD_RULES_REGISTRY) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      if (rule.category === 'quote') detectedMood = 'galau';
      else if (rule.category === 'promo') detectedMood = 'promo';
      else if (rule.category === 'edukasi') detectedMood = 'edukasi';
    }
  }

  const matchedPack = matchBestDataPack(raw);

  return {
    rawTopic: raw,
    cleanTopic: productName,
    productName,
    priceText,
    originalPriceText,
    discountPercent: 31,
    storeName,
    detectedMood,
    keywords: matchedPack.matchedKeywords,
    matchedDataPackId: matchedPack.pack.id,
    matchedDataPackTitle: matchedPack.pack.title,
  };
}

export function suggestStyle(topic: string, category?: CategoryType): StyleSuggestion {
  const meta = parseTopic(topic);
  let palette = COLOR_PALETTES[0];
  let music = MUSIC_TRACKS[0];
  let recommendedTemplate: StyleSuggestion['recommendedTemplate'] = 'P1';
  let recommendedFont: EngineFontName = 'Space Grotesk';
  let moodLabel = 'Cyber Studio Energetic';
  let moodReason = `Disesuaikan dengan Data Pack "${meta.matchedDataPackTitle}"`;

  if (meta.detectedMood === 'galau' || category === 'quote') {
    palette = COLOR_PALETTES[4];
    music = MUSIC_TRACKS[1];
    recommendedTemplate = 'Q2';
    recommendedFont = 'Playfair Display';
    moodLabel = 'Midnight Deep Talk & Senja';
    moodReason = 'Nuansa emosional & sinematik malam dengan instrumen lo-fi slow.';
  } else if (meta.detectedMood === 'promo' || category === 'promo') {
    palette = /kopi|aren|cafe|latte/i.test(topic) ? COLOR_PALETTES[2] : COLOR_PALETTES[1];
    music = MUSIC_TRACKS[3];
    recommendedTemplate = 'P1';
    recommendedFont = 'Anton';
    moodLabel = 'Flash Promo High Conversion';
    moodReason = 'Kontras tinggi pemicu konversi UMKM dengan beat cepat.';
  } else if (meta.detectedMood === 'tech') {
    palette = COLOR_PALETTES[0];
    music = MUSIC_TRACKS[4];
    recommendedTemplate = 'E2';
    recommendedFont = 'Space Grotesk';
    moodLabel = 'Cyber Blueprint 60fps';
    moodReason = 'Gaya Cyber Blueprint & AST Terminal modern 60fps.';
  } else {
    palette = COLOR_PALETTES[3];
    music = MUSIC_TRACKS[2];
    recommendedTemplate = 'E1';
    recommendedFont = 'Montserrat';
    moodLabel = 'Clean Educational Flow';
    moodReason = 'Tipografi bersih untuk retensi materi edukasi.';
  }

  return {
    palette,
    music,
    font: recommendedFont,
    moodLabel,
    recommendedTemplate,
    recommendedFont,
    moodReason,
  };
}

function interpolateTemplate(tpl: string, meta: ParsedTopicMeta): string {
  return tpl
    .replace(/\{produk\}/gi, meta.productName)
    .replace(/\{topik\}/gi, meta.cleanTopic)
    .replace(/\{harga\}/gi, meta.priceText)
    .replace(/\{toko\}/gi, meta.storeName);
}

export function generateCaptionAndHashtags(
  topic: string,
  category: CategoryType,
  scenesOrMeta?: SceneItem[] | ParsedTopicMeta,
  maybeMeta?: ParsedTopicMeta
): { caption: string; hashtags: string[] } {
  const meta =
    maybeMeta ||
    (scenesOrMeta && !Array.isArray(scenesOrMeta) ? scenesOrMeta : parseTopic(topic));
  const hashtags = [
    '#fyp',
    '#motionid',
    `#${category}`,
    ...meta.keywords.map((k) => `#${k.replace(/\s+/g, '')}`),
    '#tiktokindonesia',
  ].slice(0, 7);
  const caption = `${meta.productName} (${meta.priceText}) — ${meta.matchedDataPackTitle} ${hashtags.join(' ')}`;
  return { caption, hashtags };
}

export function generateScript(
  topic: string,
  category: CategoryType = 'promo',
  options?: GenerateOptions
): GeneratedScriptResult {
  const seed = options?.seed ?? Math.floor(Math.random() * 1_000_000) + Date.now();
  const meta = parseTopic(topic, options);
  const styleSuggestion = suggestStyle(topic, category);

  const hooks = HOOK_BANK[category] || HOOK_BANK.promo;
  const ctas = CTA_BANK[category] || CTA_BANK.promo;
  const variations = SCENE_VARIATIONS[category] || SCENE_VARIATIONS.promo;

  const chosenHook = interpolateTemplate(hooks[seed % hooks.length], meta);
  const chosenCta = interpolateTemplate(ctas[(seed + 3) % ctas.length], meta);
  const chosenVar = variations[(seed + 5) % variations.length];

  const allTransitions: SceneTransition[] = [
    'whip-left',
    'iris-wipe',
    'diagonal-slice',
    'zoom-punch',
    'glitch-cut',
    'morph-card',
    'shutter-blinds',
    'blueprint-wire',
  ];
  const allAnimations: AnimationType[] = ['pop', 'slide-up', 'typewriter', 'bounce', 'zoom', 'fade'];
  const allCameras: CameraMotionType[] = [
    'zoom-in',
    'dutch-tilt',
    'orbit-3d',
    'pan-drift',
    'handheld-float',
    'zoom-out',
  ];
  const allLayouts: SceneLayout[] = [
    'center',
    'split-top',
    'editorial-left',
    'card-stack',
    'diagonal-hero',
    'bento-grid',
    'hud-frame',
  ];
  const allHeadlineAnims: HeadlineAnim[] = [
    'word-pop',
    'kinetic-slide',
    'typewriter',
    'elastic-bounce',
    'blur-reveal',
    'glitch-decode',
  ];
  const allBgStyles: BackgroundStyle[] = [
    'datapack-synth',
    'aurora',
    'grid-cyber',
    'sunburst',
    'halftone',
    'mesh',
  ];

  const pickedTransitions = buildNonRepeatingSequence(allTransitions, 4, seed + 11);
  const pickedAnimations = buildNonRepeatingSequence(allAnimations, 4, seed + 23);
  const pickedCameras = buildNonRepeatingSequence(allCameras, 4, seed + 37);
  const pickedLayouts = buildNonRepeatingSequence(allLayouts, 4, seed + 53);
  const pickedHeadlineAnims = buildNonRepeatingSequence(allHeadlineAnims, 4, seed + 71);
  const pickedBgStyles = buildNonRepeatingSequence(allBgStyles, 4, seed + 89);

  const rawSceneTexts: Array<{
    role: SceneRole;
    text: string;
    subtext: string;
    emoji: string;
    stepBadge: string;
    widgetType: WidgetBlueprintType;
  }> = [
    {
      role: 'hook',
      text: chosenHook,
      subtext: `Data Pack: ${meta.matchedDataPackTitle}`,
      emoji: category === 'promo' ? '🔥' : category === 'quote' ? '🌙' : '💡',
      stepBadge: '01 // HOOK UTAMA',
      widgetType: category === 'quote' ? 'quote_card' : 'step_number_card',
    },
    {
      role: 'solution',
      text: interpolateTemplate(chosenVar.scene2, meta),
      subtext: interpolateTemplate(chosenVar.scene2Sub, meta),
      emoji: chosenVar.emoji2,
      stepBadge: '02 // EKSPLORASI FITUR',
      widgetType: 'checklist_card',
    },
    {
      role: 'proof',
      text: interpolateTemplate(chosenVar.scene3, meta),
      subtext: interpolateTemplate(chosenVar.scene3Sub, meta),
      emoji: chosenVar.emoji3,
      stepBadge: '03 // BUKTI & NILAI',
      widgetType: category === 'promo' ? 'price_tag_card' : 'step_number_card',
    },
    {
      role: 'cta',
      text: chosenCta,
      subtext: `${meta.storeName} · ${meta.priceText}`,
      emoji: '🚀',
      stepBadge: '04 // DEPLOY & ACTION',
      widgetType: 'cta_button_card',
    },
  ];

  const synthesizedPackImages = synthesizeAllSceneImagesFromDataPack({
    topic: meta.rawTopic,
    category,
    priceLabel: category === 'promo' ? meta.priceText : meta.cleanTopic.slice(0, 14).toUpperCase(),
    scenes: rawSceneTexts.map((s) => ({ text: s.text, subtext: s.subtext })),
  });

  const scenes: SceneItem[] = rawSceneTexts.map((rawSc, idx) => {
    const synthImg = synthesizedPackImages[idx];
    return {
      id: `scene-${idx + 1}-${seed}`,
      sceneNumber: idx + 1,
      role: rawSc.role,
      text: rawSc.text,
      subtext: rawSc.subtext,
      emoji: rawSc.emoji,
      duration: idx === 0 ? 3 : idx === 3 ? 3 : 4,
      animation: pickedAnimations[idx],
      imageUrl: synthImg.dataUri,
      stepBadge: rawSc.stepBadge,
      widgetType: rawSc.widgetType,
      primaryInput: meta.productName,
      secondaryInput: meta.priceText,
      cameraMotion: pickedCameras[idx],
      paletteId: COLOR_PALETTES[(seed + idx) % COLOR_PALETTES.length].id,
      layout: pickedLayouts[idx],
      transition: pickedTransitions[idx],
      bgStyle: pickedBgStyles[idx],
      headlineAnim: pickedHeadlineAnims[idx],
      decor: synthImg.compositionStyle,
      emphasis: meta.priceText,
      dataPackMeta: {
        clusterId: synthImg.clusterId,
        packTitle: synthImg.packTitle,
        compositionStyle: synthImg.compositionStyle,
        matchedKeywords: synthImg.matchedKeywords,
      },
    };
  });

  const { caption, hashtags } = generateCaptionAndHashtags(topic, category, scenes, meta);

  return {
    hook: chosenHook,
    scenes,
    caption,
    hashtags,
    suggestedMusic: styleSuggestion.music,
    suggestedColor: styleSuggestion.palette,
    suggestedStyle: styleSuggestion,
    extractedMeta: meta,
    recipe: {
      id: `recipe-${seed}`,
      name: `Auto Non-Repeating Rig (${meta.matchedDataPackTitle})`,
      packName: meta.matchedDataPackTitle,
      transitions: pickedTransitions,
      animations: pickedAnimations,
      cameraMotions: pickedCameras,
      cursorMode: options?.cursorMode ?? 'single-pro',
    },
    synthesizedPackImages,
  };
}

export function generateDynamicMotionScenes(
  prompt: string,
  presetId?: string
): GeneratedMotionScene[] {
  const res = generateScript(prompt, 'promo', { stylePackId: presetId });
  return res.scenes.map((sc) => ({
    ...sc,
    telemetry: {
      fps: 60,
      springStiffness: 240,
      springDamping: 18,
      motionBlurSamples: 4,
      cursorActive: true,
    },
  }));
}

export function randomizeHookAndStyle(
  currentTopic: string,
  category: CategoryType = 'promo',
  currentPaletteId = 'cyber-violet',
  options?: GenerateOptions
): {
  newScript: GeneratedScriptResult;
  randomPalette: ColorPalette;
  randomMusic: MusicTrack;
} {
  const seed = Math.floor(Math.random() * 999_999) + Date.now();
  const newScript = generateScript(currentTopic, category, { ...options, seed });
  const candidates = COLOR_PALETTES.filter((p) => p.id !== currentPaletteId);
  const randomPalette =
    candidates[seed % candidates.length] || COLOR_PALETTES[seed % COLOR_PALETTES.length];
  const randomMusic = MUSIC_TRACKS[seed % MUSIC_TRACKS.length];
  return { newScript, randomPalette, randomMusic };
}

export {
  GOOGLE_VISUAL_DATA_PACKS,
  matchBestDataPack,
  synthesizeDataPackSceneImage,
  synthesizeAllSceneImagesFromDataPack,
  type GoogleDataPackItem,
  type SynthesizedSceneImage,
};
