import * as cheerio from "cheerio";
import type { RoundMeta } from "./types.js";

const BASE = "https://rahenyshamrock.ie";
const UA = "Mozilla/5.0 (compatible; RahenyLordMayorScraper/1.0)";

const CUP_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /tommy\s*lynam/i, name: "Tommy Lynam Cup" },
  { regex: /john\s*fennell/i, name: "John Fennell Cup" },
  { regex: /peter\s*doody/i, name: "Peter Doody Cup" },
];

const HANDICAP_PATTERN = /jim\s*wall/i;
const SERIES_PATTERN = /lord\s*mayor/i;

function parseIrishDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

interface IndexEntry {
  title: string;
  url: string;
  date: string;
}

async function fetchIndexPage(page: number): Promise<{ entries: IndexEntry[]; hasNext: boolean }> {
  const url = page === 1 ? `${BASE}/?cat=6` : `${BASE}/?cat=6&paged=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Failed to fetch index page ${page}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const entries: IndexEntry[] = [];
  $("article[id^='post-']").each((_, el) => {
    const titleLink = $(el).find(".entry-title a").first();
    const title = titleLink.text().trim();
    const href = titleLink.attr("href");
    const clockText = $(el).find(".fa-clock-o").parent().text().trim();
    const date = parseIrishDate(clockText);
    if (title && href && date) {
      entries.push({ title, url: href, date });
    }
  });

  const hasNext = $(".pagination a.next.page-numbers").length > 0;
  return { entries, hasNext };
}

/**
 * Crawls the results index, matching titles against the Lord Mayor series
 * patterns (including cup names for rounds 4/8/13, which don't mention
 * "Lord Mayor" at all) and the Jim Wall Memorial Handicap. Stops paginating
 * once entries fall before the target season year, since the index is
 * reverse-chronological.
 */
export async function fetchSeasonRounds(targetYear: number): Promise<RoundMeta[]> {
  const matches: Omit<RoundMeta, "roundNumber">[] = [];
  let page = 1;
  let keepGoing = true;

  while (keepGoing) {
    const { entries, hasNext } = await fetchIndexPage(page);
    if (entries.length === 0) break;

    for (const entry of entries) {
      const entryYear = Number(entry.date.slice(0, 4));
      if (entryYear < targetYear) {
        keepGoing = false;
        continue;
      }
      if (entryYear > targetYear) continue;

      const isHandicap = HANDICAP_PATTERN.test(entry.title);
      const cupMatch = CUP_PATTERNS.find((c) => c.regex.test(entry.title));
      const isSeries = SERIES_PATTERN.test(entry.title) || !!cupMatch || isHandicap;
      if (!isSeries) continue;

      matches.push({
        cupName: cupMatch ? cupMatch.name : null,
        isHandicap,
        title: entry.title,
        url: entry.url,
        date: entry.date,
      });
    }

    if (!hasNext) break;
    page += 1;
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));

  const seriesMatches = matches.filter((m) => !m.isHandicap);
  const handicapMatches = matches.filter((m) => m.isHandicap);

  const expectedCups: Record<number, string> = { 4: "Tommy Lynam Cup", 8: "John Fennell Cup", 13: "Peter Doody Cup" };

  const numbered: RoundMeta[] = seriesMatches.map((m, i) => {
    const roundNumber = i + 1;
    const expectedCup = expectedCups[roundNumber];
    if (expectedCup && m.cupName !== expectedCup) {
      console.warn(
        `Warning: Round ${roundNumber} expected cup "${expectedCup}" but post "${m.title}" has cupName=${m.cupName}`
      );
    }
    return { ...m, roundNumber };
  });

  const handicap: RoundMeta[] = handicapMatches.map((m) => ({ ...m, roundNumber: null }));

  return [...numbered, ...handicap];
}
