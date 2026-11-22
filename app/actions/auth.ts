"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const INVALID_CREDENTIALS = "Email ou mot de passe incorrect.";
const UNAVAILABLE = "La connexion est momentanément indisponible. Réessayez.";

export async function signIn(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const configAvailable = Boolean(getSupabaseConfig());

  if (!configAvailable) return { error: UNAVAILABLE };

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return { error: INVALID_CREDENTIALS };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  let userId: string;

  try {
    supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) return { error: INVALID_CREDENTIALS };

    userId = data.user.id;
  } catch {
    return { error: UNAVAILABLE };
  }

  let role: unknown;

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    role = profile?.role;
  } catch {
    try {
      await supabase.auth.signOut();
    } catch {
      // Les détails techniques ne sont jamais affichés au formulaire.
    }
    return { error: UNAVAILABLE };
  }

  if (role !== "staff" && role !== "parent") {
    try {
      await supabase.auth.signOut();
    } catch {
      // Le message reste générique si le profil ne peut pas être vérifié.
    }
    return { error: UNAVAILABLE };
  }

  redirect(role === "staff" ? "/staff" : "/parent");
}

export async function signOut() {
  if (getSupabaseConfig()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Retourner à la page de connexion même si le service est indisponible.
    }
  }

  redirect("/login");
}
