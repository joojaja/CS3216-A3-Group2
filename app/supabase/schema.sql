-- Wearabouts additive database schema
--
-- This file only creates or updates application objects. It never removes a
-- table or deletes existing rows. It is safe to run against the team project
-- after reviewing the statements in the Supabase SQL editor.

begin;

create extension if not exists "pgcrypto";

-- Profiles -------------------------------------------------------------------

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  gender text constraint user_profiles_gender_check
    check (gender in ('male', 'female', 'others')),
  preferred_styles text[] not null default '{}',
  preferred_colours text[] not null default '{}',
  disliked_colours text[] not null default '{}',
  sizes jsonb not null default '{}',
  common_occasions text[] not null default '{}',
  preference_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_gender_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_gender_check
      check (gender in ('male', 'female', 'others'))
      not valid;
  end if;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end
$$;

insert into public.user_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Wardrobe -------------------------------------------------------------------

create table if not exists public.wardrobe_items (
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

create index if not exists wardrobe_items_user_idx
  on public.wardrobe_items (user_id);

-- Outfits --------------------------------------------------------------------

create table if not exists public.outfit_requests (
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

create index if not exists outfit_requests_user_idx
  on public.outfit_requests (user_id);

create table if not exists public.outfit_recommendations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.outfit_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  wardrobe_item_ids uuid[] not null,
  explanation text,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists outfit_recommendations_user_idx
  on public.outfit_recommendations (user_id);
create index if not exists outfit_recommendations_request_idx
  on public.outfit_recommendations (request_id);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid not null references public.outfit_recommendations (id) on delete cascade,
  action text not null,
  reason text,
  free_text text,
  created_at timestamptz not null default now(),
  constraint recommendation_feedback_action_check
    check (action in ('wore', 'liked', 'rejected')),
  constraint recommendation_feedback_reason_check
    check (
      reason is null or reason in (
        'too_warm',
        'too_formal',
        'too_casual',
        'uncomfortable',
        'disliked_colour_combination',
        'other'
      )
    )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recommendation_feedback_action_check'
      and conrelid = 'public.recommendation_feedback'::regclass
  ) then
    alter table public.recommendation_feedback
      add constraint recommendation_feedback_action_check
      check (action in ('wore', 'liked', 'rejected')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recommendation_feedback_reason_check'
      and conrelid = 'public.recommendation_feedback'::regclass
  ) then
    alter table public.recommendation_feedback
      add constraint recommendation_feedback_reason_check
      check (
        reason is null or reason in (
          'too_warm',
          'too_formal',
          'too_casual',
          'uncomfortable',
          'disliked_colour_combination',
          'other'
        )
      ) not valid;
  end if;
end
$$;

create index if not exists recommendation_feedback_user_idx
  on public.recommendation_feedback (user_id);
create index if not exists recommendation_feedback_recommendation_idx
  on public.recommendation_feedback (recommendation_id);

-- Saved outfits. Points at a recommendation from the planner or the daily
-- feed and reads its items, explanation and source from there
create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid not null
    references public.outfit_recommendations (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_outfits_user_recommendation_key unique (user_id, recommendation_id)
);

create index if not exists saved_outfits_recommendation_idx
  on public.saved_outfits (recommendation_id);

-- Purchase evaluation --------------------------------------------------------

create table if not exists public.purchase_evaluations (
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

create index if not exists purchase_evaluations_user_idx
  on public.purchase_evaluations (user_id);

-- Measurements and sizing ----------------------------------------------------

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

create index if not exists size_chart_flags_user_idx
  on public.size_chart_flags (user_id);

-- Explore feed ---------------------------------------------------------------

create table if not exists public.explore_feed_cache (
  user_id uuid primary key references auth.users (id) on delete cascade,
  wardrobe_item_ids uuid[] not null,
  recommendations jsonb not null,
  created_at timestamptz not null default now()
);

-- Curated catalogue ----------------------------------------------------------

create table if not exists public.catalogue_items (
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

-- Row level security and Data API grants ------------------------------------

alter table public.user_profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfit_requests enable row level security;
alter table public.outfit_recommendations enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.purchase_evaluations enable row level security;
alter table public.measurement_profiles enable row level security;
alter table public.size_chart_flags enable row level security;
alter table public.explore_feed_cache enable row level security;
alter table public.catalogue_items enable row level security;
alter table public.saved_outfits enable row level security;

grant usage on schema public to authenticated;

revoke all on table public.user_profiles from anon;
revoke all on table public.wardrobe_items from anon;
revoke all on table public.outfit_requests from anon;
revoke all on table public.outfit_recommendations from anon;
revoke all on table public.recommendation_feedback from anon;
revoke all on table public.purchase_evaluations from anon;
revoke all on table public.measurement_profiles from anon;
revoke all on table public.size_chart_flags from anon;
revoke all on table public.explore_feed_cache from anon;
revoke all on table public.catalogue_items from anon;
revoke all on table public.saved_outfits from anon;

grant select, insert, update, delete on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;
grant select, insert, update, delete on table public.outfit_requests to authenticated;
grant select, insert, update, delete on table public.outfit_recommendations to authenticated;
grant select, insert, update, delete on table public.recommendation_feedback to authenticated;
grant select, insert, update, delete on table public.purchase_evaluations to authenticated;
grant select, insert, update, delete on table public.measurement_profiles to authenticated;
grant select, insert on table public.size_chart_flags to authenticated;
grant select, insert, update, delete on table public.explore_feed_cache to authenticated;
grant select on table public.catalogue_items to authenticated;
grant select, insert, delete on table public.saved_outfits to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles'
      and policyname = 'own profile'
  ) then
    create policy "own profile" on public.user_profiles
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wardrobe_items'
      and policyname = 'own wardrobe items'
  ) then
    create policy "own wardrobe items" on public.wardrobe_items
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'outfit_requests'
      and policyname = 'own outfit requests'
  ) then
    create policy "own outfit requests" on public.outfit_requests
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'outfit_recommendations'
      and policyname = 'own outfit recommendations'
  ) then
    create policy "own outfit recommendations" on public.outfit_recommendations
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.outfit_requests outfit_request
          where outfit_request.id = public.outfit_recommendations.request_id
            and outfit_request.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'recommendation_feedback'
      and policyname = 'own feedback'
  ) then
    create policy "own feedback" on public.recommendation_feedback
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.outfit_recommendations outfit_recommendation
          where outfit_recommendation.id = public.recommendation_feedback.recommendation_id
            and outfit_recommendation.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'purchase_evaluations'
      and policyname = 'own purchase evaluations'
  ) then
    create policy "own purchase evaluations" on public.purchase_evaluations
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'measurement_profiles'
      and policyname = 'own measurements'
  ) then
    create policy "own measurements" on public.measurement_profiles
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'explore_feed_cache'
      and policyname = 'own explore feed'
  ) then
    create policy "own explore feed" on public.explore_feed_cache
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'size_chart_flags'
      and policyname = 'own size chart flags read'
  ) then
    create policy "own size chart flags read" on public.size_chart_flags
      for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'size_chart_flags'
      and policyname = 'own size chart flags insert'
  ) then
    create policy "own size chart flags insert" on public.size_chart_flags
      for insert to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'catalogue_items'
      and policyname = 'catalogue readable'
  ) then
    create policy "catalogue readable" on public.catalogue_items
      for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_outfits'
      and policyname = 'own saved outfits'
  ) then
    create policy "own saved outfits" on public.saved_outfits
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.outfit_recommendations outfit_recommendation
          where outfit_recommendation.id = public.saved_outfits.recommendation_id
            and outfit_recommendation.user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

