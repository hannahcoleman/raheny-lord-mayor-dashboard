import { useEffect, useState } from "react";
import type { CategoryChangeFlag, DuplicateFlag, Gender, RefreshLogEntry, ResultRecord, RoundMeta } from "./types";

interface DatasetState {
  records: ResultRecord[];
  rounds: RoundMeta[];
  refreshLog: RefreshLogEntry[];
  duplicatesFlagged: DuplicateFlag[];
  categoryChangesFlagged: CategoryChangeFlag[];
  juvenileGenders: Record<string, Gender>;
  loading: boolean;
  error: string | null;
}

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({
    records: [],
    rounds: [],
    refreshLog: [],
    duplicatesFlagged: [],
    categoryChangesFlagged: [],
    juvenileGenders: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}dataset.json`).then((r) => r.json()),
      fetch(`${base}rounds.json`).then((r) => r.json()),
      fetch(`${base}refresh-log.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${base}duplicates-flagged.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${base}category-changes-flagged.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${base}juvenile-genders.json`).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([records, rounds, refreshLog, duplicatesFlagged, categoryChangesFlagged, juvenileGenders]) => {
        if (!cancelled)
          setState({
            records,
            rounds,
            refreshLog,
            duplicatesFlagged,
            categoryChangesFlagged,
            juvenileGenders,
            loading: false,
            error: null,
          });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: String(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
