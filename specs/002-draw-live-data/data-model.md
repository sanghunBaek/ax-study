# Data Model: 뽑기 탭 실시간 데이터 연동

## 기존 엔티티 (변경 없음)

### lottery_draws (Supabase 테이블)
| 필드 | 타입 | 설명 |
|------|------|------|
| drw_no | INTEGER PK | 회차 번호 |
| drw_date | DATE | 추첨일 |
| num1~num6 | INTEGER | 당첨 번호 (오름차순) |
| bonus | INTEGER | 보너스 번호 |
| prize_1st | BIGINT | 1등 당첨금 |
| total_sales | BIGINT | 총 판매액 |
| created_at | TIMESTAMP | 생성 시각 |

### DrawResult (TypeScript, 기존 statsService.ts)
```typescript
interface DrawResult {
  drw_no: number;
  drw_date: string;
  num1: number; num2: number; num3: number;
  num4: number; num5: number; num6: number;
  bonus: number;
  prize_1st: number;
}
```

## 신규 타입

### LatestDraw (HomeScreen용)
```typescript
interface LatestDraw {
  round: number;       // drw_no
  date: string;        // drw_date
  nums: number[];      // [num1, num2, ..., num6]
  bonus: number;
  prize: number;       // prize_1st
}
```
- `DrawResult` → `LatestDraw` 변환은 서비스 레이어에서 수행
- 기존 `lotto.ts`의 `LATEST_DRAW` 상수와 동일한 형태

### NumberPoolResult (RPC 응답)
```typescript
interface NumberPoolEntry {
  num: number;
  cnt: number;
}
```
- `get_hot_numbers`, `get_cold_numbers` RPC 반환 타입
- 기존 `NumberFrequency`와 동일 구조

## localStorage 캐시 스키마

| 키 | 값 형태 | 용도 |
|----|---------|------|
| `luckyLotto.cache.latestDraw` | `LatestDraw` JSON | 최근 당첨 정보 폴백 |
| `luckyLotto.cache.pool.HOT` | `number[]` JSON (20개) | HOT 번호풀 폴백 |
| `luckyLotto.cache.pool.COLD` | `number[]` JSON (20개) | COLD 번호풀 폴백 |
| `luckyLotto.cache.pool.MIX` | `number[]` JSON (20개) | MIX 번호풀 폴백 |

## 데이터 흐름

```
HomeScreen 로드
  └→ useLatestDraw()
       └→ fetchRecentDraws(1)  →  Supabase REST  →  DrawResult
            └→ LatestDraw로 변환 + localStorage 캐시
            └→ 실패 시 localStorage에서 폴백

모드 선택 (App.tsx)
  └→ fetchNumberPool(mode)
       ├→ HOT:  get_hot_numbers(100)  →  상위 20개 num 추출
       ├→ COLD: get_cold_numbers(100) →  하위 20개 num 추출
       └→ MIX:  HOT 10개 + COLD 10개 조합 (중복 제거 후 다음 순위로 채움)
       └→ 성공 시 localStorage 캐시, 실패 시 폴백
       └→ ScratchScreen에 pool prop으로 전달
```

## MODES 구조 변경

### Before
```typescript
const MODES = {
  HOT:  { id: 'HOT',  ..., pool: number[] },  // 하드코딩 번호풀
  COLD: { id: 'COLD', ..., pool: number[] },
  MIX:  { id: 'MIX',  ..., pool: number[] },
};
```

### After
```typescript
const MODES = {
  HOT:  { id: 'HOT',  ko: '핫', label: '자주 나온', desc: '...', accent: '#FF4242' },
  COLD: { id: 'COLD', ko: '콜드', label: '오래 안 나온', desc: '...', accent: '#0066FF' },
  MIX:  { id: 'MIX',  ko: '믹스', label: '균형', desc: '...', accent: '#7C3AED' },
};
// pool 필드 제거 → drawService에서 동적 조회
```
