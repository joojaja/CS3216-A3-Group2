import type { Metadata } from "next";
import { OutfitPlanner } from "@/components/outfit-planner";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Outfit planner" };

export default function PlannerPage() {
  return (
    <>
      <PageHeader
        title="Outfit planner"
        description="Describe the occasion. Recommendations are built only from your confirmed wardrobe items and the current Singapore forecast."
      />
      <div className="px-5 py-5 pb-28 md:px-9 md:py-6">
        <OutfitPlanner />
      </div>
    </>
  );
}
