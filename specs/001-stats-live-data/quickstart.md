# Quickstart: 통계 페이지 실시간 데이터 연동

**Feature**: 001-stats-live-data

## 사전 조건

1. Supabase 프로젝트가 설정되어 있고 `lottery_draws` 테이블에 데이터가 적재되어 있어야 함
2. `frontend/.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 완료

## 구현 순서

### Step 1: Supabase RPC 함수 등록

Supabase 대시보드 → SQL Editor에서 `get_frequency` 함수를 실행:

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

### Step 2: 서비스 레이어 생성

`frontend/src/lib/statsService.ts` 생성 — Supabase 호출을 캡슐화.

### Step 3: Custom Hook 생성

`frontend/src/hooks/useStatsData.ts` 생성 — 페이지 진입 시 4개 요청 병렬 조회, 로딩/에러 상태 관리.

### Step 4: StatsScreen 수정

기존 하드코딩 데이터(`FREQ_50`, `FREQ_100`, `FREQ_ALL`, `PAST_DRAWS`)를 제거하고 `useStatsData` hook으로 교체.

### Step 5: 검증

```bash
cd frontend && npm run dev
```

통계 페이지에 접속하여:
- 범위 탭 전환 시 데이터가 갱신되는지 확인
- HOT/COLD 번호가 실제 빈도와 일치하는지 확인
- 역대 회차 데이터가 DB와 일치하는지 확인

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/lib/statsService.ts` | Supabase RPC/REST 호출 (신규) |
| `frontend/src/hooks/useStatsData.ts` | 데이터 조회 hook (신규) |
| `frontend/src/screens/StatsScreen.tsx` | 통계 UI (수정) |
| `frontend/src/data/lotto.ts` | 하드코딩 데이터 제거 (수정) |
