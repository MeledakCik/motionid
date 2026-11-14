'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { ProjectDoc } from '@/lib/studio/types';
import { canvasSize, docDuration } from '@/lib/studio/types';
import { Renderer } from '@/lib/studio/renderer';
import { ensureFonts } from '@/lib/studio/fonts';
import { getDeviceProfile } from '@/lib/studio/device';
import { PlaybackClock } from '@/lib/studio/clock';

/** Pemutar preview ringan (dipakai di halaman Create & Admin). */
export default function LivePreview({ doc, width = 300, className, withAudio = true }: { doc: ProjectDoc; width?: number; className?: string; withAudio?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const rendRef = useRef<Renderer | null>(null);
  const clockRef = useRef<PlaybackClock | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { w, h } = canvasSize(doc.aspect);
  const profile = getDeviceProfile();
  const pw = Math.min(profile.previewMaxW, Math.round(width * Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)));
  const ph = Math.round((pw * h) / w);

  useEffect(() => {
    const r = new Renderer({ allowBlur: profile.allowBlur, particleScale: profile.particleScale });
    rendRef.current = r;
    const clock = new PlaybackClock();
    clockRef.current = clock;
    let last = 0;
    const unsub = clock.subscribe((t, p) => {
      const now = performance.now();
      if (p && now - last < 1000 / profile.previewFps - 2) return;
      last = now;
      const c = ref.current;
      if (c && r.doc) r.render(c.getContext('2d', { alpha: false })!, c.width, c.height, t);
      if (barRef.current) barRef.current.style.width = `${(t / clock.duration) * 100}%`;
      setPlaying(p);
    });
    return () => {
      unsub();
      clock.dispose();
    };
  }, [profile]);

  useEffect(() => {
    const r = rendRef.current;
    const clock = clockRef.current;
    if (!r || !clock) return;
    r.setDoc(doc);
    r.onAssetLoaded = () => clock.seek(clock.time);
    clock.setDuration(docDuration(doc));
    clock.setMusic(withAudio ? doc.music.id : 'none', doc.music.volume);
    ensureFonts([doc.theme.headingFont, doc.theme.bodyFont, 'Anton', 'Montserrat', 'Playfair Display']).then(() => clock.seek(clock.time));
    clock.seek(0);
    // autoplay tanpa suara sampai user menekan tombol (kebijakan browser)
    clock.setMusic('none', 0);
    clock.play();
  }, [doc, withAudio]);

  const toggle = () => {
    const clock = clockRef.current;
    if (!clock) return;
    if (withAudio) clock.setMusic(doc.music.id, doc.music.volume);
    clock.toggle();
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[22px] border border-mk-line bg-black shadow-mk-card" style={{ width, aspectRatio: `${w}/${h}` }}>
        <canvas ref={ref} width={pw} height={ph} className="block h-full w-full" onClick={toggle} />
        <button type="button" onClick={toggle} className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur" aria-label={playing ? 'Jeda' : 'Putar dengan suara'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div ref={barRef} className="h-full bg-mk-coral" />
        </div>
      </div>
    </div>
  );
}
