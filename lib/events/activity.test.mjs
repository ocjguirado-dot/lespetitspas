import assert from "node:assert/strict";
import test from "node:test";
import { validateActivityName } from "./activity.mjs";

test("retire les espaces autour du nom", () => {
  assert.deepEqual(validateActivityName("  Peinture  "), { valid: true, name: "Peinture" });
});

test("refuse un nom vide ou composé d'espaces", () => {
  assert.deepEqual(validateActivityName(""), { valid: false, error: "required" });
  assert.deepEqual(validateActivityName("   "), { valid: false, error: "required" });
});

test("accepte 80 caractères et compte les caractères Unicode", () => {
  assert.deepEqual(validateActivityName("😀".repeat(80)), {
    valid: true,
    name: "😀".repeat(80),
  });
});

test("refuse plus de 80 caractères", () => {
  assert.deepEqual(validateActivityName("a".repeat(81)), { valid: false, error: "too-long" });
});
