import {
  ADULT_AGE_GROUPS,
  QUALIFICATION_THRESHOLD,
  type AgeGroup,
  type Gender,
  type ResultRecord,
} from "./types";

/** Numbered rounds only (1-13) - the Jim Wall Memorial Handicap never counts toward any of this. */
export function numberedRecords(records: ResultRecord[]): ResultRecord[] {
  return records.filter((r) => r.roundNumber !== null);
}

export function runnerRecords(records: ResultRecord[]): ResultRecord[] {
  return records.filter((r) => !r.isGenericEntry);
}

function groupByName(records: ResultRecord[]): Map<string, ResultRecord[]> {
  const map = new Map<string, ResultRecord[]>();
  for (const r of records) {
    if (!map.has(r.name)) map.set(r.name, []);
    map.get(r.name)!.push(r);
  }
  return map;
}

/** The category a runner is displayed under - the most frequent gender/ageGroup pairing across their races. */
function modeCategory(races: ResultRecord[]): { gender: Gender; ageGroup: AgeGroup | null } {
  const counts = new Map<string, number>();
  for (const r of races) {
    const key = `${r.gender}::${r.ageGroup ?? ""}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = { key: "", count: -1 };
  for (const [key, count] of counts) {
    if (count > best.count) best = { key, count };
  }
  const [gender, ageGroup] = best.key.split("::");
  return { gender: gender as Gender, ageGroup: (ageGroup || null) as AgeGroup | null };
}

export interface OverallLeaderboardEntry {
  name: string;
  club: string;
  gender: Gender;
  ageGroup: AgeGroup | null;
  bestTimeSeconds: number;
  bestTimeDisplay: string;
  roundNumber: number | null;
  raceName: string;
}

export interface OverallFilter {
  gender?: Gender;
  ageGroup?: AgeGroup;
  club?: string;
}

/** Best single time per runner across all numbered races entered. No qualification threshold. */
export function getOverallLeaderboard(records: ResultRecord[], filter?: OverallFilter): OverallLeaderboardEntry[] {
  let pool = runnerRecords(numberedRecords(records)).filter((r) => r.timeSeconds !== null);
  if (filter?.gender) pool = pool.filter((r) => r.gender === filter.gender);
  if (filter?.ageGroup) pool = pool.filter((r) => r.ageGroup === filter.ageGroup);
  if (filter?.club) pool = pool.filter((r) => r.club === filter.club);

  const byName = groupByName(pool);
  const entries: OverallLeaderboardEntry[] = [];
  for (const [name, races] of byName) {
    const best = races.reduce((a, b) => (a.timeSeconds! < b.timeSeconds! ? a : b));
    entries.push({
      name,
      club: best.club,
      gender: best.gender,
      ageGroup: best.ageGroup,
      bestTimeSeconds: best.timeSeconds!,
      bestTimeDisplay: best.timeDisplay,
      roundNumber: best.roundNumber,
      raceName: best.raceName,
    });
  }
  return entries.sort((a, b) => a.bestTimeSeconds - b.bestTimeSeconds);
}

/** Distinct club names present in the dataset, sorted alphabetically. */
export function getClubs(records: ResultRecord[]): string[] {
  const clubs = new Set(runnerRecords(numberedRecords(records)).map((r) => r.club));
  return Array.from(clubs).sort((a, b) => a.localeCompare(b));
}

/** Men/Women only present if at least one runner in the dataset has that gender. */
export function getAvailableGenders(records: ResultRecord[]): Gender[] {
  const pool = runnerRecords(numberedRecords(records));
  const options: Gender[] = [];
  if (pool.some((r) => r.gender === "Men")) options.push("Men");
  if (pool.some((r) => r.gender === "Women")) options.push("Women");
  return options;
}

/** Age groups present in the dataset, in the standard Senior->O/75->Juvenile order. */
export function getAvailableAgeGroups(records: ResultRecord[]): AgeGroup[] {
  const pool = runnerRecords(numberedRecords(records));
  const present = new Set(pool.map((r) => r.ageGroup).filter((a): a is AgeGroup => a !== null));
  return [...ADULT_AGE_GROUPS, "Juvenile" as const].filter((ag) => present.has(ag));
}

export interface LeagueLeaderboardEntry {
  name: string;
  club: string;
  gender: Gender;
  ageGroup: AgeGroup | null;
  racesEntered: number;
  qualified: boolean;
  leagueTotalSeconds: number | null;
  leagueTotalDisplay: string | null;
  leagueAverageDisplay: string | null;
  countedRaces: { roundNumber: number | null; raceName: string; timeSeconds: number }[];
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Sum of each qualifying athlete's fastest 8-of-13 times. Athletes under 8 races are still returned, unranked, with progress info. */
export function getLeagueLeaderboard(records: ResultRecord[]): LeagueLeaderboardEntry[] {
  const pool = runnerRecords(numberedRecords(records)).filter((r) => r.timeSeconds !== null);
  const byName = groupByName(pool);

  const entries: LeagueLeaderboardEntry[] = [];
  for (const [name, races] of byName) {
    const { gender, ageGroup } = modeCategory(races);
    const sorted = [...races].sort((a, b) => a.timeSeconds! - b.timeSeconds!);
    const qualified = races.length >= QUALIFICATION_THRESHOLD;
    const counted = qualified ? sorted.slice(0, QUALIFICATION_THRESHOLD) : [];
    const total = qualified ? counted.reduce((sum, r) => sum + r.timeSeconds!, 0) : null;

    entries.push({
      name,
      club: races[0].club,
      gender,
      ageGroup,
      racesEntered: races.length,
      qualified,
      leagueTotalSeconds: total,
      leagueTotalDisplay: total !== null ? formatSeconds(total) : null,
      leagueAverageDisplay: total !== null ? formatSeconds(Math.round(total / QUALIFICATION_THRESHOLD)) : null,
      countedRaces: counted.map((r) => ({ roundNumber: r.roundNumber, raceName: r.raceName, timeSeconds: r.timeSeconds! })),
    });
  }

  return entries.sort((a, b) => {
    if (a.qualified && b.qualified) return a.leagueTotalSeconds! - b.leagueTotalSeconds!;
    if (a.qualified) return -1;
    if (b.qualified) return 1;
    return b.racesEntered - a.racesEntered;
  });
}

export interface SeriesPositions {
  topMen: LeagueLeaderboardEntry[];
  topWomen: LeagueLeaderboardEntry[];
  ageCategoryWinners: { gender: "Men" | "Women"; ageGroup: AgeGroup; winner: LeagueLeaderboardEntry }[];
  juvenileWinner: LeagueLeaderboardEntry | null;
}

/**
 * Series prizes: top 3 men, top 3 women, and each age-category winner, all
 * restricted to qualified (8+ race) athletes. Juvenile has no gender split
 * in the source data, so per user decision it's one combined winner rather
 * than a Men's/Women's Juvenile split.
 */
export function getSeriesPositions(league: LeagueLeaderboardEntry[]): SeriesPositions {
  const qualified = league.filter((e) => e.qualified);

  const men = qualified.filter((e) => e.gender === "Men" && e.ageGroup !== "Juvenile");
  const women = qualified.filter((e) => e.gender === "Women" && e.ageGroup !== "Juvenile");

  const ageCategoryWinners: SeriesPositions["ageCategoryWinners"] = [];
  for (const ageGroup of ADULT_AGE_GROUPS) {
    const menInGroup = men.filter((e) => e.ageGroup === ageGroup);
    const womenInGroup = women.filter((e) => e.ageGroup === ageGroup);
    if (menInGroup.length > 0) ageCategoryWinners.push({ gender: "Men", ageGroup, winner: menInGroup[0] });
    if (womenInGroup.length > 0) ageCategoryWinners.push({ gender: "Women", ageGroup, winner: womenInGroup[0] });
  }

  const juveniles = qualified.filter((e) => e.ageGroup === "Juvenile");

  return {
    topMen: men.slice(0, 3),
    topWomen: women.slice(0, 3),
    ageCategoryWinners,
    juvenileWinner: juveniles[0] ?? null,
  };
}

export interface RaceHighlights {
  roundNumber: number | null;
  raceName: string;
  podiumMen: string[];
  podiumWomen: string[];
  categoryWinners: { label: string; name: string }[];
}

/** Per-race top-3-gender podiums and age-category winners (incl. combined Juvenile), one entry per numbered race. */
export function getRaceHighlights(records: ResultRecord[]): RaceHighlights[] {
  const byRace = new Map<string, ResultRecord[]>();
  for (const r of runnerRecords(numberedRecords(records)).filter((r) => r.timeSeconds !== null)) {
    const key = `${r.roundNumber}`;
    if (!byRace.has(key)) byRace.set(key, []);
    byRace.get(key)!.push(r);
  }

  const highlights: RaceHighlights[] = [];
  for (const [, raceRecords] of byRace) {
    const sorted = [...raceRecords].sort((a, b) => a.timeSeconds! - b.timeSeconds!);
    const men = sorted.filter((r) => r.gender === "Men" && r.ageGroup !== "Juvenile");
    const women = sorted.filter((r) => r.gender === "Women" && r.ageGroup !== "Juvenile");
    const juveniles = sorted.filter((r) => r.ageGroup === "Juvenile");

    const categoryWinners: RaceHighlights["categoryWinners"] = [];
    for (const ageGroup of ADULT_AGE_GROUPS) {
      const menWinner = men.find((r) => r.ageGroup === ageGroup);
      const womenWinner = women.find((r) => r.ageGroup === ageGroup);
      if (menWinner) categoryWinners.push({ label: `${ageGroup} Men`, name: menWinner.name });
      if (womenWinner) categoryWinners.push({ label: `${ageGroup} Women`, name: womenWinner.name });
    }
    if (juveniles[0]) categoryWinners.push({ label: "Juvenile", name: juveniles[0].name });

    highlights.push({
      roundNumber: sorted[0].roundNumber,
      raceName: sorted[0].raceName,
      podiumMen: men.slice(0, 3).map((r) => r.name),
      podiumWomen: women.slice(0, 3).map((r) => r.name),
      categoryWinners,
    });
  }

  return highlights.sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export interface RacePlacementInfo {
  totalFinishers: number;
  genderTotal: number;
  genderRank: number;
  categoryTotal: number;
  categoryRank: number;
}

/**
 * Per-race field-size context for a single result row: total finishers in
 * the race (all rows, including generic entries, since they took a place),
 * this runner's rank within their own gender/Juvenile pool, and their rank
 * within their specific age-category (e.g. "O/45 Men").
 */
export function getRacePlacements(records: ResultRecord[]): Map<string, RacePlacementInfo> {
  const byRound = new Map<number, ResultRecord[]>();
  for (const r of numberedRecords(records)) {
    const key = r.roundNumber!;
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(r);
  }

  const result = new Map<string, RacePlacementInfo>();
  for (const [, raceRecords] of byRound) {
    const totalFinishers = raceRecords.length;
    const byGender = new Map<Gender, ResultRecord[]>();
    const byCategory = new Map<string, ResultRecord[]>();
    for (const r of raceRecords) {
      if (r.isGenericEntry) continue;
      if (!byGender.has(r.gender)) byGender.set(r.gender, []);
      byGender.get(r.gender)!.push(r);
      const categoryKey = `${r.gender}::${r.ageGroup}`;
      if (!byCategory.has(categoryKey)) byCategory.set(categoryKey, []);
      byCategory.get(categoryKey)!.push(r);
    }

    const genderRankByKey = new Map<string, { rank: number; total: number }>();
    for (const [, group] of byGender) {
      const sorted = [...group].sort((a, b) => a.place - b.place);
      sorted.forEach((r, i) => {
        genderRankByKey.set(`${r.roundNumber}::${r.name}::${r.place}`, { rank: i + 1, total: sorted.length });
      });
    }

    const categoryRankByKey = new Map<string, { rank: number; total: number }>();
    for (const [, group] of byCategory) {
      const sorted = [...group].sort((a, b) => a.place - b.place);
      sorted.forEach((r, i) => {
        categoryRankByKey.set(`${r.roundNumber}::${r.name}::${r.place}`, { rank: i + 1, total: sorted.length });
      });
    }

    for (const r of raceRecords) {
      if (r.isGenericEntry) continue;
      const key = `${r.roundNumber}::${r.name}::${r.place}`;
      const genderInfo = genderRankByKey.get(key)!;
      const categoryInfo = categoryRankByKey.get(key)!;
      result.set(key, {
        totalFinishers,
        genderTotal: genderInfo.total,
        genderRank: genderInfo.rank,
        categoryTotal: categoryInfo.total,
        categoryRank: categoryInfo.rank,
      });
    }
  }
  return result;
}

export function racePlacementKey(r: ResultRecord): string {
  return `${r.roundNumber}::${r.name}::${r.place}`;
}

export interface RecordsEntry {
  name: string;
  count: number;
}

export interface RecordsTables {
  mostPodiums: RecordsEntry[];
  mostCategoryWins: RecordsEntry[];
}

/** Most overall gender-podium finishes and most age-category wins across the season, per athlete. */
export function getRecordsTables(records: ResultRecord[]): RecordsTables {
  const highlights = getRaceHighlights(records);

  const podiumCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const race of highlights) {
    for (const name of [...race.podiumMen, ...race.podiumWomen]) {
      podiumCounts.set(name, (podiumCounts.get(name) ?? 0) + 1);
    }
    for (const { name } of race.categoryWinners) {
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    }
  }

  const toSorted = (m: Map<string, number>): RecordsEntry[] =>
    Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return { mostPodiums: toSorted(podiumCounts), mostCategoryWins: toSorted(categoryCounts) };
}

export interface RunnerProfile {
  name: string;
  club: string;
  races: ResultRecord[];
  attendance: number;
  personalBestSeconds: number | null;
  personalBestDisplay: string | null;
  league: LeagueLeaderboardEntry | null;
  trophies: {
    roundNumber: number | null;
    raceName: string;
    achievements: { type: string; position: string }[];
  }[];
}

export function getRunnerProfile(records: ResultRecord[], name: string): RunnerProfile | null {
  const races = numberedRecords(records)
    .filter((r) => r.name === name && !r.isGenericEntry)
    .sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
  if (races.length === 0) return null;

  const timed = races.filter((r) => r.timeSeconds !== null);
  const pb = timed.length > 0 ? Math.min(...timed.map((r) => r.timeSeconds!)) : null;

  const league = getLeagueLeaderboard(records).find((e) => e.name === name) ?? null;
  const highlights = getRaceHighlights(records);

  const trophies: RunnerProfile["trophies"] = [];
  for (const race of highlights) {
    const achievements: { type: string; position: string }[] = [];
    const menIdx = race.podiumMen.indexOf(name);
    if (menIdx !== -1) achievements.push({ type: "Overall Men's Podium", position: ordinal(menIdx + 1) });
    const womenIdx = race.podiumWomen.indexOf(name);
    if (womenIdx !== -1) achievements.push({ type: "Overall Women's Podium", position: ordinal(womenIdx + 1) });
    const catWin = race.categoryWinners.find((c) => c.name === name);
    if (catWin) {
      achievements.push({ type: `${catWin.label} Category`, position: "1st" });
    }
    if (achievements.length > 0) {
      trophies.push({ roundNumber: race.roundNumber, raceName: race.raceName, achievements });
    }
  }

  return {
    name,
    club: races[0].club,
    races,
    attendance: races.length,
    personalBestSeconds: pb,
    personalBestDisplay: pb !== null ? formatSeconds(pb) : null,
    league,
    trophies,
  };
}
