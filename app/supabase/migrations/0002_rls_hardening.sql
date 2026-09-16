-- Corrects three problems in the RLS policies created by 0001_init.sql
--
-- 1. catalogue_items used auth.role() = 'authenticated'. That function is
--    deprecated, and it passes for anonymous sign-ins because anonymous users
--    also carry the authenticated Postgres role. Replaced with a TO clause
-- 2. auth.uid() was called once per row. Wrapping it in a subselect lets
--    Postgres evaluate it once per query instead
-- 3. Policies did not name a target role, so they were evaluated for every
--    role including anon. Added TO authenticated
--
-- Apply after 0001_init.sql

-- Per-user tables ----------------------------------------------------------

drop policy if exists "own profile" on public.user_profiles;
create policy "own profile" on public.user_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own wardrobe items" on public.wardrobe_items;
create policy "own wardrobe items" on public.wardrobe_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own outfit requests" on public.outfit_requests;
create policy "own outfit requests" on public.outfit_requests
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own outfit recommendations" on public.outfit_recommendations;
create policy "own outfit recommendations" on public.outfit_recommendations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own feedback" on public.recommendation_feedback;
create policy "own feedback" on public.recommendation_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own purchase evaluations" on public.purchase_evaluations;
create policy "own purchase evaluations" on public.purchase_evaluations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Shared catalogue ---------------------------------------------------------

drop policy if exists "catalogue readable" on public.catalogue_items;
create policy "catalogue readable" on public.catalogue_items
  for select to authenticated
  using (true);

-- Private image storage ----------------------------------------------------
-- No UPDATE policy on purpose. The app writes a fresh UUID filename for every
-- upload and never upserts, so replacing an existing object stays blocked

drop policy if exists "users read own image folder" on storage.objects;
create policy "users read own image folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users write own image folder" on storage.objects;
create policy "users write own image folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users delete own image folder" on storage.objects;
create policy "users delete own image folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wardrobe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Indexes on columns used by the policies above ----------------------------

create index if not exists outfit_requests_user_idx
  on public.outfit_requests (user_id);
create index if not exists recommendation_feedback_user_idx
  on public.recommendation_feedback (user_id);
create index if not exists purchase_evaluations_user_idx
  on public.purchase_evaluations (user_id);
