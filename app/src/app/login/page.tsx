import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid flex-1 grid-rows-[auto_1fr] sm:grid-cols-2 sm:grid-rows-1">
      <section className="flex flex-col justify-between gap-4 bg-cobalt p-5 text-white sm:p-11">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Drape
        </Link>
        <div>
          <h2 className="max-w-[14ch] text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Your wardrobe, remembered.
          </h2>
          <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-cobalt-light sm:text-base">
            Sign in to see your items, plan an outfit for today&apos;s forecast,
            or check something before you buy it.
          </p>
        </div>
      </section>
      <section className="flex items-start justify-center p-5 sm:items-center sm:p-10">
        <Suspense>
          <AuthForm />
        </Suspense>
      </section>
    </main>
  );
}
