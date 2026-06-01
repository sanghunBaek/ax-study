import { useState, useEffect, useMemo } from 'react';
import type { LottoRecord } from '../data/lotto';
import type { WinningResult } from '../lib/winningService';
import { getWinningResults } from '../lib/winningService';
import { supabase } from '../lib/supabase';
import type { DrawResult } from '../lib/statsService';

interface UseWinningResultsReturn {
  results: Map<string, WinningResult>;
  loading: boolean;
  error: string | null;
}

export default function useWinningResults(
  records: LottoRecord[],
): UseWinningResultsReturn {
  const [results, setResults] = useState<Map<string, WinningResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordsKey = useMemo(() => records.map((r) => r.id).join(','), [records]);

  useEffect(() => {
    if (records.length === 0) {
      setResults(new Map());
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data: allDraws, error: drawsErr } = await supabase
          .from('lottery_draws')
          .select('drw_no, drw_date, num1, num2, num3, num4, num5, num6, bonus, prize_1st')
          .order('drw_no', { ascending: false })
          .limit(200);

        if (drawsErr) throw drawsErr;
        const draws = allDraws as DrawResult[];

        if (!cancelled) {
          const resultMap = getWinningResults(records, draws);
          setResults(resultMap);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '당첨 결과를 불러오는 데 실패했습니다.');
          const fallback = new Map<string, WinningResult>();
          for (const rec of records) {
            fallback.set(rec.id, {
              recordId: rec.id,
              drwNo: null,
              rank: 'pending',
              matchCount: 0,
              bonusMatch: false,
            });
          }
          setResults(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsKey]);

  return { results, loading, error };
}
