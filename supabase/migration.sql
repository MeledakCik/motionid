-- ============================================================================
-- MOTIONKU - SUPABASE DATABASE SCHEMA, RLS POLICIES, ADMIN TRAINING, & SEED
-- File: supabase/migration.sql
-- Petunjuk: Copy seluruh isi file ini dan jalankan (Run) di SQL Editor Supabase.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABEL PROFILES
-- Menyimpan profil pengguna dari Supabase Auth (Google OAuth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: User dapat melihat profilnya sendiri" ON public.profiles;
CREATE POLICY "Profiles: User dapat melihat profilnya sendiri"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: User dapat mengubah profilnya sendiri" ON public.profiles;
CREATE POLICY "Profiles: User dapat mengubah profilnya sendiri"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: User dapat membuat profilnya sendiri" ON public.profiles;
CREATE POLICY "Profiles: User dapat membuat profilnya sendiri"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger otomatis membuat baris di public.profiles saat user baru login via Google
-- Jika email adalah kakangkasyaf@gmail.com, otomatis diberikan role = 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Kreator MotionKu'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    CASE WHEN LOWER(COALESCE(NEW.email, '')) = 'kakangkasyaf@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = CASE WHEN LOWER(EXCLUDED.email) = 'kakangkasyaf@gmail.com' THEN 'admin' ELSE public.profiles.role END,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. TABEL TEMPLATES
-- Menyimpan 9 template bawaan (Quote Q1-Q3, Promo P1-P3, Edukasi E1-E3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('quote', 'promo', 'edukasi')),
  preview_image TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Templates: Semua pengguna dapat membaca template" ON public.templates;
CREATE POLICY "Templates: Semua pengguna dapat membaca template"
  ON public.templates FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 3. TABEL PROJECTS
-- Menyimpan proyek video milik masing-masing user + koleksi gambar user (RLS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('quote', 'promo', 'edukasi')),
  template_id TEXT NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
  script_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  style_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projects: User hanya dapat melihat proyek miliknya sendiri" ON public.projects;
CREATE POLICY "Projects: User hanya dapat melihat proyek miliknya sendiri"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects: User hanya dapat membuat proyek untuk dirinya sendiri" ON public.projects;
CREATE POLICY "Projects: User hanya dapat membuat proyek untuk dirinya sendiri"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects: User hanya dapat mengupdate proyek miliknya sendiri" ON public.projects;
CREATE POLICY "Projects: User hanya dapat mengupdate proyek miliknya sendiri"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Projects: User hanya dapat menghapus proyek miliknya sendiri" ON public.projects;
CREATE POLICY "Projects: User hanya dapat menghapus proyek miliknya sendiri"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();

-- ----------------------------------------------------------------------------
-- 4. TABEL AI_TRAINING_DATA (KHUSUS ADMIN kakangkasyaf@gmail.com)
-- Menyimpan hasil training kalimat Hook, Scene, CTA, Kata Kunci, dan Gambar
-- yang ditambahkan oleh Admin agar Smart Engine makin pintar.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('hook', 'scene2', 'scene3', 'cta', 'image_asset', 'keyword_rule')),
  category TEXT NOT NULL CHECK (category IN ('quote', 'promo', 'edukasi', 'all')),
  content_text TEXT NOT NULL,
  subtext TEXT DEFAULT '',
  emoji TEXT DEFAULT '✨',
  image_url TEXT DEFAULT '',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_email TEXT NOT NULL DEFAULT 'kakangkasyaf@gmail.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Semua user dapat membaca data training agar Smart Engine di browser mereka ikut pintar
DROP POLICY IF EXISTS "Training: Semua user dapat membaca bank training" ON public.ai_training_data;
CREATE POLICY "Training: Semua user dapat membaca bank training"
  ON public.ai_training_data FOR SELECT
  USING (true);

-- Hanya Admin (kakangkasyaf@gmail.com) yang boleh menambah/mengubah/menghapus data training
DROP POLICY IF EXISTS "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat INSERT" ON public.ai_training_data;
CREATE POLICY "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat INSERT"
  ON public.ai_training_data FOR INSERT
  WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'kakangkasyaf@gmail.com');

DROP POLICY IF EXISTS "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat UPDATE" ON public.ai_training_data;
CREATE POLICY "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat UPDATE"
  ON public.ai_training_data FOR UPDATE
  USING (LOWER(auth.jwt() ->> 'email') = 'kakangkasyaf@gmail.com')
  WITH CHECK (LOWER(auth.jwt() ->> 'email') = 'kakangkasyaf@gmail.com');

DROP POLICY IF EXISTS "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat DELETE" ON public.ai_training_data;
CREATE POLICY "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat DELETE"
  ON public.ai_training_data FOR DELETE
  USING (LOWER(auth.jwt() ->> 'email') = 'kakangkasyaf@gmail.com');

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKET UNTUK GAMBAR USER & ASSET ADMIN
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-backgrounds', 'project-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Storage: Semua orang dapat melihat background publik" ON storage.objects;
CREATE POLICY "Storage: Semua orang dapat melihat background publik"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-backgrounds');

