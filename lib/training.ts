import { createClient } from '@/lib/supabase/client';
import {
  addCustomCtaToEngine,
  addCustomHookToEngine,
  addCustomImageAssetToEngine,
  addCustomSceneToEngine,
  addKeywordRuleToEngine,
  addTrainedVideoPresetToEngine,
  CategoryType,
  MotionTelemetryProfile,
} from '@/lib/smart-engine';

export type TrainingType =
  | 'video_motion'
  | 'ui_blueprint'
  | 'hook'
  | 'scene2'
  | 'scene3'
  | 'cta'
  | 'image_asset'
  | 'keyword_rule';

export type TrainingCategory = CategoryType | 'saas' | 'all';

export interface TrainingRow {
  id: string;
  type: TrainingType;
  category: TrainingCategory;
  content_text: string;
  subtext: string | null;
  emoji: string | null;
  image_url: string | null;
  video_url?: string | null;
  creator_handle?: string | null;
  motion_profile?: MotionTelemetryProfile | null;
  metadata_json: Record<string, unknown> | null;
  created_at?: string;
  user_id?: string | null;
}

const appliedIds = new Set<string>();
let inflight: Promise<number> | null = null;

function categoriesOf(cat: TrainingCategory): CategoryType[] {
  if (cat === 'quote' || cat === 'promo' || cat === 'edukasi') {
    return [cat];
  }
  if (cat === 'saas') {
    return ['edukasi', 'promo'];
  }
  return ['quote', 'promo', 'edukasi'];
}

function splitList(val: string): string[] {
  return val
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Ekstraksi otomatis telemetri motion graphic dari URL video referensi kreator
 * (TikTok / Reels / Shorts / MP4) untuk melatih mesin template secara dinamis.
 */
export function analyzeCreatorVideoReference(
  videoUrl: string,
  title: string,
  creatorHandle = '@depup.web'
): MotionTelemetryProfile {
  const lower = `${videoUrl} ${title} ${creatorHandle}`.toLowerCase();
  const isDepupStyle =
    lower.includes('depup') ||
    lower.includes('7697972111469546753') ||
    lower.includes('deploy') ||
    lower.includes('saas') ||
    lower.includes('step') ||
    lower.includes('tutorial');

  if (isDepupStyle) {
    return {
      presetId: 'depup-workflow',
      creatorHandle: creatorHandle || '@depup.web',
      sourceUrl: videoUrl,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cameraMotion: 'spring-slide-vertical',
      bpm: 118,
      paletteId: 'depup-lavender',
      widgetSequence: ['repo_input_card', 'repo_scanner_card', 'terminal_build_card'],
      stepBadges: ['1 Tempel', '2 Periksa', '3 Deploy'],
      cardRadius: 24,
      glassBlur: 18,
      staggerMs: 85,
    };
  }

  if (lower.includes('bento') || lower.includes('apple') || lower.includes('linear')) {
    return {
      presetId: 'kinetic-bento',
      creatorHandle,
      sourceUrl: videoUrl,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      cameraMotion: 'perspective-tilt-3d',
      bpm: 124,
      paletteId: 'midnight-indigo',
      widgetSequence: ['bento_metrics_grid', 'feature_spotlight_card', 'cta_dock_card'],
      stepBadges: ['01 Overview', '02 Metrics', '03 Launch'],
      cardRadius: 20,
      glassBlur: 24,
      staggerMs: 75,
    };
  }

  return {
    presetId: 'capcut-kinetic-split',
    creatorHandle,
    sourceUrl: videoUrl,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    cameraMotion: 'whip-zoom-spring',
    bpm: 128,
    paletteId: 'cyber-sunset',
    widgetSequence: ['kinetic_hook_card', 'repo_scanner_card', 'terminal_build_card'],
    stepBadges: ['1 Mulai', '2 Proses', '3 Hasil'],
    cardRadius: 22,
    glassBlur: 16,
    staggerMs: 80,
  };
}

export function applyTrainingRow(row: TrainingRow): boolean {
  if (appliedIds.has(row.id)) return false;
  appliedIds.add(row.id);

  const cats = categoriesOf(row.category);

  switch (row.type) {
    case 'video_motion':
    case 'ui_blueprint': {
      const profile =
        row.motion_profile ||
        (row.metadata_json?.motion_profile as MotionTelemetryProfile | undefined) ||
        analyzeCreatorVideoReference(
          row.video_url || row.image_url || '',
          row.content_text,
          row.creator_handle || '@depup.web'
        );
      addTrainedVideoPresetToEngine({
        id: row.id,
        title: row.content_text,
        description: row.subtext || 'Trained Creator Motion Graphic Preset',
        category: row.category,
        videoUrl: row.video_url || row.image_url || '',
        creatorHandle: row.creator_handle || profile.creatorHandle || '@depup.web',
        profile,
      });
      cats.forEach((c) => addCustomHookToEngine(c, row.content_text));
      return true;
    }
    case 'hook':
      cats.forEach((c) => addCustomHookToEngine(c, row.content_text));
      return true;
    case 'scene2':
    case 'scene3':
      cats.forEach((c) =>
        addCustomSceneToEngine(c, row.type as 'scene2' | 'scene3', {
          text: row.content_text,
          subtext: row.subtext || '',
          emoji: row.emoji || '✨',
        })
      );
      return true;
    case 'cta':
      addCustomCtaToEngine(row.content_text);
      return true;
    case 'image_asset':
      if (!row.image_url) return false;
      addCustomImageAssetToEngine({
        id: `trained-${row.id}`,
        title: row.content_text || 'Gambar Training',
        category: cats[0],
        url: row.image_url,
      });
      return true;
    case 'keyword_rule':
      return addKeywordRuleToEngine(
        splitList(row.content_text),
        splitList(row.subtext || '')
      );
    default:
      return false;
  }
}

export async function fetchTrainingRows(): Promise<TrainingRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_training_data')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as TrainingRow[];
}

export function loadTrainingIntoEngine(): Promise<number> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const rows = await fetchTrainingRows();
      let count = 0;
      [...rows].reverse().forEach((r) => {
        if (applyTrainingRow(r)) count++;
      });
      return count;
    } catch {
      return 0;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function forgetTrainingRow(id: string) {
  appliedIds.delete(id);
}
