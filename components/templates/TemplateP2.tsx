'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getAnimationVariants, TemplateProps } from './types';
import { fontStack } from './fonts';
import { AnimatedText } from './motion';

/**
 * Template P2: Before-After / List Harga
 * Kategori B: PROMO UMKM
 */
export default function TemplateP2({
  script,
  colors,
  font,
  activeSceneIndex = 0,
  showSubtitle = true,
  showEmoji = true,
}: TemplateProps) {
  const scene = script.scenes[activeSceneIndex] || script.scenes[0];
  const variants = getAnimationVariants(scene.animation);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-center p-6 select-none"
      style={{
        fontFamily: fontStack(font),
        color: colors.textColor,
        backgroundColor: colors.bgPrimary,
      }}
    >
      <motion.div
        key={scene.id + activeSceneIndex}
        initial={variants.initial}
        animate={variants.animate}
        className="space-y-4 z-10"
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-extrabold uppercase px-3 py-1 rounded-md"
            style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
          >
            BANDINGKAN HARGANYA
          </span>
          {showEmoji && <span className="text-2xl">{scene.emoji}</span>}
        </div>

        <h2 className="text-xl md:text-2xl font-bold leading-snug"><AnimatedText text={scene.text} animation={scene.animation} highlightColor={colors.accentColor} /></h2>

        {/* Before vs After Price Card */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-center">
            <span className="text-[10px] uppercase opacity-70 block">Harga Biasa</span>
            <span className="text-base font-bold line-through text-rose-300">
              {script.extractedMeta.originalPriceText}
            </span>
          </div>
          <div
            className="p-3 rounded-xl text-center shadow-lg"
            style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
          >
            <span className="text-[10px] uppercase font-bold block">Harga Promo</span>
            <span className="text-lg font-black">{script.extractedMeta.priceText}</span>
          </div>
        </div>

        {/* Checklist Keunggulan */}
        <div className="bg-black/30 rounded-xl p-3.5 space-y-2 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span style={{ color: colors.accentColor }}>✔</span>
            <span>Produk: {script.extractedMeta.productName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: colors.accentColor }}>✔</span>
            <span>Lokasi: {script.extractedMeta.storeName}</span>
          </div>
          {showSubtitle && scene.subtext && (
            <div className="flex items-start gap-2 pt-1 border-t border-white/10 opacity-85">
              <span style={{ color: colors.accentColor }}>★</span>
              <span>{scene.subtext}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
