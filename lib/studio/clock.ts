import { renderMusic } from './music';
import { decodeAudioUri, narrationSpan } from './narration';
import type { NarrationDoc } from './types';

/**
 * Jam playback editor. Tidak memakai React state per frame (penyebab preview patah-patah
 * di HP), tapi pub/sub langsung ke kanvas & playhead.
 */
type Listener = (t: number, playing: boolean) => void;

export class PlaybackClock {
  time = 0;
  duration = 1;
  playing = false;
  loop = true;
  private listeners = new Set<Listener>();
  private raf = 0;
  private last = 0;
  private audioCtx: AudioContext | null = null;
  private audioSrc: AudioBufferSourceNode | null = null;
  private narrSrc: AudioBufferSourceNode | null = null;
  private syncNode: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private narrGain: GainNode | null = null;
  private musicId = 'none';
  private upload: string | null = null;
  private narration: NarrationDoc | null = null;
  private narrationKey = '-';
  private volume = 0.7;
  private audioStartedAt = 0;
  private audioOffset = 0;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.time, this.playing));
  }

  setDuration(d: number) {
    this.duration = Math.max(0.5, d);
    if (this.time > this.duration) this.time = 0;
  }

  /** `narration` opsional: narasi/voice over yang diputar bersama musik. */
  setMusic(id: string, volume: number, upload?: string | null, narration?: NarrationDoc | null) {
    const n = narration || null;
    const key = n
      ? [
          n.enabled ? 1 : 0,
          n.data ? `${n.data.length}:${n.data.slice(-24)}` : '-',
          n.volume,
          n.duckMusic ? 1 : 0,
          n.start,
        ].join(':')
      : '-';
    const changed =
      id !== this.musicId ||
      (id === 'upload' && (upload || null) !== this.upload) ||
      key !== this.narrationKey;

    this.upload = upload || null;
    this.musicId = id;
    this.narration = n;
    this.narrationKey = key;
    this.volume = volume;

    if (this.musicGain) this.musicGain.gain.value = volume;
    if (this.narrGain && n) this.narrGain.gain.value = n.volume ?? 1;
    if (changed && this.playing) {
      this.stopAudio();
      void this.startAudio();
    }
  }

  private async startAudio() {
    if (typeof window === 'undefined') return;
    const n = this.narration;
    const musicOn = this.musicId !== 'none';
    const narrOn = !!(n && n.enabled && n.data);
    if (!musicOn && !narrOn) return;

    try {
      const [music, narr] = await Promise.all([
        musicOn ? renderMusic(this.musicId, this.duration, 44100, this.upload) : Promise.resolve(null),
        narrOn ? decodeAudioUri(n!.data as string, 44100) : Promise.resolve(null),
      ]);
      if ((!music && !narr) || !this.playing) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

      this.stopAudio();
      const ctx = this.audioCtx;
      const start = this.time;
      const span = narr ? narrationSpan(n!, narr, this.duration) : null;
      const now = ctx.currentTime;

      if (music) {
        const src = ctx.createBufferSource();
        src.buffer = music;
        const gain = ctx.createGain();
        gain.gain.value = this.volume;
        const duck = ctx.createGain();
        duck.gain.setValueAtTime(1, now);

        // Ducking: musik mengecil selama narasi berbunyi, lalu kembali.
        if (span && n!.duckMusic && span.end > start) {
          const rel = (t: number) => Math.max(0, t - start);
          const duckStart = rel(span.start);
          const duckEnd = rel(span.end);
          if (duckStart > 0.25) duck.gain.setValueAtTime(1, now + duckStart - 0.25);
          duck.gain.linearRampToValueAtTime(0.3, now + duckStart + 0.08);
          duck.gain.setValueAtTime(0.3, now + Math.max(duckStart + 0.08, duckEnd - 0.28));
          duck.gain.linearRampToValueAtTime(1, now + duckEnd);
        }

        src.connect(gain).connect(duck).connect(ctx.destination);
        src.start(0, Math.min(start, Math.max(0, music.duration - 0.01)));
        this.audioSrc = src;
        this.musicGain = gain;
      }

      if (narr && span) {
        const offset = start - span.start;
        if (offset < span.end - span.start - 0.02) {
          const src = ctx.createBufferSource();
          src.buffer = narr;
          const gain = ctx.createGain();
          gain.gain.value = n!.volume ?? 1;
          src.connect(gain).connect(ctx.destination);
          src.start(0, Math.max(0, offset));
          this.narrSrc = src;
          this.narrGain = gain;
        }
      }

      this.syncNode = this.audioSrc || this.narrSrc;
      this.audioOffset = start;
      this.audioStartedAt = ctx.currentTime;
    } catch {
      // audio opsional
    }
  }

  private stopAudio() {
    try {
      this.audioSrc?.stop();
      this.narrSrc?.stop();
    } catch {
      // abaikan
    }
    this.audioSrc = null;
    this.narrSrc = null;
    this.syncNode = null;
  }

  play() {
    if (this.playing) return;
    if (this.time >= this.duration - 0.02) this.time = 0;
    this.playing = true;
    this.last = performance.now();
    void this.startAudio();
    const step = (now: number) => {
      if (!this.playing) return;
      // sinkron ke jam audio bila ada (anti drift)
      if (this.syncNode && this.audioCtx) {
        this.time = this.audioOffset + (this.audioCtx.currentTime - this.audioStartedAt);
      } else {
        this.time += Math.min(0.1, (now - this.last) / 1000);
      }
      this.last = now;
      if (this.time >= this.duration) {
        if (this.loop) {
          this.time = 0;
          this.stopAudio();
          void this.startAudio();
        } else {
          this.time = this.duration;
          this.pause();
          return;
        }
      }
      this.emit();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
    this.emit();
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.stopAudio();
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(t: number) {
    this.time = Math.max(0, Math.min(this.duration, t));
    if (this.playing) {
      this.stopAudio();
      void this.startAudio();
    }
    this.emit();
  }

  dispose() {
    this.pause();
    this.listeners.clear();
    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
  }

  /** Narasi yang sedang dipakai (dipakai UI untuk pratinjau teks). */
  currentNarration(): NarrationDoc | null {
    return this.narration;
  }
}
