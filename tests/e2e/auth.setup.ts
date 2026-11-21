import { expect, test as setup } from "@playwright/test";

const accounts = [
  { name: "staff", prefix: "E2E_STAFF", url: /\/staff/ },
  { name: "parent1", prefix: "E2E_PARENT1", url: /\/parent/ },
  { name: "parent2", prefix: "E2E_PARENT2", url: /\/parent/ },
];

for (const account of accounts) {
  setup(`connexion ${account.name}`, async ({ page }) => {
    const email = process.env[`${account.prefix}_EMAIL`];
    const password = process.env[`${account.prefix}_PASSWORD`];
    if (!email || !password) {
      throw new Error(`${account.prefix}_EMAIL / ${account.prefix}_PASSWORD manquants dans .env.test.local`);
    }
    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(account.url);
    await page.context().storageState({ path: `.auth/${account.name}.json` });
  });
}
