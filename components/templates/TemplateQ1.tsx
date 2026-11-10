'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnimationVariants, GRADIENT_PRESETS, TemplateProps } from './types';

/**
 * Template Q1: Teks besar di tengah, background gradient bergerak
 * Kategori A: QUOTE / KATA-KATA
 */
export default function TemplateQ1({
  script,
  colors,
  font,
  background,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const variants = getAnimationVariants(scene.animation);

  const bgStyle =
    background.type === 'solid'
      ? { background: background.solidColor || colors.bgPrimary }
      : {
          background:
            GRADIENT_PRESETS[background.gradientPreset] ||
            `linear-gradient(135deg, ${colors.bgPrimary}, ${colors.bgSecondary})`,
        };

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-8 text-center select-none"
      style={{ ...bgStyle, fontFamily: font, color: colors.textColor }}
    >
      {/* Animated Floating Aura Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [-20, 25, -20],
          y: [-15, 20, -15],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: colors.accentColor }}
      />
      <motion.div
        animate={{
          scale: [1.2, 0.95, 1.2],
          x: [20, -25, 20],
          y: [20, -15, 20],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: colors.bgSecondary }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id + activeSceneIndex}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          className="relative z-10 max-w-md flex flex-col items-center gap-4"
        >
          {showEmoji && (
            <span className="text-4xl mb-1 drop-shadow-md">{scene.emoji}</span>
          )}

          <span
            className="text-[11px] uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ color: colors.accentColor }}
          >
            {scene.role}
          </span>

          <h2 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight drop-shadow-lg">
            {scene.text}
          </h2>

          {showSubtitle && scene.subtext && (
            <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-xs border-t border-white/15 pt-3 mt-1">
              {scene.subtext}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
