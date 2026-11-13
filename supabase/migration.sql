-- ============================================================================
-- MotionKu — skema database + Row Level Security (RLS)
-- File: supabase/migration.sql
--
-- Jalankan SELURUH isi file ini di Supabase SQL Editor.
-- Aman dijalankan berulang kali, dan aman dijalankan di atas skema lama
-- (versi lengkap f48954f maupun versi singkat be052e7).
--
-- Ringkasan izin:
--   projects          : user hanya bisa melihat/mengubah/menghapus proyeknya sendiri
--   ai_training_data  : user yang login boleh membaca; hanya admin yang boleh menulis
--   app_admins        : daftar email admin; tidak bisa dibaca/diubah lewat API
--
-- Menambah admin (jalankan di SQL Editor):
--   insert into public.app_admins (email) values ('email.admin@contoh.com');
-- Email admin juga perlu diisi di NEXT_PUBLIC_ADMIN_EMAIL agar menu admin tampil.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. ADMIN
-- ----------------------------------------------------------------------------
create table if not exists public.app_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
-- Sengaja tanpa policy: tabel ini hanya bisa dikelola dari SQL Editor / service role.
revoke all on table public.app_admins from anon, authenticated;

insert into public.app_admins (email)
values ('kakangkasyaf@gmail.com')
on conflict (email) do nothing;

-- true bila user yang sedang login terdaftar di app_admins DAN emailnya sudah terverifikasi.
-- Email dibaca dari auth.users (bukan dari isi token), jadi tidak bisa dipalsukan dari browser.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.app_admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. PROJECTS — kolom sesuai yang dipakai app/create & app/dashboard
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Proyek tanpa judul',
  topic text not null default '',
  category text not null default 'promo',
  template_id text not null default 'P1',
  script_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  user_images jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade dari skema be052e7 (kolom scenes/global_settings): tambahkan kolom yang dipakai aplikasi.
alter table public.projects add column if not exists topic text not null default '';
alter table public.projects add column if not exists category text not null default 'promo';
alter table public.projects add column if not exists template_id text not null default 'P1';
alter table public.projects add column if not exists script_json jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists style_json jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists user_images jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists status text not null default 'draft';
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();
alter table public.projects alter column user_id set default auth.uid();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.projects'::regclass and conname = 'projects_category_check'
  ) then
    alter table public.projects
      add constraint projects_category_check check (category in ('quote', 'promo', 'edukasi')) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.projects'::regclass and conname = 'projects_status_check'
  ) then
    alter table public.projects
      add constraint projects_status_check check (status in ('draft', 'published')) not valid;
  end if;
end $$;

-- Dashboard: daftar proyek milik user, urut terbaru
create index if not exists idx_projects_user_updated on public.projects (user_id, updated_at desc);

create or replace function public.update_projects_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.update_projects_updated_at();

alter table public.projects enable row level security;

drop policy if exists "Projects: User hanya dapat melihat proyek miliknya sendiri" on public.projects;
create policy "Projects: User hanya dapat melihat proyek miliknya sendiri"
  on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Projects: User hanya dapat membuat proyek untuk dirinya sendiri" on public.projects;
create policy "Projects: User hanya dapat membuat proyek untuk dirinya sendiri"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Projects: User hanya dapat mengupdate proyek miliknya sendiri" on public.projects;
create policy "Projects: User hanya dapat mengupdate proyek miliknya sendiri"
  on public.projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Projects: User hanya dapat menghapus proyek miliknya sendiri" on public.projects;
create policy "Projects: User hanya dapat menghapus proyek miliknya sendiri"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.projects from anon;
grant select, insert, update, delete on table public.projects to authenticated;

-- ----------------------------------------------------------------------------
-- 3. AI_TRAINING_DATA — dibaca generator semua user, ditulis hanya oleh admin
-- ----------------------------------------------------------------------------
create table if not exists public.ai_training_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  type text not null,
  category text not null default 'all',
  content_text text not null,
  subtext text,
  emoji text,
  image_url text,
  video_url text,
  creator_handle text,
  motion_profile jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_training_data add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.ai_training_data alter column user_id set default auth.uid();
alter table public.ai_training_data add column if not exists subtext text;
alter table public.ai_training_data add column if not exists emoji text;
alter table public.ai_training_data add column if not exists image_url text;
alter table public.ai_training_data add column if not exists video_url text;
alter table public.ai_training_data add column if not exists creator_handle text;
alter table public.ai_training_data add column if not exists motion_profile jsonb default '{}'::jsonb;
alter table public.ai_training_data alter column motion_profile set default '{}'::jsonb;
alter table public.ai_training_data add column if not exists metadata_json jsonb not null default '{}'::jsonb;

alter table public.ai_training_data drop constraint if exists ai_training_data_type_check;
alter table public.ai_training_data
  add constraint ai_training_data_type_check
  check (
    type in (
      'video_motion',
      'ui_blueprint',
      'hook',
      'scene2',
      'scene3',
      'cta',
      'image_asset',
      'keyword_rule',
      'icon_pack',
      'component_pack',
      'transition_pack',
      'animation_pack'
    )
  )
  not valid;

alter table public.ai_training_data drop constraint if exists ai_training_data_category_check;
alter table public.ai_training_data
  add constraint ai_training_data_category_check
  check (category in ('quote', 'promo', 'edukasi', 'saas', 'all'))
  not valid;

create index if not exists idx_ai_training_data_created on public.ai_training_data (created_at desc);

alter table public.ai_training_data enable row level security;

-- Hapus policy lama (versi f48954f, berbasis email yang ditulis langsung di SQL)
drop policy if exists "Training: Semua user dapat membaca bank training" on public.ai_training_data;
drop policy if exists "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat INSERT" on public.ai_training_data;
drop policy if exists "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat UPDATE" on public.ai_training_data;
drop policy if exists "Training: Hanya Admin kakangkasyaf@gmail.com yang dapat DELETE" on public.ai_training_data;

drop policy if exists "Training: user login dapat membaca" on public.ai_training_data;
create policy "Training: user login dapat membaca"
  on public.ai_training_data for select to authenticated
  using (true);

drop policy if exists "Training: hanya admin yang dapat menambah" on public.ai_training_data;
create policy "Training: hanya admin yang dapat menambah"
  on public.ai_training_data for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Training: hanya admin yang dapat mengubah" on public.ai_training_data;
create policy "Training: hanya admin yang dapat mengubah"
  on public.ai_training_data for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Training: hanya admin yang dapat menghapus" on public.ai_training_data;
create policy "Training: hanya admin yang dapat menghapus"
  on public.ai_training_data for delete to authenticated
  using ((select public.is_admin()));

revoke all on table public.ai_training_data from anon;
grant select, insert, update, delete on table public.ai_training_data to authenticated;

commit;

-- Cek hasil (semua tabel harus rowsecurity = true):
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename in ('projects', 'ai_training_data', 'app_admins');
