import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";

export const LEA_ID = "4ae88cb7-27ef-4eab-ad19-876e25dbc123"; // autorisée pour les médicaments
export const HUGO_ID = "4b3b0d2b-971a-48fb-8bfb-d9cebd02eb46"; // non autorisé
export const AUTH = {
  staff: ".auth/staff.json",
  parent1: ".auth/parent1.json",
  parent2: ".auth/parent2.json",
};
export const VISITOR = { cookies: [], origins: [] };

/** Étiquette unique par exécution : sert à retrouver (et à nettoyer) les données de test. */
export function tag(label: string) {
  return `TEST-E2E-${label}-${Date.now()}`;
}

/** Crée un message « nouveau » au nom de Parent Un pour Léa, via l'API avec ses droits (RLS). */
export async function seedMessage(body: string, childId = LEA_ID): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.E2E_PARENT1_EMAIL;
  const password = process.env.E2E_PARENT1_PASSWORD;
  if (!url || !key || !email || !password) {
    throw new Error("Variables Supabase ou E2E_PARENT1_* manquantes (.env.local / .env.test.local).");
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !auth.user) throw new Error("Connexion du parent de test impossible.");
  const { data, error } = await supabase
    .from("messages")
    .insert({ child_id: childId, author_id: auth.user.id, body, status: "nouveau" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Création du message de test impossible : ${error?.message}`);
  return data.id as string;
}

/** Lit le compteur « Messages non lus » de la fiche de Léa. */
export async function unreadCount(page: Page): Promise<number> {
  await page.goto(`/staff/children/${LEA_ID}`);
  const value = page
    .getByRole("heading", { name: "Messages non lus" })
    .locator("xpath=..")
    .locator("p");
  await expect(value).toHaveText(/^\d+$/);
  return Number(await value.innerText());
}
