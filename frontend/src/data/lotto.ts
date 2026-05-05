// Lottery data + selectors
// HOT  = top-20 by frequency over recent 100 draws
// COLD = bottom-20 by frequency over recent 100 draws
// MIX  = HOT top-10 + COLD bottom-10 (20 numbers, default)

const FREQ_100 = (() => {
  const out: { n: number; count: number }[] = [];
  for (let n = 1; n <= 45; n++) {
    const base = 13 + Math.sin(n * 1.7) * 4 + Math.cos(n * 0.55) * 3 + (n % 7) * 0.3;
    out.push({ n, count: Math.round(base) });
  }
  return out;
})();

export const FREQ_50 = FREQ_100.map((d) => ({
  n: d.n,
  count: Math.round(d.count * 0.55 + Math.sin(d.n * 2.1) * 1.4),
}));
export { FREQ_100 };
export const FREQ_ALL = FREQ_100.map((d) => ({
  n: d.n,
  count: Math.round(d.count * 12.4 + Math.cos(d.n * 0.91) * 5),
}));

function topN(freq: { n: number; count: number }[], k: number) {
  return [...freq].sort((a, b) => b.count - a.count).slice(0, k).map((d) => d.n);
}
function bottomN(freq: { n: number; count: number }[], k: number) {
  return [...freq].sort((a, b) => a.count - b.count).slice(0, k).map((d) => d.n);
}

const POOL_HOT = topN(FREQ_100, 20);
const POOL_COLD = bottomN(FREQ_100, 20);
const POOL_MIX = [...topN(FREQ_100, 10), ...bottomN(FREQ_100, 10)]
  .filter((v, i, a) => a.indexOf(v) === i)
  .slice(0, 20);

if (POOL_MIX.length < 20) {
  const used = new Set(POOL_MIX);
  for (const n of topN(FREQ_100, 45)) {
    if (POOL_MIX.length >= 20) break;
    if (!used.has(n)) { POOL_MIX.push(n); used.add(n); }
  }
}

export interface Mode {
  id: 'HOT' | 'COLD' | 'MIX';
  ko: string;
  label: string;
  desc: string;
  pool: number[];
  accent: string;
}

export const MODES: Record<string, Mode> = {
  HOT:  { id: 'HOT',  ko: '핫',  label: '자주 나온',     desc: '최근 100회차에서 가장 많이 나온 20개', pool: POOL_HOT,  accent: '#FF4242' },
  COLD: { id: 'COLD', ko: '콜드', label: '오래 안 나온', desc: '최근 100회차에서 가장 적게 나온 20개', pool: POOL_COLD, accent: '#0066FF' },
  MIX:  { id: 'MIX',  ko: '믹스', label: '균형',          desc: 'HOT 10 + COLD 10 = 균형 잡힌 20개',   pool: POOL_MIX,  accent: '#7C3AED' },
};

export const LATEST_DRAW = {
  round: 1118, date: '2026-05-04', nums: [3, 12, 23, 27, 38, 41], bonus: 7, prize: 2845130000,
};

export const PAST_DRAWS = [
  { round: 1118, date: '2026-05-04', nums: [3, 12, 23, 27, 38, 41], bonus: 7,  prize: 2845130000 },
  { round: 1117, date: '2026-04-27', nums: [8, 15, 19, 22, 35, 44], bonus: 31, prize: 2701520000 },
  { round: 1116, date: '2026-04-20', nums: [5, 11, 18, 26, 33, 40], bonus: 14, prize: 2602990000 },
  { round: 1115, date: '2026-04-13', nums: [2, 17, 21, 28, 36, 43], bonus: 9,  prize: 2911840000 },
  { round: 1114, date: '2026-04-06', nums: [1, 13, 24, 29, 37, 42], bonus: 18, prize: 2580020000 },
  { round: 1113, date: '2026-03-30', nums: [6, 14, 20, 25, 34, 45], bonus: 22, prize: 2730510000 },
  { round: 1112, date: '2026-03-23', nums: [4, 10, 16, 30, 39, 41], bonus: 11, prize: 2876440000 },
  { round: 1111, date: '2026-03-16', nums: [7, 12, 19, 27, 32, 38], bonus: 5,  prize: 2655910000 },
];

export function ballColor(n: number): { bg: string; fg: string } {
  if (n <= 10) return { bg: '#FBC400', fg: '#1F1F1F' };
  if (n <= 20) return { bg: '#69C8F2', fg: '#FFFFFF' };
  if (n <= 30) return { bg: '#FF7272', fg: '#FFFFFF' };
  if (n <= 40) return { bg: '#AAAAAA', fg: '#FFFFFF' };
  return { bg: '#B0D840', fg: '#1F1F1F' };
}

export interface LottoRecord {
  id: string;
  ts: number;
  mode: string;
  nums: number[];
}

const RECORDS_KEY = 'luckyLotto.records.v1';

export function loadRecords(): LottoRecord[] {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); } catch { return []; }
}
export function saveRecord(rec: LottoRecord) {
  const all = loadRecords();
  all.unshift(rec);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all.slice(0, 200)));
}
export function deleteRecord(id: string) {
  const all = loadRecords().filter((r) => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}
export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const m = d.getMonth() + 1, day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} · ${hh}:${mm}`;
}
