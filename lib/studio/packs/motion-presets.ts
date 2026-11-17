import { motionSource, MOTION_RECIPES, type MotionRecipe } from '@/lib/motion-lab';
import {
  ANIM_GROUPS,
  parseAnimationCode,
  registerAnimation,
  unregisterAnimation,
  type AnimSpec,
} from './animations';
import {
  parseTransitionCode,
  registerTransition,
  unregisterTransition,
  type TransitionKind,
} from './transitions';

/**
 * Resep Motion Lab yang dipasang sebagai preset bawaan studio.
 *
 * Semua resep berasal dari `lib/motion-lab.ts` (data murni) lalu divalidasi oleh
 * parser pack yang sama dengan input admin. Jadi tidak ada kode asing yang
 * dijalankan — hanya spec deklaratif.
 */

const ANIM_GROUP_LABEL: Record<string, string> = {
  motion: 'Motion Graphics',
  kinetik: 'Kinetic Type',
  '3d': '3D & Depth',
  ui: 'UI Motion',
};

const TRANSITION_3D: TransitionKind[] = ['flip', 'cube', 'spin', 'carousel', 'tilt', 'pagecurl'];

function animGroup(recipe: MotionRecipe): string {
  if (recipe.category === 'kinetic') return 'kinetik';
  if (recipe.category === '3d') return '3d';
  if (recipe.category === 'ui') return 'ui';
  return 'motion';
}

function transitionGroup(recipe: MotionRecipe): string {
  const kind = String(recipe.code.kind || '');
  if (TRANSITION_3D.includes(kind as TransitionKind)) return '3d';
  if (kind === 'fade' || kind === 'cut') return 'dasar';
  if (kind === 'slide' || kind === 'push' || kind === 'card') return 'geser';
  if (kind === 'zoom') return 'zoom';
  if (kind === 'whip' || kind === 'lens' || kind === 'filmroll') return 'efek';
  return 'efek';
}

const STYLE_TAGS: Record<string, string[]> = {
  capcut: ['capcut', 'short-form', 'beat'],
  illustrator: ['illustrator', 'vektor', 'grafis'],
  figma: ['figma', 'ui', 'prototype'],
  alight: ['alight-motion', 'mobile', 'keyframe'],
  premiere: ['premiere', 'editing', 'broadcast'],
  aftereffects: ['after-effects', 'kinetic', 'komposit'],
};

const installed = new Set<string>();
let done = false;

/** Idempotent: aman dipanggil dari beberapa modul. */
export function installMotionPresets(): number {
  if (done) return installed.size;
  done = true;
  if (!ANIM_GROUPS.some((g) => g.id === 'motion')) {
    const extra = Object.entries(ANIM_GROUP_LABEL).map(([id, label]) => ({ id, label }));
    ANIM_GROUPS.splice(ANIM_GROUPS.length - 1, 0, ...extra);
  }
  for (const recipe of MOTION_RECIPES) {
    const id = `lab-${recipe.id}`;
    const source = motionSource(recipe.source);
    const tags = [...recipe.tags, ...(STYLE_TAGS[recipe.source] || []), source.short.toLowerCase(), 'motion-lab'];
    try {
      if (recipe.trainingType === 'animation_pack') {
        const parsed = parseAnimationCode(JSON.stringify(recipe.code), recipe.name);
        if (!parsed.ok || !parsed.spec) continue;
        const spec: AnimSpec = {
          ...parsed.spec,
          id,
          name: recipe.name,
          group: animGroup(recipe),
          tags,
          author: 'builtin',
        };
        registerAnimation(spec);
      } else {
        const parsed = parseTransitionCode(JSON.stringify(recipe.code), recipe.name);
        if (!parsed.ok || !parsed.spec) continue;
        registerTransition({
          ...parsed.spec,
          id,
          name: recipe.name,
          group: transitionGroup(recipe),
          tags,
          author: 'builtin',
        });
      }
      installed.add(id);
    } catch {
      // Satu resep rusak tidak boleh menghentikan seluruh preset.
    }
  }
  return installed.size;
}

/** Dipakai halaman admin untuk memasang/mencopot versi uji tanpa menyentuh Supabase. */
export function uninstallMotionPresets() {
  installed.forEach((id) => {
    unregisterAnimation(id);
    unregisterTransition(id);
  });
  installed.clear();
  done = false;
}

export const motionPresetCount = () => installed.size;
