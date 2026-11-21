import assert from "node:assert/strict";
import test from "node:test";
import { getParisDayInterval, isValidDateInput } from "./dates.ts";

test("calcule les bornes UTC d’une journée parisienne de 23 heures", () => {
  const { start, end } = getParisDayInterval("2026-03-29");
  assert.equal(start.toISOString(), "2026-03-28T23:00:00.000Z");
  assert.equal(end.toISOString(), "2026-03-29T22:00:00.000Z");
  assert.equal((end.getTime() - start.getTime()) / 3_600_000, 23);
});

test("calcule les bornes UTC d’une journée parisienne de 25 heures", () => {
  const { start, end } = getParisDayInterval("2026-10-25");
  assert.equal(start.toISOString(), "2026-10-24T22:00:00.000Z");
  assert.equal(end.toISOString(), "2026-10-25T23:00:00.000Z");
  assert.equal((end.getTime() - start.getTime()) / 3_600_000, 25);
});

test("valide le format et l’existence de la date", () => {
  assert.equal(isValidDateInput("2024-02-29"), true);
  assert.equal(isValidDateInput("2026-02-29"), false);
  assert.equal(isValidDateInput("2026-2-09"), false);
});
