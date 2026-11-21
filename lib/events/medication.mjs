/**
 * @typedef {object} MedicationValidationSuccess
 * @property {true} valid
 * @property {string} nom
 * @property {string} dose
 * @property {string} heure
 */

/**
 * @typedef {object} MedicationValidationFailure
 * @property {false} valid
 * @property {{ nom?: "required" | "too-long", dose?: "required" | "too-long", heure?: "required" | "format", autorisation_confirmee?: "required" }} errors
 */

/** @typedef {MedicationValidationSuccess | MedicationValidationFailure} MedicationValidationResult */

const HH_MM_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Valide les champs de médicament et renvoie les champs texte normalisés.
 * @param {string} nom
 * @param {string} dose
 * @param {string} heure
 * @param {unknown} confirmed
 * @returns {MedicationValidationResult}
 */
export function validateMedication(nom, dose, heure, confirmed) {
  const trimmedName = nom.trim();
  const trimmedDose = dose.trim();
  /** @type {{ nom?: "required" | "too-long", dose?: "required" | "too-long", heure?: "required" | "format", autorisation_confirmee?: "required" }} */
  const errors = {};

  if (!trimmedName) errors.nom = "required";
  else if (Array.from(trimmedName).length > 80) errors.nom = "too-long";

  if (!trimmedDose) errors.dose = "required";
  else if (Array.from(trimmedDose).length > 40) errors.dose = "too-long";

  if (!heure) errors.heure = "required";
  else if (!HH_MM_PATTERN.test(heure)) errors.heure = "format";

  if (confirmed !== "true") errors.autorisation_confirmee = "required";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, nom: trimmedName, dose: trimmedDose, heure };
}

/** @param {unknown} childAuthorized */
export function canRecordMedication(childAuthorized) {
  return childAuthorized === true;
}
