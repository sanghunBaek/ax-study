# Data Model: 통계 페이지 실시간 데이터 연동

**Feature**: 001-stats-live-data
**Date**: 2026-05-06

## 기존 엔티티 (변경 없음)

### lottery_draws (Supabase PostgreSQL)

이미 존재하는 테이블. 이 기능에서는 읽기 전용으로 사용.

| 필드 | 타입 | 설명 |
|------|------|------|
| drw_no | INTEGER PK | 회차 번호 |
| drw_date | DATE | 추첨일 |
| num1~num6 | INTEGER | 당첨 번호 (오름차순) |
| bonus | INTEGER | 보너스 번호 |
| prize_1st | BIGINT | 1등 당첨금 |
| total_sales | BIGINT | 총 판매액 |
| created_at | TIMESTAMP | 생성일시 |

## 새로운 엔티티

### NumberFrequency (프론트엔드 타입, DB 테이블 아님)

Supabase RPC `get_frequency` 반환값을 매핑하는 타입.

```typescript
interface NumberFrequency {
  num: number;   // 1~45
  cnt: number;   // 출현 횟수
}
```

### DrawResult (프론트엔드 타입, DB 테이블 아님)

역대 회차 조회 결과를 매핑하는 타입.

```typescript
interface DrawResult {
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
```

### StatsData (프론트엔드 타입)

Custom hook 반환값 타입.

```typescript
interface StatsData {
  freq50: NumberFrequency[];    // 최근 50회 빈도
  freq100: NumberFrequency[];   // 최근 100회 빈도
  freqAll: NumberFrequency[];   // 전체 빈도
  recentDraws: DrawResult[];    // 최근 8회차
}
```

## 새로운 DB 오브젝트

### get_frequency RPC 함수

```sql
CREATE OR REPLACE FUNCTION get_frequency(range_count INTEGER DEFAULT NULL)
RETURNS TABLE(num INTEGER, cnt BIGINT) AS $$
  SELECT unnest(ARRAY[num1,num2,num3,num4,num5,num6]) AS num, COUNT(*) AS cnt
  FROM (
    SELECT num1,num2,num3,num4,num5,num6
    FROM lottery_draws
    ORDER BY drw_no DESC
    LIMIT COALESCE(range_count, (SELECT COUNT(*) FROM lottery_draws))
  ) t
  GROUP BY num
  ORDER BY num
$$ LANGUAGE sql STABLE;
```

## 데이터 흐름

```
[Supabase]                           [Frontend]

get_frequency(50)  ──→ [{num,cnt}]   ──→ freq50
get_frequency(100) ──→ [{num,cnt}]   ──→ freq100
get_frequency(NULL)──→ [{num,cnt}]   ──→ freqAll
lottery_draws      ──→ DrawResult[]  ──→ recentDraws

                   useStatsData hook
                   ↓
                   StatsScreen (렌더링만)
```

## 상태 전이

없음 — 읽기 전용 데이터. 상태 변경은 범위 탭 선택(`'50' | '100' | 'all'`)뿐이며 이는 UI 상태.

## 유효성 규칙

- `NumberFrequency.num`: 1 ≤ num ≤ 45
- `NumberFrequency.cnt`: cnt ≥ 0
- `DrawResult.drw_no`: drw_no ≥ 1
- HOT 번호: 빈도 상위 6개 (동률 시 번호 오름차순)
- COLD 번호: 빈도 하위 6개 (동률 시 번호 오름차순)
