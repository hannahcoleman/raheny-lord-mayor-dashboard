import { useDataset } from "../lib/useDataset";
import { getRaceHighlights, numberedRecords, runnerRecords } from "../lib/scoring";
import { formatDisplayDate } from "../lib/date";
import RunnerLink from "../components/RunnerLink";

const CUP_NAMES: Record<number, string> = { 4: "Tommy Lynam Cup", 8: "John Fennell Cup", 13: "Peter Doody Cup" };
const TOTAL_ROUNDS = 13;

export default function SeasonOverview() {
  const { records, rounds, loading, error } = useDataset();

  if (loading) return <p>Loading season data…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const highlights = getRaceHighlights(records);
  const finisherCounts = new Map<number, number>();
  for (const r of runnerRecords(numberedRecords(records))) {
    finisherCounts.set(r.roundNumber!, (finisherCounts.get(r.roundNumber!) ?? 0) + 1);
  }

  const rows = Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
    const roundNumber = i + 1;
    const round = rounds.find((r) => r.roundNumber === roundNumber);
    const highlight = highlights.find((h) => h.roundNumber === roundNumber);
    return { roundNumber, round, highlight };
  });

  return (
    <div>
      <h2>Season Overview</h2>
      <p>{rounds.filter((r) => !r.isHandicap).length} of {TOTAL_ROUNDS} numbered rounds run so far this season.</p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Date</th>
              <th>Men's winner</th>
              <th>Women's winner</th>
              <th>Finishers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ roundNumber, round, highlight }) => (
              <tr key={roundNumber}>
                <td>
                  Round {roundNumber}
                  {CUP_NAMES[roundNumber] && <div className="pill">{CUP_NAMES[roundNumber]}</div>}
                </td>
                <td>{round?.date ? formatDisplayDate(round.date) : "—"}</td>
                <td>{highlight?.podiumMen[0] ? <RunnerLink name={highlight.podiumMen[0]} /> : round ? "—" : "Not yet run"}</td>
                <td>{highlight?.podiumWomen[0] ? <RunnerLink name={highlight.podiumWomen[0]} /> : round ? "—" : "Not yet run"}</td>
                <td>{round ? finisherCounts.get(roundNumber) ?? 0 : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
