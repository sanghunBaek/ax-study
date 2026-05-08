import { useState, useEffect } from 'react';
import { fetchFrequency, fetchRecentDraws } from '../lib/statsService';
import type { NumberFrequency, DrawResult } from '../lib/statsService';

export interface StatsData {
  freq50: NumberFrequency[];
  freq100: NumberFrequency[];
  freqAll: NumberFrequency[];
  recentDraws: DrawResult[];
}

interface UseStatsDataResult {
  data: StatsData | null;
  loading: boolean;
  error: string | null;
}

export default function useStatsData(): UseStatsDataResult {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [freq50, freq100, freqAll, recentDraws] = await Promise.all([
          fetchFrequency(50),
          fetchFrequency(100),
          fetchFrequency(null),
          fetchRecentDraws(),
        ]);
        if (!cancelled) {
          setData({ freq50, freq100, freqAll, recentDraws });
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
  }, []);

  return { data, loading, error };
}
