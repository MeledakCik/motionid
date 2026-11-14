'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { analyzePrompt, INTENT_LABELS } from '@/lib/studio/prompt';
import { buildDoc } from '@/lib/studio/builder';
import { rankTemplates } from '@/lib/studio/packs/templates';
import LivePreview from '@/components/studio/LivePreview';
import { cx } from '@/components/studio/ui';

const DEMOS = [
  'Promo kopi susu gula aren 18rb di Kopi Senja, diskon 30% hari ini',
  '5 tips hemat buat anak kos biar uang cukup sampai akhir bulan',
  'Kata-kata galau buat yang lagi kangen',
  'Flash sale sneakers 199rb dari 350rb @sneakid',
];

export default function HeroDemo() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [text, setText] = useState('');
  const doc = useMemo(() => {
    const plan = analyzePrompt(DEMOS[active], { seed: 2 });
    const tpl = rankTemplates({ intent: plan.intent, mood: plan.mood, keywords: plan.keywords, hasPhotos: false }, 1)[0];
    return buildDoc({ plan, templateId: tpl.id });
  }, [active]);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/create?prompt=${encodeURIComponent(text || DEMOS[active])}`);
          }}
          className="mk-card flex flex-col gap-2 p-2 sm:flex-row"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ketik ide videomu… misal: promo seblak 10rb" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] text-mk-cream placeholder:text-mk-dim focus:outline-none" aria-label="Ide video" />
          <button type="submit" className="mk-btn-primary px-5 py-3">
            <Sparkles className="h-4 w-4" /> Buat video
          </button>
        </form>
        <div className="mt-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-mk-dim">Lihat contoh dari satu kalimat:</div>
          {DEMOS.map((d, i) => (
            <button key={d} type="button" onClick={() => setActive(i)} className={cx('flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition', i === active ? 'border-mk-coral/60 bg-mk-coral/10 text-mk-cream' : 'border-mk-line bg-mk-panel/60 text-mk-muted hover:text-mk-cream')}>
              <span className="truncate">“{d}”</span>
              {i === active && <span className="shrink-0 rounded-full bg-mk-coral/20 px-2 py-0.5 text-[10px] font-bold text-mk-coral">{INTENT_LABELS[doc.plan.intent]} · {doc.scenes.length} scene</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[40px] bg-mk-coral/20 blur-3xl" />
          <LivePreview doc={doc} width={260} />
        </div>
      </div>
    </div>
  );
}
