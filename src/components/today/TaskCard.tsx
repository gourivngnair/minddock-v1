import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { calcUrgency } from '../../utils/scoring';
import type { Task } from '../../types';


interface Props { task: Task; }

export default function TaskCard({ task }: Props) {
  const completeTask = useStore((s) => s.completeTask);
  const setScreen = useStore((s) => s.setScreen);
  const startFocus = useStore((s) => s.startFocus);
  const [showInfo, setShowInfo] = useState(false);

  const urgency = calcUrgency(task.deadline);
  const isUrgent = urgency > 2;
  const appMins = task.appRecommendedTime;
  const rawMins = task.userEstimatedTime;

  const handleFocus = () => { startFocus(task.id); setScreen('focus'); };

  return (
    <button className="task-card" onClick={handleFocus}>
      <div className={`task-dot ${task.bucketTag}`} />

      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div className="row" style={{ gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
          {task.isScaffolded && <span className="badge sage">scaffold</span>}
          {task.energyRequired === 1 && <span className="badge slate">easy</span>}
          {task.waitingOn && <span className="badge gold">waiting: {task.waitingOn}</span>}
          {isUrgent && <span className="badge red">urgent</span>}
        </div>

        <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3, color: 'var(--charcoal)' }}>
          {task.title}
        </div>

        <div className="task-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="mono tiny">{rawMins}m</span>
          <span className="muted tiny">→</span>
          <span className="mono tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 600 }}>~{appMins}m for you</span>
        </div>

        {showInfo && (
          <div className="adhd-hint fade-in" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
            <span className="row" style={{ gap: 6, fontSize: '0.72rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
              Adjusted by your {(task.appRecommendedTime / task.userEstimatedTime).toFixed(2)}× pattern
            </span>
            <span className="mono tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 700 }}>{appMins}m</span>
          </div>
        )}

        {task.deadline && (
          <div style={{ fontSize: '0.7rem', color: isUrgent ? 'var(--danger)' : 'var(--ink-muted)', marginTop: 4 }}>
            Due {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
        <div className="task-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
          style={{ background: 'var(--sage-soft)', border: '1px solid var(--sage)', borderRadius: 6, padding: '4px 8px', fontSize: '0.68rem', fontWeight: 600, color: 'var(--sage-deep)', cursor: 'pointer' }}
          title="Quick-complete (no multiplier update)"
        >
          ✓ Done
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: '0.68rem', padding: 0 }}
          title="Why this estimate?"
        >
          ℹ
        </button>
      </div>
    </button>
  );
}
