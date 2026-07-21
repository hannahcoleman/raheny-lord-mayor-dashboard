export type Gender = "Men" | "Women" | "Unspecified";

export type AgeGroup =
  | "Senior"
  | "O/35"
  | "O/40"
  | "O/45"
  | "O/50"
  | "O/55"
  | "O/60"
  | "O/65"
  | "O/70"
  | "O/75"
  | "Juvenile";

export interface RoundMeta {
  roundNumber: number | null;
  cupName: string | null;
  isHandicap: boolean;
  title: string;
  url: string;
  date: string;
}

export interface ResultRecord {
  roundNumber: number | null;
  raceName: string;
  date: string;
  place: number;
  name: string;
  club: string;
  category: string;
  gender: Gender;
  ageGroup: AgeGroup | null;
  timeSeconds: number | null;
  timeDisplay: string;
  isGenericEntry: boolean;
}

export const NUMBERED_ROUNDS_TOTAL = 13;
export const QUALIFICATION_THRESHOLD = 8;

export const ADULT_AGE_GROUPS: AgeGroup[] = [
  "Senior",
  "O/35",
  "O/40",
  "O/45",
  "O/50",
  "O/55",
  "O/60",
  "O/65",
  "O/70",
  "O/75",
];
