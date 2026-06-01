# Implementation Plan: 내 기록 당첨 여부 표기

**Branch**: `003-record-winning-status` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-record-winning-status/spec.md`

## Summary

내 기록(RecordsScreen) 탭의 각 기록 카드에 당첨 여부 뱃지를 표시한다. 기록 저장 시점(ts)으로 해당 주 토요일 추첨 회차를 매핑하고, Supabase에서 해당 회차 당첨번호를 조회하여 등수를 판정한다. 등수별 색상 뱃지(1등=금, 2등=은, 3등=동, 4-5등=파랑, 낙첨=회색, 미발표=연한 회색)를 카드 우측에 표시하며, 회차 번호도 날짜 옆에 함께 노출한다.

## Technical Context

**Language/Version**: TypeScript 5.x (React 19)
**Primary Dependencies**: React 19, Vite, @supabase/supabase-js, Wanted Sans Variable
**Storage**: Supabase (PostgreSQL) — lottery_draws 테이블, localStorage — 기록 데이터
**Testing**: `npm run test` (frontend)
**Target Platform**: 모바일 웹 PWA (iOS Safari, Android Chrome)
**Project Type**: web-service (SPA + BaaS)
**Performance Goals**: 내 기록 탭 진입 시 당첨 결과 1초 이내 표시
**Constraints**: 기록 최대 200건 (localStorage 제한), 네트워크 실패 시 graceful fallback
**Scale/Scope**: 개인 사용 앱, 기록 최대 200건

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| I. Mobile-First PWA | PASS | 뱃지 UI는 모바일 카드 레이아웃 내 우측 배치, 터치 타겟 불필요 (표시 전용) |
| II. Responsive & Clean UI | PASS | 기존 카드 디자인 패턴 유지, TDS 색상 토큰 활용 |
| III. Maintainability | PASS | 비즈니스 로직(회차 매핑, 등수 판정)을 hook/service로 분리 |
| IV. Extensibility | PASS | WinningResult 타입으로 추상화, 향후 당첨금 표시 등 확장 용이 |
| V. Simplicity (YAGNI) | PASS | 필요한 것만 구현 — 등수 판정 + 뱃지 표시 |

## Project Structure

### Documentation (this feature)

```text
specs/003-record-winning-status/
├── plan.md              # 이 파일
├── spec.md              # 기능 명세
├── research.md          # Phase 0 리서치
├── data-model.md        # Phase 1 데이터 모델
├── checklists/          # 체크리스트
└── tasks.md             # Phase 2 태스크 (speckit-tasks에서 생성)
```

### Source Code (repository root)

```text
frontend/src/
├── lib/
│   ├── supabase.ts          # (기존) Supabase 클라이언트
│   ├── drawService.ts       # (기존) 추첨 데이터 서비스
│   ├── statsService.ts      # (기존) 통계 데이터 서비스
│   └── winningService.ts    # (신규) 회차 매핑 + 등수 판정 로직
├── hooks/
│   └── useWinningResults.ts # (신규) 기록 목록의 당첨 결과 조회 hook
├── components/
│   └── WinningBadge.tsx     # (신규) 등수별 색상 뱃지 컴포넌트
├── screens/
│   └── RecordsScreen.tsx    # (수정) 뱃지 + 회차 번호 표시 통합
└── data/
    └── lotto.ts             # (기존, 타입만 참조)
```

**Structure Decision**: 기존 프로젝트 구조를 유지하며, 비즈니스 로직은 `lib/winningService.ts`에, 데이터 조회는 `hooks/useWinningResults.ts`에, UI는 `components/WinningBadge.tsx`에 분리한다.
