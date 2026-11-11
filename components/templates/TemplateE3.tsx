'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getAnimationVariants, TemplateProps } from './types';
import { fontStack } from './fonts';
import { AnimatedText } from './motion';

/**
 * Template E3: Q&A / Tebak-tebakan
 * Kategori C: EDUKASI / HOOK
 */
export default function TemplateE3({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const variants = getAnimationVariants(scene.animation);
  const isQuestionScene = activeSceneIndex === 0 || activeSceneIndex === 3;

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-center p-6 select-none"
      style={{
        fontFamily: fontStack(font),
        color: colors.textColor,
        background: `linear-gradient(135deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
      }}
    >
      <motion.div
        key={scene.id + activeSceneIndex}
        initial={variants.initial}
        animate={variants.animate}
        className="relative z-10 space-y-4"
      >
        {/* Q&A Header Bubble */}
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-lg font-black text-xs uppercase"
            style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
          >
            {isQuestionScene ? '❓ TEBAK CEPAT' : '💡 JAWABAN FAKTA'}
          </span>
          {showEmoji && <span className="text-2xl">{scene.emoji}</span>}
        </div>

        {/* Main Chat / Quiz Card */}
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl space-y-3">
          <h2 className="text-xl font-bold leading-snug"><AnimatedText text={scene.text} animation={scene.animation} highlightColor={colors.accentColor} /></h2>

          {showSubtitle && scene.subtext && (
            <p className="text-xs opacity-80 pt-2 border-t border-white/10">
              {scene.subtext}
            </p>
          )}
        </div>

        {/* Interactive Option Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
            >
              A
            </span>
            <span>Sudah Tahu</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
            >
              B
            </span>
            <span>Baru Tahu!</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
