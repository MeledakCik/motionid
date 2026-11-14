import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { ProjectDoc } from './types';
import { canvasSize, docDuration } from './types';
import { Renderer } from './renderer';
import { renderMusic } from './music';
import { ensureFonts } from './fonts';

/**
 * Export video MULUS:
 * 1) Jalur utama WebCodecs (VideoEncoder + AudioEncoder) + mp4-muxer: setiap frame dirender
 *    dengan timestamp pasti (frame/fps), bukan jam dinding — hasilnya tidak pernah patah-patah
 *    walaupun HP lambat, dan biasanya lebih cepat dari real-time.
 * 2) Fallback MediaRecorder (browser lama): tetap memakai waktu deterministik per frame.
 */

export interface ExportOptions {
  quality: '720p' | '1080p';
  fps: 30 | 60;
  onProgress?: (p: number, label: string) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  mime: string;
  ext: 'mp4' | 'webm';
  method: 'webcodecs' | 'mediarecorder';
}

function dims(doc: ProjectDoc, quality: ExportOptions['quality']) {
  const { w, h } = canvasSize(doc.aspect);
  const target = quality === '1080p' ? 1080 : 720;
  const s = target / Math.min(w, h);
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  return { width: even(w * s), height: even(h * s) };
}

async function pickVideoConfig(width: number, height: number, fps: number): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const bitrate = Math.round(width * height * fps * 0.12);
  const codecs = ['avc1.640033', 'avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42001f'];
  for (const codec of codecs) {
    const cfg: VideoEncoderConfig = { codec, width, height, bitrate, framerate: fps, avc: { format: 'avc' }, latencyMode: 'quality' };
    try {
      const r = await VideoEncoder.isConfigSupported(cfg);
      if (r.supported) return cfg;
    } catch {
      // coba berikutnya
    }
  }
  return null;
}

async function pickAudioConfig(): Promise<{ cfg: AudioEncoderConfig; muxCodec: 'aac' | 'opus' } | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  const tries: Array<{ cfg: AudioEncoderConfig; muxCodec: 'aac' | 'opus' }> = [
    { cfg: { codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 160_000 }, muxCodec: 'aac' },
    { cfg: { codec: 'opus', numberOfChannels: 2, sampleRate: 48000, bitrate: 128_000 }, muxCodec: 'opus' },
  ];
  for (const t of tries) {
    try {
      const r = await AudioEncoder.isConfigSupported(t.cfg);
      if (r.supported) return t;
    } catch {
      // lanjut
    }
  }
  return null;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export async function exportVideo(doc: ProjectDoc, opts: ExportOptions): Promise<ExportResult> {
  const { width, height } = dims(doc, opts.quality);
  const fps = opts.fps;
  const duration = docDuration(doc);
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const report = opts.onProgress || (() => {});

  report(0, 'Menyiapkan font & gambar…');
  const renderer = new Renderer({ allowBlur: true, particleScale: 1 });
  renderer.setDoc(doc);
  await ensureFonts([doc.theme.headingFont, doc.theme.bodyFont, ...doc.scenes.flatMap((s) => s.layers.flatMap((l) => (l.kind === 'text' ? [l.font] : [])))]);
  await renderer.preload();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const vcfg = await pickVideoConfig(width, height, fps);
  if (vcfg && typeof VideoFrame !== 'undefined') {
    try {
      return await exportWebCodecs(doc, renderer, canvas, ctx, vcfg, fps, totalFrames, duration, opts, report);
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      console.warn('WebCodecs gagal, pindah ke MediaRecorder', e);
    }
  }
  return exportMediaRecorder(doc, renderer, canvas, ctx, fps, totalFrames, duration, opts, report);
}

