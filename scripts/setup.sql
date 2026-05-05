-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS lottery_draws (
  drw_no      INTEGER PRIMARY KEY,
  drw_date    DATE NOT NULL,
  num1        INTEGER NOT NULL,
  num2        INTEGER NOT NULL,
  num3        INTEGER NOT NULL,
  num4        INTEGER NOT NULL,
  num5        INTEGER NOT NULL,
  num6        INTEGER NOT NULL,
  bonus       INTEGER NOT NULL,
  prize_1st   BIGINT,
  total_sales BIGINT,
  created_at  TIMESTAMP DEFAULT now()
);

-- 2. RPC: HOT 번호 (최근 N회차 출현 횟수 상위 20개)
CREATE OR REPLACE FUNCTION get_hot_numbers(range_count int)
RETURNS TABLE(num int, cnt bigint) AS $$
  SELECT unnest(ARRAY[num1,num2,num3,num4,num5,num6]) AS num, COUNT(*) AS cnt
  FROM (SELECT * FROM lottery_draws ORDER BY drw_no DESC LIMIT range_count) t
  GROUP BY num
  ORDER BY cnt DESC
  LIMIT 20;
$$ LANGUAGE sql;

-- 3. RPC: COLD 번호 (최근 N회차 출현 횟수 하위 20개)
CREATE OR REPLACE FUNCTION get_cold_numbers(range_count int)
RETURNS TABLE(num int, cnt bigint) AS $$
  SELECT unnest(ARRAY[num1,num2,num3,num4,num5,num6]) AS num, COUNT(*) AS cnt
  FROM (SELECT * FROM lottery_draws ORDER BY drw_no DESC LIMIT range_count) t
  GROUP BY num
  ORDER BY cnt ASC
  LIMIT 20;
$$ LANGUAGE sql;

-- 4. RPC: 전체 번호별 출현 빈도 (통계 화면)
CREATE OR REPLACE FUNCTION get_frequency()
RETURNS TABLE(num int, cnt bigint) AS $$
  SELECT unnest(ARRAY[num1,num2,num3,num4,num5,num6]) AS num, COUNT(*) AS cnt
  FROM lottery_draws
  GROUP BY num
  ORDER BY num ASC;
$$ LANGUAGE sql;
