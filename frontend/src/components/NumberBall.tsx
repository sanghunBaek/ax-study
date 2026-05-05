import { ballColor } from '../data/lotto';

interface Props {
  n: number;
  size?: number;
  dim?: boolean;
  selected?: boolean;
}

export default function NumberBall({ n, size = 44, dim, selected }: Props) {
  const c = ballColor(n);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c.bg,
        color: c.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Wanted Sans Variable", system-ui',
        fontWeight: 800,
        fontSize: Math.round(size * 0.42),
        letterSpacing: '-0.02em',
        flexShrink: 0,
        opacity: dim ? 0.32 : 1,
        boxShadow: selected
          ? '0 0 0 3px #fff, 0 0 0 5px #0066FF, 0 6px 16px rgba(0,102,255,0.35)'
          : 'inset 0 -3px 0 rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.18)',
        transition: 'opacity 160ms, box-shadow 200ms, transform 200ms',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {n}
    </div>
  );
}
