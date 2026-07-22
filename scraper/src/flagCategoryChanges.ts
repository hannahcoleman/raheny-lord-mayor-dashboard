import type { ResultRecord } from "./types.js";

export interface CategoryChangeFlag {
  name: string;
  occurrences: { roundNumber: number | null; raceName: string; category: string }[];
}

/**
 * Same runner recorded under a different gender/age-category in different
 * races. Could be a genuine mid-season age-category change (a birthday), a
 * data-entry typo on the source site, or two different people who happen to
 * share a name. Purely informational - never auto-corrected, since there's
 * no way to tell which case applies from the data alone.
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
    const distinctCategories = new Set(rows.map((r) => `${r.gender}::${r.ageGroup}`));
    if (distinctCategories.size > 1) {
      const sorted = [...rows].sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
      flagged.push({
        name,
        occurrences: sorted.map((r) => ({ roundNumber: r.roundNumber, raceName: r.raceName, category: r.category })),
      });
    }
  }

  return flagged.sort((a, b) => a.name.localeCompare(b.name));
}
