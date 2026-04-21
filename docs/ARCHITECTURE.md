# 로또 추천 앱 - 아키텍처 & 개발 플랜

> **학습 목표**: 실용적인 앱을 만들면서 Claude Code의 다양한 기능(CLAUDE.md, Skill, Subagent, Hook, RAG)을 체험한다.

---

## 1. 프로젝트 개요

### 핵심 기능
| 기능 | 설명 |
|------|------|
| 전체 회차 조회 | 1회~최신 회차 당첨 번호, 금액, 날짜 |
| 통계 기반 추천 | Hot/Cold 번호, 출현 빈도 분석 등 |
| LLM 기반 추천 | Claude에게 자연어로 요청 → 번호 추천 |
| 자동 데이터 갱신 | 매주 최신 회차 자동 업데이트 |

### 데이터 소스
- **동행복권 비공식 API**: `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}`
- JSON 응답 필드: `drwNo`, `drwNoDate`, `drwtNo1~6`, `bnusNo`, `firstWinamnt`, `totSellamnt`
- 총 회차: ~1,220회차 (2002.12.07 시작, 매주 토요일)
- 초기 적재: 전체 회차 일괄 수집 → 이후 주 1회 스케줄러로 갱신

---

## 2. 기술 스택

### 백엔드: Spring Boot (Java 21)
Java에 친숙하고 생태계가 성숙해있어 적합. LLM 연동도 Spring AI로 깔끔하게 처리 가능.

```
spring-boot 3.x
├── spring-data-jpa       # DB 접근
├── spring-scheduler      # 주간 데이터 동기화
├── spring-ai             # Claude API 연동 (또는 직접 HTTP)
├── spring-web (RestTemplate / WebClient)  # 동행복권 API 호출
└── postgresql driver
```

**대안 검토**: Python(FastAPI)은 데이터 분석 라이브러리(pandas, numpy)가 풍부하지만, Java가 익숙하고 Spring AI가 충분히 성숙했으므로 Spring Boot 유지.

### 프론트엔드: React + Toss Design System (TDS)
`toss/apps-in-toss-ax`는 TDS 컴포넌트를 활용한 미니앱 개발 가이드 + MCP 툴킷.  
토스 인앱 디자인 가이드라인을 따르되 웹 기반으로 프로토타입 제작.

```
React 18 + Vite
├── @toss/tds             # Toss Design System (토스 디자인 컴포넌트)
├── @toss/use-funnel      # 퍼널 UI 패턴 (번호 추천 플로우)
├── react-query           # 서버 상태 관리
└── zustand               # 클라이언트 상태 관리
```

### 데이터베이스: PostgreSQL
회차 데이터 영구 저장, 통계 쿼리 최적화.

```sql
-- 핵심 테이블
lottery_draws (drw_no, drw_date, num1~6, bonus, prize_1st, total_sales)
recommendation_logs (id, type, input, numbers, created_at)  -- 추천 이력
```

### AI/LLM: Claude API (Anthropic)
```
claude-sonnet-4-6  # 추천 생성, 자연어 분석
├── 통계 데이터를 컨텍스트로 주입 (RAG 패턴)
└── 자연어 질의 → 구조화된 번호 추천 출력
```

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React + TDS)              │
│  홈  │  통계 추천  │  AI 추천  │  회차 조회  │  설정  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│              Backend (Spring Boot)                   │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Lottery API │  │  Statistics  │  │    LLM     │ │
│  │  Controller │  │   Service    │  │  Service   │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                │         │
│  ┌──────▼────────────────▼────────────────▼──────┐  │
│  │              Lottery Draw Repository           │  │
│  └──────────────────────┬─────────────────────────┘  │
│                         │                            │
│  ┌──────────────────────▼─────────────────────────┐  │
│  │         Scheduler (주 1회 데이터 갱신)           │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼──────────────────┐
          ▼               ▼                  ▼
    PostgreSQL      동행복권 API          Claude API
    (회차 데이터)    (신규 회차 수집)      (번호 추천)
