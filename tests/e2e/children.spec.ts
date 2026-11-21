import { expect, test } from "@playwright/test";
import { AUTH, HUGO_ID, LEA_ID } from "./helpers";

test.use({ storageState: AUTH.staff });

test.describe("liste des enfants", () => {
  test("affiche les 30 enfants", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByText("30 enfants affichés sur 30")).toBeVisible();
  });

  test("recherche sans accent ni casse, puis effacement des filtres", async ({ page }) => {
    await page.goto("/staff");
    await page.getByLabel("Rechercher un enfant").fill("LEA durand");
    await expect(page.getByRole("link", { name: /Ouvrir la fiche de Léa Durand/ })).toBeVisible();
    await expect(page.getByText("1 enfant affiché sur 30")).toBeVisible();

    await page.getByLabel("Rechercher un enfant").fill("zzzzzz");
    await expect(page.getByText("Aucun enfant ne correspond à votre recherche.")).toBeVisible();
    await page.getByRole("button", { name: "Effacer les filtres" }).click();
    await expect(page.getByText("30 enfants affichés sur 30")).toBeVisible();
  });

  test("filtre par section", async ({ page }) => {
    await page.goto("/staff");
    const bebes = page.getByRole("button", { name: "Bébés" });
    await bebes.click();
    await expect(bebes).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/^\d+ enfants? affichés? sur 30$/)).not.toHaveText("30 enfants affichés sur 30");
    await expect(page.getByRole("link", { name: /Ouvrir la fiche de Léa Durand, section Bébés/ })).toBeVisible();
    await page.getByRole("button", { name: "Toutes" }).click();
    await expect(page.getByText("30 enfants affichés sur 30")).toBeVisible();
  });
});

test.describe("fiche enfant", () => {
  test("ouverture depuis la liste : informations et autorisation médicament", async ({ page }) => {
    await page.goto("/staff");
    await page.getByRole("link", { name: /Ouvrir la fiche de Léa Durand/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Léa Durand" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Parents rattachés" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Autorisation médicament" }).locator("xpath=..").getByText("Autorisé", { exact: true }),
    ).toBeVisible();
  });

  test("Hugo : médicament non autorisé", async ({ page }) => {
    await page.goto(`/staff/children/${HUGO_ID}`);
    await expect(
      page.getByRole("heading", { name: "Autorisation médicament" }).locator("xpath=..").getByText("Non autorisé"),
    ).toBeVisible();
  });

  test("la fiche affiche la chronologie du jour et le formulaire", async ({ page }) => {
    await page.goto(`/staff/children/${LEA_ID}`);
    await expect(page.getByRole("heading", { name: "Chronologie du jour" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ajouter un événement" })).toBeVisible();
  });
});
