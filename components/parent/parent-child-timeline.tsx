import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { ParentEventItem, type ParentEvent } from "@/components/parent/parent-event-item";
import { EveningBook } from "@/components/parent/evening-book";
import { formatParisDate, getParisDayInterval, getTodayInParis, isValidDateInput } from "@/lib/dates";
import { isUuid } from "@/lib/messages/status.mjs";
import { createClient } from "@/lib/supabase/server";

type TimelineParams = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};
type Author = { id: string; first_name: string | null };
type Child = { id: string; first_name: string; last_name: string };

function DateControls({ childId, date }: { childId: string; date: string }) {
  const path = `/parent/children/${encodeURIComponent(childId)}`;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <form action={path} className="flex flex-col gap-2 sm:flex-row sm:items-end" method="get">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="parent-timeline-date">Jour</label>
          <input
            className="min-h-11 min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            defaultValue={date}
            id="parent-timeline-date"
            name="date"
            type="date"
          />
        </div>
        <button className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="submit">
          Afficher
        </button>
      </form>
      <Link className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline" href={path}>
        Aujourd’hui
      </Link>
    </div>
  );
}

function ReadError() {
  return (
    <Card className="items-start gap-3 p-6" role="alert">
      <p className="font-medium">La chronologie n’a pas pu être chargée.</p>
      <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
      <RetryChildrenButton />
    </Card>
  );
}

export async function ParentChildTimeline({ params, searchParams }: TimelineParams) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) redirect("/parent");

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let isAttached = false;
  let hasError = false;
  try {
    supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const parentId = claims?.claims?.sub;
    if (claimsError || typeof parentId !== "string") {
      hasError = true;
    } else {
      const familyResult = await supabase
        .from("family_members")
        .select("child_id")
        .eq("child_id", id)
        .eq("parent_id", parentId)
        .maybeSingle();
      if (familyResult.error) hasError = true;
      else isAttached = Boolean(familyResult.data);
    }
  } catch {
    hasError = true;
  }
  if (hasError || !supabase) return <ReadError />;
  if (!isAttached) redirect("/parent");

  const query = await searchParams;
  const requestedDate = query.date;
  const today = getTodayInParis();
  const date = typeof requestedDate === "string" && isValidDateInput(requestedDate) ? requestedDate : today;
  const { start, end } = getParisDayInterval(date);
  let child: Child | null = null;
  let events: ParentEvent[] = [];
  let authorNames = new Map<string, string>();

  try {
    const childResult = await supabase
      .from("children")
      .select("id, first_name, last_name")
      .eq("id", id)
      .maybeSingle();
    if (childResult.error) throw new Error("child-read");
    child = childResult.data as Child | null;

    const eventsResult = await supabase
      .from("events")
      .select("id, author_id, type, details, note, created_at")
      .eq("child_id", id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (eventsResult.error) throw new Error("events-read");
    events = eventsResult.data as ParentEvent[];

    const authorIds = [...new Set(events.flatMap((event) => event.author_id ? [event.author_id] : []))];
    if (authorIds.length > 0) {
      const profilesResult = await supabase.from("profiles").select("id, first_name").in("id", authorIds);
      if (!profilesResult.error) {
        authorNames = new Map((profilesResult.data as Author[]).flatMap((author) => {
          const firstName = author.first_name?.trim();
          return firstName ? [[author.id, firstName] as [string, string]] : [];
        }));
      }
    }
  } catch {
    hasError = true;
  }

  if (hasError) return <ReadError />;
  if (!child) redirect("/parent");

  return (
    <section aria-labelledby="parent-timeline-heading" className="space-y-4">
      <Link className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline" href="/parent">
        Retour à mes enfants
      </Link>
      <h2 className="font-heading text-xl font-semibold text-foreground" id="parent-timeline-heading">Journée de {child.first_name}</h2>
      <Card className="items-start gap-4 p-5 sm:p-6">
        <div>
          <h3 className="font-heading text-lg font-semibold">Chronologie du jour</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatParisDate(date)}</p>
        </div>
        <DateControls childId={id} date={date} />
        <p aria-live="polite" className="text-sm font-medium">{events.length} événement{events.length === 1 ? "" : "s"}</p>
        {events.length === 0 ? (
          <p className="w-full rounded-lg bg-muted/60 p-4 text-sm">Aucun événement ce jour-là.</p>
        ) : (
          <ol className="w-full space-y-3">
            {events.map((event) => (
              <ParentEventItem event={event} authorFirstName={event.author_id ? authorNames.get(event.author_id) : undefined} key={event.id} />
            ))}
          </ol>
        )}
      </Card>
      {date === today ? <EveningBook /> : null}
    </section>
  );
}
