import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { ParentMessageChild, SendMessageForm } from "@/components/parent/send-message-form";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { formatParisDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

type ParentMessage = { id: string; child_id: string; body: string; status: string; created_at: string };
type FamilyChild = { child_id: string };
type Query = { child?: string | string[] };

const messageStatusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  lu: "Lu",
  traite: "Traité",
};

function ErrorCard() {
  return (
    <Card className="items-start gap-3 p-6" role="alert">
      <p className="font-medium">Les messages n’ont pas pu être chargés.</p>
      <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
      <RetryChildrenButton />
    </Card>
  );
}

export async function ParentMessages({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const query = await searchParams;
  let children: ParentMessageChild[] = [];
  let messages: ParentMessage[] = [];
  let hasError = false;

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const authorId = claims?.claims?.sub;
    if (claimsError || typeof authorId !== "string") throw new Error("session-read");

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
      children = childrenResult.data as ParentMessageChild[];
    }

    const messageResult = await supabase
      .from("messages")
      .select("id, child_id, body, status, created_at")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (messageResult.error) throw new Error("messages-read");
    messages = messageResult.data as ParentMessage[];
  } catch {
    hasError = true;
  }

  if (hasError) return <ErrorCard />;

  const requestedChildId = query.child;
  const selectedChildId = typeof requestedChildId === "string" && children.some((child) => child.id === requestedChildId)
    ? requestedChildId
    : children[0]?.id ?? "";
  const childNames = new Map(children.map((child) => [child.id, `${child.first_name} ${child.last_name}`]));

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Messages</h2>
      {children.length > 0 ? (
        <SendMessageForm childOptions={children} initialChildId={selectedChildId} />
      ) : (
        <Card className="items-start gap-2 p-5">
          <h3 className="font-heading text-lg font-semibold">Écrire à l’équipe</h3>
          <p className="text-sm text-muted-foreground">Aucun enfant n’est rattaché à votre compte.</p>
        </Card>
      )}

      <section aria-labelledby="parent-message-history-heading" className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-foreground" id="parent-message-history-heading">Historique de mes messages</h3>
        {messages.length === 0 ? (
          <Card className="p-5"><p className="text-sm">Vous n’avez pas encore envoyé de message à l’équipe.</p></Card>
        ) : (
          <ol aria-label="Messages envoyés à l’équipe" className="space-y-3">
            {messages.map((message) => (
              <li key={message.id}>
                <Card className="items-start gap-3 p-4 sm:p-5">
                  <header className="flex w-full min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="break-words text-sm font-medium">Enfant : {childNames.get(message.child_id) ?? "Indisponible"}</p>
                    <span className="text-sm text-muted-foreground">{messageStatusLabels[message.status] ?? "Statut indisponible"}</span>
                  </header>
                  <time className="text-sm text-muted-foreground" dateTime={message.created_at}>{formatParisDateTime(message.created_at)}</time>
                  <p className="w-full whitespace-pre-wrap break-words text-sm text-foreground">{message.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
