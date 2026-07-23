import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDataset } from "../lib/useDataset";
import { getAvailableAgeGroups, getAvailableGenders, getClubs, getOverallLeaderboard } from "../lib/scoring";
import type { AgeGroup, Gender } from "../lib/types";
import RunnerLink from "../components/RunnerLink";
import FilterBar from "../components/FilterBar";

export default function OverallLeaderboard() {
  const { records, loading, error } = useDataset();
  const [gender, setGender] = useState<Gender | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [club, setClub] = useState<string>("");
  const [search, setSearch] = useState("");

  const clubs = useMemo(() => getClubs(records), [records]);
  const genders = useMemo(() => getAvailableGenders(records), [records]);
  const ageGroups = useMemo(() => getAvailableAgeGroups(records), [records]);
  const leaderboard = useMemo(
    () =>
      getOverallLeaderboard(records, {
        gender: gender || undefined,
        ageGroup: ageGroup || undefined,
        club: club || undefined,
      }).map((e, i) => ({ ...e, rank: i + 1 })),
    [records, gender, ageGroup, club]
  );
  const visible = useMemo(
    () => leaderboard.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase())),
    [leaderboard, search]
  );

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  return (
    <div>
      <h2>Overall Leaderboard</h2>
      <p>Each runner's single fastest time across every numbered round entered. No qualification threshold.</p>
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
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        style={{ marginBottom: "1rem", width: "100%", maxWidth: 300 }}
      />
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Club</th>
              <th>Category</th>
              <th>Best time</th>
              <th>Race</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.name}>
                <td>{e.rank}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>
                  {e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}
                </td>
                <td>{e.bestTimeDisplay}</td>
                <td>{e.roundNumber ? <Link to={`/results/${e.roundNumber}`}>{e.raceName}</Link> : e.raceName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
