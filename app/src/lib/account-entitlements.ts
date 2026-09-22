export const FREE_BEAUTIFY_CREDITS = 5;

export const BEAUTIFY_LIMIT_MESSAGE =
  "You have used all 5 free Beautify edits. Upgrade to Premium for more Beautify edits.";
export const EXPLORE_REFRESH_LIMIT_MESSAGE =
  "Refreshing Explore is a Premium feature. Upgrade to Premium for new recommendations.";
export const OUTFIT_CREDIT_LIMIT_MESSAGE =
  "The free-tier outfit planner has run out of AI credits. Upgrade to Premium for uninterrupted outfit planning.";

export type AccountTier = "free" | "premium";

export type AccountEntitlement = {
  accountTier: AccountTier;
  beautifyCreditsRemaining: number;
};

export function readAccountEntitlement(value: unknown): AccountEntitlement {
  const row = value as {
    account_tier?: unknown;
    beautify_credits_remaining?: unknown;
  } | null;
  const accountTier = row?.account_tier === "premium" ? "premium" : "free";
  const rawCredits = row?.beautify_credits_remaining;
  const beautifyCreditsRemaining =
    typeof rawCredits === "number" && Number.isInteger(rawCredits) && rawCredits >= 0
      ? rawCredits
      : FREE_BEAUTIFY_CREDITS;
  return { accountTier, beautifyCreditsRemaining };
}
