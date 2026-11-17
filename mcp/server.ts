import { McpServer } from '@modelcontextprotocol/server';
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod/v4';
import { parseSvgMarkup } from '../lib/studio/packs/icons';
import { COMPONENT_CODE_EXAMPLE, parseComponentCode } from '../lib/studio/packs/components';
import { parseTransitionCode, TRANSITION_CODE_EXAMPLE } from '../lib/studio/packs/transitions';
import { ANIMATION_CODE_EXAMPLE, parseAnimationCode } from '../lib/studio/packs/animations';
import { EFFECT_CODE_EXAMPLE, parseEffectCode } from '../lib/studio/packs/effects';
import { buildResearchBrief, briefToMarkdown, MOTION_RECIPES, motionSource, recipeCode } from '../lib/motion-lab';
import {
  MCP_GUIDE,
  MCP_RESOURCES,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_TOOLS as MCP_TOOLS_REFERENCE,
  MCP_TYPE_GUIDE,
  type McpToolInfo,
} from '../lib/mcp/catalog';

export const trainingTypes = [
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
export const categories = ['all', 'promo', 'edukasi', 'quote', 'saas'] as const;

const trainingTypeEnum = z.enum(trainingTypes);
const categoryEnum = z.enum(categories);
const rowSelection = 'id,type,category,content_text,subtext,metadata_json,created_at';
const MAX_BULK = 50;
const MAX_EXPORT = 2000;

type TrainingType = (typeof trainingTypes)[number];

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Environment variable ${name} belum diisi.`);
  return value;
}

function trainingClient(accessTokenOverride?: string) {
  const url = requiredEnv('SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = requiredEnv('SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const accessToken = accessTokenOverride || requiredEnv('SUPABASE_ACCESS_TOKEN');
  return {
    accessToken,
    client: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }),
  };
}

async function authenticatedClient(accessTokenOverride?: string) {
  const { client, accessToken } = trainingClient(accessTokenOverride);
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error('Token Supabase tidak valid atau sudah kedaluwarsa. Perbarui SUPABASE_ACCESS_TOKEN.');
  }
  return { client, user: data.user, accessToken };
}

function jsonResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function fail(error: unknown) {
  return { ...jsonResult({ error: error instanceof Error ? error.message : String(error) }), isError: true as const };
}

function validateTrainingContent(type: TrainingType, content: string, name = 'Custom') {
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

function normalizeContent(type: TrainingType, content: string, name = 'Custom') {
  if (type === 'icon_pack') {
    const parsed = parseSvgMarkup(content);
    if (!parsed.ok) throw new Error(parsed.error || 'SVG tidak valid.');
    return { ok: true, shape: 'svg', viewBox: parsed.viewBox, paths: parsed.parts.length };
  }
  if (type === 'component_pack') {
    const parsed = parseComponentCode(content, name);
    if (!parsed.ok || !parsed.def) throw new Error(parsed.error || 'Komponen tidak valid.');
    return { ok: true, shape: 'component', kind: parsed.def.kind, tags: parsed.def.tags };
  }
  if (type === 'transition_pack') {
    const parsed = parseTransitionCode(content, name);
    if (!parsed.ok || !parsed.spec) throw new Error(parsed.error || 'Transisi tidak valid.');
    return { ok: true, shape: 'transition', kind: parsed.spec.kind, duration: parsed.spec.duration, energy: parsed.spec.energy };
  }
  if (type === 'animation_pack') {
    const parsed = parseAnimationCode(content, name);
    if (!parsed.ok || !parsed.spec) throw new Error(parsed.error || 'Animasi tidak valid.');
    return {
      ok: true,
      shape: 'animation',
      kind: parsed.spec.kind,
      duration: parsed.spec.duration,
      hasKeyframes: !!parsed.spec.keyframes,
      hasText: !!parsed.spec.text,
    };
  }
  if (type === 'effect_pack') {
    const parsed = parseEffectCode(content, name);
    if (!parsed.ok || !parsed.spec) throw new Error(parsed.error || 'Efek tidak valid.');
    return { ok: true, shape: 'effect', kind: parsed.spec.kind, style: parsed.spec.params.style };
  }
  const text = content.trim();
  if (!text) throw new Error('Konten teks tidak boleh kosong.');
  return { ok: true, shape: 'text', characters: text.length };
}

function toolMeta(name: string, annotations: Record<string, boolean> = {}) {
  const info = (MCP_TOOLS_REFERENCE as readonly McpToolInfo[]).find((t) => t.name === name);
  return {
    title: info?.title,
    description: info?.description,
    annotations: { readOnlyHint: info?.kind !== 'write', destructiveHint: false, ...annotations },
  };
}

// Katalog diimpor dari file bersama (deskripsi tool = satu sumber dengan admin).

function makeServer(accessTokenOverride?: string) {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  const cloud = () => authenticatedClient(accessTokenOverride);

  server.registerTool(
    'training_health',
    {
      ...toolMeta('training_health'),
      inputSchema: z.object({}),
    },
    async () => {
      const started = Date.now();
      try {
        const { client, user } = await cloud();
        let isAdmin = false;
        const rpc = await client.rpc('is_admin');
        if (!rpc.error) isAdmin = !!rpc.data;
        else isAdmin = ((user.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kangkasyaf@gmail.com').toLowerCase());
        const counts: Record<string, number> = {};
        await Promise.all(
          trainingTypes.map(async (type) => {
            const { count } = await client.from('ai_training_data').select('id', { count: 'exact', head: true }).eq('type', type);
            counts[type] = count || 0;
          })
        );
        const { count: total } = await client.from('ai_training_data').select('id', { count: 'exact', head: true });
        return jsonResult({
          ok: true,
          server: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
          user: { id: user.id, email: user.email },
          isAdmin,
          total: total || 0,
          counts,
          latencyMs: Date.now() - started,
          warnings: isAdmin ? [] : ['Akun ini bisa membaca tetapi tidak bisa menulis (bukan admin RLS).'],
        });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_schema',
    { ...toolMeta('training_schema'), inputSchema: z.object({}) },
    async () =>
      jsonResult({
        server: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
        types: trainingTypes,
        categories,
        formats: MCP_TYPE_GUIDE,
        limits: { listPage: 100, bulkItems: MAX_BULK, exportRows: MAX_EXPORT, contentChars: 100_000, tags: 50 },
        examples: {
          icon: '<svg viewBox="0 0 24 24"><path d="M12 2 2 22h20L12 2z"/></svg>',
          component: COMPONENT_CODE_EXAMPLE,
          transition: TRANSITION_CODE_EXAMPLE,
          animation: ANIMATION_CODE_EXAMPLE,
          effect: EFFECT_CODE_EXAMPLE,
        },
        guide: MCP_GUIDE,
      })
  );

  server.registerTool(
    'training_list',
    {
      ...toolMeta('training_list'),
      inputSchema: z.object({
        type: trainingTypeEnum.optional(),
        category: categoryEnum.optional(),
        search: z.string().max(200).optional(),
        tag: z.string().max(80).optional(),
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
      }),
    },
    async ({ type, category, search, tag, limit, offset }) => {
      try {
        const { client } = await cloud();
        let query = client
          .from('ai_training_data')
          .select(rowSelection, { count: 'exact' })
          .in('type', type ? [type] : [...trainingTypes])
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
        if (category) query = query.eq('category', category);
        if (search?.trim()) {
          const q = search.trim().replace(/[%,()]/g, ' ');
          query = query.or(`content_text.ilike.%${q}%,subtext.ilike.%${q}%`);
        }
        if (tag?.trim()) query = query.contains('metadata_json', { tags: [tag.trim()] });
        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;
        return jsonResult({ total: count || 0, offset, limit, rows: data || [] });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_get',
    { ...toolMeta('training_get'), inputSchema: z.object({ id: z.string().uuid() }) },
    async ({ id }) => {
      try {
        const { client } = await cloud();
        const { data, error } = await client.from('ai_training_data').select(rowSelection).eq('id', id).single();
        if (error) throw error;
        return jsonResult(data);
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_stats',
    {
      ...toolMeta('training_stats'),
      inputSchema: z.object({ type: trainingTypeEnum.optional(), category: categoryEnum.optional() }),
    },
    async ({ type, category }) => {
      try {
        const { client } = await cloud();
        let countQuery = client.from('ai_training_data').select('id', { count: 'exact', head: true });
        if (type) countQuery = countQuery.eq('type', type);
        if (category) countQuery = countQuery.eq('category', category);
        const { count } = await countQuery;

        let rowsQuery = client
          .from('ai_training_data')
          .select('id,type,category,content_text,subtext,metadata_json,created_at')
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT);
        if (type) rowsQuery = rowsQuery.eq('type', type);
        if (category) rowsQuery = rowsQuery.eq('category', category);
        const { data, error } = await rowsQuery;
        if (error) throw error;
        const rows = (data || []) as Array<{ id: string; type: string; category: string; content_text: string; subtext?: string | null; metadata_json?: { tags?: string[] } | null; created_at?: string }>;

        const byType: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        const tags = new Map<string, number>();
        const seen = new Map<string, number>();
        const duplicates: Array<{ type: string; content: string; count: number }> = [];
        for (const row of rows) {
          byType[row.type] = (byType[row.type] || 0) + 1;
          byCategory[row.category] = (byCategory[row.category] || 0) + 1;
          (row.metadata_json?.tags || []).forEach((t) => tags.set(t, (tags.get(t) || 0) + 1));
          const key = `${row.type}::${row.content_text.trim().replace(/\s+/g, ' ')}`;
          seen.set(key, (seen.get(key) || 0) + 1);
        }
        seen.forEach((count, key) => {
          if (count > 1) duplicates.push({ type: key.split('::')[0], content: key.split('::').slice(1).join('::').slice(0, 160), count });
        });
        return jsonResult({
          total: count || rows.length,
          scanned: rows.length,
          byType,
          byCategory,
          topTags: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, n]) => ({ tag, count: n })),
          duplicates: duplicates.slice(0, 20),
          newest: rows.slice(0, 5).map((r) => ({ id: r.id, type: r.type, name: r.subtext, created_at: r.created_at })),
        });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_validate',
    {
      ...toolMeta('training_validate'),
      inputSchema: z.object({
        type: trainingTypeEnum,
        content_text: z.string().trim().min(1).max(100_000),
        name: z.string().trim().max(200).optional(),
      }),
    },
    async ({ type, content_text, name }) => {
      try {
        const normalized = normalizeContent(type, content_text, name);
        return jsonResult({ ok: true, normalized, warnings: [] });
      } catch (error) {
        return jsonResult({ ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  server.registerTool(
    'training_add',
    {
      ...toolMeta('training_add', { destructiveHint: false }),
      inputSchema: z.object({
        type: trainingTypeEnum,
        category: categoryEnum.default('all'),
        content_text: z.string().trim().min(1).max(100_000),
        name: z.string().trim().max(200).optional(),
        tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
      }),
    },
    async ({ type, category, content_text, name, tags }) => {
      try {
        const { client } = await cloud();
        validateTrainingContent(type, content_text, name);
        const { data, error } = await client
          .from('ai_training_data')
          .insert({
            type,
            category,
            content_text,
            subtext: name || null,
            metadata_json: { tags, engine: 'v7', source: 'mcp' },
          })
          .select(rowSelection)
          .single();
        if (error) throw error;
        return jsonResult({ message: 'Training tersimpan.', row: data });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_bulk_add',
    {
      ...toolMeta('training_bulk_add'),
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              type: trainingTypeEnum,
              category: categoryEnum.default('all'),
              content_text: z.string().trim().min(1).max(100_000),
              name: z.string().trim().max(200).optional(),
              tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
            })
          )
          .min(1)
          .max(MAX_BULK),
      }),
    },
    async ({ items }) => {
      try {
        const { client } = await cloud();
        const results: Array<{ index: number; ok: boolean; id?: string; error?: string }> = [];
        const payloads: Array<Record<string, unknown>> = [];
        const indexes: number[] = [];
        items.forEach((item, index) => {
          try {
            validateTrainingContent(item.type, item.content_text, item.name);
            payloads.push({
              type: item.type,
              category: item.category,
              content_text: item.content_text,
              subtext: item.name || null,
              metadata_json: { tags: item.tags, engine: 'v7', source: 'mcp' },
            });
            indexes.push(index);
          } catch (error) {
            results.push({ index, ok: false, error: error instanceof Error ? error.message : String(error) });
          }
        });
        if (payloads.length) {
          const { data, error } = await client.from('ai_training_data').insert(payloads).select('id');
          if (error) throw error;
          const inserted = (data || []) as Array<{ id: string }>;
          indexes.forEach((index, i) => results.push({ index, ok: true, id: inserted[i]?.id }));
        }
        results.sort((a, b) => a.index - b.index);
        return jsonResult({
          inserted: results.filter((r) => r.ok).length,
          skipped: results.filter((r) => !r.ok).length,
          results,
        });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_update',
    {
      ...toolMeta('training_update'),
      inputSchema: z
        .object({
          id: z.string().uuid(),
          type: trainingTypeEnum.optional(),
          category: categoryEnum.optional(),
          content_text: z.string().trim().min(1).max(100_000).optional(),
          name: z.string().trim().max(200).nullable().optional(),
          tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
        })
        .refine(
          ({ type, category, content_text, name, tags }) =>
            type !== undefined || category !== undefined || content_text !== undefined || name !== undefined || tags !== undefined,
          'Isi minimal satu field yang akan diubah.'
        ),
    },
    async ({ id, type, category, content_text, name, tags }) => {
      try {
        const { client } = await cloud();
        const { data: current, error: currentError } = await client
          .from('ai_training_data')
          .select('type,content_text,subtext,metadata_json')
          .eq('id', id)
          .single();
        if (currentError) throw currentError;
        const nextType = (type || current.type) as TrainingType;
        const nextContent = content_text ?? current.content_text;
        validateTrainingContent(nextType, nextContent, name === undefined ? current.subtext || 'Custom' : name || 'Custom');
        const patch: Record<string, unknown> = {};
        if (type !== undefined) patch.type = type;
        if (category !== undefined) patch.category = category;
        if (content_text !== undefined) patch.content_text = content_text;
        if (name !== undefined) patch.subtext = name;
        if (tags !== undefined) {
          const previous = (current.metadata_json || {}) as Record<string, unknown>;
          patch.metadata_json = { ...previous, tags, engine: 'v7', source: 'mcp' };
        }
        const { data, error } = await client.from('ai_training_data').update(patch).eq('id', id).select(rowSelection).single();
        if (error) throw error;
        return jsonResult({ message: 'Training diperbarui.', row: data });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_delete',
    {
      ...toolMeta('training_delete', { destructiveHint: true }),
      inputSchema: z.object({ id: z.string().uuid() }),
    },
    async ({ id }) => {
      try {
        const { client } = await cloud();
        const { data, error } = await client.from('ai_training_data').delete().eq('id', id).select('id').maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Training tidak ditemukan atau akun ini tidak memiliki izin untuk menghapusnya.');
        return jsonResult({ message: 'Permintaan penghapusan training berhasil.', id });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'training_export',
    {
      ...toolMeta('training_export'),
      inputSchema: z.object({
        type: trainingTypeEnum.optional(),
        category: categoryEnum.optional(),
        limit: z.number().int().min(1).max(MAX_EXPORT).default(500),
      }),
    },
    async ({ type, category, limit }) => {
      try {
        const { client } = await cloud();
        let query = client
          .from('ai_training_data')
          .select(rowSelection)
          .in('type', type ? [type] : [...trainingTypes])
          .order('created_at', { ascending: true })
          .limit(limit);
        if (category) query = query.eq('category', category);
        const { data, error } = await query;
        if (error) throw error;
        const bucket: Record<string, Array<Record<string, unknown>>> = {};
        (data || []).forEach((row) => {
          const item = row as Record<string, unknown>;
          const key =
            row.type === 'icon_pack' ? 'icons'
              : row.type === 'component_pack' ? 'components'
                : row.type === 'transition_pack' ? 'transitions'
                  : row.type === 'animation_pack' ? 'animations'
                    : row.type === 'effect_pack' ? 'effects'
                      : row.type === 'hook' ? 'hooks'
                        : row.type === 'cta' ? 'ctas'
                          : row.type === 'scene2' ? 'scene2'
                            : 'scene3';
          (bucket[key] ||= []).push({
            name: row.subtext || 'Custom',
            category: row.category,
            tags: (row.metadata_json as { tags?: string[] } | null)?.tags || [],
            content_text: row.content_text,
          });
          void item;
        });
        return jsonResult({
          version: 7,
          exportedAt: new Date().toISOString(),
          count: data?.length || 0,
          bundle: bucket,
        });
      } catch (error) {
        return fail(error);
      }
    }
  );

  server.registerTool(
    'motion_lab_list',
    {
      ...toolMeta('motion_lab_list'),
      inputSchema: z.object({
        source: z.enum(['capcut', 'illustrator', 'figma', 'alight', 'premiere', 'aftereffects']).optional(),
        category: z.enum(['2d', '3d', 'kinetic', 'mg', 'ui', 'transition']).optional(),
        search: z.string().max(200).optional(),
      }),
    },
    async ({ source, category, search }) => {
      const q = (search || '').trim().toLowerCase();
      const recipes = MOTION_RECIPES.filter(
        (r) =>
          (!source || r.source === source) &&
          (!category || r.category === category) &&
          (!q ||
            r.name.toLowerCase().includes(q) ||
            r.summary.toLowerCase().includes(q) ||
            r.tags.some((t) => t.includes(q)))
      ).map((r) => ({
        id: r.id,
        name: r.name,
        source: motionSource(r.source).name,
        category: r.category,
        level: r.level,
        summary: r.summary,
        why: r.why,
        principles: r.principles,
        steps: r.steps,
        tags: r.tags,
        trainingType: r.trainingType,
        code: recipeCode(r),
      }));
      return jsonResult({ total: recipes.length, recipes });
    }
  );

  server.registerTool(
    'motion_lab_brief',
    {
      ...toolMeta('motion_lab_brief'),
      inputSchema: z.object({
        topic: z.string().trim().min(2).max(200),
        audience: z.string().max(300).optional(),
        goal: z.string().max(300).optional(),
        source: z.enum(['capcut', 'illustrator', 'figma', 'alight', 'premiere', 'aftereffects', 'mix']).optional(),
        platform: z.enum(['tiktok', 'reels', 'shorts', 'youtube']).optional(),
        durationSec: z.number().min(12).max(90).optional(),
        tone: z.string().max(200).optional(),
        keywords: z.string().max(300).optional(),
        format: z.enum(['json', 'markdown']).default('markdown'),
      }),
    },
    async ({ topic, audience, goal, source, platform, durationSec, tone, keywords, format }) => {
      const brief = buildResearchBrief({
        topic,
        audience: audience || 'pemilik usaha kecil dan kreator pemula',
        goal: goal || 'menaikkan jumlah orang yang menyimpan dan membagikan video',
        source: source || 'mix',
        platform: platform || 'tiktok',
        durationSec: durationSec || 28,
        tone,
        keywords,
      });
      const text = format === 'json' ? JSON.stringify(brief, null, 2) : briefToMarkdown(brief);
      return { content: [{ type: 'text' as const, text }] };
    }
  );

  /* ------------------------------ prompts ------------------------------ */
  server.registerPrompt(
    'deep_research_motion',
    {
      title: 'Riset Mendalam Gerak & Training',
      description: 'Riset per detik lalu bandingkan dengan bank training sebelum menambah data.',
      argsSchema: z.object({
        topic: z.string(),
        source: z.string().optional(),
        audience: z.string().optional(),
      }),
    },
    ({ topic, source, audience }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Lakukan riset mendalam untuk video: "${topic}".`,
              audience ? `Audiens: ${audience}.` : '',
              `Referensi gaya: ${source || 'mix'}.`,
              '',
              'Langkah wajib:',
              '1. Panggil motion_lab_brief dengan format json.',
              '2. Panggil training_stats dan training_list untuk melihat data yang sudah ada.',
              '3. Tandai resep/ide yang belum ada di bank training (jangan menduplikasi isi).',
              '4. Untuk setiap ide baru, panggil training_validate sebelum menyimpan.',
              '5. Simpan hanya item yang lolos validasi lewat training_bulk_add (maks 50).',
              '6. Akhiri dengan ringkasan: apa yang ditambah, apa yang dilewati, dan alasannya.',
              '',
              'Jangan menghapus data yang sudah ada. Jangan memakai service-role key.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'audit_training_quality',
    {
      title: 'Audit Kualitas Bank Training',
      description: 'Audit sebaran, duplikat, dan kualitas data tanpa perubahan massal.',
      argsSchema: z.object({ type: z.string().optional(), category: z.string().optional() }),
    },
    ({ type, category }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              'Audit bank training MotionID.',
              type ? `Batasi tipe: ${type}.` : '',
              category ? `Batasi kategori: ${category}.` : '',
              'Gunakan training_health, training_stats, lalu training_list (maks 100 per halaman).',
              'Cari: duplikat, item tanpa tag, item dengan nama "Custom" berulang, dan sebaran tipe yang timpang.',
              'Beri rekomendasi konkret dan aman. Jangan menghapus apa pun tanpa persetujuan eksplisit.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'design_pack_from_reference',
    {
      title: 'Rancang Pack dari Referensi',
      description: 'Ubah satu teknik referensi menjadi pack code yang valid.',
      argsSchema: z.object({ reference: z.string(), goal: z.string().optional() }),
    },
    ({ reference, goal }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Rancang satu pack gerak dari referensi: ${reference}.`,
              goal ? `Dipakai untuk: ${goal}.` : '',
              'Langkah: panggil motion_lab_list untuk mencari kemiripan, susun spec minimal, lalu training_validate.',
              'Jika gagal, perbaiki berdasarkan pesan error dan ulangi. Setelah lolos, tampilkan JSON final beserta 5 tag yang disarankan.',
              'Jangan menyimpan sebelum spec valid.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'refresh_motion_library',
    {
      title: 'Segarkan Pustaka Gerak',
      description: 'Cari celah kategori, pilih resep, validasi, lalu simpan.',
      argsSchema: z.object({}),
    },
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              'Segarkan pustaka gerak MotionID.',
              '1. training_stats untuk melihat sebaran tipe dan tag.',
              '2. motion_lab_list untuk melihat 30 resep dan celah kategori.',
              '3. Pilih maksimal 10 resep yang belum ada (bandingkan nama dan isi).',
              '4. training_bulk_add untuk menyimpan yang sudah lolos training_validate.',
              '5. Laporkan hasil per item.',
            ].join('\n'),
          },
        },
      ],
    })
  );

  /* ----------------------------- resources ----------------------------- */
  const resourceText = (uri: string): string => {
    if (uri === 'motionid://guide/mcp') return MCP_GUIDE;
    if (uri === 'motionid://schema/training')
      return JSON.stringify({ types: trainingTypes, categories, formats: MCP_TYPE_GUIDE, limits: { listPage: 100, bulkItems: MAX_BULK } }, null, 2);
    if (uri === 'motionid://examples/packs')
      return JSON.stringify(
        { component: COMPONENT_CODE_EXAMPLE, transition: TRANSITION_CODE_EXAMPLE, animation: ANIMATION_CODE_EXAMPLE, effect: EFFECT_CODE_EXAMPLE },
        null,
        2
      );
    return JSON.stringify(
      MOTION_RECIPES.map((r) => ({
        id: r.id,
        name: r.name,
        source: motionSource(r.source).name,
        category: r.category,
        level: r.level,
        summary: r.summary,
        steps: r.steps,
        code: r.code,
      })),
      null,
      2
    );
  };

  for (const resource of MCP_RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      { title: resource.title, description: resource.description, mimeType: resource.mimeType },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: resource.mimeType, text: resourceText(resource.uri) }],
      })
    );
  }

  return server;
}

export { makeServer as createTrainingServer };

/** Entry lama tetap bekerja: `serveStdio(createServer)`. */
export const createServer = () => makeServer();
