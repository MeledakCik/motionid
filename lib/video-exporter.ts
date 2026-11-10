import { GeneratedScriptResult } from './smart-engine';
import { ProjectStyleConfig, TemplateId } from '@/store/useEditorStore';

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

  // Preload gambar background/produk jika ada
  const loadedImg = await preloadImage(style.backgroundImageUrl);

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
      const sceneProgress = Math.min(1, sceneElapsed / sceneDur);
      const overallProgress = Math.min(1, elapsedMs / totalDurationMs);

      onProgress?.(
        pct,
        `Merekam ${displaySec}s / ${totalDurationSec}s... (Scene ${scene.sceneNumber}/${script.scenes.length})`,
        displaySec,
        totalDurationSec
      );

      // 1. Gambar Background
      ctx.save();
      if (style.backgroundType === 'solid') {
        ctx.fillStyle = style.solidColor || style.colors.bgPrimary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (
        (style.backgroundType === 'upload' || style.backgroundType === 'unsplash') &&
        loadedImg
      ) {
        ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(9, 13, 22, 0.62)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, style.colors.bgPrimary);
        grad.addColorStop(1, style.colors.bgSecondary);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Ornamen lingkaran cahaya lembut
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = style.colors.accentColor;
      ctx.beginPath();
      ctx.arc(
        canvas.width * 0.8 + Math.sin(elapsedSec * 2) * 24,
        canvas.height * 0.2 + Math.cos(elapsedSec * 1.6) * 24,
        canvas.width * 0.28,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // 2. Animasi masuk per scene
      const introT = Math.min(1, sceneElapsed / 0.42);
      const easeOut = 1 - Math.pow(1 - introT, 3);
      const animAlpha = scene.animation === 'fade' ? easeOut : Math.min(1, sceneElapsed / 0.25);
      const slideOffsetY = scene.animation === 'slide-up' ? (1 - easeOut) * 55 : 0;

      ctx.save();
      ctx.globalAlpha = animAlpha;
      ctx.translate(0, slideOffsetY);

      // Badge Template & Role
      ctx.fillStyle = style.colors.accentColor;
      const badgeW = 280;
      const badgeH = 44;
      const badgeX = (canvas.width - badgeW) / 2;
      const badgeY = canvas.height * 0.2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
      ctx.fill();

      ctx.fillStyle = style.colors.badgeTextColor;
      ctx.font = `bold 20px "${style.font}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        `${templateId} • SCENE ${scene.sceneNumber}`,
        canvas.width / 2,
        badgeY + 29
      );

      // Emoji
      if (style.showEmoji && scene.emoji) {
        ctx.font = '56px sans-serif';
        ctx.fillText(scene.emoji, canvas.width / 2, canvas.height * 0.33);
      }

      // Teks Utama (Word Wrap)
      ctx.fillStyle = style.colors.textColor;
      ctx.font = `bold 42px "${style.font}", sans-serif`;
      const displayText =
        scene.animation === 'typewriter' || templateId === 'Q2'
          ? scene.text.slice(
              0,
              Math.max(1, Math.ceil(scene.text.length * Math.min(1, sceneProgress * 1.4)))
            )
          : scene.text;

      const nextY = wrapCanvasText(
        ctx,
        displayText,
        canvas.width / 2,
        canvas.height * 0.43,
        canvas.width * 0.82,
        54
      );

      // Subtext / Subtitle
      if (style.showSubtitle && scene.subtext) {
        ctx.globalAlpha = animAlpha * 0.88;
        ctx.fillStyle = style.colors.accentColor;
        ctx.font = `600 24px "${style.font}", sans-serif`;
        wrapCanvasText(
          ctx,
          scene.subtext,
          canvas.width / 2,
          nextY + 32,
          canvas.width * 0.76,
          34
        );
      }

      ctx.restore();

      // 3. Progress Bar Bawah
      if (style.showProgressBar) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(40, canvas.height - 36, canvas.width - 80, 10);
        ctx.fillStyle = style.colors.accentColor;
        ctx.fillRect(
          40,
          canvas.height - 36,
          (canvas.width - 80) * overallProgress,
          10
        );
      }

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

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}
