import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import RealityCheck from './RealityCheck';

type Phase = 'work' | 'break' | 'done';

const fmtMs = (s: number) => {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function FocusMode() {
  const focusTaskId = useStore((s) => s.focusTaskId);
  const tasks = useStore((s) => s.tasks);
  const addFocusBreak = useStore((s) => s.addFocusBreak);
  const cancelFocus = useStore((s) => s.cancelFocus);

  const task = tasks.find((t) => t.id === focusTaskId);
  const target = (task?.appRecommendedTime ?? 15) * 60;

  const [phase, setPhase] = useState<Phase>('work');
  const [workSec, setWorkSec] = useState(0);
  const [breakSec, setBreakSec] = useState(0);
  const [, setBreakAdds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (phase === 'work') {
      tickRef.current = setInterval(() => setWorkSec((s) => s + 1), 1000);
    } else if (phase === 'break') {
      tickRef.current = setInterval(() => setBreakSec((s) => s + 1), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  if (phase === 'done' && task) {
    const total = Math.ceil((workSec + breakSec) / 60);
    return <RealityCheck task={task} totalActualMinutes={total} />;
  }

  const remaining = Math.max(0, target - workSec);
  const pct = Math.min(100, (workSec / target) * 100);
  const R = 110;
  const circ = 2 * Math.PI * R;

  return (
    <div className={`focus-screen ${phase} fade-in`}>
      <div className="focus-top">
        <button className="icon-btn ghost-on-dark" onClick={cancelFocus}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="tiny mono" style={{ letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>
          {phase === 'work' ? 'FOCUSING' : 'ON BREAK'}
        </div>
        <div style={{ width: 38 }} />
      </div>

      <div className="focus-body">
        <div className="focus-task serif">{task?.title}</div>

        {phase === 'work' && (
          <>
            <div className="ring-wrap">
              <svg width="240" height="240" viewBox="0 0 240 240">
                <defs>
                  <linearGradient id="ring-focus" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#a8baea"/>
                    <stop offset="1" stopColor="#6a82c4"/>
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
                <circle
                  cx="120" cy="120" r={R}
                  stroke="url(#ring-focus)" strokeWidth="3.5" fill="none"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 120 120)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="ring-center">
                <div className="ring-time serif">{fmtMs(remaining)}</div>
                <div className="tiny mono" style={{ opacity: 0.55, marginTop: 6, letterSpacing: '0.08em' }}>
                  OF {task?.appRecommendedTime}:00
                </div>
              </div>
            </div>

            <div className="focus-controls">
              <button className="ghost-pill" onClick={() => setPhase('break')}>
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

        {phase === 'break' && (
          <>
            <div className="break-stack">
              <div className="serif" style={{ fontSize: 54, fontWeight: 500, letterSpacing: '-0.03em', color: '#fff' }}>
                {fmtMs(breakSec)}
              </div>
              <div className="tiny mono" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginTop: 6 }}>
                BREAK TIME · TASK TIMER PAUSED
              </div>
            </div>
            <div className="col" style={{ gap: 10, width: '100%', padding: '0 32px' }}>
              <button
                className="extend-btn"
                onClick={() => { setBreakSec((s) => s + 120); setBreakAdds((a) => a + 1); addFocusBreak(2); }}
              >
                +2 mins
                <span className="tiny" style={{ opacity: 0.65, marginLeft: 8 }}>(tap as many times as you need)</span>
              </button>
              <button className="solid-pill" style={{ width: '100%' }} onClick={() => setPhase('work')}>
                Back to it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
