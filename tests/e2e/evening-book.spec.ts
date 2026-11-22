import { expect, test, type Page } from "@playwright/test";
import { AUTH, JADE_ID, LEA_ID } from "./helpers";

// Le bonus dépend d'une API externe : les tests vérifient les deux issues possibles
// (un livre ou « Suggestion indisponible ») sans jamais exiger que l'API réponde.
// Les cas limites (aucun résultat, donnée manquante, délai dépassé) sont couverts par les tests unitaires.
test.describe.configure({ mode: "serial" });

let sharedSuggestion = "";

async function readSuggestion(page: Page, childId: string) {
  await page.goto(`/parent/children/${childId}`);
  await expect(page.getByRole("heading", { name: /Journée de/ })).toBeVisible();
  const title = page.getByRole("heading", { name: "Livre du soir" });
  await expect(title).toBeVisible();
  const card = title.locator("xpath=..");
  await expect(card.getByRole("heading", { level: 4 }).or(card.getByText("Suggestion indisponible"))).toBeVisible();
  return (await card.innerText()).replace(/\s+/g, " ").trim();
}

test.describe("Parent Un (Léa et Hugo)", () => {
  test.use({ storageState: AUTH.parent1 });

  test("aujourd'hui : un livre ou « Suggestion indisponible », la timeline reste utilisable", async ({ page }) => {
    sharedSuggestion = await readSuggestion(page, LEA_ID);
    await expect(page.getByLabel("Jour", { exact: true })).toBeVisible();
    expect(sharedSuggestion).not.toMatch(/undefined|null|erreur/i);
  });

  test("second chargement le même jour : même suggestion (lecture en base)", async ({ page }) => {
    const again = await readSuggestion(page, LEA_ID);
    // Si l'API externe était indisponible au premier chargement, rien n'a été mis en cache : pas de comparaison.
    test.skip(sharedSuggestion.includes("Suggestion indisponible"), "API Open Library indisponible lors du premier chargement");
    expect(again).toBe(sharedSuggestion);
  });

  test("autre date : pas d'encart « Livre du soir »", async ({ page }) => {
    await page.goto(`/parent/children/${LEA_ID}?date=2000-01-01`);
    await expect(page.getByText("Aucun événement ce jour-là.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Livre du soir" })).toHaveCount(0);
  });
});

test.describe("Parent Deux (Jade)", () => {
  test.use({ storageState: AUTH.parent2 });

  test("la suggestion du jour est commune à toutes les familles", async ({ page }) => {
    const other = await readSuggestion(page, JADE_ID);
    test.skip(sharedSuggestion.includes("Suggestion indisponible"), "API Open Library indisponible lors du premier chargement");
    expect(other).toBe(sharedSuggestion);
  });
});
