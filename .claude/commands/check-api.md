# /check-api

동행복권 API의 현재 최신 회차 번호를 확인합니다.

## 실행
동행복권 API를 최신 회차부터 역방향으로 탐색해서 실제 데이터가 있는 가장 최근 회차를 찾아줘.

```
GET https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}
returnValue가 "success"인 가장 큰 drwNo가 현재 최신 회차
```

DB의 최신 회차와 비교해서 동기화가 필요한지도 알려줘.
