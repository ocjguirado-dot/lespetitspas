/** @param {unknown} value */
export function normalizeInvitationEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

/** @param {unknown} value */
export function isInvitationUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}

/** @param {unknown} value */
export function safeInvitationNext(value) {
  return value === "/auth/set-password" ? value : null;
}

/** @param {string} appUrl @param {string} tokenHash */
export function buildInvitationLink(appUrl, tokenHash) {
  const url = new URL("/auth/confirm", appUrl);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "invite");
  url.searchParams.set("next", "/auth/set-password");
  return url.toString();
}

/** @param {{ code?: unknown, message?: unknown } | null | undefined} error */
export function mapInvitationError(error) {
  const code = typeof error?.code === "string" ? error.code.toLowerCase() : "";
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (code === "email_exists" || code === "user_already_exists" || /already registered|already exists/u.test(message)) {
    return "already-active";
  }
  return "error";
}
