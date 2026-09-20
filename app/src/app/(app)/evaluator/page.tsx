import type { Metadata } from "next";
import { PurchaseEvaluator } from "@/components/purchase-evaluator";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Should I buy it?" };

export default function EvaluatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Purchase check"
        title="Should I buy it?"
        description="Upload a product photo or screenshot. We will check it against what you already own before you spend."
      />
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <PurchaseEvaluator />
      </div>
    </>
  );
}
