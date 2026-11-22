const COVER_ORIGIN = "https://covers.openlibrary.org";

/** @param {unknown} value */
export function isOpenLibraryCoverUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "covers.openlibrary.org"
      && url.port === ""
      && url.username === ""
      && url.password === ""
      && url.search === ""
      && url.hash === ""
      && /^\/b\/id\/[1-9]\d*-M\.jpg$/u.test(url.pathname);
  } catch {
    return false;
  }
}

/** @param {unknown} coverId */
export function buildOpenLibraryCoverUrl(coverId) {
  if (!Number.isSafeInteger(coverId) || coverId <= 0) return null;
  const candidate = `${COVER_ORIGIN}/b/id/${coverId}-M.jpg`;
  return isOpenLibraryCoverUrl(candidate) ? candidate : null;
}

/** @param {unknown} value */
export function normalizeOpenLibraryBook(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = /** @type {{ key?: unknown, title?: unknown, author_name?: unknown, cover_i?: unknown }} */ (value);
  const key = typeof entry.key === "string" ? entry.key.trim() : "";
  const title = typeof entry.title === "string" ? entry.title.trim() : "";
  if (!key || title.length < 1 || title.length > 200) return null;

  const authors = Array.isArray(entry.author_name) ? entry.author_name : [];
  const firstAuthor = authors.find((author) => typeof author === "string" && author.trim());
  const author = typeof firstAuthor === "string" ? firstAuthor.trim() : null;

  return {
    key,
    title,
    author: author || null,
    coverUrl: buildOpenLibraryCoverUrl(entry.cover_i),
  };
}

/** @param {string} date */
function getDayOfYear(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) return null;
  const current = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(current.valueOf()) || current.toISOString().slice(0, 10) !== date) return null;
  const year = Number(date.slice(0, 4));
  if (year < 1) return null;
  const firstDay = new Date(`${date.slice(0, 4)}-01-01T00:00:00.000Z`);
  return Math.floor((current.valueOf() - firstDay.valueOf()) / 86_400_000) + 1;
}

/** @template T @param {string} date @param {T[]} books @returns {T | null} */
export function chooseDailyBook(date, books) {
  if (!Array.isArray(books) || books.length === 0) return null;
  const dayOfYear = getDayOfYear(date);
  if (dayOfYear === null) return null;
  return books[dayOfYear % books.length] ?? null;
}
