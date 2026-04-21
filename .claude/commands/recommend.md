# /recommend

로또 번호를 추천합니다. 통계 기반 또는 LLM 기반 선택 가능.

## 사용법
```
/recommend [type=balanced] [query="자연어 요청"]
```

### type 옵션
- `hot` — 최근 자주 나온 번호 위주
- `cold` — 오래 안 나온 번호 위주
- `balanced` — hot 3개 + cold 3개 혼합 (기본값)
- `frequency` — 역대 출현 빈도 기반
- `llm` — Claude에게 자연어로 요청

### 예시
```
/recommend type=hot
/recommend type=llm query="최근 10회차에서 한 번도 안 나온 번호로만 구성해줘"
/recommend type=llm query="소수(prime number)로만 구성된 번호 추천해줘"
```

## 구현
- `type=llm`이 아니면: `GET /api/recommend/stats?type=$type` 호출
- `type=llm`이면: `POST /api/recommend/llm` body: `{"query": "$query"}` 호출
- 결과 번호 6개를 보기 좋게 출력하고 추천 이유도 같이 설명해줘.
