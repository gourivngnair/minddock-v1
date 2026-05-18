import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import RealityCheck from './RealityCheck';

type Phase     = 'work' | 'break' | 'done';
type BreakStep = 'pick' | 'countdown' | 'over';

const fmt = (s: number) => {
  const m = Math.floor(Math.abs(s) / 60), sec = Math.abs(s) % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const BREAK_OPTS = [5, 10, 15];
const R    = 110;
const CIRC = 2 * Math.PI * R;

export default function FocusMode() {
  const focusTaskId   = useStore((s) => s.focusTaskId);
  const tasks         = useStore((s) => s.tasks);
  const addFocusBreak = useStore((s) => s.addFocusBreak);
  const cancelFocus   = useStore((s) => s.cancelFocus);

  const task   = tasks.find((t) => t.id === focusTaskId);
  const target = (task?.appRecommendedTime ?? 15) * 60;

  const [phase,          setPhase]          = useState<Phase>('work');
  const [breakStep,      setBreakStep]      = useState<BreakStep>('pick');
  const [workSec,        setWorkSec]        = useState(0);
  const [breakRemaining, setBreakRemaining] = useState(0);
  const [breakTotal,     setBreakTotal]     = useState(0);
  const [totalBreakSec,  setTotalBreakSec]  = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Tick engine ── */
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (phase === 'work') {
      tickRef.current = setInterval(() => setWorkSec((s) => s + 1), 1000);
    } else if (phase === 'break' && breakStep === 'countdown') {
      tickRef.current = setInterval(() => {
        setBreakRemaining((s) => Math.max(0, s - 1));
        setTotalBreakSec((s) => s + 1);
      }, 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, breakStep]);

  /* ── Break countdown → over transition ── */
  useEffect(() => {
    if (phase !== 'break' || breakStep !== 'countdown' || breakRemaining !== 0 || breakTotal === 0) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setBreakStep('over');
    const t = setTimeout(() => { setPhase('work'); setBreakStep('pick'); }, 2200);
    return () => clearTimeout(t);
  }, [breakRemaining, phase, breakStep, breakTotal]);

  /* ── Final screen ── */
  if (phase === 'done' && task) {
    return <RealityCheck task={task} totalActualMinutes={Math.ceil((workSec + totalBreakSec) / 60)} />;
  }

  /* ── Derived display values ── */
  const isOvertime = workSec > target;
  const overtime   = isOvertime ? workSec - target : 0;
  const remaining  = isOvertime ? 0 : target - workSec;
  const workPct    = Math.min(100, (workSec / target) * 100);
  const breakPct   = breakTotal > 0 ? (breakRemaining / breakTotal) * 100 : 100;

  const startBreak = (mins: number) => {
    setBreakTotal(mins * 60);
    setBreakRemaining(mins * 60);
    setBreakStep('countdown');
    addFocusBreak(mins);
  };

  const addBreakTime = () => {
    setBreakRemaining((s) => s + 120);
    setBreakTotal((s) => s + 120);
    addFocusBreak(2);
  };

  const backToWork = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setPhase('work');
    setBreakStep('pick');
  };

  return (
    <div className={`focus-screen ${phase} fade-in`}>
      {/* Top bar */}
      <div className="focus-top">
        <button className="icon-btn ghost-on-dark" onClick={cancelFocus}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="tiny mono" style={{ letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>
          {phase === 'work' ? (isOvertime ? 'OVERTIME' : 'FOCUSING') : 'ON BREAK'}
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="focus-body">
        <div className="focus-task serif">{task?.title}</div>

        {/* ══ WORK ══ */}
        {phase === 'work' && (
          <>
            <div className="ring-wrap">
              <svg width="240" height="240" viewBox="0 0 240 240">
                <defs>
                  <linearGradient id="rg-work" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={isOvertime ? '#fcd34d' : '#a8baea'} />
                    <stop offset="1" stopColor={isOvertime ? '#f59e0b' : '#6a82c4'} />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
                <circle
                  cx="120" cy="120" r={R}
                  stroke="url(#rg-work)" strokeWidth="3.5" fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - workPct / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 120 120)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="ring-center">
                {isOvertime ? (
                  <>
                    <div className="ring-time serif" style={{ color: '#fcd34d' }}>+{fmt(overtime)}</div>
                    <div className="tiny mono" style={{ opacity: 0.75, marginTop: 6, letterSpacing: '0.08em', color: '#fcd34d' }}>OVER TIME</div>
                  </>
                ) : (
                  <>
                    <div className="ring-time serif">{fmt(remaining)}</div>
                    <div className="tiny mono" style={{ opacity: 0.55, marginTop: 6, letterSpacing: '0.08em' }}>
                      OF {task?.appRecommendedTime}:00
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="focus-controls">
              <button className="ghost-pill" onClick={() => { setBreakStep('pick'); setPhase('break'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>
                Take a break
              </button>
              <button className="solid-pill" onClick={() => setPhase('done')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Done
              </button>
            </div>
          </>
        )}

        {/* ══ BREAK — PICK DURATION ══ */}
        {phase === 'break' && breakStep === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%', padding: '0 32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>☕</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em' }}>How long?</div>
              <div className="tiny mono" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', marginTop: 5 }}>TASK TIMER PAUSED</div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {BREAK_OPTS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => startBreak(mins)}
                  style={{
                    width: 76, height: 76, borderRadius: 18,
                    border: '1.5px solid rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.09)',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22 }}>{mins}</span>
                  <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.07em' }}>MIN</span>
                </button>
              ))}
            </div>
            <button className="ghost-pill" onClick={backToWork}>Back to it →</button>
          </div>
        )}

        {/* ══ BREAK — COUNTDOWN ══ */}
        {phase === 'break' && breakStep === 'countdown' && (
          <>
            <div className="ring-wrap">
              <svg width="240" height="240" viewBox="0 0 240 240">
                <defs>
                  <linearGradient id="rg-break" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#6ee7b7" />
                    <stop offset="1" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
                <circle
                  cx="120" cy="120" r={R}
                  stroke="url(#rg-break)" strokeWidth="3.5" fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - breakPct / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 120 120)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="ring-center">
                <div className="ring-time serif">{fmt(breakRemaining)}</div>
                <div className="tiny mono" style={{ opacity: 0.55, marginTop: 6, letterSpacing: '0.08em' }}>BREAK</div>
              </div>
            </div>

            <div className="focus-controls" style={{ flexDirection: 'column', gap: 10, width: '100%', padding: '0 32px' }}>
              <button className="extend-btn" onClick={addBreakTime}>
                +2 mins
                <span className="tiny" style={{ opacity: 0.6, marginLeft: 8 }}>need a bit more?</span>
              </button>
              <button className="solid-pill" style={{ width: '100%' }} onClick={backToWork}>
                Back to it
              </button>
            </div>
          </>
        )}

        {/* ══ BREAK — OVER ══ */}
        {phase === 'break' && breakStep === 'over' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 32px' }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>🎯</div>
            <div className="serif" style={{ fontSize: 24, fontWeight: 500, color: '#fff', textAlign: 'center', letterSpacing: '-0.02em' }}>
              Break's over!
            </div>
            <div className="tiny mono" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }}>
              HEADING BACK…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
