import { expect, test, type Page } from "@playwright/test";
import { AUTH, HUGO_ID, LEA_ID, tag } from "./helpers";

test.use({ storageState: AUTH.staff });

const entry = (page: Page, text: string) => page.getByRole("listitem").filter({ hasText: text });
const success = (page: Page, text: string) => page.getByRole("status").filter({ hasText: text });

async function openForm(page: Page, childId = LEA_ID) {
  await page.goto(`/staff/children/${childId}`);
  await expect(page.getByRole("heading", { name: "Ajouter un événement" })).toBeVisible();
}

test.describe("saisie d'événements (fiche de Léa)", () => {
  test("repas : saisie valide, affichage dans la chronologie, auteur", async ({ page }) => {
    const note = tag("repas");
    await openForm(page);
    await page.getByLabel("Moment").selectOption("matin");
    await page.getByLabel("Qualité").selectOption("tout");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByRole("button", { name: "Enregistrer le repas" }).click();
    await expect(success(page, "Repas enregistré")).toBeVisible();
    const item = entry(page, note);
    await expect(item).toHaveCount(1);
    await expect(item).toContainText("Repas");
    await expect(item).toContainText("Matin");
    await expect(item).toContainText("Saisi par");
  });

  test("repas : champs obligatoires manquants, rien n'est enregistré", async ({ page }) => {
    await openForm(page);
    await page.getByRole("button", { name: "Enregistrer le repas" }).click();
    await expect(page.locator("p[role=alert]").first()).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "enregistré" })).toHaveCount(0);
  });

  test("repas : double clic = un seul événement", async ({ page }) => {
    const note = tag("double");
    await openForm(page);
    await page.getByLabel("Moment").selectOption("midi");
    await page.getByLabel("Qualité").selectOption("moitie");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByRole("button", { name: "Enregistrer le repas" }).dblclick();
    await expect(success(page, "Repas enregistré")).toBeVisible();
    await expect(entry(page, note)).toHaveCount(1);
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(entry(page, note)).toHaveCount(1);
  });

  test("sieste : horaires et qualité", async ({ page }) => {
    const note = tag("sieste");
    await openForm(page);
    await page.getByLabel("Type", { exact: true }).selectOption("sieste");
    await page.getByLabel("Heure de début").fill("13:00");
    await page.getByLabel("Heure de fin").fill("14:30");
    await page.getByLabel("Qualité").selectOption("calme");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByRole("button", { name: "Enregistrer la sieste" }).click();
    await expect(success(page, "Sieste enregistrée")).toBeVisible();
    await expect(entry(page, note)).toContainText("de 13:00 à 14:30");
  });

  test("activité : nom saisi", async ({ page }) => {
    const note = tag("activite");
    await openForm(page);
    await page.getByLabel("Type", { exact: true }).selectOption("activite");
    await page.getByLabel("Nom de l'activité").fill("Peinture fictive");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByRole("button", { name: "Enregistrer l’activité" }).click();
    await expect(success(page, "Activité enregistrée")).toBeVisible();
    await expect(entry(page, note)).toContainText("Peinture fictive");
  });

  test("incident : type et gravité affichés", async ({ page }) => {
    const note = tag("incident");
    await openForm(page);
    await page.getByLabel("Type", { exact: true }).selectOption("incident");
    await page.getByLabel("Type d'incident").selectOption("chute");
    await page.getByLabel("Gravité").selectOption("urgent");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByRole("button", { name: "Enregistrer l’incident" }).click();
    await expect(success(page, "Incident enregistré")).toBeVisible();
    await expect(entry(page, note)).toContainText("Chute");
    await expect(entry(page, note)).toContainText("Gravité : Urgent");
  });

  test("médicament (enfant autorisé) : bouton bloqué jusqu'à la case, puis enregistré", async ({ page }) => {
    const note = tag("medic-lea");
    await openForm(page);
    await page.getByLabel("Type", { exact: true }).selectOption("medicament");
    const submit = page.getByRole("button", { name: "Enregistrer le médicament" });
    await expect(submit).toBeDisabled();
    await page.getByLabel("Nom du médicament").fill("Sirop fictif");
    await page.getByLabel("Dose", { exact: true }).fill("5 ml");
    await page.getByLabel("Heure", { exact: true }).fill("10:30");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByLabel("Autorisation parentale confirmée").check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(success(page, "Médicament enregistré")).toBeVisible();
    await expect(entry(page, note)).toContainText("Autorisation parentale confirmée");
  });
});

test.describe("médicament pour un enfant non autorisé (Hugo)", () => {
  test("refus côté serveur, rien n'est écrit", async ({ page }) => {
    const note = tag("medic-hugo");
    await openForm(page, HUGO_ID);
    await page.getByLabel("Type", { exact: true }).selectOption("medicament");
    await page.getByLabel("Nom du médicament").fill("Sirop fictif");
    await page.getByLabel("Dose", { exact: true }).fill("5 ml");
    await page.getByLabel("Heure", { exact: true }).fill("10:30");
    await page.getByLabel("Note (facultative)").fill(note);
    await page.getByLabel("Autorisation parentale confirmée").check();
    await page.getByRole("button", { name: "Enregistrer le médicament" }).click();
    await expect(page.getByText("Enregistrement refusé")).toBeVisible();
    await page.reload();
    await expect(entry(page, note)).toHaveCount(0);
  });
});
