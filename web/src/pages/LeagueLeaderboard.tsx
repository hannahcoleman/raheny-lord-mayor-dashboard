import { useMemo, useState } from "react";
import { useDataset } from "../lib/useDataset";
import { getAvailableAgeGroups, getAvailableGenders, getClubs, getLeagueLeaderboard } from "../lib/scoring";
import { QUALIFICATION_THRESHOLD, type AgeGroup, type Gender } from "../lib/types";
import RunnerLink from "../components/RunnerLink";
import FilterBar from "../components/FilterBar";

export default function LeagueLeaderboard() {
  const { records, loading, error } = useDataset();
  const [gender, setGender] = useState<Gender | "">("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [club, setClub] = useState<string>("");

  const clubs = useMemo(() => getClubs(records), [records]);
  const genders = useMemo(() => getAvailableGenders(records), [records]);
  const ageGroups = useMemo(() => getAvailableAgeGroups(records), [records]);
  const league = useMemo(() => getLeagueLeaderboard(records), [records]);
  const filtered = useMemo(
    () =>
      league.filter(
        (e) => (!gender || e.gender === gender) && (!ageGroup || e.ageGroup === ageGroup) && (!club || e.club === club)
      ),
    [league, gender, ageGroup, club]
  );

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Could not load data: {error}</p>;

  const qualified = filtered.filter((e) => e.qualified);
  const unqualified = filtered.filter((e) => !e.qualified);

  return (
    <div>
      <h2>League Leaderboard</h2>
      <p>
        Sum of each qualifying athlete's fastest {QUALIFICATION_THRESHOLD} times out of 13 numbered rounds. Lowest total wins.
        Athletes need at least {QUALIFICATION_THRESHOLD} races to qualify.
      </p>
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
              <th>Races</th>
              <th>League total</th>
              <th>League average</th>
            </tr>
          </thead>
          <tbody>
            {qualified.map((e, i) => (
              <tr key={e.name}>
                <td>{i + 1}</td>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>{e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}</td>
                <td>{e.racesEntered}</td>
                <td>{e.leagueTotalDisplay}</td>
                <td>{e.leagueAverageDisplay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Not yet qualified</h3>
      <p>Progress toward the {QUALIFICATION_THRESHOLD}-race qualification threshold.</p>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Club</th>
              <th>Category</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {unqualified.map((e) => (
              <tr key={e.name}>
                <td>
                  <RunnerLink name={e.name} />
                </td>
                <td>{e.club}</td>
                <td>{e.gender !== "Unspecified" ? `${e.ageGroup ?? ""} ${e.gender}`.trim() : e.ageGroup}</td>
                <td>
                  {e.racesEntered} of {QUALIFICATION_THRESHOLD}
                  <div style={{ background: "var(--rs-border)", borderRadius: 4, height: 6, marginTop: 4, width: 140 }}>
                    <div
                      style={{
                        background: "var(--rs-green)",
                        height: 6,
                        borderRadius: 4,
                        width: `${Math.min(100, (e.racesEntered / QUALIFICATION_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