```

---

## 4. 추천 알고리즘 종류

### 통계 기반 (LLM 없이 순수 계산)
| 추천 유형 | 로직 |
|-----------|------|
| `HOT` | 최근 N회차에서 가장 많이 출현한 번호 |
| `COLD` | 가장 오랫동안 출현하지 않은 번호 |
| `BALANCED` | Hot 3개 + Cold 3개 조합 |
| `FREQUENCY` | 역대 전체 출현 빈도 기반 |
| `PATTERN` | 연속번호 / 짝수·홀수 비율 분석 |

### LLM 기반 (Claude 연동)
사용자가 자연어로 요청하면 Claude가 통계 컨텍스트를 받아 분석 후 번호 추천.

```
User: "최근 20회차에서 한 번도 안 나온 번호로만 구성해줘"
   ↓
1. 최근 20회차 통계 데이터 조회 (DB)
2. 통계 + 사용자 요청을 Claude에게 전달 (RAG 패턴)
3. Claude → 구조화된 JSON 응답 (numbers: [3, 17, 22, 35, 41, 44])
4. 프론트엔드에 번호 + 추천 이유 반환
```

---

## 5. 디렉토리 구조

```
ax-study/
├── CLAUDE.md                    # Claude Code 프로젝트 가이드 (필수!)
├── docs/
│   ├── ARCHITECTURE.md          # 이 문서
│   └── api-spec.md              # REST API 명세
│
├── .claude/
│   ├── commands/                # 커스텀 슬래시 커맨드 (개발자 전용)
│   │   ├── seed-db.md           # /seed-db: 전체 회차 초기 적재
│   │   ├── check-api.md         # /check-api: 동행복권 API 최신 회차 확인
│   │   ├── gen-prompt.md        # /gen-prompt: LLM 프롬프트 미리보기
│   │   └── db-status.md         # /db-status: DB 적재 현황 요약
│   └── settings.json            # 권한 설정, 환경변수 등
│
├── backend/                     # Spring Boot
│   ├── src/main/java/com/lotto/
│   │   ├── draw/                # 회차 도메인 (entity, repo, service)
│   │   ├── stats/               # 통계 분석 서비스
│   │   ├── recommend/           # 추천 엔진 (통계 + LLM)
│   │   ├── scheduler/           # 주간 데이터 동기화
│   │   └── api/                 # REST Controller
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
│
└── frontend/                    # React + TDS
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Recommend.tsx    # 추천 메인 페이지
    │   │   ├── History.tsx      # 회차 조회
    │   │   └── Stats.tsx        # 통계 시각화
    │   ├── components/
    │   └── api/                 # API 클라이언트
    ├── package.json
    └── vite.config.ts
