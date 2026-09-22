// The daily feed runs on Singapore days. Servers run in UTC, which would
// roll the day over at 8 am local time. Singapore has no daylight saving, so
// a fixed +8 hour offset is exact.

const OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// YYYY-MM-DD in Singapore for the given moment
export function singaporeDate(now: Date = new Date()): string {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

// The next midnight in Singapore after the given moment, as an ISO string
export function nextSingaporeMidnight(now: Date = new Date()): string {
  const local = now.getTime() + OFFSET_MS;
  const nextLocalMidnight = Math.floor(local / DAY_MS) * DAY_MS + DAY_MS;
  return new Date(nextLocalMidnight - OFFSET_MS).toISOString();
}

// Singapore date n days before the given date string
export function singaporeDaysAgo(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
}
