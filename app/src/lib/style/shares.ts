// Whole-number percentages that always add up to 100, using the largest
// remainder method: round every share down, then give the leftover points
// to the shares that lost the most. Plain rounding can show 33% three times.
// Ties go to the earlier count, so callers should pass counts in display order
export function roundedPercents(counts: number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);

  const exact = counts.map((count) => (count / total) * 100);
  const floors = exact.map(Math.floor);
  let leftover = 100 - floors.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (leftover <= 0) break;
    floors[index] += 1;
    leftover -= 1;
  }
  return floors;
}
