import { expect, test } from "@playwright/test";
import { AUTH, LEA_ID, VISITOR } from "./helpers";

test.describe("titre de connexion", () => {
  test.use({ storageState: VISITOR });

  test("la page de connexion a un seul h1", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test.describe("titres de niveau 1 — équipe", () => {
  test.use({ storageState: AUTH.staff });

  test("les pages équipe ont un seul h1", async ({ page }) => {
    for (const path of ["/staff", `/staff/children/${LEA_ID}`, "/staff/messages"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
    }

    const processedMessage = page.getByRole("listitem").filter({ hasText: "Traité" }).first();
    await expect(processedMessage).toBeVisible();
    const detailPath = await processedMessage.getByRole("link").getAttribute("href");
    expect(detailPath).toBeTruthy();
    await page.goto(detailPath!);
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test.describe("titres de niveau 1 — parent", () => {
  test.use({ storageState: AUTH.parent1 });

  test("les pages parent ont un seul h1", async ({ page }) => {
    for (const path of ["/parent", `/parent/children/${LEA_ID}?date=2000-01-01`, "/parent/messages"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });
});
