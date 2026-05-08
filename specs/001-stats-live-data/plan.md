# Implementation Plan: 통계 페이지 실시간 데이터 연동

**Branch**: `001-stats-live-data` | **Date**: 2026-05-06 | **Spec**: `specs/001-stats-live-data/spec.md`
**Input**: Feature specification from `specs/001-stats-live-data/spec.md`

## Summary

StatsScreen의 하드코딩 데이터(FREQ_50/100/ALL, PAST_DRAWS)를 Supabase 실시간 데이터로 교체한다. Supabase RPC 함수(`get_frequency`)로 범위별 빈도를 집계하고, REST API로 역대 회차를 조회한다. Constitution III에 따라 비즈니스 로직을 service/hook으로 분리한다.

## Technical Context

**Language/Version**: TypeScript ~5.7.0, React 19.2.5
**Primary Dependencies**: @supabase/supabase-js ^2.105.2, Vite ^7.3.2, vite-plugin-pwa ^1.2.0
**Storage**: Supabase (PostgreSQL) — `lottery_draws` 테이블 (읽기 전용)
**Testing**: `npm run test` (frontend)
**Target Platform**: 모바일 PWA (iOS Safari, Android Chrome) + 데스크톱 브라우저
**Project Type**: web-application (SPA)
**Performance Goals**: 페이지 초기 로드 3초 이내 (SC-003), 탭 전환 2초 이내 (SC-002)
**Constraints**: 모바일 네트워크 기준 FCP 2초 이내, Supabase 무료 티어 한도 내
**Scale/Scope**: ~1,222 회차 데이터, 단일 사용자 앱

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | Pre-Design | Post-Design | 비고 |
|------|-----------|-------------|------|
| I. Mobile-First PWA | PASS | PASS | 기존 UI 유지, 데이터만 교체 |
| II. Responsive & Clean UI | PASS | PASS | 기존 inline CSS 유지 |
| III. Maintainability | 주의 | PASS | service + hook 분리로 해결 |
| IV. Extensibility | PASS | PASS | RPC 파라미터화로 범위 확장 용이 |
| V. Simplicity (YAGNI) | PASS | PASS | react-query 미도입, 최소 구현 |

**Gate Result**: PASS — 위반 없음

## Project Structure

### Documentation (this feature)

```text
specs/001-stats-live-data/
├── plan.md              # 이 파일
├── spec.md              # 기능 명세
├── research.md          # Phase 0 연구 결과
├── data-model.md        # Phase 1 데이터 모델
├── quickstart.md        # Phase 1 구현 가이드
├── contracts/           # Phase 1 인터페이스 계약
│   └── supabase-rpc.md  # Supabase RPC/REST 계약
└── tasks.md             # Phase 2 태스크 (별도 생성)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── screens/
│   │   └── StatsScreen.tsx       # 수정: 하드코딩 → hook 사용
│   ├── hooks/
│   │   └── useStatsData.ts       # 신규: 통계 데이터 조회 hook
│   ├── lib/
│   │   ├── supabase.ts           # 기존: Supabase 클라이언트
│   │   └── statsService.ts       # 신규: Supabase RPC/REST 호출
│   ├── data/
│   │   └── lotto.ts              # 수정: 하드코딩 데이터 제거
│   └── components/
│       └── NumberBall.tsx         # 기존: 변경 없음
```

**Structure Decision**: 기존 frontend/ 단일 프로젝트 구조 유지. `hooks/` 디렉토리 신규 생성, `lib/`에 서비스 함수 추가.

## Complexity Tracking

위반 사항 없음 — 추가 복잡성 정당화 불필요.

## Design Decisions Summary

| 결정 | 선택 | 근거 |
|------|------|------|
| 빈도 조회 | Supabase RPC `get_frequency(range_count)` | DB에서 집계, 프론트 전송량 최소화 |
| 역대 회차 조회 | Supabase REST API (select + order + limit) | 단순 조회, RPC 불필요 |
| 캐싱 전략 | 페이지 진입 시 4개 요청 `Promise.all` | 스펙 FR-008 준수, YAGNI |
| 로직 분리 | statsService.ts + useStatsData.ts | Constitution III 준수 |
| HOT/COLD 분류 | 프론트에서 정렬 후 상위/하위 6개 추출 | 빈도 데이터 재사용, 추가 RPC 불필요 |
| 에러 처리 | hook에서 `{ data, loading, error }` 반환 | FR-005, FR-006 충족 |

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| research.md | `specs/001-stats-live-data/research.md` | Complete |
| data-model.md | `specs/001-stats-live-data/data-model.md` | Complete |
| contracts | `specs/001-stats-live-data/contracts/supabase-rpc.md` | Complete |
| quickstart.md | `specs/001-stats-live-data/quickstart.md` | Complete |
| tasks.md | `specs/001-stats-live-data/tasks.md` | Pending (`/speckit-tasks`) |
