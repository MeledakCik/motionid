/**
 * Narasi / voice over — "ada narrative-nya" seperti video viral.
 *
 * Alur:
 * 1. Skrip narasi dibuat otomatis dari isi scene (rule-based, tanpa API eksternal).
 * 2. Contoh suara memakai SpeechSynthesis bawaan browser — khusus didengarkan saja,
 *    karena browser tidak mengizinkan suara TTS direkam ke file.
 * 3. Suara yang benar-benar masuk ke MP4 berasal dari rekaman mikrofon atau file
 *    audio yang diunggah user (data URI), sehingga hasil export selalu sama.
 */

import type { NarrationDoc, ProjectDoc } from './types';
import { renderMusic } from './music';

export const DEFAULT_NARRATION: NarrationDoc = {
  enabled: false,
  script: '',
  data: null,
  name: '',
  volume: 1,
  duckMusic: true,
  start: 0,
};

/** Gabungkan setting narasi lama (project lama belum punya field ini). */
export function narrationOf(doc: ProjectDoc): NarrationDoc {
  const n = doc.narration;
  return { ...DEFAULT_NARRATION, ...(n || {}) };
}

/** Narasi aktif dan punya audio siap masuk export. */
export function hasNarrationAudio(doc: ProjectDoc): boolean {
  const n = narrationOf(doc);
  return !!n.enabled && !!n.data;
}

/** Video punya audio apa pun (musik atau narasi) untuk track MP4. */
export function hasAnyAudio(doc: ProjectDoc): boolean {
  return doc.music.id !== 'none' || hasNarrationAudio(doc);
}

/* -------------------------------------------------------------------------- */
/* Skrip otomatis                                                             */
/* -------------------------------------------------------------------------- */

function cleanText(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s·•\-–—]+|[\s·•\-–—]+$/g, '')
    .trim();
}

/**
 * Susun skrip narasi Bahasa Indonesia dari teks yang sudah ada di tiap scene.
 * Hasilnya enak dibacakan dan tetap 100% berasal dari konten user.
 */
export function buildNarrationScript(doc: ProjectDoc): string {
  const lines: string[] = [];

  doc.scenes.forEach((scene) => {
    const texts = scene.layers
      .filter((l): l is Extract<typeof l, { kind: 'text' }> => l.kind === 'text')
      .map((l) => cleanText(l.text))
      .filter((t) => t.length > 1);

    const unique: string[] = [];
    texts.forEach((t) => {
      if (!unique.some((u) => u.toLowerCase() === t.toLowerCase())) unique.push(t);
    });
    if (!unique.length) return;

    let sentence = unique.slice(0, 2).join(', ');
    sentence = sentence.replace(/[\s.,;:!?]+$/g, '').trim();
    if (!sentence) return;

    if (scene.role === 'hook') sentence = `${sentence}. Coba simak sampai habis.`;
    else if (scene.role === 'cta') sentence = `Jadi, ${sentence}.`;
    else if (scene.role === 'harga') sentence = `Soal harga, ${sentence}.`;
    else sentence = `${sentence}.`;

    lines.push(sentence);
  });

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

/** Perkiraan durasi bicara (kata per detik ala voice over Indonesia). */
export function estimateSpeechSeconds(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(1, words / (2.6 * Math.max(0.5, rate)));
}

/* -------------------------------------------------------------------------- */
/* TTS bawaan browser (contoh suara saja)                                     */
/* -------------------------------------------------------------------------- */

export function speechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
}

/** Prioritaskan suara Indonesia, lalu Melayu, lalu suara pertama yang ada. */
export function findVoice(voices: SpeechSynthesisVoice[], preferredURI?: string): SpeechSynthesisVoice | null {
  if (preferredURI) {
    const exact = voices.find((v) => v.voiceURI === preferredURI);
    if (exact) return exact;
  }
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('id')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('ms')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
    voices[0] ||
    null
  );
}

function splitForSpeech(text: string, max = 180): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean ? [clean] : [];
  const parts: string[] = [];
  let rest = clean;
  while (rest.length > max) {
    const cut = Math.max(rest.lastIndexOf('. ', max), rest.lastIndexOf(', ', max), rest.lastIndexOf(' ', max));
    const at = cut > max * 0.4 ? cut + 1 : max;
    parts.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export interface SpeakOptions {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

/**
 * Bacakan skrip dengan suara bawaan perangkat. Hanya untuk contoh/preview —
 * audio TTS tidak bisa direkam browser, jadi tidak ikut ke file MP4.
 */
export function speakScript(text: string, opts: SpeakOptions = {}): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const parts = splitForSpeech(text);
  if (!parts.length) return false;

  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = findVoice(speechVoices(), opts.voiceURI);
  let finished = 0;

  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = 'id-ID';
    }
    u.rate = opts.rate ?? 1;
    u.pitch = opts.pitch ?? 1;
    u.volume = opts.volume ?? 1;
    const done = () => {
      finished += 1;
      if (finished >= parts.length) opts.onEnd?.();
    };
    u.onend = done;
    u.onerror = done;
    if (i === parts.length - 1) u.onend = () => {
      finished = parts.length;
      opts.onEnd?.();
    };
    synth.speak(u);
  });

  return true;
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // abaikan
  }
}

