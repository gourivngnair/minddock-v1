import { useStore } from '../../store/useStore';
import { calcUrgency } from '../../utils/scoring';
import type { Task } from '../../types';

interface Props { task: Task; }

export default function TaskCard({ task }: Props) {
  const completeTask = useStore((s) => s.completeTask);
  const startFocus   = useStore((s) => s.startFocus);
  const setScr       = useStore((s) => s.setScreen);

  const urgency    = calcUrgency(task.deadline);
  const isUrgent   = urgency > 2;
  const handleFocus = () => { startFocus(task.id); setScr('focus'); };

  return (
    <button className="task-card" onClick={handleFocus}>
      <div className={`task-dot ${task.bucketTag}`} />

      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        {/* Badges row */}
        <div className="row" style={{ gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
          {task.isScaffolded && <span className="badge sage">scaffold</span>}
          {task.energyRequired === 1 && <span className="badge slate">easy</span>}
          {task.waitingOn && <span className="badge gold">waiting: {task.waitingOn}</span>}
          {isUrgent && <span className="badge red">urgent</span>}
        </div>

        {/* Title */}
        <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3, color: 'var(--charcoal)' }}>
          {task.title}
        </div>

        {/* Time meta — same format as TasksTab */}
        <div className="task-meta">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="mono tiny">{task.userEstimatedTime}m</span>
          <span className="muted tiny">→</span>
          <span className="mono tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 600 }}>~{task.appRecommendedTime}m adjusted</span>
          <span className="muted tiny">·</span>
          <span className="tiny soft">{task.bucketTag}</span>
        </div>

        {task.deadline && (
          <div style={{ fontSize: '0.7rem', color: isUrgent ? 'var(--danger)' : 'var(--ink-muted)', marginTop: 4 }}>
            Due {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
        <button
          onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
          style={{ background: 'var(--sage-soft)', border: '1px solid var(--sage)', borderRadius: 6, padding: '4px 8px', fontSize: '0.68rem', fontWeight: 600, color: 'var(--sage-deep)', cursor: 'pointer' }}
        >
          ✓ Done
        </button>
        <div className="task-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </button>
  );
}
