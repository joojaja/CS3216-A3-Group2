-- Initial schema for APP_NAME
-- Apply with: supabase db push, or paste into the Supabase SQL editor

create extension if not exists "pgcrypto";

-- Profiles -----------------------------------------------------------

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Wardrobe -----------------------------------------------------------

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
  ai_confidence jsonb,
  attributes_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wardrobe_items_user_idx on public.wardrobe_items (user_id);

-- Outfits --------------------------------------------------------------

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

create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid not null references public.outfit_recommendations (id) on delete cascade,
  action text not null,
  reason text,
  free_text text,
  created_at timestamptz not null default now()
);

-- Purchase evaluation ----------------------------------------------------

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

-- Curated catalogue --------------------------------------------------------

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

-- Row level security -------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfit_requests enable row level security;
alter table public.outfit_recommendations enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.purchase_evaluations enable row level security;
alter table public.catalogue_items enable row level security;

-- Owner-only policies for per-user tables

create policy "own profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own wardrobe items" on public.wardrobe_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfit requests" on public.outfit_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfit recommendations" on public.outfit_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own feedback" on public.recommendation_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own purchase evaluations" on public.purchase_evaluations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Catalogue is readable by any signed-in user, writable only by service role

create policy "catalogue readable" on public.catalogue_items
  for select using (auth.role() = 'authenticated');

-- Private image storage ----------------------------------------------------
-- One folder per user: wardrobe-images/<user_id>/<file>

insert into storage.buckets (id, name, public)
values ('wardrobe-images', 'wardrobe-images', false)
on conflict (id) do nothing;

create policy "users read own image folder" on storage.objects
  for select using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users write own image folder" on storage.objects
  for insert with check (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own image folder" on storage.objects
  for delete using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
