/**
 * Musik prosedural (Web Audio) — dirender offline jadi AudioBuffer supaya
 * preview & export memakai audio yang identik dan sinkron frame-perfect.
 */

export interface MusicTrackDef {
  id: string;
  name: string;
  mood: string;
  bpm: number;
}

export const MUSIC_TRACKS: MusicTrackDef[] = [
  { id: 'none', name: 'Tanpa musik', mood: '-', bpm: 0 },
  { id: 'hype-beat', name: 'Hype Beat', mood: 'Energik', bpm: 124 },
  { id: 'bouncy-pop', name: 'Bouncy Pop', mood: 'Ceria', bpm: 116 },
  { id: 'corporate-pulse', name: 'Corporate Pulse', mood: 'Profesional', bpm: 108 },
  { id: 'acoustic-pagi', name: 'Acoustic Pagi', mood: 'Hangat', bpm: 96 },
  { id: 'lofi-senja', name: 'Lofi Senja', mood: 'Santai / Galau', bpm: 78 },
  { id: 'cinematic-gold', name: 'Cinematic Gold', mood: 'Mewah', bpm: 88 },
];

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

interface Recipe {
  chords: number[][];
  bass: 'saw' | 'triangle' | 'sine';
  pad: OscillatorType;
  kick: number[];
  snare: number[];
  hat: number;
  arp: boolean;
  swing: number;
  lowpass: number;
}

const RECIPES: Record<string, Recipe> = {
  'hype-beat': { chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], bass: 'saw', pad: 'sawtooth', kick: [0, 4, 8, 12], snare: [4, 12], hat: 2, arp: true, swing: 0, lowpass: 2600 },
  'bouncy-pop': { chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bass: 'triangle', pad: 'triangle', kick: [0, 6, 8, 14], snare: [4, 12], hat: 2, arp: true, swing: 0.08, lowpass: 3400 },
  'corporate-pulse': { chords: [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], bass: 'saw', pad: 'triangle', kick: [0, 8], snare: [4, 12], hat: 4, arp: true, swing: 0, lowpass: 2200 },
  'acoustic-pagi': { chords: [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], bass: 'triangle', pad: 'triangle', kick: [0, 10], snare: [8], hat: 4, arp: true, swing: 0.12, lowpass: 2800 },
  'lofi-senja': { chords: [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 62]], bass: 'sine', pad: 'sine', kick: [0, 7, 10], snare: [4, 12], hat: 2, arp: false, swing: 0.18, lowpass: 1500 },
  'cinematic-gold': { chords: [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]], bass: 'sine', pad: 'sawtooth', kick: [0], snare: [8], hat: 0, arp: false, swing: 0, lowpass: 1200 },
};

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: BaseAudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) {
    s = (s * 16807) % 2147483647;
    d[i] = (s / 2147483647) * 2 - 1;
  }
  noiseBuf = b;
  return b;
}

function schedule(ctx: BaseAudioContext, out: AudioNode, id: string, duration: number) {
  const track = MUSIC_TRACKS.find((t) => t.id === id);
  const R = RECIPES[id];
  if (!track || !R) return;
  const beat = 60 / track.bpm;
  const step = beat / 4;
  const steps = Math.ceil(duration / step) + 1;

  const master = ctx.createGain();
  master.gain.value = 0.9;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = R.lowpass;
  lp.connect(master);
  master.connect(out);
  // fade in / out
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.9, 0.6);
  master.gain.setValueAtTime(0.9, Math.max(0.7, duration - 1.2));
  master.gain.linearRampToValueAtTime(0, duration);

  const nz = noise(ctx);
  for (let i = 0; i < steps; i++) {
    const swing = i % 2 ? R.swing * step : 0;
    const t = i * step + swing;
    if (t > duration) break;
    const s16 = i % 16;
    const bar = Math.floor(i / 16);
    const chord = R.chords[bar % R.chords.length];

    if (R.kick.includes(s16)) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.32);
    }
    if (R.snare.includes(s16)) {
      const src = ctx.createBufferSource();
      src.buffer = nz;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      src.connect(bp).connect(g).connect(master);
      src.start(t, (i * 0.013) % 0.8, 0.2);
    }
    if (R.hat && s16 % R.hat === 0) {
      const src = ctx.createBufferSource();
      src.buffer = nz;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(s16 % 4 === 2 ? 0.09 : 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      src.connect(hp).connect(g).connect(master);
      src.start(t, (i * 0.031) % 0.9, 0.06);
    }
    // bass tiap 1/8
    if (s16 % 2 === 0) {
      const o = ctx.createOscillator();
      o.type = R.bass === 'saw' ? 'sawtooth' : R.bass;
      const f = NOTE(chord[0] - 24 + (s16 === 14 ? 7 : 0));
      o.frequency.setValueAtTime(f, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(R.bass === 'saw' ? 0.11 : 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + step * 1.8);
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = 500;
      o.connect(f2).connect(g).connect(lp);
      o.start(t);
      o.stop(t + step * 2);
    }
    // pad tiap awal bar
    if (s16 === 0) {
      const len = beat * 4;
      chord.forEach((n) => {
        const o = ctx.createOscillator();
        o.type = R.pad;
        o.frequency.value = NOTE(n);
        o.detune.value = (n % 3) * 4 - 4;
        const g = ctx.createGain();
        const peak = R.pad === 'sawtooth' ? 0.025 : 0.05;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + Math.min(0.4, len * 0.2));
        g.gain.setValueAtTime(peak, t + len * 0.8);
        g.gain.linearRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + len + 0.05);
      });
    }
    // arpeggio
    if (R.arp && s16 % 2 === 1) {
      const n = chord[(i >> 1) % chord.length] + 12;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = NOTE(n);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.022, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.9);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + step);
    }
  }
}

const cache = new Map<string, Promise<AudioBuffer | null>>();

export function renderMusic(id: string, duration: number, sampleRate = 44100): Promise<AudioBuffer | null> {
  if (!id || id === 'none' || typeof window === 'undefined') return Promise.resolve(null);
  const OAC = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!OAC) return Promise.resolve(null);
  const key = `${id}:${duration.toFixed(2)}:${sampleRate}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      try {
        const ctx = new OAC(2, Math.ceil(sampleRate * (duration + 0.05)), sampleRate);
        schedule(ctx, ctx.destination, id, duration);
        return await ctx.startRendering();
      } catch {
        return null;
      }
    })();
    cache.set(key, p);
    if (cache.size > 6) cache.delete(cache.keys().next().value as string);
  }
  return p;
}
