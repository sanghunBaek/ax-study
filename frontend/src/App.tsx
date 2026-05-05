import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import ScratchScreen from './screens/ScratchScreen';
import DoneScreen from './screens/DoneScreen';
import StatsScreen from './screens/StatsScreen';
import RecordsScreen from './screens/RecordsScreen';
import { saveRecord } from './data/lotto';

const BLUE = '#0066FF';
const INK = '#171719';
const SUB = '#6A6B6F';

type Tab = 'draw' | 'stats' | 'records';
type DrawStep = 'home' | 'scratch' | 'done';

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 390, height: 760, borderRadius: 48,
      background: '#000', padding: 8, boxSizing: 'border-box',
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      position: 'relative',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 40,
        overflow: 'hidden', position: 'relative', background: '#fff',
      }}>
        {/* Status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', zIndex: 200,
          fontFamily: '-apple-system, system-ui',
          fontSize: 15, fontWeight: 600, color: INK,
        }}>
          <span>9:41</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 16, height: 10, border: `1px solid ${INK}`, borderRadius: 2, position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 1, background: INK, borderRadius: 1 }} />
            </span>
          </span>
        </div>
        {children}
        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 999,
          background: 'rgba(0,0,0,0.3)', zIndex: 250, pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

function TabIconDraw({ active }: { active: boolean }) {
  const c = active ? BLUE : '#A8A8AB';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="3" stroke={c} strokeWidth="1.7" fill={active ? BLUE : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M8 12h8M12 9l3 3-3 3" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TabIconStats({ active }: { active: boolean }) {
  const c = active ? BLUE : '#A8A8AB';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 19V11M12 19V5M19 19v-6" stroke={c} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
function TabIconRecords({ active }: { active: boolean }) {
  const c = active ? BLUE : '#A8A8AB';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.39 5.16 5.61.5-4.27 3.7L17 18l-5-3-5 3 1.27-5.64L4 8.66l5.61-.5L12 3z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" fill={active ? BLUE : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}

const TAB_ICONS = {
  draw: TabIconDraw,
  stats: TabIconStats,
  records: TabIconRecords,
};
const TAB_LABELS: Record<Tab, string> = { draw: '뽑기', stats: '통계', records: '내기록' };

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 78, paddingBottom: 18,
      background: 'rgba(255,255,255,0.96)',
      borderTop: '1px solid #EFEFEF',
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      backdropFilter: 'blur(12px)',
      zIndex: 150,
    }}>
      {(['draw', 'stats', 'records'] as Tab[]).map((id) => {
        const active = tab === id;
        const Icon = TAB_ICONS[id];
        return (
          <button key={id} onClick={() => onTab(id)} style={{
            all: 'unset', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, color: active ? BLUE : '#A8A8AB',
            fontFamily: '"Wanted Sans Variable", system-ui',
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em',
            transition: 'color 160ms',
          }}>
            <Icon active={active} />
            {TAB_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(23,23,25,0.92)', color: '#fff',
      padding: '10px 18px', borderRadius: 14,
      fontFamily: '"Wanted Sans Variable", system-ui', fontSize: 13, fontWeight: 700,
      letterSpacing: '-0.01em',
      boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
      zIndex: 300, animation: 'll-toast 0.25s ease-out',
      whiteSpace: 'nowrap',
    }}>
      <style>{`@keyframes ll-toast { from { transform: translate(-50%, 8px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
      {msg}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('draw');
  const [drawStep, setDrawStep] = useState<DrawStep>('home');
  const [mode, setMode] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[] | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [recordsKey, setRecordsKey] = useState(0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }

  function pickMode(modeId: string) {
    setMode(modeId);
    setDrawStep('scratch');
  }

  function completeScratch(modeId: string, nums: number[]) {
    setMode(modeId);
    setPicked(nums);
    setJustSaved(false);
    setDrawStep('done');
  }

  function save() {
    if (!mode || !picked) return;
    saveRecord({ id: 'r' + Date.now(), ts: Date.now(), mode, nums: picked });
    setJustSaved(true);
    setRecordsKey((k) => k + 1);
    showToast('내 기록에 저장됐어요');
  }

  function again() {
    setDrawStep('home');
    setMode(null);
    setPicked(null);
  }

  function closeDone() {
    setDrawStep('home');
  }

  function changeTab(next: Tab) {
    if (next === tab) return;
    if (tab === 'draw' && drawStep !== 'home') {
      setDrawStep('home');
      setMode(null);
      setPicked(null);
    }
    setTab(next);
  }

  let body: React.ReactNode;
  if (tab === 'draw') {
    if (drawStep === 'home') body = <HomeScreen onPickMode={pickMode} />;
    else if (drawStep === 'scratch' && mode) body = <ScratchScreen modeId={mode} onCancel={() => setDrawStep('home')} onComplete={completeScratch} />;
    else if (drawStep === 'done' && mode && picked) body = <DoneScreen modeId={mode} nums={picked} onSave={save} onAgain={again} onClose={closeDone} justSaved={justSaved} />;
  } else if (tab === 'stats') {
    body = <StatsScreen />;
  } else if (tab === 'records') {
    body = <RecordsScreen refreshKey={recordsKey} />;
  }

  const showTab = !(tab === 'draw' && (drawStep === 'scratch' || drawStep === 'done'));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAEEF3 0%, #F4F4F5 200px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px 80px',
      fontFamily: '"Pretendard JP", system-ui',
    }}>
      <div>
        <PhoneFrame>
          {body}
          {showTab && <TabBar tab={tab} onTab={changeTab} />}
          <Toast msg={toast} />
        </PhoneFrame>
        <div style={{ marginTop: 20, textAlign: 'center', color: SUB, fontSize: 12.5 }}>
          럭키 로또 · 인터랙티브 프로토타입 (A안 · 클래식 실버 + Wanted Blue)
        </div>
      </div>
    </div>
  );
}
