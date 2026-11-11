-- Migration v4.0: MotionID Video Motion Training & Dynamic UI Templates
-- Supports training directly from Creator Motion Graphic Videos (TikTok/Reels/MP4)

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Proyek Tanpa Judul',
  aspect_ratio text not null default '9:16',
  scenes jsonb not null default '[]'::jsonb,
  global_settings jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create table if not exists public.ai_training_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('video_motion', 'ui_blueprint', 'hook', 'scene2', 'scene3', 'cta', 'image_asset', 'keyword_rule')),
  category text not null default 'all',
  content_text text not null,
  subtext text,
  emoji text,
  image_url text,
  video_url text,
  creator_handle text,
  motion_profile jsonb default '{
    "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
    "cameraMotion": "spring-slide-y",
    "bpm": 120,
    "widgetType": "saas_step_card",
    "paletteId": "depup-lavender"
  }'::jsonb,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter existing table safely if upgrading from v3
alter table public.ai_training_data drop constraint if exists ai_training_data_type_check;
alter table public.ai_training_data add constraint ai_training_data_type_check
  check (type in ('video_motion', 'ui_blueprint', 'hook', 'scene2', 'scene3', 'cta', 'image_asset', 'keyword_rule'));
alter table public.ai_training_data add column if not exists video_url text;
alter table public.ai_training_data add column if not exists creator_handle text;
alter table public.ai_training_data add column if not exists motion_profile jsonb default '{}'::jsonb;
