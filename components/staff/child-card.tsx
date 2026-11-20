import Link from "next/link";
import { Card } from "@/components/ui/card";

export type ChildSummary = {
  id: string;
  first_name: string;
  last_name: string;
  section: "bebes" | "moyens" | "grands";
  photo_url: string | null;
};

export const sectionLabels: Record<ChildSummary["section"], string> = {
  bebes: "Bébés",
  moyens: "Moyens",
  grands: "Grands",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toLocaleUpperCase("fr-FR");
}

export function ChildCard({ child }: { child: ChildSummary }) {
  const fullName = `${child.first_name} ${child.last_name}`;

  return (
    <Link
      aria-label={`Ouvrir la fiche de ${fullName}, section ${sectionLabels[child.section]}`}
      className="block min-h-24 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={`/staff/children/${child.id}`}
    >
      <Card className="min-h-24 flex-row items-center gap-4 p-4 transition-colors hover:bg-muted/50">
        {child.photo_url ? (
          // Native img keeps arbitrary stored photo URLs usable without config changes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Photo de ${fullName}`}
            className="size-14 shrink-0 rounded-full object-cover"
            height={56}
            src={child.photo_url}
            width={56}
          />
        ) : (
          <span
            aria-label={`Initiales de ${fullName}`}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground"
            role="img"
          >
            {getInitials(child.first_name, child.last_name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate font-heading text-base font-semibold text-foreground">
            {child.first_name}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {sectionLabels[child.section]}
          </span>
        </span>
      </Card>
    </Link>
  );
}
