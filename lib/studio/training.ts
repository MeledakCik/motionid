import { createClient } from '@/lib/supabase/client';
import { IconDef, parseSvgMarkup, registerIcon, unregisterIcon } from './packs/icons';
import { ComponentDef, parseComponentCode, registerComponent, unregisterComponent } from './packs/components';
import { parseTransitionCode, registerTransition, TransitionSpec, unregisterTransition } from './packs/transitions';
import { AnimSpec, parseAnimationCode, registerAnimation, unregisterAnimation } from './packs/animations';
import {
  registerCta, registerHook, registerQuote,
  unregisterCta, unregisterHook, unregisterQuote,
} from './prompt';
import { EffectSpec, parseEffectCode, registerEffect, unregisterEffect } from './packs/effects';

/**
 * Menyuntikkan hasil training admin (tabel ai_training_data) ke registry pack.
 * Mendukung input satuan maupun Batch JSON Array (`[...]`) / Bundle JSON multi-kategori.
 * Semua kode admin berupa JSON/SVG deklaratif — tidak ada eval/JS yang dijalankan.
 */

export type PackType = 'icon_pack' | 'component_pack' | 'transition_pack' | 'animation_pack' | 'effect_pack';
export type TrainingItemType = PackType | 'hook' | 'cta' | 'scene2' | 'scene3';

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

export interface ParsedTrainingItem {
  index: number;
  type: TrainingItemType;
  name: string;
  category: string;
  tags: string[];
  content_text: string;
  ok: boolean;
  error?: string;
  icon?: { parts: IconDef['parts']; viewBox: IconDef['viewBox'] };
  comp?: ComponentDef;
  tr?: TransitionSpec;
  anim?: AnimSpec;
  fx?: EffectSpec;
}

export interface BulkParseResult {
  ok: boolean;
  isBatch: boolean;
  items: ParsedTrainingItem[];
  validCount: number;
  errorSummary?: string;
}

export const packId = (row: Pick<TrainingRow, 'id'>, type: string) => `adm-${type.replace('_pack', '')}-${row.id}`;

const applied = new Set<string>();
type AppliedEntry = { type: TrainingItemType; id: string; category: string; content: string };
const appliedEntries = new Map<string, AppliedEntry[]>();

function unregisterEntry(entry: AppliedEntry) {
  if (entry.type === 'icon_pack') unregisterIcon(entry.id);
  else if (entry.type === 'component_pack') unregisterComponent(entry.id);
  else if (entry.type === 'transition_pack') unregisterTransition(entry.id);
  else if (entry.type === 'animation_pack') unregisterAnimation(entry.id);
  else if (entry.type === 'effect_pack') unregisterEffect(entry.id);
  else if (entry.type === 'hook') unregisterHook(entry.category, entry.content);
  else if (entry.type === 'cta') unregisterCta(entry.category, entry.content);
  else if (entry.type === 'scene2' || entry.type === 'scene3') {
    if (entry.category === 'quote') unregisterQuote(entry.content);
  }
}

function applySingleItem(
  id: string,
  type: string,
  name: string,
  category: string,
  content_text: string,
  tags: string[]
): { ok: boolean; error?: string } {
  switch (type) {
    case 'icon_pack': {
      const r = parseSvgMarkup(content_text);
      if (!r.ok) return { ok: false, error: r.error };
      registerIcon({
        id,
        name,
        group: 'custom',
        tags: ['custom', ...tags, ...name.toLowerCase().split(/\s+/)],
        viewBox: r.viewBox,
        parts: r.parts,
        author: 'admin',
      });
      return { ok: true };
    }
    case 'component_pack': {
      const r = parseComponentCode(content_text, name);
      if (!r.ok || !r.def) return { ok: false, error: r.error };
      registerComponent({ ...r.def, id, name, tags: [...r.def.tags, ...tags] });
      return { ok: true };
    }
    case 'transition_pack': {
      const r = parseTransitionCode(content_text, name);
      if (!r.ok || !r.spec) return { ok: false, error: r.error };
      registerTransition({ ...r.spec, id, name, tags: [...r.spec.tags, ...tags] });
      return { ok: true };
    }
    case 'animation_pack': {
      const r = parseAnimationCode(content_text, name);
      if (!r.ok || !r.spec) return { ok: false, error: r.error };
      registerAnimation({ ...r.spec, id, name, tags: [...r.spec.tags, ...tags] });
      return { ok: true };
    }
    case 'effect_pack': {
      const r = parseEffectCode(content_text, name);
      if (!r.ok || !r.spec) return { ok: false, error: r.error };
      registerEffect({ ...r.spec, id, name, tags: [...r.spec.tags, ...tags] });
      return { ok: true };
    }
    case 'hook':
      registerHook(category, content_text);
      return { ok: true };
    case 'cta':
      registerCta(category, content_text);
      return { ok: true };
    case 'scene2':
    case 'scene3':
      if (category === 'quote') registerQuote(content_text);
      return { ok: true };
    default:
      return { ok: false, error: 'tipe tidak dipakai studio v6' };
  }
}

