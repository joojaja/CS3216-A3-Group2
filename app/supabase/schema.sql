-- Drape database schema
--
-- One file, safe to run more than once. Part 1 removes every table, policy
-- and function this app owns, part 2 recreates them. Running it against a
-- fresh project skips the drops as no-ops. Paste the whole file into the
-- Supabase SQL editor and Run. Photos in storage are left alone, see Part 1
--
-- Folds together what used to be three migrations:
--   0001 initial tables, trigger, storage bucket and policies
--   0002 RLS hardening: TO authenticated, (select auth.uid()), no auth.role()
--   0003 advisor fixes: revoke EXECUTE on the trigger function, FK indexes


-- ============================================================================
-- Part 1. Reset
-- ============================================================================

-- Storage is deliberately not touched here. Supabase blocks SQL deletes on
-- storage tables because they orphan the physical files. To wipe photos,
-- open Storage in the dashboard, select the wardrobe-images bucket, select
-- all objects and delete. The bucket itself is kept and reused below

drop policy if exists "users read own image folder" on storage.objects;
drop policy if exists "users write own image folder" on storage.objects;
drop policy if exists "users delete own image folder" on storage.objects;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- cascade removes policies, indexes and foreign keys with the tables
drop table if exists public.size_chart_flags cascade;
drop table if exists public.measurement_profiles cascade;
drop table if exists public.recommendation_feedback cascade;
drop table if exists public.outfit_recommendations cascade;
drop table if exists public.outfit_requests cascade;
drop table if exists public.purchase_evaluations cascade;
drop table if exists public.wardrobe_items cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.catalogue_items cascade;

-- Optional. Uncomment to also remove every account. Cascades through all
-- per-user rows, and cannot be undone
-- delete from auth.users;


-- ============================================================================
-- Part 2. Create
-- ============================================================================

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------------

create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_styles text[] not null default '{}',
  preferred_colours text[] not null default '{}',
  disliked_colours text[] not null default '{}',
  sizes jsonb not null default '{}',
  common_occasions text[] not null default '{}',
  preference_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Creates an empty profile row the moment an account is created. Runs as
-- the table owner through the trigger mechanism, so it needs no EXECUTE
-- grant, and Postgres refuses to call trigger functions directly anyway
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that already exist predate the trigger, so give them a row too
insert into public.user_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Wardrobe -------------------------------------------------------------------

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  category text not null,
  subcategory text,
  primary_colour text,
  secondary_colours text[] not null default '{}',
  pattern text,
  material_cues text,
  formality text,
  layering_role text,
  weather_tags text[] not null default '{}',
  user_notes text,
  -- { notes: string, uncertain_fields: string[] } as returned by the model
  ai_confidence jsonb,
  attributes_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wardrobe_items_user_idx on public.wardrobe_items (user_id);

-- Outfits --------------------------------------------------------------------

create table public.outfit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occasion_text text not null,
  occasion_type text,
  formality text,
  indoor_outdoor text,
  requested_date date,
  weather_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index outfit_requests_user_idx on public.outfit_requests (user_id);

create table public.outfit_recommendations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.outfit_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  wardrobe_item_ids uuid[] not null,
  explanation text,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index outfit_recommendations_user_idx on public.outfit_recommendations (user_id);
create index outfit_recommendations_request_idx on public.outfit_recommendations (request_id);

create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid not null references public.outfit_recommendations (id) on delete cascade,
  action text not null,
  reason text,
  free_text text,
  created_at timestamptz not null default now()
);

create index recommendation_feedback_user_idx on public.recommendation_feedback (user_id);
create index recommendation_feedback_recommendation_idx on public.recommendation_feedback (recommendation_id);

-- Purchase evaluation --------------------------------------------------------

create table public.purchase_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text,
  extracted_attributes jsonb,
  similar_wardrobe_item_ids uuid[] not null default '{}',
  compatibility_score numeric,
  redundancy_score numeric,
  decision_label text,
  explanation text,
  created_at timestamptz not null default now()
);

create index purchase_evaluations_user_idx on public.purchase_evaluations (user_id);

-- Measurements and sizing ----------------------------------------------------
-- Body measurements live in their own table so they never ride along with
-- user_profiles, which the outfit planner sends to the model. Values are
-- always cm; unit is only the display preference. Null means skipped. The
-- checks are wide backstops, the friendly limits live in app code
-- (src/lib/sizing/measurements.ts)

create table public.measurement_profiles (
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

-- "Wrong chart?" reports. Holds the chart and brand only, never measurements
create table public.size_chart_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chart_key text not null,
  brand text not null,
  category text not null,
  source_type text not null check (source_type in ('product', 'stored', 'web')),
  reason text check (reason in ('wrong_brand', 'wrong_product', 'wrong_numbers', 'other')),
  created_at timestamptz not null default now()
);

create index size_chart_flags_user_idx on public.size_chart_flags (user_id);

-- Curated catalogue ----------------------------------------------------------

create table public.catalogue_items (
  id uuid primary key default gen_random_uuid(),
  retailer text not null,
  product_name text not null,
  product_url text,
  image_url text,
  price numeric,
  category text,
  colour text,
  style_tags text[] not null default '{}',
  weather_tags text[] not null default '{}',
  last_verified_at timestamptz
);

-- Row level security ---------------------------------------------------------
--
-- Every policy names TO authenticated so anon never matches, and wraps
-- auth.uid() in a subselect so Postgres evaluates it once per query rather
-- than once per row

alter table public.user_profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfit_requests enable row level security;
alter table public.outfit_recommendations enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.purchase_evaluations enable row level security;
alter table public.catalogue_items enable row level security;
alter table public.measurement_profiles enable row level security;
alter table public.size_chart_flags enable row level security;

create policy "own profile" on public.user_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own wardrobe items" on public.wardrobe_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own outfit requests" on public.outfit_requests
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own outfit recommendations" on public.outfit_recommendations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own feedback" on public.recommendation_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own purchase evaluations" on public.purchase_evaluations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own measurements" on public.measurement_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Users can file and read their own flags, but not edit or remove them
create policy "own size chart flags read" on public.size_chart_flags
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "own size chart flags insert" on public.size_chart_flags
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Catalogue is readable by any signed-in user, writable only by service role
create policy "catalogue readable" on public.catalogue_items
  for select to authenticated
  using (true);

-- Private image storage ------------------------------------------------------
-- One folder per user: wardrobe-images/<user_id>/<file>
-- No UPDATE policy on purpose. Every upload gets a fresh UUID filename and
-- the app never upserts, so replacing an existing object stays blocked

insert into storage.buckets (id, name, public)
values ('wardrobe-images', 'wardrobe-images', false)
on conflict (id) do nothing;

create policy "users read own image folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users write own image folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete own image folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
