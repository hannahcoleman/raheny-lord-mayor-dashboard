import { useDataset } from "../lib/useDataset";

export default function Handicap() {
  const { records, rounds, loading, error } = useDataset();

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const handicapRound = rounds.find((r) => r.isHandicap);
  const handicapRecords = records.filter((r) => r.roundNumber === null);

  return (
    <div>
      <h2>Jim Wall Memorial Handicap</h2>
      <p>
        A standalone handicap race run after the 13 numbered rounds. It does not count toward series qualification,
        attendance, or any league/overall leaderboard on this site.
      </p>

      {!handicapRound ? (
        <div className="card">
          This round hasn't been posted yet this season. Once it's run, results will appear here — its scoring approach
          still needs confirming since handicap races are typically scored differently from raw finishing time (e.g. a
          staggered start based on ability), and the source page's exact format hasn't been seen yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Name</th>
                <th>Club</th>
                <th>Category</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {handicapRecords.map((r, i) => (
                <tr key={i}>
                  <td>{r.place}</td>
                  <td>{r.name}</td>
                  <td>{r.club}</td>
                  <td>{r.category}</td>
                  <td>{r.timeDisplay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
