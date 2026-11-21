import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function UnreadMessageCountLoading() {
  return <p aria-label="Chargement du compteur" className="text-sm text-muted-foreground">…</p>;
}

export async function UnreadMessageCount({ childId }: { childId: string }) {
  await connection();
  let count: number | null = null;

  try {
    const supabase = await createClient();
    const result = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("child_id", childId)
      .eq("status", "nouveau");

    if (!result.error) count = result.count;
  } catch {
    count = null;
  }

  return <p className="text-sm text-foreground">{count === null ? "Indisponible" : count}</p>;
}
