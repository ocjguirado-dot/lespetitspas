/**
 * @typedef {{ valid: true, name: string } | { valid: false, error: "required" | "too-long" }} ActivityNameResult
 */

/**
 * @param {string} value
 * @returns {ActivityNameResult}
 */
export function validateActivityName(value) {
  const name = value.trim();
  const length = Array.from(name).length;

  if (length === 0) return { valid: false, error: "required" };
  if (length > 80) return { valid: false, error: "too-long" };
  return { valid: true, name };
}
