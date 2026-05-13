import { Screen, ScreenTitle } from '../components/Screen';
import NumberBall from '../components/NumberBall';
import { MODES } from '../data/lotto';
import useLatestDraw from '../hooks/useLatestDraw';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';
const HAIR = '#E5E5E5';

interface Props {
  onPickMode: (modeId: string) => void;
}

function ModeIcon({ mode, accent }: { mode: string; accent: string }) {
  const common: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
  if (mode === 'HOT') {
    return (
      <div style={{ ...common, background: '#FFF1EE' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3c1.5 3 4 4 4 7a4 4 0 1 1-8 0c0-1.6.7-2.5 1.5-3.4C9.2 5 9.8 4 12 3z" stroke={accent} strokeWidth="1.8" strokeLinejoin="round" fill={accent} fillOpacity="0.18"/>
          <path d="M10 13c.6 1.4 2 1.8 2 3a2 2 0 1 1-4 0c0-.8.4-1.4 1-2 .6-.5.6-.7 1-1z" fill={accent}/>
        </svg>
      </div>
    );
  }
  if (mode === 'COLD') {
    return (
      <div style={{ ...common, background: '#EAF2FE' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 3v18M3 12h18M5.5 5.5l13 13M5.5 18.5l13-13"/>
        </svg>
      </div>
    );
  }
  return (
    <div style={{ ...common, background: '#F1ECFE' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="12" r="5" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.18"/>
        <circle cx="15" cy="12" r="5" stroke={accent} strokeWidth="1.8" fill={accent} fillOpacity="0.06"/>
      </svg>
    </div>
  );
}

export default function HomeScreen({ onPickMode }: Props) {
  const { data: latestDraw, loading, error, retry } = useLatestDraw();

  return (
    <Screen bg="#FAFAFB">
      <div style={{ padding: '12px 22px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, background: BLUE,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 14,
        }}>
          L
        </div>
        <div style={{ fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, letterSpacing: '-0.02em', fontSize: 17 }}>
          럭키드로우
        </div>
      </div>

      <ScreenTitle
        kicker="오늘의 행운번호"
        title={<span>긁어서 6개 번호를<br />직접 골라보세요</span>}
        sub="모드를 고르면 통계 기반으로 20개 번호풀이 만들어져요. 그중 6개를 긁고 직접 선택하세요."
      />

      {/* Latest draw mini-card */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{
          background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 18,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading && (
              <div style={{ fontSize: 12, color: SUB, padding: '8px 0' }}>
                불러오는 중...
              </div>
            )}
            {!loading && error && !latestDraw && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#FF4242' }}>불러올 수 없습니다</div>
                <button
                  onClick={retry}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: BLUE,
                    padding: '4px 10px', borderRadius: 8,
                    background: '#EAF2FE',
                  }}
                >
                  재시도
                </button>
              </div>
            )}
            {!loading && latestDraw && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: SUB, letterSpacing: '0.04em', marginBottom: 4 }}>
                  최근 당첨 · {latestDraw.round}회
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {latestDraw.nums.map((n) => <NumberBall key={n} n={n} size={26} />)}
                  <span style={{ color: '#C2C4C8', fontWeight: 800, margin: '0 2px' }}>+</span>
                  <NumberBall n={latestDraw.bonus} size={26} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mode cards */}
      <div style={{ padding: '6px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.values(MODES).map((m) => (
          <button
            key={m.id}
            onClick={() => onPickMode(m.id)}
            style={{
              all: 'unset', cursor: 'pointer',
              background: '#FFFFFF',
              border: `1px solid ${HAIR}`,
              borderRadius: 20,
              padding: '16px 16px 16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'transform 120ms ease, box-shadow 120ms ease',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.985)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <ModeIcon mode={m.id} accent={m.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800,
                fontSize: 17, letterSpacing: '-0.02em', color: INK,
              }}>
                {m.id} · {m.label}
              </div>
              <div style={{ fontSize: 12.5, color: SUB, marginTop: 2, lineHeight: 1.45 }}>{m.desc}</div>
            </div>
            <div style={{ color: '#C2C4C8', fontWeight: 700, fontSize: 18 }}>›</div>
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 22px 8px', fontSize: 11, color: '#A8A8AB', lineHeight: 1.55 }}>
        ⓘ 통계는 참고용이에요. 로또는 매 회차 독립 시행이며, 어떤 모드도 당첨을 보장하지 않아요.
      </div>
    </Screen>
  );
}
