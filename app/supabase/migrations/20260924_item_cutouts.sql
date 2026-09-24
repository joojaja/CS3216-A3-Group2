-- Item cut-outs, 24 September 2026
--
-- Additive. Adds one nullable column and never touches existing rows. Safe
-- to run more than once in the Supabase SQL editor. schema.sql carries the
-- same definition.
--
-- cutout_path points at a transparent PNG of the garment alone, made in the
-- browser from the user's own photo, stored in the wardrobe-images bucket
-- under the owner's folder. Outfit cards draw it straight onto the card.
-- The existing wardrobe_items policies and storage folder policies cover it.

begin;

alter table public.wardrobe_items
  add column if not exists cutout_path text;

commit;
