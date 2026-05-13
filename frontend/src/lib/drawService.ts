import { supabase } from './supabase';
import { fetchRecentDraws } from './statsService';
import type { NumberFrequency } from './statsService';

export interface LatestDraw {
  round: number;
  date: string;
  nums: number[];
  bonus: number;
  prize: number;
}

const CACHE_LATEST = 'luckyLotto.cache.latestDraw';
const CACHE_POOL_PREFIX = 'luckyLotto.cache.pool.';

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export async function fetchLatestDraw(): Promise<LatestDraw> {
  try {
    const rows = await fetchRecentDraws(1);
    if (!rows.length) throw new Error('데이터가 없습니다.');
    const r = rows[0];
    const result: LatestDraw = {
      round: r.drw_no,
      date: r.drw_date,
      nums: [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6],
      bonus: r.bonus,
      prize: r.prize_1st,
    };
    cacheSet(CACHE_LATEST, result);
    return result;
  } catch (err) {
    const cached = cacheGet<LatestDraw>(CACHE_LATEST);
    if (cached) return cached;
    throw err;
  }
}

export async function fetchNumberPool(mode: string): Promise<number[]> {
  const cacheKey = CACHE_POOL_PREFIX + mode;
  try {
    let pool: number[];

    if (mode === 'HOT') {
      const { data, error } = await supabase.rpc('get_hot_numbers', { range_count: 100 });
      if (error) throw error;
      pool = (data as NumberFrequency[]).slice(0, 20).map((d) => d.num);
    } else if (mode === 'COLD') {
      const { data, error } = await supabase.rpc('get_cold_numbers', { range_count: 100 });
      if (error) throw error;
      pool = (data as NumberFrequency[]).slice(0, 20).map((d) => d.num);
    } else {
      // MIX: HOT top 10 + COLD bottom 10
      const [hotRes, coldRes] = await Promise.all([
        supabase.rpc('get_hot_numbers', { range_count: 100 }),
        supabase.rpc('get_cold_numbers', { range_count: 100 }),
      ]);
      if (hotRes.error) throw hotRes.error;
      if (coldRes.error) throw coldRes.error;

      const hotNums = (hotRes.data as NumberFrequency[]).map((d) => d.num);
      const coldNums = (coldRes.data as NumberFrequency[]).map((d) => d.num);

      const used = new Set<number>();
      pool = [];

      // Add top 10 from HOT
      for (const n of hotNums) {
        if (pool.length >= 10) break;
        if (!used.has(n)) { pool.push(n); used.add(n); }
      }

      // Add bottom 10 from COLD
      for (const n of coldNums) {
        if (pool.length >= 20) break;
        if (!used.has(n)) { pool.push(n); used.add(n); }
      }

      // Fill remaining from HOT if duplicates reduced count
      for (const n of hotNums) {
        if (pool.length >= 20) break;
        if (!used.has(n)) { pool.push(n); used.add(n); }
      }
    }

    cacheSet(cacheKey, pool);
    return pool;
  } catch (err) {
    const cached = cacheGet<number[]>(cacheKey);
    if (cached) return cached;
    throw err;
  }
}
