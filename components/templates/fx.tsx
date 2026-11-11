'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TemplateId } from '@/store/useEditorStore';

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface FXProps {
  templateId: TemplateId;
  accent: string;
  bpm: number;
  badgeText: string;
  textColor: string;
}

/** Efek latar khas tiap template (di atas konten, transparan, tidak bisa diklik). */
export default function TemplateFX({ templateId: id, accent, bpm, badgeText, textColor }: FXProps) {
  const items = useMemo(() => Array.from({ length: 26 }, (_, i) => i), []);
  const beat = 60 / Math.max(60, bpm);

  const layer = (children: React.ReactNode) => (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {children}
    </div>
  );

  switch (id) {
    case 'Q1': // cincin aura
      return layer(
        [0, 1, 2].map((k) => (
          <motion.div
            key={k}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: '90%',
              aspectRatio: '1',
              marginLeft: '-45%',
              marginTop: '-45%',
              border: `2px solid ${accent}`,
            }}
            initial={{ scale: 0.2, opacity: 0.4 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 3.4, delay: k * 1.1, repeat: Infinity, ease: 'easeOut' }}
          />
        ))
      );

    case 'Q2': // hujan
      return layer(
        items.map((i) => (
          <motion.span
            key={i}
            className="absolute block"
            style={{
              left: `${seeded(i, 9) * 110 - 5}%`,
              top: -120,
              width: 1.5,
              height: 60 + seeded(i, 7) * 70,
              background: 'rgba(255,255,255,0.22)',
              transform: 'rotate(12deg)',
            }}
            animate={{ y: [0, 1300] }}
            transition={{
              duration: 1 + seeded(i, 8),
              delay: seeded(i, 10) * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))
      );

    case 'Q3': // equalizer mengikuti BPM
      return layer(
        <div className="absolute bottom-6 left-0 right-0 h-24 flex items-end gap-[3px] px-1">
          {items.map((i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-sm"
              style={{ background: accent, opacity: 0.5, originY: 1, height: '100%' }}
              animate={{ scaleY: [0.15, 0.4 + seeded(i, 3) * 0.6, 0.2] }}
              transition={{
                duration: beat * (1 + seeded(i, 4)),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: seeded(i, 5) * beat,
              }}
            />
          ))}
        </div>
      );

    case 'P1': // confetti
      return layer(
        items.slice(0, 20).map((i) => (
          <motion.span
            key={i}
            className="absolute block"
            style={{
              left: `${seeded(i, 1) * 100}%`,
              top: -20,
              width: 10,
              height: 5,
              background: [accent, '#fff', '#fbbf24', '#fb7185'][i % 4],
              opacity: 0.85,
            }}
            animate={{ y: [0, 760], rotate: [0, 360 * (2 + seeded(i, 5) * 3)], x: [0, (seeded(i, 6) - 0.5) * 50] }}
            transition={{
              duration: 2.4 + seeded(i, 3) * 2.2,
              delay: seeded(i, 4) * 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))
      );

    case 'P2': { // pita promo berjalan
      const band = (pos: 'top' | 'bottom', bg: string, fg: string, text: string, dir: 1 | -1) => (
        <div
          className="absolute left-0 right-0 h-6 overflow-hidden flex items-center"
          style={{ [pos]: 0, background: bg, color: fg }}
        >
          <motion.div
            className="flex whitespace-nowrap text-[10px] font-black tracking-[0.2em]"
            animate={{ x: dir === 1 ? ['-50%', '0%'] : ['0%', '-50%'] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="px-3">
                {text} •
              </span>
            ))}
          </motion.div>
        </div>
      );
      return layer(
        <>
          {band('top', accent, badgeText, 'PROMO • HEMAT • DISKON', 1)}
          {band('bottom', 'rgba(0,0,0,0.6)', textColor, 'BANDINGKAN HARGANYA', -1)}
        </>
      );
    }

    case 'P3': // tepi berdenyut + garis scan
      return layer(
        <>
          <motion.div
            className="absolute inset-1.5 rounded-[1.6rem]"
            style={{ border: `4px solid ${accent}` }}
            animate={{ opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 1.05, repeat: Infinity }}
          />
          <motion.div
            className="absolute left-0 right-0 h-24"
            style={{ background: `linear-gradient(180deg, transparent, ${accent}30, transparent)` }}
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
          />
        </>
      );

    case 'E1': // grid melayang
      return layer(
        <motion.div
          className="absolute -inset-14"
          style={{
            backgroundImage: `linear-gradient(${accent}1a 1px, transparent 1px), linear-gradient(90deg, ${accent}1a 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
          animate={{ x: [0, 28], y: [0, 28] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      );

    case 'E2': // sinar bintang berputar
      return layer(
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            width: '240%',
            aspectRatio: '1',
            marginLeft: '-120%',
            marginTop: '-120%',
            background: `repeating-conic-gradient(${accent}18 0deg 10deg, transparent 10deg 20deg)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
      );

    case 'E3': { // simbol ? ! melayang
      const glyphs = ['?', '!', '?', '💡', '?', '!'];
      return layer(
        items.slice(0, 10).map((i) => (
          <motion.span
            key={i}
            className="absolute font-black"
            style={{
              left: `${seeded(i, 1) * 100}%`,
              bottom: -60,
              fontSize: 28 + seeded(i, 2) * 40,
              color: accent,
              opacity: 0.18,
            }}
            animate={{ y: [0, -820], rotate: [-20, 20, -20] }}
            transition={{
              duration: 6 + seeded(i, 3) * 6,
              delay: seeded(i, 4) * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {glyphs[i % glyphs.length]}
          </motion.span>
        ))
      );
    }

    default:
      return null;
  }
}
