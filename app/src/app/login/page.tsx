import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Welcome to APP_NAME
      </h1>
      <Suspense>
        <AuthForm />
      </Suspense>
    </main>
  );
}
