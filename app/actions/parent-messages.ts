"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendStaffMessageNotification } from "@/lib/email/send";
import { isUuid } from "@/lib/messages/status.mjs";
import { validateParentMessage } from "@/lib/messages/parent-message.mjs";
import { createClient } from "@/lib/supabase/server";

export type ParentMessageActionResult =
  | "sent"
  | "invalid-child"
  | "invalid-message"
  | "message-required"
  | "message-too-long"
  | "child-not-attached"
  | "error";

function logNotification(status: "not-configured" | "error", code: string) {
  try {
    const record = { status, code };
    if (status === "error") console.error(record);
    else console.info(record);
  } catch {
    // Notification logging must not affect the successful message insert.
  }
}

export async function sendParentMessage(childId: string, body: string): Promise<ParentMessageActionResult> {
  await requireRole("parent");
  if (!isUuid(childId)) return "invalid-child";

  const validation = validateParentMessage(body);
  if (!validation.valid) {
    if (validation.error === "required") return "message-required";
    if (validation.error === "too-long") return "message-too-long";
    return "invalid-message";
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const authorId = claims?.claims?.sub;
    if (claimsError || typeof authorId !== "string") return "error";

    const familyResult = await supabase
      .from("family_members")
      .select("child_id")
      .eq("child_id", childId)
      .eq("parent_id", authorId)
      .maybeSingle();
    if (familyResult.error) return "error";
    if (!familyResult.data) return "child-not-attached";

    const insertResult = await supabase.from("messages").insert({
      child_id: childId,
      author_id: authorId,
      body: validation.body,
      status: "nouveau",
    }).select("id").single();
    if (insertResult.error || !insertResult.data) return "error";
    const messageId = insertResult.data.id;

    revalidatePath("/parent/messages");
    revalidatePath("/staff/messages");

    try {
      after(async () => {
        try {
          const notificationClient = await createClient();
          const [profileResult, childResult] = await Promise.all([
            notificationClient.from("profiles").select("first_name").eq("id", authorId).maybeSingle(),
            notificationClient.from("children").select("first_name").eq("id", childId).maybeSingle(),
          ]);

          const parentFirstName = profileResult.data?.first_name?.trim();
          const childFirstName = childResult.data?.first_name?.trim();
          if (profileResult.error || childResult.error) {
            logNotification("error", "notification-context-read-failed");
            return;
          }
          if (!parentFirstName || !childFirstName) {
            logNotification("not-configured", "notification-name-missing");
            return;
          }

          await sendStaffMessageNotification({
            messageId,
            parentFirstName,
            childFirstName,
            body: validation.body,
          });
        } catch {
          logNotification("error", "notification-context-read-failed");
        }
      });
    } catch {
      logNotification("error", "notification-scheduling-failed");
    }

    return "sent";
  } catch {
    return "error";
  }
}
