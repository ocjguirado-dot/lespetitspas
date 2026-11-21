import assert from "node:assert/strict";
import test from "node:test";
import { validateIncident } from "./incident.mjs";

test("accepte les listes autorisées pour le type et la gravité", () => {
  assert.deepEqual(validateIncident("chute", "urgent"), {
    valid: true,
    type: "chute",
    gravite: "urgent",
  });
});

test("signale séparément les deux champs obligatoires", () => {
  assert.deepEqual(validateIncident("", ""), {
    valid: false,
    errors: { incident_type: "required", gravite: "required" },
  });
});

test("refuse les valeurs forgées pour le type ou la gravité", () => {
  assert.deepEqual(validateIncident("feu", "urgent"), {
    valid: false,
    errors: { incident_type: "invalid" },
  });
  assert.deepEqual(validateIncident("morsure", "critique"), {
    valid: false,
    errors: { gravite: "invalid" },
  });
});

test("accepte toutes les valeurs permises", () => {
  for (const type of ["chute", "morsure", "fievre", "autre"]) {
    for (const gravite of ["leger", "modere", "urgent"]) {
      assert.equal(validateIncident(type, gravite).valid, true);
    }
  }
});