export function applyRow(row: TrainingRow): { ok: boolean; error?: string } {
  // Replacing a row must remove every registration created by its previous value,
  // including children expanded from a JSON bundle.
  (appliedEntries.get(row.id) || []).forEach(unregisterEntry);
  appliedEntries.delete(row.id);
  applied.delete(row.id);
  const name = row.subtext || 'Custom';
  const tags = Array.isArray(row.metadata_json?.tags) ? (row.metadata_json!.tags as string[]) : [];
  const entries: AppliedEntry[] = [];
  const register = (id: string, type: TrainingItemType, category: string, content: string) => {
    const result = applySingleItem(id, type, name, category, content, tags);
    if (result.ok) entries.push({ id, type, category, content });
    return result;
  };
  const directId = packId(row, row.type);
  const direct = register(directId, row.type as TrainingItemType, row.category || 'all', row.content_text);
  if (direct.ok) {
    appliedEntries.set(row.id, entries);
    return direct;
  }

  // Fallback apabila content_text berisi JSON Array / Bundle yang disimpan langsung
  const bulk = parseBulkTrainingInput(row.content_text, (row.type as TrainingItemType) || 'component_pack', name, row.category || 'all', tags);
  if (bulk.validCount > 0) {
    bulk.items.forEach((item, idx) => {
      if (!item.ok) return;
      const subId = bulk.items.length === 1 ? packId(row, item.type) : `${packId(row, item.type)}-${idx}`;
      const result = applySingleItem(subId, item.type, item.name, item.category, item.content_text, item.tags);
      if (result.ok) entries.push({ id: subId, type: item.type, category: item.category, content: item.content_text });
    });
    appliedEntries.set(row.id, entries);
    return { ok: true };
  }
  return direct;
}

export function removeRow(row: Pick<TrainingRow, 'id' | 'type'>) {
  const entries = appliedEntries.get(row.id);
  if (entries) entries.forEach(unregisterEntry);
  else unregisterEntry({ id: packId(row, row.type), type: row.type as TrainingItemType, category: '', content: '' });
  appliedEntries.delete(row.id);
  applied.delete(row.id);
}

