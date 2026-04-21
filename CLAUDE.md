# 로또 추천 앱 (ax-study)

Claude Code를 활용한 로또 추천 앱 학습 프로젝트.

## 프로젝트 구조

```
ax-study/
├── backend/      Spring Boot 3.x (Java 21) — REST API, 데이터 수집, LLM 연동
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

## 주요 API 엔드포인트

```
GET  /api/draws              전체 회차 목록 (페이지네이션)
GET  /api/draws/{drwNo}      특정 회차 상세
GET  /api/stats/hot          최근 N회차 Hot 번호 (자주 나온)
GET  /api/stats/cold         최근 N회차 Cold 번호 (안 나온)
GET  /api/stats/frequency    전체 번호 출현 빈도
GET  /api/recommend/stats    통계 기반 번호 추천
POST /api/recommend/llm      LLM(Claude) 기반 번호 추천
POST /api/sync               최신 회차 동기화 (관리용)
```

## 개발 환경 실행

```bash
# PostgreSQL (Docker)
docker run -d --name lotto-db \
  -e POSTGRES_DB=lotto -e POSTGRES_USER=lotto -e POSTGRES_PASSWORD=lotto \
  -p 5432:5432 postgres:16

# 백엔드
cd backend && ./mvnw spring-boot:run

# 프론트엔드
cd frontend && npm run dev
```

## 환경변수 (backend/.env)
```
ANTHROPIC_API_KEY=         # Claude API 키
DATABASE_URL=jdbc:postgresql://localhost:5432/lotto
```

## 커스텀 슬래시 커맨드 (.claude/commands/)

개발 중 반복 확인 작업을 단축하는 개발자 전용 커맨드.

| 커맨드 | 기능 |
|--------|------|
| `/seed-db` | 동행복권 API에서 전체 회차 DB 초기 적재 |
| `/check-api` | 동행복권 API 최신 회차 확인 & DB와 동기화 상태 비교 |
| `/gen-prompt` | LLM 추천 시 실제 전달되는 프롬프트 미리보기 |
| `/db-status` | DB 적재 현황 요약 (총 회차 수, 빠진 회차 등) |

## Claude Code 활용 패턴

### Subagent 사용 시나리오
- 전체 회차 통계 분석 (무거운 계산): `Agent(subagent_type="Explore")`
- 복잡한 SQL 쿼리 최적화: `Agent(subagent_type="general-purpose")`

### RAG 패턴
LLM 추천 시 아래 통계 데이터를 컨텍스트로 주입:
1. 최근 20회차 출현 번호 목록
2. 전체 번호별 출현 빈도
3. 최근 미출현 번호 (cold)
4. 최근 연속 출현 번호 (hot)

### 프롬프트 템플릿 위치
`backend/src/main/resources/prompts/` 에 `.st` (StringTemplate) 파일로 관리

## 테스트

```bash
# 백엔드 단위 테스트
cd backend && ./mvnw test

# 특정 테스트만
./mvnw test -Dtest=StatsServiceTest
```

## 코드 컨벤션

- Java: Google Java Style, 패키지 단위 도메인 분리
- React: TypeScript strict, ESLint + Prettier
- API: RESTful, 응답은 `{ data, meta }` 래퍼 사용
- 커밋: `feat:`, `fix:`, `docs:`, `test:` 접두사

## 참고 문서
- [아키텍처 전체 플랜](docs/ARCHITECTURE.md)
- [toss/apps-in-toss-ax](https://github.com/toss/apps-in-toss-ax) — TDS 디자인 가이드
- [동행복권 API (비공식)](https://github.com/roeniss/dhlottery-api)
