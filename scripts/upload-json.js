import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import ws from 'ws'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
)

const BATCH_SIZE = 100

async function main() {
  const filePath = process.argv[2] || './lotto-data.json'
  console.log(`파일 읽는 중: ${filePath}`)

  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  console.log(`총 ${data.length}건 로드`)

  let uploaded = 0
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('lottery_draws').upsert(batch)
    if (error) {
      console.error(`배치 오류 (${i}~${i + batch.length}):`, error.message)
    } else {
      uploaded += batch.length
      console.log(`  ${uploaded}/${data.length} 적재 완료`)
    }
  }

  console.log(`완료! 총 ${uploaded}건 적재됨`)
}

main().catch(console.error)
