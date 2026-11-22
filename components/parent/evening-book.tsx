import { Suspense } from "react";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { getEveningBookForToday } from "@/lib/books/store";

function EveningBookLoading() {
  return (
    <Card aria-busy="true" aria-label="Chargement du livre du soir" className="min-w-0 items-start gap-4 p-5 sm:p-6">
      <div className="h-6 w-36 animate-pulse rounded bg-muted" />
      <div className="flex w-full gap-4">
        <div className="h-32 w-24 shrink-0 animate-pulse rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-3 py-2">
          <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}

async function EveningBookContent() {
  await connection();
  const result = await getEveningBookForToday();
  if (result.status === "unavailable") {
    return (
      <Card aria-live="polite" className="min-w-0 items-start gap-2 p-5 sm:p-6" role="status">
        <h3 className="font-heading text-lg font-semibold">Livre du soir</h3>
        <p className="text-sm text-muted-foreground">Suggestion indisponible</p>
      </Card>
    );
  }

  return (
    <Card aria-labelledby="evening-book-heading" className="min-w-0 items-start gap-4 p-5 sm:p-6">
      <h3 className="font-heading text-lg font-semibold" id="evening-book-heading">Livre du soir</h3>
      <div className="flex w-full min-w-0 items-start gap-4">
        {result.book.coverUrl ? (
          // This URL has already been restricted to the Open Library covers host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Couverture de ${result.book.title}`}
            className="h-36 w-24 shrink-0 rounded-md object-cover shadow-sm"
            height={144}
            loading="lazy"
            src={result.book.coverUrl}
            width={96}
          />
        ) : (
          <div aria-label="Couverture non disponible" className="flex h-36 w-24 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" role="img">
            <span aria-hidden="true" className="text-xs text-center">Pas de couverture</span>
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <h4 className="break-words font-medium text-foreground">{result.book.title}</h4>
          <p className="break-words text-sm text-muted-foreground">{result.book.author ?? "Auteur non renseigné"}</p>
        </div>
      </div>
    </Card>
  );
}

export function EveningBook() {
  return (
    <Suspense fallback={<EveningBookLoading />}>
      <EveningBookContent />
    </Suspense>
  );
}

export { EveningBookLoading };
