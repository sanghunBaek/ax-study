import { useState } from 'react';
import { Screen, ScreenTitle } from '../components/Screen';
import NumberBall from '../components/NumberBall';
import { FREQ_50, FREQ_100, FREQ_ALL, PAST_DRAWS, ballColor } from '../data/lotto';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';
const HAIR = '#E5E5E5';

export default function StatsScreen() {
  const [range, setRange] = useState<'50' | '100' | 'all'>('100');
  const data = range === '50' ? FREQ_50 : range === 'all' ? FREQ_ALL : FREQ_100;
  const max = Math.max(...data.map((d) => d.count));
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const hot6 = new Set(sorted.slice(0, 6).map((d) => d.n));
  const cold6 = new Set(sorted.slice(-6).map((d) => d.n));

  return (
    <Screen bg="#FFFFFF">
      <ScreenTitle kicker="통계" title="번호별 출현 빈도" sub="자주 나온 번호와 적게 나온 번호를 한 눈에 확인해보세요." />

      {/* Range tabs */}
      <div style={{ padding: '0 22px 14px', display: 'flex', gap: 6 }}>
        {([['50', '최근 50회'], ['100', '최근 100회'], ['all', '전체']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '7px 12px', borderRadius: 999,
              background: range === k ? INK : '#F4F4F5',
              color: range === k ? '#fff' : SUB,
              fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 700, fontSize: 12.5,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* HOT/COLD callouts */}
      <div style={{ padding: '0 22px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: 12, background: '#FFF1EE', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#FF4242', letterSpacing: '0.06em', marginBottom: 8 }}>
            HOT 자주나온
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[...hot6].sort((a, b) => a - b).map((n) => <NumberBall key={n} n={n} size={26} />)}
          </div>
        </div>
        <div style={{ padding: 12, background: '#EAF2FE', borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: BLUE, letterSpacing: '0.06em', marginBottom: 8 }}>
            COLD 적게나온
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[...cold6].sort((a, b) => a - b).map((n) => <NumberBall key={n} n={n} size={26} />)}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 18,
          padding: '14px 12px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6, alignItems: 'end' }}>
            {data.map(({ n, count }) => {
              const c = ballColor(n);
              const isHot = hot6.has(n), isCold = cold6.has(n);
              const h = Math.max(8, Math.round((count / max) * 60));
              return (
                <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', height: h, borderRadius: 4,
                    background: isHot ? '#FF4242' : isCold ? BLUE : c.bg,
                    opacity: isHot || isCold ? 1 : 0.6,
                  }} />
                  <div style={{
                    fontSize: 9, fontWeight: 700,
                    color: isHot ? '#FF4242' : isCold ? BLUE : SUB,
                  }}>{n}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Past draws */}
      <div style={{ padding: '0 22px 6px', fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 16, color: INK }}>
        역대 회차
      </div>
      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PAST_DRAWS.map((d) => (
          <div key={d.round} style={{
            background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 14,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 14, color: INK }}>
                {d.round}회
              </div>
              <div style={{ fontSize: 11, color: SUB }}>{d.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              {d.nums.map((n) => <NumberBall key={n} n={n} size={26} />)}
              <span style={{ color: '#C2C4C8', fontWeight: 800, margin: '0 2px' }}>+</span>
              <NumberBall n={d.bonus} size={26} />
            </div>
            <div style={{ fontSize: 11, color: SUB, marginTop: 8 }}>
              1등 {(d.prize / 100000000).toFixed(1)}억 · 1인당
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
