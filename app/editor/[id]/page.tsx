'use client';

import React from 'react';
import MotionStudioEngine from '@/components/studio/MotionStudioEngine';

export default function EditorByIdPage({ params }: { params: { id: string } }) {
  return <MotionStudioEngine initialRole="user" projectId={params.id} />;
}
