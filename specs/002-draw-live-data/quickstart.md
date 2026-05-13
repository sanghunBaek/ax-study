# Quickstart: 뽑기 탭 실시간 데이터 연동

## 사전 요구사항

- Node.js 18+
- `frontend/.env`에 Supabase 환경변수 설정 완료
- Supabase에 `get_hot_numbers`, `get_cold_numbers` RPC 함수 등록 완료
- `lottery_draws` 테이블에 100회차 이상 데이터 적재 완료

## 개발 서버 실행

```bash
cd frontend && npm install && npm run dev
```

## 변경 파일 목록

### 신규 파일
| 파일 | 역할 |
|------|------|
| `src/lib/drawService.ts` | 최근 당첨 조회 + 번호풀 RPC 호출 + localStorage 캐시 |
| `src/hooks/useLatestDraw.ts` | 최근 당첨 정보 훅 (로딩/에러/데이터) |
| `src/hooks/useNumberPool.ts` | 모드별 번호풀 훅 (로딩/에러/데이터) |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/data/lotto.ts` | `FREQ_100`, `POOL_*`, `LATEST_DRAW` 제거. `MODES`에서 `pool` 필드 제거 |
| `src/screens/HomeScreen.tsx` | `LATEST_DRAW` 상수 → `useLatestDraw` 훅으로 교체 |
| `src/screens/ScratchScreen.tsx` | `MODES[modeId].pool` → `pool` prop으로 교체 |
| `src/App.tsx` | 모드 선택 시 번호풀 로딩 로직 추가, ScratchScreen에 pool 전달 |

## 검증 방법

1. 뽑기 탭 진입 → 최근 당첨 카드에 실제 최신 회차 데이터 표시 확인
2. HOT/COLD/MIX 모드 선택 → 스크래치 카드에 20개 번호 표시 확인
3. 네트워크 차단 후 앱 재진입 → 캐시된 데이터로 폴백 확인
4. 스크래치 → 6개 선택 → 완료 플로우 정상 동작 확인
