# 로또 추천 앱 - 아키텍처 & 개발 플랜

> **학습 목표**: 실용적인 앱을 만들면서 Claude Code의 다양한 기능(CLAUDE.md, Skill, Subagent, Hook)을 체험한다.

---

## 1. 프로젝트 개요

### 핵심 기능
| 기능 | 설명 |
|------|------|
| 번호 뽑기 | 모드 선택(HOT/COLD/MIX/ALL) → 스크래치 카드 → 6개 선택 |
| 통계 | 번호별 출현 빈도 차트, 역대 회차 조회 |
| 내 기록 | 선택한 번호 이력 저장/조회 (localStorage) |
| 자동 데이터 갱신 | 매주 최신 회차 자동 업데이트 |

### 데이터 소스
- **[smok95/lotto](https://github.com/smok95/lotto)**: GitHub Pages에서 제공하는 로또 전체 회차 JSON 데이터셋
  - 전체 회차: `https://smok95.github.io/lotto/results/all.json`
  - 최신 회차: `https://smok95.github.io/lotto/results/latest.json`
  - 회차별: `https://smok95.github.io/lotto/results/{회차}.json`
- JSON 응답 필드: `draw_no`, `numbers[]`, `bonus_no`, `date`, `divisions[]`, `total_sales_amount`
- 총 회차: ~1,222회차 (2002.12.07 시작, 매주 토요일)
- 초기 적재: `scripts/seed-from-github.js`로 전체 회차 1회 수집 → 이후 Edge Function으로 갱신

> **왜 동행복권 API를 안 쓰는가?**
> 원래 동행복권 비공식 API(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}`)를
> 사용하려 했으나, 서버 측에서 외부 요청을 차단하여 curl/Node.js fetch 모두 리다이렉트됨.
> Playwright 브라우저 자동화도 시도했으나 불안정. 결국 GitHub에 정리된 데이터셋으로 전환.

---

## 2. 기술 스택

### 프론트엔드: React 18 + Vite + Toss Design System
```
React 18 + Vite
├── @toss/tds             # Toss Design System
├── @toss/use-funnel      # 퍼널 UI 패턴 (번호 추천 플로우)
├── @supabase/supabase-js # Supabase 클라이언트
├── react-query           # 서버 상태 관리
└── vite-plugin-pwa       # PWA 지원 (홈 화면 설치, 오프라인 캐싱)
```

### DB + API: Supabase
- PostgreSQL 호스팅 (무료 500MB, Docker 불필요)
- 테이블 생성 시 REST API 자동 생성
- 복잡한 통계 집계는 SQL 함수(RPC)로 처리
- Edge Functions: 주간 자동 갱신 스케줄링

### 데이터 수집: Node.js 스크립트
- 초기 1회 로컬 실행 → smok95/lotto GitHub 데이터셋 다운로드 → Supabase에 적재
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
│  │  GitHub 데이터셋 → DB 갱신   │   │
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
-- 회차 데이터
lottery_draws (
  drw_no       INTEGER PRIMARY KEY,
  drw_date     DATE,
  num1~num6    INTEGER,
  bonus        INTEGER,
  prize_1st    BIGINT,
  total_sales  BIGINT,
  created_at   TIMESTAMP DEFAULT now()
)

-- 내 기록은 localStorage에 저장 (Supabase 불필요)
-- { mode, numbers: number[], date } 형태로 브라우저에 보존
```

### 저장 위치 전략

| 데이터 | 저장 위치 | 이유 |
|--------|----------|------|
| 회차 데이터 | Supabase | 영구 보존 필요 |
| 내 기록 (번호 선택 이력) | localStorage | 개인 데이터, 날아가도 재선택 가능 |
| UI 설정값 (N값 등) | localStorage | 날아가도 괜찮은 설정 |

---

## 5. 추천 알고리즘 (Supabase RPC)

통계 계산은 Supabase SQL 함수로 처리, 프론트는 결과만 받아서 렌더링.

| 모드 | RPC 함수 | 반환 | 번호풀 |
|------|----------|------|--------|
| `HOT` | `get_hot_numbers(range_count)` | 번호 + 출현 횟수 | 최근 N회차 상위 20개 |
| `COLD` | `get_cold_numbers(range_count)` | 번호 + 마지막 출현 회차 | 최근 N회차 하위 20개 |
| `MIX` | `get_hot_numbers` + `get_cold_numbers` | 각 10개 조합 | HOT 10 + COLD 10 = 20개 |
| `ALL` | (RPC 불필요) | 1~45 전체 | 프론트에서 직접 생성 |
| 통계 | `get_frequency()` | 전체 번호별 출현 빈도 | 통계 화면 전용 |

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
│   ├── seed-from-github.js   # 전체 회차 초기 적재 (GitHub 데이터셋, 1회 실행)
│   ├── seed.js              # (레거시) Playwright 기반 적재 — 동행복권 API 차단으로 미사용
│   └── sync.js              # 최신 회차 수동 동기화
│
└── frontend/                # React + Vite + TDS
    ├── src/
    │   ├── pages/
    │   │   ├── ModeSelect.tsx    # 모드 선택 (HOT/COLD/MIX/ALL)
    │   │   ├── ScratchCard.tsx   # 스크래치 카드 인터랙션
    │   │   ├── Result.tsx        # 완료 화면
    │   │   ├── Stats.tsx         # 통계 (빈도 차트 + 회차 조회)
    │   │   └── MyHistory.tsx     # 내 기록
    │   ├── components/
    │   ├── lib/
    │   │   └── supabase.ts  # Supabase 클라이언트 + RPC 호출 함수
    ├── package.json
    └── vite.config.ts
```

---

## 7. 개발 단계 (Phase)

### Phase 1 — Supabase 설정 + 데이터 수집 (1~2일)
- [ ] Supabase 프로젝트 생성, `lottery_draws` 테이블 생성
- [x] Node.js seed 스크립트 작성 (GitHub 데이터셋 → Supabase)
- [x] 전체 회차 초기 적재 실행 (1,222회차 완료)
- [ ] Supabase Edge Function으로 주간 자동 갱신 설정

**검증**: Supabase 대시보드에서 1,220행 확인

### Phase 2 — 프론트엔드 기반 (2~3일)
- [ ] React + Vite 프로젝트 초기화
- [ ] TDS 컴포넌트 적용 (Button, Card 등)
- [ ] Supabase 클라이언트 연결
- [ ] 회차 조회 페이지 (페이지네이션)
- [ ] 통계 계산 유틸 (`stats.ts`: hot/cold/frequency)

**검증**: 회차 조회 + 기본 통계 동작 확인

### Phase 3 — 스크래치 카드 UI (1~2일)
- [ ] 번호 뽑기 플로우 (`@toss/use-funnel`: 모드 선택 → 스크래치 → 완료)
- [ ] 스크래치 카드 컴포넌트 (긁기 인터랙션, 번호 공개 애니메이션)
- [ ] 6개 선택 완료 애니메이션 (폭죽 이펙트)
- [ ] 내 기록 저장/조회 (localStorage)
- [ ] 통계 시각화 (번호별 출현 빈도 바 차트)
- [ ] PWA 설정 (`vite-plugin-pwa`: manifest, 아이콘, 오프라인 캐싱)

**검증**: 브라우저에서 전체 플로우 테스트, 모바일 홈 화면 설치 확인

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
cd scripts && node seed-from-github.js
```

> Docker, Java, PostgreSQL 설치 불필요.
> Supabase 계정과 환경변수만 있으면 바로 시작 가능.

---

## 11. 다음 단계 확장 가능성

- **Supabase RPC**: 통계 계산이 느려질 경우 SQL 함수로 이전
- **알림 기능**: 토요일 추첨 후 당첨 결과 비교
- **모바일**: React Native + TDS로 전환
