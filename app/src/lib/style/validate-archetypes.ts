// Checks the model's style grouping and turns it into archetypes. The model
// answers with item numbers; everything that reaches the screen is decided
// here: which numbers are real, where duplicates and missed items go, and
// every percentage. Also reads and writes the cached grouping.

import { MAX_ARCHETYPES, closestGroup, signatureOf, type Archetype, type ArchetypeSource, type StyleItem } from "./archetypes.ts";
import { roundedPercents } from "./shares.ts";

export const MAX_NAME_LENGTH = 24;
export const MAX_DESCRIPTION_LENGTH = 120;

export type ModelGroups = { groups: { name: string; description: string; items: number[] }[] };

export type ValidationResult = { ok: true; archetypes: Archetype[] } | { ok: false; reason: string };

const tidy = (text: string) => text.replace(/\s+/g, " ").trim();

// `ordered` must be the item list in the order it was numbered in the prompt
export function validateStyleGroups(answer: ModelGroups, ordered: StyleItem[]): ValidationResult {
  const groups = answer.groups ?? [];
  if (groups.length === 0) return { ok: false, reason: "it had no groups" };
  if (groups.length > MAX_ARCHETYPES) return { ok: false, reason: `it had more than ${MAX_ARCHETYPES} groups` };

  const names = new Set<string>();
  const seen = new Set<number>();
  const built: { name: string; description: string; members: number[] }[] = [];
  for (const group of groups) {
    const name = tidy(group.name ?? "");
    const description = tidy(group.description ?? "");
    if (!name || name.length > MAX_NAME_LENGTH) {
      return { ok: false, reason: `a name was empty or longer than ${MAX_NAME_LENGTH} characters` };
    }
    if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
      return { ok: false, reason: `a description was empty or longer than ${MAX_DESCRIPTION_LENGTH} characters` };
    }
    if (names.has(name.toLowerCase())) return { ok: false, reason: "two groups had the same name" };
    names.add(name.toLowerCase());

    // Invented numbers are dropped; a number used twice stays in its first group
    const members: number[] = [];
    for (const number of group.items ?? []) {
      if (!Number.isInteger(number) || number < 1 || number > ordered.length || seen.has(number)) continue;
      seen.add(number);
      members.push(number - 1);
    }
    built.push({ name, description, members });
  }

  // Items the model left out join the group that shares the most tags
  const signatures = ordered.map(signatureOf);
  ordered.forEach((_, index) => {
    if (seen.has(index + 1)) return;
    const target = closestGroup(
      signatures[index],
      built.map((group) => group.members.map((member) => signatures[member])),
    );
    if (target >= 0) built[target].members.push(index);
  });

  const kept = built.filter((group) => group.members.length > 0);
  if (kept.length === 0) return { ok: false, reason: "no group had a real item number" };

  // Largest first; a stable sort keeps the model's order for ties
  kept.sort((a, b) => b.members.length - a.members.length);
  const percents = roundedPercents(kept.map((group) => group.members.length));
  return {
    ok: true,
    archetypes: kept.map((group, index) => ({
      name: group.name,
      description: group.description,
      itemIds: group.members.map((member) => ordered[member].id),
      percent: percents[index],
    })),
  };
}

// Rule fallbacks are cached too, so a failing model is not called on every
// page view, but only for an hour before the AI is tried again
export const RULES_RETRY_MS = 60 * 60 * 1000;
export const STYLE_CACHE_VERSION = "style_v1";

export type CacheRow = {
  wardrobe_hash: string;
  source: string;
  payload: unknown;
  generated_at: string;
};

export function toCachePayload(archetypes: Archetype[]) {
  return {
    version: STYLE_CACHE_VERSION,
    archetypes: archetypes.map(({ name, description, itemIds }) => ({ name, description, item_ids: itemIds })),
  };
}

// The cached grouping when it still matches the wardrobe, or null. Percentages
// are recomputed from the stored item ids, never read from storage
export function readCachedGrouping(
  row: CacheRow | null | undefined,
  input: { hash: string; itemIds: Set<string>; now: number },
): { archetypes: Archetype[]; source: ArchetypeSource } | null {
  if (!row || row.wardrobe_hash !== input.hash) return null;
  if (row.source !== "ai" && row.source !== "rules") return null;
  if (row.source === "rules" && input.now - Date.parse(row.generated_at) > RULES_RETRY_MS) return null;

  const payload = row.payload as { version?: unknown; archetypes?: unknown } | null;
  if (payload?.version !== STYLE_CACHE_VERSION || !Array.isArray(payload.archetypes)) return null;

  const groups = [];
  for (const entry of payload.archetypes as { name?: unknown; description?: unknown; item_ids?: unknown }[]) {
    if (typeof entry?.name !== "string" || typeof entry.description !== "string" || !Array.isArray(entry.item_ids)) {
      return null;
    }
    const itemIds = entry.item_ids.filter((id): id is string => typeof id === "string" && input.itemIds.has(id));
    if (itemIds.length) groups.push({ name: entry.name, description: entry.description, itemIds });
  }
  if (groups.length === 0) return null;

  const percents = roundedPercents(groups.map((group) => group.itemIds.length));
  return {
    source: row.source,
    archetypes: groups.map((group, index) => ({ ...group, percent: percents[index] })),
  };
}
