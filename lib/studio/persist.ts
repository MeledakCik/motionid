import { createClient } from '@/lib/supabase/client';
import type { ProjectDoc } from './types';
import { analyzePrompt } from './prompt';
import { buildDoc } from './builder';

const LOCAL_KEY = (id: string) => `motionku:v6:${id}`;

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function saveLocal(doc: ProjectDoc) {
  try {
    localStorage.setItem(LOCAL_KEY(doc.id), JSON.stringify(doc));
  } catch {
    // penyimpanan penuh (foto besar) — abaikan, Supabase tetap dipakai
  }
}

export function loadLocal(id: string): ProjectDoc | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(id));
    return raw ? (JSON.parse(raw) as ProjectDoc) : null;
  } catch {
    return null;
  }
}

/** Simpan proyek. Mengembalikan id final (uuid Supabase bila berhasil). */
export async function saveProject(doc: ProjectDoc, thumb?: string): Promise<{ id: string; remote: boolean; error?: string }> {
  saveLocal(doc);
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { id: doc.id, remote: false };
    const row = {
      title: doc.title.slice(0, 80) || 'Video baru',
      topic: doc.plan.prompt.slice(0, 500),
      category: doc.plan.category,
      template_id: doc.templateId,
      script_json: { version: 6, doc },
      style_json: { aspectRatio: doc.aspect, intent: doc.plan.intent, thumb: thumb || null, scenes: doc.scenes.length },
      status: 'draft',
    };
    if (isUuid(doc.id)) {
      const { error } = await supabase.from('projects').update(row).eq('id', doc.id);
      if (error) return { id: doc.id, remote: false, error: error.message };
      return { id: doc.id, remote: true };
    }
    const { data, error } = await supabase.from('projects').insert({ ...row, user_id: user.id }).select('id').single();
    if (error || !data) return { id: doc.id, remote: false, error: error?.message };
    const finalDoc = { ...doc, id: data.id as string };
    saveLocal(finalDoc);
    await supabase.from('projects').update({ script_json: { version: 6, doc: finalDoc } }).eq('id', data.id);
    return { id: data.id as string, remote: true };
  } catch (e) {
    return { id: doc.id, remote: false, error: (e as Error).message };
  }
}

/** Muat proyek dari Supabase / lokal; proyek format lama dikonversi otomatis. */
export async function loadProject(id: string): Promise<ProjectDoc | null> {
  const local = loadLocal(id);
  if (!isUuid(id)) return local;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').select('id,title,topic,category,script_json').eq('id', id).single();
    if (error || !data) return local;
    const sj = data.script_json as { version?: number; doc?: ProjectDoc } | null;
    if (sj?.version === 6 && sj.doc) return { ...sj.doc, id: data.id };
    // proyek lama (v5): bangun ulang dari topik
    const plan = analyzePrompt(String(data.topic || data.title || ''), {});
    return buildDoc({ plan, id: data.id });
  } catch {
    return local;
  }
}

/** Kompres foto unggahan supaya ringan untuk HP & database (maks 1280px, JPEG 0.82). */
export async function compressImage(file: File, max = 1280): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const png = file.type === 'image/png' && file.size < 400_000;
    return c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
