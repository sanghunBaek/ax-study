# Research: 통계 페이지 실시간 데이터 연동

**Feature**: 001-stats-live-data
**Date**: 2026-05-06

## 연구 항목

### 1. Supabase RPC 함수 설계 — 범위별 빈도 조회

**Decision**: `get_frequency(range_count INTEGER)` 단일 RPC 함수로 범위별 빈도를 조회한다.

**Rationale**:
- 스펙에서 3개 범위(50/100/전체)를 페이지 진입 시 모두 조회한다고 명시
- `range_count` 파라미터로 50, 100, NULL(전체)을 전달하면 하나의 함수로 처리 가능
- 기존 ARCHITECTURE.md에 정의된 `get_hot_numbers`/`get_cold_numbers`는 번호 추천용이므로, 통계 전용 함수를 별도로 만드는 것이 적절
- HOT/COLD 분류는 프론트에서 빈도 데이터를 정렬하여 상위/하위 6개를 추출 (DB에서 할 필요 없음)

**Alternatives considered**:
- 3개 범위별 별도 RPC 함수 → 불필요한 중복, 파라미터화로 충분
- 프론트에서 전체 회차 다운로드 후 JS로 집계 → 데이터 전송량 과다, Constitution III 위반

### 2. 역대 회차 조회 방식

**Decision**: Supabase REST API로 직접 조회한다 (`select('*').order('drw_no', { ascending: false }).limit(8)`).

**Rationale**:
- 단순 SELECT + ORDER + LIMIT이므로 RPC 함수 불필요
- Supabase auto-generated REST API로 충분
- YAGNI 원칙에 부합

**Alternatives considered**:
- RPC 함수로 감싸기 → 과도한 추상화, 단순 조회에 불필요

### 3. 데이터 로딩/캐싱 전략

**Decision**: 페이지 진입 시 4개 요청(빈도 50/100/전체 + 역대 회차)을 `Promise.all`로 병렬 조회하고 `useState`로 관리한다.

**Rationale**:
- 스펙 FR-008: 페이지 진입 시 3개 범위 모두 조회, 탭 전환 시 캐시 사용, 재진입 시 새로 조회
- `Promise.all`로 병렬 처리하면 총 로딩 시간 최소화
- react-query 도입은 현재 프로젝트에서 미사용 → YAGNI 원칙에 따라 도입하지 않음
- Custom hook (`useStatsData`)으로 데이터 조회 로직 캡슐화 → Constitution III 준수

**Alternatives considered**:
- react-query/SWR → ARCHITECTURE.md에 언급되었으나 현재 미설치, 이 기능만을 위해 도입은 과도
- 순차 조회 → 로딩 시간 3배 증가, SC-003 (3초 이내) 위반 가능

### 4. 비즈니스 로직 분리 패턴

**Decision**: Custom hook (`useStatsData`) + Service 함수(`lib/statsService.ts`)로 분리한다.

**Rationale**:
- Constitution III: "컴포넌트 내에 Supabase 호출을 직접 작성하지 않는다"
- 현재 프로젝트에 hooks/services 폴더가 없으므로 `hooks/` 디렉토리에 custom hook, `lib/`에 service 함수를 배치
- StatsScreen은 hook에서 반환된 데이터만 렌더링

**Alternatives considered**:
- StatsScreen 내부에 직접 Supabase 호출 → Constitution III 위반
- Context API → 단일 페이지에서만 사용하므로 과도

### 5. 에러/로딩 상태 처리

**Decision**: Custom hook에서 `{ data, loading, error }` 패턴을 반환한다.

**Rationale**:
- FR-005 (로딩 상태), FR-006 (에러 상태) 요구사항 충족
- 기존 프로젝트에서 일관된 패턴 없음 → 이번에 패턴 수립
- 스켈레톤 UI 대신 간단한 스피너/메시지로 처리 (YAGNI)

**Alternatives considered**:
- Error Boundary → 전역 에러 처리는 이 기능 범위 밖
- 토스트 알림 → TDS 미사용 상태에서 구현 복잡

### 6. Supabase RPC 함수 SQL 정의

**Decision**: `get_frequency` 함수를 아래와 같이 정의한다.

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

**Rationale**:
- `range_count`가 NULL이면 전체 회차 조회 (COALESCE 활용)
- `STABLE` 마커로 동일 트랜잭션 내 캐싱 활용
- `ORDER BY num`으로 1~45 순서 보장 → 프론트에서 추가 정렬 불필요

**Alternatives considered**:
- 보너스 번호 포함 → 스펙에 보너스 번호 빈도 미요구, 제외
- PL/pgSQL → 단순 SQL로 충분
