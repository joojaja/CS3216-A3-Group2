---
name: add-supabase-migration
description: Add a new table, column, or policy to the Wearabouts Supabase schema. Use when a feature needs a database change, before writing SQL directly against app/supabase/schema.sql or a new file in app/supabase/migrations/.
---

# Adding a Supabase migration

Wearabouts has no ORM and no schema-migration tool. `app/supabase/schema.sql` is the whole schema in one file, and `app/supabase/migrations/` holds the dated history of additive changes. Follow the pattern already established there; do not introduce a different one.

## Rules

1. **Every change is additive.** Never write `drop table`, `drop column`, or a bare `delete from`. Use `create table if not exists`, `alter table ... add column if not exists`, and `on conflict ... do nothing` for backfills. `app/supabase/schema.sql` says so explicitly in its own header comment, and the whole point is that it stays safe to re-run against the team's real project.
2. **Write both files.** Add the new SQL to a new file in `app/supabase/migrations/`, named `YYYYMMDD_short_description.sql` (see `20260921_measurements.sql`, `20260922_daily_outfits.sql`, `20260922_saved_outfits.sql`, `20260922_style_archetypes.sql`, `20260923_account_entitlements.sql` for the pattern), and also fold the same `create table if not exists` / `alter table` statements into `app/supabase/schema.sql` so a brand-new project gets the same result from that one file. Keep the migration file's own header comment explaining what it adds and that it is additive.
3. **Enable row-level security and add owner policies on every new table**, in the same migration:

   ```sql
   alter table public.your_table enable row level security;

   do $$
   begin
     if not exists (
       select 1 from pg_policies
       where schemaname = 'public' and tablename = 'your_table'
         and policyname = 'own your_table read'
     ) then
       create policy "own your_table read" on public.your_table
         for select
         using ((select auth.uid()) = user_id);
     end if;
   end $$;
   ```

   Repeat for insert/update/delete as needed, always scoped to `(select auth.uid()) = user_id`. Never add a table that skips RLS or relies on the application layer alone to enforce ownership; `AGENTS.md`'s security section requires ownership enforcement at the database, not just the interface.
4. **Stamp `user_id` from the session, not from client input**, in every server action or route that writes to the new table.
5. **Private image storage follows the existing `wardrobe-images` bucket pattern**: a private bucket, plus `storage.objects` policies scoped to a path prefix that encodes the owning user's id (see the `users read/write/delete own image folder` policies in `app/supabase/schema.sql`). Reuse that shape for any new private file type rather than inventing a new bucket policy style.
6. **Update `app/src/lib/types.ts`** (and any Zod schema in `app/src/lib/schemas/`) to match the new columns, since nothing here uses a code generator to keep types and schema in sync automatically.
7. Note the new migration in whatever plan or evidence doc covers the feature (see the `write-milestone` skill), so `docs/assignment-evidence.md` stays accurate.

## Before running it against the team project

Run the SQL against a scratch Supabase project first if the change is non-trivial. Because every statement is additive and idempotent, re-running the full `schema.sql` is a normal way to bring an existing project up to date; it does not need to be run statement by statement.
