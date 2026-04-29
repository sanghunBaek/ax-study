# 로또 추천 앱 - 아키텍처 & 개발 플랜

> **학습 목표**: 실용적인 앱을 만들면서 Claude Code의 다양한 기능(CLAUDE.md, Skill, Subagent, Hook)을 체험한다.

---

## 1. 프로젝트 개요

### 핵심 기능
| 기능 | 설명 |
|------|------|
| 전체 회차 조회 | 1회~최신 회차 당첨 번호, 금액, 날짜 |
| 통계 기반 추천 | Hot/Cold 번호, 출현 빈도 분석 |
| 자동 데이터 갱신 | 매주 최신 회차 자동 업데이트 |

### 데이터 소스
- **동행복권 비공식 API**: `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}`
- JSON 응답 필드: `drwNo`, `drwNoDate`, `drwtNo1~6`, `bnusNo`, `firstWinamnt`, `totSellamnt`
- 총 회차: ~1,220회차 (2002.12.07 시작, 매주 토요일)
- 초기 적재: Node.js 스크립트로 전체 회차 1회 수집 → 이후 Edge Function으로 갱신

---

## 2. 기술 스택

### 프론트엔드: React 18 + Vite + Toss Design System
```
React 18 + Vite
├── @toss/tds             # Toss Design System
├── @toss/use-funnel      # 퍼널 UI 패턴 (번호 추천 플로우)
├── @supabase/supabase-js # Supabase 클라이언트
└── react-query           # 서버 상태 관리
```

### DB + API: Supabase
- PostgreSQL 호스팅 (무료 500MB, Docker 불필요)
- 테이블 생성 시 REST API 자동 생성
- 복잡한 통계 집계는 SQL 함수(RPC)로 처리
- Edge Functions: 주간 자동 갱신 스케줄링

### 데이터 수집: Node.js 스크립트
- 초기 1회 로컬 실행 → 동행복권 API 순회 → Supabase에 적재
- 이후 갱신은 Supabase Edge Function이 담당

### 호스팅: Vercel (무료)
- GitHub 연결 시 자동 배포
- 정적 사이트 서빙 (서버 없음)

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────┐
│         Frontend (React + TDS)       │
│  홈  │  통계 추천  │  회차 조회       │
└──────────────────┬──────────────────┘
                   │ @supabase/supabase-js
┌──────────────────▼──────────────────┐
│              Supabase                │
│  ┌──────────────────────────────┐   │
│  │  Auto REST API               │   │
│  │  lottery_draws 조회/필터링   │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  SQL 함수 (RPC)              │   │
│  │  hot/cold/frequency 집계     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Edge Function (주 1회)      │   │
│  │  동행복권 API → DB 갱신      │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  PostgreSQL                  │   │
│  │  lottery_draws               │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘

배포: Vercel (프론트) + Supabase (DB/API) — 전부 무료
```

---

## 4. 데이터 모델

```sql
lottery_draws (
  drw_no       INTEGER PRIMARY KEY,  -- 회차 번호
  drw_date     DATE,                 -- 추첨일
  num1~num6    INTEGER,              -- 당첨 번호 (오름차순)
  bonus        INTEGER,              -- 보너스 번호
  prize_1st    BIGINT,               -- 1등 당첨금
  total_sales  BIGINT,               -- 총 판매액
  created_at   TIMESTAMP DEFAULT now()
)
```

---

## 5. 추천 알고리즘 (Supabase RPC)

통계 계산은 Supabase SQL 함수로 처리, 프론트는 결과만 받아서 렌더링.

| 추천 유형 | RPC 함수 | 반환 |
|-----------|----------|------|
| `HOT` | `get_hot_numbers(range_count)` | 번호 + 출현 횟수 |
| `COLD` | `get_cold_numbers(range_count)` | 번호 + 마지막 출현 회차 |
| `BALANCED` | `get_balanced_numbers(range_count)` | Hot 3 + Cold 3 조합 |
| `FREQUENCY` | `get_frequency()` | 전체 번호별 출현 빈도 |

```js
// 프론트에서 호출 예시
const { data } = await supabase.rpc('get_hot_numbers', { range_count: 20 })
```

```sql
-- Supabase에 등록하는 SQL 함수 예시
CREATE FUNCTION get_hot_numbers(range_count int)
RETURNS TABLE(num int, cnt bigint) AS $$
  SELECT unnest(ARRAY[num1,num2,num3,num4,num5,num6]) AS num, COUNT(*) AS cnt
  FROM (SELECT * FROM lottery_draws ORDER BY drw_no DESC LIMIT range_count) t
  GROUP BY num ORDER BY cnt DESC
