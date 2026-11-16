import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod/v4';
import { parseSvgMarkup } from '../lib/studio/packs/icons';
import { parseComponentCode } from '../lib/studio/packs/components';
import { parseTransitionCode } from '../lib/studio/packs/transitions';
import { parseAnimationCode } from '../lib/studio/packs/animations';
import { parseEffectCode } from '../lib/studio/packs/effects';

const trainingTypes = [
  'icon_pack',
  'component_pack',
  'transition_pack',
  'animation_pack',
  'effect_pack',
  'hook',
  'cta',
  'scene2',
  'scene3',
] as const;
const categories = ['all', 'promo', 'edukasi', 'quote', 'saas'] as const;
const rowSelection = 'id,type,category,content_text,subtext,metadata_json,created_at';

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Environment variable ${name} belum diisi.`);
  return value;
}

function getTrainingClient() {
  const url = requiredEnv('SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = requiredEnv('SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const accessToken = requiredEnv('SUPABASE_ACCESS_TOKEN');
  return {
    accessToken,
    client: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }),
  };
}

async function requireAuthenticatedUser() {
  const { client, accessToken } = getTrainingClient();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error('Token Supabase tidak valid atau sudah kedaluwarsa. Perbarui SUPABASE_ACCESS_TOKEN.');
  }
  return client;
}

function jsonResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function validateTrainingContent(type: (typeof trainingTypes)[number], content: string, name = 'Custom') {
  let result: { ok: boolean; error?: string };
  switch (type) {
    case 'icon_pack': result = parseSvgMarkup(content); break;
    case 'component_pack': result = parseComponentCode(content, name); break;
    case 'transition_pack': result = parseTransitionCode(content, name); break;
    case 'animation_pack': result = parseAnimationCode(content, name); break;
    case 'effect_pack': result = parseEffectCode(content, name); break;
    default: result = { ok: content.trim().length > 0 };
  }
  if (!result.ok) throw new Error(result.error || `Konten ${type} tidak valid.`);
}

function createServer() {
  const server = new McpServer({ name: 'motionid-training', version: '1.0.0' });

  server.registerTool(
    'training_list',
    {
      description: 'Cari dan baca data di bank training MotionID. Batas setiap halaman maksimal 100 baris.',
      inputSchema: z.object({
        type: z.enum(trainingTypes).optional(),
        category: z.enum(categories).optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
      }),
    },
    async ({ type, category, search, limit, offset }) => {
      try {
        const client = await requireAuthenticatedUser();
        let query = client
          .from('ai_training_data')
          .select(rowSelection, { count: 'exact' })
          .in('type', type ? [type] : [...trainingTypes])
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
        if (category) query = query.eq('category', category);
        if (search?.trim()) query = query.ilike('content_text', `%${search.trim()}%`);
        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;
        return jsonResult({ total: count || 0, offset, limit, rows: data || [] });
      } catch (error) {
        return { ...jsonResult({ error: (error as Error).message }), isError: true };
      }
    }
  );

  server.registerTool(
    'training_get',
    {
      description: 'Ambil satu baris training berdasarkan UUID.',
      inputSchema: z.object({ id: z.string().uuid() }),
    },
    async ({ id }) => {
      try {
        const client = await requireAuthenticatedUser();
        const { data, error } = await client.from('ai_training_data').select(rowSelection).eq('id', id).single();
        if (error) throw error;
        return jsonResult(data);
      } catch (error) {
        return { ...jsonResult({ error: (error as Error).message }), isError: true };
      }
    }
  );

  server.registerTool(
    'training_add',
    {
      description: 'Tambah data training ke Supabase. Kebijakan RLS aplikasi membatasi penambahan hanya untuk admin.',
      inputSchema: z.object({
        type: z.enum(trainingTypes),
        category: z.enum(categories).default('all'),
        content_text: z.string().trim().min(1).max(100_000),
        name: z.string().trim().max(200).optional(),
        tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
      }),
    },
    async ({ type, category, content_text, name, tags }) => {
      try {
        const client = await requireAuthenticatedUser();
        validateTrainingContent(type, content_text, name);
        const { data, error } = await client
          .from('ai_training_data')
          .insert({
            type,
            category,
            content_text,
            subtext: name || null,
            metadata_json: { tags, engine: 'v6', source: 'mcp' },
          })
          .select(rowSelection)
          .single();
        if (error) throw error;
        return jsonResult({ message: 'Training tersimpan.', row: data });
      } catch (error) {
        return { ...jsonResult({ error: (error as Error).message }), isError: true };
      }
    }
  );

  server.registerTool(
    'training_update',
    {
      description: 'Ubah isi data training yang sudah ada. Kebijakan RLS aplikasi membatasi perubahan hanya untuk admin.',
      inputSchema: z.object({
        id: z.string().uuid(),
        type: z.enum(trainingTypes).optional(),
        category: z.enum(categories).optional(),
        content_text: z.string().trim().min(1).max(100_000).optional(),
        name: z.string().trim().max(200).nullable().optional(),
        tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
      }).refine(({ type, category, content_text, name, tags }) =>
        type !== undefined || category !== undefined || content_text !== undefined || name !== undefined || tags !== undefined,
      'Isi minimal satu field yang akan diubah.'),
    },
    async ({ id, type, category, content_text, name, tags }) => {
      try {
        const client = await requireAuthenticatedUser();
        const { data: current, error: currentError } = await client
          .from('ai_training_data')
          .select('type,content_text,subtext')
          .eq('id', id)
          .single();
        if (currentError) throw currentError;
        validateTrainingContent(
          type || current.type,
          content_text ?? current.content_text,
          name === undefined ? current.subtext || 'Custom' : name || 'Custom'
        );
        const patch: Record<string, unknown> = {};
        if (type !== undefined) patch.type = type;
        if (category !== undefined) patch.category = category;
        if (content_text !== undefined) patch.content_text = content_text;
        if (name !== undefined) patch.subtext = name;
        if (tags !== undefined) patch.metadata_json = { tags, engine: 'v6', source: 'mcp' };
        const { data, error } = await client
          .from('ai_training_data')
          .update(patch)
          .eq('id', id)
          .select(rowSelection)
          .single();
        if (error) throw error;
        return jsonResult({ message: 'Training diperbarui.', row: data });
      } catch (error) {
        return { ...jsonResult({ error: (error as Error).message }), isError: true };
      }
    }
  );

  server.registerTool(
    'training_delete',
    {
      description: 'Hapus satu data training berdasarkan UUID. Hanya admin yang diizinkan oleh RLS.',
      inputSchema: z.object({ id: z.string().uuid() }),
    },
    async ({ id }) => {
      try {
        const client = await requireAuthenticatedUser();
        const { data, error } = await client.from('ai_training_data').delete().eq('id', id).select('id').maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Training tidak ditemukan atau akun ini tidak memiliki izin untuk menghapusnya.');
        return jsonResult({ message: 'Permintaan penghapusan training berhasil.', id });
      } catch (error) {
        return { ...jsonResult({ error: (error as Error).message }), isError: true };
      }
    }
  );

  return server;
}

void serveStdio(createServer);
