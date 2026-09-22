export type StoredOutfitFeedback = {
  recommendation_id: string;
  action: "wore" | "liked" | "rejected" | "dismissed";
  reason: string | null;
  free_text: string | null;
  created_at: string;
};

export type StoredOutfitRecommendation = {
  id: string;
  wardrobe_item_ids: string[];
};

export type FeedbackContext = {
  itemScores: Record<string, number>;
  prompt: string;
};

// A skip in the daily feed is only "not this one right now", so it carries
// no item weight. The daily feed penalises the skipped combination instead.
const ACTION_WEIGHT: Record<StoredOutfitFeedback["action"], number> = {
  wore: 3,
  liked: 2,
  rejected: -3,
  dismissed: 0,
};

// A saved outfit counts the same as a like
const SAVED_WEIGHT = ACTION_WEIGHT.liked;

// Uses only the newest response for each recommendation. A user can submit
// again after a page refresh, and the latest response should replace the old
// signal instead of counting the same outfit several times.
export function buildFeedbackContext(
  feedbackRows: StoredOutfitFeedback[],
  recommendationRows: StoredOutfitRecommendation[],
  savedRecommendationIds: string[] = [],
): FeedbackContext {
  const recommendations = new Map(
    recommendationRows.map((row) => [row.id, row.wardrobe_item_ids]),
  );
  const latest = new Map<string, StoredOutfitFeedback>();
  for (const feedback of feedbackRows) {
    // A skip never replaces a real response to the same outfit
    if (feedback.action === "dismissed") continue;
    if (!latest.has(feedback.recommendation_id)) {
      latest.set(feedback.recommendation_id, feedback);
    }
  }

  const scores = new Map<string, number>();
  const observations: string[] = [];
  for (const feedback of latest.values()) {
    const itemIds = recommendations.get(feedback.recommendation_id);
    if (!itemIds?.length) continue;

    const weight = ACTION_WEIGHT[feedback.action];
    if (!weight) continue;
    for (const itemId of itemIds) {
      scores.set(itemId, (scores.get(itemId) ?? 0) + weight);
    }

    const reason = [feedback.reason, feedback.free_text?.slice(0, 300)]
      .filter(Boolean)
      .join(", ");
    observations.push(
      `- ${feedback.action} outfit containing ${itemIds.join(", ")}${reason ? `; feedback: ${reason}` : ""}`,
    );
  }

  for (const recommendationId of new Set(savedRecommendationIds)) {
    const itemIds = recommendations.get(recommendationId);
    if (!itemIds?.length) continue;
    for (const itemId of itemIds) {
      scores.set(itemId, (scores.get(itemId) ?? 0) + SAVED_WEIGHT);
    }
    observations.push(`- saved outfit containing ${itemIds.join(", ")}`);
  }

  const itemScores = Object.fromEntries(scores);
  if (observations.length === 0) {
    return { itemScores, prompt: "No saved outfit feedback yet." };
  }

  return {
    itemScores,
    prompt: `Recent saved feedback, newest response per outfit:\n${observations.join("\n")}`,
  };
}
