import type { CSSProperties, ReactNode } from 'react';

const INK = '#171719';

interface ScreenProps {
  children: ReactNode;
  bg?: string;
  pad?: boolean;
}

export function Screen({ children, bg = '#FFFFFF', pad = true }: ScreenProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        padding: pad ? '20px 0 86px' : '0',
        overflow: 'auto',
        fontFamily: '"Pretendard JP", system-ui',
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

interface ScreenTitleProps {
  kicker?: string;
  title: ReactNode;
  sub?: string;
  style?: CSSProperties;
}

export function ScreenTitle({ kicker, title, sub, style }: ScreenTitleProps) {
  return (
    <div style={{ padding: '12px 22px 18px', ...style }}>
      {kicker && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#0066FF',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          fontFamily: '"Wanted Sans Variable", system-ui',
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: '-0.025em',
          lineHeight: 1.2,
          color: INK,
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 13, color: '#6A6B6F', lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
