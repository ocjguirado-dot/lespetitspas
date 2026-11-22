import { formatParisTime } from "@/lib/dates";

export type ParentEvent = {
  id: string;
  author_id: string | null;
  type: string;
  details: unknown;
  note: string | null;
  created_at: string;
};

type Details = Record<string, unknown>;

const eventLabels: Record<string, string> = {
  repas: "Repas",
  sieste: "Sieste",
  activite: "Activité",
  incident: "Incident",
  medicament: "Médicament",
};
const mealMoments: Record<string, string> = { matin: "Matin", midi: "Midi", gouter: "Goûter" };
const mealQualities: Record<string, string> = {
  tout: "A tout mangé",
  moitie: "A mangé la moitié",
  peu: "A peu mangé",
  rien: "N’a rien mangé",
};
const napQualities: Record<string, string> = { calme: "Calme", agitee: "Agitée", reveil_precoce: "Réveil précoce" };
const incidentTypes: Record<string, string> = { chute: "Chute", morsure: "Morsure", fievre: "Fièvre", autre: "Autre" };
const severities: Record<string, string> = { leger: "Léger", modere: "Modéré", urgent: "Urgent" };

function asDetails(value: unknown): Details {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Details : {};
}

function text(value: unknown, fallback = "Information non disponible"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function label(value: unknown, labels: Record<string, string>): string {
  return typeof value === "string" ? labels[value] ?? "Information non disponible" : "Information non disponible";
}

function safeTime(value: unknown): string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? value
    : "Horaire non disponible";
}

function EventDetails({ event }: { event: ParentEvent }) {
  const details = asDetails(event.details);

  switch (event.type) {
    case "repas":
      return <p>{label(details.moment, mealMoments)} · {label(details.qualite, mealQualities)}</p>;
    case "sieste":
      return <p>de {safeTime(details.debut)} à {safeTime(details.fin)} · {label(details.qualite, napQualities)}</p>;
    case "activite":
      return <p>{text(details.nom)}</p>;
    case "incident":
      return <p>{label(details.type, incidentTypes)} · Gravité : {label(details.gravite, severities)}</p>;
    case "medicament":
      return (
        <div className="space-y-1">
          <p>{text(details.nom, "Nom non disponible")} · {text(details.dose, "Dose non disponible")}</p>
          <p>Heure : {safeTime(details.heure)}</p>
          <p>{details.autorisation_confirmee === true || details.autorisation_confirmee === "true" ? "Autorisation parentale confirmée" : "Autorisation parentale non confirmée"}</p>
        </div>
      );
    default:
      return <p>Détail de l’événement non disponible.</p>;
  }
}

export function ParentEventItem({ event, authorFirstName }: { event: ParentEvent; authorFirstName?: string }) {
  return (
    <li className="rounded-lg border border-border bg-background p-4">
      <article className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <time className="font-medium tabular-nums" dateTime={event.created_at}>{formatParisTime(event.created_at)}</time>
          <span className="rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-xs font-medium">
            {eventLabels[event.type] ?? "Événement"}
          </span>
        </div>
        <div className="space-y-1 text-sm"><EventDetails event={event} /></div>
        {event.note?.trim() ? <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{event.note.trim()}</p> : null}
        <p className="break-words text-sm font-medium text-foreground">
          Saisi par {authorFirstName?.trim() || "un membre de l’équipe"}
        </p>
      </article>
    </li>
  );
}
