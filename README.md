# MotionKu — AI Motion Graphic Generator (Zero External AI API)

Aplikasi web fullstack **Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Supabase + Framer Motion** untuk membuat video pendek TikTok, Instagram Reels, dan YouTube Shorts secara otomatis menggunakan **Smart Template Engine + Rule-Based Generator** murni di dalam kode (tanpa OpenAI, Gemini, atau Claude API).

## Fitur Utama
1. **Smart Template Engine (`lib/smart-engine.ts`)**:
   - **60+ Template Hook** (Promo, Quote, Edukasi), **72 Variasi Kalimat Scene** (24 per kategori), dan **35+ Template CTA**.
   - Fungsi `parseTopic(topik)` mendeteksi nominal harga via RegEx `/(\d+[.,]?\d*)\s*(rb|ribu|k|jt)/i` serta kata kunci emosi (`galau`, `sedih`, `capek`, `promo`, `diskon`).
   - Interpolasi penuh untuk `{produk}`, `{harga}`, `{harga_coret}`, `{toko}`, dan `{topik}` tanpa menyisakan placeholder mentah.
2. **Halaman Admin Training AI (`/admin` — Khusus `kakangkasyaf@gmail.com`)**:
   - Dilindungi oleh `middleware.ts` dan RLS Supabase (`public.ai_training_data`).
   - Admin `kakangkasyaf@gmail.com` dapat melatih Smart Engine agar makin pintar dengan menambahkan kalimat Hook baru, variasi kalimat Scene, CTA, aturan kata kunci, serta gambar referensi motion graphic.
3. **Upload Banyak Gambar User (Multi-Image Motion Graphic)**:
   - Pengguna dapat mengunggah beberapa foto/gambar mereka sendiri sekaligus untuk dijadikan slideshow/background tiap scene pada video motion graphic.
4. **Export Video MP4 di Browser (`lib/video-exporter.ts`)**:
   - Menggunakan `HTMLCanvasElement.captureStream(30)` + `MediaRecorder` + `AudioContext` (`MediaStreamDestination`) selama total durasi seluruh scene dengan progress bar real-time (`"Merekam 3s / 12s..."`).

## Langkah Setup Supabase (End-to-End)

### 1. Buat Project Supabase Baru
1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard) dan klik **New Project**.
2. Catat **Project URL** dan **anon public key** dari menu **Project Settings ➔ API**.

### 2. Copy & Jalankan `supabase/migration.sql`
1. Buka menu **SQL Editor** di dashboard Supabase Anda.
2. Salin seluruh isi file `supabase/migration.sql` lalu klik **Run**.
3. Script tersebut aman dijalankan berulang kali (juga di atas skema lama) dan akan menyiapkan:
   - Tabel `public.projects` dengan RLS: setiap user hanya bisa melihat, mengubah, dan menghapus proyeknya sendiri.
   - Tabel `public.ai_training_data` dengan RLS: user yang login boleh membaca, hanya admin yang boleh menulis.
   - Tabel `public.app_admins` + fungsi `public.is_admin()`: daftar email admin (email harus sudah terverifikasi).
4. Buka **Advisors ➔ Security Advisor**: tidak boleh ada peringatan "RLS disabled" untuk tabel di atas.

#### Menambah admin
Jalankan di SQL Editor, lalu isi juga `NEXT_PUBLIC_ADMIN_EMAIL` agar menu admin tampil:

```sql
insert into public.app_admins (email) values ('email.admin@contoh.com');
```

### 3. Setting Auth Google Provider
1. Di dashboard Supabase, buka menu **Authentication ➔ Providers ➔ Google** lalu aktifkan **Enable Sign in with Google**.
2. Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console Anda.
3. Buka **Authentication ➔ URL Configuration**:
   - Isi **Site URL** dengan `http://localhost:3000` (atau domain Vercel Anda saat produksi).
   - Tambahkan **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://nama-project-anda.vercel.app/auth/callback`

### 4. Isi File `.env.local`
Salin `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu isi dengan kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://project-id-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=kakangkasyaf@gmail.com
```

## Cara Menjalankan Lokal & Deploy ke Vercel

### Menjalankan Secara Lokal
```bash
npm install
npm run build
npm run dev
```

