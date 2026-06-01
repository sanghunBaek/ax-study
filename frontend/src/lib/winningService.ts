import { supabase } from './supabase';
import type { DrawResult } from './statsService';
import type { LottoRecord } from '../data/lotto';

export type WinningRank = 1 | 2 | 3 | 4 | 5 | 'miss' | 'pending';

export interface WinningResult {
  recordId: string;
  drwNo: number | null;
  rank: WinningRank;
  matchCount: number;
  bonusMatch: boolean;
}

/**
 * ts(밀리초)를 KST 기준으로 해당 주 토요일 회차에 매핑한다.
 * - 일~토 21:00 KST 사이 → 해당 주 토요일 회차
 * - 토 21:00 이후 ~ 다음 일요일 → 다음 주 토요일 회차
 * - 매칭되는 회차가 DB에 없으면 null(미발표)
 */
export function getDrawNoForRecord(
  ts: number,
  draws: DrawResult[],
): number | null {
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const d = new Date(ts + KST_OFFSET);
  const utcDay = d.getUTCDay(); // 0=Sun ... 6=Sat
  const utcHour = d.getUTCHours();

  // 목표: 이 기록이 속하는 토요일 날짜(YYYY-MM-DD) 계산
  let daysUntilSat: number;

  if (utcDay === 6) {
    // 토요일
    daysUntilSat = utcHour >= 21 ? 7 : 0; // 21시 이후면 다음 주
  } else {
    // 일(0)~금(5): 해당 주 토요일까지 남은 일수
    daysUntilSat = (6 - utcDay + 7) % 7;
    if (daysUntilSat === 0) daysUntilSat = 7;
  }

  const targetDate = new Date(d.getTime());
  targetDate.setUTCDate(targetDate.getUTCDate() + daysUntilSat);
  const yyyy = targetDate.getUTCFullYear();
  const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getUTCDate()).padStart(2, '0');
  const targetDateStr = `${yyyy}-${mm}-${dd}`;

  const match = draws.find((dr) => dr.drw_date.slice(0, 10) === targetDateStr);
  return match ? match.drw_no : null;
}

export function checkWinning(
  userNums: number[],
  drawNums: number[],
  bonus: number,
): { rank: WinningRank; matchCount: number; bonusMatch: boolean } {
  const drawSet = new Set(drawNums);
  const matchCount = userNums.filter((n) => drawSet.has(n)).length;
  const bonusMatch = userNums.includes(bonus);

  let rank: WinningRank;
  if (matchCount === 6) rank = 1;
  else if (matchCount === 5 && bonusMatch) rank = 2;
  else if (matchCount === 5) rank = 3;
  else if (matchCount === 4) rank = 4;
  else if (matchCount === 3) rank = 5;
  else rank = 'miss';

  return { rank, matchCount, bonusMatch };
}

export async function fetchDrawsByNos(
  drwNos: number[],
): Promise<DrawResult[]> {
  if (drwNos.length === 0) return [];
  const { data, error } = await supabase
    .from('lottery_draws')
    .select('drw_no, drw_date, num1, num2, num3, num4, num5, num6, bonus, prize_1st')
    .in('drw_no', drwNos);
  if (error) throw error;
  return data as DrawResult[];
}

export function getWinningResults(
  records: LottoRecord[],
  draws: DrawResult[],
): Map<string, WinningResult> {
  const drawByNo = new Map(draws.map((d) => [d.drw_no, d]));
  const results = new Map<string, WinningResult>();

  for (const rec of records) {
    const drwNo = getDrawNoForRecord(rec.ts, draws);

    if (drwNo === null || !drawByNo.has(drwNo)) {
      results.set(rec.id, {
        recordId: rec.id,
        drwNo,
        rank: 'pending',
        matchCount: 0,
        bonusMatch: false,
      });
      continue;
    }

    const draw = drawByNo.get(drwNo)!;
    const drawNums = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6];
    const { rank, matchCount, bonusMatch } = checkWinning(rec.nums, drawNums, draw.bonus);

    results.set(rec.id, {
      recordId: rec.id,
      drwNo,
      rank,
      matchCount,
      bonusMatch,
    });
  }

  return results;
}