async function exportWebCodecs(
  doc: ProjectDoc,
  renderer: Renderer,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  vcfg: VideoEncoderConfig,
  fps: number,
  totalFrames: number,
  duration: number,
  opts: ExportOptions,
  report: (p: number, l: string) => void
): Promise<ExportResult> {
  const acfg = doc.music.id !== 'none' ? await pickAudioConfig() : null;
  const audio = acfg ? await renderMusic(doc.music.id, duration, acfg.cfg.sampleRate) : null;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: canvas.width, height: canvas.height, frameRate: fps },
    ...(acfg && audio ? { audio: { codec: acfg.muxCodec, numberOfChannels: 2, sampleRate: acfg.cfg.sampleRate } } : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encErr: unknown = null;
  const venc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encErr = e),
  });
  venc.configure(vcfg);

  // ---- audio
  if (acfg && audio) {
    const aenc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => (encErr = e),
    });
    aenc.configure(acfg.cfg);
    const vol = doc.music.volume ?? 0.7;
    const L = audio.getChannelData(0);
    const R = audio.numberOfChannels > 1 ? audio.getChannelData(1) : L;
    const total = Math.min(audio.length, Math.ceil(duration * audio.sampleRate));
    const block = 4096;
    for (let off = 0; off < total; off += block) {
      const n = Math.min(block, total - off);
      const data = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        data[i] = L[off + i] * vol;
        data[n + i] = R[off + i] * vol;
      }
      const ad = new AudioData({ format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((off / audio.sampleRate) * 1e6), data });
      aenc.encode(ad);
      ad.close();
    }
    await aenc.flush();
    aenc.close();
  }

  // ---- video: frame demi frame dengan timestamp pasti
  const frameDur = 1e6 / fps;
  const t0 = performance.now();
  for (let f = 0; f < totalFrames; f++) {
    if (opts.signal?.aborted) {
      venc.close();
      throw new DOMException('Dibatalkan', 'AbortError');
    }
    if (encErr) throw encErr;
    const t = f / fps;
    renderer.render(ctx, canvas.width, canvas.height, t);
    const frame = new VideoFrame(canvas, { timestamp: Math.round(f * frameDur), duration: Math.round(frameDur) });
    venc.encode(frame, { keyFrame: f % (fps * 2) === 0 });
    frame.close();
    while (venc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 4));
    if (f % 6 === 0) {
      const el = (performance.now() - t0) / 1000;
      const eta = f > 0 ? (el / f) * (totalFrames - f) : 0;
      report(f / totalFrames, `Merender frame ${f + 1}/${totalFrames}${eta > 1 ? ` · ±${Math.ceil(eta)} dtk lagi` : ''}`);
      await tick();
    }
  }
  report(0.99, 'Menyusun file MP4…');
  await venc.flush();
  venc.close();
  if (encErr) throw encErr;
  muxer.finalize();
  const buf = (muxer.target as ArrayBufferTarget).buffer;
  report(1, 'Selesai!');
  return { blob: new Blob([buf], { type: 'video/mp4' }), mime: 'video/mp4', ext: 'mp4', method: 'webcodecs' };
}

async function exportMediaRecorder(
  doc: ProjectDoc,
  renderer: Renderer,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fps: number,
  totalFrames: number,
  duration: number,
  opts: ExportOptions,
  report: (p: number, l: string) => void
): Promise<ExportResult> {
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    throw new Error('Browser ini belum mendukung export video. Gunakan Chrome / Edge / Firefox versi terbaru.');
  }
  const stream = canvas.captureStream(0);
  const vtrack = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  let actx: AudioContext | null = null;
  let src: AudioBufferSourceNode | null = null;
  const audio = doc.music.id !== 'none' ? await renderMusic(doc.music.id, duration) : null;
  if (audio) {
    try {
      actx = new AudioContext();
      const dest = actx.createMediaStreamDestination();
      src = actx.createBufferSource();
      src.buffer = audio;
      const g = actx.createGain();
      g.gain.value = doc.music.volume ?? 0.7;
      src.connect(g).connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch {
      actx = null;
    }
  }
  const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = mimes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: canvas.width * canvas.height * 6 } : undefined);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((res) => (rec.onstop = () => res()));

  renderer.render(ctx, canvas.width, canvas.height, 0);
  rec.start(250);
  if (actx && src) {
    await actx.resume();
    src.start();
  }
  const start = performance.now();
  for (let f = 0; f < totalFrames; f++) {
    if (opts.signal?.aborted) break;
    const due = start + (f * 1000) / fps;
    const wait = due - performance.now();
    if (wait > 1) await new Promise((r) => setTimeout(r, wait));
    renderer.render(ctx, canvas.width, canvas.height, f / fps);
    vtrack.requestFrame?.();
    if (f % 10 === 0) report(f / totalFrames, `Merekam ${Math.floor(f / fps)} / ${Math.ceil(duration)} dtk… (jangan pindah tab)`);
  }
  rec.stop();
  await done;
  try {
    src?.stop();
  } catch {
    // abaikan
  }
  actx?.close().catch(() => {});
  if (opts.signal?.aborted) throw new DOMException('Dibatalkan', 'AbortError');
  const type = mime.split(';')[0] || 'video/webm';
  report(1, 'Selesai!');
  return { blob: new Blob(chunks, { type }), mime: type, ext: type.includes('mp4') ? 'mp4' : 'webm', method: 'mediarecorder' };
}

export function supportsSmoothExport(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder !== 'undefined';
}
