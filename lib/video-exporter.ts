import { GeneratedScriptResult } from './smart-engine';
import { ProjectStyleConfig, TemplateId } from '@/store/useEditorStore';
import { drawFrame } from './canvas-scene';
import { ensureCanvasFont, resolveCanvasFamily } from '@/components/templates/fonts';

export interface ExportProgressCallback {
  (percent: number, statusText: string, elapsedSec: number, totalSec: number): void;
}

/**
 * ============================================================================
 * MOTIONKU - BROWSER VIDEO EXPORTER (HTML5 CANVAS + MEDIARECORDER + AUDIOCONTEXT)
 * File: lib/video-exporter.ts
 * ============================================================================
 * Merender seluruh scene secara real-time selama total durasi semua scene ke dalam
 * elemen <canvas> di browser, menggabungkan jalur audio dari AudioContext +
 * MediaStreamDestination (baik dari file MP3 lokal di /public/music/ maupun
 * Web Audio synthesizer), lalu merekamnya menjadi file MP4/WebM siap unduh
 * di Chrome Desktop TANPA server render, TANPA FFmpeg server, dan TANPA API eksternal.
 */
export async function exportProjectToVideo(
  script: GeneratedScriptResult,
  style: ProjectStyleConfig,
  templateId: TemplateId,
  onProgress?: ExportProgressCallback
): Promise<{ blob: Blob; url: string; mimeType: string; totalDurationSec: number }> {
  // 1. Pastikan browser mendukung MediaRecorder & HTMLCanvasElement.captureStream
  if (
    typeof window === 'undefined' ||
    typeof window.MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement.prototype.captureStream !== 'function'
  ) {
    throw new Error(
      'Browser Anda tidak mendukung API MediaRecorder atau HTMLCanvasElement.captureStream(). Silakan gunakan Google Chrome Desktop versi terbaru untuk mengekspor video MP4.'
    );
  }

  // 2. Hitung total durasi seluruh scene (contoh: 3s + 3s + 3s + 3s = 12s)
  const totalDurationSec = script.scenes.reduce(
    (acc, s) => acc + (Number(s.duration) || 3),
    0
  );

  // 3. Tentukan resolusi berdasarkan aspect ratio
  const dimensions =
    style.aspectRatio === '9:16'
      ? { width: 720, height: 1280 }
      : style.aspectRatio === '1:1'
      ? { width: 720, height: 720 }
      : { width: 1280, height: 720 };

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi konteks 2D pada HTML5 Canvas.');
  }

  // Preload semua gambar yang dipakai scene + font, supaya frame pertama sudah benar
  const imageUrls = Array.from(
    new Set(
      [
        style.backgroundImageUrl,
        ...style.userImages,
        ...script.scenes.map((sc) => sc.imageUrl),
      ].filter((u): u is string => Boolean(u))
    )
  );
  const images = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    imageUrls.map(async (u) => {
      images.set(u, await preloadImage(u));
    })
  );
  await ensureCanvasFont(style.font);
  const family = resolveCanvasFamily(style.font);

  // 4. Siapkan AudioContext + MediaStreamDestination jika musik dipilih
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  let audioTracks: MediaStreamTrack[] = [];
  let audioBufferSource: AudioBufferSourceNode | null = null;

  if (AudioCtx && style.music && style.music.id !== 'none') {
    try {
      audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const destNode = audioCtx.createMediaStreamDestination();

      // Coba muat file MP3 dari /public/music/*.mp3 terlebih dahulu
      let mp3Loaded = false;
      if (style.music.url) {
        try {
          const response = await fetch(style.music.url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioBufferSource = audioCtx.createBufferSource();
            audioBufferSource.buffer = decodedBuffer;
            audioBufferSource.loop = true;
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.75;
            audioBufferSource.connect(gainNode);
            gainNode.connect(destNode);
            audioBufferSource.start(0);
            mp3Loaded = true;
          }
        } catch {
          mp3Loaded = false;
        }
      }

      // Jika file MP3 belum ada atau gagal dimuat, gunakan Web Audio Synthesizer
      if (!mp3Loaded) {
        scheduleProceduralMusic(audioCtx, destNode, style.music.mood, style.music.bpm, totalDurationSec);
      }

      audioTracks = destNode.stream.getAudioTracks();
    } catch {
      audioTracks = [];
    }
  }

  // 5. Gabungkan video stream dari Canvas (30 FPS) + audio stream dari AudioContext
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks,
  ]);

  // Utamakan container MP4 (H.264/AAC) yang didukung Chrome Desktop modern
  const candidateMimes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  const supportedMime =
    candidateMimes.find((m) => {
      try {
        return MediaRecorder.isTypeSupported(m);
      } catch {
        return false;
      }
    }) || '';

  let recorder: MediaRecorder;
  try {
    recorder = supportedMime
      ? new MediaRecorder(combinedStream, {
          mimeType: supportedMime,
          videoBitsPerSecond: 4_000_000,
        })
      : new MediaRecorder(combinedStream);
  } catch (err: unknown) {
    if (audioCtx) audioCtx.close().catch(() => {});
    const msg = err instanceof Error ? err.message : 'Format perekaman tidak didukung.';
    throw new Error(`MediaRecorder gagal dimulai di browser ini: ${msg}`);
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    let animFrameId: number | null = null;
    let backupTimerId: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      if (backupTimerId !== null) clearInterval(backupTimerId);
      if (audioBufferSource) {
        try {
          audioBufferSource.stop();
        } catch {}
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    };

    recorder.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Terjadi kesalahan saat merekam stream video dengan MediaRecorder. Pastikan menggunakan Chrome Desktop.'
        )
      );
    };

    recorder.onstop = () => {
      cleanup();
      const finalMime = supportedMime || recorder.mimeType || 'video/mp4';
      const blob = new Blob(chunks, { type: finalMime });
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, mimeType: finalMime, totalDurationSec });
    };

    // Mulai perekaman real-time
    recorder.start(100);
    const startTimeMs = performance.now();
    const totalDurationMs = totalDurationSec * 1000;

    const renderTick = (nowMs: number) => {
      const elapsedMs = Math.max(0, nowMs - startTimeMs);
      const elapsedSec = elapsedMs / 1000;
      const displaySec = Math.min(totalDurationSec, Math.floor(elapsedSec));
      const pct = Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100));

      // Tentukan scene aktif pada detik ini
      let accSec = 0;
      let activeIdx = 0;
      let sceneElapsed = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        const dur = Number(script.scenes[i].duration) || 3;
        if (elapsedSec < accSec + dur || i === script.scenes.length - 1) {
          activeIdx = i;
          sceneElapsed = Math.max(0, elapsedSec - accSec);
          break;
        }
        accSec += dur;
      }

      const scene = script.scenes[activeIdx];
      const sceneDur = Math.max(1, Number(scene.duration) || 3);
      const overallProgress = Math.min(1, elapsedMs / totalDurationMs);

      onProgress?.(
        pct,
        `Merekam ${displaySec}s / ${totalDurationSec}s... (Scene ${scene.sceneNumber}/${script.scenes.length})`,
        displaySec,
        totalDurationSec
      );

      drawFrame(ctx, canvas.width, canvas.height, {
        script,
        style,
        templateId,
        sceneIdx: activeIdx,
        sceneElapsed,
        sceneDur,
        elapsedSec,
        overallProgress,
        images,
        family,
      });

      if (elapsedMs < totalDurationMs) {
        animFrameId = requestAnimationFrame(renderTick);
      } else {
        onProgress?.(
          100,
          `Merekam ${totalDurationSec}s / ${totalDurationSec}s... Selesai!`,
          totalDurationSec,
          totalDurationSec
        );
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    };

    animFrameId = requestAnimationFrame(renderTick);
    backupTimerId = setInterval(() => {
      const nowMs = performance.now();
      if (nowMs - startTimeMs >= totalDurationMs + 150 && recorder.state === 'recording') {
        renderTick(nowMs);
      }
    }, 200);
  });
}

function scheduleProceduralMusic(
  audioCtx: AudioContext,
  destNode: MediaStreamAudioDestinationNode,
  mood: string,
  bpm: number,
  totalDurationSec: number
) {
  const beatInterval = 60 / (bpm || 110);
  const now = audioCtx.currentTime + 0.05;
  const totalBeats = Math.ceil((totalDurationSec + 0.5) / beatInterval);
  const baseFreqs =
    mood === 'slow'
      ? [220, 261.63, 293.66, 329.63]
      : mood === 'energetic'
      ? [261.63, 329.63, 392.0, 523.25]
      : [246.94, 293.66, 369.99, 440.0];

  for (let i = 0; i < totalBeats; i++) {
    const startTime = now + i * beatInterval;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = mood === 'slow' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(baseFreqs[i % baseFreqs.length], startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.11, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + beatInterval * 0.9);

    osc.connect(gain);
    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + beatInterval * 0.95);
  }
}

function preloadImage(url?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
