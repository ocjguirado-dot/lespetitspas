import { expect, test } from "@playwright/test";
import { AUTH, HUGO_ID, JADE_ID, LEA_ID, VISITOR, seedActivity, signedClient, tag } from "./helpers";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const RUN = tag("parent");
const ACTIVITY = `${RUN} activite`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await seedActivity(ACTIVITY, `${RUN} note`);
});

test.describe("Parent Un (Léa et Hugo)", () => {
  test.use({ storageState: AUTH.parent1 });

  test("liste : uniquement ses deux enfants, avec le dernier événement du jour", async ({ page }) => {
    await page.goto("/parent");
    await expect(page.getByRole("heading", { name: "Mes enfants" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir la journée de Léa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir la journée de Hugo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Écrire à l’équipe" })).toHaveCount(2);
    await expect(page.getByRole("link", { name: /Voir la journée de/ })).toHaveCount(2);
    await expect(page.getByText("Jade")).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "Léa" })).toContainText("Activité ·");
  });

  test("timeline de Léa : événement du jour, auteur affiché, retour à aujourd'hui", async ({ page }) => {
    await page.goto(`/parent/children/${LEA_ID}`);
    await expect(page.getByRole("heading", { name: "Journée de Léa" })).toBeVisible();
    const item = page.getByRole("listitem").filter({ hasText: ACTIVITY });
    await expect(item).toContainText("Activité");
    await expect(item).toContainText(`${RUN} note`);
    await expect(item).toContainText("Saisi par Équipe");

    await page.getByLabel("Jour", { exact: true }).fill("2000-01-01");
    await page.getByRole("button", { name: "Afficher" }).click();
    await expect(page).toHaveURL(/date=2000-01-01/);
    await expect(page.getByText("Aucun événement ce jour-là.")).toBeVisible();

    await page.getByRole("link", { name: "Aujourd’hui" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: ACTIVITY })).toBeVisible();
  });

  test("date invalide dans l'URL : retombe sur aujourd'hui sans erreur", async ({ page }) => {
    await page.goto(`/parent/children/${LEA_ID}?date=pas-une-date`);
    await expect(page.getByRole("heading", { name: "Journée de Léa" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: ACTIVITY })).toBeVisible();
  });

  for (const [label, id] of [["enfant d'une autre famille", JADE_ID], ["identifiant inexistant", NIL_UUID], ["identifiant invalide", "abc"]] as const) {
    test(`/parent/children/ : ${label} renvoie vers /parent`, async ({ page }) => {
      await page.goto(`/parent/children/${id}`);
      await expect(page).toHaveURL(/\/parent$/);
      await expect(page.getByText("Jade")).toHaveCount(0);
    });
  }

  test("accès direct à l'API avec ses droits : aucune donnée d'une autre famille", async () => {
    const { supabase } = await signedClient("E2E_PARENT1");
    const children = await supabase.from("children").select("id").eq("id", JADE_ID);
    const events = await supabase.from("events").select("id").eq("child_id", JADE_ID);
    const messages = await supabase.from("messages").select("id").eq("child_id", JADE_ID);
    for (const result of [children, events, messages]) {
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    }
    const forged = await supabase.from("messages").insert({ child_id: JADE_ID, author_id: (await supabase.auth.getUser()).data.user?.id, body: `${RUN} forge`, status: "nouveau" });
    expect(forged.error).not.toBeNull();
  });

  test("formulaire : enfants proposés, présélection par l'URL, bouton bloqué si vide", async ({ page }) => {
    await page.goto(`/parent/messages?child=${HUGO_ID}`);
    const select = page.getByLabel("Enfant concerné");
    await expect(select.locator("option")).toHaveCount(2);
    await expect(select).toHaveValue(HUGO_ID);
    await expect(page.getByText("ne saisissez pas d’information médicale ou sensible")).toBeVisible();
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();
    await expect(page.getByText("0 / 500 caractères")).toBeVisible();
    await page.goto(`/parent/messages?child=${JADE_ID}`);
    await expect(page.getByLabel("Enfant concerné")).not.toHaveValue(JADE_ID);
  });

  test("limite de 500 caractères : 500 acceptés, 501 bloqués avec message", async ({ page }) => {
    await page.goto("/parent/messages");
    const body = page.getByLabel("Votre message");
    await body.fill("x".repeat(501));
    await expect(page.getByText("501 / 500 caractères")).toBeVisible();
    await expect(page.getByText("Le message ne peut pas dépasser 500 caractères.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();
    await body.fill("x".repeat(500));
    await expect(page.getByText("500 / 500 caractères")).toBeVisible();
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeEnabled();
  });

  test("envoi : confirmation, formulaire vidé, historique à jour, texte affiché tel quel, statut Nouveau", async ({ page }) => {
    await page.goto(`/parent/messages?child=${LEA_ID}`);
    const text = `<b>${RUN} message</b>`;
    await page.getByLabel("Votre message").fill(text);
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && !request.url().includes("/__nextjs")) posts.push(request.url());
    });
    await page.getByRole("button", { name: "Envoyer" }).dblclick();
    await expect(page.getByText("Message envoyé à l’équipe.")).toBeVisible();
    await expect(page.getByLabel("Votre message")).toHaveValue("");
    const item = page.getByRole("list", { name: "Messages envoyés à l’équipe" }).getByRole("listitem").filter({ hasText: `${RUN} message` });
    await expect(item).toBeVisible();
    await expect(item).toContainText("Léa Durand");
    await expect(item).toContainText("Nouveau");
    await expect(item).toContainText(text);
    await page.waitForTimeout(1000);
    expect(posts.filter((url) => !url.includes("supabase"))).toHaveLength(1);
  });

  test("côté équipe : le message du parent apparaît dans la liste", async ({ browser }, testInfo) => {
    const { baseURL, extraHTTPHeaders } = testInfo.project.use;
    const context = await browser.newContext({ baseURL, extraHTTPHeaders, storageState: AUTH.staff });
    const page = await context.newPage();
    await page.goto("/staff/messages");
    const item = page.getByRole("listitem").filter({ hasText: `${RUN} message` });
    await expect(item).toContainText("Parent Un");
    await expect(item).toContainText("Léa Durand");
    await expect(item).toContainText("Nouveau");
    await context.close();
  });

  test("navigation : /staff renvoie vers /parent", async ({ page }) => {
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/parent$/);
  });
});

