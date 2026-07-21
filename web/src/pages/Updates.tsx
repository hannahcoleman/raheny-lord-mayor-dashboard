import { useState } from "react";
import { useDataset } from "../lib/useDataset";

const ADMIN_PASSWORD_HASH = "c55ecb65733d09b012bdfb2bd943ec14c1e8c4845d4bf8d782db774e3cdebeec";
const WORKFLOW_URL = "https://github.com/hannahcoleman/raheny-lord-mayor-dashboard/actions/workflows/scrape.yml";

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

function AdminPanel() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await sha256Hex(password);
    if (hash === ADMIN_PASSWORD_HASH) {
      setUnlocked(true);
      setWrongPassword(false);
    } else {
      setWrongPassword(true);
    }
  };

  if (unlocked) {
    return (
      <div className="card">
        <h3>Manual Data Refresh</h3>
        <p>
          This opens the "Weekly data refresh" workflow on GitHub. You'll need to be logged into GitHub with access to
          this repo to actually click "Run workflow" there — the password above is just a casual gate on this page, not
          real security, since anything shipped to a public site is visible to anyone who looks.
        </p>
        <a className="btn" href={WORKFLOW_URL} target="_blank" rel="noreferrer">
          Open GitHub Actions to Run Refresh
        </a>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Admin</h3>
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
  const { refreshLog, loading, error } = useDataset();

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

      <AdminPanel />
    </div>
  );
}
