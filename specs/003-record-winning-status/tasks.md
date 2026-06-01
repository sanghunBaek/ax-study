# Tasks: 내 기록 당첨 여부 표기

**Input**: Design documents from `specs/003-record-winning-status/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 이 기능에 필요한 신규 파일 생성 및 기본 구조 설정

- [x] T001 [P] 회차 매핑 및 등수 판정 서비스 파일 생성 in `frontend/src/lib/winningService.ts` — 타입 정의(WinningRank, WinningResult) + 빈 함수 시그니처(getDrawNoForRecord, checkWinning, getWinningResults)
- [x] T002 [P] 당첨 결과 조회 hook 파일 생성 in `frontend/src/hooks/useWinningResults.ts` — 빈 hook 시그니처
- [x] T003 [P] 등수별 색상 뱃지 컴포넌트 파일 생성 in `frontend/src/components/WinningBadge.tsx` — 빈 컴포넌트 시그니처

---

## Phase 2: Foundational (핵심 비즈니스 로직)

**Purpose**: 모든 User Story가 의존하는 회차 매핑 + 등수 판정 순수 로직

- [x] T004 `getDrawNoForRecord(ts: number, draws: DrawResult[]): number | null` 구현 in `frontend/src/lib/winningService.ts` — ts를 KST 기준 다음 토요일로 변환, drw_date 매칭하여 회차 반환. 토요일 21:00 이후는 다음 주 토요일. 매칭 없으면 null(미발표)
- [x] T005 `checkWinning(userNums: number[], drawNums: number[], bonus: number): { rank: WinningRank, matchCount: number, bonusMatch: boolean }` 구현 in `frontend/src/lib/winningService.ts` — 6개 일치=1등, 5개+보너스=2등, 5개=3등, 4개=4등, 3개=5등, 나머지=낙첨
- [x] T006 `fetchDrawsByNos(drwNos: number[]): Promise<DrawResult[]>` 구현 in `frontend/src/lib/winningService.ts` — Supabase에서 `drw_no IN (...)` 조건으로 배치 조회
- [x] T007 `getWinningResults(records: LottoRecord[], draws: DrawResult[]): Map<string, WinningResult>` 구현 in `frontend/src/lib/winningService.ts` — T004 + T005 조합하여 전체 기록의 당첨 결과 Map 반환 (key: record.id)

**Checkpoint**: 비즈니스 로직 완료 — 순수 함수 단위 테스트 가능

---

## Phase 3: User Story 1 — 발표된 회차의 당첨 여부 확인 (Priority: P1) MVP

**Goal**: 추첨 완료된 회차의 기록에 1등~5등/낙첨 뱃지를 표시한다

**Independent Test**: 과거 회차 기록 저장 후 내 기록 탭에서 올바른 등수 뱃지가 표시되는지 확인

### Implementation for User Story 1

- [x] T008 [US1] `useWinningResults` hook 구현 in `frontend/src/hooks/useWinningResults.ts` — records 배열을 받아 고유 회차 추출 → fetchDrawsByNos로 DB 조회 → getWinningResults로 판정 → `Map<string, WinningResult>` 반환. loading/error 상태 포함
- [x] T009 [US1] `WinningBadge` 컴포넌트 구현 in `frontend/src/components/WinningBadge.tsx` — rank에 따른 등수별 색상 뱃지 렌더링: 1등=금색(#FFD700/fg:#7A5C00), 2등=은색(#C0C0C0/fg:#4A4A4A), 3등=동색(#CD7F32/fg:#FFFFFF), 4등=파란색(#0066FF/fg:#FFFFFF), 5등=연파랑(#EAF2FE/fg:#0066FF), 낙첨=회색(#F2F3F5/fg:#A8A8AB), 미발표=연회색(#F2F3F5/fg:#C2C4C8). 뱃지 텍스트: "1등"~"5등", "낙첨", "미발표". 기존 디자인 시스템과 일관: Wanted Sans Variable 폰트, border-radius 10px, padding 4px 10px, fontSize 11px, fontWeight 700 — RecordsScreen 카드 스타일(border-radius 14px, border 1px solid #E5E5E5)과 조화
- [x] T010 [US1] RecordsScreen에 당첨 뱃지 통합 in `frontend/src/screens/RecordsScreen.tsx` — useWinningResults hook 호출, 각 기록 카드 우측에 WinningBadge 배치. 카드 레이아웃을 flex row로 조정하여 번호 영역과 뱃지 영역 분리
- [x] T011 [US1] RecordsScreen에 회차 번호 표시 추가 in `frontend/src/screens/RecordsScreen.tsx` — WinningResult.drwNo를 참조하여 기존 날짜 앞에 "1223회 · " 형태로 회차 번호 추가. fmtDate 함수는 수정하지 않고, 렌더링 시 `${drwNo}회 · ${fmtDate(r.ts)}` 형태로 조합. drwNo가 null(미발표)이면 회차 번호 미표시

**Checkpoint**: 발표된 회차의 당첨 여부가 올바르게 표시됨

---

## Phase 4: User Story 2 — 미발표 회차 상태 표시 (Priority: P1)

**Goal**: 아직 추첨되지 않은 회차의 기록에 "미발표" 뱃지를 표시한다

**Independent Test**: 최신 회차 이후에 저장된 기록이 "미발표"로 표시되는지 확인

### Implementation for User Story 2

- [x] T012 [US2] 미발표 상태 처리 확인 in `frontend/src/lib/winningService.ts` — getDrawNoForRecord에서 drw_date 매칭 실패 시 null 반환 → getWinningResults에서 rank: 'pending' 설정 확인. fetchDrawsByNos 실패 시에도 해당 기록을 'pending'으로 처리
- [x] T013 [US2] RecordsScreen 미발표 표시 확인 in `frontend/src/screens/RecordsScreen.tsx` — drwNo가 null인 경우 회차 번호 미표시, WinningBadge에 rank='pending' 전달하여 "미발표" 뱃지 표시

**Checkpoint**: 미발표 기록과 발표된 기록이 올바르게 구분되어 표시됨

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 완성도 개선

- [x] T014 로딩 상태 처리 in `frontend/src/screens/RecordsScreen.tsx` — 당첨 결과 조회 중 로딩 인디케이터 표시 (기존 앱 스타일과 일관)
- [x] T015 에러 상태 fallback in `frontend/src/screens/RecordsScreen.tsx` — Supabase 조회 실패 시 뱃지 영역에 "미발표"로 graceful fallback. 에러 시에도 기존 기록 목록은 정상 표시
- [x] T016 성능 확인 in `frontend/src/hooks/useWinningResults.ts` — 기록 200건 기준 Supabase 배치 조회 응답이 1초 이내인지 확인. 필요 시 조회 결과를 localStorage에 캐싱하여 SC-001(1초 이내) 충족

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 의존성 없음 — T001, T002, T003 병렬 실행 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 — T004~T007 순차 (T004→T005→T006→T007)
- **Phase 3 (US1)**: Phase 2 완료 후 — T008→T009→T010→T011 순차
- **Phase 4 (US2)**: Phase 3 완료 후 — T012→T013 순차 (US1 기반 위에 확인/보완)
- **Phase 5 (Polish)**: Phase 4 완료 후 — T014, T015 병렬 가능

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 가능 — 핵심 MVP
- **US2 (P1)**: US1 완료 후 시작 — US1의 hook/컴포넌트를 재사용하므로 의존

### Parallel Opportunities

- T001, T002, T003 병렬 (Phase 1)
- T014, T015 병렬 (Phase 5)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 완료 → 파일 구조 준비
2. Phase 2 완료 → 핵심 비즈니스 로직 검증
3. Phase 3 완료 → **MVP 동작 확인**: 발표된 회차의 당첨 뱃지 표시
4. STOP and VALIDATE

### Incremental Delivery

1. Phase 1 + 2 → 로직 기반 준비
2. Phase 3 (US1) → 당첨 결과 표시 MVP
3. Phase 4 (US2) → 미발표 상태 처리 추가
4. Phase 5 → 로딩/에러 처리 완성

---

## Notes

- 모든 신규 파일은 `frontend/src/` 하위에 생성
- 기존 파일 수정은 `RecordsScreen.tsx` 1개만 해당
- Supabase 조회는 기존 `supabase.ts` 클라이언트 재사용
- 기존 `statsService.ts`의 `DrawResult` 타입 재사용
- 당첨 판정 로직은 순수 함수로 작성하여 테스트 용이성 확보
