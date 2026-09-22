-- My Style archetypes, 22 September 2026
--
-- Additive. Creates one table and its policy, and never touches existing
-- rows. Safe to run more than once in the Supabase SQL editor. schema.sql
-- carries the same definitions.
--
-- One row per user: the latest style grouping for their wardrobe, keyed by a
-- hash of the tags the model reads. A page view with the same hash reads this
-- row instead of calling the model. Percentages are not stored; the app
-- works them out from item_ids each time.

begin;

create table if not exists public.style_archetypes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  wardrobe_hash text not null,
  -- { version, archetypes: [{ name, description, item_ids }] }
  payload jsonb not null,
  -- 'ai' for a checked model grouping, 'rules' for the fallback, which the
  -- app retries after an hour
  source text not null
    constraint style_archetypes_source_check check (source in ('ai', 'rules')),
  generated_at timestamptz not null default now()
);

alter table public.style_archetypes enable row level security;

revoke all on table public.style_archetypes from anon;
grant select, insert, update, delete on table public.style_archetypes to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'style_archetypes'
      and policyname = 'own style archetypes'
  ) then
    create policy "own style archetypes" on public.style_archetypes
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end
$$;

commit;
