"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth";
import { buildInvitationLink, isInvitationUuid, normalizeInvitationEmail } from "@/lib/email/invitation.mjs";
import { sendParentInvitationNotification } from "@/lib/email/send";
import { ensureFamilyMember, generateParentInvitation, linkExistingParentAccount, readParentAccountStatuses, removeFamilyMember } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ParentInvitationResult = "sent" | "resent" | "linked-existing" | "already-active" | "invalid-email" | "error";

function logInvitation(status: "not-configured" | "error", code: string) {
  try {
    const record = { status, code };
    if (status === "error") console.error(record);
    else console.info(record);
  } catch {
    // Diagnostic logging must not change the action result.
  }
}

export async function inviteParent(childId: string, emailValue: string): Promise<ParentInvitationResult> {
  await requireRole("staff");
  if (!isInvitationUuid(childId)) return "error";
  const email = normalizeInvitationEmail(emailValue);
  if (!email) return "invalid-email";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    logInvitation("not-configured", "email-config-missing");
    return "error";
  }

  try {
    const sessionClient = await createClient();
    const childResult = await sessionClient
      .from("children")
      .select("id, first_name")
      .eq("id", childId)
      .maybeSingle();
    if (childResult.error || !childResult.data) {
      logInvitation("error", "invitation-child-read-failed");
      return "error";
    }

    const familyResult = await sessionClient
      .from("family_members")
      .select("parent_id")
      .eq("child_id", childId)
      .eq("parent_email", email)
      .maybeSingle();
    if (familyResult.error) {
      logInvitation("error", "invitation-family-read-failed");
      return "error";
    }
    const existed = Boolean(familyResult.data);

    if (familyResult.data?.parent_id) {
      const statuses = await readParentAccountStatuses([familyResult.data.parent_id]);
      if (statuses[familyResult.data.parent_id] === "active") return "already-active";
    }

    const memberResult = await ensureFamilyMember(childId, email);
    if (memberResult.status !== "ok") {
      logInvitation(memberResult.status, memberResult.code);
      return "error";
    }

    const generated = await generateParentInvitation(email);
    if (generated.status !== "ok") {
      if (memberResult.inserted && !(await removeFamilyMember(childId, email))) {
        logInvitation("error", "family-member-cleanup-failed");
        return "error";
      }
      if (generated.status === "already-active") {
        // If the trigger has linked an unconfirmed invite, the Auth API error is not evidence of activation.
        if (existed && familyResult.data?.parent_id) return "error";
        // The parent already has an account (e.g. siblings): attach this child to it, no email needed.
        const linked = await linkExistingParentAccount(childId, email);
        if (linked.status === "ok") return "linked-existing";
        if (linked.status === "not-found") return "already-active";
        if (linked.status === "not-confirmed") {
          logInvitation("error", "existing-parent-not-confirmed");
          return "error";
        }
        logInvitation(linked.status, linked.code);
        return "error";
      }
      logInvitation("error", "auth-generate-link-failed");
      return "error";
    }

    const invitationUrl = buildInvitationLink(appUrl, generated.hashedToken);
    const sendResult = await sendParentInvitationNotification({
      attemptId: randomUUID(),
      email,
      childFirstName: childResult.data.first_name,
      invitationUrl,
    });
    return sendResult.status === "sent" ? (existed ? "resent" : "sent") : "error";
  } catch {
    logInvitation("error", "invitation-action-failed");
    return "error";
  }
}

