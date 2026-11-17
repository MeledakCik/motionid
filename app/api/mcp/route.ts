import { createMcpHandler } from '@modelcontextprotocol/server';
import { NextRequest, NextResponse } from 'next/server';
import { createTrainingServer } from '@/mcp/server';

/**
 * Konektor MCP jarak jauh (Streamable HTTP).
 *
 *   URL  : /api/mcp
 *   Auth : Authorization: Bearer <access token Supabase admin>
 *
 * Token diteruskan ke Supabase apa adanya; RLS `is_admin()` tetap penentu akhir
 * untuk operasi tulis. Tidak ada service-role key di jalur ini.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler((ctx) => createTrainingServer(ctx.authInfo?.token), {
  // Klien MCP 2025 memakai jalur stateless per request; tidak butuh sesi tersimpan.
  legacy: 'stateless',
});

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-expose-headers': 'mcp-session-id',
};

function bearer(req: NextRequest): string {
  const raw = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : '';
}

export async function POST(req: NextRequest) {
  const token = bearer(req);
  if (!token) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message:
            'Token Supabase belum dikirim. Gunakan header Authorization: Bearer <access token admin>. Lihat /admin/mcp untuk konfigurasi.',
        },
        id: null,
      },
      {
        status: 401,
        headers: { ...CORS, 'www-authenticate': 'Bearer realm="MotionID MCP"' },
      }
    );
  }
  const res = await handler.fetch(req, {
    authInfo: { token, clientId: 'motionid-remote', scopes: ['training'] },
  });
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function GET(req: NextRequest) {
  const token = bearer(req);
  if (!token) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Token Supabase belum dikirim.' }, id: null },
      { status: 401, headers: { ...CORS, 'www-authenticate': 'Bearer realm="MotionID MCP"' } }
    );
  }
  const res = await handler.fetch(req, {
    authInfo: { token, clientId: 'motionid-remote', scopes: ['training'] },
  });
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
