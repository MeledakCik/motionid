'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TemplateProps } from './types';

/**
 * Template Q3: Karaoke word-by-word (kata muncul satu-satu)
 * Kategori A: QUOTE / KATA-KATA
 */
export default function TemplateQ3({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const words = scene.text.split(/\s+/);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-7 text-center select-none"
      style={{
        fontFamily: font,
        color: colors.textColor,
        background: `radial-gradient(circle at center, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
      }}
    >
      {showEmoji && (
        <motion.div
          key={'emoji-' + activeSceneIndex}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-4xl mb-4"
        >
          {scene.emoji}
        </motion.div>
      )}

      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2.5 max-w-sm z-10">
        {words.map((word, idx) => (
          <motion.span
            key={`${activeSceneIndex}-${idx}-${word}`}
            initial={{ opacity: 0.15, scale: 0.85, y: 8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              backgroundColor: idx % 4 === 1 ? colors.accentColor : 'transparent',
              color: idx % 4 === 1 ? colors.badgeTextColor : colors.textColor,
            }}
            transition={{
              delay: idx * 0.14,
              duration: 0.28,
              type: 'spring',
              stiffness: 260,
            }}
            className="text-xl md:text-2xl font-extrabold px-2 py-0.5 rounded-lg"
          >
            {word}
          </motion.span>
        ))}
      </div>

      {showSubtitle && scene.subtext && (
        <motion.p
          key={'sub-' + activeSceneIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: words.length * 0.12 }}
          className="mt-6 text-xs px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm"
        >
          {scene.subtext}
        </motion.p>
      )}
    </div>
  );
}
