import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import "../landing.css";
import "../onboarding/onboarding.css";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function LoginPage() {
  return (
    <main className="drape-public onboarding-page auth-page">
      <section className="auth-editorial">
        <Link href="/">Wearabouts</Link>
        <div>
          <h2>
            Your wardrobe,
            <br />
            <em>remembered.</em>
          </h2>
          <p>
            A little less wondering what to wear. A little more from the clothes
            you already own.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <Suspense fallback={<p>Loading account access...</p>}>
          <AuthForm />
        </Suspense>
      </section>
    </main>
  );
}
