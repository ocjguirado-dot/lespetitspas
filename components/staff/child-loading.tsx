export function ChildLoading() {
  return (
    <div
      aria-label="Chargement de la fiche"
      aria-live="polite"
      className="h-5 w-64 max-w-full animate-pulse rounded bg-muted"
      role="status"
    >
      <span className="sr-only">Chargement de la fiche de l’enfant…</span>
    </div>
  );
}
