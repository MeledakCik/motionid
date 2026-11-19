'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, FileInput, Loader2 } from 'lucide-react';
import type { ImportResult } from '@/lib/studio/importers';
import { saveLocal } from '@/lib/studio/persist';
import { cx } from './ui';

const IMPORT_ACCEPT = '.json,.xml,application/json,text/xml';

/** Tombol + hasil impor proyek dari After Effects / Alight Motion / CapCut. */
export function ImportBox({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<ImportResult | null>(null);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    setErr(null);
    setRes(null);
    try {
      // importer dimuat saat dipakai supaya halaman tetap ringan
      const { importFile } = await import('@/lib/studio/importers');
      setRes(await importFile(f));
    } catch (e) {
      setErr((e as Error).message || 'File tidak bisa dibaca.');
    } finally {
      setBusy(false);
    }
  };

  const open = async () => {
    if (!res) return;
    setBusy(true);
    await saveLocal(res.doc);
    try {
      localStorage.setItem('motionku:open-tool', 'resep');
    } catch {
      // abaikan
    }
    router.push(`/editor/${res.doc.id}`);
  };

  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept={IMPORT_ACCEPT} hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={cx('flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-mk-coral/40 text-left transition hover:border-mk-coral hover:bg-mk-mist', compact ? 'px-3 py-2.5' : 'px-4 py-3')}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mk-coral text-white">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileInput className="h-5 w-5" />}</span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Impor proyek</span>
          <span className="block text-xs text-mk-dim">After Effects (Lottie .json) · Alight Motion (.xml) · CapCut desktop (draft_content.json)</span>
        </span>
      </button>
      {err && (
        <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
        </p>
      )}
      {res && (
        <div className="rounded-2xl border border-mk-line bg-white p-3 text-xs">
          <p className="font-semibold">{res.summary}</p>
          {res.notes.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-mk-muted">
              {res.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <button type="button" className="mk-btn-primary mt-3 w-full text-xs" onClick={open} disabled={busy}>
            Buka & lihat cara pembuatannya
          </button>
        </div>
      )}
    </div>
  );
}

