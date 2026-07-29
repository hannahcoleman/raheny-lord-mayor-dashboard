# Handoff — Lord Mayor of Raheny Two Mile Series Dashboard

**Status as of this handoff:** fully built, deployed, and working. Everything below is committed and pushed to `main` (26 commits, clean working tree). Nothing is uncommitted or lost — a new session in this same folder has every file already.

- **Live site:** https://hannahcoleman.github.io/raheny-lord-mayor-dashboard/
- **Repo:** https://github.com/hannahcoleman/raheny-lord-mayor-dashboard (public — required for free GitHub Pages)
- **Local path:** `/Users/hannahcoleman/Documents/Raheny Lord Mayor Dashboard/`

This is a **separate project/repo** from the Marathon Coach app that otherwise lives in this working directory — unrelated codebases, don't cross-reference them.

---

## What this is

Scrapes results for Raheny Shamrock A.C.'s "Lord Mayor of Raheny Two Mile Series" (13 numbered rounds + a Round 14 handicap) from rahenyshamrock.ie, and presents leaderboards/standings/runner profiles styled to match the club's own site (green `#00A35F`, charcoal nav, Oswald headings).

## Architecture

```
raheny-lord-mayor-dashboard/
  scraper/          Node/TS (Cheerio), `npm run scrape` -> writes scraper/data/*.json
  web/               Vite + React + TS, reads a synced copy of that data
  .github/workflows/
    scrape.yml       Scheduled (Wed 9am Irish time / 8am UTC) + manual trigger
    deploy.yml       Builds & publishes to GitHub Pages
```

Scrape and display are fully decoupled: `scraper/data/*.json` is the source of truth (committed to git), `web/scripts/sync-data.mjs` copies it into `web/public/` before every `dev`/`build`. The web app never scrapes anything itself.

**Automation chain:** `scrape.yml` runs weekly, re-scrapes, commits+pushes if data changed → this push does **not** trigger `deploy.yml` via its normal `push` event (GitHub deliberately blocks the built-in `GITHUB_TOKEN` from triggering other workflows, anti-loop safeguard) → `deploy.yml` has an explicit `workflow_run` trigger watching for `scrape.yml` to complete, which is what actually fires the redeploy. This was a real bug caught by manually test-running the workflow — don't remove that trigger.

## Key decisions / non-obvious gotchas

