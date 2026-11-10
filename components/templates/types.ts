import { AnimationType, ColorPalette, GeneratedScriptResult, MusicTrack } from '@/lib/smart-engine';
import { FontFamilyName } from '@/store/useEditorStore';

export interface TemplateProps {
  script: GeneratedScriptResult;
  colors: ColorPalette;
  font: FontFamilyName;
  music: MusicTrack;
  background: {
    type: 'solid' | 'gradient' | 'picsum' | 'unsplash' | 'upload';
    solidColor: string;
    gradientPreset: string;
    imageUrl?: string;
  };
  activeSceneIndex?: number;
  showSubtitle?: boolean;
  showEmoji?: boolean;
  showProgressBar?: boolean;
  progress?: number;
}

export function getAnimationVariants(animation: AnimationType) {
  switch (animation) {
    case 'pop':
      return {
        initial: { scale: 0.5, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 18 } },
        exit: { scale: 0.8, opacity: 0 },
      };
    case 'slide-up':
      return {
        initial: { y: 60, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
        exit: { y: -40, opacity: 0 },
      };
    case 'bounce':
      return {
        initial: { y: -80, scale: 0.85, opacity: 0 },
        animate: {
          y: [0, -14, 0],
          scale: 1,
          opacity: 1,
          transition: { duration: 0.6, ease: 'easeOut' },
        },
        exit: { opacity: 0 },
      };
    case 'zoom':
      return {
        initial: { scale: 1.45, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
        exit: { scale: 0.7, opacity: 0 },
      };
    case 'typewriter':
      return {
        initial: { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
        animate: { clipPath: 'inset(0 0% 0 0)', opacity: 1, transition: { duration: 0.9, ease: 'linear' } },
        exit: { opacity: 0 },
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.5 } },
        exit: { opacity: 0 },
      };
  }
}

export const GRADIENT_PRESETS: Record<string, string> = {
  'aurora-night': 'linear-gradient(135deg, #090D16 0%, #1E1B4B 50%, #311042 100%)',
  'fire-sale': 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 55%, #EA580C 100%)',
  'ocean-tech': 'linear-gradient(135deg, #090D16 0%, #0F172A 45%, #1D4ED8 100%)',
  'deep-violet': 'linear-gradient(135deg, #180926 0%, #4C1D95 50%, #701A75 100%)',
  'crimson-amber': 'linear-gradient(135deg, #450A0A 0%, #991B1B 50%, #D97706 100%)',
  'indigo-sky': 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #0284C7 100%)',
};
