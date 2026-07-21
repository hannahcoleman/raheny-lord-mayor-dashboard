import { useEffect, useState } from "react";
import type { ResultRecord, RoundMeta } from "./types";

interface DatasetState {
  records: ResultRecord[];
  rounds: RoundMeta[];
  loading: boolean;
  error: string | null;
}

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({ records: [], rounds: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/dataset.json").then((r) => r.json()), fetch("/rounds.json").then((r) => r.json())])
      .then(([records, rounds]) => {
        if (!cancelled) setState({ records, rounds, loading: false, error: null });
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
