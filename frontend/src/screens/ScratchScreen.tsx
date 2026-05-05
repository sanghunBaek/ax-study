import { useState, useRef, useEffect } from 'react';
import { Screen } from '../components/Screen';
import NumberBall from '../components/NumberBall';
import { MODES, ballColor } from '../data/lotto';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';
const HAIR = '#E5E5E5';
const TILE = 70;

interface TileProps {
  n: number;
  size: number;
  revealed: boolean;
  selected: boolean;
  disabled: boolean;
  onReveal: () => void;
  onToggleSelect: () => void;
}

function ScratchTile({ n, size, revealed, selected, disabled, onReveal, onToggleSelect }: TileProps) {
  const c = ballColor(n);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localRevealedRef = useRef(revealed);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { localRevealedRef.current = revealed; }, [revealed]);

  useEffect(() => {
    if (revealed) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);
    paintFoil(ctx, size, size);
  }, [size, revealed]);

  function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#D7DBE0');
    g.addColorStop(0.45, '#F1F2F4');
    g.addColorStop(0.55, '#C8CCD1');
    g.addColorStop(1, '#E6E8EB');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let y = 4; y < h; y += 7) {
      for (let x = 4; x < w; x += 7) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = 'rgba(50,55,65,0.55)';
    ctx.font = `800 ${Math.round(w * 0.42)}px "Wanted Sans Variable", system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', w / 2, h / 2 + 1);
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const t = 'touches' in e ? e.touches[0] : e;
    return {
      x: ((t.clientX - rect.left) / rect.width) * size,
      y: ((t.clientY - rect.top) / rect.height) * size,
    };
  }

  function eraseAt(p: { x: number; y: number }) {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function checkProgress() {
    const cv = canvasRef.current;
    if (!cv) return 0;
    const ctx = cv.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let cleared = 0, total = 0;
    const step = 6 * dpr;
    for (let y = 0; y < cv.height; y += step) {
      for (let x = 0; x < cv.width; x += step) {
        const i = (y * cv.width + x) * 4 + 3;
        if (data[i] < 64) cleared++;
        total++;
      }
    }
    return total ? cleared / total : 0;
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    if (revealed || disabled) return;
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = getPos(e);
    eraseAt(lastRef.current);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current || revealed) return;
    e.preventDefault();
    const p = getPos(e);
    const last = lastRef.current!;
    const dx = p.x - last.x, dy = p.y - last.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 4));
    for (let i = 1; i <= steps; i++) {
      eraseAt({ x: last.x + (dx * i) / steps, y: last.y + (dy * i) / steps });
    }
    lastRef.current = p;
    if (checkProgress() > 0.45 && !localRevealedRef.current) {
      localRevealedRef.current = true;
      onReveal();
    }
  }

  function end() { drawingRef.current = false; lastRef.current = null; }

  return (
    <div
      onClick={() => { if (revealed && !disabled) onToggleSelect(); }}
      style={{
        position: 'relative', width: size, height: size,
        borderRadius: 18, overflow: 'hidden',
        background: '#fff',
        boxShadow: selected
          ? '0 0 0 3px #fff, 0 0 0 5px #0066FF, 0 8px 18px rgba(0,102,255,0.32)'
          : '0 1px 2px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.04)',
        transition: 'box-shadow 200ms, transform 180ms',
        transform: selected ? 'scale(0.97)' : 'scale(1)',
        cursor: revealed ? (disabled ? 'default' : 'pointer') : 'grab',
        userSelect: 'none', touchAction: 'none',
        opacity: disabled && !revealed ? 0.55 : 1,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: c.bg, color: c.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Wanted Sans Variable", system-ui',
        fontWeight: 800, fontSize: Math.round(size * 0.46), letterSpacing: '-0.02em',
        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.12)',
      }}>
        {n}
      </div>

      {!revealed && (
        <canvas
          ref={canvasRef}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}

      {selected && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          width: 18, height: 18, borderRadius: 9, background: '#0066FF', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 10,
          boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
        }}>✓</div>
      )}
    </div>
  );
}

interface Props {
  modeId: string;
  onCancel: () => void;
  onComplete: (modeId: string, nums: number[]) => void;
}

export default function ScratchScreen({ modeId, onCancel, onComplete }: Props) {
  const mode = MODES[modeId];

  const [pool] = useState<number[]>(() => {
    const arr = [...mode.pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [selected, setSelected] = useState<number[]>([]);

  function reveal(n: number) {
    setRevealed((prev) => {
      if (prev.has(n)) return prev;
      return new Set([...prev, n]);
    });
  }

  function toggle(n: number) {
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 6) return prev;
      return [...prev, n];
    });
  }

  const full = selected.length === 6;

  return (
    <Screen bg="#FAFAFB">
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: '#FAFAFB', zIndex: 10,
      }}>
        <button onClick={onCancel} style={{
          all: 'unset', cursor: 'pointer',
          width: 32, height: 32, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: INK, fontSize: 22, fontWeight: 600,
        }}>‹</button>
        <div style={{ flex: 1, fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
          {mode.id} · {mode.label}
        </div>
        <div style={{ fontSize: 12, color: SUB, fontWeight: 600 }}>
          긁힘 {revealed.size}/20
        </div>
      </div>

      <div style={{ height: 56 }} />

      {/* Selection tray */}
      <div style={{
        margin: '0 16px 14px', padding: '14px 14px 12px',
        background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 18,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 14, color: INK }}>
            내 선택
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: full ? BLUE : SUB, whiteSpace: 'nowrap' }}>
            {selected.length} / 6
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const n = selected[i];
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 999,
                border: n ? 'none' : `2px dashed ${HAIR}`,
                background: n ? 'transparent' : '#FAFAFB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {n && <NumberBall n={n} size={36} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 22px 10px', fontSize: 12, color: SUB, lineHeight: 1.5 }}>
        은빛 카드를 손가락으로 긁으면 번호가 드러나요. 마음에 드는 6개를 탭해서 선택하세요.
      </div>

      {/* Grid 4x5 = 20 */}
      <div style={{
        margin: '0 16px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        {pool.map((n) => (
          <ScratchTile
            key={n}
            n={n}
            size={TILE}
            revealed={revealed.has(n)}
            selected={selected.includes(n)}
            disabled={!selected.includes(n) && full}
            onReveal={() => reveal(n)}
            onToggleSelect={() => toggle(n)}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 78,
        padding: '10px 16px',
        background: 'linear-gradient(to top, rgba(250,250,251,1) 60%, rgba(250,250,251,0))',
      }}>
        <button
          disabled={!full}
          onClick={() => onComplete(modeId, [...selected].sort((a, b) => a - b))}
          style={{
            all: 'unset', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: 52, borderRadius: 14,
            background: full ? BLUE : '#E5E7EB',
            color: full ? '#fff' : '#A8A8AB',
            fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 16,
            letterSpacing: '-0.01em',
            cursor: full ? 'pointer' : 'default',
            transition: 'background 200ms',
            boxShadow: full ? '0 8px 18px rgba(0,102,255,0.25)' : 'none',
          }}
        >
          {full ? '6개 선택 완료 ›' : `${6 - selected.length}개 더 선택해주세요`}
        </button>
      </div>
    </Screen>
  );
}
