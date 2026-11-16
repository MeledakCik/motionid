'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Code2,
  Download,
  FileJson,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { allIcons, IconDef, iconSvgMarkup, parseSvgMarkup } from '@/lib/studio/packs/icons';
import { allComponents, COMPONENT_CODE_EXAMPLE, componentKinds, ComponentDef, drawComponent, parseComponentCode, componentCount } from '@/lib/studio/packs/components';
import { allTransitions, drawTransition, parseTransitionCode, TRANSITION_CODE_EXAMPLE, transitionCount, TransitionSpec } from '@/lib/studio/packs/transitions';
import { allAnimations, ANIMATION_CODE_EXAMPLE, AnimSpec, evalIn, evalLoop, parseAnimationCode } from '@/lib/studio/packs/animations';
import { TEMPLATES, THEMES } from '@/lib/studio/packs/templates';
import { allEffects, EFFECT_CODE_EXAMPLE, effectCount, effectKinds, EffectSpec, parseEffectCode } from '@/lib/studio/packs/effects';
import { EffectThumb } from '@/components/studio/Thumbs';
import {
  applyRow,
  loadTraining,
  mergeTrainingUploads,
  parseBulkTrainingInput,
  ParsedTrainingItem,
  removeRow,
  TrainingItemType,
  TrainingRow,
} from '@/lib/studio/training';
import { canvasFamily, ensureFonts } from '@/lib/studio/fonts';
import { EASINGS } from '@/lib/studio/easing';
import { cx, Dropdown, Logo, Segmented } from '@/components/studio/ui';

type Tab = 'bundle_pack' | 'icon_pack' | 'component_pack' | 'transition_pack' | 'animation_pack' | 'effect_pack' | 'teks';

const TABS: Array<{ id: Tab; label: string; short: string }> = [
  { id: 'bundle_pack', label: 'Import JSON Massal', short: 'Batch JSON' },
  { id: 'component_pack', label: 'Input Kode Komponen', short: 'Komponen' },
  { id: 'icon_pack', label: 'Input SVG Ikon', short: 'Ikon' },
  { id: 'transition_pack', label: 'Input Kode Transisi', short: 'Transisi' },
  { id: 'animation_pack', label: 'Input Kode Animasi', short: 'Animasi' },
  { id: 'effect_pack', label: 'Input Kode Efek', short: 'Efek' },
  { id: 'teks', label: 'Bank Teks (Hook/CTA)', short: 'Teks' },
];

const BUCKET_LABEL: Record<string, string> = {
  icons: 'ikon',
  components: 'komponen',
  transitions: 'transisi',
  animations: 'animasi',
  effects: 'efek',
  hooks: 'hook',
  ctas: 'cta',
};

const ICON_EXAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
  <line x1="6" x2="6" y1="2" y2="4"/>
  <line x1="10" x2="10" y1="2" y2="4"/>
  <line x1="14" x2="14" y1="2" y2="4"/>
