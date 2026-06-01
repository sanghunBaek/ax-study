import type { WinningRank } from '../lib/winningService';

interface Props {
  rank: WinningRank;
}

const BADGE_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  '1': { bg: '#FFD700', fg: '#7A5C00', label: '1등' },
  '2': { bg: '#C0C0C0', fg: '#4A4A4A', label: '2등' },
  '3': { bg: '#CD7F32', fg: '#FFFFFF', label: '3등' },
  '4': { bg: '#0066FF', fg: '#FFFFFF', label: '4등' },
  '5': { bg: '#EAF2FE', fg: '#0066FF', label: '5등' },
  miss: { bg: '#FFF0E6', fg: '#C95A00', label: '낙첨' },
  pending: { bg: '#F2F3F5', fg: '#C2C4C8', label: '미발표' },
};

export default function WinningBadge({ rank }: Props) {
  const style = BADGE_STYLES[String(rank)] ?? BADGE_STYLES.pending;

  return (
    <span
      style={{
        display: 'inline-block',
        background: style.bg,
        color: style.fg,
        fontFamily: '"Wanted Sans Variable", system-ui',
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 10,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}
    >
      {style.label}
    </span>
  );
}
