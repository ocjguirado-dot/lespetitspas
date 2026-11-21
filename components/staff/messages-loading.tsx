import { Card } from "@/components/ui/card";

export function MessagesLoading() {
  return (
    <Card aria-busy="true" aria-label="Chargement des messages" className="items-start gap-4 p-5 sm:p-6">
      <div aria-hidden="true" className="h-5 w-36 animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="h-4 w-56 animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      <div aria-hidden="true" className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      <span className="sr-only">Chargement des messages…</span>
    </Card>
  );
}
