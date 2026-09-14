"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEV_AUTH_COOKIE } from "@/lib/supabase/proxy";

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();

  // Clear the dev-mode session cookie too, in case it was used
  (await cookies()).delete(DEV_AUTH_COOKIE);

  redirect("/");
}
