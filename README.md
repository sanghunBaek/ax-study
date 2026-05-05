# 로또 추천 앱 (ax-study)

Claude Code를 활용한 로또 번호 추천 앱 학습 프로젝트.

---

## 프로젝트 구조

```
ax-study/
├── frontend/         React 18 + Vite 7 + TypeScript + PWA
├── scripts/          Node.js 데이터 수집 스크립트
├── docs/             아키텍처, PRD 문서
└── .claude/          커스텀 슬래시 커맨드
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + Vite 7 + TypeScript |
| UI | Toss Design System (`@toss/tds`) |
| DB / API | Supabase (PostgreSQL + REST API 자동 생성) |
| PWA | `vite-plugin-pwa` + Workbox |
| 호스팅 | Vercel |
| 데이터 수집 | Node.js 스크립트 (동행복권 비공식 API) |

---

## 초기 세팅 방법

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 가입 (GitHub 계정 권장)
2. New project 생성
   - 리전: `Northeast Asia (Seoul)` 선택
   - DB 비밀번호 설정 후 저장
3. Settings → API 메뉴에서 키 복사:
   - `Project URL` → `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY` (**절대 공개 금지**)

### 2. 테이블 및 RPC 함수 생성

Supabase 대시보드 → **SQL Editor** → New query → `scripts/setup.sql` 내용 붙여넣고 **Run**.

> 테이블 생성 후 "Run and enable RLS" 버튼은 **누르지 말 것**.
> 이 앱은 로그인 없이 누구나 데이터를 읽어야 하므로 RLS 비활성 상태로 둬야 함.

`setup.sql`이 생성하는 것:
- `lottery_draws` 테이블
- `get_hot_numbers(range_count int)` RPC
- `get_cold_numbers(range_count int)` RPC
- `get_frequency()` RPC

### 3. 환경변수 설정

```bash
# frontend/.env
cp frontend/.env.example frontend/.env
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력

# scripts/.env
cp scripts/.env.example scripts/.env
# SUPABASE_URL, SUPABASE_SERVICE_KEY 입력
```

### 4. 전체 회차 초기 적재

```bash
cd scripts
node seed.js
```

- 동행복권 API에서 1회 ~ 최신 회차 전체 수집
- API 호출 간격 200ms 유지 (rate limit 대응)
- 배치 100개 단위로 Supabase에 upsert
- 약 5~10분 소요 (1,100~1,200회차 기준)
- 완료 후 Supabase Table Editor에서 행 수 확인

---

## 개발 환경 실행

```bash
cd frontend
npm install    # 패키지 설치 (아래 설명 참고)
npm run dev    # 개발 서버 시작 → http://localhost:5173
```

### `npm install`은 언제 해야 하나?

Node.js 프로젝트는 `package.json`에 선언된 외부 라이브러리(패키지)를 `node_modules/` 폴더에 다운로드해서 사용한다.
`npm install`은 이 다운로드를 수행하는 명령어다.

**`npm install`이 필요한 경우:**

| 상황 | 이유 |
|------|------|
| 프로젝트를 처음 clone 했을 때 | `node_modules/`는 `.gitignore`에 포함되어 있어서 git에 없음 |
| `package.json`이 변경됐을 때 | 새 패키지 추가/삭제/버전 변경 시 반영 필요 |
| `node_modules/`를 직접 삭제했을 때 | 다시 받아야 하니까 |
| 다른 브랜치로 전환 후 패키지가 달라졌을 때 | 브랜치마다 의존성이 다를 수 있음 |

**`npm install` 안 해도 되는 경우:**

| 상황 | 이유 |
|------|------|
| 소스코드(.tsx, .ts)만 수정했을 때 | 패키지에는 변화 없음 |
| 이미 한번 install 하고 코드만 작업 중일 때 | `node_modules/`가 이미 있으니까 |
| `npm run dev`로 서버 껐다 켰을 때 | 재설치 불필요, 바로 `npm run dev`만 하면 됨 |

**요약: 한번 `npm install` 하면, `package.json`이 바뀌지 않는 한 다시 할 필요 없다.**
평소에는 `npm run dev`만 실행하면 된다.

### 자주 쓰는 npm 명령어 정리

```bash
npm install              # package.json 기반으로 전체 패키지 설치
npm install <패키지명>    # 새 패키지 추가 (package.json에 자동 추가됨)
npm run dev              # 개발 서버 실행
npm run build            # 프로덕션 빌드
npm run lint             # 코드 스타일 검사
```

---

## 데이터 모델

```sql
lottery_draws (
  drw_no      INTEGER PRIMARY KEY,  -- 회차 번호
  drw_date    DATE,                 -- 추첨일
  num1~num6   INTEGER,              -- 당첨 번호 (오름차순)
  bonus       INTEGER,              -- 보너스 번호
  prize_1st   BIGINT,               -- 1등 당첨금
  total_sales BIGINT,               -- 총 판매액
  created_at  TIMESTAMP
)
```

## 저장 위치 전략

| 데이터 | 저장 위치 | 이유 |
|--------|----------|------|
| 회차 데이터 | Supabase | 영구 보존 필요 |
| 내 기록 (번호 선택 이력) | localStorage | 개인 데이터, 재선택 가능 |
| UI 설정값 | localStorage | 날아가도 괜찮은 설정 |

---

## Supabase RPC 호출 패턴

```js
// HOT 번호 (최근 N회차 출현 상위 20개)
supabase.rpc('get_hot_numbers', { range_count: 100 })

// COLD 번호 (최근 N회차 출현 하위 20개)
supabase.rpc('get_cold_numbers', { range_count: 100 })

// MIX: 프론트에서 HOT 10개 + COLD 10개 조합
// ALL: RPC 불필요, 프론트에서 1~45 배열 생성

// 통계 화면 전용
supabase.rpc('get_frequency')
```

---

## 커스텀 슬래시 커맨드

Claude Code에서 사용 가능한 개발자 전용 커맨드.

| 커맨드 | 기능 |
|--------|------|
| `/seed-db` | 동행복권 API → Supabase 전체 회차 초기 적재 |
| `/check-api` | 동행복권 API 최신 회차 확인 & DB 동기화 상태 비교 |
| `/db-status` | Supabase 적재 현황 요약 (총 회차 수, 빠진 회차 등) |

---

## 참고 문서

- [아키텍처 전체 플랜](docs/ARCHITECTURE.md)
- [PRD](docs/PRD.md)
- [동행복권 API (비공식)](https://github.com/roeniss/dhlottery-api)
