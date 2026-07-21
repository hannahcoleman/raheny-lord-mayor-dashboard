import { ADULT_AGE_GROUPS, type AgeGroup, type Gender } from "../lib/types";

export interface FilterBarProps {
  gender: Gender | "";
  onGenderChange: (v: Gender | "") => void;
  ageGroup: AgeGroup | "";
  onAgeGroupChange: (v: AgeGroup | "") => void;
  club: string;
  onClubChange: (v: string) => void;
  clubs: string[];
}

export default function FilterBar({
  gender,
  onGenderChange,
  ageGroup,
  onAgeGroupChange,
  club,
  onClubChange,
  clubs,
}: FilterBarProps) {
  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      <select value={gender} onChange={(e) => onGenderChange(e.target.value as Gender | "")}>
        <option value="">All genders</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
      </select>
      <select value={ageGroup} onChange={(e) => onAgeGroupChange(e.target.value as AgeGroup | "")}>
        <option value="">All age groups</option>
        {[...ADULT_AGE_GROUPS, "Juvenile" as const].map((ag) => (
          <option key={ag} value={ag}>
            {ag}
          </option>
        ))}
      </select>
      <select value={club} onChange={(e) => onClubChange(e.target.value)}>
        <option value="">All clubs</option>
        {clubs.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
