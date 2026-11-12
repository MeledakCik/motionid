/**
 * MotionID Smart Engine v4.5 (100% Backward-Compatible + Video Motion Skill Choreographer)
 * Mendukung seluruh export asli untuk app/create, app/editor, store/useEditorStore,
 * components/templates/*, lib/canvas-scene, dan lib/video-exporter, sekaligus
 * menyertakan sistem Video Motion Training (@depup.web style) & Spring Physics Solver.
 */

/**
 * MotionID v4.5 — Claude Opus 5.5 Motion Skill & CapCut AI Lab Choreographer
 * Mengimplementasikan Hooke's Law Damped Spring Solver (F = -kx - cv),
 * simulasi kursor otomatis (Bezier Pointer Path + Shockwave Ripple),
 * serta Virtual 3D Camera Focus Zoom & Staggered Word Reveal.
 */

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function solveSpring(
  t: number,
  { stiffness = 210, damping = 15, mass = 1 }: SpringConfig = {}
): number {
  const clamped = Math.max(0, Math.min(2.5, t));
  if (clamped <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * w0 * clamped);
    return 1 - env * (Math.cos(wd * clamped) + ((zeta * w0) / wd) * Math.sin(wd * clamped));
  }
  return 1 - (1 + w0 * clamped) * Math.exp(-w0 * clamped);
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

export interface CursorKeyframeState {
  x: number;
  y: number;
  isPressed: boolean;
  rippleProgress: number;
}

export function computeCursorChoreography(
  progress: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): CursorKeyframeState {
  const moveT = smoothStep(0.36, 0.55, progress);
  const arcLift = Math.sin(moveT * Math.PI) * 18;
  return {
    x: startX + (targetX - startX) * moveT,
    y: startY + (targetY - startY) * moveT - arcLift,
    isPressed: progress > 0.54 && progress < 0.63,
    rippleProgress: smoothStep(0.55, 0.78, progress),
  };
}


export type CategoryType = 'quote' | 'promo' | 'edukasi';

export type AnimationType =
  | 'pop'
  | 'slide-up'
  | 'typewriter'
  | 'bounce'
  | 'fade'
  | 'zoom';

export type AspectRatioType = '9:16' | '1:1' | '16:9';

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

export interface SceneItem {
  id: string;
  sceneNumber: number;
  role: 'Hook / Masalah' | 'Isi / Solusi' | 'Bukti / Harga' | 'CTA Akhir';
  text: string;
  subtext: string;
  emoji: string;
  duration: number;
  animation: AnimationType;
  imageUrl?: string;
  // Properti opsional tambahan untuk Motion Skill v4.5
  stepBadge?: string;
  widgetType?: WidgetBlueprintType;
  primaryInput?: string;
  secondaryInput?: string;
  cameraMotion?: 'spring-slide-vertical' | 'perspective-tilt-3d' | 'whip-zoom-spring' | 'smooth-float';
  paletteId?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  textColor: string;
  accentColor: string;
  badgeTextColor: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  mood: 'slow' | 'energetic' | 'chill' | 'upbeat' | 'dramatic';
  bpm: number;
  url: string;
  cdnUrl: string;
  description: string;
}

export interface CustomImageAsset {
  id: string;
  title: string;
  category: CategoryType;
  url: string;
}

export interface StyleSuggestion {
  paletteId: string;
  colors: ColorPalette;
  font: 'Poppins' | 'Montserrat' | 'Bebas Neue' | 'Playfair Display' | 'Space Grotesk' | 'Anton';
  musicId: string;
  music: MusicTrack;
  backgroundType: 'solid' | 'gradient' | 'image';
  gradientPreset: string;
  moodLabel: string;
}

export interface ParsedTopicMeta {
  cleanTopic: string;
  productName: string;
  priceText: string;
  originalPriceText: string;
  storeName: string;
  emotionKeyword: string;
  detectedMood: 'galau' | 'promo' | 'edukasi' | 'netral';
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
}

export interface GenerateOptions {
  customPrice?: string;
  customProductName?: string;
  customStoreName?: string;
  excludeHooks?: string[];
  forceRandomPalette?: boolean;
  userImages?: string[];
}

