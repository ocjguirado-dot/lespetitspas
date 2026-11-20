const PARIS_TIME_ZONE = "Europe/Paris";

type DateParts = { year: number; month: number; day: number };

function utcDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date;
}

function getDateParts(date: Date, timeZone = PARIS_TIME_ZONE): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function formatDateParts({ year, month, day }: DateParts): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/** Returns the calendar date at the current instant in the Paris time zone. */
export function getTodayInParis(now = new Date()): string {
  return formatDateParts(getDateParts(now));
}

/** Strictly validates a YYYY-MM-DD date without interpreting it in the host time zone. */
export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const date = utcDate(year, month, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Resolves a Paris wall-clock midnight to UTC, including DST transitions. */
function parisMidnightUtc({ year, month, day }: DateParts): Date {
  const targetAsUtc = utcDate(year, month, day).getTime();
  let candidate = targetAsUtc;

  // Iteratively correct the candidate by comparing its Paris wall clock to the requested midnight.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = new Intl.DateTimeFormat("en-GB", {
      timeZone: PARIS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(local.map((part) => [part.type, part.value]));
    const representedAsUtc = utcDate(
      Number(values.year),
      Number(values.month),
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    ).getTime();
    const correction = targetAsUtc - representedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }

  return new Date(candidate);
}

/** Returns the half-open UTC interval covering one calendar day in Paris. */
export function getParisDayInterval(date: string): { start: Date; end: Date } {
  if (!isValidDateInput(date)) throw new RangeError("Date invalide");
  const [year, month, day] = date.split("-").map(Number);
  const start = parisMidnightUtc({ year, month, day });
  const nextUtcDate = utcDate(year, month, day + 1);
  const end = parisMidnightUtc({
    year: nextUtcDate.getUTCFullYear(),
    month: nextUtcDate.getUTCMonth() + 1,
    day: nextUtcDate.getUTCDate(),
  });
  return { start, end };
}

export function formatParisDate(date: string): string {
  if (!isValidDateInput(date)) throw new RangeError("Date invalide");
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(utcDate(year, month, day, 12));
}

export function formatParisTime(instant: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}
