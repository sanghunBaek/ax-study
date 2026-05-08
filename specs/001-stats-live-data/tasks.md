# Tasks: 통계 페이지 실시간 데이터 연동

**Input**: Design documents from `/specs/001-stats-live-data/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/supabase-rpc.md, quickstart.md

**Tests**: 스펙에서 테스트를 명시적으로 요청하지 않았으므로 테스트 태스크는 생략한다.

**Organization**: 태스크는 유저 스토리별로 그룹화하여 독립적 구현 및 검증이 가능하도록 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 태스크가 속한 유저 스토리 (US1, US2, US3)
- 모든 태스크에 정확한 파일 경로를 포함한다

---

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 디렉토리 구조 및 Supabase RPC 함수 준비

- [x] T001 frontend/src/hooks/ 디렉토리 생성 (기존에 없는 경우)
- [x] T002 Supabase 대시보드 SQL Editor에서 get_frequency RPC 함수 등록 (specs/001-stats-live-data/contracts/supabase-rpc.md 참조)

---

## Phase 2: Foundational (기반 작업)

**Purpose**: 모든 유저 스토리가 의존하는 서비스 레이어와 타입 정의, 커스텀 훅 생성

**CRITICAL**: 이 페이즈가 완료되어야 유저 스토리 구현을 시작할 수 있다

- [x] T003 [P] frontend/src/lib/statsService.ts 생성 — Supabase RPC/REST 호출 함수 (fetchFrequency, fetchRecentDraws) 구현. NumberFrequency, DrawResult 타입 정의 포함
- [x] T004 frontend/src/hooks/useStatsData.ts 생성 — 페이지 진입 시 4개 요청(빈도 50/100/전체 + 역대 회차) Promise.all 병렬 조회, { data, loading, error } 패턴 반환. StatsData 타입 정의 포함 (T003 완료 후)

**Checkpoint**: 서비스 레이어 및 커스텀 훅 준비 완료 — 유저 스토리 구현 시작 가능

---

## Phase 3: User Story 1 — 범위별 번호 출현 빈도 조회 (Priority: P1) MVP

**Goal**: 통계 페이지에서 실제 DB 데이터 기반으로 1~45번 각 번호의 출현 빈도를 바 차트로 표시하고, 범위 탭(50/100/전체) 전환 시 해당 범위의 빈도 데이터로 갱신한다.

**Independent Test**: 통계 페이지에 접속하여 범위 탭을 전환하고, 표시되는 빈도 수치가 Supabase DB의 실제 추첨 데이터와 일치하는지 비교하여 검증한다.

### Implementation for User Story 1

- [x] T005 [US1] frontend/src/screens/StatsScreen.tsx 수정 — useStatsData hook import 및 호출, 기존 하드코딩 빈도 데이터(FREQ_50, FREQ_100, FREQ_ALL) 사용 부분을 hook 반환값으로 교체
- [x] T006 [US1] frontend/src/screens/StatsScreen.tsx 수정 — 범위 탭 전환 시 캐싱된 빈도 데이터(freq50/freq100/freqAll)를 즉시 표시하도록 로직 연결
- [x] T007 [US1] frontend/src/screens/StatsScreen.tsx 수정 — 로딩 상태 표시(loading 중 스피너/메시지), 에러 상태 표시(error 시 에러 메시지) 추가 (FR-005, FR-006, SC-004)

**Checkpoint**: 범위별 빈도 바 차트가 실제 데이터로 표시되고, 탭 전환이 즉시 반영된다

---

## Phase 4: User Story 2 — HOT/COLD 번호 실시간 표시 (Priority: P1)

**Goal**: 선택된 범위의 빈도 데이터에서 출현 횟수 상위 6개(HOT)와 하위 6개(COLD) 번호를 실시간으로 표시한다.

**Independent Test**: 선택한 범위의 빈도 데이터를 수동 계산하여 HOT 6개, COLD 6개 번호가 화면에 표시된 번호와 일치하는지 검증한다.

### Implementation for User Story 2

- [x] T008 [US2] frontend/src/screens/StatsScreen.tsx 수정 — 현재 선택된 범위의 빈도 데이터를 정렬하여 상위 6개(HOT), 하위 6개(COLD) 번호를 추출하는 로직 구현 (동률 시 번호 오름차순)
- [x] T009 [US2] frontend/src/screens/StatsScreen.tsx 수정 — 기존 하드코딩 HOT/COLD 데이터를 위에서 추출한 실시간 데이터로 교체, 탭 전환 시 HOT/COLD도 갱신되도록 연결

**Checkpoint**: 범위 탭 전환 시 HOT/COLD 번호가 해당 범위 기준으로 정확히 갱신된다

---

## Phase 5: User Story 3 — 역대 회차 데이터 조회 (Priority: P2)

**Goal**: 통계 페이지 하단에 최근 8개 회차의 실제 추첨 결과(회차번호, 추첨일, 당첨번호, 보너스번호, 1등 당첨금)를 역순으로 표시한다.

**Independent Test**: 역대 회차 목록에 표시된 데이터가 DB의 실제 데이터와 일치하는지 비교하여 검증한다.

### Implementation for User Story 3

- [x] T010 [US3] frontend/src/screens/StatsScreen.tsx 수정 — 기존 하드코딩 역대 회차 데이터(PAST_DRAWS)를 useStatsData hook의 recentDraws 데이터로 교체
- [x] T011 [US3] frontend/src/data/lotto.ts 수정 — 통계 페이지에서 사용하던 하드코딩 데이터(FREQ_50, FREQ_100, FREQ_ALL, PAST_DRAWS) 제거. 다른 곳에서 참조하지 않는 경우 완전 삭제

**Checkpoint**: 역대 회차 목록이 실제 DB 데이터로 표시되고, 새 회차 추가 시 자동 반영된다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 통합 검증 및 정리

- [x] T012 frontend/src/screens/StatsScreen.tsx 최종 검증 — 컴포넌트 200줄 이하 유지 확인 (Constitution III), any 타입 미사용 확인
- [x] T013 quickstart.md 검증 절차 실행 — 범위 탭 전환, HOT/COLD 일치, 역대 회차 데이터 DB 일치 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 시작 (T003은 병렬 가능, T004는 T003 완료 후)
- **User Story 1 (Phase 3)**: Phase 2 완료 후 시작
- **User Story 2 (Phase 4)**: Phase 3 완료 후 시작 (US1의 빈도 데이터 연동에 의존)
- **User Story 3 (Phase 5)**: Phase 2 완료 후 시작 가능 (US1/US2와 독립적)
- **Polish (Phase 6)**: Phase 3, 4, 5 모두 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 즉시 시작 — 다른 스토리에 의존하지 않음
- **User Story 2 (P1)**: US1 완료 후 시작 — 빈도 데이터 연동이 선행되어야 HOT/COLD 추출 가능
- **User Story 3 (P2)**: Foundational 완료 후 즉시 시작 가능 — US1/US2와 독립적 (다만 같은 파일 수정으로 US1 이후 권장)

### Within Each User Story

- 서비스 함수 → 커스텀 훅 → 화면 수정 순서
- 하드코딩 데이터 교체 → 로딩/에러 상태 → 정리

### Parallel Opportunities

- T001, T002: 병렬 가능 (디렉토리 생성과 DB 작업은 독립적)
- T003: Phase 2에서 독립적으로 실행 가능
- US3 (Phase 5)는 US1 (Phase 3) 완료 후 US2와 병렬 진행 가능 (단, 같은 파일 수정 시 순차 권장)

---

## Parallel Example: Foundational Phase

```bash
# T003과 T001/T002는 병렬 실행 가능:
Task: "frontend/src/lib/statsService.ts 생성"
Task: "frontend/src/hooks/ 디렉토리 생성"
Task: "Supabase get_frequency RPC 함수 등록"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 완료: Setup (디렉토리 생성, RPC 함수 등록)
2. Phase 2 완료: Foundational (서비스 레이어 + 커스텀 훅)
3. Phase 3 완료: User Story 1 (범위별 빈도 조회)
4. **STOP and VALIDATE**: 범위 탭 전환 시 실제 데이터 표시 검증
5. MVP로 배포 가능

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비
2. User Story 1 완료 → 빈도 바 차트 실데이터 → 검증 → MVP
3. User Story 2 완료 → HOT/COLD 실데이터 → 검증
4. User Story 3 완료 → 역대 회차 실데이터 → 검증
5. Polish → 최종 정리 및 검증

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- [Story] 라벨은 특정 유저 스토리에 대한 추적성을 제공
- 각 유저 스토리는 독립적으로 완료 및 검증 가능해야 함
- 태스크 완료 후 커밋 권장
- 체크포인트에서 멈추어 스토리를 독립적으로 검증 가능
