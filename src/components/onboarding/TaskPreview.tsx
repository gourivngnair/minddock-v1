import { useState } from 'react';
import type { Task, Recurrence } from '../../types';

interface Props {
  tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[];
  onSubmit: (tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[]) => void;
}

const RECURRENCE: { value: Recurrence; label: string }[] = [
  { value: 'once',          label: 'Once' },
  { value: 'daily',         label: 'Daily' },
  { value: 'alternate-days',label: 'Alternate days' },
  { value: 'weekly',        label: 'Weekly' },
  { value: 'biweekly',      label: 'Biweekly' },
  { value: 'monthly',       label: 'Monthly' },
  { value: 'quarterly',     label: 'Quarterly' },
];

export default function TaskPreview({ tasks: initial, onSubmit }: Props) {
  const [tasks, setTasks] = useState(initial);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const update = (idx: number, patch: Partial<typeof tasks[0]>) =>
    setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, ...patch } : t));

  return (
    <div className="onboard-wrap fade-in">
      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 3 OF 3</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          Your scaffolded tasks
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Tap any task to customise it before adding to your day.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--ink-muted)', gap: 8 }}>
          <div style={{ fontSize: '2rem' }}>✨</div>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>No scaffolded tasks.<br />You'll add your own from the Today view.</div>
        </div>
      ) : (
        <div className="col" style={{ gap: 8, flex: 1, overflowY: 'auto' }}>
          {tasks.map((task, idx) => (
            <div
              key={idx}
              style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}
              className="fade-in"
            >
              {editingIdx === idx ? (
                <div className="col" style={{ gap: 12 }}>
                  <div className="field">
                    <label>Title</label>
                    <input className="input" value={task.title} onChange={(e) => update(idx, { title: e.target.value })} autoFocus />
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Est. time (min)</label>
                      <input className="input" type="number" min={1} value={task.userEstimatedTime} onChange={(e) => update(idx, { userEstimatedTime: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Recurrence</label>
                      <select className="input" value={task.recurrence} onChange={(e) => update(idx, { recurrence: e.target.value as Recurrence })}>
                        {RECURRENCE.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    style={{ borderRadius: 10 }}
                    onClick={() => setEditingIdx(null)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Done
                  </button>
                </div>
              ) : (
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>{task.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 3 }}>
                      <span className="mono">{task.userEstimatedTime}m</span>
                      {' · '}
                      {RECURRENCE.find((r) => r.value === task.recurrence)?.label}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingIdx(idx)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--paper2)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-block btn-lg" onClick={() => onSubmit(tasks)}>
        Start my day →
      </button>
    </div>
  );
}
