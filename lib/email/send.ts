import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { buildMessageNotification, buildParentInvitationEmail, resolveRecipients } from "@/lib/email/notification.mjs";
import { readStaffEmails } from "@/lib/supabase/admin";

export type StaffNotificationResult =
  | { status: "sent" }
  | { status: "not-configured"; code: string }
  | { status: "error"; code: string };

type StaffMessageNotification = {
  messageId: string;
  parentFirstName: string;
  childFirstName: string;
};

type ParentInvitationNotification = {
  attemptId: string;
  email: string;
  childFirstName: string;
  invitationUrl: string;
};

function logResult(result: Exclude<StaffNotificationResult, { status: "sent" }>) {
  try {
    const record = { status: result.status, code: result.code };
    if (result.status === "error") console.error(record);
    else console.info(record);
  } catch {
    // Logging must never change the result of a message submission.
  }
}

export async function sendStaffMessageNotification(
  message: StaffMessageNotification,
): Promise<StaffNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !from || !appUrl) {
    const result = { status: "not-configured" as const, code: "email-config-missing" };
    logResult(result);
    return result;
  }

  try {
    const staffResult = await readStaffEmails();
    if (staffResult.status !== "ok") {
      logResult(staffResult);
      return staffResult;
    }

    if (staffResult.emails.length === 0) {
      const result = { status: "not-configured" as const, code: "staff-recipients-missing" };
      logResult(result);
      return result;
    }

    const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim() || undefined;
    const recipients = resolveRecipients(staffResult.emails, testRecipient);
    const content = buildMessageNotification({
      parentFirstName: message.parentFirstName,
      childFirstName: message.childFirstName,
      appUrl,
      testRecipient,
    });

    const resend = new Resend(apiKey);
    const result = await resend.emails.send(
      {
        from,
        to: recipients,
        subject: content.subject,
        html: content.html,
        text: content.text,
      },
      { idempotencyKey: `staff-notification-${message.messageId}` },
    );

    if (result.error) {
      const errorResult = { status: "error" as const, code: "resend-send-failed" };
      logResult(errorResult);
      return errorResult;
    }
    return { status: "sent" };
  } catch {
    const result = { status: "error" as const, code: "notification-send-failed" };
    logResult(result);
    return result;
  }
}

export async function sendParentInvitationNotification(
  invitation: ParentInvitationNotification,
): Promise<StaffNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !from || !appUrl) {
    const result = { status: "not-configured" as const, code: "email-config-missing" };
    logResult(result);
    return result;
  }

  try {
    const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim() || undefined;
    const recipients = resolveRecipients(invitation.email, testRecipient);
    const content = buildParentInvitationEmail({
      childFirstName: invitation.childFirstName,
      invitationUrl: invitation.invitationUrl,
      testRecipient,
    });
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: recipients,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }, { idempotencyKey: `parent-invitation-${invitation.attemptId}-${randomUUID()}` });

    if (result.error) {
      const errorResult = { status: "error" as const, code: "resend-send-failed" };
      logResult(errorResult);
      return errorResult;
    }
    return { status: "sent" };
  } catch {
    const result = { status: "error" as const, code: "invitation-send-failed" };
    logResult(result);
    return result;
  }
}
