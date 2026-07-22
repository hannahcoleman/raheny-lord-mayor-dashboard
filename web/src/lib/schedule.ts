/**
 * Season race schedule, sourced from https://eventmaster.ie/event/R1L7CL5h76.
 * Races run on Tuesdays; results are posted to rahenyshamrock.ie the
 * following day, so the scraped post date is one day later than the actual
 * race date. This table's dates are the real race dates and are used for
 * display everywhere on Season Overview, regardless of whether the round
 * has been scraped yet.
 */
export interface PlannedRound {
  roundNumber: number | null;
  cupName: string | null;
  isHandicap: boolean;
  plannedDate: string;
}

export const PLANNED_SCHEDULE: PlannedRound[] = [
  { roundNumber: 1, cupName: null, isHandicap: false, plannedDate: "2026-06-02" },
  { roundNumber: 2, cupName: null, isHandicap: false, plannedDate: "2026-06-09" },
  { roundNumber: 3, cupName: null, isHandicap: false, plannedDate: "2026-06-16" },
  { roundNumber: 4, cupName: "Tommy Lynam Cup", isHandicap: false, plannedDate: "2026-06-23" },
  { roundNumber: 5, cupName: null, isHandicap: false, plannedDate: "2026-06-30" },
  { roundNumber: 6, cupName: null, isHandicap: false, plannedDate: "2026-07-07" },
  { roundNumber: 7, cupName: null, isHandicap: false, plannedDate: "2026-07-14" },
  { roundNumber: 8, cupName: "John Fennell Cup", isHandicap: false, plannedDate: "2026-07-21" },
  { roundNumber: 9, cupName: null, isHandicap: false, plannedDate: "2026-07-28" },
  { roundNumber: 10, cupName: null, isHandicap: false, plannedDate: "2026-08-04" },
  { roundNumber: 11, cupName: null, isHandicap: false, plannedDate: "2026-08-11" },
  { roundNumber: 12, cupName: null, isHandicap: false, plannedDate: "2026-08-18" },
  { roundNumber: 13, cupName: "Peter Doody Cup", isHandicap: false, plannedDate: "2026-08-25" },
  { roundNumber: 14, cupName: "Jim Wall Memorial Handicap", isHandicap: true, plannedDate: "2026-09-01" },
];
