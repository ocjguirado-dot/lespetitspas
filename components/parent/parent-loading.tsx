import { Card } from "@/components/ui/card";

export function ParentChildrenLoading() {
  return (
    <div aria-label="Chargement des enfants" aria-live="polite" className="grid gap-4" role="status">
      {[0, 1].map((item) => (
        <Card aria-hidden="true" className="min-h-28 items-start gap-4 p-5 sm:flex-row sm:items-center" key={item}>
          <span className="size-14 animate-pulse rounded-full bg-muted" />
          <span className="h-5 w-32 animate-pulse rounded bg-muted" />
          <span className="h-11 w-full animate-pulse rounded bg-muted sm:ml-auto sm:w-40" />
        </Card>
      ))}
      <span className="sr-only">Chargement de vos enfants…</span>
    </div>
  );
}

export function ParentMessagesLoading() {
  return (
    <div aria-label="Chargement des messages" aria-live="polite" className="space-y-4" role="status">
      <Card aria-hidden="true" className="items-start gap-4 p-5">
        <span className="h-5 w-44 animate-pulse rounded bg-muted" />
        <span className="h-11 w-full animate-pulse rounded bg-muted" />
        <span className="h-32 w-full animate-pulse rounded bg-muted" />
      </Card>
      <Card aria-hidden="true" className="h-28 animate-pulse bg-muted" />
      <span className="sr-only">Chargement de vos messages…</span>
    </div>
  );
}

export function ParentTimelineLoading() {
  return (
    <Card aria-busy="true" aria-label="Chargement de la chronologie" className="items-start gap-4 p-5 sm:p-6">
      <span aria-hidden="true" className="h-6 w-52 animate-pulse rounded bg-muted" />
      <span aria-hidden="true" className="h-11 w-full animate-pulse rounded bg-muted sm:w-80" />
      <span aria-hidden="true" className="h-24 w-full animate-pulse rounded bg-muted" />
      <span className="sr-only">Chargement de la chronologie…</span>
    </Card>
  );
}
