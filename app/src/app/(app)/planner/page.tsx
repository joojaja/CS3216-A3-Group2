import type { Metadata } from "next";
import { OutfitPlanner } from "@/components/outfit-planner";

export const metadata: Metadata = { title: "Outfit planner" };

export default function PlannerPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Outfit planner</h1>
      <p className="mt-1 text-sm text-stone-500">
        Describe the occasion. Recommendations are built only from your
        confirmed wardrobe items and the current Singapore forecast.
      </p>
      <div className="mt-6">
        <OutfitPlanner />
      </div>
    </div>
  );
}
