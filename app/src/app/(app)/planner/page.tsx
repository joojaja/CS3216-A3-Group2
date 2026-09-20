import type { Metadata } from "next";
import { OutfitPlanner } from "@/components/outfit-planner";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Outfit planner" };

export default function PlannerPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        eyebrow="Planner"
        title="Outfit planner"
        description="Describe the occasion, then adjust the outfits in follow-ups. Everything is built from your confirmed wardrobe items and the current Singapore forecast."
      />
      <OutfitPlanner />
    </div>
  );
}
