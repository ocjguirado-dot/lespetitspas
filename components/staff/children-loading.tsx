export function ChildrenLoading() {
  return (
    <div
      aria-label="Chargement des enfants"
      aria-live="polite"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          aria-hidden="true"
          className="flex min-h-24 items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          key={index}
        >
          <div className="size-14 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Chargement de la liste des enfants…</span>
    </div>
  );
}
