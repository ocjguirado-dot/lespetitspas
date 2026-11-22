import "server-only";

import { createClient } from "@supabase/supabase-js";
import { mapInvitationError } from "@/lib/email/invitation.mjs";

type StaffEmailResult =
  | { status: "ok"; emails: string[] }
  | { status: "not-configured"; code: "supabase-admin-config-missing" }
  | { status: "error"; code: "staff-email-read-failed" };

export type FamilyMemberInsertResult =
  | { status: "ok"; inserted: boolean }
  | { status: "not-configured"; code: "supabase-admin-config-missing" }
  | { status: "error"; code: "family-member-write-failed" };

export type ParentAccountStatus = "active" | "pending" | "unavailable";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

/** Reads staff recipient addresses with the server-only service role client. */
export async function readStaffEmails(): Promise<StaffEmailResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { status: "not-configured", code: "supabase-admin-config-missing" };
  }

  try {
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

/** Adds a family link once; duplicate links are preserved and reported as existing. */
export async function ensureFamilyMember(childId: string, email: string): Promise<FamilyMemberInsertResult> {
  const supabase = createAdminClient();
  if (!supabase) return { status: "not-configured", code: "supabase-admin-config-missing" };

  try {
    const result = await supabase
      .from("family_members")
      .upsert({ child_id: childId, parent_email: email }, {
        onConflict: "child_id,parent_email",
        ignoreDuplicates: true,
      })
      .select("id")
      .maybeSingle();
    if (result.error) return { status: "error", code: "family-member-write-failed" };
    return { status: "ok", inserted: Boolean(result.data) };
  } catch {
    return { status: "error", code: "family-member-write-failed" };
  }
}

/** Removes only a link inserted by this invitation attempt. */
export async function removeFamilyMember(childId: string, email: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;
  try {
    const result = await supabase
      .from("family_members")
      .delete()
      .eq("child_id", childId)
      .eq("parent_email", email)
      .select("id");
    return !result.error && result.data.length === 1;
  } catch {
    return false;
  }
}

/** Reads confirmation state for linked parent accounts without exposing auth records. */
export async function readParentAccountStatuses(
  parentIds: string[],
): Promise<Record<string, ParentAccountStatus>> {
  const supabase = createAdminClient();
  if (!supabase) return Object.fromEntries(parentIds.map((id) => [id, "unavailable"]));

  const entries = await Promise.all(parentIds.map(async (id) => {
    try {
      const result = await supabase.auth.admin.getUserById(id);
      if (result.error || !result.data.user) return [id, "unavailable"] as const;
      return [id, result.data.user.email_confirmed_at ? "active" : "pending"] as const;
    } catch {
      return [id, "unavailable"] as const;
    }
  }));
  return Object.fromEntries(entries);
}

export type LinkExistingParentResult =
  | { status: "ok" }
  | { status: "not-found" }
  | { status: "not-confirmed" }
  | { status: "not-configured"; code: "supabase-admin-config-missing" }
  | { status: "error"; code: "family-member-link-failed" };

/** Attaches a child to an already existing parent account (siblings), without any email. */
export async function linkExistingParentAccount(childId: string, email: string): Promise<LinkExistingParentResult> {
  const supabase = createAdminClient();
  if (!supabase) return { status: "not-configured", code: "supabase-admin-config-missing" };

  try {
    const profile = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "parent")
      .eq("email", email)
      .maybeSingle();
    if (profile.error) return { status: "error", code: "family-member-link-failed" };
    if (!profile.data) return { status: "not-found" };
    const authUser = await supabase.auth.admin.getUserById(profile.data.id);
    if (authUser.error || !authUser.data.user) return { status: "error", code: "family-member-link-failed" };
    if (!authUser.data.user.email_confirmed_at) return { status: "not-confirmed" };

    // A leftover unlinked row would be ignored by the upsert below: remove it first.
    const cleanup = await supabase
      .from("family_members")
      .delete()
      .eq("child_id", childId)
      .eq("parent_email", email)
      .is("parent_id", null);
    if (cleanup.error) return { status: "error", code: "family-member-link-failed" };

    const link = await supabase
      .from("family_members")
      .upsert({ child_id: childId, parent_email: email, parent_id: profile.data.id }, {
        onConflict: "child_id,parent_email",
        ignoreDuplicates: true,
      });
    if (link.error) return { status: "error", code: "family-member-link-failed" };
    return { status: "ok" };
  } catch {
    return { status: "error", code: "family-member-link-failed" };
  }
}

export type InvitationLinkResult =
  | { status: "ok"; hashedToken: string }
  | { status: "already-active" }
  | { status: "error" };

/** Generates an invite token but never returns the action URL. */
export async function generateParentInvitation(email: string): Promise<InvitationLinkResult> {
  const supabase = createAdminClient();
  if (!supabase) return { status: "error" };
  try {
    const result = await supabase.auth.admin.generateLink({ type: "invite", email });
    if (result.error) {
      if (mapInvitationError(result.error) === "already-active") return { status: "already-active" };
      return { status: "error" };
    }
    const hashedToken = result.data.properties?.hashed_token;
    if (!hashedToken) return { status: "error" };
    return { status: "ok", hashedToken };
  } catch {
    return { status: "error" };
  }
}

export type EveningBookInsert = {
  suggestion_date: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string;
};

export type EveningBookInsertResult =
  | { status: "inserted" }
  | { status: "exists" }
  | { status: "not-configured"; code: "supabase-admin-config-missing" }
  | { status: "error"; code: "evening-book-insert-failed" };

/** Inserts a shared daily suggestion with service_role; a date conflict is an expected race. */
export async function insertEveningBookIfAbsent(book: EveningBookInsert): Promise<EveningBookInsertResult> {
  const supabase = createAdminClient();
  if (!supabase) return { status: "not-configured", code: "supabase-admin-config-missing" };

  try {
    const result = await supabase
      .from("evening_books")
      .upsert(book, { onConflict: "suggestion_date", ignoreDuplicates: true })
      .select("suggestion_date")
      .maybeSingle();
    if (result.error) return { status: "error", code: "evening-book-insert-failed" };
    return result.data ? { status: "inserted" } : { status: "exists" };
  } catch {
    return { status: "error", code: "evening-book-insert-failed" };
  }
}
