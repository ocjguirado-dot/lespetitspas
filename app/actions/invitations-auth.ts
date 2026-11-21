"use server";

import { redirect } from "next/navigation";
import { safeInvitationNext } from "@/lib/email/invitation.mjs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type VerifyInvitationState = { error?: string };

export async function verifyInvitation(
  _previousState: VerifyInvitationState,
  formData: FormData,
): Promise<VerifyInvitationState> {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const next = safeInvitationNext(formData.get("next"));
  if (typeof tokenHash !== "string" || !tokenHash || type !== "invite" || !next) {
    return { error: "Ce lien d’invitation est invalide ou a expiré. Demandez une nouvelle invitation." };
  }

  try {
    const supabase = await createClient();
    const result = await supabase.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
    if (result.error) return { error: "Ce lien d’invitation est invalide ou a expiré. Demandez une nouvelle invitation." };
  } catch {
    return { error: "La vérification du lien est momentanément indisponible. Réessayez." };
  }
  redirect(next);
}

export type SetPasswordState = { error?: string };

export async function setInvitationPassword(
  _previousState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  await requireRole("parent");
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (typeof confirmation !== "string" || confirmation !== password) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: "Le mot de passe n’a pas pu être enregistré. Réessayez." };
  } catch {
    return { error: "Le mot de passe n’a pas pu être enregistré. Réessayez." };
  }
  redirect("/parent");
}