### Deploy ke Vercel
1. Push repository ini ke GitHub / GitLab / Bitbucket.
2. Buka [https://vercel.com/new](https://vercel.com/new) dan import repository **MotionKu**.
3. Pada bagian **Environment Variables** di Vercel, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (isi dengan URL domain Vercel Anda, misal `https://motionku.vercel.app`)
   - `NEXT_PUBLIC_ADMIN_EMAIL` (`kakangkasyaf@gmail.com`)
4. Klik **Deploy**. Proyek akan otomatis menjalankan `npm run build` dan siap diakses publik.

## Fitur editor

- **Simpan otomatis**: proyek di `/editor/[id]` dimuat dari database dan disimpan otomatis 1,5 detik setelah perubahan terakhir. Dari `/editor` tanpa id, klik **Simpan proyek**.
- **Render video** dengan durasi penuh: 1080×1920 (9:16), 1080×1080 (1:1), atau 1920×1080 (16:9). Format MP4 bila browser mendukung (Chrome/Edge terbaru, Safari), selain itu WebM. Opsi *Ketukan musik saat render* menambahkan beat sederhana sesuai tempo gaya. Jangan pindah tab selama merekam.
- **Gaya dari prompt**: generator membaca topik, suasana, warna, platform, dan kata yang perlu ditonjolkan, lalu memilih paket gaya (palet, latar, layout, transisi, animasi judul, font, kamera, tempo) dan susunan scene (lengkap, alternatif, ringkas). Tombol **🎲 Acak gaya** mengganti gaya tanpa mengubah teks.
- **Narasi / voice over**: buka panel **Musik → Suara narator**. Skrip narasi bisa dibuat otomatis dari teks tiap scene, didengarkan lewat suara bawaan browser (khusus contoh), lalu direkam langsung dari mikrofon atau diunggah dari file MP3/M4A/WAV. Rekaman ikut dirender ke MP4 dan musik otomatis mengecil saat narasi berbunyi (*ducking*). Semua proses audio berjalan lokal di browser — tanpa API AI eksternal.

## Training gaya (admin)

Tab **Referensi** di mode admin:

1. Unggah video referensi. Video dianalisis di browser: warna dominan, banyaknya gerak, potongan adegan, dan bagian layar yang paling ramai.
2. Atau tempel link YouTube/TikTok. Judul, kreator, dan warna thumbnail dibaca lewat oEmbed resmi (`/api/reference`, khusus admin). Gerak dan transisi tidak bisa dibaca dari link.
3. Sesuaikan form, isi **kata pemicu**, lalu klik **Simpan untuk semua user**. Prompt yang mengandung kata pemicu akan memprioritaskan gaya ini.

## Library kreatif bawaan (`lib/creative-packs.ts`)

Studio membawa library besar yang ringan karena dibuat dari kombinasi bentuk + tema, bukan file gambar berat:

| Jenis | Jumlah | Isi |
| --- | --- | --- |
| Template | **336** | 7 preset dasar × 12 palet × 4 gaya gerak |
| Icon pack | **340** | 34 glyph × 10 gaya (solid, outline, duotone) |
| Component pack | **300** | 15 gaya kartu × 20 palet |
| Transition pack | **300** | 25 gerak transisi × 12 tempo/easing |
| Animation pack | **300** | 25 gerak teks × 12 tempo/easing |

Semua pack bisa dicari dan difilter lewat tab **Pack** di panel kiri Studio. Pilih pack untuk langsung menerapkannya ke scene aktif.

## Training kode pack (admin)

Ada tiga halaman admin (semua dijaga middleware + RLS `is_admin()`):

- `/admin` — **Training Studio**: impor batch JSON/SVG, input kode komponen/transisi/animasi/efek, edit/hapus, ekspor bundle.
- `/admin/research` — **Motion Lab**: 30 resep gerak (CapCut, Illustrator, Figma, Alight Motion, Premiere, After Effects) + generator brief riset per detik.
- `/admin/mcp` — **MCP Connector**: status sesi, konfigurasi siap salin untuk Claude/Cursor/VS Code/OpenCode, katalog tool/prompt/resource, dan tes endpoint.

Format kode yang diterima:

- **SVG ikon** — tempel `<svg>...</svg>` atau isi atribut `d` saja. Hanya `path` yang dibaca; script dan event handler diabaikan.
- **Kode komponen** — pasangan `background: ...; color: ...; border: ...; radius: ...; shadow: ...; opacity: ...; accent: ...;` atau JSON komponen.
- **Kode transisi** — JSON `{ "kind": "whip", "duration": 0.4, "params": { "dir": "left", "fx": "kilat" } }`.
- **Kode animasi** — JSON `{ "kind": "in", "duration": 0.6, "keyframes": [{ "t": 0, "y": 40, "alpha": 0 }, { "t": 1 }] }`.
- **Kode efek** — JSON `{ "kind": "ikon", "icon": "coffee", "motion": "melayang", "intensity": 1.2 }`.

Parser bersifat aman: tidak ada eksekusi HTML/JS mentah, hanya pembacaan JSON/SVG terbatas. Kolom `type` pada `ai_training_data` menerima `icon_pack`, `component_pack`, `transition_pack`, `animation_pack`, `effect_pack`, `hook`, `cta`, `scene2`, dan `scene3` (lihat `supabase/migration.sql`).

## Konektor MCP training v2

MCP membuat asisten AI bisa membaca, memvalidasi, menambah, mengubah, mengekspor, dan meriset bank training. Ada dua jalur:

1. **Remote HTTP** — `POST /api/mcp`, header `Authorization: Bearer <access token sesi admin>`. Tidak perlu install repo. Cocok untuk Claude, Cursor, VS Code, dan OpenCode.
2. **Lokal stdio** — `npm run mcp:training` dengan env `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`.

Tool yang tersedia (13): `training_health`, `training_schema`, `training_list`, `training_get`, `training_stats`, `training_validate`, `training_add`, `training_bulk_add`, `training_update`, `training_delete`, `training_export`, `motion_lab_list`, `motion_lab_brief`.

Selain tool, server menyediakan 4 prompt riset (`deep_research_motion`, `audit_training_quality`, `design_pack_from_reference`, `refresh_motion_library`) dan 4 resource (`motionid://guide/mcp`, `motionid://schema/training`, `motionid://examples/packs`, `motionid://motion-lab/recipes`).

Konfigurasi lokal:

```json
{
  "mcpServers": {
    "motionid-training": {
      "command": "npm",
      "args": ["--prefix", "/path/ke/motionid", "run", "mcp:training"],
      "env": {
        "SUPABASE_URL": "https://project-id.supabase.co",
        "SUPABASE_ANON_KEY": "supabase-anon-key",
        "SUPABASE_ACCESS_TOKEN": "access-token-akun-admin"
      }
    }
  }
}
```

Konfigurasi remote (Cursor/Claude):

```json
{
  "mcpServers": {
    "motionid-training": {
      "url": "https://domain-kamu.com/api/mcp",
      "headers": { "Authorization": "Bearer access-token-akun-admin" }
    }
  }
}
```

Cara termudah: buka `/admin/mcp`, pilih client + mode, lalu salin JSON yang sudah terisi otomatis. Token diambil dari sesi login dan tidak dikirim ke pihak lain. Jangan memakai service-role key, dan jangan commit file konfigurasi yang berisi token. Token sesi berlaku sekitar satu jam; bila kedaluwarsa, muat ulang halaman admin dan ganti nilainya.

`npm run mcp:audit` memeriksa 30 resep Motion Lab terhadap parser pack yang sama dengan admin, sehingga kode yang disimpan lewat MCP tidak mungkin ditolak diam-diam.


## Identitas visual & responsivitas

- Warna brand: **Iris `#7C6CFF`**, **Lime `#C8F169`**, **Midnight `#0E0A24`** (variabel `--mk-*` di `app/globals.css` dan `brand.*` di `tailwind.config.ts`).
- Layout Studio responsif: di layar kecil panel kiri, kanvas, dan inspector bergantian lewat bottom navigation; kontrol Figma-style (X/Y, skala, rotasi, opacity, radius, alignment, kode CSS komponen) tetap tersedia.
- Animasi demo pack otomatis berhenti saat pengguna mengaktifkan `prefers-reduced-motion`.
