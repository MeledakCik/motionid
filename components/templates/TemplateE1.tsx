'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getAnimationVariants, TemplateProps } from './types';
import { fontStack } from './fonts';
import { AnimatedText } from './motion';

/**
 * Template E1: "3 Cara..." dengan angka besar 1, 2, 3
 * Kategori C: EDUKASI / HOOK
 */
export default function TemplateE1({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const variants = getAnimationVariants(scene.animation);
  const displayStep = activeSceneIndex + 1;

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-between p-7 select-none"
      style={{
        fontFamily: fontStack(font),
        color: colors.textColor,
        background: `linear-gradient(145deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
      }}
    >
      {/* Giant Background Number Watermark */}
      <div
        className="absolute -right-4 -top-8 text-[160px] font-black leading-none opacity-10 pointer-events-none"
        style={{ color: colors.accentColor }}
      >
        0{displayStep}
      </div>

      {/* Step Badge Header */}
      <div className="relative z-10 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg"
          style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
        >
          {displayStep}
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest opacity-70 block">
            LANGKAH {displayStep} DARI {script.scenes.length}
          </span>
          <span className="text-xs font-bold" style={{ color: colors.accentColor }}>
            {scene.role}
          </span>
        </div>
      </div>

      {/* Main Educational Step Content */}
      <motion.div
        key={scene.id + activeSceneIndex}
        initial={variants.initial}
        animate={variants.animate}
        className="relative z-10 my-auto space-y-4"
      >
        {showEmoji && <span className="text-3xl inline-block">{scene.emoji}</span>}
        <h2 className="text-xl md:text-2xl font-bold leading-snug whitespace-pre-line">
          <AnimatedText text={scene.text} animation={scene.animation} highlightColor={colors.accentColor} />
        </h2>
        {showSubtitle && scene.subtext && (
          <div className="p-3.5 rounded-xl bg-white/10 border-l-4 text-xs leading-relaxed" style={{ borderColor: colors.accentColor }}>
            {scene.subtext}
          </div>
        )}
      </motion.div>

      {/* Step Dots Indicator */}
      <div className="relative z-10 flex items-center gap-2">
        {script.scenes.map((s, idx) => (
          <div
            key={s.id}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: idx === activeSceneIndex ? '2.5rem' : '0.75rem',
              backgroundColor: idx === activeSceneIndex ? colors.accentColor : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