test.describe("Parent Deux (Jade)", () => {
  test.use({ storageState: AUTH.parent2 });

  test("liste : uniquement Jade, aucun enfant de la famille 1", async ({ page }) => {
    await page.goto("/parent");
    await expect(page.getByRole("link", { name: /Voir la journée de/ })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Voir la journée de Jade" })).toBeVisible();
    await expect(page.getByText("Léa")).toHaveCount(0);
    await expect(page.getByText("Hugo")).toHaveCount(0);
  });

  test("l'enfant de la famille 1 renvoie vers /parent et ses données sont invisibles", async ({ page }) => {
    await page.goto(`/parent/children/${LEA_ID}`);
    await expect(page).toHaveURL(/\/parent$/);
    await expect(page.getByText(ACTIVITY)).toHaveCount(0);
  });

  test("historique et formulaire : ni les messages ni les enfants de la famille 1", async ({ page }) => {
    await page.goto(`/parent/messages?child=${LEA_ID}`);
    await expect(page.getByLabel("Enfant concerné").locator("option")).toHaveCount(1);
    await expect(page.getByLabel("Enfant concerné")).toHaveValue(JADE_ID);
    await expect(page.getByText(`${RUN} message`)).toHaveCount(0);
  });

  test("accès direct à l'API : aucune donnée de Léa", async () => {
    const { supabase } = await signedClient("E2E_PARENT2");
    const events = await supabase.from("events").select("id").eq("child_id", LEA_ID);
    const messages = await supabase.from("messages").select("id").eq("child_id", LEA_ID);
    expect(events.data).toHaveLength(0);
    expect(messages.data).toHaveLength(0);
  });
});

test.describe("visiteur", () => {
  test.use({ storageState: VISITOR });
  for (const path of ["/parent/messages", `/parent/children/${LEA_ID}`]) {
    test(`${path} renvoie vers /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});
