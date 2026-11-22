/**
 * Renvoie un extrait de 120 caractères Unicode maximum.
 * @param {string} body
 * @returns {string}
 */
export function messageExcerpt(body) {
  const characters = Array.from(body);
  if (characters.length <= 120) return body;
  return `${characters.slice(0, 119).join("")}…`;
}
