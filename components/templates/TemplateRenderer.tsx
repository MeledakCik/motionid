'use client';

import React from 'react';
import { TemplateId } from '@/store/useEditorStore';
import { TemplateProps } from './types';
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

export default function TemplateRenderer({ templateId, ...props }: DispatcherProps) {
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
