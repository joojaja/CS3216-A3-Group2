import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { SizingFlow } from "@/components/sizing-flow";
import { MEASUREMENT_COLUMNS, rowToProfile, type MeasurementRow } from "@/lib/sizing/row";

export const metadata: Metadata = { title: "Find my size" };
export const dynamic = "force-dynamic";

export default async function SizingPage() {
  const supabase = await createClient();

  const header = (
    <PageHeader
      title="Find my size"
      description="Tell us what you are buying and we match it to the brand's size chart using your measurements."
      action={
        <Link href="/profile/measurements" className="text-sm font-medium text-cobalt hover:underline">
          Your measurements
        </Link>
      }
    />
  );

  let profile = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("measurement_profiles")
      .select(MEASUREMENT_COLUMNS)
      .eq("user_id", user?.id)
      .maybeSingle<MeasurementRow>();
    profile = rowToProfile(data ?? null);
  }

  return (
    <>
      {header}
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        {!supabase && (
          <div className="mb-5">
            <SetupNotice />
          </div>
        )}
        <div className="max-w-2xl">
          <SizingFlow initialProfile={profile} configured={!!supabase} />
        </div>
      </div>
    </>
  );
}
