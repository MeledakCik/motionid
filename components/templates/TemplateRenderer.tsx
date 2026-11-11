'use client';

import React from 'react';
import { TemplateId } from '@/store/useEditorStore';
import { motion } from 'framer-motion';
import { TemplateProps } from './types';
import { MotionOverlay } from './motion';
import TemplateFX from './fx';
import TemplateQ1 from './TemplateQ1';
import TemplateQ2 from './TemplateQ2';
import TemplateQ3 from './TemplateQ3';
import TemplateP1 from './TemplateP1';
import TemplateP2 from './TemplateP2';
import TemplateP3 from './TemplateP3';
import TemplateE1 from './TemplateE1';
import TemplateE2 from './TemplateE2';
import TemplateE3 from './TemplateE3';

interface DispatcherProps extends TemplateProps {
  templateId: TemplateId;
}

type Cam = { from: number; to: number; rotFrom: number; ease: 'linear' | 'easeOut' | [number, number, number, number] };
/** Gerak kamera khas tiap template. */
const CAMERA: Record<string, Cam> = {
  Q1: { from: 1, to: 1.045, rotFrom: 0, ease: 'linear' },
  Q2: { from: 1.06, to: 1, rotFrom: 0, ease: 'linear' }, // zoom-out pelan
  Q3: { from: 1, to: 1.03, rotFrom: -0.6, ease: 'linear' },
  P1: { from: 1.12, to: 1.02, rotFrom: 0, ease: [0.16, 1, 0.3, 1] }, // punch-in
  P2: { from: 1, to: 1.035, rotFrom: 0.8, ease: 'linear' },
  P3: { from: 1.04, to: 1.0, rotFrom: 0, ease: 'easeOut' },
  E1: { from: 1, to: 1.05, rotFrom: 0, ease: 'linear' },
  E2: { from: 0.9, to: 1.04, rotFrom: -1.5, ease: [0.34, 1.56, 0.64, 1] }, // pop-in
  E3: { from: 1, to: 1.04, rotFrom: 0.5, ease: 'linear' },
};

function renderTemplate(templateId: TemplateId, props: TemplateProps) {
  switch (templateId) {
    case 'Q1':
      return <TemplateQ1 {...props} />;
    case 'Q2':
      return <TemplateQ2 {...props} />;
    case 'Q3':
      return <TemplateQ3 {...props} />;
    case 'P1':
      return <TemplateP1 {...props} />;
    case 'P2':
      return <TemplateP2 {...props} />;
    case 'P3':
      return <TemplateP3 {...props} />;
    case 'E1':
      return <TemplateE1 {...props} />;
    case 'E2':
      return <TemplateE2 {...props} />;
    case 'E3':
      return <TemplateE3 {...props} />;
    default:
      return <TemplateP1 {...props} />;
  }
}

/**
 * Renderer: template + "kamera" push-in pelan + lapisan partikel/cahaya/wipe
 * yang aktif di semua template.
 */
export default function TemplateRenderer({ templateId, ...props }: DispatcherProps) {
  const idx = props.activeSceneIndex ?? 0;
  const scene = props.script.scenes[idx] || props.script.scenes[0];
  const duration = Number(scene?.duration) || 3;
  const sceneKey = `${scene?.id}-${idx}`;
  const cam = CAMERA[templateId] || CAMERA.Q1;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <motion.div
        key={sceneKey}
        className="absolute inset-0"
        initial={{ scale: cam.from, opacity: 0.6, rotate: cam.rotFrom }}
        animate={{ scale: cam.to, opacity: 1, rotate: 0 }}
        transition={{
          scale: { duration: duration + 0.5, ease: cam.ease },
          rotate: { duration: 0.8, ease: 'easeOut' },
          opacity: { duration: 0.35 },
        }}
      >
        {renderTemplate(templateId, props)}
      </motion.div>
      <TemplateFX
        templateId={templateId}
        accent={props.colors.accentColor}
        bpm={props.music?.bpm || 100}
        badgeText={props.colors.badgeTextColor}
        textColor={props.colors.textColor}
      />
      <MotionOverlay
        accent={props.colors.accentColor}
        sceneKey={sceneKey}
        duration={duration}
      />
    </div>
  );
}
