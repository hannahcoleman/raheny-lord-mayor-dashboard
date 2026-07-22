import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fetchSeasonRounds } from "./fetchIndex.js";
import { parseRoundPage } from "./parseRound.js";
import { isGenericEntry, parseCategory, parseTimeToSeconds, formatSecondsAsTime } from "./normalize.js";
import { loadAliases, applyAlias, suggestAliases } from "./aliases.js";
import { flagDuplicates } from "./flagDuplicates.js";
import { flagCategoryChanges } from "./flagCategoryChanges.js";
import { inferGenderFromName } from "./inferJuvenileGender.js";
import { buildRefreshLogEntry, type RefreshLogEntry } from "./refreshLog.js";
import type { ResultRecord, RoundMeta } from "./types.js";

const DATA_DIR = new URL("../data/", import.meta.url);
const ALIASES_PATH = new URL("aliases.json", DATA_DIR);
const JUVENILE_GENDERS_PATH = new URL("juvenile-genders.json", DATA_DIR);
const DATASET_PATH = new URL("dataset.json", DATA_DIR);
const REFRESH_LOG_PATH = new URL("refresh-log.json", DATA_DIR);
const MAX_LOG_ENTRIES = 50;

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

  let previousRecords: ResultRecord[] = [];
  try {
    previousRecords = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
  } catch {
    // no previous dataset yet - first ever run
  }

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
  const categoryChanges = flagCategoryChanges(allRecords);
  const suggestions = suggestAliases(
    allRecords.filter((r) => !r.isGenericEntry).map((r) => r.name),
    aliases
  );

  // Best-effort name-based gender guesses for Juveniles (source data never
  // records one) - advisory only. A human reviews these and copies confirmed
  // ones into juvenile-genders.json; nothing here is applied automatically.
  const juvenileNames = new Set(
    allRecords.filter((r) => r.ageGroup === "Juvenile" && !r.isGenericEntry).map((r) => r.name)
  );
  const juvenileGenderSuggestions = Array.from(juvenileNames)
    .map((name) => ({ name, suggestedGender: inferGenderFromName(name) }))
    .filter((s) => s.suggestedGender !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const unmatchedJuvenileNames = Array.from(juvenileNames)
    .filter((name) => inferGenderFromName(name) === null)
    .sort((a, b) => a.localeCompare(b));

  writeFileSync(DATASET_PATH, JSON.stringify(allRecords, null, 2));
  writeFileSync(new URL("rounds.json", DATA_DIR), JSON.stringify(rounds, null, 2));
  writeFileSync(new URL("duplicates-flagged.json", DATA_DIR), JSON.stringify(duplicates, null, 2));
  writeFileSync(new URL("category-changes-flagged.json", DATA_DIR), JSON.stringify(categoryChanges, null, 2));
  writeFileSync(new URL("alias-suggestions.json", DATA_DIR), JSON.stringify(suggestions, null, 2));
  writeFileSync(
    new URL("juvenile-gender-suggestions.json", DATA_DIR),
    JSON.stringify({ suggestions: juvenileGenderSuggestions, unmatched: unmatchedJuvenileNames }, null, 2)
  );

  const logEntry = buildRefreshLogEntry(previousRecords, allRecords, rounds.length);
  let log: RefreshLogEntry[] = [];
  try {
    log = JSON.parse(readFileSync(REFRESH_LOG_PATH, "utf-8"));
  } catch {
    // first ever run
  }
  log.unshift(logEntry);
  log = log.slice(0, MAX_LOG_ENTRIES);
  writeFileSync(REFRESH_LOG_PATH, JSON.stringify(log, null, 2));

  // aliases.json and juvenile-genders.json are human-edited; only create
  // them if missing, never overwrite.
  for (const path of [ALIASES_PATH, JUVENILE_GENDERS_PATH]) {
    try {
      writeFileSync(path, JSON.stringify({}, null, 2), { flag: "wx" });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    }
  }

  console.log(`Done. ${allRecords.length} result rows across ${rounds.length} races.`);
  console.log(`${duplicates.length} same-race duplicate name(s) flagged for review in duplicates-flagged.json.`);
  console.log(`${categoryChanges.length} runner(s) with a cross-week category change flagged in category-changes-flagged.json.`);
  console.log(`${suggestions.length} possible-alias suggestion(s) in alias-suggestions.json.`);
  console.log(
    `Refresh log: ${logEntry.newRaces.length} new race(s), ${logEntry.changedRaces.length} changed race(s) since last scrape.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
