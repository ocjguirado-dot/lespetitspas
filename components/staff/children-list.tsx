import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { ChildrenBrowser } from "@/components/staff/children-browser";
import { type ChildSummary } from "@/components/staff/child-card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { createClient } from "@/lib/supabase/server";

export async function ChildrenList() {
  let children: ChildSummary[] | null = null;
  let hasError = false;

  try {
    await connection();
    const supabase = await createClient();
    const result = await supabase
      .from("children")
      .select("id, first_name, last_name, section, photo_url")
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true });

    if (result.error) {
      hasError = true;
    } else {
      children = result.data as ChildSummary[];
    }
  } catch {
    hasError = true;
  }

  if (hasError || children === null) {
    return (
      <Card className="items-start p-6">
        <p className="font-medium">La liste des enfants n’a pas pu être chargée.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-medium">Aucun enfant n’est inscrit pour le moment.</p>
      </Card>
    );
  }

  return <ChildrenBrowser items={children} />;
}
