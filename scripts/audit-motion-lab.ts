/**
 * Audit bank resep Motion Lab.
 *
 *   npx tsx scripts/audit-motion-lab.ts
 *
 * Memastikan setiap resep lolos parser pack yang sama dengan admin, sehingga
 * tombol "Simpan ke training" tidak mungkin mengirim kode yang ditolak.
 */
import { MOTION_RECIPES, motionSource } from '../lib/motion-lab';
import { parseAnimationCode } from '../lib/studio/packs/animations';
import { parseTransitionCode } from '../lib/studio/packs/transitions';

let failed = 0;
const bySource = new Map<string, number>();
const byCategory = new Map<string, number>();

for (const recipe of MOTION_RECIPES) {
  const raw = JSON.stringify(recipe.code);
  const parsed =
    recipe.trainingType === 'animation_pack'
      ? parseAnimationCode(raw, recipe.name)
      : parseTransitionCode(raw, recipe.name);
  bySource.set(recipe.source, (bySource.get(recipe.source) || 0) + 1);
  byCategory.set(recipe.category, (byCategory.get(recipe.category) || 0) + 1);
  if (!parsed.ok) {
    failed++;
    console.error(`✗ ${recipe.id} (${recipe.trainingType}): ${parsed.error}`);
  }
}

console.log(`Motion Lab: ${MOTION_RECIPES.length - failed}/${MOTION_RECIPES.length} resep valid.`);
console.log('Per aplikasi:', Object.fromEntries([...bySource].map(([id, n]) => [motionSource(id as never).name, n])));
console.log('Per kategori:', Object.fromEntries(byCategory));
if (failed) process.exit(1);
