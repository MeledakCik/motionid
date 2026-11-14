'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { analyzePrompt, INTENT_LABELS } from '@/lib/studio/prompt';
import { rankTemplates } from '@/lib/studio/packs/templates';
import { TemplateThumb } from '@/components/studio/Thumbs';
import { LazyVisible } from '@/components/studio/ui';

export const EXAMPLE_PROMPTS = [
  'Promo seblak level 5 cuma 10rb, gratis ongkir',
  '5 tips hemat buat anak kos biar uang cukup sampai akhir bulan',
  'Kata-kata galau buat yang lagi kangen saat hujan',
  'Lowongan barista di Kopi Kita, kirim CV sekarang',
  'Flash sale sneakers 199rb dari 350rb hari ini',
  'Webinar gratis belajar desain 20 Agustus via Zoom',
];

/** Galeri contoh hasil: tiap kartu = frame pertama video dari satu kalimat. Ketuk untuk membuat versi sendiri. */
export default function ExampleGallery({ prompts = EXAMPLE_PROMPTS, compact }: { prompts?: string[]; compact?: boolean }) {
  const items = useMemo(
    () =>
      prompts.map((p) => {
        const plan = analyzePrompt(p, { seed: 4 });
        const tpl = rankTemplates({ intent: plan.intent, mood: plan.mood, keywords: plan.keywords, hasPhotos: false }, 1)[0];
        return { p, plan, tpl: tpl.id };
      }),
    [prompts]
  );
  return (
    <div className={compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'}>
      {items.map((it) => (
        <Link key={it.p} href={`/create?prompt=${encodeURIComponent(it.p)}&auto=1`} className="group min-w-0 overflow-hidden rounded-2xl border border-mk-line bg-mk-panel transition hover:border-mk-coral/60">
          <LazyVisible minH={160} className="aspect-[9/14] bg-mk-ink">
            <TemplateThumb plan={it.plan} templateId={it.tpl} aspect="9:16" assets={{}} />
          </LazyVisible>
          <div className="p-2.5">
            <div className="text-[11px] font-bold text-mk-coral">{INTENT_LABELS[it.plan.intent]}</div>
            <div className="line-clamp-2 text-xs text-mk-muted group-hover:text-mk-cream">“{it.p}”</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
