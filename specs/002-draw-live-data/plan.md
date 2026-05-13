# Implementation Plan: 뽑기 탭 실시간 데이터 연동

**Branch**: `002-draw-live-data` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-draw-live-data/spec.md`

## Summary

뽑기 탭(HomeScreen)의 최근 당첨 정보와 모드별 번호풀(HOT/COLD/MIX)을 하드코딩에서 Supabase 실시간 데이터로 전환한다. 기존 `statsService.ts` 패턴을 따라 서비스 함수와 커스텀 훅을 추가하고, `lotto.ts`의 가짜 빈도 데이터를 제거한다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 19, Vite, @supabase/supabase-js
**Storage**: Supabase PostgreSQL (원격 DB) + localStorage (캐시/폴백)
**Testing**: `npm run test` (frontend)
**Target Platform**: Mobile-first PWA (iOS Safari, Android Chrome)
**Project Type**: Web application (SPA)
**Performance Goals**: FCP 2초 이내 (3G), 데이터 로드 3초 이내
**Constraints**: 오프라인 폴백 필요 (localStorage 캐시)
**Scale/Scope**: ~1,200회차 데이터, 소규모 개인 프로젝트

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| I. Mobile-First PWA | PASS | 기존 모바일 UI 변경 없음, 오프라인 캐시 추가 |
| II. Responsive & Clean UI | PASS | 기존 UI 구조 유지, 로딩/에러 상태만 추가 |
| III. Maintainability | PASS | 서비스 레이어 분리 (statsService 패턴), 컴포넌트 200줄 미초과, any 미사용 |
| IV. Extensibility | PASS | 모드 추가 시 서비스 함수만 추가하면 되는 구조 |
| V. Simplicity (YAGNI) | PASS | 필요한 최소 변경만 수행, 불필요한 추상화 없음 |

## Project Structure

### Documentation (this feature)

```text
specs/002-draw-live-data/
├── plan.md              # 이 파일
├── research.md          # Phase 0: 기술 조사 결과
├── data-model.md        # Phase 1: 데이터 모델
├── quickstart.md        # Phase 1: 빠른 시작 가이드
└── tasks.md             # Phase 2: 태스크 목록 (/speckit-tasks에서 생성)
```

### Source Code (repository root)

```text
frontend/src/
├── lib/
│   ├── supabase.ts          # 기존 Supabase 클라이언트 (변경 없음)
│   ├── statsService.ts      # 기존 통계 서비스 (변경 없음)
│   └── drawService.ts       # [신규] 뽑기 탭 데이터 서비스 (최근 당첨, 번호풀 RPC)
├── hooks/
│   ├── useStatsData.ts      # 기존 통계 훅 (변경 없음)
│   ├── useLatestDraw.ts     # [신규] 최근 당첨 정보 훅 (로딩/에러/캐시)
│   └── useNumberPool.ts     # [신규] 모드별 번호풀 훅 (로딩/에러/캐시)
├── screens/
│   ├── HomeScreen.tsx       # [수정] LATEST_DRAW 하드코딩 → useLatestDraw 훅 사용
│   └── ScratchScreen.tsx    # [수정] MODES[].pool 하드코딩 → props로 번호풀 주입
├── data/
│   └── lotto.ts             # [수정] FREQ_100/POOL 가짜 데이터 제거, MODES에서 pool 필드 제거
└── App.tsx                  # [수정] 모드 선택 시 번호풀 로딩 → ScratchScreen에 전달
```

**Structure Decision**: 기존 프로젝트의 `lib/` (서비스) + `hooks/` (커스텀 훅) 패턴을 그대로 따른다. 통계 화면에서 검증된 `statsService.ts` + `useStatsData.ts` 패턴을 번호풀/최근 당첨에도 동일하게 적용.

## Complexity Tracking

위반 사항 없음.
