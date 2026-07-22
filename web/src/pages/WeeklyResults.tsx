import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDataset } from "../lib/useDataset";
import {
  getAvailableAgeGroups,
  getAvailableGenders,
  getClubs,
  getRaceHighlights,
  getRacePlacements,
  numberedRecords,
  racePlacementKey,
} from "../lib/scoring";
import type { AgeGroup, Gender } from "../lib/types";
import RunnerLink from "../components/RunnerLink";
import FilterBar from "../components/FilterBar";

export default function WeeklyResults() {
  const { round: roundParam } = useParams();
  const { records, juvenileGenders, loading, error } = useDataset();
  const [gender, setGender] = useState<Gender | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [club, setClub] = useState<string>("");
  const numbered = useMemo(() => numberedRecords(records), [records]);
  const roundNumbers = useMemo(
    () => Array.from(new Set(numbered.map((r) => r.roundNumber!))).sort((a, b) => a - b),
    [numbered]
  );
  const requestedRound = roundParam ? Number(roundParam) : null;
  const activeRound =
    requestedRound !== null && roundNumbers.includes(requestedRound)
      ? requestedRound
      : (roundNumbers[roundNumbers.length - 1] ?? null);
  const placements = useMemo(() => getRacePlacements(records), [records]);

  const roundRecords = useMemo(() => numbered.filter((r) => r.roundNumber === activeRound), [numbered, activeRound]);
  const clubs = useMemo(() => getClubs(roundRecords), [roundRecords]);
  const genders = useMemo(() => getAvailableGenders(roundRecords), [roundRecords]);
  const ageGroups = useMemo(() => getAvailableAgeGroups(roundRecords), [roundRecords]);

  // Reset filters when switching rounds so a selection that no longer applies
  // (e.g. a club with no runners this week) doesn't linger as an invalid value.
  useEffect(() => {
    setGender("");
    setAgeGroup("");
    setClub("");
  }, [activeRound]);

  if (loading) return <p>Loading results…</p>;
  if (error) return <p>Could not load data: {error}</p>;
  if (roundNumbers.length === 0) return <p>No rounds scraped yet.</p>;

  const raceRecords = roundRecords
    .filter((r) => !gender || r.gender === gender)
    .filter((r) => !ageGroup || r.ageGroup === ageGroup)
    .filter((r) => !club || r.club === club)
    .sort((a, b) => a.place - b.place);
  const highlights = getRaceHighlights(records, juvenileGenders).find((h) => h.roundNumber === activeRound);
  const winnerLabelFor = (name: string) => {
    const labels: string[] = [];
    if (highlights?.podiumMen.includes(name)) labels.push(`#${highlights.podiumMen.indexOf(name) + 1} Men`);
    if (highlights?.podiumWomen.includes(name)) labels.push(`#${highlights.podiumWomen.indexOf(name) + 1} Women`);
    const isCategoryWinner = highlights?.categoryWinners.some((c) => c.name === name) ?? false;
    return { labels, isCategoryWinner };
  };

  return (
    <div>
      <h2>Weekly Results</h2>
      <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {roundNumbers.map((n) => (
          <Link
            key={n}
            to={`/results/${n}`}
            className="btn"
            style={{ background: n === activeRound ? "var(--rs-green-dark)" : "var(--rs-charcoal-soft)" }}
          >
            Rd {n}
          </Link>
        ))}
      </div>
      <FilterBar
        gender={gender}
        onGenderChange={setGender}
        ageGroup={ageGroup}
        onAgeGroupChange={setAgeGroup}
        club={club}
        onClubChange={setClub}
        genders={genders}
        ageGroups={ageGroups}
        clubs={clubs}
      />
      <p>
        <span className="pill podium-1" style={{ marginRight: 4 }}>
          &nbsp;
        </span>{" "}
        overall podium (1st/2nd/3rd by gender) &nbsp;
        <span className="pill category-winner" style={{ marginRight: 4 }}>
          &nbsp;
        </span>{" "}
        age-category winner
      </p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Place</th>
              <th>Gender Place</th>
              <th>Category Place</th>
              <th>Name</th>
              <th>Club</th>
              <th>Category</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {raceRecords.map((r, i) => {
              const { labels, isCategoryWinner } = r.isGenericEntry
                ? { labels: [], isCategoryWinner: false }
                : winnerLabelFor(r.name);
              const podiumClass = labels[0]?.startsWith("#1")
                ? "podium-1"
                : labels[0]?.startsWith("#2")
                  ? "podium-2"
                  : labels[0]?.startsWith("#3")
                    ? "podium-3"
                    : "";
              const placement = placements.get(racePlacementKey(r));
              return (
                <tr key={i} className={[podiumClass, isCategoryWinner ? "category-winner" : ""].join(" ")}>
                  <td>
                    {r.place}/{placement?.totalFinishers ?? "—"}
                  </td>
                  <td>{placement ? `${placement.genderRank}/${placement.genderTotal}` : "—"}</td>
                  <td>{placement ? `${placement.categoryRank}/${placement.categoryTotal}` : "—"}</td>
                  <td>{r.isGenericEntry ? r.name : <RunnerLink name={r.name} />}</td>
                  <td>{r.club}</td>
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
