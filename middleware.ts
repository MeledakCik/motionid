import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com';

/**
 * Middleware Proteksi Route MotionKu
 * - Melindungi halaman /dashboard, /create, /editor, dan /admin.
 * - Jika belum login, otomatis redirect ke /login.
 * - Khusus halaman /admin, hanya mengizinkan email admin (kakangkasyaf@gmail.com).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Tanpa konfigurasi Supabase, identitas user tidak bisa dicek: halaman admin ditutup.
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      homeUrl.search = '';
      return NextResponse.redirect(homeUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/editor') ||
    pathname.startsWith('/admin');

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteksi khusus halaman Admin Training (/admin) hanya untuk kakangkasyaf@gmail.com
  if (pathname.startsWith('/admin') && user) {
    const userEmail = (user.email || '').toLowerCase();
    if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = '/dashboard';
      dashUrl.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(dashUrl);
    }
  }

  if (pathname === '/login' && user) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*', '/editor/:path*', '/admin/:path*', '/login'],
};
