/**
 * "Cara pembuatan": menerjemahkan isi scene menjadi langkah-langkah berbahasa sederhana
 * (urutan munculnya elemen, bentuk, keyframe, kurva gerak) supaya user bisa belajar
 * dari template / proyek impor, lalu meniru atau mengubahnya.
 */
import type { Keyframe, Layer, ProjectDoc, Scene } from './types';
import { canvasSize } from './types';
import { getAnimation } from './packs/animations';
import { getComponent } from './packs/components';
import { getTransition } from './packs/transitions';
import { getEffect } from './packs/effects';
import { KEY_EASES } from './vector';
import { clipLength } from './media';

export interface Step {
  t: number;
  layerId?: string;
  title: string;
  details: string[];
}

const sec = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString('id-ID')} dtk`;
const mmss = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const pct = (v: number) => `${Math.round(v * 100)}%`;

const SHAPE: Record<string, string> = { rect: 'persegi', circle: 'elips', triangle: 'segitiga', star: 'bintang', blob: 'blob bergerak', arrow: 'panah', line: 'garis' };

export function easeLabel(k: Keyframe): string {
  if (k.ease === 'custom' && k.bez) return `kurva sendiri (${k.bez.map((v) => v.toFixed(2)).join(', ')})${k.bez[1] > 1 || k.bez[3] > 1 ? ', ada efek membal' : ''}`;
  return KEY_EASES.find((e) => e.id === k.ease)?.label.toLowerCase() || k.ease;
}

/** Ringkas perubahan antara dua keyframe. */
export function describeMove(a: Keyframe, b: Keyframe): string {
  const parts: string[] = [];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    const dir = [Math.abs(dx) > 4 ? (dx > 0 ? 'kanan' : 'kiri') : '', Math.abs(dy) > 4 ? (dy > 0 ? 'bawah' : 'atas') : ''].filter(Boolean).join(' ');
    parts.push(`geser ke ${dir} ${Math.round(Math.hypot(dx, dy))} px`);
  }
  if (Math.abs(b.scale - a.scale) > 0.01) parts.push(`skala ${pct(a.scale)} → ${pct(b.scale)}`);
  if (Math.abs(b.rotation - a.rotation) > 0.5) parts.push(`putar ${Math.round(b.rotation - a.rotation)}°`);
  if (Math.abs(b.opacity - a.opacity) > 0.01) parts.push(a.opacity < 0.02 ? 'muncul (transparan → terlihat)' : b.opacity < 0.02 ? 'menghilang' : `transparansi ${pct(a.opacity)} → ${pct(b.opacity)}`);
  if (!parts.length) parts.push('diam di tempat (jeda)');
  return `${sec(a.t)} → ${sec(b.t)}: ${parts.join(', ')} · gerak ${a.ease === 'snap' ? 'loncat' : easeLabel(a)}`;
}

function titleOf(l: Layer, doc: ProjectDoc): string {
  switch (l.kind) {
    case 'text':
      return `Tulis teks “${l.text.replace(/\s+/g, ' ').slice(0, 40)}${l.text.length > 40 ? '…' : ''}”`;
    case 'shape':
      return `Gambar ${SHAPE[l.shape] || 'bentuk'} “${l.name}”`;
    case 'path':
      return l.closed ? `Gambar bentuk vektor “${l.name}” dengan pena (${l.points.length} titik)` : `Tarik garis/kurva vektor “${l.name}” (${l.points.length} titik)`;
    case 'image':
      return `Masukkan foto “${l.name}”`;
    case 'icon':
      return `Tambah ikon “${l.name}”`;
    case 'component':
      return `Pasang elemen siap pakai “${getComponent(l.componentId)?.name || l.name}”`;
    case 'group': {
      if (l.symbolId) return `Pakai komponen “${doc.symbols?.[l.symbolId]?.name || l.name}” (${l.children.length} elemen)`;
      if (l.mask) return `Buat grup mask “${l.name}”: elemen paling bawah memotong ${l.children.length - 1} elemen lain`;
      return `Susun grup “${l.name}” (${l.children.length} elemen)`;
    }
    case 'video':
      return `Masukkan klip video “${l.name}”`;
  }
}

function detailsOf(l: Layer, doc: ProjectDoc, sceneDur: number): string[] {
  const d: string[] = [];
  const end = l.end ?? sceneDur;
  d.push(`Tampil ${sec(l.start)} sampai ${l.end === null ? 'akhir scene' : sec(end)} · posisi tengah (${Math.round(l.x + l.w / 2)}, ${Math.round(l.y + l.h / 2)}) · ukuran ${Math.round(l.w)}×${Math.round(l.h)}${l.rotation ? ` · putar ${Math.round(l.rotation)}°` : ''}${l.opacity < 1 ? ` · transparansi ${pct(l.opacity)}` : ''}`);
  if (l.kind === 'text') d.push(`Font ${l.font} ${Math.round(l.size)} px, tebal ${l.weight}, warna ${l.color}${l.stroke ? `, outline ${l.stroke.color}` : ''}${l.highlight ? `, blok sorot ${l.highlight.color}` : ''}`);
  if (l.kind === 'shape') d.push(`Warna isi ${l.fill}${l.radius ? `, sudut membulat ${Math.round(l.radius)}` : ''}${l.stroke ? `, garis tepi ${l.stroke.width} px ${l.stroke.color}` : ''}`);
  if (l.kind === 'path') {
    const bits = [l.fill && l.closed ? `isi ${l.fill}${l.gradient ? ` → ${l.gradient.to} (gradien ${l.gradient.angle}°)` : ''}` : 'tanpa isi', l.stroke ? `garis ${Math.round(l.stroke.width)} px ${l.stroke.color}` : ''];
    if (l.extra?.length) bits.push(`${l.extra.length} kontur tambahan (lubang dari operasi Kurangi/Eksklusi)`);
    d.push(bits.filter(Boolean).join(', '));
    if (l.drawOn) d.push(`Efek gambar garis: garis tergambar selama ${sec(l.drawOn)} sejak muncul`);
  }
  if (l.kind === 'video') {
    const info = doc.media?.[l.mediaId];
    d.push(`Potong ${mmss(l.trimIn)}–${mmss(l.trimOut)} dari file (${clipLength(l).toFixed(1)} dtk di timeline), kecepatan ${l.speed}×, ${l.muted ? 'suara dibisukan' : `volume ${pct(l.volume)}`}`);
    if (!info || info.missing) d.push('File asli belum disambungkan: pilih klip ini lalu tekan “Pilih file”.');
  }
  if (l.kind === 'group') d.push(`Isi: ${l.children.map((c) => (c.kind === 'text' ? `teks “${c.text.slice(0, 16)}”` : c.name)).slice(0, 6).join(', ')}${l.children.length > 6 ? '…' : ''}. Klik ganda grup untuk melihat & mengedit isinya.`);
  if (l.animIn) d.push(`Animasi muncul: ${getAnimation(l.animIn.id)?.name || l.animIn.id} (${sec(l.animIn.duration)}${l.animIn.delay ? `, tunda ${sec(l.animIn.delay)}` : ''})`);
  if (l.animLoop) d.push(`Gerak terus: ${getAnimation(l.animLoop)?.name || l.animLoop}`);
  if (l.animOut) d.push(`Animasi hilang: ${getAnimation(l.animOut.id)?.name || l.animOut.id}`);
  const ks = l.keyframes || [];
  if (ks.length >= 2) {
    d.push(`Keyframe (${ks.length}):`);
    for (let i = 0; i < ks.length - 1; i++) d.push(`  ◆ ${describeMove(ks[i], ks[i + 1])}`);
  }
  if (l.shadow) d.push(`Bayangan blur ${l.shadow.blur}`);
  return d;
}

export function explainScene(doc: ProjectDoc, idx: number): Step[] {
  const scene: Scene | undefined = doc.scenes[idx];
  if (!scene) return [];
  const { w, h } = canvasSize(doc.aspect);
  const bg = scene.background;
  const bgText = bg.type === 'image' ? 'foto' : bg.type === 'gradient' ? `gradien ${(bg.colors || [bg.color]).join(' → ')}` : `warna ${bg.color}`;
  const steps: Step[] = [
    {
      t: 0,
      title: `Siapkan scene ${idx + 1}: kanvas ${doc.aspect} (${w}×${h}), ${sec(scene.duration)}`,
      details: [
        `Latar ${bgText}${bg.pattern && bg.pattern !== 'none' ? `, pola ${bg.pattern}` : ''}`,
        idx > 0 ? `Masuk dari scene sebelumnya dengan transisi ${getTransition(scene.transition.id).name}` : 'Scene pertama',
        ...(scene.effects?.length ? [`Efek: ${scene.effects.map((e) => getEffect(e.id)?.name || e.id).join(', ')}`] : []),
      ],
    },
  ];
  const order = scene.layers.map((l, z) => ({ l, z })).sort((a, b) => a.l.start - b.l.start || a.z - b.z);
  order.forEach(({ l, z }, n) => {
    if (l.hidden) return;
    steps.push({ t: l.start, layerId: l.id, title: `${n + 1}. ${titleOf(l, doc)}`, details: [`Lapisan ke-${z + 1} dari bawah`, ...detailsOf(l, doc, scene.duration)] });
  });
  return steps;
}
