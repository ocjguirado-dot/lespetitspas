import assert from "node:assert/strict";
import test from "node:test";
import { validateNapTimes } from "./nap.mjs";

test("valide une sieste et calcule sa durée en minutes", () => {
  assert.deepEqual(validateNapTimes("13:00", "14:30"), {
    valid: true,
    durationMinutes: 90,
  });
});

test("refuse une fin antérieure au début", () => {
  assert.deepEqual(validateNapTimes("14:30", "13:00"), {
    valid: false,
    errors: { fin: "not-after-start" },
  });
});

test("refuse une fin égale au début", () => {
  assert.deepEqual(validateNapTimes("13:00", "13:00"), {
    valid: false,
    errors: { fin: "not-after-start" },
  });
});

test("refuse les formats qui ne sont pas strictement HH:MM sur 24 heures", () => {
  assert.deepEqual(validateNapTimes("9:00", "10:00"), {
    valid: false,
    errors: { debut: "format" },
  });
  assert.deepEqual(validateNapTimes("23:00", "24:00"), {
    valid: false,
    errors: { fin: "format" },
  });
});

test("signale séparément les heures manquantes", () => {
  assert.deepEqual(validateNapTimes("", ""), {
    valid: false,
    errors: { debut: "required", fin: "required" },
  });
});
