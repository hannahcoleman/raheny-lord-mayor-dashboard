import { writeFileSync, mkdirSync } from "node:fs";
import { fetchSeasonRounds } from "./fetchIndex.js";
import { parseRoundPage } from "./parseRound.js";
import { isGenericEntry, parseCategory, parseTimeToSeconds, formatSecondsAsTime } from "./normalize.js";
import { loadAliases, applyAlias, suggestAliases } from "./aliases.js";
import { flagDuplicates } from "./flagDuplicates.js";
import type { ResultRecord, RoundMeta } from "./types.js";

const DATA_DIR = new URL("../data/", import.meta.url);
const ALIASES_PATH = new URL("aliases.json", DATA_DIR);

function raceNameFor(round: RoundMeta): string {
  if (round.isHandicap) return "Jim Wall Memorial Handicap";
  const base = `Round ${round.roundNumber}`;
  return round.cupName ? `${base} - ${round.cupName}` : base;
}

async function main() {
  mkdirSync(new URL(".", DATA_DIR), { recursive: true });

  const targetYear = new Date().getFullYear();
  console.log(`Fetching ${targetYear} season index...`);
  const rounds = await fetchSeasonRounds(targetYear);
  console.log(`Found ${rounds.length} round posts (${rounds.filter((r) => !r.isHandicap).length} numbered, ${rounds.filter((r) => r.isHandicap).length} handicap).`);

  const aliases = loadAliases(ALIASES_PATH);
  const allRecords: ResultRecord[] = [];

  for (const round of rounds) {
    console.log(`Parsing ${raceNameFor(round)} (${round.url})...`);
    const rawRows = await parseRoundPage(round.url);
    for (const row of rawRows) {
      const canonicalName = applyAlias(row.name, aliases);
      const { gender, ageGroup } = parseCategory(row.category);
      const timeSeconds = parseTimeToSeconds(row.time);
      allRecords.push({
        roundNumber: round.roundNumber,
        raceName: raceNameFor(round),
        date: round.date,
        place: Number(row.place),
        name: canonicalName,
        club: row.club.trim(),
        category: row.category.trim(),
        gender,
        ageGroup,
        timeSeconds,
        timeDisplay: timeSeconds !== null ? formatSecondsAsTime(timeSeconds) : row.time,
        isGenericEntry: isGenericEntry(row.name),
      });
    }
  }

  const duplicates = flagDuplicates(allRecords);
  const suggestions = suggestAliases(
    allRecords.filter((r) => !r.isGenericEntry).map((r) => r.name),
    aliases
  );

  writeFileSync(new URL("dataset.json", DATA_DIR), JSON.stringify(allRecords, null, 2));
  writeFileSync(new URL("rounds.json", DATA_DIR), JSON.stringify(rounds, null, 2));
  writeFileSync(new URL("duplicates-flagged.json", DATA_DIR), JSON.stringify(duplicates, null, 2));
  writeFileSync(new URL("alias-suggestions.json", DATA_DIR), JSON.stringify(suggestions, null, 2));

  // aliases.json is human-edited; only create it if missing, never overwrite.
  try {
    writeFileSync(ALIASES_PATH, JSON.stringify({}, null, 2), { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }

  console.log(`Done. ${allRecords.length} result rows across ${rounds.length} races.`);
  console.log(`${duplicates.length} same-race duplicate name(s) flagged for review in duplicates-flagged.json.`);
  console.log(`${suggestions.length} possible-alias suggestion(s) in alias-suggestions.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
