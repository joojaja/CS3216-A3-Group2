// Browser calls for saving and unsaving an outfit. Shared by the planner,
// the daily feed and the saved outfits page. Each returns whether it worked.

export async function saveOutfit(recommendationId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/saved-outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendation_id: recommendationId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unsaveOutfit(recommendationId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/saved-outfits?recommendation_id=${encodeURIComponent(recommendationId)}`,
      { method: "DELETE" },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function markOutfitWorn(recommendationId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendation_id: recommendationId, action: "wore" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
