import { useEffect, useState } from 'react';

import { fetchHistory, historyKey, type History, type Range } from '@/lib/history';

type Result = { key: string; history: History | null; error: string | null };

export function useHistory(from: string, to: string, range: Range, attempt = 0) {
  const key = `${historyKey(from, to, range)}#${attempt}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    fetchHistory(from, to, range).then(
      (history) => active && setResult({ key, history, error: null }),
      (err: unknown) =>
        active && setResult({ key, history: null, error: err instanceof Error ? err.message : 'Failed to load' })
    );
    return () => {
      active = false;
    };
  }, [from, to, range, key]);

  // A result for an older request means the current one is still loading.
  const current = result?.key === key ? result : null;
  return {
    loading: current === null,
    history: current?.history ?? null,
    error: current?.error ?? null,
  };
}
