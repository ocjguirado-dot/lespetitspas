import assert from "node:assert/strict";
import test from "node:test";
import { isUuid, shouldMarkAsRead, shouldMarkAsProcessed } from "./status.mjs";

test("reconnaît un identifiant UUID", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("550E8400-E29B-41D4-A716-446655440000"), true);
});

test("refuse un identifiant qui ne respecte pas le format UUID", () => {
  for (const value of ["abc", "", null, undefined, 42, "550e8400-e29b-41d4-a716-44665544000z"]) {
    assert.equal(isUuid(value), false);
  }
});

test("ne marque comme lu que le statut nouveau", () => {
  assert.equal(shouldMarkAsRead("nouveau"), true);
  for (const status of ["lu", "traite", "inconnu", null, undefined]) {
    assert.equal(shouldMarkAsRead(status), false);
  }
});

test("ne marque comme traité que le statut lu", () => {
  assert.equal(shouldMarkAsProcessed("lu"), true);
  for (const status of ["nouveau", "traite", "inconnu", undefined]) {
    assert.equal(shouldMarkAsProcessed(status), false);
  }
});
