import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { MeasurementWizard } from "@/components/measurement-wizard";
import { MeasurementDelete } from "@/components/measurement-delete";
import { MEASUREMENT_COLUMNS, hasAnyMeasurement, rowToProfile, type MeasurementRow } from "@/lib/sizing/row";

export const metadata: Metadata = { title: "Measurements" };
export const dynamic = "force-dynamic";

const privacyBox = (
  <aside className="rounded-xl border border-line px-4.5 py-4 text-sm">
    <b className="block font-semibold">Private to you</b>
    <p className="mt-1.5 leading-relaxed text-mute">
      Your measurements are stored on your account and only you can read them.
      They are never sent to an AI model. Size suggestions are worked out from
      brand size charts in the app.
    </p>
  </aside>
);

export default async function MeasurementsPage() {
  const supabase = await createClient();

  const header = (
    <PageHeader
      title="Your measurements"
      description="Measure once and get size suggestions for the brands you shop. Skip anything you are unsure of."
      action={
        <Link href="/profile" className="text-sm font-medium text-cobalt hover:underline">
          Back to profile
        </Link>
      }
    />
  );

  if (!supabase) {
    return (
      <>
        {header}
        <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
          <SetupNotice />
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
            <MeasurementWizard initial={null} />
            {privacyBox}
          </div>
        </div>
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("measurement_profiles")
    .select(MEASUREMENT_COLUMNS)
    .eq("user_id", user?.id)
    .maybeSingle<MeasurementRow>();

  const profile = rowToProfile(data ?? null);
  const saved = hasAnyMeasurement(profile);

  return (
    <>
      {header}
      <div className="px-5 py-5 pb-24 md:px-9 md:py-6">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
          {/* Remount after a save or delete so the wizard starts from the stored row */}
          <MeasurementWizard key={saved ? "saved" : "empty"} initial={profile} />
          <div className="grid gap-4">
            {privacyBox}
            {saved && <MeasurementDelete />}
          </div>
        </div>
      </div>
    </>
  );
}
