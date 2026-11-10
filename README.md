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
3. Script tersebut akan otomatis membuat:
   - Tabel `public.profiles` (beserta trigger otomatis yang memberikan role `admin` untuk `kakangkasyaf@gmail.com`)
   - Tabel `public.templates` (beserta seed 9 template Q1–Q3, P1–P3, E1–E3 dengan preview `picsum.photos`)
   - Tabel `public.projects` (dilengkapi RLS CRUD per user dan kolom `user_images`)
   - Tabel `public.ai_training_data` (dilengkapi RLS khusus `kakangkasyaf@gmail.com`)
   - Storage bucket publik `project-backgrounds`

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
