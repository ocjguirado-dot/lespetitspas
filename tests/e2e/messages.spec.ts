import { expect, test } from "@playwright/test";
import { AUTH, seedMessage, tag, unreadCount } from "./helpers";

test.describe.configure({ mode: "serial" });
test.use({ storageState: AUTH.staff });

const RUN = tag("msg");
const ids = { a: "", c: "", x: "" };
const markButton = "Marquer comme traité";

test.beforeAll(async () => {
  ids.a = await seedMessage(`${RUN} A`);
  ids.c = await seedMessage(`${RUN} C`);
  ids.x = await seedMessage(`<b>${RUN} balise</b>`);
});

test("liste : le message du parent apparaît avec le badge « Nouveau »", async ({ page }) => {
  await page.goto("/staff/messages");
  const item = page.getByRole("listitem").filter({ hasText: `${RUN} A` });
  await expect(item).toContainText("Parent Un");
  await expect(item).toContainText("Léa Durand");
  await expect(item).toContainText("Nouveau");
});

test("ouverture : passe à « Lu », le bouton apparaît, le compteur baisse de 1", async ({ page }) => {
  const before = await unreadCount(page);
  await page.goto(`/staff/messages/${ids.a}`);
  await expect(page.getByText("Lu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: markButton })).toBeVisible();
  expect(await unreadCount(page)).toBe(before - 1);
});

test("« Marquer comme traité » : badge Traité, bouton retiré, compteur inchangé, liste à jour", async ({ page }) => {
  const before = await unreadCount(page);
  await page.goto(`/staff/messages/${ids.a}`);
  await page.getByRole("button", { name: markButton }).click();
  await expect(page.getByText("Traité", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: markButton })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Traité", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: markButton })).toHaveCount(0);
  expect(await unreadCount(page)).toBe(before);
  await page.goto("/staff/messages");
  await expect(page.getByRole("listitem").filter({ hasText: `${RUN} A` })).toContainText("Traité");
});

test("double clic sur « Marquer comme traité » : une seule requête d'écriture", async ({ page }) => {
  await page.goto(`/staff/messages/${ids.c}`);
  await expect(page.getByText("Lu", { exact: true })).toBeVisible();
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && !request.url().includes("/__nextjs")) posts.push(request.url());
  });
  await page.getByRole("button", { name: markButton }).dblclick();
  await expect(page.getByText("Traité", { exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  expect(posts).toHaveLength(1);
});

test("le texte d'un message est affiché tel quel (balises HTML non interprétées)", async ({ page }) => {
  await page.goto(`/staff/messages/${ids.x}`);
  await expect(page.getByText(`<b>${RUN} balise</b>`)).toBeVisible();
  await expect(page.locator("main b")).toHaveCount(0);
});

test("un parent ne peut pas ouvrir la page d'un message côté équipe", async ({ browser }) => {
  const context = await browser.newContext({ storageState: AUTH.parent1 });
  const page = await context.newPage();
  await page.goto(`/staff/messages/${ids.a}`);
  await expect(page).toHaveURL(/\/parent$/);
  await context.close();
});
