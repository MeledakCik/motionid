import type React from 'react';
import type {
  CategoryType,
  SceneTransition,
  AnimationType,
  HeadlineAnim,
} from '@/lib/smart-engine';

export type CreativePackKind = 'icon' | 'component' | 'transition' | 'animation' | 'datapack';
export type PackCategory = CategoryType | 'all';
export type PackAuthor = 'builtin' | 'admin';

export interface IconPathPart {
  d: string;
  stroke?: boolean;
  fill?: boolean;
  opacity?: number;
  strokeWidth?: number;
}

export interface IconPackDefinition {
  id: string;
  kind?: 'icon';
  name: string;
  category: PackCategory;
  author: PackAuthor;
  viewBox: string;
  paths: IconPathPart[];
  tags: string[];
  rawSvg?: string;
}

export interface ComponentStyleSpec {
  borderRadius: number;
  borderWidth: number;
  glassBlur: number;
  shadowIntensity: number;
  badgeStyle: 'pill' | 'brutalist' | 'hud-corner' | 'minimal';
  background?: string;
  borderColor?: string;
  accentColor?: string;
  padding?: string;
}

export interface ComponentPackDefinition {
  id: string;
  kind?: 'component';
  name: string;
  category: PackCategory;
  author: PackAuthor;
  style: ComponentStyleSpec;
  previewLabel: string;
  tags?: string[];
}

export interface TransitionSpec {
  type: SceneTransition;
  durationMs: number;
  springStiffness: number;
  springDamping: number;
  cameraHint?: string;
  easing?: string;
}

export interface TransitionPackDefinition {
  id: string;
  kind?: 'transition';
  transitionId?: SceneTransition;
  name: string;
  category?: PackCategory;
  author?: PackAuthor;
  description: string;
  durationMs: number;
  springStiffness: number;
  springDamping: number;
  cameraHint: string;
  spec?: TransitionSpec;
}

export interface AnimationSpec {
  type: AnimationType;
  headlineAnim: HeadlineAnim;
  staggerMs: number;
  springStiffness?: number;
  springDamping?: number;
}

export interface AnimationPackDefinition {
  id: string;
  kind?: 'animation';
  animationId?: AnimationType;
  headlineAnim: HeadlineAnim;
  name: string;
  category?: PackCategory;
  author?: PackAuthor;
  description: string;
  staggerMs: number;
  spec?: AnimationSpec;
}

export type CreativePackDefinition =
  | IconPackDefinition
  | ComponentPackDefinition
  | TransitionPackDefinition
  | AnimationPackDefinition;

export interface CreativePackRowLike {
  id?: string | number;
  target_type?: string;
  category?: string;
  content_text?: string;
  subtext?: string | null;
  emoji?: string | null;
  image_url?: string | null;
}

