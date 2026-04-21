# /db-status

DB 적재 현황을 요약해서 보여줍니다.

## 실행
`GET http://localhost:8080/api/draws/status` 를 호출하거나,
서버가 꺼져 있으면 직접 DB에 쿼리해서 아래 정보를 출력해줘.

## 출력 항목
- 총 적재 회차 수
- 가장 오래된 회차 / 가장 최근 회차
- 빠진 회차 번호 목록 (있으면)
- DB 용량 (lottery_draws 테이블 row 수)
