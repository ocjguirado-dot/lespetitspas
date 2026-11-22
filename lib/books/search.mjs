import { chooseDailyBook, normalizeOpenLibraryBook } from "./catalog.mjs";

const REQUEST_HEADERS = {
  "User-Agent": "LesPetitsPas/1.0 (suggestion de livre jeunesse)",
};

/** @typedef {{ key: string, title: string, author: string | null, coverUrl: string | null }} NormalizedBook */
/** @typedef {{ status: "ok", book: NormalizedBook } | { status: "unavailable", code: string }} SearchResult */

/** @param {unknown} error */
export function classifyOpenLibraryError(error) {
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : "network";
}

/** @param {string} baseUrl */
export function buildOpenLibrarySearchUrl(baseUrl) {
  try {
    const base = new URL(baseUrl);
    if ((base.protocol !== "https:" && base.protocol !== "http:")
      || base.username || base.password || base.search || base.hash) return null;

    const root = `${base.origin}${base.pathname.replace(/\/+$/u, "")}/`;
    const url = new URL("search.json", root);
    url.searchParams.set("q", 'subject:("Bedtime" OR "Board books" OR "Picture books") AND language:fre');
    url.searchParams.set("lang", "fr");
    url.searchParams.set("fields", "key,title,author_name,cover_i");
    url.searchParams.set("limit", "20");
    return url;
  } catch {
    return null;
  }
}

/** @param {{ baseUrl: string, date: string, fetchImpl?: typeof fetch }} options */
/** @returns {Promise<SearchResult>} */
export async function searchOpenLibrary({ baseUrl, date, fetchImpl = fetch }) {
  const url = buildOpenLibrarySearchUrl(baseUrl);
  if (!url) return { status: "unavailable", code: "invalid-base-url" };

  let response;
  try {
    response = await fetchImpl(url, {
      cache: "no-store",
      headers: REQUEST_HEADERS,
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    return { status: "unavailable", code: classifyOpenLibraryError(error) };
  }

  if (!response.ok) return { status: "unavailable", code: "http" };

  let payload;
  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable", code: "invalid-json" };
  }
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.docs)) {
    return { status: "unavailable", code: "invalid-json" };
  }

  const books = payload.docs
    .slice(0, 20)
    .map(normalizeOpenLibraryBook)
    .filter((book) => book !== null);
  const book = chooseDailyBook(date, books);
  if (!book) return { status: "unavailable", code: "no-results" };
  return { status: "ok", book };
}