</svg>`;

const BATCH_COMPONENT_EXAMPLE = `[
  {
    "name": "Kartu Promo Bulat",
    "category": "promo",
    "tags": ["promo", "diskon", "bulat"],
    "size": { "w": 800, "h": 320 },
    "props": { "title": "Diskon 30%", "subtitle": "Khusus hari ini" },
    "layers": [
      { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 48, "gradient": ["$primary", "$secondary"], "shadow": true },
      { "type": "circle", "x": 0.04, "y": 0.16, "w": 0.26, "h": 0.68, "fill": "#FFFFFF", "anim": "pulse" },
      { "type": "icon", "icon": "badge-percent", "x": 0.08, "y": 0.28, "w": 0.18, "h": 0.44, "color": "$primary" },
      { "type": "text", "x": 0.36, "y": 0.14, "w": 0.6, "h": 0.42, "text": "{{title}}", "size": 90, "weight": 900, "color": "#FFFFFF" },
      { "type": "text", "x": 0.36, "y": 0.58, "w": 0.6, "h": 0.26, "text": "{{subtitle}}", "size": 44, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
    ]
  },
  {
    "name": "Kartu Menu Kopi",
    "category": "promo",
    "tags": ["kopi", "menu", "produk"],
    "size": { "w": 800, "h": 340 },
    "props": { "badge": "BEST SELLER", "title": "Kopi Susu Aren", "subtitle": "Rp 22.000 • Dingin / Panas" },
    "layers": [
      { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 44, "gradient": ["$primary", "$secondary"], "shadow": true },
      { "type": "circle", "x": 0.04, "y": 0.17, "w": 0.25, "h": 0.66, "fill": "#FFFFFF", "anim": "pulse" },
      { "type": "icon", "icon": "coffee", "x": 0.085, "y": 0.29, "w": 0.16, "h": 0.42, "color": "$primary" },
      { "type": "rect", "x": 0.34, "y": 0.14, "w": 0.24, "h": 0.16, "radius": 24, "fill": "#FFFFFF" },
      { "type": "text", "x": 0.36, "y": 0.16, "w": 0.2, "h": 0.12, "text": "{{badge}}", "size": 24, "weight": 800, "color": "$primary" },
      { "type": "text", "x": 0.34, "y": 0.36, "w": 0.62, "h": 0.32, "text": "{{title}}", "size": 74, "weight": 900, "color": "#FFFFFF", "delay": 0.15 },
      { "type": "text", "x": 0.34, "y": 0.7, "w": 0.62, "h": 0.18, "text": "{{subtitle}}", "size": 36, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
    ]
  },
  {
    "name": "Kartu Metrik Pertumbuhan",
    "category": "edukasi",
    "tags": ["metrik", "statistik", "growth"],
    "size": { "w": 760, "h": 340 },
    "props": { "metric": "+148%", "label": "Kenaikan Penjualan Bulan Ini" },
    "layers": [
      { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 40, "gradient": ["$secondary", "$primary"], "shadow": true },
      { "type": "rect", "x": 0.05, "y": 0.18, "w": 0.24, "h": 0.64, "radius": 32, "fill": "#FFFFFF" },
      { "type": "icon", "icon": "trending-up", "x": 0.09, "y": 0.29, "w": 0.16, "h": 0.42, "color": "$primary" },
      { "type": "text", "x": 0.34, "y": 0.16, "w": 0.6, "h": 0.42, "text": "{{metric}}", "size": 108, "weight": 900, "color": "#FFFFFF" },
      { "type": "text", "x": 0.34, "y": 0.62, "w": 0.6, "h": 0.24, "text": "{{label}}", "size": 38, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.25 }
    ]
  },
  {
    "name": "Banner Flash Alert",
    "category": "promo",
    "tags": ["flash", "alert", "stok"],
    "size": { "w": 840, "h": 220 },
    "props": { "title": "Stok Terbatas!", "subtitle": "Tinggal 5 slot lagi hari ini" },
    "layers": [
      { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 110, "gradient": ["$primary", "$secondary"], "shadow": true },
      { "type": "circle", "x": 0.04, "y": 0.16, "w": 0.18, "h": 0.68, "fill": "#FFFFFF", "anim": "pulse" },
      { "type": "icon", "icon": "zap", "x": 0.075, "y": 0.28, "w": 0.11, "h": 0.44, "color": "$primary" },
      { "type": "text", "x": 0.26, "y": 0.16, "w": 0.68, "h": 0.38, "text": "{{title}}", "size": 68, "weight": 900, "color": "#FFFFFF" },
      { "type": "text", "x": 0.26, "y": 0.56, "w": 0.68, "h": 0.26, "text": "{{subtitle}}", "size": 38, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.2 }
    ]
  }
]`;

const BUNDLE_ALL_IN_ONE_EXAMPLE = `{
  "components": [
    {
      "name": "Kartu Promo Bulat",
      "category": "promo",
      "tags": ["promo", "diskon"],
      "size": { "w": 800, "h": 320 },
      "props": { "title": "Diskon 30%", "subtitle": "Khusus hari ini" },
      "layers": [
        { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 48, "gradient": ["$primary", "$secondary"], "shadow": true },
        { "type": "circle", "x": 0.04, "y": 0.16, "w": 0.26, "h": 0.68, "fill": "#FFFFFF", "anim": "pulse" },
        { "type": "icon", "icon": "badge-percent", "x": 0.08, "y": 0.28, "w": 0.18, "h": 0.44, "color": "$primary" },
        { "type": "text", "x": 0.36, "y": 0.14, "w": 0.6, "h": 0.42, "text": "{{title}}", "size": 90, "weight": 900, "color": "#FFFFFF" },
        { "type": "text", "x": 0.36, "y": 0.58, "w": 0.6, "h": 0.26, "text": "{{subtitle}}", "size": 44, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
      ]
    },
    {
      "name": "Kartu Menu Kopi",
      "category": "promo",
      "tags": ["kopi", "minuman", "menu"],
      "size": { "w": 800, "h": 340 },
      "props": { "badge": "BEST SELLER", "title": "Kopi Susu Aren", "subtitle": "Rp 22.000 • Dingin / Panas" },
      "layers": [
        { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 44, "gradient": ["$primary", "$secondary"], "shadow": true },
        { "type": "circle", "x": 0.04, "y": 0.17, "w": 0.25, "h": 0.66, "fill": "#FFFFFF", "anim": "pulse" },
        { "type": "icon", "icon": "coffee", "x": 0.085, "y": 0.29, "w": 0.16, "h": 0.42, "color": "$primary" },
        { "type": "rect", "x": 0.34, "y": 0.14, "w": 0.24, "h": 0.16, "radius": 24, "fill": "#FFFFFF" },
        { "type": "text", "x": 0.36, "y": 0.16, "w": 0.2, "h": 0.12, "text": "{{badge}}", "size": 24, "weight": 800, "color": "$primary" },
        { "type": "text", "x": 0.34, "y": 0.36, "w": 0.62, "h": 0.32, "text": "{{title}}", "size": 74, "weight": 900, "color": "#FFFFFF", "delay": 0.15 },
        { "type": "text", "x": 0.34, "y": 0.7, "w": 0.62, "h": 0.18, "text": "{{subtitle}}", "size": 36, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
      ]
    },
    {
      "name": "Kartu Deploy Tech",
      "category": "edukasi",
      "tags": ["tech", "terminal", "deploy"],
      "size": { "w": 840, "h": 320 },
      "props": { "badge": "LIVE BUILD", "command": "npx deploy --prod", "status": "Online dalam 12 detik • SSL Aktif" },
      "layers": [
        { "type": "rect", "x": 0, "y": 0, "w": 1, "h": 1, "radius": 40, "gradient": ["$primary", "$secondary"], "shadow": true },
        { "type": "rect", "x": 0.04, "y": 0.16, "w": 0.22, "h": 0.68, "radius": 32, "fill": "#FFFFFF" },
        { "type": "icon", "icon": "terminal", "x": 0.085, "y": 0.29, "w": 0.13, "h": 0.42, "color": "$primary" },
        { "type": "rect", "x": 0.31, "y": 0.14, "w": 0.24, "h": 0.16, "radius": 24, "fill": "#FFFFFF" },
        { "type": "icon", "icon": "rocket", "x": 0.33, "y": 0.17, "w": 0.04, "h": 0.1, "color": "$primary" },
        { "type": "text", "x": 0.38, "y": 0.17, "w": 0.15, "h": 0.1, "text": "{{badge}}", "size": 22, "weight": 800, "color": "$primary" },
        { "type": "text", "x": 0.31, "y": 0.36, "w": 0.64, "h": 0.28, "text": "{{command}}", "size": 58, "weight": 900, "color": "#FFFFFF", "delay": 0.15 },
        { "type": "text", "x": 0.31, "y": 0.68, "w": 0.64, "h": 0.18, "text": "{{status}}", "size": 32, "weight": 600, "font": "body", "color": "#FFFFFF", "delay": 0.3 }
      ]
    }
  ],
  "icons": [
    {
      "name": "Rocket Launch",
      "tags": ["roket", "startup", "deploy"],
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"><path d=\\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\\"/><path d=\\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\\"/></svg>"
    },
    {
      "name": "Coffee Cup",
      "tags": ["kopi", "cafe", "minuman"],
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"><path d=\\"M17 8h1a4 4 0 1 1 0 8h-1\\"/><path d=\\"M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z\\"/><line x1=\\"6\\" x2=\\"6\\" y1=\\"2\\" y2=\\"4\\"/><line x1=\\"10\\" x2=\\"10\\" y1=\\"2\\" y2=\\"4\\"/><line x1=\\"14\\" x2=\\"14\\" y1=\\"2\\" y2=\\"4\\"/></svg>"
    }
  ],
  "transitions": [
    {
      "name": "Lempar Kartu Miring",
      "kind": "custom",
      "duration": 0.7,
      "easing": "inOutCubic",
      "outTo": { "x": -900, "rot": -25, "scale": 0.8, "alpha": 0.2 },
      "inFrom": { "x": 900, "rot": 25, "scale": 0.8 },
      "inTo": { "x": 0, "rot": 0, "scale": 1 },
      "mask": "none"
    }
  ],
  "animations": [
    {
      "name": "Lompat Masuk Miring",
      "kind": "in",
      "duration": 0.8,
      "keyframes": [
        { "t": 0, "y": 300, "rot": -20, "alpha": 0 },
        { "t": 0.6, "y": -30, "rot": 6, "alpha": 1, "easing": "outCubic" },
        { "t": 1, "y": 0, "rot": 0, "easing": "outBack" }
      ]
    }
  ],
  "effects": [
    {
      "name": "Hujan Ikon Kopi Melayang",
      "kind": "ikon",
      "icon": "coffee",
      "motion": "melayang",
      "intensity": 1.2
    }
  ],
  "hooks": [
    "{produk} cuma {harga}? Gas sebelum kehabisan!",
    "Jangan skip! Ini rahasia {topik} dalam {n} langkah cepat."
  ],
  "ctas": [
    "Klik link di bio {toko} sebelum kuota habis!",
    "Ambil promo {produk} sekarang juga!"
  ]
}`;

const GUIDE: Record<Exclude<Tab, 'teks'>, React.ReactNode> = {
  bundle_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Tempel <b>Array JSON</b> <code>[ &#123;...&#125;, &#123;...&#125; ]</code> atau <b>Bundle JSON</b> berisi key <code>components</code>, <code>icons</code>, <code>transitions</code>, <code>animations</code>, <code>effects</code>, <code>hooks</code>, dan <code>ctas</code>.
      </li>
      <li>
        Tipe tiap objek juga bisa dideteksi otomatis dari struktur field-nya (misal ada <code>layers</code> = Komponen, ada <code>svg</code> = Ikon, ada <code>keyframes</code> = Animasi, ada <code>outTo/inFrom</code> = Transisi).
      </li>
      <li>
        Klik <b>Upload File (bisa banyak)</b> atau <b>drag &amp; drop</b> ke form untuk memasukkan puluhan preset sekaligus. File boleh berupa beberapa JSON, SVG, atau TXT — semuanya digabung otomatis per kategori.
      </li>
      <li>
        Item yang valid tetap bisa disimpan walau ada item yang rusak; item rusak akan dilewati dan ditandai merah di preview.
      </li>
    </ul>
  ),
  effect_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Bisa tempel <b>1 objek JSON</b> <code>&#123;...&#125;</code> atau <b>Array JSON</b> <code>[&#123;...&#125;, &#123;...&#125;]</code> sekaligus.
      </li>
      <li>
        <b>kind</b>: {effectKinds().map((k) => k.kind).join(', ')}.
      </li>
      <li>
        <b>style</b> per kind, contoh hujan: lurus | miring-kiri | miring-kanan | neon | petir | malam; kaca-pecah: tengah | kiri-atas | kanan-bawah | hamburan | jatuh | layar-hp; pasir: badai-kanan | badai-kiri | jatuh | gurun | emas.
      </li>
      <li>
        <b>intensity</b> 0.1–4 (jumlah partikel / kekuatan). Untuk kind <code>ikon</code> isi <code>&quot;icon&quot;</code> dengan id ikon apa saja (termasuk ikon custom admin) dan <code>&quot;motion&quot;</code>: jatuh | naik | melayang.
      </li>
      <li>
        <b>layer</b> (opsional): <code>under</code> (di belakang teks) atau <code>over</code> (di depan).
      </li>
    </ul>
  ),
  icon_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Bisa tempel 1 <code>&lt;svg&gt;</code>, <b>banyak tag <code>&lt;svg&gt;...&lt;/svg&gt;</code> sekaligus</b>, atau <b>Array JSON</b> <code>[&#123;&quot;name&quot;:&quot;...&quot;, &quot;svg&quot;:&quot;&lt;svg...&gt;&quot;&#125;]</code>.
      </li>
      <li>Didukung: path, circle, rect, line, polyline, polygon, ellipse. Script, gambar, dan filter otomatis diabaikan (aman).</li>
      <li>Ikon garis (stroke) &amp; isi (fill) dideteksi otomatis. Warna diatur user di editor.</li>
    </ul>
  ),
  component_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Bisa tempel <b>1 objek JSON</b> <code>&#123;...&#125;</code> atau <b>Array JSON</b> <code>[ &#123;...&#125;, &#123;...&#125; ]</code> berisi banyak komponen sekaligus!
      </li>
      <li>
        <b>layers</b>: daftar bentuk – <code>rect</code>, <code>pill</code>, <code>circle</code>, <code>line</code>, <code>text</code>, <code>icon</code>. Koordinat ≤ 1 = persen ukuran, &gt; 1 = piksel.
      </li>
      <li>
        Warna tema: <code>$primary</code>, <code>$secondary</code>, <code>$text</code>, <code>$surface</code> (ikut berubah saat user ganti tema).
      </li>
      <li>
        Teks dinamis: <code>{'{{title}}'}</code> diisi dari <b>props</b> dan bisa diedit user.
      </li>
      <li>
        Animasi internal per layer: <code>anim</code>: pulse | float | spin | blink | grow, plus <code>delay</code> (detik).
      </li>
      <li>
        Atau perluas komponen bawaan: <code>{'{"base": "price", "style": "neon"}'}</code> lalu tambah layers. Base: {componentKinds().map((k) => k.kind).join(', ')}.
      </li>
    </ul>
  ),
  transition_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Bisa tempel <b>1 objek JSON</b> atau <b>Array JSON</b> <code>[&#123;...&#125;, &#123;...&#125;]</code> berisi banyak transisi sekaligus.
      </li>
      <li>
        <b>kind</b> bawaan + <b>params</b>, contoh <code>{'{"kind":"iris","params":{"origin":"tl"}}'}</code>. Kind: cut, fade, slide, push, wipe, iris, shape, zoom, blinds, grid, stripes, spin, flip, cube, whip, glitch, flash, blur, split, clock, pixelate, ink, slice, colorwipe, burst, shake, card, dolly.
      </li>
      <li>
        Mode <b>custom</b>: <code>outFrom/outTo</code> (scene lama) &amp; <code>inFrom/inTo</code> (scene baru) berisi x, y, scale, rot, alpha + <code>mask</code>: none | circle | rect | diamond.
      </li>
      <li>
        <b>easing</b>: {Object.keys(EASINGS).join(', ')}. <b>energy</b> 1-3 dipakai prompt engine.
      </li>
    </ul>
  ),
  animation_pack: (
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Bisa tempel <b>1 objek JSON</b> atau <b>Array JSON</b> <code>[&#123;...&#125;, &#123;...&#125;]</code> berisi banyak animasi sekaligus.
      </li>
      <li>
        <b>kind</b>: <code>in</code> (masuk/keluar) atau <code>loop</code>.
      </li>
      <li>
        Masuk: pakai <code>from</code> (pose awal → normal) atau <code>keyframes</code> (t 0..1). Pose: x, y, scale, sx, sy, rot, alpha, blur, skew.
      </li>
      <li>
        <code>clip</code>: left | right | up | down | center-h | center-v | circle | diagonal (efek wipe reveal).
      </li>
      <li>
        Teks per huruf/kata: <code>{'{"text": {"mode":"word","from":{"y":60,"alpha":0},"overlap":0.4}}'}</code>, opsi scramble / cursor / highlight.
      </li>
      <li>
        Loop: <code>{'{"loop": {"wave":"sin","amp":{"y":20},"period":2}}'}</code> – wave: sin, pulse, shake, bounce, spin, flash, heartbeat, wobble.
      </li>
    </ul>
  ),
};

function useAnimatedCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      draw(ctx, c.width, c.height, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function frame(label: string, bg: string, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 8; i++) x.fillRect(0, (i * h) / 8, w, 2);
  x.fillStyle = '#F4F1FF';
  x.font = `900 ${h * 0.12}px ${canvasFamily('Plus Jakarta Sans')}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(label, w / 2, h / 2);
  return c;
}

function PreviewIcon({ parts, viewBox }: { parts: IconDef['parts']; viewBox: IconDef['viewBox'] }) {
  const def: IconDef = { id: 'preview', name: '', group: '', tags: [], viewBox, parts, author: 'admin' };
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        ['#7B50FF', '#120B2E'],
        ['#FFFFFF', '#7B50FF'],
        ['#120B2E', '#C6F432'],
      ].map(([fg, bg], i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-2xl p-6"
          style={{ background: bg, color: fg }}
          dangerouslySetInnerHTML={{ __html: iconSvgMarkup(def, 'currentColor', 2) }}
        />
      ))}
    </div>
  );
}

