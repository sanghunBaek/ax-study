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
- 동행복권 API: `GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}`
- 전체 회차: 1회 ~ 최신 (~1,220회차), 매주 토요일 갱신
- API 호출 간격: 200ms 이상 유지 (rate limit 주의)

## 기술 스택

- **프론트**: React 18 + Vite + TDS (`@toss/tds`, `@toss/use-funnel`) + PWA (`vite-plugin-pwa`)
- **DB + API**: Supabase (PostgreSQL 호스팅, REST API 자동 생성)
- **데이터 수집**: Node.js 스크립트 (로컬 1회 실행)
- **호스팅**: Vercel (무료, GitHub 연결 시 자동 배포)

## 저장 위치 전략

| 데이터 | 저장 위치 | 이유 |
|--------|----------|------|
| 회차 데이터 | Supabase | 영구 보존 필요 |
| 추천 이력 | Supabase | 크롬 캐시 초기화 시 로컬 소멸 |
| UI 설정값 (N값 등) | localStorage | 날아가도 괜찮은 설정 |

## Supabase API 패턴

```js
// 회차 조회
supabase.from('lottery_draws').select('*').order('drw_no', { ascending: false })

// 통계 계산 — Supabase RPC 함수로 처리 (DB에서 집계, 결과만 반환)
supabase.rpc('get_hot_numbers', { range_count: 20 })
supabase.rpc('get_cold_numbers', { range_count: 20 })
supabase.rpc('get_frequency')
```

RPC 함수는 Supabase 대시보드 SQL Editor에서 등록. 함수 정의는 `docs/ARCHITECTURE.md` 참고.

## 개발 환경 실행

```bash
# 프론트엔드
cd frontend && npm install && npm run dev

# 초기 데이터 적재 (1회만)
cd scripts && node seed.js
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
| `/seed-db` | 동행복권 API에서 전체 회차 Supabase에 초기 적재 |
| `/check-api` | 동행복권 API 최신 회차 확인 & DB와 동기화 상태 비교 |
| `/db-status` | Supabase 적재 현황 요약 (총 회차 수, 빠진 회차 등) |

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
- [동행복권 API (비공식)](https://github.com/roeniss/dhlottery-api)
