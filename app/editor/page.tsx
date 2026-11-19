'use client';

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Editor from '@/components/studio/Editor';
import { analyzePrompt } from '@/lib/studio/prompt';
import { buildDoc } from '@/lib/studio/builder';
import { blankDoc } from '@/lib/studio/vector';
import type { Aspect } from '@/lib/studio/types';

const ASPECTS: Aspect[] = ['9:16', '4:5', '1:1', '16:9'];

function EditorEntry() {
  const q = useSearchParams();
  const blank = q.get('kosong') === '1';
  const ratio = q.get('rasio');
  const doc = useMemo(() => {
    const aspect = ASPECTS.includes(ratio as Aspect) ? (ratio as Aspect) : '9:16';
    // kanvas kosong: desain sendiri tanpa template (gaya Figma / Illustrator)
    if (blank) return blankDoc(aspect);
    return buildDoc({ plan: analyzePrompt('promo kopi susu gula aren 18rb di Kopi Senja diskon 30%', { seed: 1 }), aspect });
  }, [blank, ratio]);
  return <Editor key={doc.id} initialDoc={doc} />;
}

export default function EditorBlankPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-mk-coral" />
        </div>
      }
    >
      <EditorEntry />
    </Suspense>
  );
}
