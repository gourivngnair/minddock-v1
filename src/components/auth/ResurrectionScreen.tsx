import { useStore } from '../../store/useStore';

export default function ResurrectionScreen() {
  const freshStart = useStore((s) => s.freshStart);
  const setScreen = useStore((s) => s.setScreen);
  const user = useStore((s) => s.user);

  return (
    <div className="onboard-wrap" style={{ justifyContent: 'center' }}>
      <div>
        <div className="serif" style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10 }}>
          Welcome back,<br />{user?.name}.
        </div>
        <p className="soft" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
          It's been more than 48 hours. No judgment — pick how you want to continue.
        </p>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <button
          className="path-btn"
          onClick={() => setScreen('today')}
          style={{ padding: '16px 16px' }}
        >
          <div className="path-icon" style={{ background: 'var(--slate-blue-soft)', color: 'var(--slate-blue-deep)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Keep my backlog</div>
            <div className="tiny soft" style={{ marginTop: 2 }}>Resume where you left off. Old tasks are still there.</div>
          </div>
        </button>

        <button
          className="path-btn"
          onClick={freshStart}
          style={{ padding: '16px 16px' }}
        >
          <div className="path-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.02"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Fresh start</div>
            <div className="tiny soft" style={{ marginTop: 2 }}>Wipe the slate. XP, multiplier and patterns carry over.</div>
          </div>
        </button>
      </div>

      <div className="adhd-hint">
        <span className="row" style={{ gap: 6, fontSize: '0.78rem' }}>
          Your multiplier <span className="mono" style={{ fontWeight: 700 }}>{user?.multiplierB.toFixed(2)}×</span> and <span className="mono" style={{ fontWeight: 700 }}>{user?.xp} XP</span> carry over either way.
        </span>
        <span></span>
      </div>
    </div>
  );
}
