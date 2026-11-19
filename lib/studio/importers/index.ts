/** Pintu masuk impor: deteksi format otomatis dari isi file. */
import { ImportError, ImportResult } from './common';
import { importLottie, isLottie } from './lottie';
import { importAlight, isAlightXml } from './alight';
import { importCapcut, isCapcut } from './capcut';

export type { ImportResult } from './common';
export { ImportError } from './common';

export const IMPORT_ACCEPT = '.json,.xml,application/json,text/xml';

export function importText(text: string, file: string): ImportResult {
  const name = file.toLowerCase();
  const head = text.trimStart().slice(0, 1);
  if (name.endsWith('.xml') || head === '<') {
    if (!isAlightXml(text)) throw new ImportError('File XML ini tidak dikenali sebagai proyek Alight Motion.');
    return importAlight(text, file);
  }
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    if (/draft/i.test(name) || head !== '{')
      throw new ImportError('File ini terenkripsi atau bukan JSON biasa. Draft CapCut versi baru dan template dari pustaka CapCut dikunci oleh CapCut, jadi tidak bisa dibaca aplikasi lain. Pakai proyek yang kamu buat sendiri di CapCut desktop versi 5.x (file draft_content.json yang bisa dibuka di Notepad).');
    throw new ImportError('File JSON ini rusak atau tidak lengkap.');
  }
  if (isLottie(j)) return importLottie(j, file);
  if (isCapcut(j)) return importCapcut(j, file);
  throw new ImportError('Format JSON ini tidak dikenali. Yang didukung: animasi After Effects yang diekspor sebagai Lottie/Bodymovin (.json) dan draft CapCut desktop (draft_content.json).');
}

export async function importFile(file: File): Promise<ImportResult> {
  const n = file.name.toLowerCase();
  if (n.endsWith('.aep') || n.endsWith('.aepx'))
    throw new ImportError('File .aep tidak bisa dibaca langsung karena formatnya tertutup. Di After Effects, export dulu ke Lottie: pasang plugin Bodymovin atau LottieFiles, lalu Render ke .json (centang "embed images" kalau ada gambar).');
  if (n.endsWith('.lottie') || n.endsWith('.zip') || n.endsWith('.amp') || n.endsWith('.ampkg'))
    throw new ImportError('File paket/zip belum didukung. Untuk Lottie pilih file .json, untuk Alight Motion pilih file .xml di dalam paketnya.');
  if (file.type.startsWith('video/') || file.type.startsWith('image/')) throw new ImportError('Ini file video/gambar. Tambahkan lewat menu Media di editor.');
  if (file.size > 40 * 1024 * 1024) throw new ImportError('File terlalu besar untuk diimpor (maks. 40 MB).');
  return importText(await file.text(), file.name);
}