$$ LANGUAGE sql;
```

---

## 6. 디렉토리 구조

```
ax-study/
├── CLAUDE.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── api-spec.md
│
├── .claude/
│   ├── commands/
│   │   ├── seed-db.md       # /seed-db: 전체 회차 초기 적재
│   │   ├── check-api.md     # /check-api: 동행복권 API 최신 회차 확인
│   │   └── db-status.md     # /db-status: Supabase 적재 현황 요약
│   └── settings.json
│
├── scripts/                 # Node.js 데이터 수집 스크립트
│   ├── seed.js              # 전체 회차 초기 적재 (1회 실행)
│   └── sync.js              # 최신 회차 수동 동기화
│
└── frontend/                # React + Vite + TDS
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Recommend.tsx
    │   │   └── History.tsx
    │   ├── components/
    │   ├── lib/
    │   │   └── supabase.ts  # Supabase 클라이언트 초기화
    │   └── lib/
    │       └── supabase.ts  # Supabase 클라이언트 + RPC 호출 함수
    ├── package.json
    └── vite.config.ts
```

---

## 7. 개발 단계 (Phase)

### Phase 1 — Supabase 설정 + 데이터 수집 (1~2일)
- [ ] Supabase 프로젝트 생성, `lottery_draws` 테이블 생성
- [ ] Node.js seed 스크립트 작성 (동행복권 API → Supabase, 200ms 간격)
- [ ] 전체 회차 초기 적재 실행
- [ ] Supabase Edge Function으로 주간 자동 갱신 설정

**검증**: Supabase 대시보드에서 1,220행 확인

### Phase 2 — 프론트엔드 기반 (2~3일)
- [ ] React + Vite 프로젝트 초기화
- [ ] TDS 컴포넌트 적용 (Button, Card 등)
- [ ] Supabase 클라이언트 연결
- [ ] 회차 조회 페이지 (페이지네이션)
- [ ] 통계 계산 유틸 (`stats.ts`: hot/cold/frequency)

**검증**: 회차 조회 + 기본 통계 동작 확인

### Phase 3 — 추천 UI (1~2일)
- [ ] 추천 플로우 UI (`@toss/use-funnel` 활용)
- [ ] 추천 유형 선택 → 번호 표시
- [ ] 통계 시각화 (번호별 출현 빈도)

**검증**: 브라우저에서 전체 플로우 직접 테스트

### Phase 4 — 배포 + Claude Code 고도화 (ongoing)
- [ ] Vercel 배포 (GitHub 연결)
- [ ] `CLAUDE.md` 정교화
- [ ] 커스텀 슬래시 커맨드 고도화 (`/seed-db`, `/check-api`, `/db-status`)
- [ ] Subagent 활용: 복잡한 통계 분석을 별도 에이전트에 위임
- [ ] Hook 설정: pre-commit lint/test 자동화

---

## 8. Claude Code 학습 포인트

| 기능 | 적용 시나리오 |
|------|--------------|
| `CLAUDE.md` | 프로젝트 컨텍스트, DB 스키마, 구조 문서화 |
| **Skill (커스텀 커맨드)** | `/seed-db`: 초기 데이터 적재<br>`/check-api`: API 최신 회차 확인<br>`/db-status`: Supabase 적재 현황 파악 |
| **Subagent** | 1,200회차 전체 통계 분석처럼 무거운 작업을 별도 에이전트에 위임 |
| **Hook** | `PostToolUse`: 코드 저장 후 자동 lint/test |

---

## 9. 환경 변수

```env
# frontend/.env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# scripts/.env (로컬 전용)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # 쓰기 권한 필요
```

---

## 10. 로컬 개발 환경

```bash
# 프론트엔드 실행
cd frontend && npm install && npm run dev

# 초기 데이터 적재 (1회만 실행)
cd scripts && node seed.js
```

> Docker, Java, PostgreSQL 설치 불필요.
> Supabase 계정과 환경변수만 있으면 바로 시작 가능.

---

## 11. 다음 단계 확장 가능성

- **Supabase RPC**: 통계 계산이 느려질 경우 SQL 함수로 이전
- **알림 기능**: 토요일 추첨 후 당첨 결과 비교
- **모바일**: React Native + TDS로 전환