export const NON_REPEATING_TRANSITION_PACKS: TransitionPackDefinition[] = [
  {
    id: 'whip-left',
    kind: 'transition',
    transitionId: 'whip-left',
    name: '01 // Whip Pan Motion Blur',
    category: 'all',
    author: 'builtin',
    description: 'Bantingan kamera horizontal cepat dengan jejak kecepatan tinggi.',
    durationMs: 420,
    springStiffness: 280,
    springDamping: 20,
    cameraHint: 'pan-drift',
  },
  {
    id: 'iris-wipe',
    kind: 'transition',
    transitionId: 'iris-wipe',
    name: '02 // Portal Iris Spotlight',
    category: 'all',
    author: 'builtin',
    description: 'Bukaan lingkaran ekspansif dari titik fokus kursor ke seluruh layar.',
    durationMs: 520,
    springStiffness: 220,
    springDamping: 18,
    cameraHint: 'zoom-in',
  },
  {
    id: 'diagonal-slice',
    kind: 'transition',
    transitionId: 'diagonal-slice',
    name: '03 // Razor Diagonal Slash',
    category: 'all',
    author: 'builtin',
    description: 'Belahan bidang miring 45 derajat bergaya broadcast esports.',
    durationMs: 450,
    springStiffness: 310,
    springDamping: 22,
    cameraHint: 'dutch-tilt',
  },
  {
    id: 'zoom-punch',
    kind: 'transition',
    transitionId: 'zoom-punch',
    name: '04 // Dolly Zoom Through',
    category: 'all',
    author: 'builtin',
    description: 'Dorongan lensa menembus lapisan Z-axis dengan overshoot pegas RK4.',
    durationMs: 480,
    springStiffness: 260,
    springDamping: 16,
    cameraHint: 'orbit-3d',
  },
  {
    id: 'glitch-cut',
    kind: 'transition',
    transitionId: 'glitch-cut',
    name: '05 // Chromatic RGB Snap',
    category: 'all',
    author: 'builtin',
    description: 'Pemisahan kanal warna merah-sian selama 4 frame sebelum mengunci tajam.',
    durationMs: 360,
    springStiffness: 350,
    springDamping: 24,
    cameraHint: 'handheld-float',
  },
  {
    id: 'morph-card',
    kind: 'transition',
    transitionId: 'morph-card',
    name: '06 // 3D Isometric Card Flip',
    category: 'all',
    author: 'builtin',
    description: 'Rotasi kartu perspektif 3D 180 derajat dengan pantulan cahaya spekular.',
    durationMs: 560,
    springStiffness: 190,
    springDamping: 17,
    cameraHint: 'orbit-3d',
  },
  {
    id: 'shutter-blinds',
    kind: 'transition',
    transitionId: 'shutter-blinds',
    name: '07 // Kinetic Venetian Slats',
    category: 'all',
    author: 'builtin',
    description: '6 bilah vertikal yang berputar serempak membuka scene berikutnya.',
    durationMs: 490,
    springStiffness: 240,
    springDamping: 19,
    cameraHint: 'pan-drift',
  },
  {
    id: 'blueprint-wire',
    kind: 'transition',
    transitionId: 'blueprint-wire',
    name: '08 // CAD Wireframe Construct',
    category: 'all',
    author: 'builtin',
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
    kind: 'animation',
    animationId: 'pop',
    headlineAnim: 'word-pop',
    name: 'RK4 Spring Overshoot Pop',
    category: 'all',
    author: 'builtin',
    description: 'Muncul membal dengan kecepatan awal negatif (anticipation pullback).',
    staggerMs: 65,
  },
  {
    id: 'slide-up',
    kind: 'animation',
    animationId: 'slide-up',
    headlineAnim: 'kinetic-slide',
    name: 'Swiss Kinetic Stagger Up',
    category: 'all',
    author: 'builtin',
    description: 'Kata-kata meluncur asimetris dari bawah dengan kemiringan 4 derajat.',
    staggerMs: 55,
  },
  {
    id: 'typewriter',
    kind: 'animation',
    animationId: 'typewriter',
    headlineAnim: 'typewriter',
    name: 'Live Cursor Typewriter + Highlight',
    category: 'all',
    author: 'builtin',
    description: 'Ketikan karakter real-time diikuti blok seleksi warna ala Figma.',
    staggerMs: 35,
  },
  {
    id: 'bounce',
    kind: 'animation',
    animationId: 'bounce',
    headlineAnim: 'elastic-bounce',
    name: 'Elastic Gravity Drop',
    category: 'all',
    author: 'builtin',
    description: 'Jatuh dari atas dan memantul mengikuti kurva gravitasi Hooke.',
    staggerMs: 70,
  },
  {
    id: 'zoom',
    kind: 'animation',
    animationId: 'zoom',
    headlineAnim: 'blur-reveal',
    name: 'Cinema Depth Focus Pull',
    category: 'all',
    author: 'builtin',
    description: 'Transisi dari bokeh blur 18px menuju fokus kristal.',
    staggerMs: 60,
  },
  {
    id: 'fade',
    kind: 'animation',
    animationId: 'fade',
    headlineAnim: 'glitch-decode',
    name: 'Cyber Matrix Telemetry Decode',
    category: 'all',
    author: 'builtin',
    description: 'Karakter heksadesimal yang ter-decode menjadi kalimat utama.',
    staggerMs: 45,
  },
];

