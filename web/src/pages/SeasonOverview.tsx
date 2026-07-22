import { useDataset } from "../lib/useDataset";
import { getRaceHighlights, numberedRecords } from "../lib/scoring";
import { formatDisplayDate } from "../lib/date";
import { PLANNED_SCHEDULE } from "../lib/schedule";
import RunnerLink from "../components/RunnerLink";

export default function SeasonOverview() {
  const { records, rounds, loading, error } = useDataset();

  if (loading) return <p>Loading season data…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const highlights = getRaceHighlights(records);
  // Includes generic "A Runner" entries - they took a real finishing place,
  // so the count here matches the field-size totals shown elsewhere
  // (Weekly Results / Runner Profile place-of-total).
  const finisherCounts = new Map<number, number>();
  for (const r of numberedRecords(records)) {
    finisherCounts.set(r.roundNumber!, (finisherCounts.get(r.roundNumber!) ?? 0) + 1);
  }
  const handicapFinishers = records.filter((r) => r.roundNumber === null).length;

  const rows = PLANNED_SCHEDULE.map((planned) => {
    const round = planned.isHandicap
      ? rounds.find((r) => r.isHandicap)
      : rounds.find((r) => r.roundNumber === planned.roundNumber);
    const highlight = highlights.find((h) => h.roundNumber === planned.roundNumber);
    return { planned, round, highlight };
  });

  return (
    <div>
      <h2>Season Overview</h2>
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
            {rows.map(({ planned, round, highlight }) => (
              <tr key={planned.roundNumber} style={planned.isHandicap ? { borderTop: "2px solid var(--rs-green)" } : undefined}>
                <td>
                  Round {planned.roundNumber}
                  {planned.cupName && <div className="pill">{planned.cupName}</div>}
                </td>
                <td>{formatDisplayDate(planned.plannedDate)}</td>
                <td>{highlight?.podiumMen[0] ? <RunnerLink name={highlight.podiumMen[0]} /> : round ? "—" : "Not yet run"}</td>
                <td>{highlight?.podiumWomen[0] ? <RunnerLink name={highlight.podiumWomen[0]} /> : round ? "—" : "Not yet run"}</td>
                <td>
                  {planned.isHandicap
                    ? round
                      ? handicapFinishers
                      : "—"
                    : round
                      ? finisherCounts.get(planned.roundNumber!) ?? 0
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
