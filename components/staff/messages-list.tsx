import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { formatParisDate, formatParisTime } from "@/lib/dates";
import { messageExcerpt } from "@/lib/messages/excerpt.mjs";
import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  child_id: string;
  author_id: string;
  body: string;
  status: string;
  created_at: string;
};

type ChildName = { id: string; first_name: string; last_name: string };
type ProfileName = { id: string; first_name: string | null; last_name: string | null };

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  lu: "Lu",
  traite: "Traité",
};

const statusStyles: Record<string, string> = {
  nouveau: "border-accent bg-accent/20",
  lu: "border-secondary bg-secondary/20",
  traite: "border-primary/40 bg-primary/20",
};

function getParisDateInput(instant: string): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatMessageDate(instant: string): string {
  const date = getParisDateInput(instant);
  return `${formatParisDate(date)} · ${formatParisTime(instant)}`;
}

function parentName(profile: ProfileName | undefined): string {
  if (!profile) return "Parent indisponible";
  const name = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || "Parent indisponible";
}

export async function MessagesList() {
  await connection();

  let messages: MessageRow[] = [];
  let childrenById = new Map<string, ChildName>();
  let profilesById = new Map<string, ProfileName>();
  let hasError = false;

  try {
    const supabase = await createClient();
    const messagesResult = await supabase
      .from("messages")
      .select("id, child_id, author_id, body, status, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(100);

    if (messagesResult.error) throw new Error("messages-read");
    messages = messagesResult.data as MessageRow[];

    const childIds = [...new Set(messages.map((message) => message.child_id))];
    if (childIds.length > 0) {
      const childrenResult = await supabase
        .from("children")
        .select("id, first_name, last_name")
        .in("id", childIds);
      if (childrenResult.error) throw new Error("children-read");
      childrenById = new Map((childrenResult.data as ChildName[]).map((child) => [child.id, child]));
    }

    const authorIds = [...new Set(messages.map((message) => message.author_id))];
    if (authorIds.length > 0) {
      const profilesResult = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", authorIds);
      if (profilesResult.error) throw new Error("profiles-read");
      profilesById = new Map((profilesResult.data as ProfileName[]).map((profile) => [profile.id, profile]));
    }
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <Card className="items-start gap-3 p-6" role="alert">
        <p className="font-medium">Les messages n’ont pas pu être chargés.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-medium">Aucun message.</p>
      </Card>
    );
  }

  return (
    <ul aria-label="Messages des parents" className="space-y-3">
      {messages.map((message) => {
        const child = childrenById.get(message.child_id);
        const profile = profilesById.get(message.author_id);
        const statusLabel = statusLabels[message.status] ?? "Statut indisponible";
        const statusStyle = statusStyles[message.status] ?? "border-border bg-muted";

        return (
          <li key={message.id}>
            <Card className="items-start gap-3 p-4 sm:p-5">
              <article className="w-full min-w-0 space-y-3">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-medium text-foreground">
                      {parentName(profile)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enfant : {child ? `${child.first_name} ${child.last_name}` : "Enfant indisponible"}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </header>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">{messageExcerpt(message.body)}</p>
                <time className="block text-sm text-muted-foreground" dateTime={message.created_at}>
                  {formatMessageDate(message.created_at)}
                </time>
              </article>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
