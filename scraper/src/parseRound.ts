import * as cheerio from "cheerio";
import type { RawRow } from "./types.js";

const UA = "Mozilla/5.0 (compatible; RahenyLordMayorScraper/1.0)";

/** Fetches a single round's post and parses its TablePress results table. */
export async function parseRoundPage(url: string): Promise<RawRow[]> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Failed to fetch round page ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows: RawRow[] = [];
  $("table.tablepress tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();
    if (cells.length < 5) return;
    const [place, name, club, category, time] = cells;
    if (!place || !name) return;
    rows.push({ place, name, club, category, time });
  });

  return rows;
}
