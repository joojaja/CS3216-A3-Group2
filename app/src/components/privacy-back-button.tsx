"use client";

import { useRouter } from "next/navigation";

export function PrivacyBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="onboarding-secondary mb-8 gap-2 px-4 py-2.5 text-sm font-medium"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-4"
        aria-hidden="true"
      >
        <path d="m12.5 4.5-5.5 5.5 5.5 5.5M7 10h9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to Wearabouts
    </button>
  );
}