DROP POLICY IF EXISTS "Storage: User terautentikasi dapat upload background" ON storage.objects;
CREATE POLICY "Storage: User terautentikasi dapat upload background"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-backgrounds' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Storage: User dapat menghapus file miliknya sendiri" ON storage.objects;
CREATE POLICY "Storage: User dapat menghapus file miliknya sendiri"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-backgrounds' AND auth.uid() = owner);

-- ----------------------------------------------------------------------------
-- 6. SEED DATA: 9 TEMPLATE MOTION GRAPHIC (Q1-Q3, P1-P3, E1-E3)
-- Menggunakan picsum.photos untuk preview image (bukan Unsplash Source)
-- ----------------------------------------------------------------------------
INSERT INTO public.templates (id, name, category, preview_image, config_json)
VALUES
  (
    'Q1',
    'Aura Gradient Center',
    'quote',
    'https://picsum.photos/seed/motionku-q1/720/1280',
    '{"description": "Teks besar di tengah dengan latar belakang gradien dinamis yang bergerak halus.", "layout": "center-hero", "defaultFont": "Playfair Display", "defaultAnimation": "fade", "defaultPalette": "midnight-galau", "backgroundType": "gradient", "gradientPreset": "aurora-night"}'::jsonb
  ),
  (
    'Q2',
    'Cinematic Typewriter Blur',
    'quote',
    'https://picsum.photos/seed/motionku-q2/720/1280',
    '{"description": "Efek ketikan mesin tik (typewriter) di atas latar foto estetik yang diburamkan (blur).", "layout": "typewriter-card", "defaultFont": "Poppins", "defaultAnimation": "typewriter", "defaultPalette": "warm-sepia", "backgroundType": "image", "imageBlur": 12}'::jsonb
  ),
  (
    'Q3',
    'Karaoke Word-by-Word',
    'quote',
    'https://picsum.photos/seed/motionku-q3/720/1280',
    '{"description": "Teks muncul dan menyala kata demi kata secara ritmis ala lirik karaoke.", "layout": "karaoke-flow", "defaultFont": "Montserrat", "defaultAnimation": "pop", "defaultPalette": "neon-cyber", "backgroundType": "gradient", "gradientPreset": "deep-violet"}'::jsonb
  ),
  (
    'P1',
    'Flash Sale Harga Jumbo',
    'promo',
    'https://picsum.photos/seed/motionku-p1/720/1280',
    '{"description": "Harga super besar dengan stiker DISKON berkedip dan frame foto produk unggulan.", "layout": "hero-price-sticker", "defaultFont": "Bebas Neue", "defaultAnimation": "bounce", "defaultPalette": "promo-merah-kuning", "backgroundType": "gradient", "gradientPreset": "fire-sale"}'::jsonb
  ),
  (
    'P2',
    'Before-After & Daftar Paket',
    'promo',
    'https://picsum.photos/seed/motionku-p2/720/1280',
    '{"description": "Perbandingan harga coret (Before-After) dan rincian keunggulan produk UMKM.", "layout": "price-comparison-list", "defaultFont": "Montserrat", "defaultAnimation": "slide-up", "defaultPalette": "fresh-emerald", "backgroundType": "solid", "solidColor": "#064E3B"}'::jsonb
  ),
  (
    'P3',
    'Urgency Countdown Timer',
    'promo',
    'https://picsum.photos/seed/motionku-p3/720/1280',
    '{"description": "Dilengkapi penghitung waktu mundur (Countdown Promo) untuk memicu FOMO pembeli.", "layout": "countdown-fomo", "defaultFont": "Anton", "defaultAnimation": "zoom", "defaultPalette": "sunset-orange", "backgroundType": "gradient", "gradientPreset": "crimson-amber"}'::jsonb
  ),
  (
    'E1',
    'Listicle 3 Langkah Angka Besar',
    'edukasi',
    'https://picsum.photos/seed/motionku-e1/720/1280',
    '{"description": "Format 3 Cara dengan badge angka raksasa 1, 2, 3 yang tegas dan mudah dibaca.", "layout": "big-numbered-steps", "defaultFont": "Space Grotesk", "defaultAnimation": "slide-up", "defaultPalette": "tech-blue", "backgroundType": "gradient", "gradientPreset": "ocean-tech"}'::jsonb
  ),
  (
    'E2',
    'Shocking Fact Pop-Up',
    'edukasi',
    'https://picsum.photos/seed/motionku-e2/720/1280',
    '{"description": "Fakta mengejutkan dengan animasi teks Pop elastis dan highlight stabilo.", "layout": "fact-highlight-pop", "defaultFont": "Montserrat", "defaultAnimation": "pop", "defaultPalette": "cyber-lime", "backgroundType": "solid", "solidColor": "#0F172A"}'::jsonb
  ),
  (
    'E3',
    'Interactive Q&A Quiz',
    'edukasi',
    'https://picsum.photos/seed/motionku-e3/720/1280',
    '{"description": "Format tebak-tebakan interaktif & tanya jawab untuk mendongkrak komentar penonton.", "layout": "qa-quiz-card", "defaultFont": "Poppins", "defaultAnimation": "bounce", "defaultPalette": "neon-cyber", "backgroundType": "gradient", "gradientPreset": "indigo-sky"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  preview_image = EXCLUDED.preview_image,
  config_json = EXCLUDED.config_json;
