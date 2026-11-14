import { renderMusic } from './music';

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
  private gain: GainNode | null = null;
  private musicId = 'none';
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

  setMusic(id: string, volume: number) {
    const changed = id !== this.musicId;
    this.musicId = id;
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    if (changed && this.playing) {
      this.stopAudio();
      void this.startAudio();
    }
  }

  private async startAudio() {
    if (this.musicId === 'none' || typeof window === 'undefined') return;
    try {
      const buf = await renderMusic(this.musicId, this.duration);
      if (!buf || !this.playing) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
      this.stopAudio();
      const src = this.audioCtx.createBufferSource();
      src.buffer = buf;
      this.gain = this.audioCtx.createGain();
      this.gain.gain.value = this.volume;
      src.connect(this.gain).connect(this.audioCtx.destination);
      this.audioOffset = this.time;
      this.audioStartedAt = this.audioCtx.currentTime;
      src.start(0, Math.min(this.time, buf.duration - 0.01));
      this.audioSrc = src;
    } catch {
      // audio opsional
    }
  }

  private stopAudio() {
    try {
      this.audioSrc?.stop();
    } catch {
      // abaikan
    }
    this.audioSrc = null;
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
      if (this.audioSrc && this.audioCtx) {
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
}
