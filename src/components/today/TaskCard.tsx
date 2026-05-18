import { useState } from 'react';
import { useStore } from '../../store/useStore';
import EditTaskModal from '../tasks/EditTaskModal';
import { calcUrgency } from '../../utils/scoring';
import type { Task } from '../../types';

interface Props { task: Task; }

const PRI_COLORS: Record<number, string> = { 1: 'var(--ink-muted)', 2: 'var(--amber)', 3: 'var(--danger)' };

export default function TaskCard({ task }: Props) {
  const completeTask = useStore((s) => s.completeTask);
  const updateTask   = useStore((s) => s.updateTask);
  const startFocus   = useStore((s) => s.startFocus);
  const setScr       = useStore((s) => s.setScreen);

  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const urgency  = calcUrgency(task.deadline);
  const isUrgent = urgency > 2;

  const launchFocus = () => {
    startFocus(task.id);
    setScr('focus');
  };

  return (
    <>
      <div className="task-card" style={{ cursor: 'default' }}>

        {/* Checkbox */}
        <button
          onClick={() => completeTask(task.id)}
          title="Mark complete"
          style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            border: `2px solid ${PRI_COLORS[task.priority]}`,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        />

        {/* Bucket dot */}
        <div className={`task-dot ${task.bucketTag}`} />

        {/* Main content — tap to toggle action row */}
        <div
          style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer' }}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="row" style={{ gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
            {task.isScaffolded    && <span className="badge sage">scaffold</span>}
            {task.energyRequired === 1 && <span className="badge slate">easy</span>}
            {task.waitingOn       && <span className="badge gold">waiting: {task.waitingOn}</span>}
            {isUrgent             && <span className="badge red">urgent</span>}
          </div>

          <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3, color: 'var(--charcoal)' }}>
            {task.title}
          </div>

          <div className="task-meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="mono tiny">{task.userEstimatedTime}m</span>
            <span className="muted tiny">→</span>
            <span className="mono tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 600 }}>~{task.appRecommendedTime}m</span>
            <span className="muted tiny">·</span>
            <span className="tiny soft">{task.bucketTag}</span>
          </div>

          {task.deadline && (
            <div style={{ fontSize: '0.7rem', color: isUrgent ? 'var(--danger)' : 'var(--ink-muted)', marginTop: 3 }}>
              Due {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}

          {/* Inline action row */}
          {expanded && (
            <div
              style={{
                display: 'flex', gap: 8, marginTop: 10,
                paddingTop: 10, borderTop: '1px solid var(--line-soft)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setExpanded(false); setShowEdit(true); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '8px', borderRadius: 8,
                  border: '1.5px solid var(--line)', background: 'var(--paper2)',
                  color: 'var(--ink-soft)', fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Edit
              </button>
              <button
                onClick={launchFocus}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '8px', borderRadius: 8,
                  border: 'none', background: 'var(--charcoal)',
                  color: '#fff', fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Focus Mode
              </button>
            </div>
          )}
        </div>

        {/* Chevron — quick launch focus without expanding */}
        <div
          className="task-arrow"
          style={{ cursor: 'pointer' }}
          onClick={launchFocus}
          title="Start focus mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onSave={(u) => updateTask(task.id, u)}
        />
      )}
    </>
  );
}
