import { expect, test } from "@playwright/test";
import { AUTH, cleanupTestAccounts, LEA_ID, VISITOR } from "./helpers";

const ADAM_ID = "a90e856e-24f6-4661-9eed-84b7f0c8cccd"; // enfant sans parent rattaché
const invalidLink = "/auth/confirm?token_hash=jeton-invalide&type=invite&next=/auth/set-password";
// Adresse fictive : Supabase crée un compte non confirmé ; l'email part vers EMAIL_TEST_RECIPIENT.
const inviteEmail = `test-e2e-invite-${Date.now()}@example.com`;

test.afterAll(async () => {
  await cleanupTestAccounts();
});

test.describe("invitation d'un parent (équipe)", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: AUTH.staff });

  test("nouvelle adresse : invitation envoyée, parent « En attente », un seul envoi", async ({ page }) => {
    await page.goto(`/staff/children/${ADAM_ID}`);
    await page.getByLabel("Inviter un parent").fill(inviteEmail);
    await page.getByRole("button", { name: /Envoyer l.invitation/ }).dblclick();
    await expect(page.getByText("Invitation envoyée.")).toBeVisible();
    const item = page.getByRole("listitem").filter({ hasText: inviteEmail });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText("En attente");
    // Le lien d'invitation n'est jamais affiché à l'équipe.
    await expect(page.locator("body")).not.toContainText("token_hash");
  });

  test("relance : le bouton « Renvoyer l'invitation » renvoie l'email", async ({ page }) => {
    await page.goto(`/staff/children/${ADAM_ID}`);
    const item = page.getByRole("listitem").filter({ hasText: inviteEmail });
    await item.getByRole("button", { name: /Renvoyer l.invitation/ }).click();
    await expect(page.getByText("Invitation renvoyée.")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: inviteEmail })).toHaveCount(1);
  });

  test("parent déjà actif : message explicite, aucune ligne en trop", async ({ page }) => {
    const parent1 = process.env.E2E_PARENT1_EMAIL;
    if (!parent1) throw new Error("E2E_PARENT1_EMAIL manquante.");
    await page.goto(`/staff/children/${LEA_ID}`);
    const before = await page.getByRole("listitem").filter({ hasText: "@" }).count();
    await page.getByLabel("Inviter un parent").fill(parent1);
    await page.getByRole("button", { name: /Envoyer l.invitation/ }).click();
    await expect(page.getByText("Ce parent a déjà activé son compte.")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "@" })).toHaveCount(before);
  });
});

test.describe("confirmation du lien d'invitation", () => {
  test.use({ storageState: VISITOR });

  test("jeton invalide : message clair, pas de plantage", async ({ page }) => {
    await page.goto(invalidLink);
    await expect(page.getByRole("heading", { name: "Confirmer votre invitation" })).toBeVisible();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText(/invalide ou a expiré/)).toBeVisible();
  });

  test("destination hors /auth/set-password : refusée", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=jeton-invalide&type=invite&next=/staff");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText(/invalide ou a expiré/)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/confirm/);
  });

  test("définition du mot de passe sans session : renvoi vers /login", async ({ page }) => {
    await page.goto("/auth/set-password");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("définition du mot de passe (validation, sans rien enregistrer)", () => {
  test.use({ storageState: AUTH.parent1 });

  test("confirmation différente refusée ; longueur minimale exigée par le formulaire", async ({ page }) => {
    await page.goto("/auth/set-password");
    await expect(page.getByRole("heading", { name: "Créer votre mot de passe" })).toBeVisible();
    const fields = page.locator("input[type=password]");
    await expect(fields.nth(0)).toHaveAttribute("minlength", "8");
    await expect(fields.nth(1)).toHaveAttribute("minlength", "8");
    await fields.nth(0).fill("motdepasse-un");
    await fields.nth(1).fill("motdepasse-deux");
    await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
    await expect(page.getByText("ne correspondent pas")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/set-password/);
  });
});

test.describe("accès équipe seulement", () => {
  test.use({ storageState: AUTH.staff });

  test("un compte équipe sur /auth/set-password est renvoyé vers /staff", async ({ page }) => {
    await page.goto("/auth/set-password");
    await expect(page).toHaveURL(/\/staff/);
  });
});
