# Quickstart: 내 기록 당첨 여부 표기

## 개발 환경 실행

```bash
cd frontend && npm install && npm run dev
```

## 핵심 구현 파일

| 파일 | 역할 |
|------|------|
| `lib/winningService.ts` | 회차 매핑 + 등수 판정 순수 함수 |
| `hooks/useWinningResults.ts` | 기록 목록의 당첨 결과 일괄 조회 hook |
| `components/WinningBadge.tsx` | 등수별 색상 뱃지 컴포넌트 |
| `screens/RecordsScreen.tsx` | 뱃지 + 회차 표시 통합 (기존 파일 수정) |

## 구현 순서

1. `winningService.ts` — 순수 로직 (테스트 가능)
2. `useWinningResults.ts` — Supabase 조회 + 판정 결과 반환
3. `WinningBadge.tsx` — UI 컴포넌트
4. `RecordsScreen.tsx` — 통합

## 테스트

```bash
cd frontend && npm run test
```

## 데이터 동기화

최신 회차 데이터가 필요하면:

```bash
cd scripts && node seed-from-github.js
```
