import type { Metadata } from 'next';
import DeepResearchStudio from '@/components/admin/DeepResearchStudio';

export const metadata: Metadata = {
  title: 'Motion Lab — Riset Gerak MotionID',
  description: 'Riset motion graphics 2D/3D, kinetic type, dan transisi dari alur kerja CapCut, Illustrator, Figma, Alight Motion, dan Premiere.',
  robots: { index: false, follow: false },
};

export default function AdminResearchPage() {
  return <DeepResearchStudio />;
}
