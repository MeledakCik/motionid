import { createClient } from '@/lib/supabase/client';
import {
  addCustomCtaToEngine,
  addCustomHookToEngine,
  addCustomImageAssetToEngine,
  addCustomSceneToEngine,
  addKeywordRuleToEngine,
  CategoryType,
} from '@/lib/smart-engine';

export type TrainingType =
  | 'hook'
  | 'scene2'
  | 'scene3'
  | 'cta'
  | 'image_asset'
  | 'keyword_rule';

export type TrainingCategory = CategoryType | 'all';

export interface TrainingRow {
  id: string;
  type: TrainingType;
  category: TrainingCategory;
  content_text: string;
  subtext: string | null;
  emoji: string | null;
  image_url: string | null;
  metadata_json: Record<string, unknown> | null;
  created_by_email: string;
  created_at: string;
}

const ALL_CATEGORIES: CategoryType[] = ['promo', 'quote', 'edukasi'];

// id baris yang sudah diterapkan, supaya tidak dobel saat halaman dibuka ulang
const appliedIds = new Set<string>();
let inflight: Promise<number> | null = null;

function categoriesOf(cat: TrainingCategory): CategoryType[] {
  return cat === 'all' ? ALL_CATEGORIES : [cat];
}

function splitList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Terapkan satu baris training ke Smart Engine (idempotent). */
export function applyTrainingRow(row: TrainingRow): boolean {
  if (appliedIds.has(row.id)) return false;
  appliedIds.add(row.id);

  const cats = categoriesOf(row.category);

  switch (row.type) {
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

/**
 * Muat seluruh data training dari Supabase lalu suntikkan ke engine.
 * Aman dipanggil berkali-kali; gagal diam-diam jika Supabase belum siap.
 */
export function loadTrainingIntoEngine(): Promise<number> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const rows = await fetchTrainingRows();
      // urut lama -> baru agar yang terbaru berada paling depan (unshift)
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

/** Dipakai admin setelah menghapus baris: engine dimuat ulang saat reload halaman. */
export function forgetTrainingRow(id: string) {
  appliedIds.delete(id);
}
