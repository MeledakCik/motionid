import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client untuk Komponen Client Next.js 14+
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
