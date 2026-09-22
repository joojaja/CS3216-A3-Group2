// The wear streak: consecutive Singapore days on which the user marked an
// outfit as worn, from the daily feed, the planner or saved outfits. It
// counts wearing what you own, not opening the app (plan open question 4).
// Today only adds to the streak once something is worn; until then the
// streak still stands from yesterday, so it does not reset at midnight.

import { singaporeDate, singaporeDaysAgo } from "./sg-day.ts";

export type WearStreak = { days: number; wornToday: boolean };

export function wearStreak(wornAt: string[], today: string): WearStreak {
  const days = new Set(wornAt.map((iso) => singaporeDate(new Date(iso))));
  const wornToday = days.has(today);

  let count = 0;
  let cursor = wornToday ? today : singaporeDaysAgo(today, 1);
  while (days.has(cursor)) {
    count += 1;
    cursor = singaporeDaysAgo(cursor, 1);
  }
  return { days: count, wornToday };
}
