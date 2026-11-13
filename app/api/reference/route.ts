import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Pembaca link referensi untuk trainer admin.
 *   GET /api/reference?url=<link YouTube/TikTok>  → judul, kreator, thumbnail (lewat oEmbed resmi)
 *   GET /api/reference?thumb=<url thumbnail>      → gambar thumbnail (agar warnanya bisa dibaca di kanvas)
 * Hanya untuk admin, dan hanya ke host YouTube/TikTok (bukan proxy terbuka).
 */

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com').toLowerCase();
const PAGE_HOSTS = [/^(www\.|m\.)?youtube\.com$/, /^youtu\.be$/, /^(www\.|m\.|vm\.|vt\.)?tiktok\.com$/];
const THUMB_HOSTS = [/(^|\.)ytimg\.com$/, /(^|\.)tiktokcdn(-[a-z]+)?\.com$/, /(^|\.)ibyteimg\.com$/];
const MAX_THUMB_BYTES = 5 * 1024 * 1024;

function parseHttpsUrl(raw: string | null, allowed: RegExp[]): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    return allowed.some((re) => re.test(u.hostname.toLowerCase())) ? u : null;
  } catch {
    return null;
  }
}

async function isAdminRequest(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return false;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    return (data.user?.email || '').toLowerCase() === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Hanya admin yang bisa memakai fitur ini.' }, { status: 403 });
  }
  const params = req.nextUrl.searchParams;

  const thumbParam = params.get('thumb');
  if (thumbParam) {
    const thumb = parseHttpsUrl(thumbParam, THUMB_HOSTS);
    if (!thumb) return NextResponse.json({ error: 'Host thumbnail tidak diizinkan.' }, { status: 400 });
    const res = await fetch(thumb, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(8000) }).catch(
      () => null
    );
    const type = res?.headers.get('content-type') || '';
    if (!res || !res.ok || !type.startsWith('image/')) {
      return NextResponse.json({ error: 'Thumbnail tidak bisa diambil.' }, { status: 502 });
    }
    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_THUMB_BYTES) {
      return NextResponse.json({ error: 'Thumbnail terlalu besar.' }, { status: 413 });
    }
    return new NextResponse(body, {
      headers: { 'content-type': type, 'cache-control': 'private, max-age=600' },
    });
  }

  const page = parseHttpsUrl(params.get('url'), PAGE_HOSTS);
  if (!page) {
    return NextResponse.json(
      { error: 'Masukkan link https dari youtube.com, youtu.be, atau tiktok.com.' },
      { status: 400 }
    );
  }
  const isYouTube = /youtu/.test(page.hostname);
  const endpoint = isYouTube
    ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(page.toString())}`
    : `https://www.tiktok.com/oembed?url=${encodeURIComponent(page.toString())}`;
  const res = await fetch(endpoint, {
    headers: { 'user-agent': 'MotionKu/1.0 (+reference-reader)' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || !res.ok) {
    return NextResponse.json(
      { error: 'Link tidak bisa dibaca. Pastikan videonya publik dan pakai link lengkap.' },
      { status: 502 }
    );
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json({
    provider: isYouTube ? 'YouTube' : 'TikTok',
    title: String(data.title || '').slice(0, 400),
    author: String(data.author_name || '').slice(0, 100),
    authorUrl: String(data.author_url || ''),
    thumbnailUrl: String(data.thumbnail_url || ''),
  });
}
