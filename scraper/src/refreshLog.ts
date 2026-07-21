import { createHash } from "node:crypto";
import type { ResultRecord } from "./types.js";

export interface RefreshLogEntry {
  timestamp: string;
  roundsScraped: number;
  newRaces: string[];
  changedRaces: string[];
}

/** One signature per race, sensitive to any row changing (place, name, category, time). */
function computeRaceSignatures(records: ResultRecord[]): Map<string, string> {
  const byRace = new Map<string, ResultRecord[]>();
  for (const r of records) {
    if (!byRace.has(r.raceName)) byRace.set(r.raceName, []);
    byRace.get(r.raceName)!.push(r);
  }

  const signatures = new Map<string, string>();
  for (const [raceName, rows] of byRace) {
    const sorted = [...rows].sort((a, b) => a.place - b.place);
    const fingerprint = sorted.map((r) => `${r.place}|${r.name}|${r.club}|${r.category}|${r.timeDisplay}`).join("\n");
    signatures.set(raceName, createHash("sha256").update(fingerprint).digest("hex"));
  }
  return signatures;
}

/** Compares this scrape's results against the previous dataset to see which races are new or changed. */
export function buildRefreshLogEntry(
  previousRecords: ResultRecord[],
  currentRecords: ResultRecord[],
  roundsScraped: number
): RefreshLogEntry {
  const oldSigs = computeRaceSignatures(previousRecords);
  const newSigs = computeRaceSignatures(currentRecords);

  const newRaces: string[] = [];
  const changedRaces: string[] = [];
  for (const [raceName, sig] of newSigs) {
    if (!oldSigs.has(raceName)) newRaces.push(raceName);
    else if (oldSigs.get(raceName) !== sig) changedRaces.push(raceName);
  }

  return {
    timestamp: new Date().toISOString(),
    roundsScraped,
    newRaces,
    changedRaces,
  };
}
