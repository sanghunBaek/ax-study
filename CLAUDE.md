# 로또 추천 앱 (ax-study)

Claude Code를 활용한 로또 추천 앱 학습 프로젝트.

## 프로젝트 구조

```
ax-study/
├── scripts/      Node.js 데이터 수집 스크립트 (초기 적재, 동기화)
├── frontend/     React 18 + Vite + Toss Design System
├── docs/         아키텍처, API 명세 문서
└── .claude/      커스텀 슬래시 커맨드, 설정
```

## 핵심 도메인

### 데이터 모델
```sql
lottery_draws
  drw_no        INTEGER PRIMARY KEY  -- 회차 번호
  drw_date      DATE                 -- 추첨일
  num1~num6     INTEGER              -- 당첨 번호 (오름차순 정렬)
  bonus         INTEGER              -- 보너스 번호
  prize_1st     BIGINT               -- 1등 당첨금
  total_sales   BIGINT               -- 총 판매액
  created_at    TIMESTAMP
```

### 데이터 소스
- **초기 적재**: [smok95/lotto](https://github.com/smok95/lotto) GitHub 저장소의 `all.json` 활용
  - `https://smok95.github.io/lotto/results/all.json` (전체 회차 JSON)
  - `https://smok95.github.io/lotto/results/latest.json` (최신 회차)
- 전체 회차: 1회 ~ 최신 (~1,222회차), 매주 토요일 갱신

> **참고**: 원래 동행복권 API(`GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}`)를
> 사용하려 했으나, 외부 요청을 차단(리다이렉트)하여 curl/Node.js에서 호출 불가.
> Playwright 브라우저 자동화도 시도했으나 불안정하여, GitHub에 정리된 데이터셋으로 전환.

## 기술 스택

- **프론트**: React 18 + Vite + TDS (`@toss/tds`, `@toss/use-funnel`) + PWA (`vite-plugin-pwa`)
- **DB + API**: Supabase (PostgreSQL 호스팅, REST API 자동 생성)
- **데이터 수집**: Node.js 스크립트 (smok95/lotto GitHub 데이터셋 → Supabase 적재)
- **호스팅**: Vercel (무료, GitHub 연결 시 자동 배포)

## 저장 위치 전략

| 데이터 | 저장 위치 | 이유 |
|--------|----------|------|
| 회차 데이터 | Supabase | 영구 보존 필요 |
| 내 기록 (번호 선택 이력) | localStorage | 개인 데이터, 날아가도 재선택 가능 |
| UI 설정값 (N값 등) | localStorage | 날아가도 괜찮은 설정 |

## Supabase API 패턴

```js
// 회차 조회
supabase.from('lottery_draws').select('*').order('drw_no', { ascending: false })

// 번호풀 조회 — Supabase RPC 함수로 처리 (DB에서 집계, 결과만 반환)
supabase.rpc('get_hot_numbers', { range_count: 100 })   // HOT 모드 (상위 20개)
supabase.rpc('get_cold_numbers', { range_count: 100 })  // COLD 모드 (하위 20개)
// MIX 모드: HOT 10개 + COLD 10개 프론트에서 조합
// ALL 모드: RPC 불필요, 프론트에서 1~45 배열 생성
supabase.rpc('get_frequency')                           // 통계 화면 전용
```

RPC 함수는 Supabase 대시보드 SQL Editor에서 등록. 함수 정의는 `docs/ARCHITECTURE.md` 참고.

## 개발 환경 실행

```bash
# 프론트엔드
cd frontend && npm install && npm run dev

# 초기 데이터 적재 (1회만)
cd scripts && node seed-from-github.js
```

## 환경변수

```
# frontend/.env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# scripts/.env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

## 커스텀 슬래시 커맨드 (.claude/commands/)

개발 중 반복 확인 작업을 단축하는 개발자 전용 커맨드.

| 커맨드 | 기능 |
|--------|------|
| `/seed-db` | GitHub 데이터셋(smok95/lotto)에서 전체 회차 Supabase에 초기 적재 |
| `/check-api` | GitHub 데이터셋 최신 회차 확인 & DB와 동기화 상태 비교 |
| `/db-status` | Supabase 적재 현황 요약 (총 회차 수, 빠진 회차 등) |

## 기능 개발 워크플로우

### spec-kit 활용
기능 개발은 **spec-kit**을 활용하여 진행한다.

- **설치**: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
- **역할**: 기능 개발 전 스펙(명세)을 먼저 작성하고, 해당 스펙을 기반으로 구현 진행
- **순서**: 스펙 작성 → 리뷰 → 구현 → 테스트

## Claude Code 활용 패턴

### Subagent 사용 시나리오
- 전체 회차 통계 분석 (무거운 계산): `Agent(subagent_type="Explore")`
- 복잡한 SQL 쿼리 최적화: `Agent(subagent_type="general-purpose")`

## 테스트

```bash
cd frontend && npm run test
```

## 코드 컨벤션

- React: TypeScript strict, ESLint + Prettier
- 커밋: `feat:`, `fix:`, `docs:`, `test:` 접두사

## 참고 문서
- [아키텍처 전체 플랜](docs/ARCHITECTURE.md)
- [toss/apps-in-toss-ax](https://github.com/toss/apps-in-toss-ax) — TDS 디자인 가이드
- [smok95/lotto](https://github.com/smok95/lotto) — 로또 전체 회차 JSON 데이터셋 (실제 사용 중)
- [동행복권 API (비공식)](https://github.com/roeniss/dhlottery-api) — 참고용 (현재 외부 호출 차단됨)
