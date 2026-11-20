import { connection } from "next/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function ChildDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();

  const supabase = await createClient();
  const { data: child, error } = await supabase
    .from("children")
    .select("first_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !child) notFound();

  return <p className="text-muted-foreground">Fiche de {child.first_name} — à venir.</p>;
}