-- If the policies already existed, tighten the two child-table checks without
-- replacing the policies or touching their rows.
alter policy "own outfit recommendations" on public.outfit_recommendations
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.outfit_requests outfit_request
      where outfit_request.id = public.outfit_recommendations.request_id
        and outfit_request.user_id = (select auth.uid())
    )
  );

alter policy "own feedback" on public.recommendation_feedback
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.outfit_recommendations outfit_recommendation
      where outfit_recommendation.id = public.recommendation_feedback.recommendation_id
        and outfit_recommendation.user_id = (select auth.uid())
    )
  );

-- Private wardrobe image storage --------------------------------------------

insert into storage.buckets (id, name, public)
values ('wardrobe-images', 'wardrobe-images', false)
on conflict (id) do update set public = false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'users read own image folder'
  ) then
    create policy "users read own image folder" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'wardrobe-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'users write own image folder'
  ) then
    create policy "users write own image folder" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'wardrobe-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'users delete own image folder'
  ) then
    create policy "users delete own image folder" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'wardrobe-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;
end
$$;

-- Daily outfits -------------------------------------------------------------
-- Mirrors supabase/migrations/20260922_daily_outfits.sql. Kept at the end so
-- it replaces the outfit policy and feedback action check defined above.

create table if not exists public.daily_outfit_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Calendar date in Singapore, not UTC
  feed_date date not null,
  -- The SingaporeForecast used, or null when NEA was unreachable
  weather_snapshot jsonb,
  generator text not null default 'rules'
    constraint daily_outfit_batches_generator_check
    check (generator in ('rules', 'rules_llm')),
  created_at timestamptz not null default now(),
  constraint daily_outfit_batches_user_date_key unique (user_id, feed_date)
);

