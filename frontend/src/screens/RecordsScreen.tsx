import { useState, useEffect } from 'react';
import { Screen, ScreenTitle } from '../components/Screen';
import NumberBall from '../components/NumberBall';
import { MODES, loadRecords, deleteRecord, fmtDate } from '../data/lotto';
import type { LottoRecord } from '../data/lotto';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';
const HAIR = '#E5E5E5';

interface Props {
  refreshKey: number;
}

export default function RecordsScreen({ refreshKey }: Props) {
  const [records, setRecords] = useState<LottoRecord[]>(loadRecords);

  useEffect(() => {
    setRecords(loadRecords());
  }, [refreshKey]);

  function remove(id: string) {
    deleteRecord(id);
    setRecords(loadRecords());
  }

  return (
    <Screen bg="#FAFAFB">
      <ScreenTitle
        kicker="내 기록"
        title="내가 뽑은 번호"
        sub={`총 ${records.length}건 · 이 기기에만 저장돼요`}
      />

      {records.length === 0 ? (
        <div style={{
          margin: '24px 22px', padding: '36px 18px',
          background: '#fff', border: `1px dashed ${HAIR}`, borderRadius: 18,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: '#EAF2FE',
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: BLUE, fontWeight: 800,
          }}>
            ★
          </div>
          <div style={{ fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 16, color: INK }}>
            아직 저장된 번호가 없어요
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: SUB, lineHeight: 1.55 }}>
            번호 뽑기에서 6개를 고르고 저장하면<br />여기에 모여요.
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {records.map((r) => {
            const m = MODES[r.mode];
            return (
              <div key={r.id} style={{
                background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 14,
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{
                      fontFamily: '"Wanted Sans Variable", system-ui', fontWeight: 800, fontSize: 13,
                      color: m ? m.accent : INK, letterSpacing: '0.06em',
                    }}>{r.mode}</div>
                    <div style={{ fontSize: 11, color: SUB }}>· {fmtDate(r.ts)}</div>
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      fontSize: 11, color: '#C2C4C8', fontWeight: 600, padding: 4,
                    }}
                  >
                    삭제
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {r.nums.map((n) => <NumberBall key={n} n={n} size={28} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
