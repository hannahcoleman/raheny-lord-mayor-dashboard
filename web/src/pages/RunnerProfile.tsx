import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDataset } from "../lib/useDataset";
import { getRunnerProfile, getRacePlacements, racePlacementKey } from "../lib/scoring";
import { QUALIFICATION_THRESHOLD } from "../lib/types";

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RunnerProfile() {
  const { name = "" } = useParams();
  const decodedName = decodeURIComponent(name);
  const { records, loading, error } = useDataset();
  const profile = useMemo(() => getRunnerProfile(records, decodedName), [records, decodedName]);
  const placements = useMemo(() => getRacePlacements(records), [records]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;
  if (!profile) return <p>No results found for "{decodedName}".</p>;

  const chartData = profile.races
    .filter((r) => r.timeSeconds !== null)
    .map((r) => ({ round: r.roundNumber, timeSeconds: r.timeSeconds, label: r.timeDisplay }));

  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.club}</p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div className="pill">Season's best</div>
          <h3 style={{ margin: "0.4rem 0 0" }}>{profile.personalBestDisplay ?? "—"}</h3>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div className="pill">Attendance</div>
          <h3 style={{ margin: "0.4rem 0 0" }}>{profile.attendance} of 13</h3>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div className="pill">League total</div>
          <h3 style={{ margin: "0.4rem 0 0" }}>
            {profile.league?.qualified
              ? profile.league.leagueTotalDisplay
              : `${profile.league?.racesEntered ?? 0} of ${QUALIFICATION_THRESHOLD}`}
          </h3>
        </div>
      </div>

      <div className="card">
        <h3>Progression</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" label={{ value: "Round", position: "insideBottom", offset: -5 }} />
            <YAxis
              reversed
              tickFormatter={(v: number) => formatSeconds(v)}
              width={60}
              label={{ value: "Time", angle: -90, position: "insideLeft" }}
            />
            <Tooltip formatter={(v) => formatSeconds(Number(v))} labelFormatter={(l) => `Round ${l}`} />
            <Line type="monotone" dataKey="timeSeconds" stroke="var(--rs-green)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {profile.trophies.length > 0 && (
        <div className="card">
          <h3>Trophy History</h3>
          <table>
            <thead>
              <tr>
                <th>Race</th>
                <th>Achievement</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {profile.trophies.map((t, i) => (
                <tr key={i}>
                  <td>{t.raceName}</td>
                  <td>
                    {t.achievements.map((a, j) => (
                      <div key={j}>{a.type}</div>
                    ))}
                  </td>
                  <td>
                    {t.achievements.map((a, j) => (
                      <div key={j}>{a.position}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Place</th>
              <th>Gender Place</th>
              <th>Category</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {profile.races.map((r, i) => {
              const placement = placements.get(racePlacementKey(r));
              return (
                <tr key={i}>
                  <td>{r.raceName}</td>
                  <td>
                    {r.place}/{placement?.totalFinishers ?? "—"}
                  </td>
                  <td>{placement ? `${placement.genderRank}/${placement.genderTotal}` : "—"}</td>
                  <td>{r.category}</td>
                  <td>{r.timeDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
