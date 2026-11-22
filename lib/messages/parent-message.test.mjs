import assert from "node:assert/strict";
import test from "node:test";
import { validateParentMessage } from "./parent-message.mjs";

test("refuse un message vide ou composé d’espaces", () => {
  assert.deepEqual(validateParentMessage(""), { valid: false, error: "required" });
  assert.deepEqual(validateParentMessage("  \n  "), { valid: false, error: "required" });
});

test("accepte exactement 500 caractères sans modifier le texte", () => {
  const result = validateParentMessage("a".repeat(500));
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.body, "a".repeat(500));
    assert.equal(result.length, 500);
  }
  assert.deepEqual(validateParentMessage(`${"a".repeat(500)} `), { valid: false, error: "too-long" });
});

test("refuse plus de 500 caractères et compte les caractères Unicode", () => {
  assert.deepEqual(validateParentMessage("a".repeat(501)), { valid: false, error: "too-long" });
  assert.equal(validateParentMessage("😀".repeat(500)).valid, true);
  assert.deepEqual(validateParentMessage("😀".repeat(501)), { valid: false, error: "too-long" });
});

test("refuse une valeur qui n’est pas du texte", () => {
  assert.deepEqual(validateParentMessage(null), { valid: false, error: "invalid" });
});
