"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { profileToRow } from "@/lib/sizing/row";
import type { MeasurementProfile } from "@/lib/sizing/types";

// Wide backstops that mirror the database checks. The friendly limits live
// in src/lib/sizing/measurements.ts and only warn
const cm = (min: number, max: number) => z.number().min(min).max(max).nullable();

const measurementSchema = z.object({
  unit: z.enum(["cm", "in"]),
  sizeRange: z.enum(["mens", "womens"]).nullable(),
  fitPreference: z.enum(["snug", "regular", "relaxed"]),
  measurements: z.object({
    height: cm(50, 250),
    chest: cm(30, 200),
    waist: cm(30, 200),
    hips: cm(30, 220),
    inseam: cm(30, 120),
    foot_length: cm(10, 40),
  }),
});

export type MeasurementActionState = { error?: string; saved?: boolean };

export async function saveMeasurements(
  input: MeasurementProfile,
): Promise<MeasurementActionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Service is not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) {
    // Paths and codes only. Issue inputs would put body measurements in logs
    console.error(
      "[sizing:save] validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".")} ${i.code}`),
    );
    return { error: "Some measurements are outside the range we can store. Check the numbers." };
  }

  const { error } = await supabase
    .from("measurement_profiles")
    .upsert(
      { user_id: user.id, ...profileToRow(parsed.data), updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[sizing:save]", error.code);
    return { error: "Could not save your measurements" };
  }

  revalidatePath("/profile/measurements");
  return { saved: true };
}

export async function deleteMeasurements(): Promise<MeasurementActionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Service is not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("measurement_profiles")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("[sizing:delete]", error.code);
    return { error: "Could not delete your measurements" };
  }

  revalidatePath("/profile/measurements");
  return { saved: true };
}
