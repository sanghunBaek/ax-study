import { useState, useEffect, useMemo } from 'react';
import { Screen } from '../components/Screen';
import NumberBall from '../components/NumberBall';
import { MODES } from '../data/lotto';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  color: string;
  kind: number;
  dx: number;
}

function Confetti({ run }: { run: boolean }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    const colors = ['#0066FF', '#FBC400', '#FF7272', '#69C8F2', '#B0D840', '#FF9D4D', '#7C3AED'];
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
      kind: i % 3,
      dx: (Math.random() - 0.5) * 60,
    }));
  }, []);

  if (!run) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      <style>{`
        @keyframes ll-fall {
          0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--ll-dx), 110vh, 0) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: -20, left: `${p.left}%`,
            width: p.kind === 2 ? p.size * 0.4 : p.size,
            height: p.kind === 2 ? p.size * 1.6 : p.size,
            background: p.color,
            borderRadius: p.kind === 1 ? '50%' : p.kind === 2 ? 1 : 2,
            animation: `ll-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
            ['--ll-dx' as string]: `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  modeId: string;
  nums: number[];
  onSave: () => void;
  onAgain: () => void;
  onClose: () => void;
  justSaved: boolean;
}

export default function DoneScreen({ modeId, nums, onSave, onAgain, onClose, justSaved }: Props) {
  const mode = MODES[modeId];
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen bg="#FFFFFF">
      <style>{`
        @keyframes ll-pop {
          0% { transform: translateY(20px) scale(0.4); opacity: 0; }
          70% { transform: translateY(-2px) scale(1.06); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
      <Confetti run={showConfetti} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0,
        display: 'flex', alignItems: 'center', padding: '10px 14px', zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          all: 'unset', cursor: 'pointer', padding: 6, fontSize: 22, color: INK,
        }}>✕</button>
      </div>

      <div style={{ padding: '52px 22px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: BLUE, letterSpacing: '0.12em' }}>YOUR LUCKY 6</div>
        <div style={{
          marginTop: 6,
          fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 30,
          letterSpacing: '-0.025em', lineHeight: 1.15, color: INK,
        }}>
          오늘의 행운번호<br />
          <span style={{ color: BLUE }}>완성됐어요</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: SUB }}>
          <b style={{ color: INK }}>{mode.id}</b> 모드 · {mode.label} 기반으로 직접 고른 6개
        </div>
      </div>

      {/* Big balls */}
      <div style={{
        margin: '32px 22px 14px',
        padding: '28px 18px',
        background: 'linear-gradient(180deg, #F4F8FF 0%, #FFFFFF 100%)',
        border: '1px solid #DCE7FB', borderRadius: 24,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, justifyItems: 'center',
      }}>
        {nums.map((n, i) => (
          <div key={n} style={{ animation: `ll-pop 0.5s ${i * 0.08}s cubic-bezier(0.22, 1.2, 0.36, 1) both` }}>
            <NumberBall n={n} size={64} />
          </div>
        ))}
      </div>

      {/* Round info */}
      <div style={{ padding: '0 22px', fontSize: 13, color: SUB, textAlign: 'center', marginBottom: 22 }}>
        다음 추첨회차 <b style={{ color: INK }}>1119회</b> · 토요일 20:35
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onSave}
          disabled={justSaved}
          style={{
            all: 'unset', boxSizing: 'border-box', cursor: justSaved ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 52, borderRadius: 14,
            background: justSaved ? '#E5F0FF' : BLUE,
            color: justSaved ? BLUE : '#fff',
            fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 16,
            boxShadow: justSaved ? 'none' : '0 8px 18px rgba(0,102,255,0.25)',
            transition: 'all 200ms',
          }}
        >
          {justSaved ? '✓ 내 기록에 저장됐어요' : '내 기록에 저장하기'}
        </button>
        <button
          onClick={onAgain}
          style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 52, borderRadius: 14,
            background: '#F4F4F5', color: INK,
            fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 700, fontSize: 16,
          }}
        >
          다시 뽑기
        </button>
      </div>

      <div style={{ padding: '20px 22px 8px', fontSize: 11, color: '#A8A8AB', textAlign: 'center', lineHeight: 1.55 }}>
        ⓘ 로또는 매 회차 독립 시행이며 통계가 당첨을 보장하지 않아요.
      </div>
    </Screen>
  );
}
