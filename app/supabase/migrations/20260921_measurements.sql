-- Additive migration for measurements and sizing, 21 September 2026
--
-- schema.sql drops and recreates every table, so do not rerun it on the team
-- project. Run this file once in the Supabase SQL editor instead. It only
-- creates the two new tables and their policies, and is safe to run twice.
-- schema.sql carries the same definitions for fresh projects.

create table if not exists public.measurement_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unit text not null default 'cm' check (unit in ('cm', 'in')),
  size_range text check (size_range in ('mens', 'womens')),
  fit_preference text not null default 'regular'
    check (fit_preference in ('snug', 'regular', 'relaxed')),
  height_cm numeric(5,1) check (height_cm between 50 and 250),
  chest_cm numeric(5,1) check (chest_cm between 30 and 200),
  waist_cm numeric(5,1) check (waist_cm between 30 and 200),
  hips_cm numeric(5,1) check (hips_cm between 30 and 220),
  inseam_cm numeric(5,1) check (inseam_cm between 30 and 120),
  foot_length_cm numeric(4,1) check (foot_length_cm between 10 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.size_chart_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chart_key text not null,
  brand text not null,
  category text not null,
  source_type text not null check (source_type in ('product', 'stored', 'web')),
  reason text check (reason in ('wrong_brand', 'wrong_product', 'wrong_numbers', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists size_chart_flags_user_idx on public.size_chart_flags (user_id);

alter table public.measurement_profiles enable row level security;
alter table public.size_chart_flags enable row level security;

drop policy if exists "own measurements" on public.measurement_profiles;
create policy "own measurements" on public.measurement_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own size chart flags read" on public.size_chart_flags;
create policy "own size chart flags read" on public.size_chart_flags
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "own size chart flags insert" on public.size_chart_flags;
create policy "own size chart flags insert" on public.size_chart_flags
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
