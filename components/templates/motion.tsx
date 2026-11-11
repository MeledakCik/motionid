'use client';

import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import type { AnimationType } from '@/lib/smart-engine';

/* ------------------------------------------------------------------ */
/* AnimatedText: teks muncul kata demi kata (stagger) sesuai animasi   */
/* ------------------------------------------------------------------ */
const EASE = [0.22, 1, 0.36, 1] as const;

function wordVariants(animation: AnimationType): Variants {
  switch (animation) {
    case 'pop':
      return {
        hidden: { opacity: 0, scale: 0.4, y: 12 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 16 } },
      };
    case 'bounce':
      return {
        hidden: { opacity: 0, y: -50 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 11 } },
      };
    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 1.8, filter: 'blur(8px)' },
        show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.45, ease: EASE } },
      };
    case 'slide-up':
      return {
        hidden: { opacity: 0, y: 34, rotateX: -50 },
        show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: EASE } },
      };
    case 'typewriter':
      return {
        hidden: { opacity: 0, x: -6 },
        show: { opacity: 1, x: 0, transition: { duration: 0.12 } },
      };
    case 'fade':
    default:
      return {
        hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
      };
  }
}

interface AnimatedTextProps {
  text: string;
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  /** warna kata penting (angka / harga / kata berhuruf besar) */
  highlightColor?: string;
}

export function AnimatedText({
  text,
  animation = 'fade',
  className,
  style,
  delay = 0.05,
  highlightColor,
}: AnimatedTextProps) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const variants = wordVariants(animation);
  const step = animation === 'typewriter' ? 0.07 : 0.085;

  let wordIndex = -1;
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block', perspective: 600, ...style }}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: step, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return <span key={i}>{' '}</span>;
        wordIndex += 1;
        const important = highlightColor && /\d|^[A-Z0-9!?]{3,}$/.test(chunk);
        return (
          <motion.span
            key={i}
            variants={variants}
            style={{
              display: 'inline-block',
              willChange: 'transform, opacity',
              color: important ? highlightColor : undefined,
            }}
            aria-hidden
          >
            {chunk}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* KenBurns: gambar bergerak pelan (zoom + geser)                      */
/* ------------------------------------------------------------------ */
export function KenBurns({
  src,
  alt,
  duration = 6,
  className,
  seed = 0,
}: {
  src: string;
  alt: string;
  duration?: number;
  className?: string;
  seed?: number;
}) {
  const dir = seed % 2 === 0 ? 1 : -1;
  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      initial={{ scale: 1.02, x: 0, y: 0 }}
      animate={{ scale: 1.18, x: 14 * dir, y: -8 }}
      transition={{ duration, ease: 'linear' }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* MotionOverlay: lapisan partikel, cahaya, vignette, wipe antar scene  */
/* ------------------------------------------------------------------ */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function MotionOverlay({
  accent,
  sceneKey,
  duration,
  intensity = 1,
}: {
  accent: string;
  sceneKey: string | number;
  duration: number;
  intensity?: number;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: Math.round(16 * intensity) }, (_, i) => ({
        left: seeded(i, 1) * 100,
        size: 3 + seeded(i, 2) * 7,
        dur: 5 + seeded(i, 3) * 6,
        delay: seeded(i, 4) * 5,
        drift: (seeded(i, 5) - 0.5) * 40,
        opacity: 0.25 + seeded(i, 6) * 0.45,
      })),
    [intensity]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {/* Partikel naik pelan */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: -12,
            width: p.size,
            height: p.size,
            background: accent,
            filter: 'blur(0.5px)',
            opacity: 0,
          }}
          animate={{ y: [0, -900], x: [0, p.drift], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Sapuan cahaya diagonal tiap pergantian scene */}
      <motion.div
        key={`sweep-${sceneKey}`}
        className="absolute -inset-y-10 w-1/3"
        style={{
          background: `linear-gradient(100deg, transparent, ${accent}55, transparent)`,
          transform: 'skewX(-18deg)',
          mixBlendMode: 'screen',
        }}
        initial={{ left: '-40%', opacity: 0.9 }}
        animate={{ left: '140%', opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* Wipe warna saat scene berganti */}
      <motion.div
        key={`wipe-${sceneKey}`}
        className="absolute inset-0"
        style={{ background: accent, transformOrigin: 'left center' }}
        initial={{ scaleX: 1, opacity: 0.55 }}
        animate={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.38) 100%)',
        }}
      />

      {/* Garis progress scene di bawah */}
      <motion.div
        key={`bar-${sceneKey}`}
        className="absolute bottom-0 left-0 h-[3px]"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration, ease: 'linear' }}
      />
    </div>
  );
}
