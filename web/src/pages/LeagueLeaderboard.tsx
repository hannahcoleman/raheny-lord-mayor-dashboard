import { useMemo } from "react";
import { useDataset } from "../lib/useDataset";
import { getLeagueLeaderboard } from "../lib/scoring";
import { QUALIFICATION_THRESHOLD } from "../lib/types";
import RunnerLink from "../components/RunnerLink";

export default function LeagueLeaderboard() {
  const { records, loading, error } = useDataset();
  const league = useMemo(() => getLeagueLeaderboard(records), [records]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const qualified = league.filter((e) => e.qualified);
  const unqualified = league.filter((e) => !e.qualified);

  return (
    <div>
      <h2>League Leaderboard</h2>
      <p>
        Sum of each qualifying athlete's fastest {QUALIFICATION_THRESHOLD} times out of 13 numbered rounds. Lowest total wins.
        Athletes need at least {QUALIFICATION_THRESHOLD} races to qualify.
      </p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Club</th>
              <th>Category</th>
              <th>Races</th>
              <th>League total</th>
            </tr>
          </thead>
          <tbody>
            {qualified.map((e, i) => (
              <tr key={e.name}>
                <td>{i + 1}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>{e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}</td>
                <td>{e.racesEntered}</td>
                <td>{e.leagueTotalDisplay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Not yet qualified</h3>
      <p>Progress toward the {QUALIFICATION_THRESHOLD}-race qualification threshold.</p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Club</th>
              <th>Category</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {unqualified.map((e) => (
              <tr key={e.name}>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>{e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}</td>
                <td>
                  {e.racesEntered} of {QUALIFICATION_THRESHOLD}
                  <div style={{ background: "var(--rs-border)", borderRadius: 4, height: 6, marginTop: 4, width: 140 }}>
                    <div
                      style={{
                        background: "var(--rs-green)",
                        height: 6,
                        borderRadius: 4,
                        width: `${Math.min(100, (e.racesEntered / QUALIFICATION_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