/** Deteksi otomatis tipe item JSON jika tidak disebutkan secara eksplisit */
function inferItemType(obj: Record<string, unknown>, fallback: TrainingItemType): TrainingItemType {
  if (typeof obj.type === 'string') {
    const t = obj.type.trim().toLowerCase();
    if (t === 'icon' || t === 'icon_pack' || t === 'svg') return 'icon_pack';
    if (t === 'component' || t === 'component_pack' || t === 'widget') return 'component_pack';
    if (t === 'transition' || t === 'transition_pack') return 'transition_pack';
    if (t === 'animation' || t === 'animation_pack' || t === 'anim') return 'animation_pack';
    if (t === 'effect' || t === 'effect_pack' || t === 'fx') return 'effect_pack';
    if (t === 'hook') return 'hook';
    if (t === 'cta') return 'cta';
    if (t === 'scene2' || t === 'quote') return 'scene2';
    if (t === 'scene3') return 'scene3';
  }
  if (
    typeof obj.svg === 'string' ||
    typeof obj.d === 'string' ||
    (typeof obj.content_text === 'string' && obj.content_text.trim().startsWith('<svg'))
  ) {
    return 'icon_pack';
  }
  if (Array.isArray(obj.layers) || typeof obj.base === 'string') {
    return 'component_pack';
  }
  if (Array.isArray(obj.keyframes) || obj.from || obj.loop || obj.text || obj.clip || obj.kind === 'in' || obj.kind === 'loop') {
    return 'animation_pack';
  }
  if (obj.outFrom || obj.outTo || obj.inFrom || obj.inTo || obj.params || obj.easing) {
    if (typeof obj.kind === 'string' && !['in', 'loop'].includes(obj.kind)) {
      return 'transition_pack';
    }
  }
  if (typeof obj.intensity === 'number' || typeof obj.motion === 'string' || typeof obj.style === 'string') {
    return 'effect_pack';
  }
  if (typeof obj.hook === 'string') return 'hook';
  if (typeof obj.cta === 'string') return 'cta';
  return fallback;
}

function normalizeTags(rawTags: unknown, fallbackTags: string[]): string[] {
  const fromItem = Array.isArray(rawTags)
    ? rawTags.map((x) => String(x).trim()).filter(Boolean)
    : typeof rawTags === 'string'
    ? rawTags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...fallbackTags, ...fromItem]));
}

function normalizeCategory(rawCat: unknown, fallbackCat: string): string {
  if (typeof rawCat === 'string' && ['all', 'promo', 'edukasi', 'quote'].includes(rawCat.trim().toLowerCase())) {
    return rawCat.trim().toLowerCase();
  }
  return fallbackCat || 'all';
}

function validateSingleItem(
  index: number,
  type: TrainingItemType,
  rawContent: string,
  name: string,
  category: string,
  tags: string[]
): ParsedTrainingItem {
  const cleanName = name.trim() || `Preset #${index + 1}`;
  const content = rawContent.trim();
  if (!content) {
    return { index, type, name: cleanName, category, tags, content_text: '', ok: false, error: 'Kode kosong.' };
  }
  switch (type) {
    case 'icon_pack': {
      const r = parseSvgMarkup(content);
      return r.ok
        ? { index, type, name: cleanName, category, tags, content_text: content, ok: true, icon: { parts: r.parts, viewBox: r.viewBox } }
        : { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: r.error };
    }
    case 'component_pack': {
      const r = parseComponentCode(content, cleanName);
      return r.ok && r.def
        ? { index, type, name: r.def.name || cleanName, category, tags, content_text: content, ok: true, comp: r.def }
        : { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: r.error };
    }
    case 'transition_pack': {
      const r = parseTransitionCode(content, cleanName);
      return r.ok && r.spec
        ? { index, type, name: r.spec.name || cleanName, category, tags, content_text: content, ok: true, tr: r.spec }
        : { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: r.error };
    }
    case 'animation_pack': {
      const r = parseAnimationCode(content, cleanName);
      return r.ok && r.spec
        ? { index, type, name: r.spec.name || cleanName, category, tags, content_text: content, ok: true, anim: r.spec }
        : { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: r.error };
    }
    case 'effect_pack': {
      const r = parseEffectCode(content, cleanName);
      return r.ok && r.spec
        ? { index, type, name: r.spec.name || cleanName, category, tags, content_text: content, ok: true, fx: r.spec }
        : { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: r.error };
    }
    case 'hook':
    case 'cta':
    case 'scene2':
    case 'scene3': {
      return { index, type, name: cleanName, category, tags, content_text: content, ok: true };
    }
    default:
      return { index, type, name: cleanName, category, tags, content_text: content, ok: false, error: `Tipe "${type}" tidak dikenali.` };
  }
}