export interface SceneTemplateEntry {
  text: string;
  subtext: string;
  emoji: string;
}

/* -------------------------------------------------------------------------- */
/* BUILT-IN DATASETS & PRESETS                                                */
/* -------------------------------------------------------------------------- */

export const CUSTOM_IMAGE_ASSETS: CustomImageAsset[] = [
  {
    id: 'asset-depup-saas',
    title: 'DepUp SaaS Dashboard Preview',
    category: 'edukasi',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 'asset-promo-coffee',
    title: 'Signature Coffee Promo',
    category: 'promo',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 'asset-quote-sunset',
    title: 'Minimal Aesthetic Visual',
    category: 'quote',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80',
  },
];

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'depup-lavender',
    name: 'DepUp Lavender Pastel',
    bgPrimary: '#dcd6f7',
    bgSecondary: '#f3e8ff',
    textColor: '#18181b',
    accentColor: '#4f46e5',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'midnight-indigo',
    name: 'Linear Dark Indigo',
    bgPrimary: '#090d16',
    bgSecondary: '#1e1b4b',
    textColor: '#f8fafc',
    accentColor: '#6366f1',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'aurora-mint',
    name: 'Aurora Mint Fresh',
    bgPrimary: '#d1fae5',
    bgSecondary: '#ecfeff',
    textColor: '#064e3b',
    accentColor: '#10b981',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'cyber-sunset',
    name: 'Cyber Sunset Pulse',
    bgPrimary: '#18181b',
    bgSecondary: '#4c0519',
    textColor: '#ffffff',
    accentColor: '#f43f5e',
    badgeTextColor: '#ffffff',
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Pro',
    bgPrimary: '#064e3b',
    bgSecondary: '#022c22',
    textColor: '#ecfdf5',
    accentColor: '#34d399',
    badgeTextColor: '#022c22',
  },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-saas-upbeat',
    title: 'DepUp Future Garage (118 BPM)',
    mood: 'upbeat',
    bpm: 118,
    url: '/music/upbeat.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    description: 'Beat elektronik bersih bergaya demo produk SaaS & startup modern',
  },
  {
    id: 'track-energetic-drop',
    title: 'Kinetic Bass Drop (128 BPM)',
    mood: 'energetic',
    bpm: 128,
    url: '/music/energetic.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3',
    description: 'Ketukan cepat untuk video promo kilat & transisi CapCut',
  },
  {
    id: 'track-chill-lofi',
    title: 'Lofi Coding & Focus (110 BPM)',
    mood: 'chill',
    bpm: 110,
    url: '/music/chill.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    description: 'Suasana santai untuk microlearning, tutorial, & edukasi teknologi',
  },
  {
    id: 'track-slow-ambient',
    title: 'Cinematic Warmth (92 BPM)',
    mood: 'slow',
    bpm: 92,
    url: '/music/slow.mp3',
    cdnUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e02f9.mp3',
    description: 'Alunan sinematik lembut untuk kutipan & storytelling mendalam',
  },
];

export const BANK_HOOK: Record<CategoryType, string[]> = {
  promo: [
    'Deploy & jalankan {product} tanpa ribet sekarang! 🚀',
    'Masih pakai cara lama? Coba {product} mulai {price}!',
    'Rahasia {product} yang bikin kerjaan 10x lebih cepat ⚡',
    'Spesial hari ini: {product} cuma {price} di {store}!',
  ],
  edukasi: [
    '3 Langkah mudah menguasai {topic} tanpa pusing 💡',
    'Cara kerja {topic} yang jarang dibahas orang!',
    'Jangan lewatkan alur praktis {topic} ini dalam 30 detik 🚀',
    'Tutorial cepat {topic}: Tempel, Periksa, langsung jalan!',
  ],
  quote: [
    'Konsistensi kecil hari ini tentang {topic} mengubah segalanya ✨',
    'Berhenti menunda {topic}, mulai dari langkah pertama.',
    'Fokus pada progres {topic}, bukan kesempurnaan semata.',
    'Setiap karya besar dimulai dari keberanian mencoba {topic}.',
  ],
};

