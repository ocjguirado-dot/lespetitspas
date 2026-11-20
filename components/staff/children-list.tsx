import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { createClient } from "@/lib/supabase/server";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  section: "bebes" | "moyens" | "grands";
  photo_url: string | null;
};

const sectionLabels: Record<Child["section"], string> = {
  bebes: "Bébés",
  moyens: "Moyens",
  grands: "Grands",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toLocaleUpperCase("fr-FR");
}

export async function ChildrenList() {
  let children: Child[] | null = null;
  let hasError = false;

  try {
    await connection();
    const supabase = await createClient();
    const result = await supabase
      .from("children")
      .select("id, first_name, last_name, section, photo_url")
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true });

    if (result.error) {
      hasError = true;
    } else {
      children = result.data as Child[];
    }
  } catch {
    hasError = true;
  }

  if (hasError || children === null) {
    return (
      <Card className="items-start p-6">
        <p className="font-medium">La liste des enfants n’a pas pu être chargée.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-medium">Aucun enfant n’est inscrit pour le moment.</p>
      </Card>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => {
        const fullName = `${child.first_name} ${child.last_name}`;

        return (
          <li key={child.id}>
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
          </li>
        );
      })}
    </ul>
  );
}
