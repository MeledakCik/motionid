/**
 * Katalog MCP MotionID — satu sumber kebenaran untuk server MCP dan halaman admin.
 * File ini murni data + fungsi pembentuk konfigurasi (tanpa Node/DOM), jadi bisa
 * diimpor dari komponen client maupun server.
 */

export const MCP_SERVER_NAME = 'motionid-training';
export const MCP_SERVER_VERSION = '2.0.0';

export const MCP_ENV_VARS = [
  {
    name: 'SUPABASE_URL',
    fallback: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    secret: false,
    hint: 'URL project Supabase, mis. https://xxxx.supabase.co',
  },
  {
    name: 'SUPABASE_ANON_KEY',
    fallback: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    secret: false,
    hint: 'Anon key publik. Jangan pernah memakai service-role key.',
  },
  {
    name: 'SUPABASE_ACCESS_TOKEN',
    fallback: '',
    required: true,
    secret: true,
    hint: 'Access token sesi akun admin. Kedaluwarsa ±1 jam; perbarui lalu restart server.',
  },
] as const;

export type McpToolKind = 'read' | 'write' | 'validate' | 'export' | 'research';

export interface McpToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface McpToolInfo {
  name: string;
  title: string;
  kind: McpToolKind;
  description: string;
  params: McpToolParam[];
  returns: string;
  example: string;
  needsAuth: boolean;
}

const p = (name: string, type: string, required: boolean, description: string): McpToolParam => ({
  name,
  type,
  required,
  description,
});

