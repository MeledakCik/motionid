'use client';

import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { AnimationType, solveSpring } from '@/lib/smart-engine';

/* -------------------------------------------------------------------------- */
/* 1. AnimatedText: Staggered Word-by-Word Kinetic Typography (Opus 5.5)     */
/* -------------------------------------------------------------------------- */
const EASE = [0.22, 1, 0.36, 1] as const;

function wordVariants(animation: AnimationType): Variants {
  switch (animation) {
    case 'pop':
      return {
        hidden: { opacity: 0, scale: 0.45, y: 16, filter: 'blur(4px)' },
        show: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { type: 'spring', stiffness: 360, damping: 15 },
        },
      };
    case 'bounce':
      return {
        hidden: { opacity: 0, y: -44, scale: 0.75 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring', stiffness: 260, damping: 11 },
        },
      };
    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 1.75, filter: 'blur(8px)' },
        show: {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transition: { duration: 0.45, ease: EASE },
        },
      };
    case 'slide-up':
      return {
        hidden: { opacity: 0, y: 34, rotateX: -45 },
        show: {
          opacity: 1,
          y: 0,
          rotateX: 0,
          transition: { type: 'spring', stiffness: 240, damping: 16 },
        },
      };
    case 'typewriter':
      return {
        hidden: { opacity: 0, x: -8 },
        show: { opacity: 1, x: 0, transition: { duration: 0.14 } },
      };
    case 'fade':
    default:
      return {
        hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.5, ease: EASE },
        },
      };
  }
}

export interface AnimatedTextProps {
  text: string;
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  highlightColor?: string;
}

export function AnimatedText({
  text,
  animation = 'pop',
  className,
  style,
  delay = 0.05,
  highlightColor,
}: AnimatedTextProps) {
  const words = useMemo(() => (text || '').split(/(\s+)/), [text]);
  const variants = wordVariants(animation);
  const step = animation === 'typewriter' ? 0.065 : 0.08;

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block', perspective: 700, ...style }}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: step, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return <span key={i}>{' '}</span>;
        const important = highlightColor && /\d|^[A-Z0-9!?]{3,}$/.test(chunk);
        return (
          <motion.span
            key={i}
            variants={variants}
            style={{
              display: 'inline-block',
              willChange: 'transform, opacity',
              color: important ? highlightColor : undefined,
              padding: important ? '0 6px' : undefined,
              borderRadius: important ? '8px' : undefined,
              backgroundColor: important ? `${highlightColor}22` : undefined,
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

/* -------------------------------------------------------------------------- */
/* 2. KenBurns: Smooth Parallax Camera Drift on Images                        */
/* -------------------------------------------------------------------------- */
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
      initial={{ scale: 1.03, x: 0, y: 0 }}
      animate={{ scale: 1.18, x: 14 * dir, y: -8 }}
      transition={{ duration, ease: 'linear' }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 3. MotionOverlay: @depup.web Orbs + Autonomous Cursor Rig + Particles      */
/* -------------------------------------------------------------------------- */
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
        dur: 4.5 + seeded(i, 3) * 5.5,
        delay: seeded(i, 4) * 4,
        drift: (seeded(i, 5) - 0.5) * 45,
        opacity: 0.25 + seeded(i, 6) * 0.45,
      })),
    [intensity]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {/* Signature @depup.web Organic Ambient Glow Orb in Top-Right */}
      <motion.div
        key={`orb-${sceneKey}`}
        className="absolute -top-16 -right-12 w-60 h-60 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(163,230,53,0.38) 0%, ${accent}22 55%, transparent 75%)`,
        }}
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: [0.85, 1.15, 0.95], opacity: [0.5, 0.85, 0.6] }}
        transition={{ duration: Math.max(2.5, duration), repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating Bezier Data Particles */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: -12,
            width: p.size,
            height: p.size,
            background: i % 3 === 0 ? '#a3e635' : accent,
            filter: 'blur(0.5px)',
            opacity: 0,
          }}
          animate={{ y: [0, -900], x: [0, p.drift], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Autonomous Simulated AI Cursor + Click Ripple Choreography */}
      <motion.div
        key={`cursor-${sceneKey}`}
        className="absolute z-40 flex items-center gap-1.5"
        initial={{ left: '22%', top: '68%', scale: 1, opacity: 0 }}
        animate={{
          left: ['22%', '62%', '68%', '68%'],
          top: ['68%', '52%', '56%', '56%'],
          scale: [1, 1, 0.86, 1],
          opacity: [0, 0.95, 0.95, 0],
        }}
        transition={{
          duration: Math.min(3.2, Math.max(2.0, duration * 0.85)),
          times: [0, 0.5, 0.68, 1],
          ease: EASE,
        }}
      >
        <div className="relative">
          <motion.span
            className="absolute -inset-3 rounded-full border-2"
            style={{ borderColor: accent }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 2.1], opacity: [0, 0.8, 0] }}
            transition={{ delay: duration * 0.45, duration: 0.65, ease: 'easeOut' }}
          />
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path
              d="M2 2L2 20L6.8 15.8L10.2 22.5L13.4 21L10 14.2L16.5 14.2L2 2Z"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md"
          style={{ background: accent }}
        >
          AI Motion
        </span>
      </motion.div>

      {/* Diagonal Light Sweep on Scene Cut */}
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
        transition={{ duration: 0.85, ease: 'easeOut' }}
      />

      {/* Bottom Progress Bar */}
      <motion.div
        key={`bar-${sceneKey}`}
        className="absolute bottom-0 left-0 h-[3.5px]"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration, ease: 'linear' }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Helper Wrappers & Standalone DynamicMotionTemplate (@depup.web Style)  */
