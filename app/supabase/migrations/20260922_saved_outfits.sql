-- Saved outfits, 22 September 2026
--
-- Additive. Creates one table and its policy, and never touches existing
-- rows. Safe to run more than once in the Supabase SQL editor. schema.sql
-- carries the same definitions.
--
-- A saved outfit points at an outfit_recommendations row, from the planner
-- or the daily feed, and reads its items, explanation and source from there.

begin;

create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid not null
    references public.outfit_recommendations (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Saving the same outfit twice does nothing. Also serves lookups by user
  constraint saved_outfits_user_recommendation_key unique (user_id, recommendation_id)
);

create index if not exists saved_outfits_recommendation_idx
  on public.saved_outfits (recommendation_id);

alter table public.saved_outfits enable row level security;

revoke all on table public.saved_outfits from anon;
grant select, insert, delete on table public.saved_outfits to authenticated;

do $$
begin
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

commit;
