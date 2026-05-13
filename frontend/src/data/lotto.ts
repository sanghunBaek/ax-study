export interface Mode {
  id: 'HOT' | 'COLD' | 'MIX';
  ko: string;
  label: string;
  desc: string;
  accent: string;
}

export const MODES: Record<string, Mode> = {
  HOT:  { id: 'HOT',  ko: '핫',  label: '자주 나온',     desc: '최근 100회차에서 가장 많이 나온 20개', accent: '#FF4242' },
  COLD: { id: 'COLD', ko: '콜드', label: '오래 안 나온', desc: '최근 100회차에서 가장 적게 나온 20개', accent: '#0066FF' },
  MIX:  { id: 'MIX',  ko: '믹스', label: '균형',          desc: 'HOT 10 + COLD 10 = 균형 잡힌 20개',   accent: '#7C3AED' },
};

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