/**
 * Mem-parse input kode baik berupa:
 * 1. Satu item standar (1 objek JSON, 1 SVG, atau 1 kalimat teks)
 * 2. Banyak tag <svg>...</svg> sekaligus
 * 3. Array JSON `[ { ... }, { ... } ]`
 * 4. Objek JSON berisi `{ "items": [...] }` atau `{ "presets": [...] }`
 * 5. Bundle JSON lengkap `{ "icons": [...], "components": [...], "transitions": [...], "animations": [...], "effects": [...], "hooks": [...], "ctas": [...] }`
 * 6. Beberapa objek JSON berurutan `{ ... } { ... }` (otomatis dibungkus menjadi array)
 */
export function parseBulkTrainingInput(
  raw: string,
  defaultType: TrainingItemType,
  defaultName = '',
  defaultCategory = 'all',
  defaultTags: string[] = []
): BulkParseResult {
  const src = raw.trim();
  if (!src) {
    return { ok: false, isBatch: false, items: [], validCount: 0, errorSummary: 'Kode masih kosong.' };
  }

  // 1. Jika bukan diawali '{' atau '['
  if (!src.startsWith('{') && !src.startsWith('[')) {
    if (defaultType === 'icon_pack') {
      const svgMatches = src.match(/<svg[\s\S]*?<\/svg>/gi);
      if (svgMatches && svgMatches.length > 1) {
        const items = svgMatches.map((svgStr, idx) => {
          const idMatch = svgStr.match(/(?:data-name|id|aria-label)=["']([^"']+)["']/i);
          const itemName = idMatch?.[1] || (defaultName ? `${defaultName} ${idx + 1}` : `Ikon #${idx + 1}`);
          return validateSingleItem(idx, 'icon_pack', svgStr, itemName, defaultCategory, defaultTags);
        });
        const validCount = items.filter((i) => i.ok).length;
        const firstErr = items.find((i) => !i.ok);
        return {
          ok: validCount === items.length && items.length > 0,
          isBatch: true,
          items,
          validCount,
          errorSummary: firstErr ? `Item #${firstErr.index + 1} (${firstErr.name}): ${firstErr.error}` : undefined,
        };
      }
      const single = validateSingleItem(0, 'icon_pack', src, defaultName || 'Ikon Custom', defaultCategory, defaultTags);
      return { ok: single.ok, isBatch: false, items: [single], validCount: single.ok ? 1 : 0, errorSummary: single.error };
    }

    if (defaultType === 'hook' || defaultType === 'cta') {
      const lines = src
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 1) {
        const items = lines.map((line, idx) =>
          validateSingleItem(idx, defaultType, line, `${defaultType.toUpperCase()} #${idx + 1}`, defaultCategory, defaultTags)
        );
        return { ok: true, isBatch: true, items, validCount: items.length };
      }
      const single = validateSingleItem(0, defaultType, src, defaultName || defaultType.toUpperCase(), defaultCategory, defaultTags);
      return { ok: single.ok, isBatch: false, items: [single], validCount: single.ok ? 1 : 0, errorSummary: single.error };
    }

    const single = validateSingleItem(0, defaultType, src, defaultName || 'Custom', defaultCategory, defaultTags);
    return { ok: single.ok, isBatch: false, items: [single], validCount: single.ok ? 1 : 0, errorSummary: single.error };
  }

  // 2. Parse JSON (dengan auto-recovery jika beberapa objek `{...} {...}` ditempel berurutan)
  let parsed: unknown;
  try {
    parsed = JSON.parse(src);
  } catch (firstErr) {
    const stitched = `[${src.replace(/\}\s*\{/g, '},{')}]`;
    try {
      parsed = JSON.parse(stitched);
    } catch {
      return {
        ok: false,
        isBatch: false,
        items: [],
        validCount: 0,
        errorSummary: `JSON tidak valid: ${(firstErr as Error).message}`,
      };
    }
  }

  const rawList: Array<{ rawItem: unknown; forcedType?: TrainingItemType }> = [];

  if (Array.isArray(parsed)) {
    parsed.forEach((item) => rawList.push({ rawItem: item }));
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const bundleKeys: Array<[string, TrainingItemType]> = [
      ['icons', 'icon_pack'],
      ['icon_pack', 'icon_pack'],
      ['components', 'component_pack'],
      ['component_pack', 'component_pack'],
      ['widgets', 'component_pack'],
      ['transitions', 'transition_pack'],
      ['transition_pack', 'transition_pack'],
      ['animations', 'animation_pack'],
      ['animation_pack', 'animation_pack'],
      ['effects', 'effect_pack'],
      ['effect_pack', 'effect_pack'],
      ['hooks', 'hook'],
      ['ctas', 'cta'],
    ];

    let foundBundleArray = false;
    for (const [key, mappedType] of bundleKeys) {
      if (Array.isArray(obj[key])) {
        foundBundleArray = true;
        (obj[key] as unknown[]).forEach((item) => rawList.push({ rawItem: item, forcedType: mappedType }));
      }
    }

    if (!foundBundleArray) {
      const genericArrayKey = ['items', 'presets', 'data', 'packs', 'training'].find((k) => Array.isArray(obj[k]));
      if (genericArrayKey) {
        (obj[genericArrayKey] as unknown[]).forEach((item) => rawList.push({ rawItem: item }));
      } else {
        rawList.push({ rawItem: obj });
      }
    }
  }

  if (!rawList.length) {
    return { ok: false, isBatch: false, items: [], validCount: 0, errorSummary: 'JSON tidak berisi item training.' };
  }

  const isBatch = rawList.length > 1;
  const items: ParsedTrainingItem[] = rawList.map(({ rawItem, forcedType }, idx) => {
    if (typeof rawItem === 'string') {
      const itemType = forcedType || defaultType;
      const itemName = defaultName ? (isBatch ? `${defaultName} ${idx + 1}` : defaultName) : `${itemType} #${idx + 1}`;
      return validateSingleItem(idx, itemType, rawItem, itemName, defaultCategory, defaultTags);
    }

    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return {
        index: idx,
        type: forcedType || defaultType,
        name: `Item #${idx + 1}`,
        category: defaultCategory,
        tags: defaultTags,
        content_text: '',
        ok: false,
        error: 'Elemen harus berupa objek JSON.',
      };
    }

    const itemObj = rawItem as Record<string, unknown>;
    const itemType = forcedType || inferItemType(itemObj, defaultType);
    const itemCategory = normalizeCategory(itemObj.category, defaultCategory);
    const itemTags = normalizeTags(
      itemObj.tags ?? (itemObj.metadata_json as Record<string, unknown> | undefined)?.tags,
      defaultTags
    );

    // Jika baris hasil export Supabase langsung di-import kembali (`content_text` + `subtext`)
    if (typeof itemObj.content_text === 'string' && !itemObj.layers && !itemObj.keyframes) {
      const itemName = String(
        itemObj.subtext || itemObj.name || (defaultName ? (isBatch ? `${defaultName} ${idx + 1}` : defaultName) : `Preset #${idx + 1}`)
      );
      return validateSingleItem(idx, itemType, itemObj.content_text, itemName, itemCategory, itemTags);
    }

    if (itemType === 'icon_pack') {
      const svgContent =
        typeof itemObj.svg === 'string'
          ? itemObj.svg
          : typeof itemObj.d === 'string'
          ? itemObj.d
          : typeof itemObj.code === 'string'
          ? itemObj.code
          : '';
      const itemName = String(
        itemObj.name || itemObj.id || (defaultName ? (isBatch ? `${defaultName} ${idx + 1}` : defaultName) : `Ikon #${idx + 1}`)
      );
      return validateSingleItem(idx, 'icon_pack', svgContent, itemName, itemCategory, itemTags);
    }

    if (itemType === 'hook' || itemType === 'cta' || itemType === 'scene2' || itemType === 'scene3') {
      const textContent = String(itemObj.text || itemObj.hook || itemObj.cta || itemObj.quote || itemObj.content || '');
      const itemName = String(itemObj.name || `${itemType.toUpperCase()} #${idx + 1}`);
      return validateSingleItem(idx, itemType, textContent, itemName, itemCategory, itemTags);
    }

    // Untuk component_pack, transition_pack, animation_pack, effect_pack
    const extractedName = String(
      itemObj.name ||
        itemObj.subtext ||
        (defaultName ? (isBatch ? `${defaultName} ${idx + 1}` : defaultName) : `Preset #${idx + 1}`)
    );
    const cleanJsonObj = { ...itemObj, name: extractedName };
    const serialized = JSON.stringify(cleanJsonObj, null, 2);
    return validateSingleItem(idx, itemType, serialized, extractedName, itemCategory, itemTags);
  });

  const validCount = items.filter((i) => i.ok).length;
  const firstErr = items.find((i) => !i.ok);
  return {
    ok: validCount === items.length && items.length > 0,
    isBatch,
    items,
    validCount,
    errorSummary: firstErr
      ? isBatch
        ? `Item #${firstErr.index + 1} ("${firstErr.name}"): ${firstErr.error}`
        : firstErr.error
      : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Impor file JSON / SVG massal                                                */
/* -------------------------------------------------------------------------- */

export type TrainingBucketKey =
  | 'icons'
  | 'components'
  | 'transitions'
  | 'animations'
  | 'effects'
  | 'hooks'
  | 'ctas';

export interface TrainingUploadFile {
  name: string;
  text: string;
}

export interface MergedTrainingUpload {
  /** JSON siap tempel ke textarea (array tunggal atau bundle multi-kategori). */
  code: string;
  itemCount: number;
  bucketCounts: Partial<Record<TrainingBucketKey, number>>;
  /** File yang diawali `{`/`[` tetapi JSON-nya tidak bisa dibaca. */
  failedFiles: string[];
}

const BUCKET_KEYS: TrainingBucketKey[] = [
  'icons',
  'components',
  'transitions',
  'animations',
  'effects',
  'hooks',
  'ctas',
];

/** Alias key bundle yang diterima, termasuk nama tipe database (`*_pack`). */
const BUCKET_ALIASES: Record<string, TrainingBucketKey> = {
  icons: 'icons',
  icon_pack: 'icons',
  components: 'components',
  component_pack: 'components',
  widgets: 'components',
  transitions: 'transitions',
  transition_pack: 'transitions',
  animations: 'animations',
  animation_pack: 'animations',
  effects: 'effects',
  effect_pack: 'effects',
  hooks: 'hooks',
  ctas: 'ctas',
};

function bucketForType(type: TrainingItemType): TrainingBucketKey {
  switch (type) {
    case 'icon_pack':
      return 'icons';
    case 'component_pack':
      return 'components';
    case 'transition_pack':
      return 'transitions';
    case 'animation_pack':
      return 'animations';
    case 'effect_pack':
      return 'effects';
    case 'cta':
      return 'ctas';
    default:
      return 'hooks';
  }
}

function typeForBucket(bucket: TrainingBucketKey): TrainingItemType {
  switch (bucket) {
    case 'icons':
      return 'icon_pack';
    case 'components':
      return 'component_pack';
    case 'transitions':
      return 'transition_pack';
    case 'animations':
      return 'animation_pack';
    case 'effects':
      return 'effect_pack';
    case 'ctas':
      return 'cta';
    default:
      return 'hook';
  }
}

function bucketForItem(item: unknown, fallback: TrainingBucketKey): TrainingBucketKey {
  if (typeof item === 'string') {
    return /<svg[\s\S]*<\/svg>/i.test(item) ? 'icons' : fallback;
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) return fallback;
  const inferred = inferItemType(item as Record<string, unknown>, typeForBucket(fallback));
  return bucketForType(inferred);
}

function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(`[${text.replace(/\}\s*\{/g, '},{')}]`);
    } catch {
      return undefined;
    }
  }
}

