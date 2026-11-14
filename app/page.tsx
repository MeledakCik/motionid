import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Film, Layers, MonitorSmartphone, MousePointer2, Smartphone, Sparkles, Wand2, Zap } from 'lucide-react';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import HeroDemo from '@/components/landing/HeroDemo';
import { Logo } from '@/components/studio/ui';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  inLanguage: 'id-ID',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
};

const STATS = [
  ['360', 'template'],
  ['360', 'komponen'],
  ['630', 'ikon'],
  ['328', 'transisi'],
  ['342', 'animasi'],
  ['370', 'efek'],
];

const FEATURES = [
  { icon: Wand2, title: 'Prompt yang benar-benar dibaca', desc: 'Bukan cuma pilih 3 kategori. 17 jenis video dikenali otomatis — promo, flash sale, menu, tips, tutorial, quote, lowongan, event — dan jumlah scene mengikuti isi prompt.' },
  { icon: MousePointer2, title: 'Edit bebas ala Figma', desc: 'Klik elemen, seret, ubah ukuran, putar, snap ke tengah. Ketuk dua kali untuk mengetik langsung di video.' },
  { icon: Film, title: 'Timeline ala CapCut', desc: 'Atur durasi scene, transisi antar scene, dan waktu muncul tiap elemen. Undo/redo tanpa batas.' },
  { icon: Sparkles, title: '370+ efek visual', desc: 'Kaca pecah, pasir, hujan, salju, confetti, kembang api, petir, bara api, VHS, film grain, hujan emoji, dan banyak lagi — tinggal klik per scene.' },
  { icon: Layers, title: 'Foto, latar & komponen', desc: 'Unggah foto produk sebagai latar atau elemen. Tambah label harga, tombol, rating, chat, countdown, mockup HP.' },
  { icon: Zap, title: 'Export MP4 super mulus', desc: 'Dirender frame-per-frame dengan timestamp pasti, jadi video tidak patah-patah meski HP sedang sibuk.' },
  { icon: MonitorSmartphone, title: 'Ringan di HP kentang', desc: 'Resolusi preview & efek otomatis menyesuaikan kemampuan perangkat. Nyaman di layar kecil, tablet, dan desktop.' },
];

export default function LandingPage() {
  return (
    <div className="mk-hero-bg min-h-screen text-mk-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b border-mk-line/60 bg-mk-night/70 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/" aria-label="MotionKu, ke beranda">
            <Logo />
          </Link>
          <div className="ml-6 hidden gap-1 text-sm text-mk-muted md:flex">
            <a href="#fitur" className="rounded-lg px-3 py-2 hover:text-mk-cream">Fitur</a>
            <a href="#cara" className="rounded-lg px-3 py-2 hover:text-mk-cream">Cara kerja</a>
            <a href="#faq" className="rounded-lg px-3 py-2 hover:text-mk-cream">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-mk-muted hover:text-mk-cream sm:block">
              Masuk
            </Link>
            <Link href="/create" className="mk-btn-primary px-4 py-2">
              Mulai gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-mk-coral/30 bg-mk-coral/10 px-3 py-1 text-xs font-bold text-mk-coral">
            <Sparkles className="h-3.5 w-3.5" /> Studio motion graphic untuk TikTok, Reels & Shorts
          </span>
          <h1 className="mt-5 max-w-3xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[60px]">
            Tulis satu kalimat, <span className="mk-grad-text">jadi video yang bisa kamu edit sepuasnya.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-mk-muted sm:text-lg">
            MotionKu menyusun naskah, scene, warna, animasi, dan musik dari prompt-mu. Lalu edit seperti Figma, atur seperti CapCut, dan export MP4 mulus — semua di browser, gratis.
          </p>
          <div className="mt-8">
            <HeroDemo />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16" aria-label="Jumlah aset">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STATS.map(([n, l]) => (
              <div key={l} className="mk-card px-4 py-4 text-center">
                <div className="text-3xl font-extrabold text-mk-coral">{n}+</div>
                <div className="text-xs text-mk-muted">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Semua yang kamu butuhkan, tanpa ribet.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="mk-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mk-coral/15 text-mk-coral">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-extrabold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mk-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cara" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tiga langkah dari ide ke video.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ['1', 'Tulis idemu', 'Ketik bebas seperti chat. Tambahkan foto produk kalau ada.'],
              ['2', 'Pilih template', 'Dari 360 template, yang paling cocok dengan prompt muncul paling atas.'],
              ['3', 'Edit & export', 'Ubah teks, warna, posisi, animasi. Export MP4 sampai 1080p 60fps.'],
            ].map(([n, t, d]) => (
              <div key={n} className="mk-card relative overflow-hidden p-5">
                <span className="absolute -right-2 -top-6 text-[110px] font-extrabold leading-none text-mk-coral/10">{n}</span>
                <h3 className="text-lg font-extrabold">{t}</h3>
                <p className="mt-1.5 text-sm text-mk-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Pertanyaan yang sering muncul.</h2>
          <div className="mt-6 space-y-2">
            {[
              ['Apakah gratis?', 'Ya. Semua diproses di browser-mu tanpa API AI berbayar, jadi tidak ada kuota.'],
              ['Bisa dipakai di HP?', 'Bisa. Editor punya tampilan khusus HP (menu bawah & panel geser) dan otomatis menurunkan beban di HP menengah ke bawah.'],
              ['Kenapa video saya dulu patah-patah?', 'Versi lama merekam layar secara real-time. Sekarang setiap frame dirender satu per satu dengan waktu pasti (WebCodecs), jadi hasilnya halus.'],
              ['Format apa yang dihasilkan?', 'MP4 (H.264 + AAC) di Chrome/Edge/Safari terbaru, rasio 9:16, 4:5, 1:1, atau 16:9.'],
            ].map(([q, a]) => (
              <details key={q} className="mk-card group p-4">
                <summary className="cursor-pointer list-none text-sm font-bold">
                  {q}
                  <span className="float-right text-mk-coral transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-mk-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-mk-grad p-8 text-mk-ink sm:p-12">
            <Smartphone className="absolute -bottom-6 right-6 h-40 w-40 opacity-15" />
            <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Video pertamamu tinggal satu kalimat lagi.</h2>
            <Link href="/create" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-mk-ink px-5 py-3 text-sm font-bold text-mk-cream">
              Buat video sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-mk-line py-8 text-center text-xs text-mk-dim">
        © {new Date().getFullYear()} {SITE_NAME} · Ikon oleh Lucide (ISC)
      </footer>
    </div>
  );
}
