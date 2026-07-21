import { useMemo, useState } from "react";
import { useDataset } from "../lib/useDataset";
import { getClubs, getOverallLeaderboard } from "../lib/scoring";
import { ADULT_AGE_GROUPS, type AgeGroup, type Gender } from "../lib/types";
import RunnerLink from "../components/RunnerLink";

export default function OverallLeaderboard() {
  const { records, loading, error } = useDataset();
  const [gender, setGender] = useState<Gender | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [club, setClub] = useState<string>("");

  const clubs = useMemo(() => getClubs(records), [records]);
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
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}>
          <option value="">All genders</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
        </select>
        <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup | "")}>
          <option value="">All age groups</option>
          {[...ADULT_AGE_GROUPS, "Juvenile" as const].map((ag) => (
            <option key={ag} value={ag}>
              {ag}
            </option>
          ))}
        </select>
        <select value={club} onChange={(e) => setClub(e.target.value)}>
          <option value="">All clubs</option>
          {clubs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
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