alter table public.outfit_recommendations
  add column if not exists source text not null default 'planner';
alter table public.outfit_recommendations
  add column if not exists daily_batch_id uuid
    references public.daily_outfit_batches (id) on delete cascade;
alter table public.outfit_recommendations
  add column if not exists position smallint;
alter table public.outfit_recommendations
  alter column request_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'outfit_recommendations_source_check'
      and conrelid = 'public.outfit_recommendations'::regclass
  ) then
    alter table public.outfit_recommendations
      add constraint outfit_recommendations_source_check
      check (source in ('planner', 'daily'));
  end if;

  -- Every outfit belongs to exactly one planner request or one daily batch
  if not exists (
    select 1 from pg_constraint
    where conname = 'outfit_recommendations_origin_check'
      and conrelid = 'public.outfit_recommendations'::regclass
  ) then
    alter table public.outfit_recommendations
      add constraint outfit_recommendations_origin_check
      check (num_nonnulls(request_id, daily_batch_id) = 1);
  end if;
end
$$;

create index if not exists outfit_recommendations_daily_batch_idx
  on public.outfit_recommendations (daily_batch_id);
create index if not exists outfit_recommendations_user_created_idx
  on public.outfit_recommendations (user_id, created_at);

-- Allow the skip action from the daily feed
alter table public.recommendation_feedback
  drop constraint if exists recommendation_feedback_action_check;
alter table public.recommendation_feedback
  add constraint recommendation_feedback_action_check
  check (action in ('wore', 'liked', 'rejected', 'dismissed'));

alter table public.daily_outfit_batches enable row level security;

revoke all on table public.daily_outfit_batches from anon;
grant select, insert on table public.daily_outfit_batches to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'daily_outfit_batches'
      and policyname = 'own daily outfit batches'
  ) then
    create policy "own daily outfit batches" on public.daily_outfit_batches
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end
$$;

-- A recommendation must hang off the user's own request or daily batch
alter policy "own outfit recommendations" on public.outfit_recommendations
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      exists (
        select 1 from public.outfit_requests outfit_request
        where outfit_request.id = public.outfit_recommendations.request_id
          and outfit_request.user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.daily_outfit_batches daily_batch
        where daily_batch.id = public.outfit_recommendations.daily_batch_id
          and daily_batch.user_id = (select auth.uid())
      )
    )
  );

commit;
