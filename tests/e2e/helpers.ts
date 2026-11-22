import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export const LEA_ID = "4ae88cb7-27ef-4eab-ad19-876e25dbc123"; // autorisée pour les médicaments
export const HUGO_ID = "4b3b0d2b-971a-48fb-8bfb-d9cebd02eb46"; // non autorisé
export const JADE_ID = "c968bea7-14fe-4ed9-a0b1-7470e1d36a29"; // enfant de Parent Deux
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

function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase de test manquantes.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Crée un compte parent isolé pour vérifier les états sans rattachement. */
export async function createParentWithoutChildren() {
  const supabase = serviceRoleClient();
  const email = `${tag("parent-vide")}@example.test`;
  const password = `E2E-${randomUUID()}-Aa1!`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("Création du compte parent de test impossible.");
  return { email, password };
}

/** Supprime les rattachements et comptes de test, uniquement pour le préfixe TEST-E2E-. */
export async function cleanupTestAccounts() {
  const supabase = serviceRoleClient();
  const matchingUsers: Array<{ id: string }> = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Nettoyage des comptes de test impossible.");
    const users = data.users;
    matchingUsers.push(...users.flatMap((user) => {
      const email = user.email?.toLowerCase();
      return email?.startsWith("test-e2e-") ? [{ id: user.id }] : [];
    }));
    if (users.length < 1000) break;
  }

  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, parent_email");
  if (membersError) throw new Error("Nettoyage des rattachements de test impossible.");
  for (const member of members) {
    if (member.parent_email?.toLowerCase().startsWith("test-e2e-")) {
      const { error } = await supabase.from("family_members").delete().eq("id", member.id);
      if (error) throw new Error("Nettoyage des rattachements de test impossible.");
    }
  }
  for (const user of matchingUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error("Nettoyage des comptes de test impossible.");
  }

  const { data: remainingMembers, error: verifyMembersError } = await supabase
    .from("family_members")
    .select("id, parent_email")
    .ilike("parent_email", "test-e2e-%");
  const { data: remainingProfiles, error: verifyProfilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", "test-e2e-%");
  if (verifyMembersError || verifyProfilesError || remainingMembers.length > 0 || remainingProfiles.length > 0) {
    throw new Error("La vérification du nettoyage des données de test a échoué.");
  }
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || data.users.some((user) => user.email?.toLowerCase().startsWith("test-e2e-"))) {
      throw new Error("La vérification du nettoyage des comptes de test a échoué.");
    }
    if (data.users.length < 1000) break;
  }
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

/** Client Supabase connecté avec les droits (RLS) d'un compte de test, sans service_role. */
export async function signedClient(prefix: "E2E_STAFF" | "E2E_PARENT1" | "E2E_PARENT2") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!url || !key || !email || !password) throw new Error(`Variables Supabase ou ${prefix}_* manquantes.`);
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Connexion ${prefix} impossible.`);
  return { supabase, userId: data.user.id };
}

/** Crée une activité du jour pour un enfant, au nom du compte staff (RLS). */
export async function seedActivity(name: string, note: string, childId = LEA_ID): Promise<string> {
  const { supabase, userId } = await signedClient("E2E_STAFF");
  const { data, error } = await supabase
    .from("events")
    .insert({ child_id: childId, author_id: userId, type: "activite", details: { nom: name }, note })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Création de l'événement de test impossible : ${error?.message}`);
  return data.id as string;
}
