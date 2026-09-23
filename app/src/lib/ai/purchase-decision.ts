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
