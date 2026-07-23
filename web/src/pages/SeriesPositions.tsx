import { useMemo } from "react";
import { useDataset } from "../lib/useDataset";
import { getLeagueLeaderboard, getSeriesPositions } from "../lib/scoring";
import { QUALIFICATION_THRESHOLD } from "../lib/types";
import RunnerLink from "../components/RunnerLink";

export default function SeriesPositions() {
  const { records, loading, error } = useDataset();
  const positions = useMemo(() => getSeriesPositions(getLeagueLeaderboard(records)), [records]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const noneQualifiedYet = positions.topMen.length === 0 && positions.topWomen.length === 0;

  return (
    <div>
      <h2>Series Positions</h2>
      <p>
        Top 3 men, top 3 women, and each age-category leaders, based on League scoring and restricted to athletes who've
        completed at least {QUALIFICATION_THRESHOLD} of the 13 numbered rounds.
      </p>
      {noneQualifiedYet && (
        <div className="card">No one has reached the {QUALIFICATION_THRESHOLD}-race qualification threshold yet this season.</div>
      )}

      <div className="card">
        <h3>Top 3 Men</h3>
        <ol>
          {positions.topMen.map((e) => (
            <li key={e.name}>
              <RunnerLink name={e.name} /> — {e.leagueTotalDisplay}
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>Top 3 Women</h3>
        <ol>
          {positions.topWomen.map((e) => (
            <li key={e.name}>
              <RunnerLink name={e.name} /> — {e.leagueTotalDisplay}
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>Age Category Leaders</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Winner</th>
              <th>League total</th>
            </tr>
          </thead>
          <tbody>
            {positions.ageCategoryWinners.map((c) => (
              <tr key={`${c.gender}-${c.ageGroup}`}>
                <td>
                  {c.ageGroup} {c.gender}
                </td>
                <td>
                  <RunnerLink name={c.winner.name} />
                </td>
                <td>{c.winner.leagueTotalDisplay}</td>
              </tr>
            ))}
            {positions.juvenileWinner && (
              <tr>
                <td>Juvenile (combined)</td>
                <td>
                  <RunnerLink name={positions.juvenileWinner.name} />
                </td>
                <td>{positions.juvenileWinner.leagueTotalDisplay}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
