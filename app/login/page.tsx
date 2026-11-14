'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/studio/ui';

/**
 * Halaman Login (/login)
 * Menggunakan Supabase Auth — Google Login Only (One-click OAuth)
 */
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
          redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
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
    <div className="mk-hero-bg flex min-h-screen items-center justify-center p-5 text-mk-cream">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-mk-line bg-mk-panel/95 p-7 text-center shadow-2xl sm:p-8">
        <div className="flex justify-center">
          <Logo className="text-lg" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Masuk ke MotionKu</h1>
          <p className="text-xs text-mk-muted">
            Satu klik masuk dengan akun Google untuk menyimpan dan mengelola semua proyek videomu.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-mk-cream px-5 py-3.5 text-sm font-bold text-mk-ink shadow-lg transition hover:bg-white disabled:opacity-50"
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

        <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-mk-dim">
          <ShieldCheck className="h-4 w-4 text-mk-mint" />
          <span>Dilindungi Row-Level Security (RLS) Supabase • Tanpa API Key AI</span>
        </div>
      </div>
    </div>
  );
}
