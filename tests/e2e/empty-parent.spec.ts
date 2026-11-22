import { expect, test } from "@playwright/test";
import { cleanupTestAccounts, createParentWithoutChildren } from "./helpers";

let testParent: { email: string; password: string };

test.beforeAll(async () => {
  await cleanupTestAccounts();
  testParent = await createParentWithoutChildren();
});

test.afterAll(async () => {
  await cleanupTestAccounts();
});

test("parent sans enfant : accueil, messagerie et historique vides", async ({ browser }, testInfo) => {
  const { baseURL, extraHTTPHeaders } = testInfo.project.use;
  const context = await browser.newContext({ baseURL, extraHTTPHeaders });
  try {
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(testParent.email);
    await page.getByLabel("Mot de passe").fill(testParent.password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/parent$/);

    await expect(page.getByText("Aucun enfant n’est rattaché à votre compte.")).toBeVisible();
    await page.goto("/parent/messages");
    await expect(page.getByText("Aucun enfant n’est rattaché à votre compte.")).toBeVisible();
    await expect(page.getByText("Vous n’avez pas encore envoyé de message à l’équipe.")).toBeVisible();
  } finally {
    await context.close();
  }
});
