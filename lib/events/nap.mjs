/** @typedef {"required" | "format" | "not-after-start"} NapTimeError */

/**
 * @typedef {object} NapValidationSuccess
 * @property {true} valid
 * @property {number} durationMinutes
 */

/**
 * @typedef {object} NapValidationFailure
 * @property {false} valid
 * @property {{ debut?: NapTimeError, fin?: NapTimeError }} errors
 */

/** @typedef {NapValidationSuccess | NapValidationFailure} NapValidationResult */

const HH_MM_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/** @param {string} value */
function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Valide deux heures HH:MM et calcule leur différence en minutes.
 * @param {string} debut
 * @param {string} fin
 * @returns {NapValidationResult}
 */
export function validateNapTimes(debut, fin) {
  /** @type {{ debut?: NapTimeError, fin?: NapTimeError }} */
  const errors = {};

  if (!debut) errors.debut = "required";
  else if (!HH_MM_PATTERN.test(debut)) errors.debut = "format";

  if (!fin) errors.fin = "required";
  else if (!HH_MM_PATTERN.test(fin)) errors.fin = "format";

  if (errors.debut || errors.fin) return { valid: false, errors };

  const startMinutes = toMinutes(debut);
  const endMinutes = toMinutes(fin);
  if (endMinutes <= startMinutes) {
    return { valid: false, errors: { fin: "not-after-start" } };
  }

  return { valid: true, durationMinutes: endMinutes - startMinutes };
}
