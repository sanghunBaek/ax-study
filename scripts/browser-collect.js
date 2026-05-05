// ============================================================
// 브라우저 콘솔에서 실행하는 로또 데이터 수집 스크립트
// ============================================================
// 사용법:
// 1. 크롬에서 https://www.dhlottery.co.kr 접속
// 2. F12 → Console 탭 열기
// 3. 아래 코드 전체를 복사하여 콘솔에 붙여넣기 → Enter
// 4. 수집 완료되면 자동으로 JSON 파일 다운로드됨
// 5. 다운로드된 파일을 scripts/ 폴더에 넣기
// ============================================================

(async function collectLottoData() {
  const DELAY = 250;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const API = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

  async function fetchDraw(drwNo) {
    const res = await fetch(API + drwNo);
    const text = await res.text();
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const data = JSON.parse(match[0]);
      return data.returnValue === 'success' ? data : null;
    } catch {
      return null;
    }
  }

  // 1) 최신 회차 찾기 (binary search)
  console.log('최신 회차 탐색 중...');
  let lo = 1, hi = 2000;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const data = await fetchDraw(mid);
    if (data) lo = mid;
    else hi = mid - 1;
    await sleep(DELAY);
  }
  const latest = lo;
  console.log(`최신 회차: ${latest}`);

  // 2) 전체 회차 수집
  const results = [];
  for (let i = 1; i <= latest; i++) {
    try {
      const data = await fetchDraw(i);
      if (data) {
        results.push({
          drw_no: data.drwNo,
          drw_date: data.drwNoDate,
          num1: data.drwtNo1,
          num2: data.drwtNo2,
          num3: data.drwtNo3,
          num4: data.drwtNo4,
          num5: data.drwtNo5,
          num6: data.drwtNo6,
          bonus: data.bnusNo,
          prize_1st: data.firstWinamnt,
          total_sales: data.totSellamnt,
        });
      } else {
        console.warn(`회차 ${i}: 데이터 없음 (스킵)`);
      }
    } catch (e) {
      console.warn(`회차 ${i} 실패:`, e.message);
    }

    if (i % 50 === 0) {
      console.log(`${i}/${latest} 수집 완료 (${results.length}건)`);
    }
    await sleep(DELAY);
  }

  console.log(`총 ${results.length}건 수집 완료!`);

  // 3) JSON 파일 다운로드
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lotto-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('lotto-data.json 다운로드 완료! scripts/ 폴더에 넣어주세요.');
})();
