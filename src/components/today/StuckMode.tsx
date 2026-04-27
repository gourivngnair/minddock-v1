import { useStore } from '../../store/useStore';
import { getStuckModeTasks } from '../../utils/scoring';

export default function StuckMode() {
  const tasks = useStore((s) => s.tasks);
  const stuckModeIndex = useStore((s) => s.stuckModeIndex);
  const setStuckModeIndex = useStore((s) => s.setStuckModeIndex);
  const toggleStuckMode = useStore((s) => s.toggleStuckMode);
  const startFocus = useStore((s) => s.startFocus);
  const setScreen = useStore((s) => s.setScreen);

  const candidates = getStuckModeTasks(tasks);
  const task = candidates.length > 0 ? candidates[stuckModeIndex % candidates.length] : null;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>STUCK MODE</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>One task. That's it.</div>
        </div>
        <button className="icon-btn" onClick={toggleStuckMode}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="screen-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {task ? (
          <div style={{ background: '#fff', border: '2px solid var(--slate-blue)', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 0 24px rgba(74,101,240,0.1)' }}>
            <div className="tiny mono" style={{ color: 'var(--slate-blue-deep)', letterSpacing: '0.1em', marginBottom: 12 }}>YOUR ONE TASK</div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.25, color: 'var(--charcoal)', marginBottom: 8 }}>{task.title}</div>
            <div className="tiny soft">~{task.appRecommendedTime || task.userEstimatedTime} minutes · low energy</div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>No tiny tasks available.</div>
            <div className="tiny soft">Add a task ≤15 min with low energy to use Stuck Mode.</div>
          </div>
        )}

        {task && (
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => { startFocus(task.id); setScreen('focus'); }}
          >
            Start this task →
          </button>
        )}

        {candidates.length > 1 && (
          <button
            className="btn btn-ghost btn-block"
            onClick={() => setStuckModeIndex((stuckModeIndex + 1) % candidates.length)}
          >
            Choose another
          </button>
        )}

        <button
          onClick={toggleStuckMode}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px' }}
        >
          Exit Stuck Mode
        </button>

        <div className="adhd-hint">
          <span className="tiny soft">Completing a Stuck Mode task earns <strong style={{ color: 'var(--slate-blue-deep)' }}>20 XP</strong></span>
          <span></span>
        </div>
      </div>
    </>
  );
}
