import Link from "next/link";

export function ParentNavigation() {
  return (
    <nav aria-label="Navigation parent" className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-foreground hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/parent"
      >
        Mes enfants
      </Link>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary bg-secondary/20 px-4 text-sm font-medium text-foreground hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/parent/messages"
      >
        Messages
      </Link>
    </nav>
  );
}
