-- Add the optional profile gender without deleting or rewriting existing rows.
-- Safe to run more than once in the Supabase SQL editor.

begin;

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

alter table public.user_profiles
  validate constraint user_profiles_gender_check;

commit;
