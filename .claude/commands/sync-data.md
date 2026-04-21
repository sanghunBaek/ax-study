# /sync-data

동행복권 API에서 최신 로또 회차 데이터를 동기화합니다.

## 동작
1. DB에서 현재 최신 회차 번호 확인
2. 동행복권 API에서 다음 회차부터 순서대로 호출
3. `returnValue: "success"` 인 회차만 DB에 저장
4. 동기화 결과 요약 출력

## 실행 방법
백엔드 서버 실행 중일 때:
```bash
curl -X POST http://localhost:8080/api/sync
```

또는 Spring Scheduler가 자동으로 매주 일요일 오전 1시에 실행.

## 주의사항
- API 호출 간격 200ms 유지 (rate limit)
- 최대 10회차씩 배치 처리
