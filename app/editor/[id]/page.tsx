'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ProjectDoc } from '@/lib/studio/types';
import { loadProject } from '@/lib/studio/persist';
import Editor from '@/components/studio/Editor';

export default function EditorProjectPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [doc, setDoc] = useState<ProjectDoc | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    loadProject(id).then((d) => {
      if (!alive) return;
      if (d) setDoc(d);
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (missing)
    return (
      <div className="mk-page flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-mk-muted">Proyek tidak ditemukan atau belum tersimpan.</p>
        <Link href="/create" className="mk-btn-primary">
          Buat video baru
        </Link>
      </div>
    );
  if (!doc)
    return (
      <div className="mk-page flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-mk-coral" />
      </div>
    );
  return <Editor initialDoc={doc} />;
}
