'use client';

import React, { useMemo } from 'react';
import { Play } from 'lucide-react';
import type { PlaybackClock } from '@/lib/studio/clock';
import { explainScene } from '@/lib/studio/explain';
import { useStudio } from '@/store/useStudio';
import { cx, Section } from './ui';
import { ImportBox } from './ImportPanels';

const FROM_LABEL: Record<string, string> = { 'after-effects': 'After Effects (Lottie)', 'alight-motion': 'Alight Motion', capcut: 'CapCut' };

/** Panel "Cara buat": langkah pembuatan scene, bisa diklik untuk lompat ke elemen & waktunya. */
export function RecipePanel({ clock }: { clock: PlaybackClock }) {
  const doc = useStudio((s) => s.doc!);
  const sceneIdx = useStudio((s) => s.sceneIdx);
  const layerId = useStudio((s) => s.layerId);
  const steps = useMemo(() => explainScene(doc, sceneIdx), [doc, sceneIdx]);
  const st = useStudio.getState();
  const go = (t: number, id?: string, play?: boolean) => {
    if (id) st.selectLayer(id);
    st.seekLocal(Math.max(0, t));
    if (play) clock.play();
  };
  return (
    <div>
      {doc.imported && (
        <Section title={`Diimpor dari ${FROM_LABEL[doc.imported.from] || doc.imported.from}`}>
          <p className="text-[11px] text-mk-dim">{doc.imported.file}</p>
          {doc.imported.notes.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-mk-muted">
              {doc.imported.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </Section>
      )}
      <Section title={`Cara buat scene ${sceneIdx + 1}`}>
        <p className="text-[11px] text-mk-dim">Ketuk langkah untuk memilih elemennya dan lompat ke waktunya. Tombol ▶ memutar mulai dari langkah itu.</p>
        <ol className="space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className={cx('rounded-xl border p-2.5', s.layerId && s.layerId === layerId ? 'border-mk-coral bg-mk-coral/5' : 'border-mk-line')}>
              <div className="flex items-start gap-2">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => go(s.t + 0.01, s.layerId)}>
                  <span className="block text-xs font-semibold">{s.title}</span>
                  <span className="font-mono text-[10px] text-mk-dim">{s.t.toFixed(2)} dtk</span>
                </button>
                <button type="button" className="mk-btn-icon h-7 w-7 shrink-0" aria-label={`Putar dari langkah ${i + 1}`} onClick={() => go(s.t, s.layerId, true)}>
                  <Play className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-mk-muted">
                {s.details.map((d, j) => (
                  <li key={j} className={d.startsWith('  ◆') ? 'pl-2 font-mono text-[10.5px] text-mk-cream' : ''}>
                    {d.trim()}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Impor proyek lain">
        <ImportBox compact />
      </Section>
    </div>
  );
}
