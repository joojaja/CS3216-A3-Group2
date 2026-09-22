// Only known application destinations can follow authentication.
export function safeAuthDestination(
  value: string | null | undefined,
  fallback = "/onboarding",
) {
  if (!value || /[\\\s]/.test(value)) return fallback;
  return /^\/(onboarding|wardrobe|planner|evaluator|profile|sizing)(\/[^?#]*)?$/.test(
    value,
  )
    ? value
    : fallback;
}
