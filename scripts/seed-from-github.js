import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
)

const BATCH_SIZE = 100
const ALL_JSON_URL = 'https://smok95.github.io/lotto/results/all.json'

async function main() {
  console.log('GitHub에서 전체 회차 데이터 다운로드 중...')
  const res = await fetch(ALL_JSON_URL)
  if (!res.ok) throw new Error(`다운로드 실패: ${res.status}`)
  const allData = await res.json()
  console.log(`총 ${allData.length}건 다운로드 완료`)

  // 기존 적재 현황 확인
  const { data: existing } = await supabase.from('lottery_draws').select('drw_no')
  const existingSet = new Set((existing || []).map((r) => r.drw_no))
  console.log(`이미 적재된 회차: ${existingSet.size}개`)

  // 스키마에 맞게 변환 + 누락분만 필터
  const rows = allData
    .filter((d) => !existingSet.has(d.draw_no))
    .map((d) => ({
      drw_no: d.draw_no,
      drw_date: d.date.split('T')[0],
      num1: d.numbers[0],
      num2: d.numbers[1],
      num3: d.numbers[2],
      num4: d.numbers[3],
      num5: d.numbers[4],
      num6: d.numbers[5],
      bonus: d.bonus_no,
      prize_1st: d.divisions[0]?.prize || null,
      total_sales: d.total_sales_amount,
    }))

  console.log(`적재 필요: ${rows.length}개`)

  if (rows.length === 0) {
    console.log('모두 적재 완료 상태입니다.')
    return
  }

  let uploaded = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('lottery_draws').upsert(batch)
    if (error) {
      console.error(`배치 오류 (${i}~${i + batch.length}):`, error.message)
    } else {
      uploaded += batch.length
      console.log(`  ${uploaded}/${rows.length} 적재 완료`)
    }
  }

  console.log(`완료! 총 ${uploaded}건 적재됨`)
}

main().catch(console.error)
