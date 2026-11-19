"use client";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="error-title"
        className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm sm:p-8"
      >
        <h1 id="error-title" className="text-xl font-semibold tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Impossible de charger cette page pour le moment. Vérifiez votre
          connexion, puis réessayez.
        </p>
        <button
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={retry}
          type="button"
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}
