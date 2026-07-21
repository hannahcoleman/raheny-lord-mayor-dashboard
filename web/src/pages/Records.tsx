import { useMemo } from "react";
import { useDataset } from "../lib/useDataset";
import { getRecordsTables } from "../lib/scoring";
import RunnerLink from "../components/RunnerLink";

export default function Records() {
  const { records, loading, error } = useDataset();
  const tables = useMemo(() => getRecordsTables(records), [records]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  return (
    <div>
      <h2>Records &amp; Most Decorated</h2>

      <div className="card">
        <h3>Most Overall Gender Podiums (Top 10)</h3>
        <p>Top-3 finish within Men's or Women's overall standings in a single race.</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Podiums</th>
            </tr>
          </thead>
          <tbody>
            {tables.mostPodiums.slice(0, 10).map((e, i) => (
              <tr key={e.name}>
                <td>{i + 1}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Most Age-Category Wins (Top 10)</h3>
        <p>Winning your age category in a given race.</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Category wins</th>
            </tr>
          </thead>
          <tbody>
            {tables.mostCategoryWins.slice(0, 10).map((e, i) => (
              <tr key={e.name}>
                <td>{i + 1}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
