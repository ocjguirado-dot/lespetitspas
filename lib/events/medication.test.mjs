import assert from "node:assert/strict";
import test from "node:test";
import { canRecordMedication, validateMedication } from "./medication.mjs";

const validFields = ["Vitamine", "5 ml", "09:30", "true"];

test("valide un médicament et renvoie nom et dose trimés", () => {
  const result = validateMedication(" Vitamine ", " 5 ml ", "09:30", "true");
  assert.deepEqual(result, {
    valid: true,
    nom: "Vitamine",
    dose: "5 ml",
    heure: "09:30",
  });
  assert.deepEqual(Object.keys(result).sort(), ["dose", "heure", "nom", "valid"]);
});

test("refuse les noms, doses et heures vides ou composés d’espaces", () => {
  for (const empty of ["", "   "]) {
    assert.deepEqual(validateMedication(empty, validFields[1], validFields[2], "true"), {
      valid: false,
      errors: { nom: "required" },
    });
    assert.deepEqual(validateMedication(validFields[0], empty, validFields[2], "true"), {
      valid: false,
      errors: { dose: "required" },
    });
  }
  assert.deepEqual(validateMedication(validFields[0], validFields[1], "", "true"), {
    valid: false,
    errors: { heure: "required" },
  });
  assert.deepEqual(validateMedication(validFields[0], validFields[1], "   ", "true"), {
    valid: false,
    errors: { heure: "format" },
  });
});

test("accepte les limites de 80 caractères pour le nom et 40 pour la dose", () => {
  const result = validateMedication("n".repeat(80), "d".repeat(40), "12:00", "true");
  assert.deepEqual(result, {
    valid: true,
    nom: "n".repeat(80),
    dose: "d".repeat(40),
    heure: "12:00",
  });
});

test("refuse un nom de 81 caractères et une dose de 41 caractères", () => {
  assert.deepEqual(validateMedication("n".repeat(81), "dose", "12:00", "true"), {
    valid: false,
    errors: { nom: "too-long" },
  });
  assert.deepEqual(validateMedication("nom", "d".repeat(41), "12:00", "true"), {
    valid: false,
    errors: { dose: "too-long" },
  });
});

test("refuse les heures qui ne respectent pas le format HH:MM strict", () => {
  for (const heure of ["9:00", "24:00", "12:60"]) {
    assert.deepEqual(validateMedication("nom", "dose", heure, "true"), {
      valid: false,
      errors: { heure: "format" },
    });
  }
});

test("refuse une case absente ou dont la valeur est différente de true", () => {
  for (const confirmed of [undefined, "on", "false"]) {
    assert.deepEqual(validateMedication("nom", "dose", "12:00", confirmed), {
      valid: false,
      errors: { autorisation_confirmee: "required" },
    });
  }
});

test("n’autorise la saisie que si medication_authorized est le booléen true", () => {
  assert.equal(canRecordMedication(true), true);
  for (const value of [false, null, undefined, "true", 1]) {
    assert.equal(canRecordMedication(value), false);
  }
});