export const BANK_SCENES: Record<
  CategoryType,
  { scene2: SceneTemplateEntry[]; scene3: SceneTemplateEntry[] }
> = {
  promo: {
    scene2: [
      {
        text: '1 Tempel & Hubungkan {product}',
        subtext: 'Konfigurasi instan tanpa setup rumit, langsung terdeteksi otomatis.',
        emoji: '⌘',
      },
      {
        text: 'Kualitas unggulan {product} siap pakai',
        subtext: 'Dirancang agar hemat waktu dengan performa maksimal setiap hari.',
        emoji: '⚡',
      },
    ],
    scene3: [
      {
        text: 'Penawaran spesial {price} di {store}',
        subtext: 'Pantau hasil secara langsung dengan garansi kepuasan penuh.',
        emoji: '🚀',
      },
      {
        text: 'Stok terbatas! Cuma {price} hari ini',
        subtext: 'Langsung aktif dan siap digunakan begitu pemesanan selesai.',
        emoji: '🔥',
      },
    ],
  },
  edukasi: {
    scene2: [
      {
        text: '2 Periksa kompatibilitas {topic}',
        subtext: 'Tahu platform dan pengaturan mana yang paling pas buat kebutuhanmu.',
        emoji: '🔍',
      },
      {
        text: 'Pahami struktur inti {topic}',
        subtext: 'Ringkas, bersih, dan langsung bisa dipraktekkan tanpa teori berbelit.',
        emoji: '📘',
      },
    ],
    scene3: [
      {
        text: '3 Deploy dan pantau {topic}',
        subtext: 'Progres tampil langsung secara real-time tanpa setup rumit.',
        emoji: '🚀',
      },
      {
        text: 'Hasil langsung terlihat dalam hitungan detik',
        subtext: 'Simpan panduan ini agar mudah dibuka kembali saat praktek.',
        emoji: '✅',
      },
    ],
  },
  quote: {
    scene2: [
      {
        text: 'Proses tidak pernah mengkhianati hasil',
        subtext: 'Nikmati setiap tahapan belajar dan bertumbuh bersama {topic}.',
        emoji: '🌱',
      },
    ],
    scene3: [
      {
        text: 'Mulai langkahmu hari ini juga',
        subtext: 'Satu tindakan nyata jauh lebih berarti daripada seribu rencana.',
        emoji: '✨',
      },
    ],
  },
};

export const BANK_CTA: string[] = [
  'Coba sekarang di {store} — klik link di bio! 🚀',
  'Ambil promo {price} sebelum kehabisan hari ini! 🔥',
  'Simpan & bagikan video ini ke tim kamu! ✨',
  'Mulai deploy pertamamu tanpa ribet sekarang! ⚡',
];

export const BANK_HASHTAGS: Record<CategoryType, string[]> = {
  promo: ['#PromoSpesial', '#MotionID', '#Rekomendasi', '#DiskonHariIni', '#ViralIndonesia'],
  edukasi: ['#BelajarCepat', '#TechIndonesia', '#WebDevID', '#TipsProduktif', '#MotionGraphic'],
  quote: ['#MotivasiHarian', '#MindsetBertumbuh', '#Inspirasi', '#QuotesIndonesia', '#Semangat'],
};

export const TOPIC_HASHTAG_MAP: Record<string, string[]> = {
  deploy: ['#DeployApp', '#GitHubRepo', '#SaaSIndonesia', '#CloudHosting'],
  coding: ['#ProgrammerIndonesia', '#NextJS', '#TypeScript', '#WebDeveloper'],
  kopi: ['#KopiSusu', '#KulinerHits', '#AnakKopi', '#PromoKopi'],
};

const trainedVideoPresets: TrainedVideoPreset[] = [
  {
    id: 'preset-depup-7697972111469546753',
    title: 'DepUp SaaS Step Workflow (@depup.web)',
    description: 'Deploy without the hassle. 🚀 — Pastel lavender gradient + lime orb + 3-step SaaS UI & live terminal.',
    category: 'edukasi',
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
      staggerMs: 85,
    },
  },
];

/* -------------------------------------------------------------------------- */
/* TRAINING INJECTION MUTATORS                                                */
/* -------------------------------------------------------------------------- */

