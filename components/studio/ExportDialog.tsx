'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Loader2, LogIn, MessageCircle, Share2, Smartphone, Sparkles, X, Zap } from 'lucide-react';
import type { ProjectDoc } from '@/lib/studio/types';
import { docDuration } from '@/lib/studio/types';
import { exportVideo, ExportResult, supportsSmoothExport } from '@/lib/studio/exporter';
import { hasAnyAudio, hasNarrationAudio, narrationOf } from '@/lib/studio/narration';
import { getDeviceProfile } from '@/lib/studio/device';
import { cx, Segmented } from './ui';

type PresetId = 'wa' | 'tiktok' | 'halus' | 'ringan';
interface Preset {
  id: PresetId;
  label: string;
  desc: string;
  emoji: React.ReactNode;
  quality: '720p' | '1080p';
  fps: 30 | 60;
  maxBytes?: number;
}
const WA_MAX = 10 * 1000 * 1000;
const PRESETS: Preset[] = [
  { id: 'wa', label: 'Status WhatsApp', desc: '720p · otomatis di bawah 10 MB', emoji: <MessageCircle className="h-4 w-4" />, quality: '720p', fps: 30, maxBytes: WA_MAX },
  { id: 'tiktok', label: 'TikTok / Reels / Shorts', desc: '1080p · 30 fps · tajam', emoji: <Smartphone className="h-4 w-4" />, quality: '1080p', fps: 30 },
  { id: 'halus', label: 'Super halus', desc: '1080p · 60 fps · file lebih besar', emoji: <Sparkles className="h-4 w-4" />, quality: '1080p', fps: 60 },
  { id: 'ringan', label: 'Ringan & cepat', desc: '720p · 30 fps · cocok HP lama', emoji: <Zap className="h-4 w-4" />, quality: '720p', fps: 30 },
];
function estimateMB(p: Preset, dur: number, audio: boolean): number {
  const short = p.quality === '1080p' ? 1080 : 720;
  const px = short * Math.round((short * 16) / 9);
  const natural = px * p.fps * 0.12;
  const audioBps = audio ? (p.maxBytes ? 96_000 : 160_000) : 0;
  const v = p.maxBytes ? Math.min(natural, (p.maxBytes * 8 * 0.9) / Math.max(1, dur) - audioBps) : natural;
  // encoder H.264 untuk motion graphic biasanya ~55% dari target bitrate
  return ((Math.max(400_000, v) * (p.maxBytes ? 0.9 : 0.55) + audioBps) * dur) / 8 / 1_000_000;
}

