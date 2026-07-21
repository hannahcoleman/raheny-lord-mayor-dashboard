# Lord Mayor of Raheny Two Mile Series Dashboard

Scrapes results for Raheny Shamrock A.C.'s Lord Mayor of Raheny Two Mile Series from
[rahenyshamrock.ie](https://rahenyshamrock.ie/?cat=6) and presents leaderboards, weekly
results, series standings, and per-runner history.

## Weekly refresh

After a new round is posted:

```
cd scraper && npm run scrape
cd ../web && npm run dev    # (sync-data runs automatically before dev/build)
```

`npm run scrape` re-fetches the results index, re-parses every round post, and rewrites
`scraper/data/dataset.json`, `rounds.json`, `duplicates-flagged.json`, and
`alias-suggestions.json`. It never touches `scraper/data/aliases.json` once it exists —
that file is yours to edit by hand.

## Reviewing data-quality flags after each scrape

- **`scraper/data/duplicates-flagged.json`** — same name appearing twice in one race's
  results table. Both rows are kept in the dataset as-is; the scraper deliberately never
  auto-drops or auto-merges either one. This file just tells you where to look so you can
  decide by hand (e.g. checking the club's own records) whether it's two different people
  or a data-entry error.
- **`scraper/data/alias-suggestions.json`** — pairs of names (same surname, small edit
  distance) that might be the same person misspelled two ways. Never auto-applied. To
  merge two names, add an entry to `scraper/data/aliases.json`:
  ```json
  { "Phil Behan": "Philip Behan" }
  ```
  Re-run `npm run scrape` afterward so the merge takes effect.

## Known data-quality quirks in the source site (found while building this)

- Round 7's results table used `mm:ss` (colon) instead of the `mm.ss` (dot) format every
  other round uses — the scraper accepts either.
- One entry (Round 6, Robert Cooper) had a time missing a digit (`"14.4"`); the scraper
  assumes a trailing zero was dropped and treats it as `14.40`. If a similar single-digit
  time shows up in a future round, check `scraper/data/dataset.json` for a console warning
  printed during `npm run scrape`.
- "Juvenile" never carries a gender suffix in the results tables (every adult category
  does, e.g. "O/45 Men"), so it's scored as one combined category rather than split into
  Juvenile Men/Juvenile Women — confirmed with the site owner as the intended behavior.
- At least one runner ("Niall Mongey") has been recorded under two different categories
  in different rounds (Senior Men in one race, Juvenile in another) — likely two family
  members sharing a name rather than one person's category changing. Worth a manual check
  if it affects a series prize; the dashboard currently just displays whichever category
  was attached to their fastest race.

## Project layout

- `scraper/` — Node/TypeScript scraper (Cheerio), writes to `scraper/data/*.json`.
- `web/` — Vite + React + TypeScript dashboard, reads a copy of that data from
  `web/public/*.json` (synced by `npm run sync-data`).

## Scoring rules implemented

- **Overall leaderboard**: each runner's single fastest time across numbered rounds
  entered (1–13). No qualification threshold. Filterable by gender/age group.
- **League leaderboard**: sum of an athlete's fastest 8 times out of the 13 numbered
  rounds; requires 8+ races entered to qualify. Round 14 (Jim Wall Memorial Handicap)
  never counts toward this or any other series calculation.
- **Series positions**: top 3 men, top 3 women, and each age-category winner (by League
  total), restricted to qualified athletes.
- **Records**: most overall gender podiums and most age-category wins across the season.
- **Handicap**: fully standalone section; scoring approach TBD until Round 14 is posted
  and its results format can be seen.
