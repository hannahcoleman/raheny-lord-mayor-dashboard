import { useState } from "react";
import { useDataset } from "../lib/useDataset";

const ADMIN_PASSWORD_HASH = "c55ecb65733d09b012bdfb2bd943ec14c1e8c4845d4bf8d782db774e3cdebeec";
const WORKFLOW_URL = "https://github.com/hannahcoleman/raheny-lord-mayor-dashboard/actions/workflows/scrape.yml";

const SCORING_LOGIC: { aspect: string; approach: string }[] = [
  { aspect: "Course distance", approach: "2 miles per race (fixed) - used to compute pace/mile and pace/km on runner profiles." },
  {
    aspect: "Overall leaderboard",
    approach: "Each runner's single fastest time across all numbered rounds (1-13) entered. No minimum races required.",
  },
  {
    aspect: "League leaderboard",
    approach: "Sum of a runner's fastest 8 times out of the 13 numbered rounds. Requires 8+ races entered to qualify; lowest total wins.",
  },
  {
    aspect: "League average",
    approach: "League total divided by 8, shown for information only - ranking is always by League total, never by average.",
  },
  {
    aspect: "Series positions",
    approach: "Top 3 men, top 3 women, and each age-category winner, by League total, restricted to qualified (8+ race) runners.",
  },
  {
    aspect: "Juvenile category",
    approach:
      "The source results never split Juvenile by gender, so it's scored as one combined category (no separate Juvenile Men/Women).",
  },
  {
    aspect: "Round 14 (Jim Wall Memorial Handicap)",
    approach: "Fully excluded from Overall, League, Series Positions, and Records - shown only on its own standalone page.",
  },
  { aspect: "Records - most podiums", approach: "Count of top-3 overall (by gender) finishes across the season, per runner." },
  { aspect: "Records - most category wins", approach: "Count of age-category wins (1st in category in a single race) across the season, per runner." },
  {
    aspect: "Same-race duplicate names",
    approach: "Both entries kept as scraped, never auto-merged or dropped. Listed in Data Integrity Issues above for manual review.",
  },
  {
    aspect: "Cross-week category changes",
    approach:
      "A single clean move to an older bracket (same gender, stays there for the rest of the season) is treated as a genuine mid-season birthday and not flagged. Anything else - reverting back, moving to a younger bracket, or involving Juvenile - is listed in Category Changes above for manual review.",
  },
  {
    aspect: 'Generic "A Runner" entries',
    approach: "Excluded from all individual leaderboards, records, and runner profiles, but counted toward each race's total finisher count.",
  },
  {
    aspect: "Name variants / typos",
    approach: "Manual mapping only (aliases.json). Likely matches are suggested from the data but never auto-applied.",
  },
  {
    aspect: "Malformed or ambiguous times",
    approach:
      'A single-digit-seconds time (e.g. "14.4") is assumed to be missing a trailing zero and logged as such. Otherwise-unparseable times are excluded from time-based rankings but still shown in the raw weekly results.',
  },
];

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await sha256Hex(password);
    if (hash === ADMIN_PASSWORD_HASH) {
      onUnlock();
    } else {
      setWrongPassword(true);
    }
  };

  return (
    <div className="card">
      <h3>Data Integrity, Category Changes &amp; Scoring Logic</h3>
      <p>Enter the admin password to view flagged data issues, the scoring-logic reference table, and manual refresh controls.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
        />
        <button type="submit" className="btn">
          Unlock
        </button>
      </form>
      {wrongPassword && <p style={{ color: "#b00020" }}>Incorrect password.</p>}
    </div>
  );
}

export default function Updates() {
  const { refreshLog, duplicatesFlagged, categoryChangesFlagged, loading, error } = useDataset();
  const [unlocked, setUnlocked] = useState(false);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  return (
    <div>
      <h2>Data Updates</h2>
      <p>
        Results are scraped automatically every Wednesday at 9am (Irish time) until 2 September 2026, when this
        season's numbered rounds and the handicap should be complete. Each run below shows what changed compared to
        the previous scrape.
      </p>

      {refreshLog.length === 0 ? (
        <div className="card">No refresh history yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Rounds scraped</th>
                <th>New races</th>
                <th>Changed races</th>
              </tr>
            </thead>
            <tbody>
              {refreshLog.map((entry, i) => (
                <tr key={i}>
                  <td>{formatTimestamp(entry.timestamp)}</td>
                  <td>{entry.roundsScraped}</td>
                  <td>{entry.newRaces.length > 0 ? entry.newRaces.join(", ") : "—"}</td>
                  <td>{entry.changedRaces.length > 0 ? entry.changedRaces.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!unlocked ? (
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      ) : (
        <>
          <h3>Data Integrity Issues</h3>
          <p>
            Problems found in the source results tables while scraping, and how each was handled. These are never
            auto-resolved - both entries are kept in the dataset as scraped until reviewed by hand.
          </p>
          {duplicatesFlagged.length === 0 ? (
            <div className="card">No same-race duplicate entries flagged.</div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Issue</th>
                    <th>Approach taken</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicatesFlagged.map((flag, i) => (
                    <tr key={i}>
                      <td>{flag.raceName}</td>
                      <td>
                        "{flag.name}" appears twice in the results (place{" "}
                        {flag.occurrences.map((o) => o.place).join(" and ")}, times{" "}
                        {flag.occurrences.map((o) => o.timeDisplay).join(" and ")})
                      </td>
                      <td>Both entries kept as separate results, flagged for manual review</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3>Category Changes</h3>
          <p>
            Runners recorded under a different gender/age-category in different weeks, excluding a single clean move
            to an older bracket that then holds for the rest of the season (treated as a genuine birthday, not
            flagged). Each race is still scored with that week's recorded category as-is - nothing here is
            auto-corrected.
          </p>
          {categoryChangesFlagged.length === 0 ? (
            <div className="card">No cross-week category changes flagged.</div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Categories by week</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryChangesFlagged.map((flag, i) => (
                    <tr key={i}>
                      <td>{flag.name}</td>
                      <td>{flag.occurrences.map((o) => `${o.raceName}: ${o.category}`).join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <h3>Manual Data Refresh</h3>
            <p>
              This opens the "Weekly data refresh" workflow on GitHub. You'll need to be logged into GitHub with
              access to this repo to actually click "Run workflow" there — the password above is just a casual gate
              on this page, not real security, since anything shipped to a public site is visible to anyone who
              looks.
            </p>
            <a className="btn" href={WORKFLOW_URL} target="_blank" rel="noreferrer">
              Open GitHub Actions to Run Refresh
            </a>
          </div>

          <h3>Scoring &amp; Data-Handling Logic</h3>
          <p>Current approach for each scoring rule and data-handling decision, for reference while validating against the club.</p>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>Current approach</th>
                </tr>
              </thead>
              <tbody>
                {SCORING_LOGIC.map((row, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{row.aspect}</td>
                    <td>{row.approach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
