import type { AgeGroup, Gender } from "./types.js";

const GENERIC_NAME_PATTERN = /^a\s+runner$/i;

export function isGenericEntry(name: string): boolean {
  return GENERIC_NAME_PATTERN.test(name.trim());
}

/**
 * Category strings look like "Senior Men", "O/45 Women", or bare "Juvenile"
 * (Juvenile never carries a gender suffix in the source data - confirmed
 * across all rounds scraped so far - so it's modeled as gender "Unspecified"
 * and scored as a single combined category, per user decision).
 */
export function parseCategory(raw: string): { gender: Gender; ageGroup: AgeGroup | null } {
  const cleaned = raw.trim().replace(/juvenille/i, "Juvenile"); // known typo seen in Round 3

  if (/^juvenile$/i.test(cleaned)) {
    return { gender: "Unspecified", ageGroup: "Juvenile" };
  }

  const match = cleaned.match(/^(Senior|O\/\d{2})\s+(Men|Women)$/i);
  if (!match) {
    return { gender: "Unspecified", ageGroup: null };
  }

  const [, ageRaw, genderRaw] = match;
  const ageGroup = (/^senior$/i.test(ageRaw) ? "Senior" : ageRaw.toUpperCase()) as AgeGroup;
  const gender = (genderRaw[0].toUpperCase() + genderRaw.slice(1).toLowerCase()) as Gender;
  return { gender, ageGroup };
}

/**
 * Times are usually "mm.ss" (dot), e.g. "12.51" -> 12*60+51 = 771 seconds,
 * but at least one round (Rd 7) was posted as "mm:ss" (colon) instead -
 * accept either separator.
 */
export function parseTimeToSeconds(raw: string): number | null {
  const trimmed = raw.trim();

  const full = trimmed.match(/^(\d{1,3})[.:](\d{2})$/);
  if (full) {
    const minutes = Number(full[1]);
    const seconds = Number(full[2]);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  // Occasional one-off typo: a trailing zero dropped, e.g. "14.4" meant "14.40".
  // Single trailing digit is otherwise meaningless in this mm.ss data, so treat
  // it as the tens digit of seconds rather than discarding the row.
  const short = trimmed.match(/^(\d{1,3})[.:](\d)$/);
  if (short) {
    console.warn(`Time "${trimmed}" is missing a digit - assuming trailing zero was dropped (treated as "${short[1]}.${short[2]}0").`);
    return Number(short[1]) * 60 + Number(short[2]) * 10;
  }

  return null;
}

export function formatSecondsAsTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