export function addTrainedVideoPresetToEngine(preset: TrainedVideoPreset): void {
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

export function addCustomHookToEngine(category: CategoryType, hookText: string): boolean {
  const clean = hookText.trim();
  if (!clean) return false;
  const list = BANK_HOOK[category] || BANK_HOOK.promo;
  if (!list.includes(clean)) list.unshift(clean);
  return true;
}

export function addCustomSceneToEngine(
  category: CategoryType,
  slot: 'scene2' | 'scene3',
  entry: SceneTemplateEntry
): boolean {
  if (!entry.text?.trim()) return false;
  const target = BANK_SCENES[category] || BANK_SCENES.promo;
  target[slot].unshift({
    text: entry.text.trim(),
    subtext: entry.subtext?.trim() || '',
    emoji: entry.emoji?.trim() || '✨',
  });
  return true;
}

export function addCustomCtaToEngine(ctaText: string): boolean {
  const clean = ctaText.trim();
  if (!clean) return false;
  if (!BANK_CTA.includes(clean)) BANK_CTA.unshift(clean);
  return true;
}

export function addCustomImageAssetToEngine(asset: CustomImageAsset): boolean {
  if (!asset.url?.trim()) return false;
  if (!CUSTOM_IMAGE_ASSETS.some((a) => a.id === asset.id)) {
    CUSTOM_IMAGE_ASSETS.unshift(asset);
  }
  return true;
}

export function addKeywordRuleToEngine(keywords: string[], hashtags: string[]): boolean {
  if (!keywords.length || !hashtags.length) return false;
  const formattedTags = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`));
  keywords.forEach((kw) => {
    const k = kw.toLowerCase().trim();
    if (k) {
      TOPIC_HASHTAG_MAP[k] = Array.from(new Set([...(TOPIC_HASHTAG_MAP[k] || []), ...formattedTags]));
    }
  });
  return true;
}

/* -------------------------------------------------------------------------- */
/* CORE PARSER & GENERATOR ENGINE                                             */
/* -------------------------------------------------------------------------- */

export function parseTopic(rawTopic: string, options?: GenerateOptions): ParsedTopicMeta {
  const cleanTopic = (rawTopic || 'Aplikasi Web Modern').trim();
  const priceMatch = cleanTopic.match(/(\d+[.,]?\d*)\s*(rb|ribu|k|jt|juta)/i);
  const extractedPrice = priceMatch ? `Rp ${priceMatch[1]}${priceMatch[2].toUpperCase()}` : '';
  const priceText = options?.customPrice?.trim() || extractedPrice || ' Akses Gratis';

  const productName =
    options?.customProductName?.trim() ||
    cleanTopic.replace(/(\d+[.,]?\d*)\s*(rb|ribu|k|jt|juta)/gi, '').trim() ||
    cleanTopic;

  const storeName = options?.customStoreName?.trim() || 'MotionID Studio';
  const lower = cleanTopic.toLowerCase();

  let detectedMood: ParsedTopicMeta['detectedMood'] = 'netral';
  let emotionKeyword = 'modern';
  if (/promo|diskon|murah|sale|rb|ribu/.test(lower)) {
    detectedMood = 'promo';
    emotionKeyword = 'antusias';
  } else if (/cara|tutorial|langkah|deploy|belajar|tips|repo/.test(lower)) {
    detectedMood = 'edukasi';
    emotionKeyword = 'pintar';
  } else if (/galau|sedih|capek|tenang|hidup/.test(lower)) {
    detectedMood = 'galau';
    emotionKeyword = 'reflektif';
  }

  return {
    cleanTopic,
    productName,
    priceText,
    originalPriceText: priceText,
    storeName,
    emotionKeyword,
    detectedMood,
  };
}

export const extractTopicMetadata = parseTopic;

export function interpolateTemplate(template: string, meta: ParsedTopicMeta): string {
  return (template || '')
    .replace(/\{topic\}/gi, meta.cleanTopic)
    .replace(/\{product\}/gi, meta.productName)
    .replace(/\{price\}/gi, meta.priceText)
    .replace(/\{store\}/gi, meta.storeName);
}

export function suggestStyle(
  rawTopic: string,
  category: CategoryType = 'promo',
  forceRandom = false
): StyleSuggestion {
  const lower = (rawTopic || '').toLowerCase();
  let chosenPalette = COLOR_PALETTES[0];

  if (forceRandom) {
    chosenPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
  } else if (lower.includes('depup') || lower.includes('deploy') || category === 'edukasi') {
    chosenPalette = COLOR_PALETTES[0]; // DepUp Lavender Pastel
  } else if (category === 'promo') {
    chosenPalette = COLOR_PALETTES[1]; // Linear Dark Indigo
  } else if (category === 'quote') {
    chosenPalette = COLOR_PALETTES[2]; // Aurora Mint
  }

  const chosenMusic =
    category === 'promo'
      ? MUSIC_TRACKS[1]
      : category === 'edukasi'
      ? MUSIC_TRACKS[0]
      : MUSIC_TRACKS[3];

  return {
    paletteId: chosenPalette.id,
    colors: chosenPalette,
    font: category === 'quote' ? 'Playfair Display' : 'Space Grotesk',
    musicId: chosenMusic.id,
    music: chosenMusic,
    backgroundType: 'gradient',
    gradientPreset: chosenPalette.id,
    moodLabel: `${chosenPalette.name} • ${chosenMusic.bpm} BPM`,
  };
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

  const baseTags = [...(BANK_HASHTAGS[category] || BANK_HASHTAGS.promo)];
  const lower = (topic || '').toLowerCase();
  Object.entries(TOPIC_HASHTAG_MAP).forEach(([kw, tags]) => {
    if (lower.includes(kw)) {
      tags.forEach((t) => {
        if (!baseTags.includes(t)) baseTags.push(t);
      });
    }
  });

  const caption = `${meta.productName} — Solusi cepat tanpa ribet bersama ${meta.storeName}. 🚀 ${baseTags
    .slice(0, 5)
    .join(' ')}`;

  return {
    caption,
    hashtags: baseTags.slice(0, 8),
  };
}

export function generateDynamicMotionScenes(
  prompt: string,
  presetId = 'depup-workflow'
): GeneratedMotionScene[] {
  const activePreset =
    trainedVideoPresets.find((p) => p.profile.presetId === presetId || p.id === presetId) ||
    trainedVideoPresets[0];

  const cleanTopic = prompt.trim() || 'Deploy Aplikasi Web Tanpa Ribet';
  const slug =
    cleanTopic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'app-project';

  const springFactor = solveSpring(0.5, { stiffness: 220, damping: 14 });
  void springFactor;

  return [
    {
      id: 'scene-step-1',
      stepBadge: activePreset.profile.stepBadges[0] || '1 Tempel',
      title: 'Tempel link repo',
      subtext: 'Repo private pun bisa, cukup tambahkan GitHub Token.',
      duration: 3.4,
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
      duration: 3.4,
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

export function generateScript(
  rawTopic: string,
  category: CategoryType = 'promo',
  options?: GenerateOptions
): GeneratedScriptResult {
  const meta = parseTopic(rawTopic, options);
  const style = suggestStyle(rawTopic, category, options?.forceRandomPalette);

  const hooks = BANK_HOOK[category] || BANK_HOOK.promo;
  const availableHooks = options?.excludeHooks?.length
    ? hooks.filter((h) => !options.excludeHooks!.includes(h))
    : hooks;
  const rawHook = availableHooks[0] || hooks[0];
  const hook = interpolateTemplate(rawHook, meta);

  const sceneBank = BANK_SCENES[category] || BANK_SCENES.promo;
  const s2 = sceneBank.scene2[0];
  const s3 = sceneBank.scene3[0];
  const cta = interpolateTemplate(BANK_CTA[0], meta);

  const slug =
    meta.productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20) || 'app';

  const scenes: SceneItem[] = [
    {
      id: 'scene-1',
      sceneNumber: 1,
      role: 'Hook / Masalah',
      text: hook,
      subtext: 'Repo private pun bisa, cukup tambahkan GitHub Token otomatis.',
      emoji: '🚀',
      duration: 3.4,
      animation: 'pop',
      imageUrl: options?.userImages?.[0] || CUSTOM_IMAGE_ASSETS[0]?.url,
      stepBadge: '1 Tempel',
      widgetType: 'repo_input_card',
      primaryInput: `github.com/dimas/${slug}`,
      secondaryInput: 'Private Repo Ready, GitHub Token Active',
      cameraMotion: 'spring-slide-vertical',
      paletteId: style.paletteId,
    },
    {
      id: 'scene-2',
      sceneNumber: 2,
      role: 'Isi / Solusi',
      text: interpolateTemplate(s2.text, meta),
      subtext: interpolateTemplate(s2.subtext, meta),
      emoji: s2.emoji || '⚡',
      duration: 3.4,
      animation: 'slide-up',
      imageUrl: options?.userImages?.[1] || CUSTOM_IMAGE_ASSETS[1]?.url,
      stepBadge: '2 Periksa',
      widgetType: 'repo_scanner_card',
      primaryInput: `Analisa AI: ${meta.productName.slice(0, 24)}`,
      secondaryInput: 'Next.js 14 App, Build 1.4s Cepat, 99% Match',
      cameraMotion: 'spring-slide-vertical',
      paletteId: style.paletteId,
    },
    {
      id: 'scene-3',
      sceneNumber: 3,
      role: 'Bukti / Harga',
      text: interpolateTemplate(s3.text, meta),
      subtext: interpolateTemplate(s3.subtext, meta),
      emoji: s3.emoji || '🔥',
      duration: 3.5,
      animation: 'zoom',
      imageUrl: options?.userImages?.[2] || CUSTOM_IMAGE_ASSETS[2]?.url,
      stepBadge: '3 Deploy',
      widgetType: 'terminal_build_card',
      primaryInput: `https://${slug}.depup.id`,
      secondaryInput: `$ git clone https://github.com/dimas/${slug}, $ npm install --production, ✓ Live at https://${slug}.depup.id 🚀`,
      cameraMotion: 'spring-slide-vertical',
      paletteId: style.paletteId,
    },
    {
      id: 'scene-4',
      sceneNumber: 4,
      role: 'CTA Akhir',
      text: cta,
      subtext: `Mulai bersama ${meta.storeName} dalam hitungan detik.`,
      emoji: '✨',
      duration: 3.2,
      animation: 'bounce',
      stepBadge: '4 Live',
      widgetType: 'bento_metrics_grid',
      primaryInput: `${meta.productName} • ${meta.priceText}`,
      secondaryInput: '60 FPS Smooth, Auto-Scale, Siap Pakai',
      cameraMotion: 'perspective-tilt-3d',
      paletteId: style.paletteId,
    },
  ];

  const { caption, hashtags } = generateCaptionAndHashtags(rawTopic, category, scenes, meta);

  return {
    hook,
    scenes,
    caption,
    hashtags,
    suggestedMusic: style.music,
    suggestedColor: style.colors,
    suggestedStyle: style,
    extractedMeta: meta,
  };
}

export function randomizeHookAndStyle(
  currentTopic: string,
  category: CategoryType = 'promo',
  currentPaletteId = 'depup-lavender',
  options?: GenerateOptions
): {
  newScript: GeneratedScriptResult;
  randomPalette: ColorPalette;
  randomMusic: MusicTrack;
} {
  const otherPalettes = COLOR_PALETTES.filter((p) => p.id !== currentPaletteId);
  const randomPalette =
    otherPalettes[Math.floor(Math.random() * otherPalettes.length)] || COLOR_PALETTES[0];
  const randomMusic = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];

  const newScript = generateScript(currentTopic, category, {
    ...options,
    forceRandomPalette: true,
  });

  newScript.suggestedColor = randomPalette;
  newScript.suggestedMusic = randomMusic;
  newScript.suggestedStyle = {
    ...newScript.suggestedStyle,
    paletteId: randomPalette.id,
    colors: randomPalette,
    musicId: randomMusic.id,
    music: randomMusic,
    gradientPreset: randomPalette.id,
  };

  return {
    newScript,
    randomPalette,
    randomMusic,
  };
}