function PreviewComponent({ def }: { def: ComponentDef }) {
  const [themeIdx, setThemeIdx] = useState(0);
  const th = THEMES[themeIdx];
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, th.palette.bg);
      g.addColorStop(1, th.palette.bg2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const s = Math.min((W * 0.86) / def.size.w, (H * 0.8) / def.size.h);
      ctx.save();
      ctx.translate((W - def.size.w * s) / 2, (H - def.size.h * s) / 2);
      drawComponent(
        ctx,
        def,
        def.size.w * s,
        def.size.h * s,
        {},
        { primary: th.palette.primary, secondary: th.palette.secondary, text: th.palette.text, surface: th.palette.surface },
        { heading: canvasFamily(th.headingFont), body: canvasFamily(th.bodyFont), t: t % 4, allowBlur: true }
      );
      ctx.restore();
    },
    [def, themeIdx]
  );
  return (
    <div className="space-y-2">
      <canvas ref={ref} width={640} height={420} className="w-full rounded-2xl" />
      <div className="mk-noscroll flex gap-1 overflow-x-auto">
        {THEMES.slice(0, 14).map((t, i) => (
          <button
            key={t.id}
            type="button"
            title={t.name}
            onClick={() => setThemeIdx(i)}
            className={cx('h-6 w-10 shrink-0 overflow-hidden rounded-md border-2', i === themeIdx ? 'border-mk-cream' : 'border-transparent')}
          >
            <span className="flex h-full">
              <span className="flex-1" style={{ background: t.palette.bg }} />
              <span className="flex-1" style={{ background: t.palette.primary }} />
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-mk-dim">Klik warna untuk mengecek komponen di berbagai tema.</p>
    </div>
  );
}

function PreviewTransition({ spec }: { spec: TransitionSpec }) {
  const frames = useMemo(() => (typeof document !== 'undefined' ? [frame('SCENE A', '#2A1F5C', 360, 640), frame('SCENE B', '#7B50FF', 360, 640)] : null), []);
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      if (!frames) return;
      const cycle = spec.duration + 1.2;
      const local = t % cycle;
      const p = Math.min(1, Math.max(0, (local - 0.6) / spec.duration));
      ctx.clearRect(0, 0, W, H);
      drawTransition(ctx, spec, p, frames[0], frames[1], W, H, { primary: '#7B50FF', secondary: '#C6F432' }, true);
    },
    [spec, frames]
  );
  return <canvas ref={ref} width={360} height={640} className="mx-auto h-[420px] w-auto rounded-2xl bg-black" />;
}