function fileBaseName(name: string): string {
  return String(name || 'item')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'item';
}

function svgName(svg: string): string {
  const match = svg.match(/(?:data-name|aria-label|id)=["']([^"']+)["']/i);
  return match?.[1] || '';
}

/**
 * Menggabungkan banyak file upload (JSON array, bundle JSON, file SVG, atau
 * daftar teks) menjadi satu JSON siap parse. Semua item dikelompokkan ke
 * kategori yang sesuai supaya bisa disimpan sekaligus.
 */
export function mergeTrainingUploads(
  files: TrainingUploadFile[],
  fallbackType: TrainingItemType
): MergedTrainingUpload {
  const buckets: Record<TrainingBucketKey, unknown[]> = {
    icons: [],
    components: [],
    transitions: [],
    animations: [],
    effects: [],
    hooks: [],
    ctas: [],
  };
  const fallback = bucketForType(fallbackType);
  const failedFiles: string[] = [];
  let itemCount = 0;

  const push = (bucket: TrainingBucketKey, item: unknown) => {
    buckets[bucket].push(item);
    itemCount++;
  };

  const absorb = (parsed: unknown) => {
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => push(bucketForItem(item, fallback), item));
      return;
    }
    if (!parsed || typeof parsed !== 'object') return;
    const obj = parsed as Record<string, unknown>;

    let hasBundleKey = false;
    for (const [rawKey, bucket] of Object.entries(BUCKET_ALIASES)) {
      if (!Array.isArray(obj[rawKey])) continue;
      hasBundleKey = true;
      (obj[rawKey] as unknown[]).forEach((item) => push(bucket, item));
    }
    if (hasBundleKey) return;

    const genericKey = ['items', 'presets', 'data', 'packs', 'training'].find((key) =>
      Array.isArray(obj[key])
    );
    if (genericKey) {
      (obj[genericKey] as unknown[]).forEach((item) => push(bucketForItem(item, fallback), item));
      return;
    }

    push(bucketForItem(obj, fallback), obj);
  };

  for (const file of files) {
    const text = String(file.text || '').trim();
    if (!text) continue;

    let handled = false;
    if (text.startsWith('{') || text.startsWith('[')) {
      const parsed = parseJsonLoose(text);
      if (parsed !== undefined) {
        absorb(parsed);
        handled = true;
      } else {
        failedFiles.push(file.name);
      }
    }
    if (handled) continue;

    const svgMatches = text.match(/<svg[\s\S]*?<\/svg>/gi);
    if (svgMatches?.length) {
      const base = fileBaseName(file.name);
      svgMatches.forEach((svg, index) => {
        const name = svgName(svg) || (svgMatches.length > 1 ? `${base} ${index + 1}` : base);
        push('icons', { name, svg });
      });
      continue;
    }

    if (fallbackType === 'hook' || fallbackType === 'cta') {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      lines.forEach((line) => push(fallback, line));
      continue;
    }

    // Teks mentah pada tab pack tetap dibawa apa adanya supaya error
    // validasinya terlihat jelas di preview.
    push(fallback, text);
  }

  const usedKeys = BUCKET_KEYS.filter((key) => buckets[key].length > 0);
  const bucketCounts: Partial<Record<TrainingBucketKey, number>> = {};
  usedKeys.forEach((key) => {
    bucketCounts[key] = buckets[key].length;
  });

  let code = '';
  if (usedKeys.length === 1) {
    code = JSON.stringify(buckets[usedKeys[0]], null, 2);
  } else if (usedKeys.length > 1) {
    code = JSON.stringify(
      Object.fromEntries(usedKeys.map((key) => [key, buckets[key]])),
      null,
      2
    );
  }

  return { code, itemCount, bucketCounts, failedFiles };
}

let inflight: Promise<number> | null = null;

/** Ambil & daftarkan semua data training (sekali per sesi). */
export function loadTraining(force = false): Promise<number> {
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const supabase = createClient();
      const pageSize = 500;
      let n = 0;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('ai_training_data')
          .select('id,type,category,content_text,subtext,metadata_json,created_at')
          .in('type', ['icon_pack', 'component_pack', 'transition_pack', 'animation_pack', 'effect_pack', 'hook', 'cta', 'scene2', 'scene3'])
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error || !data) return n;
        const page = data as TrainingRow[];
        for (const row of page) {
          if (applied.has(row.id) && !force) continue;
          if (applyRow(row).ok) {
            applied.add(row.id);
            n++;
          }
        }
        if (page.length < pageSize) break;
      }
      return n;
    } catch {
      return 0;
    }
  })();
  return inflight;
}
