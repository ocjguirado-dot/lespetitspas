import assert from "node:assert/strict";
import test from "node:test";
import { buildOpenLibraryCoverUrl, chooseDailyBook, isOpenLibraryCoverUrl, normalizeOpenLibraryBook } from "./catalog.mjs";

test("normalise un résultat valide et construit une couverture Open Library", () => {
  assert.deepEqual(normalizeOpenLibraryBook({
    key: "/works/OL123W",
    title: "  Le petit livre  ",
    author_name: ["  Camille Auteur ", "Autre auteur"],
    cover_i: 42,
  }), {
    key: "/works/OL123W",
    title: "Le petit livre",
    author: "Camille Auteur",
    coverUrl: "https://covers.openlibrary.org/b/id/42-M.jpg",
  });
});

test("rejette un résultat sans titre et accepte auteur et couverture absents", () => {
  assert.equal(normalizeOpenLibraryBook({ key: "/works/OL1W", title: "  " }), null);
  assert.deepEqual(normalizeOpenLibraryBook({ key: "/works/OL2W", title: "Sans métadonnées" }), {
    key: "/works/OL2W",
    title: "Sans métadonnées",
    author: null,
    coverUrl: null,
  });
});

test("n'accepte que les URL HTTPS du domaine et du chemin des couvertures", () => {
  assert.equal(isOpenLibraryCoverUrl("http://covers.openlibrary.org/b/id/12-M.jpg"), false);
  assert.equal(isOpenLibraryCoverUrl("https://example.test/b/id/12-M.jpg"), false);
  assert.equal(isOpenLibraryCoverUrl("https://covers.openlibrary.org.evil.test/b/id/12-M.jpg"), false);
  assert.equal(isOpenLibraryCoverUrl("https://covers.openlibrary.org/b/id/12-L.jpg"), false);
  assert.equal(buildOpenLibraryCoverUrl("12"), null);
});

test("choisit toujours le même livre pour une date et retourne null sans résultats", () => {
  const books = [{ key: "a" }, { key: "b" }, { key: "c" }];
  assert.equal(chooseDailyBook("2026-11-21", books), chooseDailyBook("2026-11-21", books));
  assert.equal(chooseDailyBook("2026-11-21", books), books[1]);
  assert.equal(chooseDailyBook("2026-11-21", []), null);
  assert.equal(chooseDailyBook("2026-02-30", books), null);
});
