'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/studio/ui';

/**
 * Halaman Login (/login)
 * Menggunakan Supabase Auth — Google Login Only (One-click OAuth)
 */
function nextPath(): string {
  try {
    const q = new URLSearchParams(window.location.search);
    const n = q.get('next') || q.get('redirectedFrom') || '/dashboard';
    return n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createClient();
      // Selalu pakai origin saja (tanpa path), supaya salah isi env tidak
      // menghasilkan URL ganda seperti /auth/callback/auth/callback
      let siteUrl = window.location.origin;
      try {
        if (process.env.NEXT_PUBLIC_SITE_URL) {
          siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
        }
      } catch {
        // abaikan env yang tidak valid
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath())}`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memulai login Google.');
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen text-mk-cream lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:p-4">
      {/* Panel brand (desktop): ungu DepUp + kartu lime, gaya panduan brand hal. 11 */}
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-[28px] bg-mk-coral p-10 text-white lg:flex">
        <svg className="pointer-events-none absolute -bottom-16 -right-10 h-[420px] w-[420px] text-white/[0.07]" viewBox="0 0 100 100" aria-hidden>
          <path fill="currentColor" d="M50 4 96 50H70v46H30V50H4z" />
        </svg>
        <Logo className="text-lg [&_.bg-mk-coral]:bg-white [&_.bg-mk-coral]:text-mk-coral [&_.text-mk-coral]:text-mk-lime" />
        <div className="relative max-w-md">
          <h2 className="text-[48px] font-bold leading-[1.02] tracking-[-0.03em]">
            Satu kalimat,
            <br />
            <span className="text-mk-lime">jadi video.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">Tulis idemu, MotionKu menyusun scene, teks, warna, dan animasinya. Kamu tinggal rapikan dan unduh MP4.</p>
        </div>
        <div className="relative grid max-w-md grid-cols-3 gap-3 text-mk-deep">
          {[
            ['1', 'Tulis ide'],
            ['2', 'Pilih template'],
            ['3', 'Unduh MP4'],
          ].map(([n, t]) => (
            <div key={n} className="rounded-2xl bg-mk-lime p-4">
              <div className="text-2xl font-bold">{n}</div>
              <div className="mt-3 text-sm font-semibold">{t}</div>
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-mk-up">
          <div className="lg:hidden">
            <Logo className="text-lg" />
          </div>
          <h1 className="mt-8 text-[32px] font-bold leading-tight lg:mt-0">Masuk ke MotionKu</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-mk-muted">Pakai akun Google supaya semua proyek videomu tersimpan dan bisa dibuka dari perangkat mana pun.</p>

          {errorMsg && (
            <div role="alert" className="mt-5 rounded-2xl bg-red-500/10 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="mt-8">
        <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-mk-line-2 bg-white px-5 py-3 text-[15px] font-semibold text-mk-cream transition hover:border-mk-coral disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-4.01v3.14C3.515 21.3 7.615 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-4.01C.705 8.24.255 10.06.255 12s.45 3.76 1.27 5.38l4.01-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.615 0 3.515 2.7 1.525 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{loading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
            </button>

          </div>

          <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-mk-dim">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mk-coral" aria-hidden />
            <span>Proyekmu hanya bisa dibuka oleh akunmu sendiri. Kami tidak pernah memposting apa pun ke akun Google-mu.</span>
          </p>
          <a href="/create" className="mt-8 inline-flex text-sm font-semibold text-mk-coral hover:underline">
            Coba dulu tanpa masuk
          </a>
        </div>
      </main>
    </div>
  );
}
