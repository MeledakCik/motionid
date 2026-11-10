'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAnimationVariants, TemplateProps } from './types';

/**
 * Template P3: Countdown Promo
 * Kategori B: PROMO UMKM
 */
export default function TemplateP3({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const variants = getAnimationVariants(scene.animation);
  const [secondsLeft, setSecondsLeft] = useState(59);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-between p-6 text-center select-none"
      style={{
        fontFamily: font,
        color: colors.textColor,
        background: `linear-gradient(180deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
      }}
    >
      {/* Top Countdown Bar */}
      <div className="z-10 space-y-1.5">
        <span className="text-[10px] uppercase tracking-widest opacity-80 block">
          BERAKHIR DALAM HITUNGAN DETIK
        </span>
        <div className="flex items-center justify-center gap-2">
          {['00', '14', String(secondsLeft).padStart(2, '0')].map((unit, idx) => (
            <React.Fragment key={idx}>
              <div
                className="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-lg shadow-md"
                style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
              >
                <span>{unit}</span>
              </div>
              {idx < 2 && <span className="font-black text-lg">:</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={scene.id + activeSceneIndex}
        initial={variants.initial}
        animate={variants.animate}
        className="z-10 my-auto space-y-3"
      >
        {showEmoji && <div className="text-4xl">{scene.emoji}</div>}
        <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight tracking-wide">
          {scene.text}
        </h2>
        {showSubtitle && scene.subtext && (
          <p className="text-xs opacity-90 bg-black/30 px-3 py-2 rounded-xl">
            {scene.subtext}
          </p>
        )}
      </motion.div>

      {/* Bottom Price CTA Banner */}
      <div className="z-10 bg-black/40 border border-white/20 rounded-2xl p-3 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] uppercase opacity-75 block">Promo Hari Ini</span>
          <span className="text-lg font-black" style={{ color: colors.accentColor }}>
            {script.extractedMeta.priceText}
          </span>
        </div>
        <span
          className="px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase"
          style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
        >
           Klaim Sekarang
        </span>
      </div>
    </div>
  );
}
