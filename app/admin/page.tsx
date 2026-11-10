'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { interpolateTemplate, parseTopic } from '@/lib/smart-engine';
import {
  applyTrainingRow,
  fetchTrainingRows,
  TrainingCategory,
  TrainingRow,
  TrainingType,
} from '@/lib/training';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kakangkasyaf@gmail.com';

const TABS: { id: TrainingType; label: string; hint: string }[] = [
  { id: 'hook', label: 'Hook', hint: 'Kalimat pembuka scene 1' },
  { id: 'scene2', label: 'Scene 2', hint: 'Isi / solusi' },
  { id: 'scene3', label: 'Scene 3', hint: 'Bukti / harga' },
  { id: 'cta', label: 'CTA', hint: 'Ajakan di scene terakhir' },
  { id: 'image_asset', label: 'Gambar', hint: 'Referensi background' },
  { id: 'keyword_rule', label: 'Kata Kunci', hint: 'Topik → hashtag' },
];

const CATEGORIES: { id: TrainingCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'promo', label: 'Promo' },
  { id: 'quote', label: 'Quote' },
  { id: 'edukasi', label: 'Edukasi' },
];

const PLACEHOLDERS = ['{produk}', '{harga}', '{harga_coret}', '{toko}', '{topik}', '{emosi}'];

const SAMPLE_META = parseTopic('promo kopi susu gula aren 18rb', {
  customStoreName: 'Kopi Senja',
});

export default function AdminTrainingPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [tab, setTab] = useState<TrainingType>('hook');
  const [category, setCategory] = useState<TrainingCategory>('all');
  const [text, setText] = useState('');
  const [subtext, setSubtext] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isAdmin = email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrainingRows();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data training.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ''));
    reload();
  }, [reload]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => (c[r.type] = (c[r.type] || 0) + 1));
    return c;
  }, [rows]);

  const visibleRows = rows.filter((r) => r.type === tab);
  const activeTab = TABS.find((t) => t.id === tab)!;

  const needsSubtext = tab === 'scene2' || tab === 'scene3' || tab === 'keyword_rule';
  const needsEmoji = tab === 'scene2' || tab === 'scene3';
  const needsImage = tab === 'image_asset';
  const hideCategory = tab === 'cta' || tab === 'keyword_rule';

  const textLabel =
    tab === 'image_asset'
      ? 'Judul gambar'
      : tab === 'keyword_rule'
      ? 'Kata kunci (pisahkan koma)'
      : 'Kalimat';
  const subtextLabel = tab === 'keyword_rule' ? 'Hashtag (pisahkan koma)' : 'Subtext';

  const preview =
    text.trim() && ['hook', 'scene2', 'scene3', 'cta'].includes(tab)
      ? interpolateTemplate(text, SAMPLE_META)
      : '';

  const canSave =
    text.trim().length > 0 &&
    (!needsImage || imageUrl.trim().length > 0) &&
    (tab !== 'keyword_rule' || subtext.trim().length > 0);

  const resetForm = () => {
    setText('');
    setSubtext('');
    setImageUrl('');
    setEmoji('✨');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `admin-assets/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('project-backgrounds')
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from('project-backgrounds').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      if (!text.trim()) setText(file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: insErr } = await supabase
        .from('ai_training_data')
        .insert({
          type: tab,
          category: hideCategory ? 'all' : category,
          content_text: text.trim(),
          subtext: needsSubtext ? subtext.trim() : '',
          emoji: needsEmoji ? emoji || '✨' : '✨',
          image_url: needsImage ? imageUrl.trim() : '',
          created_by_email: email || ADMIN_EMAIL,
        })
        .select('*')
        .single();
      if (insErr) throw new Error(insErr.message);
      const row = data as TrainingRow;
      applyTrainingRow(row);
      setRows((prev) => [row, ...prev]);
      resetForm();
      setNotice('Tersimpan & langsung aktif di engine');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const { error: delErr } = await createClient()
      .from('ai_training_data')
      .delete()
      .eq('id', id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setNotice('Dihapus (berlaku penuh setelah halaman dimuat ulang)');
  };

  if (email !== null && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Halaman ini khusus admin.</p>
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-400 hover:underline">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500';
  const labelCls = 'text-xs font-semibold text-slate-400 block mb-1.5';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-bold">Training Smart Engine</h1>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">{email}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Tab */}
        <nav className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                resetForm();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                tab === t.id
                  ? 'bg-violet-600/20 border-violet-500 text-white'
                  : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] opacity-60">{counts[t.id] || 0}</span>
            </button>
          ))}
        </nav>

        {(error || notice) && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs border ${
              error
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-200'
                : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
            }`}
          >
            {error || notice}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <section className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <h2 className="text-sm font-bold">Tambah {activeTab.label}</h2>
              <p className="text-xs text-slate-500">{activeTab.hint}</p>
            </div>

            {!hideCategory && (
              <div>
                <span className={labelCls}>Kategori</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold border ${
                        category === c.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-white/10 text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>{textLabel}</label>
              <textarea
                rows={tab === 'image_asset' || tab === 'keyword_rule' ? 2 : 3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={inputCls}
                placeholder={tab === 'keyword_rule' ? 'kopi, latte, espresso' : ''}
              />
              {['hook', 'scene2', 'scene3', 'cta'].includes(tab) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {PLACEHOLDERS.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => setText((v) => `${v}${ph}`)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-400"
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {needsSubtext && (
              <div>
                <label className={labelCls}>{subtextLabel}</label>
                <input
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  className={inputCls}
                  placeholder={tab === 'keyword_rule' ? '#kopi, #kulinerbandung' : ''}
                />
              </div>
            )}

            {needsEmoji && (
              <div>
                <label className={labelCls}>Emoji</label>
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className={`${inputCls} w-20 text-center`}
                  maxLength={4}
                />
              </div>
            )}

            {needsImage && (
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/10 text-xs font-semibold text-cyan-200 cursor-pointer hover:bg-cyan-500/15">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  <span>Upload gambar</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={inputCls}
                  placeholder="atau tempel URL gambar"
                />
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                )}
              </div>
            )}

            {preview && (
              <div className="rounded-xl bg-slate-950 border border-white/5 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Contoh hasil
                </span>
                <p className="text-xs text-slate-200">
                  {tab !== 'cta' && tab !== 'hook' ? `${emoji} ` : ''}
                  {preview}
                </p>
                {subtext.trim() && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {interpolateTemplate(subtext, SAMPLE_META)}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Simpan</span>
            </button>
          </section>

          {/* Daftar */}
          <section className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold">
                {activeTab.label} yang sudah dilatih
              </h2>
              <span className="text-xs text-slate-500">{visibleRows.length} item</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
                Belum ada data. Tambahkan lewat form di samping.
              </div>
            ) : (
              <ul className="space-y-2">
                {visibleRows.map((r) => (
                  <li
                    key={r.id}
                    className="group flex gap-3 items-start p-3.5 rounded-2xl bg-slate-900 border border-white/10"
                  >
                    {r.type === 'image_asset' && r.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.content_text}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-100 break-words">
                        {(r.type === 'scene2' || r.type === 'scene3') && `${r.emoji} `}
                        {r.content_text}
                      </p>
                      {r.subtext && (
                        <p className="text-xs text-slate-500 mt-0.5 break-words">{r.subtext}</p>
                      )}
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                        {r.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      aria-label="Hapus"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
