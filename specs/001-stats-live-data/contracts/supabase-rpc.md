# Contract: Supabase RPC — get_frequency

**Feature**: 001-stats-live-data

## get_frequency

번호별 출현 빈도를 반환하는 Supabase RPC 함수.

### 호출

```typescript
supabase.rpc('get_frequency', { range_count: 50 })
supabase.rpc('get_frequency', { range_count: 100 })
supabase.rpc('get_frequency', { range_count: null })  // 전체
```

### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| range_count | INTEGER | No | 최근 N회차 범위. NULL이면 전체 회차 |

### 응답

```json
[
  { "num": 1, "cnt": 12 },
  { "num": 2, "cnt": 8 },
  ...
  { "num": 45, "cnt": 15 }
]
```

- 항상 45개 행 반환 (num 1~45)
- `num` 오름차순 정렬
- `cnt`는 해당 범위 내 출현 횟수

### 에러 케이스

| 상황 | 응답 |
|------|------|
| range_count < 1 | 빈 배열 |
| DB 연결 실패 | Supabase 표준 에러 (status 5xx) |

---

## lottery_draws REST API — 최근 회차 조회

### 호출

```typescript
supabase
  .from('lottery_draws')
  .select('drw_no, drw_date, num1, num2, num3, num4, num5, num6, bonus, prize_1st')
  .order('drw_no', { ascending: false })
  .limit(8)
```

### 응답

```json
[
  {
    "drw_no": 1222,
    "drw_date": "2026-05-02",
    "num1": 3, "num2": 11, "num3": 17, "num4": 28, "num5": 35, "num6": 42,
    "bonus": 7,
    "prize_1st": 2500000000
  },
  ...
]
```

- 최대 8개 행, `drw_no` 내림차순
