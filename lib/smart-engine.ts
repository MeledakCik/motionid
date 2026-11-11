export type CategoryType = 'kuliner' | 'fashion' | 'elektronik' | 'jasa' | 'umum';

export type WidgetBlueprintType =
  | 'repo_input_card'
  | 'repo_scanner_card'
  | 'terminal_build_card'
  | 'bento_metrics_grid'
  | 'feature_spotlight_card'
  | 'kinetic_hook_card'
  | 'cta_dock_card';

export interface MotionTelemetryProfile {
  presetId: string;
  creatorHandle: string;
  sourceUrl: string;
  easing: string;
  cameraMotion: 'spring-slide-vertical' | 'perspective-tilt-3d' | 'whip-zoom-spring' | 'smooth-float';
  bpm: number;
  paletteId: string;
  widgetSequence: WidgetBlueprintType[];
  stepBadges: string[];
  cardRadius: number;
  glassBlur: number;
  staggerMs: number;
}

export interface TrainedVideoPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  creatorHandle: string;
  profile: MotionTelemetryProfile;
}

export interface GeneratedMotionScene {
  id: string;
  stepBadge: string;
  title: string;
  subtext: string;
  duration: number;
  paletteId: string;
  widgetType: WidgetBlueprintType;
  widgetData: {
    primaryInput?: string;
    secondaryBadge?: string;
    terminalLines?: string[];
    metrics?: Array<{ label: string; value: string; accent: string }>;
  };
  cameraMotion: string;
  easing: string;
}

const trainedVideoPresets: TrainedVideoPreset[] = [
  {
    id: 'preset-depup-7697972111469546753',
    title: 'DepUp SaaS Step Workflow (@depup.web)',
    description: 'Deploy without the hassle. 🚀 — Pastel lavender gradient + lime orb + 3-step SaaS UI & live terminal.',
    category: 'jasa',
    videoUrl: 'https://www.tiktok.com/@depup.web/video/7697972111469546753',
    creatorHandle: '@depup.web',
    profile: {
      presetId: 'depup-workflow',
      creatorHandle: '@depup.web',
      sourceUrl: 'https://www.tiktok.com/@depup.web/video/7697972111469546753',
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cameraMotion: 'spring-slide-vertical',
      bpm: 118,
      paletteId: 'depup-lavender',
      widgetSequence: ['repo_input_card', 'repo_scanner_card', 'terminal_build_card'],
      stepBadges: ['1 Tempel', '2 Periksa', '3 Deploy'],
      cardRadius: 24,
      glassBlur: 18,
      staggerMs: 140,
    },
  },
];

export function addTrainedVideoPresetToEngine(preset: TrainedVideoPreset) {
  const idx = trainedVideoPresets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    trainedVideoPresets[idx] = preset;
  } else {
    trainedVideoPresets.unshift(preset);
  }
}

export function getTrainedVideoPresets(): TrainedVideoPreset[] {
  return trainedVideoPresets;
}

export function addCustomHookToEngine(_cat: CategoryType, _text: string) {}
export function addCustomSceneToEngine(
  _cat: CategoryType,
  _slot: 'scene2' | 'scene3',
  _scene: { text: string; subtext: string; emoji: string }
) {}
export function addCustomCtaToEngine(_text: string) {}
export function addCustomImageAssetToEngine(_asset: {
  id: string;
  title: string;
  category: CategoryType;
  url: string;
}) {}
export function addKeywordRuleToEngine(_keywords: string[], _outputs: string[]) {
  return true;
}

/**
 * Menghasilkan rangkaian scene motion graphic yang dinamis dan tidak kaku
 * berdasarkan prompt topik dan preset video hasil training.
 */
export function generateDynamicMotionScenes(
  prompt: string,
  presetId = 'depup-workflow'
): GeneratedMotionScene[] {
  const activePreset =
    trainedVideoPresets.find((p) => p.profile.presetId === presetId || p.id === presetId) ||
    trainedVideoPresets[0];

  const cleanTopic = prompt.trim() || 'Deploy Aplikasi Web Tanpa Ribet';
  const slug = cleanTopic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'app-project';

  return [
    {
      id: 'scene-step-1',
      stepBadge: activePreset.profile.stepBadges[0] || '1 Tempel',
      title: 'Tempel link repo',
      subtext: 'Repo private pun bisa, cukup tambahkan GitHub Token.',
      duration: 3.2,
      paletteId: activePreset.profile.paletteId,
      widgetType: 'repo_input_card',
      widgetData: {
        primaryInput: `github.com/dimas/${slug}`,
        secondaryBadge: 'Private Repo • Token Ready',
      },
      cameraMotion: activePreset.profile.cameraMotion,
      easing: activePreset.profile.easing,
    },
    {
      id: 'scene-step-2',
      stepBadge: activePreset.profile.stepBadges[1] || '2 Periksa',
      title: 'Periksa repo dulu',
      subtext: 'Tahu platform mana yang paling pas buat app kamu.',
      duration: 3.2,
      paletteId: activePreset.profile.paletteId,
      widgetType: 'repo_scanner_card',
      widgetData: {
        primaryInput: `Analisa Otomatis: ${cleanTopic}`,
        secondaryBadge: 'Next.js 14 • Edge Ready • 99% Match',
        metrics: [
          { label: 'Framework', value: 'Next.js App', accent: '#6366f1' },
          { label: 'Build Speed', value: '1.4s Fast', accent: '#10b981' },
          { label: 'Auto SSL', value: 'Aktif', accent: '#8b5cf6' },
        ],
      },
      cameraMotion: activePreset.profile.cameraMotion,
      easing: activePreset.profile.easing,
    },
    {
      id: 'scene-step-3',
      stepBadge: activePreset.profile.stepBadges[2] || '3 Deploy',
      title: 'Deploy dan pantau',
      subtext: 'Progres tampil langsung, tanpa perlu setup rumit.',
      duration: 3.6,
      paletteId: activePreset.profile.paletteId,
      widgetType: 'terminal_build_card',
      widgetData: {
        primaryInput: `https://${slug}.depup.id`,
        terminalLines: [
          `$ git clone https://github.com/dimas/${slug}.git`,
          `$ npm install --production && npm run build`,
          `✓ Container optimized & Edge SSL provisioned`,
          `🚀 Live at https://${slug}.depup.id (24ms)`,
        ],
      },
      cameraMotion: activePreset.profile.cameraMotion,
      easing: activePreset.profile.easing,
    },
  ];
}