export const TEMPLATE_STYLE_VARIANTS: Record<string, { label: string; badge: string; accent: string }> = {
  Q1: { label: 'Aurora Glass Editorial', badge: 'QUOTE // Q1', accent: '#818CF8' },
  Q2: { label: '35mm Film Polaroid', badge: 'QUOTE // Q2', accent: '#F472B6' },
  Q3: { label: 'Karaoke Word Beat', badge: 'QUOTE // Q3', accent: '#38BDF8' },
  P1: { label: 'Flash Deal Sticker Burst', badge: 'PROMO // P1', accent: '#FACC15' },
  P2: { label: 'Split Before vs After', badge: 'PROMO // P2', accent: '#34D399' },
  P3: { label: 'Countdown Urgency Rig', badge: 'PROMO // P3', accent: '#FB7185' },
  E1: { label: 'Step-by-Step Blueprint', badge: 'EDU // E1', accent: '#22D3EE' },
  E2: { label: 'Cyber Brutalist Fact Pop', badge: 'EDU // E2', accent: '#A855F7' },
  E3: { label: 'Interactive Quiz HUD', badge: 'EDU // E3', accent: '#F59E0B' },
};

const ICON_PACK_REGISTRY: IconPackDefinition[] = [
  {
    id: 'icon-spark-bolt',
    kind: 'icon',
    name: 'Cyber Bolt Pulse',
    category: 'all',
    author: 'builtin',
    viewBox: '0 0 24 24',
    paths: [{ d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', fill: true }],
    tags: ['promo', 'kilat', 'energi'],
  },
  {
    id: 'icon-cursor-pro',
    kind: 'icon',
    name: 'Smart Cursor Pointer',
    category: 'all',
    author: 'builtin',
    viewBox: '0 0 24 24',
    paths: [{ d: 'M3 3l16 9-7 2-3 7L3 3z', fill: true, stroke: true }],
    tags: ['kursor', 'klik', 'interaktif'],
  },
];

const COMPONENT_PACK_REGISTRY: ComponentPackDefinition[] = [
  {
    id: 'comp-glass-hud',
    kind: 'component',
    name: 'Glassmorphic Telemetry Card',
    category: 'all',
    author: 'builtin',
    style: {
      borderRadius: 20,
      borderWidth: 1.5,
      glassBlur: 14,
      shadowIntensity: 0.35,
      badgeStyle: 'hud-corner',
    },
    previewLabel: 'HUD // 60FPS',
    tags: ['glass', 'hud', 'futuristik'],
  },
  {
    id: 'comp-brutalist-promo',
    kind: 'component',
    name: 'Neo-Brutalist Sticker Box',
    category: 'promo',
    author: 'builtin',
    style: {
      borderRadius: 14,
      borderWidth: 3,
      glassBlur: 0,
      shadowIntensity: 0.8,
      badgeStyle: 'brutalist',
    },
    previewLabel: 'DISKON GILA!',
    tags: ['promo', 'stiker', 'umkm'],
  },
];

const TRANSITION_PACK_REGISTRY: TransitionPackDefinition[] = [...NON_REPEATING_TRANSITION_PACKS];
const ANIMATION_PACK_REGISTRY: AnimationPackDefinition[] = [...NON_REPEATING_ANIMATION_PACKS];

export function parseSvgIcon(raw: string, fallbackName = 'Custom Icon'): IconPackDefinition {
  const dMatch = raw.match(/\bd=["']([^"']+)["']/i);
  const vbMatch = raw.match(/\bviewBox=["']([^"']+)["']/i);
  return {
    id: `icon-${Date.now()}`,
    kind: 'icon',
    name: fallbackName,
    category: 'all',
    author: 'admin',
    viewBox: vbMatch ? vbMatch[1] : '0 0 24 24',
    paths: [{ d: dMatch ? dMatch[1] : 'M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z', fill: true }],
    tags: ['custom'],
    rawSvg: raw,
  };
}

export function parseTransitionCode(raw: string, fallbackName = 'Custom Transition'): TransitionPackDefinition {
  try {
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || `tr-${Date.now()}`,
      kind: 'transition',
      transitionId: (parsed.transitionId || 'whip-left') as SceneTransition,
      name: parsed.name || fallbackName,
      category: parsed.category || 'all',
      author: 'admin',
      description: parsed.description || 'Custom trained transition pack',
      durationMs: Number(parsed.durationMs || 460),
      springStiffness: Number(parsed.springStiffness || 240),
      springDamping: Number(parsed.springDamping || 18),
      cameraHint: parsed.cameraHint || 'zoom-in',
    };
  } catch {
    return {
      ...NON_REPEATING_TRANSITION_PACKS[0],
      id: `tr-${Date.now()}`,
      name: fallbackName,
      author: 'admin',
    };
  }
}

export function parseAnimationCode(raw: string, fallbackName = 'Custom Animation'): AnimationPackDefinition {
  try {
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || `anim-${Date.now()}`,
      kind: 'animation',
      animationId: (parsed.animationId || 'pop') as AnimationType,
      headlineAnim: (parsed.headlineAnim || 'word-pop') as HeadlineAnim,
      name: parsed.name || fallbackName,
      category: parsed.category || 'all',
      author: 'admin',
      description: parsed.description || 'Custom trained animation pack',
      staggerMs: Number(parsed.staggerMs || 55),
    };
  } catch {
    return {
      ...NON_REPEATING_ANIMATION_PACKS[0],
      id: `anim-${Date.now()}`,
      name: fallbackName,
      author: 'admin',
    };
  }
}

