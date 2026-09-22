-- Daily outfits, 22 September 2026
--
-- Additive apart from two constraint and policy replacements, both of which
-- only widen what is allowed. Never deletes rows. Safe to run more than once
-- in the Supabase SQL editor. Run 20260922_saved_outfits.sql first.
-- schema.sql carries the same definitions.
--
-- 1. daily_outfit_batches: one row per user per Singapore day
-- 2. outfit_recommendations can now belong to a daily batch instead of a
--    planner request, so feedback and saves work the same for both
-- 3. recommendation_feedback accepts a new 'dismissed' action (a skip)

begin;

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
