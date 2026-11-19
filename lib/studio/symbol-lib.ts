/**
 * Pustaka "Komponen saya": komponen buatan user yang bisa dipakai di proyek lain.
 * Disimpan di perangkat (localStorage). Foto di dalam komponen ikut disematkan
 * supaya tetap tampil di proyek lain; komponen yang terlalu besar ditolak dengan jelas.
 */
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
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 60)));
    return null;
  } catch {
    return 'Penyimpanan perangkat penuh. Hapus beberapa komponen lama dulu.';
  }
}

export function removeFromLibrary(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadLibrary().filter((s) => s.id !== id)));
  } catch {
    // abaikan
  }
}