export const MCP_TOOLS: McpToolInfo[] = [
  {
    name: 'training_health',
    title: 'Cek Kesehatan Koneksi',
    kind: 'read',
    description:
      'Memeriksa URL/anon key, validitas access token, status admin (RLS), jumlah data per tipe, dan versi server. Jalankan ini pertama sebelum tool lain.',
    params: [],
    returns: '{ ok, user, isAdmin, counts, server, latencyMs }',
    example: 'training_health {}',
    needsAuth: true,
  },
  {
    name: 'training_schema',
    title: 'Skema Bank Training',
    kind: 'read',
    description:
      'Mengembalikan tipe training yang diterima, kategori, aturan validasi, contoh kode pack, dan batas ukuran. Tidak butuh login.',
    params: [],
    returns: '{ types, categories, formats, examples, limits }',
    example: 'training_schema {}',
    needsAuth: false,
  },
  {
    name: 'training_list',
    title: 'Daftar / Cari Training',
    kind: 'read',
    description:
      'Membaca bank training dengan filter tipe, kategori, kata kunci, dan tag. Halaman maksimal 100 baris.',
    params: [
      p('type', 'enum', false, 'icon_pack | component_pack | transition_pack | animation_pack | effect_pack | hook | cta | scene2 | scene3'),
      p('category', 'enum', false, 'all | promo | edukasi | quote | saas'),
      p('search', 'string', false, 'Cari di content_text dan subtext (maks 200 karakter)'),
      p('tag', 'string', false, 'Filter metadata_json.tags (satu tag)'),
      p('limit', 'number', false, '1–100, default 25'),
      p('offset', 'number', false, 'Default 0'),
    ],
    returns: '{ total, offset, limit, rows }',
    example: 'training_list { "type": "animation_pack", "tag": "3d", "limit": 20 }',
    needsAuth: true,
  },
  {
    name: 'training_get',
    title: 'Ambil Satu Training',
    kind: 'read',
    description: 'Mengambil satu baris training berdasarkan UUID, termasuk metadata dan isi kode.',
    params: [p('id', 'uuid', true, 'UUID baris training')],
    returns: '{ id, type, category, content_text, subtext, metadata_json, created_at }',
    example: 'training_get { "id": "00000000-0000-0000-0000-000000000000" }',
    needsAuth: true,
  },
  {
    name: 'training_stats',
    title: 'Statistik & Kualitas Bank',
    kind: 'read',
    description:
      'Menghitung jumlah data per tipe/kategori, data terbaru, tag terbanyak, dan mendeteksi duplikat isi. Berguna untuk audit sebelum menambah data.',
    params: [
      p('type', 'enum', false, 'Batasi statistik ke satu tipe'),
      p('category', 'enum', false, 'Batasi ke satu kategori'),
    ],
    returns: '{ total, byType, byCategory, topTags, duplicates, newest }',
    example: 'training_stats { "type": "animation_pack" }',
    needsAuth: true,
  },
  {
    name: 'training_validate',
    title: 'Validasi Kode Pack (Dry Run)',
    kind: 'validate',
    description:
      'Memvalidasi SVG, kode komponen, transisi, animasi, atau efek memakai parser yang sama dengan admin. Tidak menulis apa pun ke database.',
    params: [
      p('type', 'enum', true, 'Tipe pack yang divalidasi'),
      p('content_text', 'string', true, 'ISI kode/SVG/JSON'),
      p('name', 'string', false, 'Nama pack untuk pesan error yang lebih jelas'),
    ],
    returns: '{ ok, normalized, warnings }',
    example: 'training_validate { "type": "animation_pack", "content_text": "{\\"kind\\":\\"in\\",\\"from\\":{\\"y\\":40}}" }',
    needsAuth: false,
  },
  {
    name: 'training_add',
    title: 'Tambah Satu Training',
    kind: 'write',
    description:
      'Menambah satu baris training. Konten divalidasi dulu, lalu ditulis lewat Supabase Auth + RLS (hanya admin).',
    params: [
      p('type', 'enum', true, 'Tipe training'),
      p('category', 'enum', false, 'all | promo | edukasi | quote | saas, default all'),
      p('content_text', 'string', true, 'Isi kode/SVG/teks (maks 100.000 karakter)'),
      p('name', 'string', false, 'Nama pack atau sumber'),
      p('tags', 'string[]', false, 'Maks 50 tag'),
    ],
    returns: '{ message, row }',
    example: 'training_add { "type": "hook", "category": "promo", "content_text": "Jangan beli sebelum lihat ini", "tags": ["promo"] }',
    needsAuth: true,
  },
  {
    name: 'training_bulk_add',
    title: 'Tambah Banyak Training',
    kind: 'write',
    description:
      'Menambah hingga 50 item sekaligus. Setiap item divalidasi sendiri; item tidak valid dilewati dan dilaporkan, item valid tetap disimpan.',
    params: [p('items', 'array', true, 'Array { type, content_text, name?, category?, tags? } (maks 50)')],
    returns: '{ inserted, skipped, results: [{ index, ok, id?, error? }] }',
    example: 'training_bulk_add { "items": [{ "type": "cta", "content_text": "Simpan video ini" }] }',
    needsAuth: true,
  },
  {
    name: 'training_update',
    title: 'Ubah Training',
    kind: 'write',
    description:
      'Mengubah sebagian field training. Tipe dan konten hasil akhir divalidasi ulang sebelum disimpan.',
    params: [
      p('id', 'uuid', true, 'UUID baris'),
      p('type', 'enum', false, 'Tipe baru'),
      p('category', 'enum', false, 'Kategori baru'),
      p('content_text', 'string', false, 'Konten baru'),
      p('name', 'string', false, 'Nama baru (null untuk mengosongkan)'),
      p('tags', 'string[]', false, 'Ganti seluruh tag'),
    ],
    returns: '{ message, row }',
    example: 'training_update { "id": "...", "tags": ["3d", "figma"] }',
    needsAuth: true,
  },
  {
    name: 'training_delete',
    title: 'Hapus Training',
    kind: 'write',
    description: 'Menghapus satu baris training berdasarkan UUID. Hanya admin yang lolos RLS.',
    params: [p('id', 'uuid', true, 'UUID baris')],
    returns: '{ message, id }',
    example: 'training_delete { "id": "..." }',
    needsAuth: true,
  },
  {
    name: 'training_export',
    title: 'Ekspor Bundle JSON',
    kind: 'export',
    description:
      'Mengekspor bank training menjadi satu bundle JSON siap impor ulang (format sama dengan tab Import JSON Massal).',
    params: [
      p('type', 'enum', false, 'Batasi ke satu tipe'),
      p('category', 'enum', false, 'Batasi ke satu kategori'),
      p('limit', 'number', false, 'Maks 2000 baris, default 500'),
    ],
    returns: '{ version, exportedAt, count, bundle }',
    example: 'training_export { "limit": 500 }',
    needsAuth: true,
  },
  {
    name: 'motion_lab_list',
    title: 'Daftar Resep Motion Lab',
    kind: 'research',
    description:
      'Membaca 30 resep gerak hasil riset (CapCut, Illustrator, Figma, Alight Motion, Premiere, After Effects) beserta langkah, prinsip, dan kode pack siap pakai.',
    params: [
      p('source', 'enum', false, 'capcut | illustrator | figma | alight | premiere | aftereffects'),
      p('category', 'enum', false, '2d | 3d | kinetic | mg | ui | transition'),
      p('search', 'string', false, 'Cari nama, ringkasan, atau tag'),
    ],
    returns: '{ total, recipes: [{ id, name, source, category, level, summary, code, ... }] }',
    example: 'motion_lab_list { "source": "figma", "category": "ui" }',
    needsAuth: false,
  },
  {
    name: 'motion_lab_brief',
    title: 'Riset Gerak Mendalam',
    kind: 'research',
    description:
      'Menyusun brief riset per detik: hook, urutan beat, gerak yang dipakai, checklist aset, sound design, CTA, pertanyaan riset, dan validasi. Hasilnya deterministik dan siap ditempel ke brief produksi.',
    params: [
      p('topic', 'string', true, 'Topik/produk'),
      p('audience', 'string', false, 'Target audiens'),
      p('goal', 'string', false, 'Tujuan video'),
      p('source', 'enum', false, 'Referensi gaya gerak atau "mix"'),
      p('platform', 'enum', false, 'tiktok | reels | shorts | youtube'),
      p('durationSec', 'number', false, '12–90 detik, default 28'),
      p('tone', 'string', false, 'Nada penyampaian'),
      p('keywords', 'string', false, 'Kata kunci dipisah koma'),
      p('format', 'enum', false, 'json | markdown, default markdown'),
    ],
    returns: 'Brief JSON atau Markdown',
    example: 'motion_lab_brief { "topic": "kopi susu literan", "source": "capcut", "durationSec": 24 }',
    needsAuth: false,
  },
];

