import { useMemo, useState } from "react";
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

  const clubs = useMemo(() => getClubs(records), [records]);
  const genders = useMemo(() => getAvailableGenders(records), [records]);
  const ageGroups = useMemo(() => getAvailableAgeGroups(records), [records]);
  const leaderboard = useMemo(
    () =>
      getOverallLeaderboard(records, {
        gender: gender || undefined,
        ageGroup: ageGroup || undefined,
        club: club || undefined,
      }),
    [records, gender, ageGroup, club]
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
            {leaderboard.map((e, i) => (
              <tr key={e.name}>
                <td>{i + 1}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>
                  {e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}
                </td>
                <td>{e.bestTimeDisplay}</td>
                <td>{e.raceName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
