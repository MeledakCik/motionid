import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { Sparkles, Play, Zap, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

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

/**
 * Landing Page (/) MotionKu
 * Hero: "Ketik Topik, Jadi Video TikTok", 3 contoh video template,
 * Cara kerja 3 langkah, dan tombol CTA "Buat Gratis - Tanpa API Key"
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navbar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-lg">
              M
            </div>
            <span className="font-bold text-lg tracking-tight">MotionKu</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% Zero AI API
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2"
            >
              Masuk
            </Link>
            <Link
              href="/create"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg hover:opacity-95 transition"
            >
              Buat Gratis - Tanpa API Key
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Template Engine + Rule-Based Generator Lokal</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Ketik Topik,{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Jadi Video TikTok
            </span>
          </h1>

          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Otomatis buat Hook viral, 4 Scene animasi, CTA, serta Caption & Hashtag TikTok/Reels/Shorts
            dalam hitungan detik. Tanpa OpenAI, Gemini, atau Claude API—bebas biaya dan tanpa kuota limit!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-white shadow-xl hover:scale-[1.02] transition"
            >
              <span>Buat Gratis - Tanpa API Key</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold text-slate-200 transition"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Buka Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Contoh Video Template */}
      <section className="py-14 px-6 border-t border-white/10 bg-slate-900/40">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">9 Template Siap Pakai dalam 3 Kategori</h2>
            <p className="text-sm text-slate-400">
              Dirancang khusus untuk algoritma video pendek vertikal 9:16, 1:1, dan 16:9
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 p-6 space-y-4">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                Kategori A • Quote
              </span>
              <h3 className="text-xl font-bold">Aura Gradient, Typewriter & Karaoke</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cocok untuk akun quotes galau, motivasi malam, dan kata-kata bijak dengan musik piano lo-fi.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-rose-950 to-amber-950 border border-white/10 p-6 space-y-4">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300">
                Kategori B • Promo UMKM
              </span>
              <h3 className="text-xl font-bold">Harga Jumbo, Before-After & Countdown</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dilengkapi stiker DISKON berkedip, perbandingan harga coret, dan timer FOMO untuk UMKM kuliner/produk.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-sky-950 border border-white/10 p-6 space-y-4">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
                Kategori C • Edukasi / Hook
              </span>
              <h3 className="text-xl font-bold">3 Langkah Angka Besar, Fakta Pop & Quiz</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Format edukasi cepat dengan angka 1-2-3 raksasa, pop-up fakta mengejutkan, dan Q&A interaktif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja 3 Langkah */}
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">Cara Kerja 3 Langkah</h2>
            <p className="text-sm text-slate-400">Dari ide mentah sampai file MP4 siap upload ke TikTok</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-black">
                1
              </div>
              <h3 className="font-bold text-lg">Ketik Topik & Kategori</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masukkan topik seperti &quot;promo kopi susu 18rb&quot; atau &quot;kata-kata galau&quot;. Smart Engine mendeteksi harga, produk, dan emosi secara instan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                2
              </div>
              <h3 className="font-bold text-lg">Kustomisasi di Live Editor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ubah teks per scene, pilih 9 template, 6 font Google, 8 palet warna, animasi masuk, musik latar, atau klik &quot;Acak Lagi&quot;.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                3
              </div>
              <h3 className="font-bold text-lg">Export Video di Browser</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Render langsung di browser menggunakan HTML5 Canvas + MediaRecorder + AudioContext dan salin paket Caption + Hashtag TikTok.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
