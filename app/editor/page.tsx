'use client';

import React, { useMemo } from 'react';
import Editor from '@/components/studio/Editor';
import { analyzePrompt } from '@/lib/studio/prompt';
import { buildDoc } from '@/lib/studio/builder';

export default function EditorBlankPage() {
  const doc = useMemo(() => buildDoc({ plan: analyzePrompt('promo kopi susu gula aren 18rb di Kopi Senja diskon 30%', { seed: 1 }) }), []);
  return <Editor initialDoc={doc} />;
}
