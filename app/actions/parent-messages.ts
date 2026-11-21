"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
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
    });
    if (insertResult.error) return "error";

    revalidatePath("/parent/messages");
    revalidatePath("/staff/messages");
    return "sent";
  } catch {
    return "error";
  }
}
