import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { chromium } from 'playwright'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
)

const DELAY_MS = 200
const BATCH_SIZE = 100

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getLatestDrwNo(page) {
  // binary search로 최신 회차 탐색
  let lo = 1, hi = 2000
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${mid}`
    const res = await page.goto(url, { waitUntil: 'commit' })
    const text = await page.content()
    let data
    try {
      const match = text.match(/\{.*\}/)
      data = match ? JSON.parse(match[0]) : null
    } catch {
      data = null
    }
    await sleep(DELAY_MS)
    if (data?.returnValue === 'success') lo = mid
    else hi = mid - 1
  }
  return lo
}

async function fetchDraw(page, drwNo) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`
  await page.goto(url, { waitUntil: 'commit' })
  const text = await page.content()
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(match[0])
    if (data.returnValue !== 'success') return null
    return {
      drw_no: data.drwNo,
      drw_date: data.drwNoDate,
      num1: data.drwtNo1,
      num2: data.drwtNo2,
      num3: data.drwtNo3,
      num4: data.drwtNo4,
      num5: data.drwtNo5,
      num6: data.drwtNo6,
      bonus: data.bnusNo,
      prize_1st: data.firstWinamnt,
      total_sales: data.totSellamnt,
    }
  } catch {
    return null
  }
}

async function getExistingDrwNos() {
  const { data } = await supabase.from('lottery_draws').select('drw_no')
  return new Set((data || []).map((r) => r.drw_no))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    console.log('최신 회차 탐색 중...')
    const latest = await getLatestDrwNo(page)
    console.log(`최신 회차: ${latest}`)

    console.log('기존 적재 현황 확인 중...')
    const existing = await getExistingDrwNos()
    console.log(`이미 적재된 회차: ${existing.size}개`)

    const missing = []
    for (let i = 1; i <= latest; i++) {
      if (!existing.has(i)) missing.push(i)
    }
    console.log(`적재 필요: ${missing.length}개`)

    if (missing.length === 0) {
      console.log('모두 적재 완료 상태입니다.')
      return
    }

    let batch = []
    let done = 0

    for (const drwNo of missing) {
      const draw = await fetchDraw(page, drwNo)
      await sleep(DELAY_MS)

      if (draw) {
        batch.push(draw)
        done++
      } else {
        console.warn(`  회차 ${drwNo}: 데이터 없음 (스킵)`)
      }

      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase.from('lottery_draws').upsert(batch)
        if (error) console.error('upsert 오류:', error.message)
        else console.log(`  ${done}/${missing.length} 완료`)
        batch = []
      }
    }

    if (batch.length > 0) {
      const { error } = await supabase.from('lottery_draws').upsert(batch)
      if (error) console.error('upsert 오류:', error.message)
      else console.log(`  ${done}/${missing.length} 완료`)
    }

    console.log('적재 완료!')
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
