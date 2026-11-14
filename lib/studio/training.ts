import { createClient } from '@/lib/supabase/client';
import { parseSvgMarkup, registerIcon, unregisterIcon } from './packs/icons';
import { parseComponentCode, registerComponent, unregisterComponent } from './packs/components';
import { parseTransitionCode, registerTransition, unregisterTransition } from './packs/transitions';
import { parseAnimationCode, registerAnimation, unregisterAnimation } from './packs/animations';
import { registerCta, registerHook, registerQuote } from './prompt';

/**
 * Menyuntikkan hasil training admin (tabel ai_training_data) ke registry pack.
 * Semua kode admin berupa JSON/SVG deklaratif — tidak ada eval/JS yang dijalankan.
 */

export type PackType = 'icon_pack' | 'component_pack' | 'transition_pack' | 'animation_pack';

export interface TrainingRow {
  id: string;
  type: string;
  category: string;
  content_text: string;
  subtext: string | null;
  emoji?: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at?: string;
}

export const packId = (row: Pick<TrainingRow, 'id'>, type: string) => `adm-${type.replace('_pack', '')}-${row.id}`;

const applied = new Set<string>();

export function applyRow(row: TrainingRow): { ok: boolean; error?: string } {
  const name = row.subtext || 'Custom';
  const tags = Array.isArray(row.metadata_json?.tags) ? (row.metadata_json!.tags as string[]) : [];
  switch (row.type) {
    case 'icon_pack': {
      const r = parseSvgMarkup(row.content_text);
      if (!r.ok) return { ok: false, error: r.error };
      registerIcon({ id: packId(row, row.type), name, group: 'custom', tags: ['custom', ...tags, ...name.toLowerCase().split(/\s+/)], viewBox: r.viewBox, parts: r.parts, author: 'admin' });
      return { ok: true };
    }
    case 'component_pack': {
      const r = parseComponentCode(row.content_text, name);
      if (!r.ok || !r.def) return { ok: false, error: r.error };
      registerComponent({ ...r.def, id: packId(row, row.type), name, tags: [...r.def.tags, ...tags] });
      return { ok: true };
    }
    case 'transition_pack': {
      const r = parseTransitionCode(row.content_text, name);
      if (!r.ok || !r.spec) return { ok: false, error: r.error };
      registerTransition({ ...r.spec, id: packId(row, row.type), name, tags: [...r.spec.tags, ...tags] });
      return { ok: true };
    }
    case 'animation_pack': {
      const r = parseAnimationCode(row.content_text, name);
      if (!r.ok || !r.spec) return { ok: false, error: r.error };
      registerAnimation({ ...r.spec, id: packId(row, row.type), name, tags: [...r.spec.tags, ...tags] });
      return { ok: true };
    }
    case 'hook':
      registerHook(row.category, row.content_text);
      return { ok: true };
    case 'cta':
      registerCta(row.category, row.content_text);
      return { ok: true };
    case 'scene2':
    case 'scene3':
      if (row.category === 'quote') registerQuote(row.content_text);
      return { ok: true };
    default:
      return { ok: false, error: 'tipe tidak dipakai studio v6' };
  }
}

export function removeRow(row: Pick<TrainingRow, 'id' | 'type'>) {
  const id = packId(row, row.type);
  applied.delete(row.id);
  if (row.type === 'icon_pack') unregisterIcon(id);
  if (row.type === 'component_pack') unregisterComponent(id);
  if (row.type === 'transition_pack') unregisterTransition(id);
  if (row.type === 'animation_pack') unregisterAnimation(id);
}

let inflight: Promise<number> | null = null;

/** Ambil & daftarkan semua data training (sekali per sesi). */
export function loadTraining(force = false): Promise<number> {
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_training_data')
        .select('id,type,category,content_text,subtext,metadata_json,created_at')
        .in('type', ['icon_pack', 'component_pack', 'transition_pack', 'animation_pack', 'hook', 'cta', 'scene2', 'scene3'])
        .order('created_at', { ascending: true })
        .limit(2000);
      if (error || !data) return 0;
      let n = 0;
      for (const row of data as TrainingRow[]) {
        if (applied.has(row.id) && !force) continue;
        if (applyRow(row).ok) {
          applied.add(row.id);
          n++;
        }
      }
      return n;
    } catch {
      return 0;
    }
  })();
  return inflight;
}
