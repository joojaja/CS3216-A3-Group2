import type { Metadata } from "next";
import { MotionConfig } from "motion/react";
import { Rail, type RailUser } from "@/components/rail";
import { ToastProvider } from "@/components/toast";
import { AnalysisProvider } from "@/components/analysis-context";
import { PlannerProvider } from "@/components/planner-context";
import { createClient } from "@/lib/supabase/server";
import { getSingaporeForecast } from "@/lib/weather";

export const metadata: Metadata = { robots: { index: false, follow: false }, alternates: { canonical: null } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [forecast, userResult] = await Promise.all([
    getSingaporeForecast(),
    supabase?.auth.getUser() ?? Promise.resolve(null),
  ]);

  const authUser = userResult?.data.user ?? null;
  let user: RailUser = null;

  if (authUser && supabase) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", authUser.id)
      .maybeSingle();
    user = {
      name: profile?.display_name || authUser.email?.split("@")[0] || "You",
      email: authUser.email ?? "",
    };
  }

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AnalysisProvider>
          <PlannerProvider>
            <div className="app-shell grid h-dvh grid-rows-[1fr_auto] md:grid-cols-[232px_1fr] md:grid-rows-1">
              <Rail
                user={user}
                weather={forecast ? { short: forecast.short, source: forecast.source } : null}
              />
              <main className="order-first overflow-hidden md:order-none">
                <div className="h-full overflow-y-auto">{children}</div>
              </main>
            </div>
          </PlannerProvider>
        </AnalysisProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
