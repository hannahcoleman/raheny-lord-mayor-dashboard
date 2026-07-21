import { useEffect, useState } from "react";
import type { RefreshLogEntry, ResultRecord, RoundMeta } from "./types";

interface DatasetState {
  records: ResultRecord[];
  rounds: RoundMeta[];
  refreshLog: RefreshLogEntry[];
  loading: boolean;
  error: string | null;
}

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({
    records: [],
    rounds: [],
    refreshLog: [],
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
    ])
      .then(([records, rounds, refreshLog]) => {
        if (!cancelled) setState({ records, rounds, refreshLog, loading: false, error: null });
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
