import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { formatParisTime, getParisDayInterval, getTodayInParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

type Child = { id: string; first_name: string; last_name: string };
type FamilyChild = { child_id: string };
type TodayEvent = { id: string; child_id: string; type: string; created_at: string };

const eventLabels: Record<string, string> = {
  repas: "Repas",
  sieste: "Sieste",
  activite: "Activité",
  incident: "Incident",
  medicament: "Médicament",
};

function initials(child: Child): string {
  return `${child.first_name.trim().charAt(0)}${child.last_name.trim().charAt(0)}`.toLocaleUpperCase("fr-FR");
}

export async function ParentChildrenList() {
  await connection();
  let children: Child[] = [];
  const latestEvents = new Map<string, TodayEvent>();
  let hasError = false;

  try {
    const supabase = await createClient();
    const familyResult = await supabase.from("family_members").select("child_id");
    if (familyResult.error) throw new Error("family-read");

    const childIds = [...new Set((familyResult.data as FamilyChild[]).map((member) => member.child_id))];
    if (childIds.length > 0) {
      const childrenResult = await supabase
        .from("children")
        .select("id, first_name, last_name")
        .in("id", childIds)
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true });
      if (childrenResult.error) throw new Error("children-read");
      children = childrenResult.data as Child[];

      if (children.length > 0) {
        const { start, end } = getParisDayInterval(getTodayInParis());
        const eventsResult = await supabase
          .from("events")
          .select("id, child_id, type, created_at")
          .in("child_id", children.map((child) => child.id))
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString())
          .order("created_at", { ascending: false })
          .order("id", { ascending: true });
        if (eventsResult.error) throw new Error("events-read");
        for (const event of eventsResult.data as TodayEvent[]) {
          if (!latestEvents.has(event.child_id)) latestEvents.set(event.child_id, event);
        }
      }
    }
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <Card className="items-start gap-3 p-6" role="alert">
        <p className="font-medium">La liste des enfants n’a pas pu être chargée.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  if (children.length === 0) {
    return <Card className="p-6"><p className="font-medium">Aucun enfant n’est rattaché à votre compte.</p></Card>;
  }

  return (
    <section aria-labelledby="parent-children-heading" className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-foreground" id="parent-children-heading">Mes enfants</h2>
      <ul className="grid gap-4">
        {children.map((child) => {
          const event = latestEvents.get(child.id);
          return (
            <li key={child.id}>
              <Card className="items-start gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <Link
                  aria-label={`Voir la journée de ${child.first_name}`}
                  className="flex min-h-11 min-w-0 w-full items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-1"
                  href={`/parent/children/${child.id}`}
                >
                  <span aria-label={`Initiales de ${child.first_name} ${child.last_name}`} className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground" role="img">
                    {initials(child)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-heading font-semibold text-foreground">{child.first_name}</span>
                    {event ? (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {eventLabels[event.type] ?? "Événement"} · {formatParisTime(event.created_at)}
                      </span>
                    ) : (
                      <span className="mt-1 block text-sm text-muted-foreground">Rien de saisi aujourd’hui</span>
                    )}
                  </span>
                </Link>
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                  href={`/parent/messages?child=${encodeURIComponent(child.id)}`}
                >
                  Écrire à l’équipe
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