export function parseComponentCode(raw: string, fallbackName = 'Custom Component'): ComponentPackDefinition {
  try {
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || `comp-${Date.now()}`,
      kind: 'component',
      name: parsed.name || fallbackName,
      category: parsed.category || 'all',
      author: 'admin',
      style: {
        borderRadius: Number(parsed.borderRadius ?? 18),
        borderWidth: Number(parsed.borderWidth ?? 2),
        glassBlur: Number(parsed.glassBlur ?? 12),
        shadowIntensity: Number(parsed.shadowIntensity ?? 0.4),
        badgeStyle: parsed.badgeStyle || 'pill',
      },
      previewLabel: parsed.previewLabel || fallbackName,
    };
  } catch {
    return {
      ...COMPONENT_PACK_REGISTRY[0],
      id: `comp-${Date.now()}`,
      name: fallbackName,
      author: 'admin',
    };
  }
}

export function getIconPacks(category?: PackCategory): IconPackDefinition[] {
  if (!category || category === 'all') return [...ICON_PACK_REGISTRY];
  return ICON_PACK_REGISTRY.filter((p) => p.category === 'all' || p.category === category);
}

export function getComponentPacks(category?: PackCategory): ComponentPackDefinition[] {
  if (!category || category === 'all') return [...COMPONENT_PACK_REGISTRY];
  return COMPONENT_PACK_REGISTRY.filter((p) => p.category === 'all' || p.category === category);
}

export function getTransitionPacks(): TransitionPackDefinition[] {
  return [...TRANSITION_PACK_REGISTRY];
}

export function getAnimationPacks(): AnimationPackDefinition[] {
  return [...ANIMATION_PACK_REGISTRY];
}

export function findIconPack(id?: string): IconPackDefinition {
  return ICON_PACK_REGISTRY.find((p) => p.id === id) || ICON_PACK_REGISTRY[0];
}

export function findComponentPack(id?: string): ComponentPackDefinition {
  return COMPONENT_PACK_REGISTRY.find((p) => p.id === id) || COMPONENT_PACK_REGISTRY[0];
}