function PreviewAnimation({ spec }: { spec: AnimSpec }) {
  const ref = useAnimatedCanvas(
    (ctx, W, H, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1E1150';
      ctx.fillRect(0, 0, W, H);
      const cycle = spec.kind === 'loop' ? 1e9 : spec.duration + 1;
      const local = t % cycle;
      const k = W / 1080;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      let alpha = 1;
      if (spec.kind === 'loop') {
        const ps = evalLoop(spec, local);
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        ctx.scale(ps.scale * ps.sx, ps.scale * ps.sy);
        alpha = ps.alpha;
      } else {
        const ev = evalIn(spec, Math.min(1, local / spec.duration));
        const ps = ev.pose;
        ctx.translate(ps.x * k, ps.y * k);
        ctx.rotate((ps.rot * Math.PI) / 180);
        if (ps.skew) ctx.transform(1, 0, Math.tan((ps.skew * Math.PI) / 180), 1, 0, 0);
        ctx.scale(ps.scale * ps.sx || 0.001, ps.scale * ps.sy || 0.001);
        if (ps.blur > 0.5) ctx.filter = `blur(${ps.blur * k}px)`;
        alpha = ps.alpha;
        if (ev.clip) {
          ctx.beginPath();
          ctx.rect(-W * 0.4, -H * 0.2, W * 0.8 * ev.clip.p, H * 0.4);
          ctx.clip();
        }
        if (ev.text) {
          const words = ['Animasi', 'teks', 'keren'];
          const n = words.length;
          ctx.font = `800 ${W * 0.08}px ${canvasFamily('Plus Jakarta Sans')}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const ov = ev.text.spec.overlap;
          const dur = 1 / (1 + (n - 1) * (1 - ov));
          words.forEach((w, i) => {
            const ip = Math.min(1, Math.max(0, (ev.text!.p - i * dur * (1 - ov)) / dur));
            const f = ev.text!.spec.from;
            ctx.save();
            ctx.globalAlpha = Math.max(0, (f.alpha ?? 1) + (1 - (f.alpha ?? 1)) * ip);
            ctx.translate((i - 1) * W * 0.27 + (f.x ?? 0) * k * (1 - ip), (f.y ?? 0) * k * (1 - ip));
            ctx.rotate((((f.rot ?? 0) * (1 - ip)) * Math.PI) / 180);
            const sc = (f.scale ?? 1) + (1 - (f.scale ?? 1)) * ip;
            ctx.scale(sc || 0.001, sc || 0.001);
            ctx.fillStyle = i === 1 ? '#7B50FF' : '#F4F1FF';
            ctx.fillText(w, 0, 0);
            ctx.restore();
          });
          ctx.restore();
          return;
        }
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.roundRect(-W * 0.22, -H * 0.12, W * 0.44, H * 0.24, 28 * k * 3);
      const g = ctx.createLinearGradient(-W * 0.22, 0, W * 0.22, 0);
      g.addColorStop(0, '#7B50FF');
      g.addColorStop(1, '#C6F432');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = '#120B2E';
      ctx.font = `900 ${W * 0.07}px ${canvasFamily('Plus Jakarta Sans')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MotionKu', 0, 2);
      ctx.restore();
    },
    [spec]
  );
  return <canvas ref={ref} width={640} height={420} className="w-full rounded-2xl" />;
}

const EXAMPLES: Record<Exclude<Tab, 'teks'>, string> = {
  bundle_pack: BUNDLE_ALL_IN_ONE_EXAMPLE,
  icon_pack: ICON_EXAMPLE,
  component_pack: COMPONENT_CODE_EXAMPLE,
  transition_pack: TRANSITION_CODE_EXAMPLE,
  animation_pack: ANIMATION_CODE_EXAMPLE,
  effect_pack: EFFECT_CODE_EXAMPLE,
};

export default function TrainingStudio() {
  const [tab, setTab] = useState<Tab>('bundle_pack');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('all');
  const [tags, setTags] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [textType, setTextType] = useState<'hook' | 'cta'>('hook');
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [, force] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [debounced, setDebounced] = useState({ code: '', name: '', category: 'all', tags: '' });

  useEffect(() => {
    const id = setTimeout(() => setDebounced({ code, name, category, tags }), 220);
    return () => clearTimeout(id);
  }, [code, name, category, tags]);

  const defaultItemType: TrainingItemType =
    tab === 'teks' ? textType : tab === 'bundle_pack' ? 'component_pack' : tab;

  const bulkResult = useMemo(() => {
    const tagList = debounced.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return parseBulkTrainingInput(debounced.code, defaultItemType, debounced.name, debounced.category, tagList);
  }, [debounced, defaultItemType]);

  useEffect(() => {
    if (selectedPreviewIdx >= bulkResult.items.length) {
      setSelectedPreviewIdx(0);
    }
  }, [bulkResult.items.length, selectedPreviewIdx]);

  const activePreviewItem: ParsedTrainingItem | undefined =
    bulkResult.items[selectedPreviewIdx] || bulkResult.items[0];

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const pageSize = 500;
    const allRows: TrainingRow[] = [];
    let error: { message: string } | null = null;
    for (let from = 0; ; from += pageSize) {
      const result = await supabase
        .from('ai_training_data')
        .select('id,type,category,content_text,subtext,metadata_json,created_at')
        .in('type', ['icon_pack', 'component_pack', 'transition_pack', 'animation_pack', 'effect_pack', 'hook', 'cta'])
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + pageSize - 1);
      if (result.error) {
        error = result.error;
        break;
      }
      const page = (result.data || []) as TrainingRow[];
      allRows.push(...page);
      if (page.length < pageSize) break;
    }
    if (error) {
      setNotice({
        ok: false,
        text: /does not exist|schema/i.test(error.message)
          ? 'Tabel ai_training_data belum ada. Jalankan supabase/migration.sql.'
          : error.message,
      });
    }
    setRows(allRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
    loadTraining().then(() => force((n) => n + 1));
    ensureFonts(['Plus Jakarta Sans', 'Poppins', 'Montserrat', 'Anton', 'Playfair Display', 'Space Grotesk', 'Bebas Neue']).then(() =>
      force((n) => n + 1)
    );
  }, [fetchRows]);

  const reset = () => {
    setName('');
    setTags('');
    setCode('');
    setEditingId(null);
    setCategory('all');
    setSelectedPreviewIdx(0);
  };

  const save = async () => {
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedNow = parseBulkTrainingInput(code, defaultItemType, name, category, tagList);
    const itemsToSave = parsedNow.items.filter((item) => item.ok);
    const skipped = parsedNow.items.length - itemsToSave.length;

    if (!itemsToSave.length) {
      return setNotice({
        ok: false,
        text:
          parsedNow.errorSummary ||
          'Tidak ada item valid. Periksa item bertanda merah di preview lalu coba lagi.',
      });
    }

    setSaving(true);
    const supabase = createClient();

    if (editingId && parsedNow.items.length === 1) {
      const item = itemsToSave[0];
      const payload = {
        type: item.type,
        category: item.category,
        content_text: item.content_text,
        subtext: item.type === 'hook' || item.type === 'cta' ? null : item.name,
        metadata_json: { tags: item.tags, engine: 'v6' },
      };
      const res = await supabase.from('ai_training_data').update(payload).eq('id', editingId).select('*').single();
      setSaving(false);
      if (res.error) return setNotice({ ok: false, text: res.error.message });
      const row = res.data as TrainingRow;
      applyRow(row);
      setNotice({ ok: true, text: 'Perubahan tersimpan & langsung aktif di editor semua user.' });
      reset();
      fetchRows();
      force((n) => n + 1);
      return;
    }

    const payloads = itemsToSave.map((item) => ({
      type: item.type,
      category: item.category,
      content_text: item.content_text,
      subtext: item.type === 'hook' || item.type === 'cta' ? null : item.name,
      metadata_json: { tags: item.tags, engine: 'v6' },
    }));

    const res = await supabase.from('ai_training_data').insert(payloads).select('*');
    setSaving(false);
    if (res.error) return setNotice({ ok: false, text: res.error.message });

    const insertedRows = (res.data || []) as TrainingRow[];
    insertedRows.forEach((row) => applyRow(row));

    const skippedText =
      skipped > 0 ? ` ${skipped} item tidak valid dilewati — perbaiki kodenya lalu simpan ulang.` : '';
    setNotice({
      ok: true,
      text:
        (insertedRows.length > 1
          ? `Berhasil menyimpan ${insertedRows.length} item training sekaligus! Semua langsung aktif di editor.`
          : 'Tersimpan! Pack baru langsung muncul di editor semua user.') + skippedText,
    });
    reset();
    fetchRows();
    force((n) => n + 1);
  };

  const loadFiles = async (files: File[]) => {
    const readable = files.filter((file) => /\.(json|svg|txt)$/i.test(file.name) || file.type.includes('json') || file.type.includes('svg') || file.type.includes('text'));
    if (!readable.length) {
      return setNotice({ ok: false, text: 'Pilih file .json, .svg, atau .txt yang berisi data training.' });
    }

    const contents = await Promise.all(
      readable.map(async (file) => ({ name: file.name, text: await file.text() }))
    );
    const merged = mergeTrainingUploads(contents, defaultItemType);

    if (!merged.itemCount) {
      return setNotice({
        ok: false,
        text: `Tidak ada item yang bisa dibaca dari ${readable.length} file.${
          merged.failedFiles.length ? ` JSON gagal dibaca: ${merged.failedFiles.join(', ')}.` : ''
        }`,
      });
    }

    const categories = Object.keys(merged.bucketCounts);
    setCode(merged.code);
    setSelectedPreviewIdx(0);
    if (categories.length > 1) setTab('bundle_pack');
    setNotice({
      ok: true,
      text: `${readable.length} file dimuat: ${merged.itemCount} item (${categories
        .map((key) => BUCKET_LABEL[key] || key)
        .join(', ')}). Periksa preview lalu klik Simpan.${
        merged.failedFiles.length ? ` File gagal dibaca: ${merged.failedFiles.join(', ')}.` : ''
      }`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) void loadFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) void loadFiles(files);
  };

  const exportAllJson = () => {
    const targetRows = tab === 'bundle_pack' ? rows : listForTab;
    if (!targetRows.length) {
      return setNotice({ ok: false, text: 'Belum ada data training untuk diekspor.' });
    }
    const bundle: Record<string, unknown[]> = {
      components: [],
      icons: [],
      transitions: [],
      animations: [],
      effects: [],
      hooks: [],
      ctas: [],
    };
    targetRows.forEach((r) => {
      const rowTags = Array.isArray(r.metadata_json?.tags) ? (r.metadata_json!.tags as string[]) : [];
      if (r.type === 'icon_pack') {
        bundle.icons.push({ name: r.subtext || 'Ikon', category: r.category, tags: rowTags, svg: r.content_text });
      } else if (r.type === 'hook') {
        bundle.hooks.push({ text: r.content_text, category: r.category });
      } else if (r.type === 'cta') {
        bundle.ctas.push({ text: r.content_text, category: r.category });
      } else {
        try {
          const parsedObj = JSON.parse(r.content_text);
          const enriched = { name: r.subtext || parsedObj.name, category: r.category, tags: rowTags, ...parsedObj };
          if (r.type === 'component_pack') bundle.components.push(enriched);
          else if (r.type === 'transition_pack') bundle.transitions.push(enriched);
          else if (r.type === 'animation_pack') bundle.animations.push(enriched);
          else if (r.type === 'effect_pack') bundle.effects.push(enriched);
        } catch {
          // ignore malformed row
        }
      }
    });
    const cleaned = Object.fromEntries(Object.entries(bundle).filter(([, arr]) => arr.length > 0));
    const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motionid-training-${tab}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async (row: TrainingRow) => {
    if (!confirm(`Hapus "${row.subtext || row.content_text.slice(0, 30)}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await createClient().from('ai_training_data').delete().eq('id', row.id);
    if (error) return setNotice({ ok: false, text: error.message });
    removeRow(row);
    setRows((r) => r.filter((x) => x.id !== row.id));
    force((n) => n + 1);
  };

  const edit = (row: TrainingRow) => {
    if (row.type === 'hook' || row.type === 'cta') {
      setTab('teks');
      setTextType(row.type);
    } else if (['icon_pack', 'component_pack', 'transition_pack', 'animation_pack', 'effect_pack'].includes(row.type)) {
      setTab(row.type as Tab);
    }
    setEditingId(row.id);
    setName(row.subtext || '');
    setCode(row.content_text);
    setCategory(row.category || 'all');
    setTags(((row.metadata_json?.tags as string[]) || []).join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatJson = () => {
    try {
      const trimmed = code.trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = JSON.parse(`[${trimmed.replace(/\}\s*\{/g, '},{')}]`);
      }
      setCode(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setNotice({ ok: false, text: `Belum bisa dirapikan: ${(e as Error).message}` });
    }
  };

  const listForTab = rows.filter((r) =>
    tab === 'bundle_pack' ? true : tab === 'teks' ? r.type === 'hook' || r.type === 'cta' : r.type === tab
  );
  const counts = {
    icon_pack: allIcons().length,
    component_pack: componentCount(),
    transition_pack: transitionCount(),
    animation_pack: allAnimations().length,
    effect_pack: effectCount(),
  };

  return (
    <div className="mk-page">
      <header className="mk-glass mk-bar sticky top-0 z-30 border-b border-white/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/dashboard" className="mk-btn-icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo className="text-sm" />
          <span className="rounded-full bg-mk-coral/15 px-2 py-0.5 text-[11px] font-bold text-mk-coral">
            Admin Training + Batch JSON
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={exportAllJson} className="mk-btn-ghost px-3 py-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
            <Link href="/editor" className="mk-btn-ghost px-3 py-1.5 text-xs">
              Buka editor uji
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            ['Template', TEMPLATES.length],
            ['Komponen', counts.component_pack],
            ['Ikon', counts.icon_pack],
            ['Transisi', counts.transition_pack],
            ['Animasi', counts.animation_pack],
            ['Efek', counts.effect_pack],
          ].map(([l, n]) => (
            <div key={l as string} className="mk-card px-4 py-3">
              <div className="text-xl font-extrabold">{n}</div>
              <div className="text-[11px] text-mk-dim">{l} tersedia</div>
            </div>
          ))}
        </div>

        <div className="mk-noscroll -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => (setTab(t.id), reset(), setNotice(null))}
              className={cx('mk-chip shrink-0 px-4 py-2 text-sm', tab === t.id && 'mk-chip-on')}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>

        {notice && (
          <div className={cx('mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm', notice.ok ? 'bg-mk-mint/10 text-mk-mint' : 'bg-red-500/10 text-red-300')}>
            {notice.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {notice.text}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.svg,.txt,application/json,image/svg+xml,text/plain"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* ------ form ------ */}
          <div
            className={cx(
              'mk-card space-y-4 p-4 transition sm:p-5',
              dragOver && 'ring-2 ring-mk-coral ring-offset-2 ring-offset-mk-page'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragOver) setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              setDragOver(false);
            }}
            onDrop={handleDrop}
          >
            {dragOver && (
              <div className="rounded-xl border border-dashed border-mk-coral bg-mk-coral/10 px-3 py-2 text-center text-xs font-bold text-mk-coral">
                Lepas file .json / .svg / .txt di sini untuk mengimpor sekaligus
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                {tab === 'bundle_pack' ? <FileJson className="h-4 w-4 text-mk-coral" /> : <Code2 className="h-4 w-4 text-mk-coral" />}
                {TABS.find((t) => t.id === tab)?.label}
                {editingId && <span className="rounded bg-mk-amber/20 px-1.5 py-0.5 text-[11px] text-mk-amber">mengedit</span>}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mk-chip py-1 text-xs"
                title="Upload satu atau beberapa file .json / .svg / .txt"
              >
                <Upload className="h-3.5 w-3.5" /> Upload File (bisa banyak)
              </button>
            </div>

            {tab === 'teks' ? (
              <>
                <Segmented
                  value={textType}
                  onChange={setTextType}
                  options={[
                    { value: 'hook', label: 'Hook pembuka' },
                    { value: 'cta', label: 'Ajakan (CTA)' },
                  ]}
                />
                <label className="block">
                  <span className="mk-label">
                    Kalimat (bisa banyak baris sekaligus atau Array JSON; dukung {'{produk}'}, {'{harga}'}, {'{toko}'}, {'{topik}'}, {'{n}'})
                  </span>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={6}
                    className="mk-input"
                    placeholder={'Contoh banyak baris sekaligus:\n{produk} cuma {harga}? Gas sebelum kehabisan!\nRahasia {topik} dalam {n} langkah mudah!'}
                  />
                </label>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mk-label">Nama default (opsional jika sudah ada &quot;name&quot; di JSON)</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mk-input"
                      placeholder="Otomatis dari field name di JSON"
                    />
                  </label>
                  <label className="block">
                    <span className="mk-label">Tag tambahan (opsional, pisah koma)</span>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="mk-input"
                      placeholder="kopi, minuman, promo"
                    />
                  </label>
                </div>
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="mk-label mb-0">
                      {tab === 'icon_pack'
                        ? 'Kode SVG / Array JSON Ikon'
                        : tab === 'bundle_pack'
                        ? 'Kode JSON Massal (Array [...] atau Bundle {...})'
                        : 'Kode JSON (1 Objek {...} atau Array [...] banyak item)'}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="mk-chip py-1"
                        onClick={() => {
                          setCode(EXAMPLES[tab]);
                          setSelectedPreviewIdx(0);
                          if (!name && tab === 'icon_pack') setName('Kopi Custom');
                        }}
                      >
                        <Wand2 className="h-3 w-3" /> {tab === 'bundle_pack' ? 'Isi Contoh Bundle' : 'Isi Contoh'}
                      </button>
                      {tab === 'component_pack' && (
                        <button
                          type="button"
                          className="mk-chip py-1"
                          onClick={() => {
                            setCode(BATCH_COMPONENT_EXAMPLE);
                            setSelectedPreviewIdx(0);
                          }}
                        >
                          <Layers className="h-3 w-3" /> Contoh 4 Komponen (Array)
                        </button>
                      )}
                      {tab !== 'icon_pack' && (
                        <button type="button" className="mk-chip py-1" onClick={formatJson}>
                          Rapikan JSON
                        </button>
                      )}
                    </span>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={14}
                    spellCheck={false}
                    className="mk-input font-mono text-[12px] leading-relaxed"
                    placeholder={
                      tab === 'icon_pack'
                        ? '<svg viewBox="0 0 24 24">...</svg> atau [{"name":"Roket","svg":"<svg...>"}]'
                        : '[\n  { "name": "Preset 1", ... },\n  { "name": "Preset 2", ... }\n]'
                    }
                  />
                  <div className={cx('mt-1.5 text-[11px] font-semibold', !debounced.code ? 'text-mk-dim' : bulkResult.validCount > 0 ? 'text-mk-mint' : 'text-red-300')}>
                    {!debounced.code
                      ? 'Tempel kode atau upload file, lalu lihat preview langsung di kanan.'
                      : bulkResult.validCount > 0
                      ? `✓ ${bulkResult.validCount} item valid${
                          bulkResult.items.length > bulkResult.validCount
                            ? ` · ${bulkResult.items.length - bulkResult.validCount} item perlu diperbaiki`
                            : ' — preview aktif'
                        }`
                      : `✗ ${bulkResult.errorSummary || 'Belum ada item valid'}`}
                  </div>
                </div>
              </>
            )}

            <div>
              <span className="mk-label">Kategori konten default</span>
              <Dropdown
                label="Kategori konten"
                value={category}
                onChange={setCategory}
                className="w-full py-2.5 text-sm"
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'promo', label: 'Promo' },
                  { value: 'edukasi', label: 'Edukasi' },
                  { value: 'quote', label: 'Quote' },
                ]}
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving || bulkResult.validCount === 0} className="mk-btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{' '}
                {editingId
                  ? 'Simpan perubahan'
                  : bulkResult.validCount > 1
                  ? `Simpan ${bulkResult.validCount} Item Valid${
                      bulkResult.items.length > bulkResult.validCount
                        ? ` (lewati ${bulkResult.items.length - bulkResult.validCount})`
                        : ''
                    }`
                  : 'Simpan & Aktifkan'}
              </button>
              {(editingId || code) && (
                <button type="button" onClick={reset} className="mk-btn-ghost">
                  Batal
                </button>
              )}
            </div>
            {bulkResult.items.length > bulkResult.validCount && bulkResult.validCount > 0 && (
              <p className="text-[11px] leading-relaxed text-mk-amber">
                Item yang tidak valid akan dilewati. Perbaiki item bertanda merah di preview kalau ingin menyimpan semuanya.
              </p>
            )}

            {tab !== 'teks' && (
              <details className="rounded-xl bg-mk-ink p-3 text-[12px] text-mk-muted">
                <summary className="flex cursor-pointer items-center gap-1.5 font-bold text-mk-cream">
                  <BookOpen className="h-3.5 w-3.5" /> Panduan format kode &amp; Batch JSON
                </summary>
                <div className="mt-2">{GUIDE[tab]}</div>
              </details>
            )}
          </div>

          {/* ------ preview ------ */}
          <div className="mk-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold">
                Preview langsung{' '}
                {bulkResult.items.length > 1 && (
                  <span className="ml-1 rounded-full bg-mk-coral/15 px-2 py-0.5 text-[11px] font-bold text-mk-coral">
                    {selectedPreviewIdx + 1} / {bulkResult.items.length}
                  </span>
                )}
              </div>
              {activePreviewItem && (
                <span className="rounded bg-mk-panel-3 px-2 py-0.5 text-[11px] font-bold text-mk-muted">
                  {activePreviewItem.type} · {activePreviewItem.category}
                </span>
              )}
            </div>

            {bulkResult.items.length > 1 && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="text-mk-muted">Total {bulkResult.items.length}</span>
                <span className="text-mk-mint">{bulkResult.validCount} valid</span>
                {bulkResult.items.length > bulkResult.validCount && (
                  <button
                    type="button"
                    className="text-red-400 underline decoration-dotted"
                    onClick={() => {
                      const firstBad = bulkResult.items.findIndex((item) => !item.ok);
                      if (firstBad >= 0) setSelectedPreviewIdx(firstBad);
                    }}
                  >
                    {bulkResult.items.length - bulkResult.validCount} gagal — lihat error
                  </button>
                )}
              </div>
            )}

            {/* Pemilih item saat mode Batch JSON */}
            {bulkResult.items.length > 1 && (
              <div className="mk-noscroll mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {bulkResult.items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPreviewIdx(idx)}
                    className={cx(
                      'mk-chip shrink-0 px-3 py-1 text-xs',
                      idx === selectedPreviewIdx && 'mk-chip-on',
                      !item.ok && 'border-red-500/60 text-red-500'
                    )}
                  >
                    #{idx + 1} {item.name}
                  </button>
                ))}
              </div>
            )}

            {!activePreviewItem || !activePreviewItem.ok ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-mk-line-2 px-4 text-center text-sm text-mk-dim">
                {activePreviewItem?.error ? `✕ ${activePreviewItem.error}` : 'Preview muncul saat kode valid'}
              </div>
            ) : activePreviewItem.type === 'hook' || activePreviewItem.type === 'cta' || activePreviewItem.type === 'scene2' || activePreviewItem.type === 'scene3' ? (
              <div className="rounded-2xl bg-mk-ink p-6 text-center text-lg font-extrabold">
                {activePreviewItem.content_text
                  .replace('{produk}', 'Kopi Susu')
                  .replace('{harga}', 'Rp 18.000')
                  .replace('{toko}', 'Kopi Senja')
                  .replace('{topik}', 'keuangan')
                  .replace('{n}', '5')}
              </div>
            ) : activePreviewItem.icon ? (
              <PreviewIcon parts={activePreviewItem.icon.parts} viewBox={activePreviewItem.icon.viewBox} />
            ) : activePreviewItem.comp ? (
              <PreviewComponent def={activePreviewItem.comp} />
            ) : activePreviewItem.tr ? (
              <PreviewTransition spec={activePreviewItem.tr} />
            ) : activePreviewItem.anim ? (
              <PreviewAnimation spec={activePreviewItem.anim} />
            ) : activePreviewItem.fx ? (
              <div className="mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl">
                <EffectThumb spec={activePreviewItem.fx} primary="#FF6A3D" secondary="#FFB547" autoplay w={640} h={400} />
              </div>
            ) : null}
          </div>
        </div>

        {/* ------ daftar ------ */}
        <div className="mk-card mt-6 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-extrabold">Hasil training ({listForTab.length})</div>
            <button type="button" className="mk-btn-icon" onClick={fetchRows} title="Muat ulang">
              <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />
            </button>
          </div>
          {!loading && !listForTab.length && <p className="py-6 text-center text-sm text-mk-dim">Belum ada data untuk tab ini.</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {listForTab.map((r) => {
              let ok = true;
              let preview: React.ReactNode = null;
              if (r.type === 'icon_pack') {
                const p = parseSvgMarkup(r.content_text);
                ok = p.ok;
                if (p.ok) {
                  preview = (
                    <span
                      className="h-8 w-8 text-mk-coral"
                      dangerouslySetInnerHTML={{
                        __html: iconSvgMarkup({ id: '', name: '', group: '', tags: [], viewBox: p.viewBox, parts: p.parts, author: 'admin' }),
                      }}
                    />
                  );
                }
              }
              return (
                <div key={r.id} className="mk-card-2 flex items-center gap-3 p-3">
                  {preview || (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mk-panel-3 text-[11px] font-bold uppercase text-mk-muted">
                      {r.type.slice(0, 3)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{r.subtext || r.content_text}</div>
                    <div className="text-[11px] text-mk-dim">
                      {r.type} · {r.category} {!ok && <span className="text-red-600">· kode rusak</span>}
                    </div>
                  </div>
                  <button type="button" className="mk-btn-icon" onClick={() => edit(r)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="mk-btn-icon hover:!text-red-600" onClick={() => del(r)} title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
