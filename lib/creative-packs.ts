import type { CategoryType, SceneTransition, AnimationType, HeadlineAnim } from '@/lib/smart-engine';

export type CreativePackKind = 'icon' | 'component' | 'transition' | 'animation' | 'datapack';
export type PackCategory = CategoryType | 'all';
export type PackAuthor = 'builtin' | 'admin';

export interface IconPathPart {
  d: string;
  stroke?: boolean;
  fill?: boolean;
  opacity?: number;
}

export interface IconPackDefinition {
  id: string;
  name: string;
  category: PackCategory;
  author: PackAuthor;
  viewBox: string;
  paths: IconPathPart[];
  tags: string[];
}

export interface ComponentStyleSpec {
  borderRadius: number;
  borderWidth: number;
  glassBlur: number;
  shadowIntensity: number;
  badgeStyle: 'pill' | 'brutalist' | 'hud-corner' | 'minimal';
}

export interface ComponentPackDefinition {
  id: string;
  name: string;
  category: PackCategory;
  author: PackAuthor;
  style: ComponentStyleSpec;
  previewLabel: string;
}

export interface TransitionPackDefinition {
  id: SceneTransition;
  name: string;
  description: string;
  durationMs: number;
  springStiffness: number;
  springDamping: number;
  cameraHint: string;
}

export interface AnimationPackDefinition {
  id: AnimationType;
  headlineAnim: HeadlineAnim;
  name: string;
  description: string;
  staggerMs: number;
}

/**
 * 12 Transisi Berbeda (Anti-Monoton) agar Scene 1, 2, 3, 4 tidak pernah memakai transisi yang sama
 */
export const NON_REPEATING_TRANSITION_PACKS: TransitionPackDefinition[] = [
  {
    id: 'whip-left',
    name: '01 // Whip Pan Motion Blur',
    description: 'Bantingan kamera horizontal cepat dengan efek jejak kecepatan tinggi.',
    durationMs: 420,
    springStiffness: 280,
    springDamping: 20,
    cameraHint: 'pan-drift',
  },
  {
    id: 'iris-wipe',
    name: '02 // Portal Iris Spotlight',
    description: 'Bukaan lingkaran ekspansif dari titik fokus kursor ke seluruh layar.',
    durationMs: 520,
    springStiffness: 220,
    springDamping: 18,
    cameraHint: 'zoom-in',
  },
  {
    id: 'diagonal-slice',
    name: '03 // Razor Diagonal Slash',
    description: 'Belahan bidang miring 45 derajat bergaya broadcast esports.',
    durationMs: 450,
    springStiffness: 310,
    springDamping: 22,
    cameraHint: 'dutch-tilt',
  },
  {
    id: 'zoom-punch',
    name: '04 // Dolly Zoom Through',
    description: 'Dorongan lensa menembus lapisan Z-axis dengan overshoot pegas RK4.',
    durationMs: 480,
    springStiffness: 260,
    springDamping: 16,
    cameraHint: 'orbit-3d',
  },
  {
    id: 'glitch-cut',
    name: '05 // Chromatic RGB Snap',
    description: 'Pemisahan kanal warna merah-sian selama 4 frame sebelum mengunci tajam.',
    durationMs: 360,
    springStiffness: 350,
    springDamping: 24,
    cameraHint: 'handheld-float',
  },
  {
    id: 'morph-card',
    name: '06 // 3D Isometric Card Flip',
    description: 'Rotasi kartu perspektif 3D 180 derajat dengan pantulan cahaya spekular.',
    durationMs: 560,
    springStiffness: 190,
    springDamping: 17,
    cameraHint: 'orbit-3d',
  },
  {
    id: 'shutter-blinds',
    name: '07 // Kinetic Venetian Slats',
    description: '6 bilah vertikal yang berputar serempak membuka scene berikutnya.',
    durationMs: 490,
    springStiffness: 240,
    springDamping: 19,
    cameraHint: 'pan-drift',
  },
  {
    id: 'blueprint-wire',
    name: '08 // CAD Wireframe Construct',
    description: 'Garis blueprint 1px menggambar rangka scene dari 0x0 px lalu mengisi warna.',
    durationMs: 580,
    springStiffness: 230,
    springDamping: 18,
    cameraHint: 'zoom-out',
  },
];

export const NON_REPEATING_ANIMATION_PACKS: AnimationPackDefinition[] = [
  {
    id: 'pop',
    headlineAnim: 'word-pop',
    name: 'RK4 Spring Overshoot Pop',
    description: 'Muncul membal dengan kecepatan awal negatif (anticipation pullback).',
    staggerMs: 65,
  },
  {
    id: 'slide-up',
    headlineAnim: 'kinetic-slide',
    name: 'Swiss Kinetic Stagger Up',
    description: 'Kata-kata meluncur asimetris dari bawah dengan kemiringan 4 derajat.',
    staggerMs: 55,
  },
  {
    id: 'typewriter',
    headlineAnim: 'typewriter',
    name: 'Live Cursor Typewriter + Highlight',
    description: 'Ketikan karakter real-time diikuti blok seleksi warna ala Figma.',
    staggerMs: 35,
  },
  {
    id: 'bounce',
    headlineAnim: 'elastic-bounce',
    name: 'Elastic Gravity Drop',
    description: 'Jatuh dari atas dan memantul mengikuti kurva gravitasi Hooke.',
    staggerMs: 70,
  },
  {
    id: 'zoom',
    headlineAnim: 'blur-reveal',
    name: 'Cinema Depth Focus Pull',
    description: 'Transisi dari bokeh blur 18px menuju fokus kristal dengan skala 1.25x -> 1.0x.',
    staggerMs: 60,
  },
  {
    id: 'fade',
    headlineAnim: 'glitch-decode',
    name: 'Cyber Matrix Telemetry Decode',
    description: 'Karakter heksadesimal yang ter-decode menjadi kalimat utama.',
    staggerMs: 45,
  },
];
