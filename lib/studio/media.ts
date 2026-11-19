/**
 * Penyimpanan klip video (gaya CapCut).
 * - Isi file disimpan di IndexedDB terpisah ("motionku-media") supaya dokumen proyek tetap kecil.
 * - Bila user login, file juga diunggah ke Supabase Storage (bucket "media", folder per user)
 *   sehingga proyek bisa dibuka di perangkat lain.
 * - Dokumen hanya menyimpan metadata (MediaInfo).
 */
import { createClient } from '@/lib/supabase/client';
import type { Layer, MediaInfo, ProjectDoc, VideoLayer } from './types';
import { uid } from './types';

export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const BUCKET = 'media';

function db(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      if (typeof indexedDB === 'undefined') return res(null);
      const r = indexedDB.open('motionku-media', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('blobs');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}

async function putBlob(id: string, blob: Blob): Promise<boolean> {
  const d = await db();
  if (!d) return false;
  return new Promise((res) => {
    try {
      const tx = d.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put(blob, id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    } catch {
      res(false);
    }
  });
}

async function getBlob(id: string): Promise<Blob | null> {
  const d = await db();
  if (!d) return null;
  return new Promise((res) => {
    try {
      const r = d.transaction('blobs').objectStore('blobs').get(id);
      r.onsuccess = () => res((r.result as Blob) || null);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}

const urlCache = new Map<string, Promise<string | null>>();
const blobCache = new Map<string, Blob>();

/** Baca durasi & ukuran video dari file. */
function probe(blob: Blob): Promise<{ duration: number; w: number; h: number }> {
  return new Promise((res, rej) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(blob);
    const done = (ok: boolean) => {
      const out = { duration: isFinite(v.duration) ? v.duration : 0, w: v.videoWidth || 1080, h: v.videoHeight || 1920 };
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      ok ? res(out) : rej(new Error('Format video ini tidak bisa dibuka browser. Coba MP4 (H.264).'));
    };
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => done(true);
    v.onerror = () => done(false);
    setTimeout(() => done(!!v.duration), 15000);
    v.src = url;
  });
}

/** Simpan file video baru. Melempar Error berbahasa sederhana bila gagal. */
export async function registerVideo(file: File): Promise<MediaInfo> {
  if (!file.type.startsWith('video/')) throw new Error('File ini bukan video.');
  if (file.size > MAX_VIDEO_BYTES) throw new Error(`Video terlalu besar (${Math.round(file.size / 1048576)} MB). Maksimal 300 MB.`);
  const meta = await probe(file);
  const info: MediaInfo = { id: uid('vid'), name: file.name, kind: 'video', mime: file.type || 'video/mp4', duration: meta.duration, w: meta.w, h: meta.h, size: file.size, hasAudio: true };
  blobCache.set(info.id, file);
  await putBlob(info.id, file);
  return info;
}

/** Sambungkan ulang file untuk media yang hilang (mis. dari proyek CapCut impor). */
export async function relinkVideo(info: MediaInfo, file: File): Promise<MediaInfo> {
  const meta = await probe(file);
  blobCache.set(info.id, file);
  urlCache.delete(info.id);
  await putBlob(info.id, file);
  return { ...info, name: file.name, mime: file.type || info.mime, duration: meta.duration, w: meta.w, h: meta.h, size: file.size, missing: false, remote: undefined };
}

/** Unggah ke cloud bila login. Mengembalikan path, atau null bila tidak login / gagal. */
export async function uploadVideo(info: MediaInfo): Promise<{ path: string | null; error?: string }> {
  try {
    const blob = blobCache.get(info.id) || (await getBlob(info.id));
    if (!blob) return { path: null, error: 'File tidak ditemukan di perangkat.' };
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { path: null };
    const ext = (info.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const path = `${user.id}/${info.id}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: info.mime });
    if (error) return { path: null, error: error.message };
    return { path };
  } catch (e) {
    return { path: null, error: (e as Error).message };
  }
}

/** URL yang bisa diputar (object URL lokal, atau signed URL cloud). */
export function mediaUrl(info: MediaInfo): Promise<string | null> {
  const hit = urlCache.get(info.id);
  if (hit) return hit;
  const p = (async () => {
    const local = blobCache.get(info.id) || (await getBlob(info.id));
    if (local) {
      blobCache.set(info.id, local);
      return URL.createObjectURL(local);
    }
    if (info.remote) {
      try {
        const { data } = await createClient().storage.from(BUCKET).createSignedUrl(info.remote, 60 * 60 * 6);
        return data?.signedUrl || null;
      } catch {
        return null;
      }
    }
    return null;
  })();
  urlCache.set(info.id, p);
  p.then((u) => !u && urlCache.delete(info.id));
  return p;
}

/** Isi file (untuk mengambil audio saat export). */
export async function mediaBlob(info: MediaInfo): Promise<Blob | null> {
  const local = blobCache.get(info.id) || (await getBlob(info.id));
  if (local) return local;
  const url = await mediaUrl(info);
  if (!url) return null;
  try {
    const b = await (await fetch(url)).blob();
    blobCache.set(info.id, b);
    putBlob(info.id, b);
    return b;
  } catch {
    return null;
  }
}

/** Waktu di file sumber untuk waktu lokal scene t. */
export function videoSourceTime(L: VideoLayer, t: number): number {
  const s = L.trimIn + Math.max(0, t - L.start) * (L.speed || 1);
  return Math.min(Math.max(L.trimIn, s), Math.max(L.trimIn, L.trimOut - 0.02));
}

/** Panjang klip di timeline (detik). */
export function clipLength(L: Pick<VideoLayer, 'trimIn' | 'trimOut' | 'speed'>): number {
  return Math.max(0.1, (L.trimOut - L.trimIn) / (L.speed || 1));
}

/** Klip video yang bersuara (untuk mixing export). */
export function videoAudioClips(doc: ProjectDoc): Array<{ info: MediaInfo; at: number; offset: number; dur: number; rate: number; vol: number }> {
  const out: Array<{ info: MediaInfo; at: number; offset: number; dur: number; rate: number; vol: number }> = [];
  let start = 0;
  for (const s of doc.scenes) {
    const walk = (l: Layer) => {
      if (l.kind === 'group') return l.children.forEach(walk);
      if (l.kind !== 'video' || l.hidden || l.muted || l.volume <= 0) return;
      const info = doc.media?.[l.mediaId];
      if (!info || info.missing || info.hasAudio === false) return;
      const end = Math.min(l.end ?? s.duration, s.duration, l.start + clipLength(l));
      const dur = end - l.start;
      if (dur > 0.02) out.push({ info, at: start + l.start, offset: l.trimIn, dur, rate: l.speed || 1, vol: l.volume });
    };
    s.layers.forEach(walk);
    start += s.duration;
  }
  return out;
}

/** Layer video baru memenuhi kanvas, durasi mengikuti klip (maks. sisa scene). */
export function makeVideoLayer(info: MediaInfo, W: number, H: number, sceneDur: number): VideoLayer {
  const ar = info.w / Math.max(1, info.h);
  let w = W;
  let h = W / ar;
  if (h < H) (h = H), (w = H * ar);
  const len = Math.min(info.duration || sceneDur, sceneDur);
  return {
    id: uid('ly'),
    kind: 'video',
    name: info.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 40) || 'Video',
    x: Math.round((W - w) / 2),
    y: Math.round((H - h) / 2),
    w: Math.round(w),
    h: Math.round(h),
    rotation: 0,
    opacity: 1,
    start: 0,
    end: len >= sceneDur - 0.01 ? null : Math.round(len * 100) / 100,
    mediaId: info.id,
    trimIn: 0,
    trimOut: info.duration || len,
    speed: 1,
    volume: 1,
    fit: 'cover',
    radius: 0,
  };
}
