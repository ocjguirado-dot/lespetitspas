import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1
          id="not-found-title"
          className="mt-2 text-xl font-semibold tracking-tight"
        >
          Page introuvable
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          La page demandée n’existe pas ou n’est plus disponible.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          href="/"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
