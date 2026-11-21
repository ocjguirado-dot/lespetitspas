"use server";

import { revalidatePath } from "next/cache";
import { validateNapTimes } from "@/lib/events/nap.mjs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const eventTypes = ["repas", "sieste"] as const;
const mealMoments = ["matin", "midi", "gouter"] as const;
const mealQualities = ["tout", "moitie", "peu", "rien"] as const;
const napQualities = ["calme", "agitee", "reveil_precoce"] as const;

type EventType = (typeof eventTypes)[number];
type MealMoment = (typeof mealMoments)[number];
type MealQuality = (typeof mealQualities)[number];
type NapQuality = (typeof napQualities)[number];

export type EventActionState = {
  errors?: { type?: string; moment?: string; qualite?: string; debut?: string; fin?: string; note?: string };
  formError?: string;
  success?: string;
  values?: { type: string; moment?: string; qualite?: string; debut?: string; fin?: string; note: string };
  revision: number;
};

function isOneOf<Value extends string>(value: unknown, values: readonly Value[]): value is Value {
  return typeof value === "string" && values.includes(value as Value);
}

function napErrorMessage(error: "required" | "format" | "not-after-start", field: "debut" | "fin"): string {
  if (error === "not-after-start") return "L’heure de fin doit être strictement après l’heure de début.";
  if (error === "required") return field === "debut" ? "Saisissez une heure de début." : "Saisissez une heure de fin.";
  return `Saisissez une heure ${field === "debut" ? "de début" : "de fin"} au format HH:MM (24 h).`;
}

export async function addEvent(
  childId: string,
  previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  await requireRole("staff");

  const revision = (previousState.revision ?? 0) + 1;
  const rawType = formData.get("type");
  const rawNote = formData.get("note");
  const submittedType = typeof rawType === "string" ? rawType : "";
  const values: NonNullable<EventActionState["values"]> = {
    type: submittedType,
    note: typeof rawNote === "string" ? rawNote : "",
  };

  let rawMoment: FormDataEntryValue | null = null;
  let rawQuality: FormDataEntryValue | null = null;
  let rawDebut: FormDataEntryValue | null = null;
  let rawFin: FormDataEntryValue | null = null;

  if (submittedType === "repas") {
    rawMoment = formData.get("moment");
    rawQuality = formData.get("qualite");
    values.moment = typeof rawMoment === "string" ? rawMoment : "";
    values.qualite = typeof rawQuality === "string" ? rawQuality : "";
  } else if (submittedType === "sieste") {
    rawDebut = formData.get("debut");
    rawFin = formData.get("fin");
    rawQuality = formData.get("qualite");
    values.debut = typeof rawDebut === "string" ? rawDebut : "";
    values.fin = typeof rawFin === "string" ? rawFin : "";
    values.qualite = typeof rawQuality === "string" ? rawQuality : "";
  }

  if (!UUID_PATTERN.test(childId)) {
    return { revision, values, formError: "Impossible d’enregistrer un événement sur cette fiche." };
  }

  const errors: NonNullable<EventActionState["errors"]> = {};
  if (!isOneOf(rawType, eventTypes)) errors.type = "Choisissez un type d’événement valide.";

  let note: string | undefined;
  if (rawNote !== null && typeof rawNote !== "string") {
    errors.note = "La note doit être du texte.";
  } else if (typeof rawNote === "string") {
    const trimmedNote = rawNote.trim();
    if (Array.from(trimmedNote).length > 500) errors.note = "La note ne peut pas dépasser 500 caractères.";
    else if (trimmedNote) note = trimmedNote;
  }

  if (rawType === "repas") {
    if (!isOneOf(rawMoment, mealMoments)) errors.moment = "Choisissez un moment parmi les options proposées.";
    if (!isOneOf(rawQuality, mealQualities)) errors.qualite = "Choisissez une qualité parmi les options proposées.";
  } else if (rawType === "sieste") {
    const debut = typeof rawDebut === "string" ? rawDebut : "";
    const fin = typeof rawFin === "string" ? rawFin : "";
    const timeResult = validateNapTimes(debut, fin);
    if (!timeResult.valid) {
      if (timeResult.errors.debut) errors.debut = napErrorMessage(timeResult.errors.debut, "debut");
      if (timeResult.errors.fin) errors.fin = napErrorMessage(timeResult.errors.fin, "fin");
    }
    if (!isOneOf(rawQuality, napQualities)) errors.qualite = "Choisissez une qualité parmi les options proposées.";
  }

  if (Object.keys(errors).length > 0) return { revision, values, errors };

  let type: EventType;
  let details: Record<string, string>;
  if (rawType === "repas") {
    type = rawType;
    details = {
      moment: rawMoment as MealMoment,
      qualite: rawQuality as MealQuality,
    };
  } else {
    type = rawType as "sieste";
    details = {
      debut: rawDebut as string,
      fin: rawFin as string,
      qualite: rawQuality as NapQuality,
    };
  }

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
      return { revision, values, formError: "Impossible d’enregistrer un événement sur cette fiche." };
    }

    const insertResult = await supabase.from("events").insert({
      child_id: childId,
      author_id: authorId,
      type,
      details,
      ...(note ? { note } : {}),
    });

    if (insertResult.error) {
      return { revision, values, formError: "L’événement n’a pas pu être enregistré. Réessayez." };
    }

    revalidatePath(`/staff/children/${childId}`);
    const success = type === "repas"
      ? "Repas enregistré. Il est daté d’aujourd’hui."
      : "Sieste enregistrée. Elle est datée d’aujourd’hui.";
    return { revision, success };
  } catch {
    return { revision, values, formError: "L’événement n’a pas pu être enregistré. Réessayez." };
  }
}
