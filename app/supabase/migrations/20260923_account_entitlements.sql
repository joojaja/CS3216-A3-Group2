-- Account tiers and Beautify credits, 23 September 2026
--
-- Additive migration. It does not remove tables or rows and is safe to run
-- more than once in the Supabase SQL editor. schema.sql carries the same
-- definitions.

begin;

create table if not exists public.account_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  account_tier text not null default 'free'
    constraint account_entitlements_tier_check
    check (account_tier in ('free', 'premium')),
  beautify_credits_remaining integer not null default 5
    constraint account_entitlements_beautify_credits_check
    check (beautify_credits_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.account_entitlements (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Keep the existing profile creation in the same auth trigger and add the
-- entitlement row for every account created after this migration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.account_entitlements (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.account_entitlements enable row level security;

revoke all on table public.account_entitlements from anon, authenticated;
grant select on table public.account_entitlements to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'account_entitlements'
      and policyname = 'own account entitlement read'
  ) then
    create policy "own account entitlement read" on public.account_entitlements
      for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

-- Atomically checks and consumes one credit. The caller cannot choose a user
-- id, so this function can only affect the signed-in account. Premium rows do
-- not decrement. Direct updates remain unavailable to authenticated clients.
create or replace function public.consume_beautify_credit()
returns table (
  allowed boolean,
  account_tier text,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  saved_tier text;
  saved_remaining integer;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.account_entitlements (user_id)
  values (caller_id)
  on conflict (user_id) do nothing;

  update public.account_entitlements as entitlement
  set
    beautify_credits_remaining = case
      when entitlement.account_tier = 'premium'
        then entitlement.beautify_credits_remaining
      else entitlement.beautify_credits_remaining - 1
    end,
    updated_at = now()
  where entitlement.user_id = caller_id
    and (
      entitlement.account_tier = 'premium'
      or entitlement.beautify_credits_remaining > 0
    )
  returning
    entitlement.account_tier,
    entitlement.beautify_credits_remaining
  into saved_tier, saved_remaining;

  if found then
    return query select true, saved_tier, saved_remaining;
    return;
  end if;

  select entitlement.account_tier, entitlement.beautify_credits_remaining
  into saved_tier, saved_remaining
  from public.account_entitlements as entitlement
  where entitlement.user_id = caller_id;

  return query select false, saved_tier, saved_remaining;
end;
$$;

revoke execute on function public.consume_beautify_credit() from public, anon;
grant execute on function public.consume_beautify_credit() to authenticated;

commit;
