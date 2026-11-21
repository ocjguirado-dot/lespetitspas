const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {unknown} value */
export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** @param {unknown} status */
export function shouldMarkAsRead(status) {
  return status === "nouveau";
}

/** @param {unknown} status */
export function shouldMarkAsProcessed(status) {
  return status === "lu";
}
