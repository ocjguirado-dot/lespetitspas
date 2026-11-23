import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { AddEventPromptButton } from "@/components/staff/add-event-prompt-button";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import {
  formatParisDate,
  formatParisTime,
  getParisDayInterval,
  getTodayInParis,
  isValidDateInput,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  author_id: string | null;
  type: string;
  details: unknown;
  note: string | null;
  created_at: string;
};

type AuthorProfile = { id: string; first_name: string | null };
type Details = Record<string, unknown>;

const eventLabels: Record<string, string> = {
  repas: "Repas",
  sieste: "Sieste",
  activite: "Activité",
  incident: "Incident",
  medicament: "Médicament",
};

const mealLabels: Record<string, string> = {
  matin: "Matin",
  midi: "Midi",
  gouter: "Goûter",
};

const mealQualityLabels: Record<string, string> = {
  tout: "A tout mangé",
  moitie: "A mangé la moitié",
  peu: "A peu mangé",
  rien: "N’a rien mangé",
};

const napQualityLabels: Record<string, string> = {
  calme: "Calme",
  agitee: "Agitée",
  reveil_precoce: "Réveil précoce",
};

const incidentTypeLabels: Record<string, string> = {
  chute: "Chute",
  morsure: "Morsure",
  fievre: "Fièvre",
  autre: "Autre",
};

const incidentSeverity: Record<string, { label: string; className: string }> = {
  leger: { label: "Léger", className: "border-secondary bg-secondary/20" },
  modere: { label: "Modéré", className: "border-accent bg-accent/20" },
  urgent: { label: "Urgent", className: "border-destructive bg-destructive/20" },
};

function asDetails(value: unknown): Details {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Details)
    : {};
}

function detailText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mappedLabel(value: unknown, labels: Record<string, string>): string {
  const key = detailText(value);
  return key ? labels[key] ?? "Information non disponible" : "Information non disponible";
}

function safeTime(value: unknown): string {
  const time = detailText(value);
  return time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "Horaire non disponible";
}

