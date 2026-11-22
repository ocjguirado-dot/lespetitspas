/** @typedef {"required" | "too-long" | "invalid"} ParentMessageError */

/** @typedef {{ valid: true, body: string, length: number } | { valid: false, error: ParentMessageError }} ParentMessageValidation */

/** @param {unknown} value @returns {ParentMessageValidation} */
export function validateParentMessage(value) {
  if (typeof value !== "string") return { valid: false, error: "invalid" };

  if (!value.trim()) return { valid: false, error: "required" };

  const body = value;
  const length = Array.from(body).length;
  if (length > 500) return { valid: false, error: "too-long" };

  return { valid: true, body, length };
}
