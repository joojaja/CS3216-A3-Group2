import type { Metadata } from "next";
import { DailyFeedView } from "@/components/daily-feed";

export const metadata: Metadata = { title: "Today's outfits" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const parsed = Number.parseInt(start ?? "", 10);
  return <DailyFeedView start={Number.isInteger(parsed) ? parsed : null} />;
}