function EventDetails({ event }: { event: EventRow }) {
  const details = asDetails(event.details);

  switch (event.type) {
    case "repas":
      return <p>{mappedLabel(details.moment, mealLabels)} · {mappedLabel(details.qualite, mealQualityLabels)}</p>;
    case "sieste":
      return <p>de {safeTime(details.debut)} à {safeTime(details.fin)} · {mappedLabel(details.qualite, napQualityLabels)}</p>;
    case "activite":
      return <p>{detailText(details.nom) ?? "Information non disponible"}</p>;
    case "incident": {
      const severity = incidentSeverity[typeof details.gravite === "string" ? details.gravite : ""];
      return (
        <div className="flex flex-wrap items-center gap-2">
          <p>{mappedLabel(details.type, incidentTypeLabels)}</p>
          {severity ? (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severity.className}`}>
              Gravité : {severity.label}
            </span>
          ) : (
            <span>Gravité : information non disponible</span>
          )}
        </div>
      );
    }
    case "medicament":
      return (
        <div className="space-y-1">
          <p>{detailText(details.nom) ?? "Nom non disponible"} · {detailText(details.dose) ?? "Dose non disponible"}</p>
          <p>Heure : {safeTime(details.heure)}</p>
          <p>{details.autorisation_confirmee === true || details.autorisation_confirmee === "true" ? "Autorisation parentale confirmée" : "Autorisation parentale non confirmée"}</p>
        </div>
      );
    default:
      return <p>Détail de l&apos;événement non disponible.</p>;
  }
}

function DateControls({ childId, date }: { childId: string; date: string }) {
  const childPath = `/staff/children/${encodeURIComponent(childId)}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <form action={childPath} className="flex flex-col gap-2 sm:flex-row sm:items-end" method="get">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor={`timeline-date-${childId}`}>Jour</label>
          <input
            className="min-h-11 rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            id={`timeline-date-${childId}`}
            name="date"
            type="date"
            defaultValue={date}
          />
        </div>
        <button
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="submit"
        >
          Afficher
        </button>
      </form>
      <Link className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4" href={childPath}>
        Aujourd’hui
      </Link>
    </div>
  );
}

export function ChildTimelineLoading() {
  return (
    <Card aria-busy="true" aria-live="polite" className="items-start gap-4 p-5 sm:p-6">
      <span className="sr-only">Chargement de la chronologie</span>
      <div className="h-6 w-52 animate-pulse rounded bg-muted" />
      <div className="h-4 w-44 animate-pulse rounded bg-muted" />
      <div className="h-11 w-full animate-pulse rounded bg-muted sm:w-80" />
      <div className="h-20 w-full animate-pulse rounded bg-muted" />
    </Card>
  );
}

export async function ChildTimeline({
  childId,
  searchParams,
}: {
  childId: string;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  await connection();
  const today = getTodayInParis();
  const query = await searchParams;
  const requestedDate = query.date;
  const date = typeof requestedDate === "string" && isValidDateInput(requestedDate)
    ? requestedDate
    : today;
  const { start, end } = getParisDayInterval(date);
  let events: EventRow[] = [];
  let authorNames = new Map<string, string>();
  let readFailed = false;

  try {
    const supabase = await createClient();
    const result = await supabase
      .from("events")
      .select("id, author_id, type, details, note, created_at")
      .eq("child_id", childId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (result.error) throw new Error("timeline-read");
    events = result.data as EventRow[];

    const authorIds = [...new Set(events.flatMap((event) => event.author_id ? [event.author_id] : []))];
    if (authorIds.length > 0) {
      try {
        const profilesResult = await supabase
          .from("profiles")
          .select("id, first_name")
          .in("id", authorIds);
        if (!profilesResult.error && profilesResult.data) {
          authorNames = new Map(
            (profilesResult.data as AuthorProfile[]).flatMap((profile) => {
              const firstName = profile.first_name?.trim();
              return firstName ? [[profile.id, firstName] as [string, string]] : [];
            }),
          );
        }
      } catch {
        authorNames = new Map();
      }
    }
  } catch {
    readFailed = true;
  }

  return (
    <section aria-labelledby={`timeline-heading-${childId}`}>
      <Card className="items-start gap-4 p-5 sm:p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold" id={`timeline-heading-${childId}`}>Chronologie du jour</h2>
          <p className="mt-1 text-sm text-muted-foreground">{formatParisDate(date)}</p>
        </div>
        <DateControls childId={childId} date={date} />
        <p aria-live="polite" className="text-sm font-medium">
          {readFailed ? "Événements indisponibles" : `${events.length} événement${events.length === 1 ? "" : "s"}`}
        </p>

        {readFailed ? (
          <div className="w-full rounded-lg border border-destructive/40 bg-destructive/10 p-4" role="alert">
            <p className="font-medium">La chronologie n’a pas pu être chargée.</p>
            <p className="mt-1 text-sm text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
            <div className="mt-3"><RetryChildrenButton /></div>
          </div>
        ) : events.length === 0 ? (
          date === today ? (
            <div className="w-full space-y-3 rounded-lg bg-muted/60 p-4">
              <p className="text-sm">Aucun événement enregistré aujourd’hui. Ajoutez le premier moment de la journée pour les parents.</p>
              <AddEventPromptButton childId={childId} />
            </div>
          ) : (
            <p className="w-full rounded-lg bg-muted/60 p-4 text-sm">Aucun événement ce jour-là.</p>
          )
        ) : (
          <ol className="w-full space-y-3">
            {events.map((event) => (
              <li className="rounded-lg border border-border bg-background p-4" key={event.id}>
                <article className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="font-medium tabular-nums" dateTime={event.created_at}>
                      {formatParisTime(event.created_at)}
                    </time>
                    <span className="rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-medium">
                      {eventLabels[event.type] ?? "Événement"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm"><EventDetails event={event} /></div>
                  {event.note?.trim() ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.note.trim()}</p> : null}
                  <p className="text-sm font-medium text-foreground">
                    Saisi par {event.author_id ? authorNames.get(event.author_id) ?? "un membre de l'équipe" : "un membre de l'équipe"}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