- **Race day vs. post day:** races run **Tuesdays**; results get posted to the site the **next day**. The scraped post-date is one day late. `web/src/lib/schedule.ts` holds the real per-round dates (sourced from Eventmaster) and is what Season Overview displays — never the scraped date.
- **Cup rounds:** Round 4 = Tommy Lynam Cup, Round 8 = John Fennell Cup, Round 13 = Peter Doody Cup. These posts never say "Round N" or even "Lord Mayor" in the title — `scraper/src/fetchIndex.ts` identifies them by cup-name regex and assigns round numbers by chronological order among all matched posts.
- **Round 14 (Jim Wall Memorial Handicap)** is completely excluded from Overall/League/Series Positions/Records — it's `roundNumber: null` in the data model and has its own standalone page. Hasn't been run yet this season; its results-page format (and therefore its scoring approach) is still unknown — build that out once it's actually posted.
- **Juvenile category has no gender in the source data.** Two different mechanisms handle this, don't conflate them:
  1. The Juvenile *age-category* (League/Series/category-wins scoring) is **always** one combined group, never split by gender — this is fixed and was an early, explicit user decision.
  2. Separately, whether a Juvenile counts toward the **Overall Men's/Women's Podium** is controlled by `scraper/data/juvenile-genders.json` (human-curated, name → "Men"/"Women", currently has all 31 of this season's juveniles confirmed). `scraper/data/juvenile-gender-suggestions.json` is auto-generated each scrape from a first-name heuristic (`scraper/src/inferJuvenileGender.ts`) but only lists names **not already** in the confirmed file — matched by exact full name, never first-name-only, so a future juvenile sharing a first name with someone already confirmed still gets its own suggestion entry. Nothing in the suggestions file is ever applied automatically.
- **Data-quality handling, all deliberately non-destructive** (flag, never auto-fix):
  - Same-race duplicate names → `scraper/src/flagDuplicates.ts` → `duplicates-flagged.json`. Both rows kept as-is.
  - Cross-week category changes → `scraper/src/flagCategoryChanges.ts` → `category-changes-flagged.json`. A single clean move to an *older* age bracket that then holds for the rest of the season is treated as a genuine birthday and **not** flagged (e.g. Christy Reilly O/65→O/70); anything else (reverting, moving younger, involving Juvenile) stays flagged.
  - Name typos/variants → `scraper/data/aliases.json` (human-curated, empty by default) + `alias-suggestions.json` (auto-generated candidates, edit-distance ≤2 on same surname).
  - One-off malformed times (e.g. `"14.4"` missing a trailing zero) → logged and auto-corrected with an assumption; genuinely unparseable times are excluded from time-based rankings but still shown in raw results tables.
- **Course is a fixed 2 miles** — used to compute pace/mile and pace/km on the Runner Profile page (`COURSE_MILES` / `COURSE_KM` constants in `web/src/pages/RunnerProfile.tsx`).
- **GitHub Pages has no server-side routing.** `web/package.json`'s build script copies `dist/index.html` → `dist/404.html` so direct links to any route (not just `/`) work. `BrowserRouter` uses `basename={import.meta.env.BASE_URL}` and all data fetches in `useDataset.ts` are relative to that same base — don't hardcode `/dataset.json`-style absolute paths anywhere.
- **Admin gate on the Updates page is a soft deterrent, not real security** (SHA-256 hash comparison client-side, password `race123`). Data Integrity Issues, Category Changes, and the Scoring Logic reference table are all gated behind it. The "Manual Data Refresh" button it reveals just links to GitHub's own Actions page — the actual protection is GitHub's login, not the password. Never embed a write-scoped token in the public bundle to make this "more automatic."
- **Mobile tables:** `.card` has `overflow-x: auto` and `.card table` has `min-width: 500px` (in `web/src/lib/theme.css`) so wide tables scroll within their card instead of breaking the page layout. Don't remove this.
- **Records ties:** `web/src/pages/Records.tsx` extends past the nominal top-10 cutoff to include anyone tied with the 10th-place entry, and shows `=` instead of a higher rank number for ties (`topNWithTies` / `rankLabel` helpers there).
- **`gh` CLI** was downloaded standalone (not via brew) into the session scratchpad to drive GitHub Actions from the terminal — that path won't exist in a fresh session/shell. A new session should either install `gh` again the same way (download release binary, no brew available) or just use the GitHub web UI / `git push` (deploy triggers automatically on push to `main` regardless of how it's pushed).

## Current season data state

- 8 of 13 numbered rounds scraped (through Round 8, John Fennell Cup). Rounds 9–13 + Round 14 not yet run.
- All 31 juveniles seen so far have confirmed genders in `juvenile-genders.json`.
- Known flagged data issues (visible on `/updates`, password `race123`): 4 same-race duplicates, 4 cross-week category changes (Josh Jaoob, Elaine McNulty, Mel Hearns, Niall Mongey — Niall is very likely two different people sharing a name, not one runner).

## Recommended weekly workflow (for whoever operates this going forward)

Fully automatic already (Wed 9am Irish time), but to run by hand:
```
cd scraper && npm run scrape
git add -A && git commit -m "Round N results" && git push
```
Push triggers `deploy.yml` automatically.

## Open items / natural next steps

1. **Round 14 (Jim Wall Memorial Handicap)** scoring is unbuilt — its results page format is unknown until it's actually posted (expected ~1 Sep 2026 per the schedule). The `/handicap` page currently just shows a placeholder.
2. Rounds 9–13 will keep coming in via the Wednesday automation; nothing manual needed unless the scraper hits a new edge case (new cup-name pattern, new data quirk) — check `/updates` (password-gated) after each run.
3. If a new Juvenile appears in a future round, `juvenile-gender-suggestions.json` will surface it automatically for review; add confirmed entries to `juvenile-genders.json` and re-scrape.
4. No outstanding bugs known at handoff time — last thing verified was the Records-table tie-handling, confirmed working live.

---

## Resume prompt for a new chat

Paste this into a fresh Claude Code session:

> Continue work on the Raheny Lord Mayor Two Mile Series dashboard at `/Users/hannahcoleman/Documents/Raheny Lord Mayor Dashboard/`. Read `HANDOFF.md` in that folder first for full context — it covers the architecture, key decisions/gotchas, and current state. The site is live at https://hannahcoleman.github.io/raheny-lord-mayor-dashboard/, repo is public at https://github.com/hannahcoleman/raheny-lord-mayor-dashboard, everything is committed and pushed. Ask me what to work on next, or if I've described a task above this prompt, start there.
