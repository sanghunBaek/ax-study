# Research: 뽑기 탭 실시간 데이터 연동

## 1. Supabase RPC 함수 현황

### Decision
기존 `get_hot_numbers`, `get_cold_numbers` RPC 함수를 그대로 사용한다.

### Rationale
- 통계 화면 작업(001-stats-live-data)에서 이미 Supabase에 등록 완료
- `get_hot_numbers(range_count)` → `TABLE(num int, cnt bigint)` 반환, 출현 횟수 내림차순 정렬
- `get_cold_numbers(range_count)` → `TABLE(num int, cnt bigint)` 반환, 출현 횟수 오름차순 정렬
- 20개 제한은 프론트에서 `.slice(0, 20)`으로 처리 (RPC는 45개 전체 반환)

### Alternatives Considered
- RPC에 LIMIT 20을 추가하는 방안 → 불필요 (네트워크 페이로드 차이 미미, 프론트 유연성 유지)

## 2. 최근 당첨 정보 조회 방식

### Decision
기존 `statsService.ts`의 `fetchRecentDraws(limit)` 함수를 재사용한다. `limit=1`로 호출하여 최신 1건만 조회.

### Rationale
- 이미 `lottery_draws` 테이블에서 `drw_no DESC` 정렬 + limit 조회하는 함수가 존재
- 별도 RPC 불필요, REST API 조회로 충분
- `DrawResult` 타입도 이미 정의되어 있음

### Alternatives Considered
- 별도 `fetchLatestDraw()` 함수 신규 작성 → 불필요 (기존 함수로 충분)
- Supabase Realtime 구독 → 과도한 복잡도, 주 1회 갱신 데이터에 부적합

## 3. localStorage 캐시 전략

### Decision
캐시 키를 분리하여 최근 당첨 정보와 번호풀을 각각 캐시한다.

### Rationale
- 최근 당첨 정보: `luckyLotto.cache.latestDraw` 키에 JSON 저장
- 번호풀: `luckyLotto.cache.pool.{mode}` 키에 JSON 저장 (mode = HOT/COLD/MIX)
- 조회 성공 시 캐시 갱신, 실패 시 캐시에서 폴백
- 캐시 만료 정책 없음 (데이터가 주 1회 갱신이므로, 항상 최신 시도 후 폴백만 제공)

### Alternatives Considered
- 단일 캐시 키에 모든 데이터 저장 → 모드별 독립 갱신이 어려워짐
- IndexedDB 사용 → 이 규모에서 과도한 복잡도

## 4. 로딩/에러 UX 패턴

### Decision
기존 StatsScreen의 로딩/에러 패턴을 동일하게 적용한다.

### Rationale
- 로딩: "데이터를 불러오는 중..." 텍스트 표시 (스켈레톤 UI는 YAGNI)
- 에러: 에러 메시지 + 재시도 버튼 표시
- HomeScreen 최근 당첨 카드: 로딩 시 카드 영역에 "로딩 중" 표시, 에러 시 "불러올 수 없습니다" + 재시도
- 모드 선택 후 번호풀 로딩: App.tsx에서 로딩 상태 관리, 로딩 중에는 ScratchScreen 미진입

### Alternatives Considered
- 스켈레톤 UI → 학습 프로젝트에 과도, YAGNI 원칙 위반
- 모달 로딩 → 기존 패턴과 불일치

## 5. MODES 구조 변경

### Decision
`lotto.ts`에서 `MODES` 객체의 `pool` 필드를 제거하고, 번호풀은 서비스 레이어에서 동적으로 조회한다.

### Rationale
- 현재 `MODES[modeId].pool`로 하드코딩된 번호풀을 사용 중
- 변경 후: `MODES`는 모드 메타데이터(id, label, desc, accent)만 보유
- 번호풀은 `drawService.ts`의 `fetchNumberPool(mode)` 함수가 담당
- ScratchScreen은 `pool` prop으로 번호풀을 직접 받음

### Alternatives Considered
- MODES에 pool을 유지하고 동적으로 갱신 → 전역 상태 변이, 리렌더링 복잡도 증가