/* -------------------------------------------------------------------------- */
/* Audio narasi & pencampuran                                                 */
/* -------------------------------------------------------------------------- */

type OfflineCtor = typeof OfflineAudioContext;

function offlineCtor(): OfflineCtor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext ||
    null
  );
}

const decodeCache = new Map<string, Promise<AudioBuffer | null>>();

/** Decode data URI audio (rekaman/unggahan) ke AudioBuffer pada sampleRate target. */
export function decodeAudioUri(data: string, sampleRate = 44100): Promise<AudioBuffer | null> {
  const OAC = offlineCtor();
  if (!data || !OAC) return Promise.resolve(null);
  const key = `${sampleRate}:${data.length}:${data.slice(-32)}`;
  let p = decodeCache.get(key);
  if (!p) {
    p = (async () => {
      try {
        const bytes = await (await fetch(data)).arrayBuffer();
        const ctx = new OAC(2, 1, sampleRate);
        return await ctx.decodeAudioData(bytes);
      } catch {
        return null;
      }
    })();
    decodeCache.set(key, p);
    if (decodeCache.size > 4) decodeCache.delete(decodeCache.keys().next().value as string);
  }
  return p;
}

/** Rentang waktu narasi di dalam video (detik). */
export function narrationSpan(n: NarrationDoc, buffer: AudioBuffer | null, duration: number) {
  if (!buffer) return null;
  const start = Math.max(0, Math.min(n.start || 0, Math.max(0, duration - 0.2)));
  const end = Math.min(duration, start + buffer.duration);
  if (end - start < 0.1) return null;
  return { start, end };
}

const mixCache = new Map<string, Promise<AudioBuffer | null>>();

/**
 * Campur musik + narasi (dengan ducking otomatis) jadi satu AudioBuffer.
 * Dipakai export supaya hasil MP4 dan preview memakai audio yang sama persis.
 */
export function renderSoundtrack(
  doc: ProjectDoc,
  duration: number,
  sampleRate = 44100
): Promise<AudioBuffer | null> {
  const OAC = offlineCtor();
  const narration = narrationOf(doc);
  const musicOn = doc.music.id !== 'none';
  const narrOn = narration.enabled && !!narration.data;
  if (!OAC || (!musicOn && !narrOn)) return Promise.resolve(null);

  const key = [
    doc.music.id,
    doc.music.volume,
    doc.audio?.data ? `${doc.audio.data.length}:${doc.audio.data.slice(-24)}` : '-',
    narration.enabled ? 1 : 0,
    narration.data ? `${narration.data.length}:${narration.data.slice(-28)}` : '-',
    narration.volume,
    narration.duckMusic ? 1 : 0,
    narration.start,
    duration.toFixed(2),
    sampleRate,
  ].join('|');

  let p = mixCache.get(key);
  if (p) return p;

  p = (async () => {
    try {
      const [music, narr] = await Promise.all([
        musicOn ? renderMusic(doc.music.id, duration, sampleRate, doc.audio?.data) : Promise.resolve(null),
        narrOn ? decodeAudioUri(narration.data as string, sampleRate) : Promise.resolve(null),
      ]);
      if (!music && !narr) return null;

      const ctx = new OAC(2, Math.ceil(sampleRate * (duration + 0.05)), sampleRate);
      const musicVol = doc.music.volume ?? 0.7;
      const span = narrationSpan(narration, narr, duration);

      if (music) {
        const src = ctx.createBufferSource();
        src.buffer = music;
        const gain = ctx.createGain();
        gain.gain.value = musicVol;
        src.connect(gain).connect(ctx.destination);
        src.start(0);

        if (span && narration.duckMusic) {
          const duck = Math.max(0.05, musicVol * 0.3);
          const fade = 0.25;
          gain.gain.setValueAtTime(musicVol, 0);
          if (span.start > fade) gain.gain.setValueAtTime(musicVol, span.start - fade);
          gain.gain.linearRampToValueAtTime(duck, span.start + 0.08);
          gain.gain.setValueAtTime(duck, Math.max(span.start + 0.08, span.end - fade));
          gain.gain.linearRampToValueAtTime(musicVol, span.end);
        }
      }

      if (narr && span) {
        const src = ctx.createBufferSource();
        src.buffer = narr;
        const gain = ctx.createGain();
        gain.gain.value = narration.volume ?? 1;
        src.connect(gain).connect(ctx.destination);
        src.start(span.start, 0, span.end - span.start);
      }

      return await ctx.startRendering();
    } catch {
      return null;
    }
  })();

  mixCache.set(key, p);
  if (mixCache.size > 4) mixCache.delete(mixCache.keys().next().value as string);
  return p;
}
