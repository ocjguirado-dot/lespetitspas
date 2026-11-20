"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mealMoments = ["matin", "midi", "gouter"] as const;
const mealQualities = ["tout", "moitie", "peu", "rien"] as const;

type MealMoment = (typeof mealMoments)[number];
type MealQuality = (typeof mealQualities)[number];

export type MealActionState = {
  errors?: { moment?: string; qualite?: string; note?: string };
  formError?: string;
  success?: string;
  values?: { moment: string; qualite: string; note: string };
  revision: number;
};

function isOneOf<Value extends string>(value: unknown, values: readonly Value[]): value is Value {
  return typeof value === "string" && values.includes(value as Value);
}

export async function addMeal(
  childId: string,
  previousState: MealActionState,
  formData: FormData,
): Promise<MealActionState> {
  await requireRole("staff");

  const revision = (previousState.revision ?? 0) + 1;
  const rawMoment = formData.get("moment");
  const rawQuality = formData.get("qualite");
  const rawNote = formData.get("note");
  const values = {
    moment: typeof rawMoment === "string" ? rawMoment : "",
    qualite: typeof rawQuality === "string" ? rawQuality : "",
    note: typeof rawNote === "string" ? rawNote : "",
  };

  if (!UUID_PATTERN.test(childId)) {
    return { revision, values, formError: "Impossible d’enregistrer un repas sur cette fiche." };
  }

  const errors: NonNullable<MealActionState["errors"]> = {};

  if (!isOneOf(rawMoment, mealMoments)) {
    errors.moment = "Choisissez un moment parmi les options proposées.";
  }
  if (!isOneOf(rawQuality, mealQualities)) {
    errors.qualite = "Choisissez une qualité parmi les options proposées.";
  }

  let note: string | undefined;
  if (rawNote !== null && typeof rawNote !== "string") {
    errors.note = "La note doit être du texte.";
  } else if (typeof rawNote === "string") {
    const trimmedNote = rawNote.trim();
    if (Array.from(trimmedNote).length > 500) {
      errors.note = "La note ne peut pas dépasser 500 caractères.";
    } else if (trimmedNote) {
      note = trimmedNote;
    }
  }

  if (Object.keys(errors).length > 0) return { revision, values, errors };

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    const authorId = authData?.claims?.sub;
    if (authError || typeof authorId !== "string") {
      return { revision, values, formError: "Votre session ne permet pas cet enregistrement. Reconnectez-vous puis réessayez." };
    }

    const childResult = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .maybeSingle();
    if (childResult.error || !childResult.data) {
      return { revision, values, formError: "Impossible d’enregistrer un repas sur cette fiche." };
    }

    const eventDetails = {
      moment: rawMoment as MealMoment,
      qualite: rawQuality as MealQuality,
    };
    const insertResult = await supabase.from("events").insert({
      child_id: childId,
      author_id: authorId,
      type: "repas",
      details: eventDetails,
      ...(note ? { note } : {}),
    });

    if (insertResult.error) {
      return { revision, values, formError: "Le repas n’a pas pu être enregistré. Réessayez." };
    }

    revalidatePath(`/staff/children/${childId}`);
    return { revision, success: "Repas enregistré. Il est daté d’aujourd’hui." };
  } catch {
    return { revision, values, formError: "Le repas n’a pas pu être enregistré. Réessayez." };
  }
}
