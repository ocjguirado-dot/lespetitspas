import { Card } from "@/components/ui/card";

export function MessageLoading() {
  return (
    <Card aria-busy="true" aria-label="Chargement du message" className="items-start gap-4 p-5 sm:p-6">
      <div aria-hidden="true" className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="h-4 w-64 animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="h-28 w-full animate-pulse rounded-lg bg-muted" />
      <span className="sr-only">Chargement du message…</span>
    </Card>
  );
}
