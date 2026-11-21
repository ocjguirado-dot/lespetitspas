"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isUuid } from "@/lib/messages/status.mjs";
import { createClient } from "@/lib/supabase/server";

export type MarkMessageResult = "updated" | "unchanged" | "error";

export async function markMessageAsRead(messageId: string): Promise<MarkMessageResult> {
  await requireRole("staff");
  if (!isUuid(messageId)) return "error";

  try {
    const supabase = await createClient();
    const result = await supabase
      .from("messages")
      .update({ status: "lu" })
      .eq("id", messageId)
      .eq("status", "nouveau")
      .select("id");

    if (result.error) return "error";
    if (result.data.length !== 1) return "unchanged";

    revalidatePath("/staff/messages");
    revalidatePath("/staff/messages/[id]", "page");
    revalidatePath("/staff/children/[id]", "page");
    return "updated";
  } catch {
    return "error";
  }
}

export async function markMessageAsProcessed(messageId: string): Promise<MarkMessageResult> {
  await requireRole("staff");
  if (!isUuid(messageId)) return "error";

  try {
    const supabase = await createClient();
    const result = await supabase
      .from("messages")
      .update({ status: "traite" })
      .eq("id", messageId)
      .eq("status", "lu")
      .select("id");

    if (result.error) return "error";
    if (result.data.length !== 1) return "unchanged";

    revalidatePath("/staff/messages");
    revalidatePath("/staff/messages/[id]", "page");
    revalidatePath("/staff/children/[id]", "page");
    return "updated";
  } catch {
    return "error";
  }
}
