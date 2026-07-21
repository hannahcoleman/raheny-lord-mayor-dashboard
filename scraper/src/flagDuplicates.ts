import type { ResultRecord } from "./types.js";

export interface FlaggedDuplicate {
  roundNumber: number | null;
  raceName: string;
  name: string;
  occurrences: { place: number; timeDisplay: string; category: string }[];
}

/**
 * Same normalized name appearing more than once within a single race.
 * Per user decision: never auto-merge or auto-drop either row - both stay
 * in the dataset as scraped, this is purely a human-reviewable flag list.
 */
export function flagDuplicates(records: ResultRecord[]): FlaggedDuplicate[] {
  const byRace = new Map<string, ResultRecord[]>();
  for (const r of records) {
    const key = `${r.roundNumber ?? "handicap"}::${r.raceName}`;
    if (!byRace.has(key)) byRace.set(key, []);
    byRace.get(key)!.push(r);
  }

  const flagged: FlaggedDuplicate[] = [];
  for (const [, raceRecords] of byRace) {
    const byName = new Map<string, ResultRecord[]>();
    for (const r of raceRecords) {
      if (r.isGenericEntry) continue;
      const key = r.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(r);
    }

    for (const [, group] of byName) {
      if (group.length > 1) {
        flagged.push({
          roundNumber: group[0].roundNumber,
          raceName: group[0].raceName,
          name: group[0].name,
          occurrences: group.map((r) => ({ place: r.place, timeDisplay: r.timeDisplay, category: r.category })),
        });
      }
    }
  }

  return flagged;
}