export default function ExportDialog({
  doc,
  onClose,
  guest,
  placeholders = 0,
  onFixPlaceholders,
  onBeforeLogin,
}: {
  doc: ProjectDoc;
  onClose: () => void;
  guest?: boolean;
  placeholders?: number;
  onFixPlaceholders?: () => void;
  /** simpan proyek dulu sebelum pindah ke halaman login; boleh kembalikan path untuk kembali */
  onBeforeLogin?: () => Promise<string | void>;
}) {
  const [ignorePh, setIgnorePh] = useState(false);
  const [goingLogin, setGoingLogin] = useState(false);
  const low = getDeviceProfile().tier === 'low';
  const [preset, setPreset] = useState<PresetId>(low ? 'ringan' : 'tiktok');
  const P = PRESETS.find((p) => p.id === preset)!;
  const dur = docDuration(doc);
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
      const r = await exportVideo(doc, { quality: P.quality, fps: P.fps, maxBytes: P.maxBytes, signal: ac.signal, onProgress: (p, l) => (setProgress(p), setLabel(l)) });
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
    <div className="mk-scrim fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-label="Export video">
      <div className="mk-glass mk-solid mk-float w-full max-w-md animate-mk-up rounded-t-3xl border border-white/80 p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold">Export video</h3>
          <button type="button" className="mk-btn-icon" onClick={() => (abortRef.current?.abort(), onClose())} aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        {guest ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mk-coral/15 text-mk-coral">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-extrabold">Masuk dulu untuk menyimpan video</div>
              <p className="mt-1 text-sm text-mk-muted">Gratis, cukup akun Google. Hasil editanmu tidak hilang — kamu langsung kembali ke sini setelah masuk.</p>
            </div>
            <button
              type="button"
              disabled={goingLogin}
              className="mk-btn-primary w-full py-3"
              onClick={async () => {
                setGoingLogin(true);
                const back = (await onBeforeLogin?.()) || window.location.pathname;
                window.location.href = `/login?next=${encodeURIComponent(back)}`;
              }}
            >
              {goingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Masuk dengan Google
            </button>
          </div>
        ) : placeholders > 0 && !ignorePh && state === 'idle' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-mk-amber/10 p-4 text-mk-amber">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <div className="font-extrabold">Masih ada {placeholders} teks contoh</div>
                <p className="mt-1 text-mk-muted">Teks contoh dibuat otomatis dan belum tentu benar untuk usahamu. Ganti dulu dengan info aslimu supaya video tidak menyesatkan penonton.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="mk-btn-primary" onClick={onFixPlaceholders}>
                Ganti sekarang
              </button>
              <button type="button" className="mk-btn-ghost" onClick={() => setIgnorePh(true)}>
                Tetap export
              </button>
            </div>
          </div>
        ) : state === 'idle' || state === 'error' ? (
          <div className="space-y-4">
            <div className="mk-card-2 grid grid-cols-3 divide-x divide-mk-line text-center">
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{docDuration(doc).toFixed(1)}s</div>
                <div className="text-[11px] text-mk-dim">durasi</div>
              </div>
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{doc.scenes.length}</div>
                <div className="text-[11px] text-mk-dim">scene</div>
              </div>
              <div className="p-2.5">
                <div className="text-sm font-extrabold">{doc.aspect}</div>
                <div className="text-[11px] text-mk-dim">rasio</div>
              </div>
            </div>
            <div>
              <span className="mk-label">Mau dipakai untuk apa?</span>
              <div className="grid gap-1.5">
                {PRESETS.map((p) => {
                  const on = preset === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPreset(p.id)} className={cx('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition', on ? 'border-mk-coral bg-mk-coral/10' : 'border-mk-line bg-mk-panel-2 hover:border-mk-line-2')}>
                      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base', on ? 'bg-mk-coral text-white' : 'bg-mk-ink')}>{p.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{p.label}</span>
                        <span className="block text-[11px] text-mk-dim">{p.desc}</span>
                      </span>
                      <span className="shrink-0 text-right text-[11px] font-bold text-mk-muted">≈ {estimateMB(p, dur, hasAnyAudio(doc)).toFixed(1)} MB</span>
                    </button>
                  );
                })}
              </div>
              {preset === 'wa' && dur > 60 && (
                <p className="mt-2 rounded-xl bg-mk-amber/10 px-3 py-2 text-[11px] text-mk-amber">Video {Math.round(dur)} detik. Status WhatsApp hanya menampilkan 60 detik pertama, sisanya akan terpotong — kurangi durasi scene dulu kalau perlu.</p>
              )}
            </div>
            <p className={cx('rounded-xl px-3 py-2 text-[11px]', smooth ? 'bg-mk-mint/10 text-mk-mint' : 'bg-mk-amber/10 text-mk-amber')}>
              {smooth
                ? '✓ Mode render frame-per-frame aktif: video dijamin mulus, tidak patah-patah, walau HP sedang sibuk.'
                : 'Browser ini memakai mode rekam real-time. Biarkan tab tetap terbuka sampai selesai. Untuk hasil paling mulus pakai Chrome/Edge terbaru.'}
            </p>
            {narrationOf(doc).enabled && !hasNarrationAudio(doc) && (
              <p className="rounded-xl bg-mk-amber/10 px-3 py-2 text-[11px] text-mk-amber">
                Narasi sedang aktif tapi belum ada rekaman/unggahan suara. Suara narasi belum akan masuk ke video — buka panel Suara → Narasi untuk merekam atau mengunggah voice over.
              </p>
            )}
            {hasNarrationAudio(doc) && (
              <p className="rounded-xl bg-mk-mint/10 px-3 py-2 text-[11px] text-mk-mint">
                ✓ Narasi ikut dirender ke video{narrationOf(doc).duckMusic ? ' dan musik otomatis mengecil saat narasi berbunyi' : ''}.
              </p>
            )}
            {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>}
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
              {preset === 'wa' && (
                <p className={cx('rounded-xl px-3 py-2 text-xs', result.blob.size <= WA_MAX ? 'bg-mk-mint/10 text-mk-mint' : 'bg-mk-amber/10 text-mk-amber')}>
                  {result.blob.size <= WA_MAX
                    ? `Siap untuk Status WA: ${(result.blob.size / 1_000_000).toFixed(1)} MB (batas 10 MB). Unduh lalu unggah dari galeri ke Status.`
                    : `File ${(result.blob.size / 1_000_000).toFixed(1)} MB masih di atas 10 MB. Coba kurangi durasi atau jumlah efek, lalu export lagi.`}
                </p>
              )}
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
              {result.audioCodec === 'opus' && (
                <p className="rounded-xl bg-mk-amber/10 px-3 py-2 text-xs text-mk-amber">
                  Browser ini menyimpan suara dalam format Opus. Kalau suaranya tidak keluar di iPhone/WhatsApp, export ulang lewat Chrome di Android/PC, atau tambahkan musik langsung di TikTok.
                </p>
              )}
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