export interface McpPromptInfo {
  name: string;
  title: string;
  description: string;
  args: Array<{ name: string; required: boolean; description: string }>;
}

export const MCP_PROMPTS: McpPromptInfo[] = [
  {
    name: 'deep_research_motion',
    title: 'Riset Mendalam Gerak & Training',
    description:
      'Alur riset: panggil motion_lab_brief, bandingkan dengan training_stats, lalu usulkan data training baru yang belum ada duplikatnya.',
    args: [
      { name: 'topic', required: true, description: 'Topik atau produk yang mau dibuat videonya' },
      { name: 'source', required: false, description: 'capcut | illustrator | figma | alight | premiere | aftereffects | mix' },
      { name: 'audience', required: false, description: 'Target audiens' },
    ],
  },
  {
    name: 'audit_training_quality',
    title: 'Audit Kualitas Bank Training',
    description:
      'Periksa statistik, duplikat, sebaran tipe, dan data tanpa tag. Ajukan perbaikan konkret tanpa menghapus data secara massal.',
    args: [
      { name: 'type', required: false, description: 'Batasi audit ke satu tipe' },
      { name: 'category', required: false, description: 'Batasi audit ke satu kategori' },
    ],
  },
  {
    name: 'design_pack_from_reference',
    title: 'Rancang Pack dari Referensi',
    description:
      'Ubah satu teknik dari aplikasi referensi menjadi pack code yang lolos validasi, lengkap dengan tag dan alasan geraknya.',
    args: [
      { name: 'reference', required: true, description: 'Nama teknik/aplikasi, mis. "3D flip Alight Motion"' },
      { name: 'goal', required: false, description: 'Dipakai untuk scene apa' },
    ],
  },
  {
    name: 'refresh_motion_library',
    title: 'Segarkan Pustaka Gerak',
    description:
      'Cari celah kategori yang masih tipis, pilih resep Motion Lab yang relevan, validasi, lalu simpan lewat training_bulk_add.',
    args: [],
  },
];

