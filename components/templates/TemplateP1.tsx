'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getAnimationVariants, TemplateProps } from './types';

/**
 * Template P1: Harga besar + stiker DISKON berkedip + foto produk
 * Kategori B: PROMO UMKM
 */
export default function TemplateP1({
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
  const productImg = background.imageUrl || '/images/coffee-product.jpg';

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-between p-6 select-none"
      style={{
        fontFamily: font,
        color: colors.textColor,
        background: `linear-gradient(160deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`,
      }}
    >
      {/* Blinking DISKON Sticker */}
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
          {script.extractedMeta.storeName}
        </span>
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4] }}
          transition={{ duration: 0.85, repeat: Infinity }}
          className="px-3.5 py-1.5 rounded-full font-black text-xs uppercase shadow-lg"
          style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
        >
          ⚡ DISKON SPESIAL!
        </motion.div>
      </div>

      {/* Product Photo Frame */}
      <motion.div
        key={'img-' + activeSceneIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mx-auto my-2 w-44 h-44 rounded-3xl overflow-hidden border-4 shadow-2xl"
        style={{ borderColor: colors.accentColor }}
      >
        <img
          src={productImg}
          alt={script.extractedMeta.productName}
          className="w-full h-full object-cover"
        />
        {showEmoji && (
          <span className="absolute bottom-2 right-2 text-2xl bg-black/60 backdrop-blur-sm w-9 h-9 rounded-full flex items-center justify-center">
            {scene.emoji}
          </span>
        )}
      </motion.div>

      {/* Main Headline & Jumbo Price */}
      <motion.div
        key={scene.id + activeSceneIndex}
        initial={variants.initial}
        animate={variants.animate}
        className="z-10 text-center space-y-2 bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15"
      >
        <h2 className="text-xl md:text-2xl font-extrabold leading-tight uppercase">
          {scene.text}
        </h2>

        <div
          className="inline-block px-4 py-1.5 rounded-xl font-black text-2xl tracking-wide shadow-md"
          style={{ backgroundColor: colors.accentColor, color: colors.badgeTextColor }}
        >
          {script.extractedMeta.priceText}
        </div>

        {showSubtitle && scene.subtext && (
          <p className="text-xs opacity-90 leading-snug">{scene.subtext}</p>
        )}
      </motion.div>
    </div>
  );
}
