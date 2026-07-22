import type { AgeGroup, ResultRecord } from "./types.js";

export interface CategoryChangeFlag {
  name: string;
  occurrences: { roundNumber: number | null; raceName: string; category: string }[];
}

// Youngest to oldest. Juvenile is deliberately excluded - it's not part of
// this ordered progression, since a Juvenile-to-adult jump within a season
// isn't a plausible birthday transition.
const AGE_ORDER: AgeGroup[] = ["Senior", "O/35", "O/40", "O/45", "O/50", "O/55", "O/60", "O/65", "O/70", "O/75"];

/** Collapses consecutive duplicates: [A,A,B,B,B,A] -> [A,B,A]. */
function collapseConsecutive<T>(items: T[]): T[] {
  const result: T[] = [];
  for (const item of items) {
    if (result[result.length - 1] !== item) result.push(item);
  }
  return result;
}

/**
 * Same runner recorded under a different gender/age-category in different
 * races. A single clean move to an older bracket (same gender, stays there
 * for the rest of the season) is treated as a genuine mid-season birthday
 * and not flagged. Anything else - reverting back, moving to a *younger*
 * bracket, a gender change, or involving Juvenile - could be a data-entry
 * error or two different people sharing a name, so it's flagged for manual
 * review and never auto-corrected.
 */
export function flagCategoryChanges(records: ResultRecord[]): CategoryChangeFlag[] {
  const byName = new Map<string, ResultRecord[]>();
  for (const r of records) {
    if (r.isGenericEntry) continue;
    if (!byName.has(r.name)) byName.set(r.name, []);
    byName.get(r.name)!.push(r);
  }

  const flagged: CategoryChangeFlag[] = [];
  for (const [name, rows] of byName) {
    const sorted = [...rows].sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
    const sequence = collapseConsecutive(sorted.map((r) => `${r.gender}::${r.ageGroup}`));
    if (sequence.length <= 1) continue;

    const isCleanAgeUp =
      sequence.length === 2 &&
      (() => {
        const [beforeGender, beforeAge] = sequence[0].split("::");
        const [afterGender, afterAge] = sequence[1].split("::");
        if (beforeGender !== afterGender) return false;
        const beforeIdx = AGE_ORDER.indexOf(beforeAge as AgeGroup);
        const afterIdx = AGE_ORDER.indexOf(afterAge as AgeGroup);
        return beforeIdx !== -1 && afterIdx !== -1 && afterIdx > beforeIdx;
      })();

    if (isCleanAgeUp) continue;

    flagged.push({
      name,
      occurrences: sorted.map((r) => ({ roundNumber: r.roundNumber, raceName: r.raceName, category: r.category })),
    });
  }

  return flagged.sort((a, b) => a.name.localeCompare(b.name));
}