export function findTransitionPack(id?: string): TransitionPackDefinition {
  return TRANSITION_PACK_REGISTRY.find((p) => p.id === id || p.transitionId === id) || TRANSITION_PACK_REGISTRY[0];
}

export function findAnimationPack(id?: string): AnimationPackDefinition {
  return ANIMATION_PACK_REGISTRY.find((p) => p.id === id || p.animationId === id) || ANIMATION_PACK_REGISTRY[0];
}

export function creativePackCounts() {
  return {
    icons: ICON_PACK_REGISTRY.length,
    components: COMPONENT_PACK_REGISTRY.length,
    transitions: TRANSITION_PACK_REGISTRY.length,
    animations: ANIMATION_PACK_REGISTRY.length,
    total:
      ICON_PACK_REGISTRY.length +
      COMPONENT_PACK_REGISTRY.length +
      TRANSITION_PACK_REGISTRY.length +
      ANIMATION_PACK_REGISTRY.length,
  };
}

export function registerCreativePackFromRow(row: CreativePackRowLike | Record<string, any>): boolean {
  if (!row) return false;
  const id = `db-${row.id ?? Date.now()}`;
  const target = String(row.target_type || '');
  const content = String(row.content_text || '');
  const name = String(row.subtext || 'Trained Pack');

  if (target === 'icon_pack') {
    const icon = { ...parseSvgIcon(content, name), id };
    const idx = ICON_PACK_REGISTRY.findIndex((i) => i.id === id);
    if (idx >= 0) ICON_PACK_REGISTRY[idx] = icon;
    else ICON_PACK_REGISTRY.push(icon);
    return true;
  }
  if (target === 'component_pack') {
    const comp = { ...parseComponentCode(content, name), id };
    const idx = COMPONENT_PACK_REGISTRY.findIndex((c) => c.id === id);
    if (idx >= 0) COMPONENT_PACK_REGISTRY[idx] = comp;
    else COMPONENT_PACK_REGISTRY.push(comp);
    return true;
  }
  if (target === 'transition_pack') {
    const tr = { ...parseTransitionCode(content, name), id };
    const idx = TRANSITION_PACK_REGISTRY.findIndex((t) => t.id === id);
    if (idx >= 0) TRANSITION_PACK_REGISTRY[idx] = tr;
    else TRANSITION_PACK_REGISTRY.push(tr);
    return true;
  }
  if (target === 'animation_pack') {
    const an = { ...parseAnimationCode(content, name), id };
    const idx = ANIMATION_PACK_REGISTRY.findIndex((a) => a.id === id);
    if (idx >= 0) ANIMATION_PACK_REGISTRY[idx] = an;
    else ANIMATION_PACK_REGISTRY.push(an);
    return true;
  }
  return false;
}

export function removeCreativePackFromRegistry(id: string): void {
  const cleanId = id.startsWith('db-') ? id : `db-${id}`;
  const removeById = <T extends { id: string }>(arr: T[]) => {
    const idx = arr.findIndex((item) => item.id === id || item.id === cleanId);
    if (idx >= 0) arr.splice(idx, 1);
  };
  removeById(ICON_PACK_REGISTRY);
  removeById(COMPONENT_PACK_REGISTRY);
  removeById(TRANSITION_PACK_REGISTRY);
  removeById(ANIMATION_PACK_REGISTRY);
}

export function componentPackPreviewStyle(
  pack?: ComponentPackDefinition,
  accentColor = '#38BDF8'
): React.CSSProperties {
  const st = pack?.style || COMPONENT_PACK_REGISTRY[0].style;
  return {
    borderRadius: `${st.borderRadius}px`,
    borderWidth: `${st.borderWidth}px`,
    borderStyle: 'solid',
    borderColor: st.borderColor || `${accentColor}66`,
    backdropFilter: st.glassBlur > 0 ? `blur(${st.glassBlur}px)` : undefined,
    backgroundColor: st.background || 'rgba(13, 17, 39, 0.82)',
    boxShadow: `0 14px 34px rgba(0, 0, 0, ${st.shadowIntensity})`,
  };
}
