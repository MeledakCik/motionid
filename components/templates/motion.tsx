"use client";

import React, { useEffect, useState } from 'react';
import {
  AnimationType,
  BackgroundStyle,
  ColorPalette,
  computeCursorChoreography,
  CursorAnimationMode,
  CursorVisualSkin,
  HeadlineAnim,
  SceneTransition,
} from '@/lib/smart-engine';

export interface AnimatedTextProps {
  text: string;
  animation?: AnimationType;
  headlineAnim?: HeadlineAnim;
  className?: string;
  accentColor?: string;
  highlightWords?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animation = 'pop',
  headlineAnim = 'word-pop',
  className = '',
  accentColor = '#38BDF8',
  highlightWords = true,
}) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);

  return (
    <div className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 ${className}`}>
      {words.map((word, idx) => {
        const isEmphasized =
          highlightWords && (idx === 0 || /\d|rp|promo|gratis|diskon|cuan|10x/i.test(word));
        const delayMs = idx * 65;

        let animStyle: React.CSSProperties = {
          transition: 'all 420ms cubic-bezier(0.22, 1.35, 0.36, 1)',
          transitionDelay: `${delayMs}ms`,
        };

        if (animation === 'slide-up' || headlineAnim === 'kinetic-slide') {
          animStyle = {
            ...animStyle,
            transform: `translateY(0px) rotate(${idx % 2 === 0 ? -1.2 : 1.2}deg)`,
          };
        } else if (animation === 'bounce' || headlineAnim === 'elastic-bounce') {
          animStyle = {
            ...animStyle,
            transform: `scale(${isEmphasized ? 1.08 : 1})`,
          };
        }

        return (
          <span
            key={`${word}-${idx}`}
            style={
              isEmphasized
                ? {
                    ...animStyle,
                    backgroundColor: `${accentColor}26`,
                    border: `1px solid ${accentColor}`,
                    color: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: '10px',
                    boxShadow: `0 0 22px ${accentColor}33`,
                  }
                : animStyle
            }
            className="inline-block"
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const KineticText = AnimatedText;

export interface KenBurnsProps {
  src?: string;
  alt?: string;
  className?: string;
  opacity?: number;
  sceneIndex?: number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
  src,
  alt = 'Scene Visual',
  className = '',
  opacity = 0.42,
  sceneIndex = 0,
}) => {
  if (!src) return null;
  const scale = sceneIndex % 2 === 0 ? 1.08 : 1.14;
  const rot = sceneIndex % 2 === 0 ? -1.2 : 1.2;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        style={{
          opacity,
          transform: `scale(${scale}) rotate(${rot}deg)`,
          transition: 'transform 2.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/50" />
    </div>
  );
};

export interface AmbientBackdropProps {
  colors: ColorPalette;
  bgStyle?: BackgroundStyle;
  imageUrl?: string;
  sceneIndex?: number;
}

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  colors,
  bgStyle = 'datapack-synth',
  imageUrl,
  sceneIndex = 0,
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: colors.gradient }}
    >
      {imageUrl && <KenBurns src={imageUrl} opacity={0.48} sceneIndex={sceneIndex} />}
      {bgStyle === 'grid-cyber' && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.accent}33 1px, transparent 1px), linear-gradient(to bottom, ${colors.accent}33 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
      )}
    </div>
  );
};

export interface SceneSwitcherProps {
  sceneIndex: number;
  transition?: SceneTransition;
  children: React.ReactNode;
}

export const SceneSwitcher: React.FC<SceneSwitcherProps> = ({
  sceneIndex,
  transition = 'whip-left',
  children,
}) => {
  return (
    <div
      key={`scene-switch-${sceneIndex}-${transition}`}
      data-transition={transition}
      className="relative h-full w-full overflow-hidden transition-all duration-500"
    >
      {children}
    </div>
  );
};

export interface CursorAnimationLayerProps {
  mode?: CursorAnimationMode;
  skin?: CursorVisualSkin;
  sceneIndex?: number;
  accentColor?: string;
}

/**
 * Layer Kursor Interaktif Real-Time (Single Pro @depup.web, Multi-Agent Swarm @voynann, & Tutorial Spotlight)
 */
export const CursorAnimationLayer: React.FC<CursorAnimationLayerProps> = ({
  mode = 'single-pro',
  skin = 'figma-pill',
  sceneIndex = 0,
  accentColor = '#38BDF8',
}) => {
  const [progress, setProgress] = useState(0.25);

  useEffect(() => {
    if (mode === 'off') return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const p = ((now - start) % 3200) / 3200;
      setProgress(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, sceneIndex]);

  if (mode === 'off') return null;

  const cursor = computeCursorChoreography(progress, sceneIndex, mode, skin);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {/* Spotlight Halo jika mode tutorial-spotlight */}
      {mode === 'tutorial-spotlight' && (
        <div
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 0 9999px rgba(4, 7, 19, 0.52), 0 0 42px ${accentColor}`,
          }}
          className="absolute h-28 w-28 rounded-full border-2 border-cyan-400/80 transition-all duration-75"
        />
      )}

      {/* Multi-Agent Swarm Cursors (@voynann style) */}
      {mode === 'multi-agent-swarm' &&
        cursor.swarmAgents.map((ag) => (
          <div
            key={ag.name}
            style={{
              left: `${ag.x}%`,
              top: `${ag.y}%`,
              transform: `translate(-4px, -4px) scale(${ag.isClicking ? 0.88 : 1})`,
            }}
            className="absolute flex items-start gap-1 transition-transform duration-75"
          >
            <svg width="16" height="20" viewBox="0 0 18 22" fill="none">
              <path
                d="M1.5 1.5L16 10.5L9.5 12.5L6.5 19.5L1.5 1.5Z"
                fill={ag.color}
                stroke="#070815"
                strokeWidth="1.6"
              />
            </svg>
            <span
              style={{ backgroundColor: ag.color }}
              className="rounded-full px-2 py-0.5 font-mono text-[9px] font-extrabold text-slate-950 shadow-md"
            >
              {ag.name} · {ag.actionTag}
            </span>
          </div>
        ))}

      {/* Main Director Cursor */}
      <div
        style={{
          left: `${cursor.x}%`,
          top: `${cursor.y}%`,
          transform: `translate(-4px, -4px) scale(${cursor.scale})`,
        }}
        className="absolute z-50 flex items-start gap-1.5"
      >
        {cursor.isClicking && (
          <span
            style={{ borderColor: accentColor }}
            className="absolute -left-4 -top-4 h-10 w-10 animate-ping rounded-full border-2 opacity-75"
          />
        )}
        <svg width="20" height="24" viewBox="0 0 18 22" fill="none" className="drop-shadow-lg">
          <path
            d="M1.5 1.5L16 10.5L9.5 12.5L6.5 19.5L1.5 1.5Z"
            fill={accentColor}
            stroke="#070815"
            strokeWidth="1.6"
          />
        </svg>
        <span
          style={{ backgroundColor: accentColor }}
          className="mt-2 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[10px] font-black text-slate-950 shadow-lg"
        >
          {cursor.activeLabel}
        </span>
      </div>
    </div>
  );
};

export interface MotionOverlayProps {
  accentColor?: string;
  showParticles?: boolean;
  cursorMode?: CursorAnimationMode;
  sceneIndex?: number;
}

export const MotionOverlay: React.FC<MotionOverlayProps> = ({
  accentColor = '#38BDF8',
  cursorMode = 'single-pro',
  sceneIndex = 0,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div
        className="absolute inset-3 rounded-2xl border opacity-30"
        style={{ borderColor: accentColor }}
      />
      <CursorAnimationLayer
        mode={cursorMode}
        sceneIndex={sceneIndex}
        accentColor={accentColor}
      />
    </div>
  );
};
