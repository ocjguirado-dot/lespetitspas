import { expect, test } from "@playwright/test";
import { AUTH, LEA_ID, VISITOR } from "./helpers";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

test.describe("visiteur non connecté", () => {
  test.use({ storageState: VISITOR });

  for (const path of ["/staff", "/staff/messages", `/staff/children/${LEA_ID}`, "/parent"]) {
    test(`${path} renvoie vers /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("la racine / renvoie vers /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("identifiants invalides : erreur affichée, aucune session créée", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Adresse email").fill("inconnu@example.test");
    await page.getByLabel("Mot de passe").fill("mot-de-passe-invalide");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Connexion impossible")).toBeVisible();
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("compte staff", () => {
  test.use({ storageState: AUTH.staff });

  test("/login et /parent renvoient vers /staff", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/staff$/);
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/staff$/);
  });

  test("la racine / renvoie vers /staff", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/staff$/);
  });

  test("404 : identifiant invalide et UUID inexistant", async ({ page }) => {
    for (const path of ["/staff/messages/abc", `/staff/messages/${NIL_UUID}`, "/staff/children/abc", `/staff/children/${NIL_UUID}`]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    }
  });

  test("le lien « Retour à l'accueil » de la 404 mène à l'espace équipe", async ({ page }) => {
    await page.goto("/staff/messages/abc");
    await page.getByRole("link", { name: "Retour à l’accueil" }).click();
    await expect(page).toHaveURL(/\/staff$/);
  });
});

test.describe("compte parent", () => {
  test.use({ storageState: AUTH.parent1 });

  for (const path of ["/staff", "/staff/messages", `/staff/children/${LEA_ID}`, `/staff/messages/${NIL_UUID}`]) {
    test(`${path} renvoie vers /parent`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/parent$/);
    });
  }

  test("la racine / renvoie vers /parent", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/parent$/);
  });
});
