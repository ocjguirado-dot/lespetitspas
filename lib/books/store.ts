import "server-only";

import { getTodayInParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { insertEveningBookIfAbsent } from "@/lib/supabase/admin";
import { isOpenLibraryCoverUrl } from "./catalog.mjs";
import { searchOpenLibrary } from "./search.mjs";

export type EveningBook = {
  title: string;
  author: string | null;
  coverUrl: string | null;
};

export type EveningBookResult =
  | { status: "book"; book: EveningBook }
  | { status: "unavailable" };

type StoredEveningBook = {
  suggestion_date: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string;
};

function logBookError(code: string) {
  try {
    console.error({ code });
  } catch {
    // A suggestion failure must never affect the parent timeline.
  }
}

function toEveningBook(row: StoredEveningBook): EveningBook | null {
  const title = row.title.trim();
  if (!title || title.length > 200) return null;
  return {
    title,
    author: row.author?.trim() || null,
    coverUrl: isOpenLibraryCoverUrl(row.cover_url) ? row.cover_url : null,
  };
}

async function readForDate(date: string): Promise<StoredEveningBook | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("evening_books")
    .select("suggestion_date, title, author, cover_url, open_library_key")
    .eq("suggestion_date", date)
    .maybeSingle();
  if (result.error) throw new Error("evening-book-read-failed");
  return result.data as StoredEveningBook | null;
}

/** Reads or fills today's shared suggestion. Every operational failure degrades to an unavailable card. */
export async function getEveningBookForToday(): Promise<EveningBookResult> {
  try {
    const date = getTodayInParis();
    const cached = await readForDate(date);
    if (cached) {
      const book = toEveningBook(cached);
      return book ? { status: "book", book } : { status: "unavailable" };
    }

    const search = await searchOpenLibrary({
      baseUrl: process.env.OPEN_LIBRARY_BASE_URL?.trim() || "https://openlibrary.org",
      date,
    });
    if (search.status !== "ok") {
      logBookError(search.code);
      return { status: "unavailable" };
    }

    const saved = await insertEveningBookIfAbsent({
      suggestion_date: date,
      title: search.book.title,
      author: search.book.author,
      cover_url: search.book.coverUrl,
      open_library_key: search.book.key,
    });
    if (saved.status === "error" || saved.status === "not-configured") {
      logBookError(saved.code);
      return { status: "unavailable" };
    }
    if (saved.status === "inserted") return { status: "book", book: search.book };

    // Another request won the unique-date race; read the shared row through the session RLS policy.
    const raced = await readForDate(date);
    if (!raced) {
      logBookError("evening-book-race-read-failed");
      return { status: "unavailable" };
    }
    const racedBook = toEveningBook(raced);
    return racedBook ? { status: "book", book: racedBook } : { status: "unavailable" };
  } catch {
    logBookError("evening-book-unavailable");
    return { status: "unavailable" };
  }
}