```

---

## 6. 개발 단계 (Phase)

### Phase 1 — 데이터 기반 구축 (2~3일)
- [ ] Spring Boot 프로젝트 초기화 (`spring-data-jpa`, `postgresql`, `spring-web`)
- [ ] `LotteryDraw` 엔티티 & JPA Repository 작성
- [ ] 동행복권 API 클라이언트 구현 (WebClient)
- [ ] 전체 회차 일괄 수집 스크립트 (1회차~현재, 약 1,220건)
- [ ] `@Scheduled` 주간 자동 갱신 설정
- [ ] 기본 조회 REST API (`GET /api/draws`, `GET /api/draws/{drwNo}`)

**검증**: 전체 회차 DB 적재 확인, API 응답 확인

### Phase 2 — 통계 분석 API (2~3일)
- [ ] `StatsService`: Hot/Cold/Frequency 계산 로직
- [ ] 통계 API (`GET /api/stats/hot?limit=10&range=20`)
- [ ] 통계 기반 추천 API (`GET /api/recommend/stats?type=BALANCED`)
- [ ] 쿼리 최적화 (인덱스, 집계 쿼리)

**검증**: 각 추천 유형별 결과 확인

### Phase 3 — Claude LLM 연동 (2일)
- [ ] Spring AI 또는 Anthropic HTTP 클라이언트 설정
- [ ] 프롬프트 템플릿 설계 (통계 데이터 RAG 주입)
- [ ] LLM 추천 API (`POST /api/recommend/llm` body: `{query: "..."}`)
- [ ] 구조화된 JSON 응답 파싱 (numbers 배열 + reason)

**검증**: 자연어 질의 → 올바른 번호 추천 확인

### Phase 4 — 프론트엔드 (3~4일)
- [ ] React + Vite 프로젝트 초기화
- [ ] TDS 컴포넌트 적용 (Button, Card, BottomSheet 등)
- [ ] 추천 플로우 UI (`@toss/use-funnel` 활용)
- [ ] 회차 조회 페이지 (무한스크롤)
- [ ] 통계 시각화 (번호별 출현 빈도 바 차트)
- [ ] AI 추천 채팅 인터페이스

**검증**: 브라우저에서 전체 플로우 직접 테스트

### Phase 5 — Claude Code 기능 고도화 (ongoing)
- [ ] `CLAUDE.md` 정교화 (컨텍스트, 커맨드 가이드)
- [ ] 커스텀 슬래시 커맨드 고도화 (`/seed-db`, `/check-api`, `/gen-prompt`, `/db-status`)
- [ ] Subagent 활용: 복잡한 통계 분석을 별도 에이전트에 위임
- [ ] Hook 설정: pre-commit 테스트, post-build 알림
- [ ] RAG 고도화: 통계 문서를 벡터 임베딩으로 관리

---

## 7. Claude Code 학습 포인트

| 기능 | 적용 시나리오 |
|------|--------------|
| `CLAUDE.md` | 프로젝트 컨텍스트, DB 스키마, API 구조 문서화 → Claude가 코드 생성 시 정확도 향상 |
| **Skill (커스텀 커맨드)** | `/seed-db`: 초기 데이터 적재<br>`/check-api`: API 최신 회차 즉시 확인<br>`/gen-prompt`: LLM 프롬프트 품질 검토<br>`/db-status`: DB 적재 현황 파악 |
| **Subagent** | 1,200회차 전체 통계 분석처럼 무거운 작업을 별도 에이전트에 위임 |
| **Hook** | `PreToolUse`: DB 스키마 변경 전 백업 트리거<br>`PostToolUse`: 코드 저장 후 자동 lint/test |
| **RAG** | 최신 통계 데이터를 마크다운 문서로 생성 → Claude 컨텍스트에 주입하여 더 정교한 추천 |

---

## 8. 환경 변수

```env
# backend/.env
DATABASE_URL=jdbc:postgresql://localhost:5432/lotto
DATABASE_USERNAME=lotto
DATABASE_PASSWORD=...
ANTHROPIC_API_KEY=sk-ant-...

# 동행복권 API (별도 인증 불필요, rate limit 주의)
LOTTERY_API_BASE_URL=https://www.dhlottery.co.kr
LOTTERY_API_FETCH_DELAY_MS=200  # 호출 간격
```

---

## 9. 로컬 개발 환경

```bash
# PostgreSQL (Docker)
docker run -d \
  --name lotto-db \
  -e POSTGRES_DB=lotto \
  -e POSTGRES_USER=lotto \
  -e POSTGRES_PASSWORD=lotto \
  -p 5432:5432 \
  postgres:16

# 백엔드 실행
cd backend && ./mvnw spring-boot:run

# 프론트엔드 실행
cd frontend && npm install && npm run dev
```

---

## 10. 다음 단계 확장 가능성

- **로또 조합 최적화**: 과거 당첨 번호와 겹치지 않는 조합 자동 필터
- **알림 기능**: 토요일 추첨 후 당첨 결과 비교 알림
- **소셜 기능**: 추천 번호 공유
- **모바일**: React Native + TDS로 전환 (토스 인앱 미니앱 제출 가능)
