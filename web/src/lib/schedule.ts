/**
 * Planned season schedule, sourced from https://eventmaster.ie/event/R1L7CL5h76,
 * used only to show expected dates for rounds not yet run/scraped.
 *
 * Eventmaster's listed dates are all one day earlier than the actual race day -
 * every round scraped so far (1-7) ran on a Wednesday, but Eventmaster lists
 * Tuesdays throughout. Dates below are corrected by +1 day to match the real
 * race day. This also lines up the handicap with 2 Sep 2026, the season-end
 * date already used elsewhere - worth re-checking against Eventmaster if a
 * scraped date for round 8+ ever disagrees with this table.
 */
export interface PlannedRound {
  roundNumber: number | null;
  cupName: string | null;
  isHandicap: boolean;
  plannedDate: string;
}

export const PLANNED_SCHEDULE: PlannedRound[] = [
  { roundNumber: 1, cupName: null, isHandicap: false, plannedDate: "2026-06-03" },
  { roundNumber: 2, cupName: null, isHandicap: false, plannedDate: "2026-06-10" },
  { roundNumber: 3, cupName: null, isHandicap: false, plannedDate: "2026-06-17" },
  { roundNumber: 4, cupName: "Tommy Lynam Cup", isHandicap: false, plannedDate: "2026-06-24" },
  { roundNumber: 5, cupName: null, isHandicap: false, plannedDate: "2026-07-01" },
  { roundNumber: 6, cupName: null, isHandicap: false, plannedDate: "2026-07-08" },
  { roundNumber: 7, cupName: null, isHandicap: false, plannedDate: "2026-07-15" },
  { roundNumber: 8, cupName: "John Fennell Cup", isHandicap: false, plannedDate: "2026-07-22" },
  { roundNumber: 9, cupName: null, isHandicap: false, plannedDate: "2026-07-29" },
  { roundNumber: 10, cupName: null, isHandicap: false, plannedDate: "2026-08-05" },
  { roundNumber: 11, cupName: null, isHandicap: false, plannedDate: "2026-08-12" },
  { roundNumber: 12, cupName: null, isHandicap: false, plannedDate: "2026-08-19" },
  { roundNumber: 13, cupName: "Peter Doody Cup", isHandicap: false, plannedDate: "2026-08-26" },
  { roundNumber: 14, cupName: null, isHandicap: true, plannedDate: "2026-09-02" },
];
