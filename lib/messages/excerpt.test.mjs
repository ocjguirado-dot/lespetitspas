import assert from "node:assert/strict";
import test from "node:test";
import { messageExcerpt } from "./excerpt.mjs";

test("laisse inchangé un message de 120 caractères ou moins", () => {
  for (const body of ["Court", "x".repeat(120)]) {
    assert.equal(messageExcerpt(body), body);
  }
});

test("tronque au-delà de 120 caractères et ajoute une ellipse", () => {
  const excerpt = messageExcerpt("x".repeat(121));
  assert.equal(Array.from(excerpt).length, 120);
  assert.equal(excerpt, `${"x".repeat(119)}…`);
});

test("compte les caractères Unicode avec Array.from", () => {
  const body = "😀".repeat(120);
  const excerpt = messageExcerpt(`${body}fin`);
  assert.equal(Array.from(excerpt).length, 120);
  assert.equal(excerpt, `${"😀".repeat(119)}…`);
});
