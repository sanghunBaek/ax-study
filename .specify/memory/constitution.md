<!--
  Sync Impact Report
  ==================
  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (first ratification)
  Added sections:
    - Core Principles (5 principles)
    - Mobile & PWA Standards
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed (generic, compatible)
    - .specify/templates/spec-template.md ✅ no update needed (generic, compatible)
    - .specify/templates/tasks-template.md ✅ no update needed (generic, compatible)
  Follow-up TODOs: None
-->

# ax-study (로또 추천 앱) Constitution

## Core Principles

### I. Mobile-First PWA

모든 UI와 인터랙션은 모바일 환경을 최우선으로 설계한다.

- 모든 화면은 모바일 뷰포트(320px~430px)에서 먼저 설계하고,
  데스크톱은 보조 지원으로 취급한다.
- PWA manifest, Service Worker, 오프라인 캐시를 반드시 유지하여
  iOS Safari 및 Android Chrome에서 홈 화면 추가(A2HS)가
  정상 동작해야 한다.
- 터치 타겟은 최소 44x44px을 준수하며, 스와이프/탭 등
  모바일 네이티브 제스처와 충돌하지 않아야 한다.

### II. Responsive & Clean UI

다양한 모바일 기기에서 깔끔하고 일관된 UI를 제공한다.

- Toss Design System(TDS) 컴포넌트를 우선 사용하며,
  커스텀 컴포넌트는 TDS 디자인 토큰(색상, 타이포, 간격)을
  반드시 따른다.
- 레이아웃은 CSS Flexbox/Grid 기반 반응형으로 구현하며,
  고정 픽셀 너비 레이아웃을 사용하지 않는다.
- Safe Area Inset(노치, 홈 인디케이터)을 `env()` CSS 함수로
  반드시 처리한다.
- 폰트 크기는 최소 14px 이상을 유지하고,
  색상 대비는 WCAG AA 기준(4.5:1)을 충족한다.

### III. Maintainability

유지보수가 쉬운 코드 구조를 유지한다.

- 컴포넌트는 단일 책임 원칙을 따르며,
  하나의 컴포넌트 파일은 200줄을 초과하지 않는다.
- 비즈니스 로직(hooks/services)과 UI 컴포넌트를 분리한다.
  컴포넌트 내에 Supabase 호출을 직접 작성하지 않는다.
- TypeScript strict 모드를 유지하며,
  `any` 타입 사용을 금지한다.
- ESLint + Prettier 설정을 준수하고,
  린트 에러가 있는 상태로 커밋하지 않는다.

### IV. Extensibility

새로운 기능 추가가 기존 코드에 최소한의 영향을 미치도록 설계한다.

- 페이지/화면 추가 시 기존 코드 수정 없이 라우트와 컴포넌트만
  추가하면 되는 구조를 유지한다.
- 데이터 조회 모드(HOT/COLD/MIX/ALL) 확장 시
  새로운 모드를 인터페이스 구현만으로 추가할 수 있어야 한다.
- Supabase RPC 함수와 프론트엔드 서비스 레이어를 분리하여,
  백엔드 변경이 UI 코드에 직접 전파되지 않도록 한다.

### V. Simplicity (YAGNI)

현재 필요한 것만 구현하고, 과도한 추상화를 지양한다.

- 사용되지 않는 코드, 미사용 의존성, 빈 파일을 방치하지 않는다.
- 하나의 용도로만 쓰이는 유틸리티 함수를 별도 파일로
  분리하지 않는다. 사용처에 인라인으로 작성한다.
- 설계 결정 시 "지금 필요한가?"를 먼저 확인하고,
  미래 요구사항을 위한 선제적 구현을 하지 않는다.

## Mobile & PWA Standards

이 프로젝트는 웹서비스이지만 iOS/Android에서 PWA로 사용되는 것이
핵심 사용 시나리오이므로, 아래 기준을 반드시 충족한다.

- **Lighthouse PWA 점수**: 모든 PWA 체크리스트 항목 통과
- **오프라인 지원**: 최근 조회한 회차 데이터를 캐시하여
  오프라인에서도 마지막 결과를 확인할 수 있어야 한다.
- **iOS 호환성**: `apple-touch-icon`, `apple-mobile-web-app-capable`,
  `viewport-fit=cover` 메타 태그를 반드시 설정한다.
- **Android 호환성**: TWA(Trusted Web Activity) 배포를 고려하여
  Web App Manifest를 완전하게 작성한다.
- **성능 목표**: 3G 네트워크 기준 FCP(First Contentful Paint) 2초 이내

## Development Workflow

- 커밋 메시지는 `feat:`, `fix:`, `docs:`, `test:` 접두사를 사용한다.
- 기능 개발은 spec-kit 워크플로우를 따른다:
  스펙 작성 → 리뷰 → 구현 → 테스트
- 아키텍처 변경, 기술 스택 변경 시 `CLAUDE.md`, `README.md`,
  `docs/` 하위 문서를 반드시 동기화한다.
- 프론트엔드 코드는 `cd frontend && npm run test`로 검증한다.

## Governance

- 이 Constitution은 프로젝트의 모든 개발 관행에 우선한다.
- 원칙 수정 시 이 문서를 직접 수정하고, 버전을 갱신하며,
  관련 문서(CLAUDE.md, README.md, docs/)에 변경 사항을 반영한다.
- 원칙 위반이 불가피한 경우, 해당 코드에 위반 사유를
  주석으로 명시하고 추후 해소 계획을 기록한다.
- 복잡성 추가 시 반드시 정당성을 문서화한다.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