export interface McpResourceInfo {
  name: string;
  uri: string;
  title: string;
  description: string;
  mimeType: string;
}

export const MCP_RESOURCES: McpResourceInfo[] = [
  {
    name: 'guide',
    uri: 'motionid://guide/mcp',
    title: 'Panduan Konektor MCP',
    description: 'Langkah setup, keamanan token, dan alur kerja yang disarankan.',
    mimeType: 'text/markdown',
  },
  {
    name: 'schema',
    uri: 'motionid://schema/training',
    title: 'Skema Bank Training',
    description: 'Tipe, kategori, format kode, dan batas ukuran.',
    mimeType: 'application/json',
  },
  {
    name: 'examples',
    uri: 'motionid://examples/packs',
    title: 'Contoh Kode Pack',
    description: 'Contoh valid untuk ikon, komponen, transisi, animasi, dan efek.',
    mimeType: 'application/json',
  },
  {
    name: 'motion-lab',
    uri: 'motionid://motion-lab/recipes',
    title: 'Katalog Motion Lab',
    description: '30 resep gerak dengan langkah dan kode pack.',
    mimeType: 'application/json',
  },
];

/* ------------------------------------------------------------------ */
/* Konfigurasi client                                                  */
/* ------------------------------------------------------------------ */

export type McpClientId = 'claude' | 'cursor' | 'vscode' | 'opencode';

export interface McpClientInfo {
  id: McpClientId;
  name: string;
  file: string;
  note: string;
}

export const MCP_CLIENTS: McpClientInfo[] = [
  { id: 'claude', name: 'Claude Desktop', file: 'claude_desktop_config.json', note: 'Restart aplikasi setelah menyimpan konfigurasi.' },
  { id: 'cursor', name: 'Cursor', file: '.cursor/mcp.json', note: 'Bisa juga lewat Settings → MCP → Add Server.' },
  { id: 'vscode', name: 'VS Code', file: '.vscode/mcp.json', note: 'Butuh VS Code 1.102+ dengan dukungan MCP.' },
  { id: 'opencode', name: 'OpenCode', file: 'opencode.json', note: 'Letakkan di root project atau ~/.config/opencode/opencode.json.' },
];

export interface ClientConfigInput {
  client: McpClientId;
  mode: 'remote' | 'local';
  url: string;
  projectPath: string;
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
}

const localArgs = (projectPath: string) => ['--prefix', projectPath || '/path/ke/motionid', 'run', 'mcp:training'];

/** Menghasilkan JSON siap tempel. Nilai rahasia hanya ditulis ke clipboard user. */
export function buildClientConfig(input: ClientConfigInput): string {
  if (input.mode === 'remote') {
    const remote = {
      url: input.url || 'https://domain-kamu.com/api/mcp',
      headers: { Authorization: `Bearer ${input.accessToken || 'access-token-akun-admin'}` },
    };
    if (input.client === 'vscode') {
      return JSON.stringify(
        { servers: { [MCP_SERVER_NAME]: { type: 'http', ...remote } } },
        null,
        2
      );
    }
    if (input.client === 'opencode') {
      return JSON.stringify(
        { $schema: 'https://opencode.ai/config.json', mcp: { [MCP_SERVER_NAME]: { type: 'remote', ...remote, enabled: true } } },
        null,
        2
      );
    }
    if (input.client === 'claude') {
      return JSON.stringify(
        {
          mcpServers: {
            [MCP_SERVER_NAME]: {
              command: 'npx',
              args: ['-y', 'mcp-remote', remote.url, '--header', `Authorization: Bearer ${input.accessToken || 'access-token-akun-admin'}`],
            },
          },
        },
        null,
        2
      );
    }
    return JSON.stringify({ mcpServers: { [MCP_SERVER_NAME]: remote } }, null, 2);
  }

  const env = {
    SUPABASE_URL: input.supabaseUrl || 'https://project-id.supabase.co',
    SUPABASE_ANON_KEY: input.anonKey || 'supabase-anon-key',
    SUPABASE_ACCESS_TOKEN: input.accessToken || 'access-token-akun-admin',
  };
  if (input.client === 'vscode') {
    return JSON.stringify(
      {
        servers: {
          [MCP_SERVER_NAME]: {
            type: 'stdio',
            command: 'npm',
            args: localArgs(input.projectPath),
            env,
          },
        },
      },
      null,
      2
    );
  }
  if (input.client === 'opencode') {
    return JSON.stringify(
      {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          [MCP_SERVER_NAME]: {
            type: 'local',
            command: ['npm', ...localArgs(input.projectPath)],
            environment: env,
            enabled: true,
          },
        },
      },
      null,
      2
    );
  }
  return JSON.stringify(
    { mcpServers: { [MCP_SERVER_NAME]: { command: 'npm', args: localArgs(input.projectPath), env } } },
    null,
    2
  );
}

