import { useState, useEffect, useCallback } from 'react';
import { fetchLatestDraw } from '../lib/drawService';
import type { LatestDraw } from '../lib/drawService';

interface UseLatestDrawResult {
  data: LatestDraw | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export default function useLatestDraw(): UseLatestDrawResult {
  const [data, setData] = useState<LatestDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchLatestDraw();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [trigger]);

  return { data, loading, error, retry };
}
