import "server-only";

import { createClient } from "@supabase/supabase-js";

type StaffEmailResult =
  | { status: "ok"; emails: string[] }
  | { status: "not-configured"; code: "supabase-admin-config-missing" }
  | { status: "error"; code: "staff-email-read-failed" };

/** Reads staff recipient addresses with the server-only service role client. */
export async function readStaffEmails(): Promise<StaffEmailResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return { status: "not-configured", code: "supabase-admin-config-missing" };
  }

  try {
    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const result = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "staff")
      .not("email", "is", null);

    if (result.error) return { status: "error", code: "staff-email-read-failed" };
    const emails = result.data.flatMap((profile) => {
      const email = profile.email?.trim();
      return email ? [email] : [];
    });
    return { status: "ok", emails };
  } catch {
    return { status: "error", code: "staff-email-read-failed" };
  }
}