export const MCP_GUIDE = `# MotionID Training MCP

Server ini menghubungkan asisten AI ke bank training MotionID di Supabase.

## Dua cara koneksi

1. **Remote (disarankan)** — \`https://domain-kamu.com/api/mcp\`, header
   \`Authorization: Bearer <access token Supabase admin>\`.
2. **Lokal (stdio)** — \`npm --prefix <repo> run mcp:training\` dengan env
   \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`, \`SUPABASE_ACCESS_TOKEN\`.

## Keamanan

- Jangan pernah memakai service-role key.
- Token adalah token sesi akun admin; berlaku ±1 jam.
- Penulisan tetap dijaga RLS \`is_admin()\` di Postgres.
- Jangan commit konfigurasi yang berisi token.

## Alur yang disarankan

1. \`training_health\` → pastikan koneksi dan status admin.
2. \`training_stats\` → lihat sebaran dan duplikat.
3. \`motion_lab_brief\` → susun rencana gerak.
4. \`training_validate\` → uji kode pack.
5. \`training_bulk_add\` → simpan item yang lolos.
6. \`training_export\` → arsipkan bundle sebelum perubahan besar.
`;

export const MCP_TYPE_GUIDE = [
  {
    type: 'icon_pack',
    label: 'Ikon SVG',
    format: '<svg viewBox="0 0 24 24"><path d="..."/></svg>',
    required: 'Minimal satu path valid; hanya elemen path yang dibaca.',
  },
  {
    type: 'component_pack',
    label: 'Komponen',
    format: 'JSON { "name", "bg", "fg", "radius", "shadow", "accent", ... } atau kode CSS terbatas',
    required: 'Gunakan properti yang didukung parser komponen.',
  },
  {
    type: 'transition_pack',
    label: 'Transisi',
    format: 'JSON { "kind": "whip", "duration": 0.4, "params": { "dir": "left", "fx": "kilat" } }',
    required: 'kind harus dari daftar transisi; durasi 0,1–3 detik.',
  },
  {
    type: 'animation_pack',
    label: 'Animasi',
    format: 'JSON { "kind": "in", "duration": 0.6, "keyframes": [{ "t": 0, "y": 40, "alpha": 0 }, { "t": 1 }] }',
    required: 'Minimal from/keyframes/clip/text; keyframes minimal 2 titik.',
  },
  {
    type: 'effect_pack',
    label: 'Efek',
    format: 'JSON { "kind": "ikon", "icon": "coffee", "motion": "melayang", "intensity": 1.2 }',
    required: 'kind harus dari daftar efek; style harus dikenal.',
  },
  {
    type: 'hook',
    label: 'Hook',
    format: 'Teks satu kalimat pembuka',
    required: 'Tidak boleh kosong; maks 100.000 karakter.',
  },
  {
    type: 'cta',
    label: 'CTA',
    format: 'Teks ajakan satu kalimat',
    required: 'Tidak boleh kosong.',
  },
  {
    type: 'scene2',
    label: 'Scene 2 / Kutipan',
    format: 'Teks narasi atau kutipan',
    required: 'Kategori quote dipakai untuk bank kutipan.',
  },
  {
    type: 'scene3',
    label: 'Scene 3',
    format: 'Teks narasi',
    required: 'Tidak boleh kosong.',
  },
] as const;
