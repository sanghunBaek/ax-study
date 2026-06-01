# Data Model: 내 기록 당첨 여부 표기

## 기존 엔티티 (변경 없음)

### LottoRecord (localStorage)

```typescript
interface LottoRecord {
  id: string;       // 고유 ID (예: "r1715612345678")
  ts: number;       // 저장 시점 밀리초 타임스탬프
  mode: string;     // 뽑기 모드 ("HOT" | "COLD" | "MIX")
  nums: number[];   // 선택한 6개 번호 (정렬됨)
}
```

### lottery_draws (Supabase)

```sql
lottery_draws
  drw_no      INTEGER PRIMARY KEY  -- 회차 번호
  drw_date    DATE                 -- 추첨일 (토요일)
  num1~num6   INTEGER              -- 당첨 번호 (오름차순)
  bonus       INTEGER              -- 보너스 번호
  prize_1st   BIGINT               -- 1등 당첨금
  total_sales BIGINT               -- 총 판매액
  created_at  TIMESTAMP
```

## 신규 엔티티 (런타임, 저장 안 함)

### WinningResult

기록별 당첨 판정 결과. 메모리에서만 사용하며, 탭 진입 시 계산.

```typescript
type WinningRank = 1 | 2 | 3 | 4 | 5 | 'miss' | 'pending';

interface WinningResult {
  recordId: string;      // LottoRecord.id 참조
  drwNo: number | null;  // 매핑된 회차 번호 (null이면 미발표)
  rank: WinningRank;     // 판정 등수
  matchCount: number;    // 일치 번호 수 (0~6)
  bonusMatch: boolean;   // 보너스 번호 일치 여부
}
```

### 상태 전이

```
기록 저장 → [회차 매핑]
  ├─ DB에 회차 없음 → rank: 'pending' (미발표)
  └─ DB에 회차 있음 → [등수 판정]
       ├─ 6개 일치      → rank: 1
       ├─ 5개 + 보너스  → rank: 2
       ├─ 5개           → rank: 3
       ├─ 4개           → rank: 4
       ├─ 3개           → rank: 5
       └─ 0~2개         → rank: 'miss'
```

## 데이터 흐름

```
localStorage (LottoRecord[])
  ↓ ts → 토요일 날짜 계산
Supabase (lottery_draws)
  ↓ drw_date 기준 회차 조회 + 당첨번호
프론트엔드
  ↓ 번호 비교 → WinningResult 생성
RecordsScreen
  ↓ WinningBadge 렌더링
```
