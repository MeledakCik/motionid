"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import MotionStudioEngine from '@/components/studio/MotionStudioEngine';

export default function EditorProjectPage() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : 'default';
  return <MotionStudioEngine mode="user" projectId={projectId} />;
}
