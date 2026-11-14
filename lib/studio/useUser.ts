'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AuthState {
  loading: boolean;
  user: { id: string; email?: string; name?: string } | null;
}

let cache: AuthState | null = null;

/** Status login di sisi browser (tamu = user null). */
export function useUser(): AuthState {
  const [s, setS] = useState<AuthState>(cache || { loading: true, user: null });
  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const u = data.user;
        cache = { loading: false, user: u ? { id: u.id, email: u.email || undefined, name: (u.user_metadata?.full_name as string) || undefined } : null };
        if (alive) setS(cache);
      })
      .catch(() => alive && setS({ loading: false, user: null }));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}

/** Arahkan ke login lalu kembali ke halaman ini. */
export function loginHref(): string {
  if (typeof window === 'undefined') return '/login';
  return `/login?next=${encodeURIComponent(window.location.pathname)}`;
}
