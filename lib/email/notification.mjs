/** @param {unknown} value */
function normalizeWhitespace(value) {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

/** @param {string} value */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** @param {unknown} value */
export function createNotificationExcerpt(value) {
  const normalized = normalizeWhitespace(value);
  const characters = Array.from(normalized);
  if (characters.length <= 80) return normalized;
  return `${characters.slice(0, 79).join("")}…`;
}

/**
 * @param {string | string[]} intended
 * @param {string | undefined} testRecipient
 * @returns {string[]}
 */
export function resolveRecipients(intended, testRecipient) {
  if (typeof testRecipient === "string" && testRecipient.length > 0) return [testRecipient];
  return Array.isArray(intended) ? [...intended] : [intended];
}

/**
 * @param {{ parentFirstName: string, childFirstName: string, body: string, appUrl: string, testRecipient?: string }} input
 */
export function buildMessageNotification({ parentFirstName, childFirstName, body, appUrl, testRecipient }) {
  const parent = normalizeWhitespace(parentFirstName);
  const child = normalizeWhitespace(childFirstName);
  const excerpt = createNotificationExcerpt(body);
  const messagesUrl = `${appUrl.replace(/\/+$/u, "")}/staff/messages`;
  const testPrefix = testRecipient ? "[test] " : "";
  const subject = `${testPrefix}Nouveau message de ${parent} pour ${child}`;
  const text = `${excerpt}\n\n${messagesUrl}\nConnectez-vous pour répondre.`;
  const html = [
    "<!doctype html><html lang=\"fr\"><body>",
    `<p>${escapeHtml(excerpt)}</p>`,
    `<p><a href=\"${escapeHtml(messagesUrl)}\">${escapeHtml(messagesUrl)}</a></p>`,
    "<p>Connectez-vous pour répondre.</p>",
    "</body></html>",
  ].join("");

  return { subject, excerpt, messagesUrl, text, html };
}

/** @param {{ childFirstName: string, invitationUrl: string, testRecipient?: string }} input */
export function buildParentInvitationEmail({ childFirstName, invitationUrl, testRecipient }) {
  const child = normalizeWhitespace(childFirstName);
  const testPrefix = testRecipient ? "[test] " : "";
  const subject = `${testPrefix}Vous êtes invité à suivre la journée de ${child} sur Les Petits Pas`;
  const text = [
    `La crèche vous invite à suivre la journée de ${child} sur Les Petits Pas.`,
    "Cette application permet de consulter les transmissions de la crèche.",
    `Définir mon mot de passe : ${invitationUrl}`,
    "Pour protéger la vie privée de votre enfant, ses données sont utilisées uniquement pour son suivi par la crèche.",
    "Ce lien est valable 24 h.",
  ].join("\n\n");
  const html = [
    "<!doctype html><html lang=\"fr\"><body>",
    `<p>La crèche vous invite à suivre la journée de ${escapeHtml(child)} sur Les Petits Pas.</p>`,
    "<p>Cette application permet de consulter les transmissions de la crèche.</p>",
    `<p><a href=\"${escapeHtml(invitationUrl)}\">Définir mon mot de passe</a></p>`,
    "<p>Pour protéger la vie privée de votre enfant, ses données sont utilisées uniquement pour son suivi par la crèche.</p>",
    "<p>Ce lien est valable 24 h.</p>",
    "</body></html>",
  ].join("");
  return { subject, text, html };
}
