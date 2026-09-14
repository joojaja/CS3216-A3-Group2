import type { Metadata } from "next";
import { PurchaseEvaluator } from "@/components/purchase-evaluator";

export const metadata: Metadata = { title: "Should I buy it?" };

export default function EvaluatorPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Should I buy it?</h1>
      <p className="mt-1 text-sm text-stone-500">
        Upload a product photo or screenshot. We will check it against what you
        already own before you spend.
      </p>
      <div className="mt-6">
        <PurchaseEvaluator />
      </div>
    </div>
  );
}
