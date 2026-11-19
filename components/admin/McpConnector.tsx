'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  buildClientConfig,
  MCP_CLIENTS,
  MCP_ENV_VARS,
  MCP_PROMPTS,
  MCP_RESOURCES,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  MCP_TOOLS,
  type McpClientId,
} from '@/lib/mcp/catalog';
import { MOTION_RECIPE_COUNT } from '@/lib/motion-lab';
import { cx, Logo, Segmented } from '@/components/studio/ui';
import AdminNav from './AdminNav';

type Tab = 'mulai' | 'konfigurasi' | 'tools' | 'prompts';
type Mode = 'remote' | 'local';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'mulai', label: 'Mulai' },
  { id: 'konfigurasi', label: 'Konfigurasi' },
  { id: 'tools', label: 'Tools' },
  { id: 'prompts', label: 'Prompt & Resource' },
];

const KIND_STYLE: Record<string, string> = {
  read: 'bg-sky-500/12 text-sky-700',
  write: 'bg-amber-500/15 text-amber-700',
  validate: 'bg-violet-500/12 text-violet-700',
  export: 'bg-emerald-500/12 text-emerald-700',
  research: 'bg-pink-500/12 text-pink-700',
};

function CopyButton({ value, label = 'Salin', onCopy }: { value: string; label?: string; onCopy?: () => void }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDone(true);
    onCopy?.();
    window.setTimeout(() => setDone(false), 1600);
  };
  return (
    <button type="button" onClick={copy} className="mk-chip px-2.5 py-1.5 text-[11px]">
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Tersalin' : label}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-mk-line bg-[#160f33]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{lang || 'json'}</span>
        <CopyButton value={code} />
      </div>
      <pre className="mk-scroll max-h-[360px] overflow-auto p-3 text-[11.5px] leading-relaxed text-[#e7e0ff]">{code}</pre>
    </div>
  );
}

