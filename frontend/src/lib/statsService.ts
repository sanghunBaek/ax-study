import { supabase } from './supabase';

export interface NumberFrequency {
  num: number;
  cnt: number;
}

export interface DrawResult {
  drw_no: number;
  drw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus: number;
  prize_1st: number;
}

export async function fetchFrequency(rangeCount: number | null): Promise<NumberFrequency[]> {
  const { data, error } = await supabase.rpc('get_frequency', { range_count: rangeCount });
  if (error) throw error;
  return data as NumberFrequency[];
}

export async function fetchRecentDraws(limit = 8): Promise<DrawResult[]> {
  const { data, error } = await supabase
    .from('lottery_draws')
    .select('drw_no, drw_date, num1, num2, num3, num4, num5, num6, bonus, prize_1st')
    .order('drw_no', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as DrawResult[];
}
