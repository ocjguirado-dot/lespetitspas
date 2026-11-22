import assert from "node:assert/strict";
import test from "node:test";
import { buildOpenLibrarySearchUrl, searchOpenLibrary } from "./search.mjs";

const book = { key: "/works/OL123W", title: "Livre", author_name: ["Auteur"], cover_i: 9 };

test("construit la recherche jeunesse française avec les champs et la limite demandés", () => {
  const url = buildOpenLibrarySearchUrl("https://openlibrary.org/");
  assert.equal(url.origin, "https://openlibrary.org");
  assert.equal(url.pathname, "/search.json");
  assert.match(url.searchParams.get("q"), /Bedtime/u);
  assert.match(url.searchParams.get("q"), /language:fre/u);
  assert.equal(url.searchParams.get("lang"), "fr");
  assert.equal(url.searchParams.get("fields"), "key,title,author_name,cover_i");
  assert.equal(url.searchParams.get("limit"), "20");
  assert.equal(buildOpenLibrarySearchUrl("javascript:alert(1)"), null);
});

test("utilise la réponse simulée et renvoie un livre normalisé", async () => {
  let requestUrl;
  let requestOptions;
  const result = await searchOpenLibrary({
    baseUrl: "https://openlibrary.org",
    date: "2026-11-21",
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return { ok: true, json: async () => ({ docs: [book] }) };
    },
  });

  assert.equal(result.status, "ok");
  assert.equal(result.book.title, "Livre");
  assert.equal(new URL(requestUrl).searchParams.get("limit"), "20");
  assert.equal(requestOptions.signal instanceof AbortSignal, true);
  assert.equal(requestOptions.cache, "no-store");
  assert.match(requestOptions.headers["User-Agent"], /LesPetitsPas/u);
});

test("classe un délai dépassé sans propager l'exception", async () => {
  const result = await searchOpenLibrary({
    baseUrl: "https://openlibrary.org",
    date: "2026-11-21",
    fetchImpl: async () => { throw Object.assign(new Error("timeout"), { name: "TimeoutError" }); },
  });
  assert.deepEqual(result, { status: "unavailable", code: "timeout" });
});

test("classe une réponse HTTP 500 et un JSON invalide", async () => {
  const httpResult = await searchOpenLibrary({
    baseUrl: "https://openlibrary.org",
    date: "2026-11-21",
    fetchImpl: async () => ({ ok: false, status: 500 }),
  });
  const jsonResult = await searchOpenLibrary({
    baseUrl: "https://openlibrary.org",
    date: "2026-11-21",
    fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid"); } }),
  });
  assert.deepEqual(httpResult, { status: "unavailable", code: "http" });
  assert.deepEqual(jsonResult, { status: "unavailable", code: "invalid-json" });
});

test("retourne indisponible quand aucun résultat valide n'est fourni", async () => {
  const result = await searchOpenLibrary({
    baseUrl: "https://openlibrary.org",
    date: "2026-11-21",
    fetchImpl: async () => ({ ok: true, json: async () => ({ docs: [{ key: "/works/OL1W" }] }) }),
  });
  assert.deepEqual(result, { status: "unavailable", code: "no-results" });
});
