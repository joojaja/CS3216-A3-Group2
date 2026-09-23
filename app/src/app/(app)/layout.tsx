import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Rail, type RailUser } from "@/components/rail";
import { ToastProvider } from "@/components/toast";
import { AnalysisProvider } from "@/components/analysis-context";
import { PlannerProvider } from "@/components/planner-context";
import { SizingProvider } from "@/components/sizing-context";
import {
  PersistentUploadWorkspace,
  UploadQueueProvider,
} from "@/components/multi-item-uploader";
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
    <ToastProvider>
      <UploadQueueProvider>
        <AnalysisProvider>
          <PlannerProvider>
            <SizingProvider>
              <div className="wearabouts-app grid h-dvh min-h-0 shrink-0 grid-rows-[1fr_auto] overflow-hidden md:grid-cols-[232px_1fr] md:grid-rows-1">
                <a className="app-skip" href="#app-content">Skip to content</a>
                <Rail
                  user={user}
                  weather={forecast ? { short: forecast.short, source: forecast.source } : null}
                />
                <main id="app-content" tabIndex={-1} className="order-first overflow-hidden md:order-none">
                  <div className="h-full overflow-y-auto"><div className="app-mobile-header flex items-center justify-between md:hidden"><Link href="/" aria-label="Wearabouts home" className="app-wordmark flex items-center gap-2 font-semibold"><Image src="/landing/brand-mark.png" alt="" width={36} height={24} /><span className="font-semibold">wear<span>abouts</span></span></Link><Link href="/privacy" className="text-xs text-mute">Privacy</Link></div>{children}<PersistentUploadWorkspace /></div>
                </main>
              </div>
            </SizingProvider>
          </PlannerProvider>
        </AnalysisProvider>
      </UploadQueueProvider>
    </ToastProvider>
  );
}
