'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, Share2, X } from 'lucide-react';
import type { ProjectDoc } from '@/lib/studio/types';
import { docDuration } from '@/lib/studio/types';
import { exportVideo, ExportResult, supportsSmoothExport } from '@/lib/studio/exporter';
import { getDeviceProfile } from '@/lib/studio/device';
import { cx, Segmented } from './ui';

export default function ExportDialog({ doc, onClose }: { doc: ProjectDoc; onClose: () => void }) {
  const low = getDeviceProfile().tier === 'low';
  const [quality, setQuality] = useState<'720p' | '1080p'>(low ? '720p' : '1080p');
  const [fps, setFps] = useState<30 | 60>(30);
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('');
  const [result, setResult] = useState<ExportResult & { url: string } | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const smooth = supportsSmoothExport();

  useEffect(() => () => {
    abortRef.current?.abort();
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const start = async () => {
    setState('running');
    setError('');
    setProgress(0);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const r = await exportVideo(doc, { quality, fps, signal: ac.signal, onProgress: (p, l) => (setProgress(p), setLabel(l)) });
      setResult({ ...r, url: URL.createObjectURL(r.blob) });
      setState('done');
    } catch (e) {
      if ((e as Error).name === 'AbortError') setState('idle');
      else {
        setError((e as Error).message || 'Gagal membuat video.');
        setState('error');
      }
    }
  };

  const fileName = `${(doc.title || 'motionku').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'motionku'}.${result?.ext || 'mp4'}`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare && !!result && navigator.canShare({ files: [new File([result.blob], fileName, { type: result.mime })] });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-label="Export video">
      <div className="w-full max-w-md animate-mk-up rounded-t-3xl border border-mk-line bg-mk-panel p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold">Export video</h3>
          <button type="button" className="mk-btn-icon" onClick={() => (abortRef.current?.abort(), onClose())} aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        {state === 'idle' || state === 'error' ? (
          <div className="space-y-4">
            <div className="mk-card-2 grid grid-cols-3 divide-x divide-mk-line text-center">
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{docDuration(doc).toFixed(1)}s</div>
                <div className="text-[10px] text-mk-dim">durasi</div>
              </div>
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{doc.scenes.length}</div>
                <div className="text-[10px] text-mk-dim">scene</div>
              </div>
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{doc.aspect}</div>
                <div className="text-[10px] text-mk-dim">rasio</div>
              </div>
            </div>
            <div>
              <span className="mk-label">Kualitas</span>
              <Segmented value={quality} onChange={setQuality} options={[{ value: '720p', label: '720p · ringan' }, { value: '1080p', label: '1080p · tajam' }]} />
            </div>
            <div>
              <span className="mk-label">Kehalusan gerak</span>
              <Segmented value={String(fps) as '30' | '60'} onChange={(v) => setFps(Number(v) as 30 | 60)} options={[{ value: '30', label: '30 fps' }, { value: '60', label: '60 fps · super halus' }]} />
            </div>
            <p className={cx('rounded-xl px-3 py-2 text-[11px]', smooth ? 'bg-mk-mint/10 text-mk-mint' : 'bg-mk-amber/10 text-mk-amber')}>
              {smooth
                ? '✓ Mode render frame-per-frame aktif: video dijamin mulus, tidak patah-patah, walau HP sedang sibuk.'
                : 'Browser ini memakai mode rekam real-time. Biarkan tab tetap terbuka sampai selesai. Untuk hasil paling mulus pakai Chrome/Edge terbaru.'}
            </p>
            {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
            <button type="button" className="mk-btn-primary w-full py-3" onClick={start}>
              <Download className="h-4 w-4" /> Buat file video
            </button>
          </div>
        ) : state === 'running' ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Loader2 className="h-4 w-4 animate-spin text-mk-coral" /> {Math.round(progress * 100)}%
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-mk-ink">
              <div className="h-full rounded-full bg-mk-grad transition-[width]" style={{ width: `${Math.max(3, progress * 100)}%` }} />
            </div>
            <p className="text-[11px] text-mk-dim">{label}</p>
            <button type="button" className="mk-btn-ghost w-full text-xs" onClick={() => abortRef.current?.abort()}>
              Batalkan
            </button>
          </div>
        ) : (
          result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-mk-mint">
                <CheckCircle2 className="h-4 w-4" /> Video siap! ({(result.blob.size / 1024 / 1024).toFixed(1)} MB · {result.ext.toUpperCase()})
              </div>
              <video src={result.url} controls playsInline className="mx-auto max-h-[46vh] rounded-xl bg-black" />
              <div className="grid grid-cols-2 gap-2">
                <a href={result.url} download={fileName} className="mk-btn-primary">
                  <Download className="h-4 w-4" /> Unduh
                </a>
                {canShare ? (
                  <button type="button" className="mk-btn-ghost" onClick={() => navigator.share({ files: [new File([result.blob], fileName, { type: result.mime })], title: doc.title })}>
                    <Share2 className="h-4 w-4" /> Bagikan
                  </button>
                ) : (
                  <button type="button" className="mk-btn-ghost" onClick={() => setState('idle')}>
                    Export lagi
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-mk-ink p-3 text-[11px] text-mk-muted">
                <div className="mb-1 font-bold text-mk-cream">Caption siap tempel</div>
                <p className="select-all">{doc.plan.caption} {doc.plan.hashtags.join(' ')}</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
