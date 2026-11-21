/**
 * @typedef {object} IncidentValidationSuccess
 * @property {true} valid
 * @property {"chute" | "morsure" | "fievre" | "autre"} type
 * @property {"leger" | "modere" | "urgent"} gravite
 */

/**
 * @typedef {object} IncidentValidationFailure
 * @property {false} valid
 * @property {{ incident_type?: "required" | "invalid", gravite?: "required" | "invalid" }} errors
 */

/** @typedef {IncidentValidationSuccess | IncidentValidationFailure} IncidentValidationResult */

const incidentTypes = ["chute", "morsure", "fievre", "autre"];
const incidentSeverities = ["leger", "modere", "urgent"];

/**
 * @param {string} incidentType
 * @param {string} gravite
 * @returns {IncidentValidationResult}
 */
export function validateIncident(incidentType, gravite) {
  /** @type {{ incident_type?: "required" | "invalid", gravite?: "required" | "invalid" }} */
  const errors = {};

  if (!incidentType) errors.incident_type = "required";
  else if (!incidentTypes.includes(incidentType)) errors.incident_type = "invalid";

  if (!gravite) errors.gravite = "required";
  else if (!incidentSeverities.includes(gravite)) errors.gravite = "invalid";

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, type: /** @type {IncidentValidationSuccess["type"]} */ (incidentType), gravite: /** @type {IncidentValidationSuccess["gravite"]} */ (gravite) };
}
