export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div
        className="flex flex-col items-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary"
        />
        <p className="text-sm font-medium text-muted-foreground">
          Chargement en cours…
        </p>
        <span className="sr-only">Veuillez patienter.</span>
      </div>
    </main>
  );
}
