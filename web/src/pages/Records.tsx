import { useMemo } from "react";
import { useDataset } from "../lib/useDataset";
import { getRecordsTables, type RecordsEntry } from "../lib/scoring";
import RunnerLink from "../components/RunnerLink";

/** Top N by count, extended to include anyone tied with the Nth entry. */
function topNWithTies(sorted: RecordsEntry[], n: number): RecordsEntry[] {
  if (sorted.length <= n) return sorted;
  const cutoffCount = sorted[n - 1].count;
  let end = n;
  while (end < sorted.length && sorted[end].count === cutoffCount) end++;
  return sorted.slice(0, end);
}

/** "=" for anyone tied with the row above, otherwise their position (1-indexed). */
function rankLabel(entries: RecordsEntry[], i: number): string {
  if (i > 0 && entries[i].count === entries[i - 1].count) return "=";
  return String(i + 1);
}

export default function Records() {
  const { records, juvenileGenders, loading, error } = useDataset();
  const tables = useMemo(() => getRecordsTables(records, juvenileGenders), [records, juvenileGenders]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const topPodiums = topNWithTies(tables.mostPodiums, 10);
  const topCategoryWins = topNWithTies(tables.mostCategoryWins, 10);

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
            {topPodiums.map((e, i) => (
              <tr key={e.name}>
                <td>{rankLabel(topPodiums, i)}</td>
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
            {topCategoryWins.map((e, i) => (
              <tr key={e.name}>
                <td>{rankLabel(topCategoryWins, i)}</td>
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
