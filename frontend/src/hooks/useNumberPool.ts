import { useState, useEffect, useCallback } from 'react';
import { fetchNumberPool } from '../lib/drawService';

interface UseNumberPoolResult {
  pool: number[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export default function useNumberPool(mode: string | null): UseNumberPoolResult {
  const [pool, setPool] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!mode) {
      setPool(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await fetchNumberPool(mode!);
        if (!cancelled) {
          setPool(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '번호풀을 불러오는 데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [mode, trigger]);

  return { pool, loading, error, retry };
}
