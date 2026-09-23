import type { DECISION_LABELS } from "@/lib/schemas/ai";

export type DecisionLabel = (typeof DECISION_LABELS)[number];

export type DecisionFloorEvidence = {
  // Owned items in the same functional category as the prospective purchase
  sameCategoryCount: number;
  // Owned items that match on both category and colour, the route's
  // definition of a strong match (see `similarity` in the evaluate route)
  stronglySimilarCount: number;
};

// The model explains the evidence the route hands it, but the label itself
// must not contradict facts the route already knows. This is the
// deterministic floor described in the purchase evaluation workflow: the
// redundancy decision should not come solely from an unconstrained prompt.
//
// - Nothing owned in the category at all: the model cannot call the
//   purchase "likely_redundant", since there is nothing for it to duplicate.
// - At least one owned item already matches on category and colour: the
//   model cannot call the purchase a wardrobe gap. Two or more such matches
//   downgrade straight to "likely_redundant"; exactly one downgrades to
//   "potentially_useful", since a single close match does not yet prove the
//   purchase adds nothing.
export function applyDecisionLabelFloor(
  label: DecisionLabel,
  evidence: DecisionFloorEvidence,
): DecisionLabel {
  const { sameCategoryCount, stronglySimilarCount } = evidence;

  if (sameCategoryCount === 0 && label === "likely_redundant") {
    return "fills_wardrobe_gap";
  }

  if (stronglySimilarCount > 0 && label === "fills_wardrobe_gap") {
    return stronglySimilarCount > 1 ? "likely_redundant" : "potentially_useful";
  }

  return label;
}

type ComparableItem = {
  category: string;
  primary_colour: string | null;
  secondary_colours: string[];
};

// Scores how closely an owned item matches the prospective purchase.
// Category is worth 0.6, a matching primary colour 0.3, and a primary colour
// that only appears among the owned item's secondary colours 0.15.
export function purchaseSimilarity(
  attrs: { category: string; primary_colour: string },
  item: ComparableItem,
): number {
  let score = 0;
  if (item.category === attrs.category) score += 0.6;
  const colour = attrs.primary_colour.toLowerCase();
  if (item.primary_colour?.toLowerCase() === colour) {
    score += 0.3;
  } else if (item.secondary_colours.map((c) => c.toLowerCase()).includes(colour)) {
    score += 0.15;
  }
  return score;
}

// A strong match is same category and same primary colour. 0.6 + 0.3 is
// 0.8999999999999999 in floating point, so the cut-off sits below 0.9 on
// purpose. Category plus a secondary colour (0.75) stays below it.
export const STRONG_MATCH_THRESHOLD = 0.85;
