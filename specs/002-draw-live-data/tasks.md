# Tasks: 뽑기 탭 실시간 데이터 연동

**Input**: Design documents from `specs/002-draw-live-data/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 태스크가 속한 유저 스토리 (US1, US2, US3)
- 모든 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup (공통 인프라)

**Purpose**: 서비스 레이어와 데이터 모델 기반 준비

- [x] T001 `frontend/src/lib/drawService.ts` 파일 생성 — `fetchLatestDraw()` 함수 구현: `fetchRecentDraws(1)` 호출 후 `DrawResult` → `LatestDraw` 형태로 변환 반환. localStorage 캐시 키 `luckyLotto.cache.latestDraw`에 성공 데이터 저장, 실패 시 캐시에서 폴백
- [x] T002 `frontend/src/lib/drawService.ts`에 `fetchNumberPool(mode: string)` 함수 추가 — HOT: `supabase.rpc('get_hot_numbers', { range_count: 100 })` 호출 후 상위 20개 num 추출. COLD: `supabase.rpc('get_cold_numbers', { range_count: 100 })` 호출 후 하위 20개 num 추출. MIX: HOT 상위 10개 + COLD 하위 10개 조합, 중복 시 다음 순위로 대체하여 20개 확보. 성공 시 `luckyLotto.cache.pool.{mode}` 캐시 저장, 실패 시 캐시 폴백
- [x] T003 `frontend/src/data/lotto.ts` 수정 — `FREQ_100`, `POOL_HOT`, `POOL_COLD`, `POOL_MIX` 가짜 빈도 데이터 및 관련 함수(`topN`, `bottomN`) 삭제. `LATEST_DRAW` 상수 삭제. `Mode` 인터페이스에서 `pool` 필드 제거. `MODES` 객체에서 `pool` 값 제거

**Checkpoint**: 서비스 레이어 준비 완료, 가짜 데이터 제거됨

---

## Phase 2: User Story 1 — 최근 당첨 번호 실시간 표시 (Priority: P1) MVP

**Goal**: 뽑기 탭 홈 화면에 Supabase에서 조회한 최신 당첨 번호를 표시

**Independent Test**: 앱 실행 → 뽑기 탭 → 상단 카드에 실제 최신 회차 번호/당첨 번호/보너스 번호 표시 확인

### Implementation

- [x] T004 [US1] `frontend/src/hooks/useLatestDraw.ts` 생성 — `drawService.fetchLatestDraw()` 호출, `{ data: LatestDraw | null, loading: boolean, error: string | null }` 반환. `useStatsData` 훅과 동일한 패턴 (useEffect + cancelled flag)
- [x] T005 [US1] `frontend/src/screens/HomeScreen.tsx` 수정 — `LATEST_DRAW` import 제거, `useLatestDraw()` 훅 사용으로 교체. 로딩 중: 최근 당첨 카드 영역에 "불러오는 중..." 텍스트 표시. 에러(캐시도 없음): "불러올 수 없습니다" + 재시도 버튼 표시. 정상: 기존 UI 그대로 `data.round`, `data.nums`, `data.bonus` 바인딩

**Checkpoint**: 뽑기 탭 진입 시 실제 최신 당첨 번호가 3초 이내 표시됨

---

## Phase 3: User Story 2 — HOT/COLD/MIX 번호풀 실시간 생성 (Priority: P1)

**Goal**: 모드 선택 시 Supabase RPC로 실제 통계 기반 번호풀을 생성하여 스크래치 화면에 전달

**Independent Test**: HOT/COLD/MIX 각 모드 선택 → 스크래치 화면에 20개 번호 표시, 번호가 실제 통계 기반인지 확인

### Implementation

- [x] T006 [US2] `frontend/src/hooks/useNumberPool.ts` 생성 — `drawService.fetchNumberPool(mode)` 호출, `{ pool: number[] | null, loading: boolean, error: string | null, retry: () => void }` 반환. `useStatsData` 훅과 동일한 패턴 (useEffect + cancelled flag). mode 변경 시 재호출
- [x] T007 [US2] `frontend/src/App.tsx` 수정 — 모드 선택 시 `useNumberPool(modeId)` 훅 사용. 로딩 완료 후 `ScratchScreen`에 `pool` prop 전달. 에러 시 에러 메시지 + 재시도 버튼 표시 (훅의 retry 함수 사용)
- [x] T008 [US2] `frontend/src/screens/ScratchScreen.tsx` 수정 — Props에 `pool: number[]` 추가. 내부 `useState`에서 `mode.pool` 대신 `pool` prop 사용으로 교체. 나머지 스크래치/선택 로직은 변경 없음

**Checkpoint**: 3개 모드 모두에서 실제 통계 기반 20개 번호풀로 스크래치 동작 확인

---

## Phase 4: User Story 3 — 번호풀 로딩 중 사용자 경험 (Priority: P2)

**Goal**: 모드 선택 후 데이터 로딩 중 명확한 시각적 피드백 제공

**Independent Test**: 네트워크 속도 제한 상태에서 모드 선택 → 로딩 표시 확인 → 데이터 도착 후 스크래치 화면 전환 확인

### Implementation

- [x] T009 [US3] `frontend/src/App.tsx`에 로딩 UI 추가 — `poolLoading === true`일 때 스크래치 화면 대신 로딩 화면 렌더링: 모드 이름 + "번호풀을 준비하는 중..." 텍스트. `poolError`일 때 에러 안내 + "다시 시도" 버튼 + "홈으로" 버튼 표시

**Checkpoint**: 느린 네트워크에서 로딩 → 스크래치 전환이 자연스러움

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: 전체 플로우 검증 및 정리

- [x] T010 전체 플로우 검증 — 뽑기 탭 → 최근 당첨 표시 → 모드 선택 → 로딩 → 스크래치 → 6개 선택 → 완료 → 저장 플로우 정상 동작 확인
- [x] T011 오프라인 폴백 검증 — 네트워크 차단 상태에서 앱 재진입, 캐시된 최근 당첨 데이터 표시 및 캐시된 번호풀로 모드 진입 가능 확인
- [x] T012 `frontend/src/data/lotto.ts` 정리 — 미사용 import, 미사용 코드 최종 정리. `Mode` 타입에서 `pool` 관련 잔여 참조 확인 및 제거

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (US1)**: Phase 1 완료 후 시작 (T001 필요)
- **Phase 3 (US2)**: Phase 1 완료 후 시작 (T002, T003 필요). US1과 병렬 가능하나, 순차 진행 권장
- **Phase 4 (US3)**: Phase 3 완료 후 시작 (T007의 로딩 상태에 의존)
- **Phase 5 (Polish)**: Phase 2~4 완료 후

### User Story Dependencies

- **US1 (최근 당첨)**: T001 → T004 → T005. 독립적, US2와 무관
- **US2 (번호풀)**: T002, T003 → T006 → T007 → T008. US1과 독립적이나 T003이 `lotto.ts` 수정하므로 US1 이후 권장
- **US3 (로딩 UX)**: T007 완료 필요 (App.tsx 로딩 상태 기반)

### Parallel Opportunities

- T001과 T002는 같은 파일이므로 순차 진행
- T004와 T006은 다른 파일이므로 병렬 가능 (단, T003 공유 의존)
- T010, T011, T012는 병렬 가능

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1 완료: drawService + lotto.ts 정리
2. Phase 2 완료: useLatestDraw 훅 + HomeScreen 연동
3. **검증**: 뽑기 탭에서 실제 최신 당첨 번호 표시 확인
4. 이 시점에서 MVP 데모 가능

### Incremental Delivery

1. Setup → US1 완료 → 최근 당첨 실시간 표시 (MVP)
2. US2 완료 → 모드별 실제 번호풀로 스크래치 동작
3. US3 완료 → 로딩 UX 개선
4. Polish → 전체 플로우 + 오프라인 검증

---

## Notes

- 기존 `useStatsData` 훅 패턴을 그대로 따라 일관성 유지
- `statsService.ts`의 `fetchRecentDraws` 재사용으로 코드 중복 방지
- localStorage 캐시는 단순 JSON 저장/조회만 (만료 정책 없음)
- 커밋은 각 Phase 완료 시점에 수행 권장
