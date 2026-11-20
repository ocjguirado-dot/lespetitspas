import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChildSummary, sectionLabels } from "@/components/staff/child-card";
import { RetryChildrenButton } from "@/components/staff/retry-children-button";
import { ChildTimeline, ChildTimelineLoading } from "@/components/staff/child-timeline";
import { AddMealForm } from "@/components/staff/add-meal-form";
import { createClient } from "@/lib/supabase/server";

type FamilyMember = { parent_email: string; parent_id: string | null };
type ParentProfile = { id: string; first_name: string; last_name: string };

export async function ChildDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { id } = await params;
  await connection();

  let child: ChildSummary & { allergies: string | null; medication_authorized: boolean };
  let familyMembers: FamilyMember[];
  let profiles: ParentProfile[] = [];

  try {
    const supabase = await createClient();
    const childResult = await supabase
      .from("children")
      .select("id, first_name, last_name, section, photo_url, allergies, medication_authorized")
      .eq("id", id)
      .maybeSingle();

    if (childResult.error) throw new Error("child-read");
    if (!childResult.data) notFound();
    child = childResult.data as ChildSummary & {
      allergies: string | null;
      medication_authorized: boolean;
    };

    const familyResult = await supabase
      .from("family_members")
      .select("parent_email, parent_id")
      .eq("child_id", id);
    if (familyResult.error) throw new Error("family-read");
    familyMembers = familyResult.data as FamilyMember[];

    const parentIds = [...new Set(familyMembers.flatMap((member) => member.parent_id ? [member.parent_id] : []))];
    if (parentIds.length > 0) {
      const profilesResult = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", parentIds);
      if (profilesResult.error) throw new Error("profile-read");
      profiles = profilesResult.data as ParentProfile[];
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    return (
      <Card className="items-start gap-3 p-6">
        <p className="font-medium">La fiche de l’enfant n’a pas pu être chargée.</p>
        <p className="text-muted-foreground">Vérifiez votre connexion puis réessayez.</p>
        <RetryChildrenButton />
      </Card>
    );
  }

  const fullName = `${child.first_name} ${child.last_name}`;
  const initials = `${child.first_name.trim().charAt(0)}${child.last_name.trim().charAt(0)}`.toLocaleUpperCase("fr-FR");
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        href="/staff"
      >
        Retour à la liste
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {child.photo_url ? (
          // Native img keeps arbitrary stored photo URLs usable without config changes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Photo de ${fullName}`}
            className="size-20 shrink-0 rounded-full object-cover"
            height={80}
            src={child.photo_url}
            width={80}
          />
        ) : (
          <span
            aria-label={`Initiales de ${fullName}`}
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-2xl font-semibold text-primary-foreground"
            role="img"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{fullName}</h1>
          <p className="mt-1 text-muted-foreground">{sectionLabels[child.section]}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="items-start gap-2 p-5">
          <h2 className="font-heading text-lg font-semibold">Allergies</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground">{child.allergies?.trim() || "Aucune allergie renseignée"}</p>
        </Card>
        <Card className="items-start gap-2 p-5">
          <h2 className="font-heading text-lg font-semibold">Autorisation médicament</h2>
          <p className="text-sm text-foreground">{child.medication_authorized ? "Autorisé" : "Non autorisé"}</p>
        </Card>
        <Card className="items-start gap-2 p-5">
          <h2 className="font-heading text-lg font-semibold">Parents rattachés</h2>
          {familyMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun parent rattaché</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {familyMembers.map((member) => {
                const profile = member.parent_id ? profilesById.get(member.parent_id) : undefined;
                return (
                  <li key={`${member.parent_email}-${member.parent_id ?? "pending"}`}>
                    {profile ? <span className="block font-medium">{profile.first_name} {profile.last_name}</span> : null}
                    <span>{member.parent_email}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="items-start gap-2 p-5">
          <h2 className="font-heading text-lg font-semibold">Messages non lus</h2>
          {/* Le compteur reste provisoirement à zéro jusqu’au branchement prévu avec US-18. */}
          <p className="text-sm text-foreground">0</p>
        </Card>
      </div>

      <AddMealForm childId={id} />

      <Suspense fallback={<ChildTimelineLoading />}>
        <ChildTimeline childId={id} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
