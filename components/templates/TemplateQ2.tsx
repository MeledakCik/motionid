'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateProps } from './types';
import { fontStack } from './fonts';

/**
 * Template Q2: Typewriter + background foto blur
 * Kategori A: QUOTE / KATA-KATA
 */
export default function TemplateQ2({
  script,
  colors,
  font,
  background,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    setTypedText('');
    const fullText = scene.text;
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [scene.text, activeSceneIndex]);

  const bgImage = background.imageUrl || 'https://picsum.photos/seed/motionku-quote/720/1280';

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-center p-7 select-none"
      style={{ fontFamily: fontStack(font), color: colors.textColor, backgroundColor: colors.bgPrimary }}
    >
      {/* Background Photo Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 blur-md opacity-55 transition-all duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <motion.div
        key={scene.id + activeSceneIndex}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-black/45 backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          {showEmoji && <span className="text-xl">{scene.emoji}</span>}
        </div>

        <p className="text-xl md:text-2xl font-medium leading-relaxed min-h-[5.5rem]">
          {typedText}
          <span
            className="inline-block w-2 h-5 ml-1 align-middle animate-pulse"
            style={{ backgroundColor: colors.accentColor }}
          />
        </p>

        {showSubtitle && scene.subtext && (
          <p
            className="mt-4 text-xs italic opacity-85 border-l-2 pl-3"
            style={{ borderColor: colors.accentColor }}
          >
            {scene.subtext}
          </p>
        )}
      </motion.div>
    </div>
  );
}
