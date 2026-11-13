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

## Training gaya (admin)

Tab **Referensi** di mode admin:

1. Unggah video referensi. Video dianalisis di browser: warna dominan, banyaknya gerak, potongan adegan, dan bagian layar yang paling ramai.
2. Atau tempel link YouTube/TikTok. Judul, kreator, dan warna thumbnail dibaca lewat oEmbed resmi (`/api/reference`, khusus admin). Gerak dan transisi tidak bisa dibaca dari link.
3. Sesuaikan form, isi **kata pemicu**, lalu klik **Simpan untuk semua user**. Prompt yang mengandung kata pemicu akan memprioritaskan gaya ini.
