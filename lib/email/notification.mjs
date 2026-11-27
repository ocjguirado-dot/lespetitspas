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
 * @param {{ parentFirstName: string, childFirstName: string, appUrl: string, testRecipient?: string }} input
 */
export function buildMessageNotification({ parentFirstName, childFirstName, appUrl, testRecipient }) {
  const parent = normalizeWhitespace(parentFirstName);
  const child = normalizeWhitespace(childFirstName);
  const messagesUrl = `${appUrl.replace(/\/+$/u, "")}/staff/messages`;
  const testPrefix = testRecipient ? "[test] " : "";
  const subject = `${testPrefix}Nouveau message de ${parent} pour ${child}`;
  const text = `Un nouveau message de ${parent} pour ${child} est arrivé dans la messagerie.\n\n${messagesUrl}\n\nConnectez-vous pour le lire et y répondre.`;
  const html = [
    "<!doctype html><html lang=\"fr\"><body>",
    `<p>Un nouveau message de ${escapeHtml(parent)} pour ${escapeHtml(child)} est arrivé dans la messagerie.</p>`,
    `<p><a href=\"${escapeHtml(messagesUrl)}\">${escapeHtml(messagesUrl)}</a></p>`,
    "<p>Connectez-vous pour le lire et y répondre.</p>",
    "</body></html>",
  ].join("");

  return { subject, messagesUrl, text, html };
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