export default function McpConnector() {
  const [tab, setTab] = useState<Tab>('mulai');
  const [mode, setMode] = useState<Mode>('remote');
  const [client, setClient] = useState<McpClientId>('claude');
  const [origin, setOrigin] = useState('https://domain-kamu.com');
  const [projectPath, setProjectPath] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [anonKey, setAnonKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [status, setStatus] = useState<{
    loading: boolean;
    ok?: boolean;
    error?: string;
    isAdmin?: boolean;
    total?: number;
    latencyMs?: number;
  }>({ loading: true });
  const [endpointTest, setEndpointTest] = useState<{ loading: boolean; ok?: boolean; text?: string }>({ loading: false });
  const [openTool, setOpenTool] = useState<string | null>('training_health');

  const loadSession = useCallback(async () => {
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    setAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    const started = Date.now();
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token || '');
      const userRes = await supabase.auth.getUser();
      setEmail(userRes.data.user?.email || '');
      let isAdmin = false;
      const rpc = await supabase.rpc('is_admin');
      if (!rpc.error) isAdmin = !!rpc.data;
      const { count, error } = await supabase
        .from('ai_training_data')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      setStatus({ loading: false, ok: true, isAdmin, total: count || 0, latencyMs: Date.now() - started });
    } catch (error) {
      setStatus({ loading: false, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    setProjectPath(window.location.pathname.includes('/admin') ? 'C:\\path\\ke\\motionid' : '');
    void loadSession();
  }, [loadSession]);

  const endpoint = `${origin}/api/mcp`;
  const config = useMemo(
    () =>
      buildClientConfig({
        client,
        mode,
        url: endpoint,
        projectPath,
        supabaseUrl,
        anonKey,
        accessToken: token,
      }),
    [client, mode, endpoint, projectPath, supabaseUrl, anonKey, token]
  );
  const clientInfo = MCP_CLIENTS.find((c) => c.id === client)!;

  const testEndpoint = async () => {
    setEndpointTest({ loading: true });
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'motionid-admin-check', version: '1.0.0' },
          },
        }),
      });
      const text = await res.text();
      setEndpointTest({
        loading: false,
        ok: res.ok,
        text: `${res.status} ${res.statusText}\n${text.slice(0, 1200)}`,
      });
    } catch (error) {
      setEndpointTest({ loading: false, ok: false, text: error instanceof Error ? error.message : String(error) });
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([config], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = clientInfo.file.split('/').pop() || 'mcp.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mk-page">
      <header className="mk-glass mk-bar sticky top-0 z-30 border-b border-white/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/dashboard" className="mk-btn-icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo className="text-sm" />
          <span className="rounded-full bg-mk-coral/15 px-2 py-0.5 text-[11px] font-bold text-mk-coral">MCP Connector</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cx(
                'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex',
                status.loading
                  ? 'bg-white/70 text-mk-muted'
                  : status.ok && status.isAdmin
                    ? 'bg-emerald-500/12 text-emerald-700'
                    : 'bg-amber-500/15 text-amber-700'
              )}
            >
              {status.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status.ok && status.isAdmin ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {status.loading ? 'Memeriksa' : status.ok && status.isAdmin ? 'Admin siap' : 'Perlu token'}
            </span>
            <button type="button" onClick={() => void loadSession()} className="mk-btn-ghost px-3 py-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Cek ulang
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <AdminNav className="mb-5" />

        <section className="mk-card relative overflow-hidden p-5 sm:p-7">
          <div className="mk-dots pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-wrap items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mk-coral text-white">
              <Plug className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Hubungkan asisten AI ke bank training</h1>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-mk-muted">v{MCP_SERVER_VERSION}</span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mk-muted">
                MCP Connector membuat Claude, Cursor, VS Code, atau OpenCode bisa membaca, memvalidasi, menambah, dan
                mengekspor data training MotionID — lewat koneksi remote tanpa install, atau server lokal stdio.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="mk-chip"><Server className="h-3.5 w-3.5" /> {MCP_TOOLS.length} tools</span>
                <span className="mk-chip"><Sparkles className="h-3.5 w-3.5" /> {MCP_PROMPTS.length} prompt riset</span>
                <span className="mk-chip"><FlaskConical className="h-3.5 w-3.5" /> {MOTION_RECIPE_COUNT} resep gerak</span>
                <span className="mk-chip"><ShieldCheck className="h-3.5 w-3.5" /> RLS admin</span>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/70 bg-white/65 p-4 sm:w-[290px]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-mk-dim">
                Status sesi
                <button type="button" onClick={() => void loadSession()} className="mk-btn-icon h-7 w-7" aria-label="Muat ulang status">
                  <RefreshCw className={cx('h-3.5 w-3.5', status.loading && 'animate-spin')} />
                </button>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-mk-muted">Akun</span>
                  <span className="truncate font-bold">{email || '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-mk-muted">Token sesi</span>
                  <span className={cx('font-bold', token ? 'text-emerald-700' : 'text-amber-700')}>{token ? 'tersedia' : 'tidak ada'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-mk-muted">Hak tulis</span>
                  <span className={cx('font-bold', status.isAdmin ? 'text-emerald-700' : 'text-amber-700')}>
                    {status.loading ? 'memeriksa…' : status.isAdmin ? 'admin (RLS)' : 'baca saja'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-mk-muted">Baris training</span>
                  <span className="font-bold">{status.total ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-mk-muted">Latensi</span>
                  <span className="font-bold">{status.latencyMs ? `${status.latencyMs} ms` : '—'}</span>
                </div>
              </div>
              {status.error && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-2 py-1.5 text-[11px] text-red-600">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {status.error}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mk-noscroll -mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx('mk-chip shrink-0 px-4 py-2 text-sm', tab === t.id && 'mk-chip-on')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'mulai' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <section className="mk-card p-5">
                <h2 className="text-base font-extrabold">Tiga langkah sampai tersambung</h2>
                <ol className="mt-4 space-y-3">
                  {[
                    {
                      title: 'Pastikan akun ini admin',
                      body: 'Halaman ini sudah dilindungi middleware. Token sesi dipakai MCP; penulisan tetap dijaga RLS is_admin() di Postgres.',
                      icon: ShieldCheck,
                    },
                    {
                      title: 'Pilih mode remote atau lokal',
                      body: 'Remote tidak perlu install apa pun. Lokal memakai repo ini dan berguna saat offline atau untuk pengembangan server.',
                      icon: Wifi,
                    },
                    {
                      title: 'Tempel konfigurasi lalu restart client',
                      body: 'Buka tab Konfigurasi, salin JSON ke file yang disebutkan, lalu restart aplikasi MCP client.',
                      icon: Terminal,
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mk-coral/12 text-xs font-extrabold text-mk-coral">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          <step.icon className="h-3.5 w-3.5 text-mk-coral" /> {step.title}
                        </div>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-mk-muted">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setTab('konfigurasi')} className="mk-btn-primary px-4 py-2 text-xs">
                    <Clipboard className="h-3.5 w-3.5" /> Ambil konfigurasi
                  </button>
                  <button type="button" onClick={() => void testEndpoint()} className="mk-btn-ghost px-4 py-2 text-xs" disabled={endpointTest.loading}>
                    {endpointTest.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />} Tes endpoint
                  </button>
                </div>
                {endpointTest.text && (
                  <pre className={cx('mk-scroll mt-3 max-h-44 overflow-auto rounded-xl p-3 text-[11px]', endpointTest.ok ? 'bg-emerald-500/10 text-emerald-800' : 'bg-red-500/10 text-red-700')}>
                    {endpointTest.text}
                  </pre>
                )}
              </section>

              <section className="mk-card p-5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-mk-coral" />
                  <h2 className="text-base font-extrabold">Contoh perintah pertama</h2>
                </div>
                <p className="mt-1 text-[13px] text-mk-muted">
                  Setelah tersambung, minta asisten menjalankan urutan ini. Hasilnya langsung terlihat di Training Studio.
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    'training_health {}',
                    'training_stats { "type": "animation_pack" }',
                    'motion_lab_brief { "topic": "promo kopi susu", "source": "capcut" }',
                    'training_validate { "type": "animation_pack", "content_text": "{...}" }',
                  ].map((cmd) => (
                    <div key={cmd} className="flex items-center gap-2 rounded-xl border border-mk-line bg-white/60 px-3 py-2">
                      <code className="min-w-0 flex-1 truncate text-[11.5px]">{cmd}</code>
                      <CopyButton value={cmd} label="" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="mk-mesh-deep relative overflow-hidden rounded-2xl p-5 text-white shadow-mk-card">
                <div className="mk-dots pointer-events-none absolute inset-0 opacity-20" />
                <div className="relative">
                  <FlaskConical className="h-6 w-6 text-mk-lime" />
                  <h2 className="mt-2 text-lg font-extrabold">Riset gerak mendalam</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/70">
                    Motion Lab berisi {MOTION_RECIPE_COUNT} resep dari CapCut, Illustrator, Figma, Alight Motion, Premiere,
                    dan After Effects — lengkap dengan langkah, prinsip, dan kode pack.
                  </p>
                  <Link href="/admin/research" className="mk-btn-lime mt-4 px-4 py-2 text-xs">
                    Buka Motion Lab <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>

              <section className="mk-card p-5">
                <h2 className="text-base font-extrabold">Keamanan</h2>
                <ul className="mt-3 space-y-2 text-[13px] text-mk-muted">
                  {[
                    'Jangan pernah memakai service-role key di client MCP.',
                    'Token adalah token sesi admin dan berlaku sekitar satu jam.',
                    'Penulisan tetap ditolak Postgres bila akun bukan admin.',
                    'Jangan commit file konfigurasi yang berisi token.',
                  ].map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {s}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mk-card p-5">
                <h2 className="text-base font-extrabold">Variabel environment</h2>
                <div className="mt-3 space-y-2">
                  {MCP_ENV_VARS.map((v) => (
                    <div key={v.name} className="rounded-xl border border-mk-line bg-white/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <code className="text-[11.5px] font-bold">{v.name}</code>
                        {v.secret && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">rahasia</span>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-mk-dim">{v.hint}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'konfigurasi' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="mk-card space-y-4 p-5">
              <div>
                <h2 className="text-base font-extrabold">Buat konfigurasi</h2>
                <p className="text-[13px] text-mk-muted">Pilih client dan mode. Token diambil dari sesi login kamu dan tidak dikirim ke mana pun.</p>
              </div>

              <div>
                <span className="mk-label">Mode koneksi</span>
                <Segmented value={mode} onChange={(v) => setMode(v as Mode)} options={[{ value: 'remote', label: 'Remote HTTP' }, { value: 'local', label: 'Lokal stdio' }]} />
                <p className="mt-1.5 text-[11.5px] text-mk-dim">
                  {mode === 'remote'
                    ? `Remote memakai ${endpoint} — tidak perlu install repo.`
                    : 'Lokal menjalankan npm run mcp:training dari repo di komputer ini.'}
                </p>
              </div>

              <div>
                <span className="mk-label">Client</span>
                <div className="flex flex-wrap gap-1.5">
                  {MCP_CLIENTS.map((c) => (
                    <button key={c.id} type="button" onClick={() => setClient(c.id)} className={cx('mk-chip px-3 py-1.5 text-xs', client === c.id && 'mk-chip-on')}>
                      {c.name}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11.5px] text-mk-dim">
                  File: <code className="font-bold">{clientInfo.file}</code> · {clientInfo.note}
                </p>
              </div>

              {mode === 'remote' ? (
                <div>
                  <span className="mk-label">URL endpoint</span>
                  <div className="flex items-center gap-2">
                    <input readOnly value={endpoint} className="mk-input font-mono text-[12px]" />
                    <CopyButton value={endpoint} label="" />
                  </div>
                </div>
              ) : (
                <div>
                  <span className="mk-label">Path repo (Windows / Unix)</span>
                  <input value={projectPath} onChange={(e) => setProjectPath(e.target.value)} placeholder="C:\path\ke\motionid" className="mk-input font-mono text-[12px]" />
                </div>
              )}

              <div>
                <span className="mk-label">Access token sesi</span>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      readOnly
                      value={showToken ? token : token ? '•'.repeat(Math.min(44, token.length)) : ''}
                      placeholder="Login ulang bila token tidak muncul"
                      className="mk-input pr-10 font-mono text-[11px]"
                    />
                    <button type="button" onClick={() => setShowToken((v) => !v)} className="mk-btn-icon absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" aria-label="Tampilkan token">
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <CopyButton value={token} label="Token" />
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Hanya salin ke file konfigurasi pribadi. Jangan screenshot atau commit.
                </p>
              </div>

              {mode === 'local' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="mk-label">SUPABASE_URL</span>
                    <input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="mk-input font-mono text-[11px]" />
                  </div>
                  <div>
                    <span className="mk-label">SUPABASE_ANON_KEY</span>
                    <input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} className="mk-input font-mono text-[11px]" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <CopyButton value={config} label="Salin JSON" />
                <button type="button" onClick={downloadConfig} className="mk-chip px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Unduh file
                </button>
                <button type="button" onClick={() => void testEndpoint()} className="mk-chip px-3 py-1.5 text-xs" disabled={endpointTest.loading}>
                  {endpointTest.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />} Tes endpoint
                </button>
              </div>
              {endpointTest.text && (
                <pre className={cx('mk-scroll max-h-40 overflow-auto rounded-xl p-3 text-[11px]', endpointTest.ok ? 'bg-emerald-500/10 text-emerald-800' : 'bg-red-500/10 text-red-700')}>
                  {endpointTest.text}
                </pre>
              )}
            </section>

            <section className="space-y-3">
              <div className="mk-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold">Pratinjau konfigurasi</h3>
                  <span className="text-[11px] text-mk-dim">{clientInfo.name} · {mode === 'remote' ? 'HTTP' : 'stdio'}</span>
                </div>
                <CodeBlock code={config} lang="json" />
              </div>
              <div className="mk-card p-4 text-[12.5px] text-mk-muted">
                <div className="flex items-center gap-2 text-sm font-extrabold text-mk-cream">
                  <KeyRound className="h-4 w-4 text-mk-coral" /> Bila token kedaluwarsa
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Muat ulang halaman ini, salin token baru, tempel ke konfigurasi, lalu restart MCP client. Untuk remote,
                  cukup ganti header <code className="font-bold">Authorization</code>.
                </p>
              </div>
            </section>
          </div>
        )}

        {tab === 'tools' && (
          <div className="mt-5 space-y-3">
            <div className="mk-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold">{MCP_TOOLS.length} tool siap dipakai</h2>
                <p className="text-[13px] text-mk-muted">Klik satu tool untuk melihat parameter dan contoh panggilan.</p>
              </div>
              <CopyButton value={MCP_TOOLS.map((t) => `${t.name} — ${t.description}`).join('\n')} label="Salin ringkasan" />
            </div>
            {MCP_TOOLS.map((tool) => {
              const open = openTool === tool.name;
              return (
                <section key={tool.name} className="mk-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenTool(open ? null : tool.name)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                    aria-expanded={open}
                  >
                    <span className={cx('mt-0.5 rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider', KIND_STYLE[tool.kind] || 'bg-white/70 text-mk-muted')}>
                      {tool.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="text-sm font-extrabold">{tool.name}</code>
                        <span className="text-[11px] text-mk-dim">{tool.title}</span>
                        {tool.needsAuth && <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-mk-muted">auth</span>}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-mk-muted">{tool.description}</span>
                    </span>
                    <ChevronDown className={cx('mt-0.5 h-4 w-4 shrink-0 text-mk-dim transition', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-mk-line bg-white/45 p-4">
                      {tool.params.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-mk-line bg-white/70">
                          <table className="w-full text-left text-[11.5px]">
                            <thead className="bg-white/80 text-[10px] uppercase tracking-wider text-mk-dim">
                              <tr>
                                <th className="px-3 py-2">Parameter</th>
                                <th className="px-3 py-2">Tipe</th>
                                <th className="px-3 py-2">Wajib</th>
                                <th className="px-3 py-2">Keterangan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tool.params.map((param) => (
                                <tr key={param.name} className="border-t border-mk-line/70">
                                  <td className="px-3 py-2 font-mono font-bold">{param.name}</td>
                                  <td className="px-3 py-2 text-mk-muted">{param.type}</td>
                                  <td className="px-3 py-2">{param.required ? 'ya' : '—'}</td>
                                  <td className="px-3 py-2 text-mk-muted">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[12.5px] text-mk-muted">Tanpa parameter.</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-mk-muted">
                        <span className="font-bold text-mk-cream">Return:</span> {tool.returns}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-mk-line bg-white/70 px-3 py-2">
                        <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre text-[11px]">{tool.example}</code>
                        <CopyButton value={tool.example} label="" />
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {tab === 'prompts' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="mk-card p-5">
              <h2 className="text-base font-extrabold">Prompt riset</h2>
              <p className="text-[13px] text-mk-muted">Prompt bawaan mengarahkan asisten memakai tool dengan urutan yang aman.</p>
              <div className="mt-3 space-y-2">
                {MCP_PROMPTS.map((prompt) => (
                  <div key={prompt.name} className="rounded-xl border border-mk-line bg-white/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-[12px] font-extrabold">{prompt.name}</code>
                      <span className="rounded bg-mk-coral/10 px-1.5 py-0.5 text-[10px] font-bold text-mk-coral">{prompt.title}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-mk-muted">{prompt.description}</p>
                    {prompt.args.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prompt.args.map((a) => (
                          <span key={a.name} className="mk-chip px-2 py-0.5 text-[10px]">
                            {a.name}{a.required ? ' *' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="mk-card p-5">
                <h2 className="text-base font-extrabold">Resource</h2>
                <p className="text-[13px] text-mk-muted">Dokumen yang bisa dibaca langsung oleh MCP client.</p>
                <div className="mt-3 space-y-2">
                  {MCP_RESOURCES.map((r) => (
                    <div key={r.uri} className="rounded-xl border border-mk-line bg-white/60 p-3">
                      <div className="flex items-center gap-2">
                        <code className="text-[11.5px] font-bold">{r.uri}</code>
                        <CopyButton value={r.uri} label="" />
                      </div>
                      <p className="mt-1 text-[12px] text-mk-muted">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mk-card p-5">
                <h2 className="text-base font-extrabold">Tips riset yang efektif</h2>
                <ul className="mt-3 space-y-2 text-[12.5px] text-mk-muted">
                  {[
                    'Mulai dari training_stats supaya tidak menambah duplikat.',
                    'Pakai motion_lab_brief untuk mendapat rencana per detik, bukan sekadar daftar ide.',
                    'Selalu training_validate sebelum menyimpan pack code.',
                    'Simpan maksimal 10 item per gelombang agar mudah ditinjau di Training Studio.',
                    'Ekspor bundle sebelum perubahan besar.',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-coral" /> {t}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/admin/research" className="mk-card flex items-center gap-3 p-4 transition hover:bg-white/80">
                <FlaskConical className="h-5 w-5 text-mk-coral" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold">Buka Motion Lab</div>
                  <div className="text-[12px] text-mk-muted">Riset resep gerak & simpan langsung ke training.</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-mk-coral" />
              </Link>
            </section>
          </div>
        )}

        <footer className="mt-8 flex flex-wrap items-center gap-2 text-[11px] text-mk-dim">
          <Server className="h-3.5 w-3.5" /> {MCP_SERVER_NAME} v{MCP_SERVER_VERSION}
          <span>·</span>
          <span>Remote: <code>/api/mcp</code></span>
          <span>·</span>
          <span>Lokal: <code>npm run mcp:training</code></span>
        </footer>
      </main>
    </div>
  );
}
