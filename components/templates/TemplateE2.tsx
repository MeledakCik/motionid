'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TemplateProps } from './types';

/**
 * Template E2: Fakta mengejutkan + teks pop
 * Kategori C: EDUKASI / HOOK
 */
export default function TemplateE2({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none"
      style={{
        fontFamily: font,
        color: colors.textColor,
        backgroundColor: colors.bgPrimary,
      }}
    >
      {/* Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${colors.accentColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <motion.div
        key={scene.id + activeSceneIndex}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        className="relative z-10 space-y-4 max-w-sm"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg"
          style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
        >
          {showEmoji && <span>{scene.emoji}</span>}
          <span>FAKTA MENGEJUTKAN</span>
        </div>

        <div className="p-5 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/15 shadow-2xl">
          <h2 className="text-xl md:text-2xl font-extrabold leading-snug">
            {scene.text}
          </h2>
        </div>

        {showSubtitle && scene.subtext && (
          <p className="text-xs opacity-85 px-3">{scene.subtext}</p>
        )}
      </motion.div>
    </div>
  );
}
