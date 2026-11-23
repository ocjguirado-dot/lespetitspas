import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MessageStatusBadge } from "@/components/staff/message-status-badge";
import { MarkMessageAsRead } from "@/components/staff/mark-message-as-read";
import { MarkMessageAsProcessed } from "@/components/staff/mark-message-as-processed";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { formatParisDateTime } from "@/lib/dates";
import { isUuid, shouldMarkAsProcessed } from "@/lib/messages/status.mjs";
import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  child_id: string;
  author_id: string;
  body: string;
  status: string;
  created_at: string;
};

type RelatedName = { first_name: string | null; last_name: string | null };

function displayName(person: RelatedName | null): string {
  if (!person) return "Indisponible";
  const name = [person.first_name, person.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || "Indisponible";
}

export async function MessageDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  if (!isUuid(id)) notFound();

  let message: MessageRow | null = null;
  let parent: RelatedName | null = null;
  let child: RelatedName | null = null;
  let hasError = false;

  try {
    const supabase = await createClient();
    const messageResult = await supabase
      .from("messages")
      .select("id, child_id, author_id, body, status, created_at")
      .eq("id", id)
      .maybeSingle();
    if (messageResult.error) throw new Error("message-read");
    if (!messageResult.data) notFound();
    message = messageResult.data as MessageRow;

    const [childResult, profileResult] = await Promise.all([
      supabase
        .from("children")
        .select("id, first_name, last_name")
        .eq("id", message.child_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", message.author_id)
        .maybeSingle(),
    ]);
    if (childResult.error || profileResult.error) throw new Error("message-names-read");
    child = childResult.data;
    parent = profileResult.data;
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    hasError = true;
  }

  if (hasError || !message) {
    return (
      <Card className="items-start gap-3 p-6" role="alert">
        <p className="font-medium">Le message n’a pas pu être chargé.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4"
        href="/staff/messages"
      >
        Retour aux messages
      </Link>
      <Card className="items-start gap-4 p-5 sm:p-6">
        <header className="w-full space-y-2">
          <h2 className="font-heading text-xl font-semibold text-foreground">Message de {displayName(parent)}</h2>
          <p className="text-sm text-muted-foreground">Enfant : {displayName(child)}</p>
          <time className="block text-sm text-muted-foreground" dateTime={message.created_at}>
            {formatParisDateTime(message.created_at)}
          </time>
          <div className="flex items-center gap-2">
            <MessageStatusBadge status={message.status} />
            <MarkMessageAsRead messageId={message.id} status={message.status} />
            {shouldMarkAsProcessed(message.status) ? (
              <MarkMessageAsProcessed messageId={message.id} />
            ) : null}
          </div>
        </header>
        <p className="w-full whitespace-pre-wrap break-words text-sm text-foreground">{message.body}</p>
      </Card>
    </div>
  );
}