/* -------------------------------------------------------------------------- */
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.82 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const MotionWrapper: React.FC<{
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 230, damping: 16, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const GradientBackground: React.FC<{
  preset?: string;
  children: React.ReactNode;
  className?: string;
}> = ({
  preset = 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900',
  children,
  className = '',
}) => <div className={`${preset} ${className}`}>{children}</div>;

export interface DynamicMotionSceneProps {
  stepBadge?: string;
  title?: string;
  subtext?: string;
  widgetType?: 'repo_input_card' | 'repo_scanner_card' | 'terminal_build_card' | 'bento_metrics_grid';
  primaryInput?: string;
  secondaryBadge?: string;
  terminalLines?: string[];
  paletteId?: 'depup-lavender' | 'midnight-indigo' | 'aurora-mint' | 'cyber-sunset';
  progress?: number;
  fontFamily?: string;
}

export const DynamicMotionTemplate: React.FC<DynamicMotionSceneProps> = ({
  stepBadge = '1 Tempel',
  title = 'Tempel link repo',
  subtext = 'Repo private pun bisa, cukup tambahkan GitHub Token.',
  widgetType = 'repo_input_card',
  primaryInput = 'github.com/dimas/api',
  progress = 0.5,
}) => {
  const springVal = solveSpring(progress * 3.4, { stiffness: 210, damping: 15 });
  const words = title.split(' ');
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-7 overflow-hidden bg-gradient-to-br from-[#dcd6f7] via-[#ede9fe] to-[#f5f3ff]">
      <div className="relative z-10 mt-6 space-y-2.5 text-left">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 text-indigo-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {stepBadge}
        </span>
        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex flex-wrap gap-x-2">
          {words.map((w, idx) => (
            <span
              key={idx}
              style={{
                transform: `translateY(${(1 - springVal) * (16 + idx * 6)}px)`,
                minWidth: widgetType ? undefined : 'auto',
              }}
            >
              {w}
            </span>
          ))}
        </h2>
        <p className="text-sm text-zinc-600 font-medium">{subtext}</p>
        <div className="mt-4 p-4 rounded-2xl bg-white/95 shadow-xl border border-indigo-100 text-xs font-mono text-slate-800">
          {primaryInput}
        </div>
      </div>
    </div>
  );
};
