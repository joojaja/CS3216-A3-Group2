import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <>
      <PageHeader
        title="Add to wardrobe"
        action={
          <Link
            href="/wardrobe"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-cobalt hover:text-cobalt"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to wardrobe
          </Link>
        }
      />
    </>
  );
}
