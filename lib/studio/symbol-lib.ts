/**
 * Pustaka "Komponen saya": komponen buatan user yang bisa dipakai di proyek lain.
 * Disimpan di perangkat (localStorage). Foto di dalam komponen ikut disematkan
 * supaya tetap tampil di proyek lain; komponen yang terlalu besar ditolak dengan jelas.
 */
import { createClient } from '@/lib/supabase/client';
import type { Layer, SymbolDef } from './types';

const KEY = 'motionku:symbols';
const MAX_BYTES = 1_500_000;

export function loadLibrary(): SymbolDef[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SymbolDef[]) : [];
    return Array.isArray(list) ? list.filter((s) => s && s.id && Array.isArray(s.children)) : [];
  } catch {
    return [];
  }
}

function inlineAssets(l: Layer, assets: Record<string, string>): Layer {
  if (l.kind === 'image' && assets[l.src]) return { ...l, src: assets[l.src] };
  if (l.kind === 'group') return { ...l, children: l.children.map((c) => inlineAssets(c, assets)) };
  return l;
}

/** Simpan ke pustaka. Mengembalikan pesan galat (bahasa sederhana) atau null bila berhasil. */
export function saveToLibrary(sym: SymbolDef, assets: Record<string, string>): string | null {
  const item: SymbolDef = { ...sym, children: sym.children.map((c) => inlineAssets(c, assets)) };
  const json = JSON.stringify(item);
  if (json.length > MAX_BYTES) return 'Komponen ini terlalu besar untuk disimpan (fotonya besar). Tetap bisa dipakai di proyek ini.';
  const list = loadLibrary().filter((s) => s.id !== sym.id);
  list.unshift(item);
  pushRemote(item);
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 60)));
    return null;
  } catch {
    return 'Penyimpanan perangkat penuh. Komponen tetap tersimpan di akunmu bila sudah masuk.';
  }
}

/* ------------------------- sinkron akun (Supabase) ------------------------- */

async function uidOrNull(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getUser();
    return data.user?.id || null;
  } catch {
    return null;
  }
}

function pushRemote(item: SymbolDef) {
  uidOrNull().then((uid) => {
    if (!uid) return;
    createClient()
      .from('user_components')
      .upsert({ id: item.id, user_id: uid, name: item.name, data: item, updated_at: new Date().toISOString() })
      .then(() => {}, () => {});
  });
}

/** Ambil komponen dari akun dan gabungkan dengan pustaka perangkat. Mengembalikan daftar terbaru. */
export async function syncLibrary(): Promise<SymbolDef[]> {
  const uid = await uidOrNull();
  const local = loadLibrary();
  if (!uid) return local;
  try {
    const { data, error } = await createClient().from('user_components').select('id,data').order('updated_at', { ascending: false }).limit(100);
    if (error || !data) return local;
    const remote = data.map((r) => r.data as SymbolDef).filter((s) => s && s.id && Array.isArray(s.children));
    // komponen lokal yang belum ada di akun ikut diunggah
    local.filter((l) => !remote.some((r) => r.id === l.id)).forEach(pushRemote);
    const merged = [...remote, ...local.filter((l) => !remote.some((r) => r.id === l.id))];
    try {
      localStorage.setItem(KEY, JSON.stringify(merged.slice(0, 60)));
    } catch {
      // abaikan
    }
    return merged;
  } catch {
    return local;
  }
}

export function removeFromLibrary(id: string) {
  uidOrNull().then((uid) => {
    if (uid) createClient().from('user_components').delete().eq('id', id).then(() => {}, () => {});
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(loadLibrary().filter((s) => s.id !== id)));
  } catch {
    // abaikan
  }
}
