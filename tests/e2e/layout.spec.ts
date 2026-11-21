import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { AUTH, LEA_ID, VISITOR, seedMessage, tag } from "./helpers";

async function checkLayout(page: Page, testInfo: TestInfo, name: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `débordement horizontal sur ${name}`).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/shots/${testInfo.project.name}-${name}.png`, fullPage: true });
}

test.describe("écran de connexion", () => {
  test.use({ storageState: VISITOR });
  test("pas de débordement", async ({ page }, testInfo) => {
    await page.goto("/login");
    await expect(page.getByLabel("Adresse email")).toBeVisible();
    await checkLayout(page, testInfo, "login");
  });
});

test.describe("espace équipe", () => {
  test.use({ storageState: AUTH.staff });
  let messageId = "";

  test.beforeAll(async () => {
    messageId = await seedMessage(`${tag("layout")} message pour contrôle d'affichage`);
  });

  test("liste des enfants", async ({ page }, testInfo) => {
    await page.goto("/staff");
    await expect(page.getByText("30 enfants affichés sur 30")).toBeVisible();
    await checkLayout(page, testInfo, "staff-liste");
  });

  test("fiche enfant et formulaire médicament", async ({ page }, testInfo) => {
    await page.goto(`/staff/children/${LEA_ID}`);
    await expect(page.getByRole("heading", { name: "Chronologie du jour" })).toBeVisible();
    await checkLayout(page, testInfo, "staff-fiche");
    await page.getByLabel("Type", { exact: true }).selectOption("medicament");
    await expect(page.getByLabel("Nom du médicament")).toBeVisible();
    await checkLayout(page, testInfo, "staff-fiche-medicament");
  });

  test("liste des messages", async ({ page }, testInfo) => {
    await page.goto("/staff/messages");
    await expect(page.getByText("Messages des parents")).toBeVisible();
    await checkLayout(page, testInfo, "staff-messages");
  });

  test("détail d'un message (bouton visible)", async ({ page }, testInfo) => {
    await page.goto(`/staff/messages/${messageId}`);
    await expect(page.getByRole("button", { name: "Marquer comme traité" })).toBeVisible();
    await checkLayout(page, testInfo, "staff-message-detail");
  });
});
