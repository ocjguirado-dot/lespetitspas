import { expect, test } from "@playwright/test";
import { getParisDayInterval, getTodayInParis } from "../../lib/dates";
import { AUTH, signedClient } from "./helpers";

test.use({ storageState: AUTH.staff });

async function findChildWithoutEventsToday(): Promise<string> {
  const { supabase } = await signedClient("E2E_STAFF");
  const { start, end } = getParisDayInterval(getTodayInParis());
  const [childrenResult, eventsResult] = await Promise.all([
    supabase.from("children").select("id").order("id"),
    supabase
      .from("events")
      .select("child_id")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
  ]);

  if (childrenResult.error || eventsResult.error) {
    throw new Error("Impossible de trouver un enfant de test sans événement aujourd’hui.");
  }

  const childrenWithEvents = new Set(eventsResult.data.map((event) => event.child_id));
  const child = childrenResult.data.find((candidate) => !childrenWithEvents.has(candidate.id));
  if (!child) throw new Error("Aucun enfant fictif disponible sans événement aujourd’hui.");
  return child.id;
}

test.describe("état vide de la chronologie staff", () => {
  let childId: string;

  test.beforeAll(async () => {
    childId = await findChildWithoutEventsToday();
  });

  test("aujourd’hui, affiche le message et le bouton d’ajout", async ({ page }) => {
    await page.goto(`/staff/children/${childId}`);
    await expect(page.getByText("Aucun événement enregistré aujourd’hui. Ajoutez le premier moment de la journée pour les parents.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ajouter un événement" })).toBeVisible();
  });

  test("le bouton amène au formulaire et focalise le sélecteur Type", async ({ page }) => {
    await page.goto(`/staff/children/${childId}`);
    await page.getByRole("button", { name: "Ajouter un événement" }).click();
    const typeSelect = page.getByLabel("Type", { exact: true });
    await expect(typeSelect).toBeFocused();
    await expect(typeSelect).toBeInViewport();
  });

  test("le bouton est atteignable au clavier et activable avec Entrée", async ({ page }) => {
    await page.goto(`/staff/children/${childId}`);
    const button = page.getByRole("button", { name: "Ajouter un événement" });
    let focused = false;
    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      focused = await button.evaluate((element) => element === document.activeElement);
      if (focused) break;
    }
    expect(focused).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Type", { exact: true })).toBeFocused();
  });

  test("un jour passé vide garde son message sans bouton", async ({ page }) => {
    await page.goto(`/staff/children/${childId}?date=2000-01-01`);
    await expect(page.getByText("Aucun événement ce jour-là.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ajouter un événement" })).toHaveCount(0);
  });
});
