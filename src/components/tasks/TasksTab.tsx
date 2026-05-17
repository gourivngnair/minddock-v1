import { useState } from 'react';
import { useStore } from '../../store/useStore';
import CommandCenter from './CommandCenter';
import type { Task, Priority, EnergyLevel, BucketTag, LocationType, Recurrence } from '../../types';

type TaskFilter = 'all' | 'high-priority' | 'easy' | 'due-soon' | 'waiting';
type TaskSort   = 'newest' | 'priority' | 'energy' | 'bucket';

const PRI_COLORS: Record<Priority,   string> = { 1: 'var(--ink-muted)', 2: 'var(--amber)', 3: 'var(--danger)' };
const PRI_LABELS: Record<Priority,   string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
const E_ICONS:   Record<EnergyLevel, string> = { 1: '🟢', 2: '🟡', 3: '🔴' };
const E_LABELS:  Record<EnergyLevel, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Heavy' };

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'once',          label: 'Once' },
  { value: 'daily',         label: 'Daily' },
  { value: 'alternate-days',label: 'Alternate days' },
  { value: 'weekly',        label: 'Weekly' },
  { value: 'biweekly',      label: 'Biweekly' },
  { value: 'monthly',       label: 'Monthly' },
  { value: 'quarterly',     label: 'Quarterly' },
];

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'priority', label: 'Highest priority' },
  { value: 'energy',   label: 'Easiest first' },
  { value: 'bucket',   label: 'By bucket' },
];

const BUCKETS: { value: BucketTag; color: string }[] = [
  { value: 'Work',    color: 'var(--slate-blue)' },
  { value: 'Life',    color: 'var(--sage)' },
  { value: 'Health',  color: 'var(--coral)' },
  { value: 'Social',  color: 'var(--lavender)' },
  { value: 'Admin',   color: 'var(--gold)' },
  { value: 'Finance', color: 'var(--teal)' },
  { value: 'Other',   color: 'var(--ink-muted)' },
];

function isDueSoon(task: Task): boolean {
  if (!task.deadline) return false;
  const h = (new Date(task.deadline).getTime() - Date.now()) / 36e5;
  return h >= -24 && h <= 24;
}

/* ── Edit task sheet ── */
function EditTaskSheet({ task, onClose, onSave }: {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}) {
  const [title,      setTitle]      = useState(task.title);
  const [desc,       setDesc]       = useState(task.description);
  const [priority,   setPriority]   = useState<Priority>(task.priority);
  const [energy,     setEnergy]     = useState<EnergyLevel>(task.energyRequired);
  const [estTime,    setEstTime]    = useState(task.userEstimatedTime);
  const [location,   setLocation]   = useState<LocationType>(task.location);
  const [deadline,   setDeadline]   = useState(
    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  );
  const [bucket,     setBucket]     = useState<BucketTag>(task.bucketTag);
  const [recurrence, setRecurrence] = useState<Recurrence>(task.recurrence);
  const [waitingOn,  setWaitingOn]  = useState(task.waitingOn ?? '');

  const divider = <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }} />;

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Edit Task</div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Description <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <textarea className="input" style={{ minHeight: 64, resize: 'none' }} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        {divider}

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" style={{ display: 'block', marginBottom: 8 }}>Category</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BUCKETS.map((b) => (
              <button key={b.value} onClick={() => setBucket(b.value)} style={{
                padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
                fontWeight: 600, fontSize: '0.78rem',
                background: bucket === b.value ? `${b.color}18` : 'var(--paper2)',
                border: `1.5px solid ${bucket === b.value ? b.color : 'var(--line)'}`,
                color: bucket === b.value ? b.color : 'var(--ink-muted)',
                transition: 'all 0.15s',
              }}>{b.value}</button>
            ))}
          </div>
        </div>

        {divider}

        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          {/* Priority */}
          <div className="field" style={{ flex: 1 }}>
            <label>Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([1, 2, 3] as Priority[]).map((p) => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  background: priority === p ? PRI_COLORS[p] : 'var(--paper2)',
                  border: `1.5px solid ${priority === p ? PRI_COLORS[p] : 'var(--line)'}`,
                  color: priority === p ? '#fff' : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}>{p === 1 ? '↓' : p === 2 ? '→' : '↑'}</button>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 3, textAlign: 'center' }}>
              {PRI_LABELS[priority]}
            </div>
          </div>

          {/* Energy */}
          <div className="field" style={{ flex: 1 }}>
            <label>Energy</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { v: 1 as EnergyLevel, color: 'var(--sage)' },
                { v: 2 as EnergyLevel, color: 'var(--amber)' },
                { v: 3 as EnergyLevel, color: 'var(--coral)' },
              ]).map((e) => (
                <button key={e.v} onClick={() => setEnergy(e.v)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 700, fontSize: 12,
                  background: energy === e.v ? e.color : 'var(--paper2)',
                  border: `1.5px solid ${energy === e.v ? e.color : 'var(--line)'}`,
                  color: energy === e.v ? '#fff' : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}>{E_ICONS[e.v]}</button>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 3, textAlign: 'center' }}>
              {E_LABELS[energy]}
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Est. time (min)</label>
            <input className="input" type="number" min={1} value={estTime} onChange={(e) => setEstTime(parseInt(e.target.value) || 1)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Location</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['home', 'away'] as LocationType[]).map((l) => (
                <button key={l} onClick={() => setLocation(l)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: location === l ? 'var(--slate-blue-soft)' : 'var(--paper2)',
                  border: `1.5px solid ${location === l ? 'var(--slate-blue)' : 'var(--line)'}`,
                  color: location === l ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}>
                  {l === 'home' ? '🏠' : '🚗'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Recurrence</label>
          <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
            {RECURRENCES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {divider}

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Deadline <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Waiting on <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="Who or what is blocking this?" value={waitingOn} onChange={(e) => setWaitingOn(e.target.value)} />
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={!title.trim()}
            onClick={() => {
              onSave({
                title, description: desc, priority, energyRequired: energy,
                userEstimatedTime: estTime, location, recurrence, bucketTag: bucket,
                deadline: deadline || undefined,
                waitingOn: waitingOn || undefined,
              });
              onClose();
            }}
          >
            Save changes
          </button>
        </div>

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TasksTab() {
  const tasks        = useStore((s) => s.tasks);
  const deleteTask   = useStore((s) => s.deleteTask);
  const updateTask   = useStore((s) => s.updateTask);
  const completeTask = useStore((s) => s.completeTask);
  const startFocus   = useStore((s) => s.startFocus);
  const setScreen    = useStore((s) => s.setScreen);

  const [filter,     setFilter]     = useState<TaskFilter>('all');
  const [sort,       setSort]       = useState<TaskSort>('newest');
  const [showAdd,    setShowAdd]    = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing,    setEditing]    = useState<Task | null>(null);

  const pending = tasks.filter((t) => !t.completed);
  const done    = tasks.filter((t) => t.completed);

  const counts: Record<TaskFilter, number> = {
    'all':           pending.length,
    'high-priority': pending.filter((t) => t.priority === 3).length,
    'easy':          pending.filter((t) => t.energyRequired === 1).length,
    'due-soon':      pending.filter(isDueSoon).length,
    'waiting':       pending.filter((t) => !!t.waitingOn).length,
  };

  const afterFilter = pending.filter((t) => {
    if (filter === 'high-priority') return t.priority === 3;
    if (filter === 'easy')          return t.energyRequired === 1;
    if (filter === 'due-soon')      return isDueSoon(t);
    if (filter === 'waiting')       return !!t.waitingOn;
    return true;
  });

  const visible = [...afterFilter].sort((a, b) => {
    if (sort === 'priority') return b.priority - a.priority;
    if (sort === 'energy')   return a.energyRequired - b.energyRequired;
    if (sort === 'bucket')   return a.bucketTag.localeCompare(b.bucketTag);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const FILTERS: { value: TaskFilter; label: string; icon?: string }[] = [
    { value: 'all',           label: 'All tasks'      },
    { value: 'high-priority', label: 'High priority', icon: '🔴' },
    { value: 'easy',          label: 'Easy to start', icon: '🟢' },
    { value: 'due-soon',      label: 'Due soon',      icon: '⏰' },
    { value: 'waiting',       label: 'Waiting on',    icon: '⏳' },
  ];

  const TaskRow = ({ task }: { task: Task }) => {
    const urgent  = isDueSoon(task);
    const isPast  = task.deadline ? new Date(task.deadline).getTime() < Date.now() && !task.completed : false;

    return (
      <div style={{
        background: task.completed ? 'var(--paper2)' : '#fff',
        border: `1px solid ${urgent && !task.completed ? '#e8d5a0' : 'var(--line)'}`,
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 8,
      }}>
        <div className="row" style={{ gap: 10 }}>
          {/* Bucket dot + checkbox combined */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div className={`task-dot ${task.bucketTag}`} style={{ width: 10, height: 10 }} />
            <button
              onClick={() => completeTask(task.id)}
              style={{
                width: 20, height: 20, borderRadius: 6,
                border: `2px solid ${task.completed ? 'var(--sage)' : PRI_COLORS[task.priority]}`,
                background: task.completed ? 'var(--sage)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {task.completed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          </div>

          {/* Main content — same layout as TaskCard */}
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
            {/* Badges */}
            <div className="row" style={{ gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
              {task.isScaffolded  && <span className="badge sage">scaffold</span>}
              {task.energyRequired === 1 && <span className="badge slate">easy</span>}
              {task.waitingOn     && <span className="badge gold">⏳ {task.waitingOn}</span>}
              {urgent && !task.completed && <span className="badge amber">⏰ due soon</span>}
              {isPast             && <span className="badge red">past due</span>}
            </div>
            {/* Title */}
            <div style={{
              fontWeight: 600, fontSize: 14.5, lineHeight: 1.3,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'var(--ink-muted)' : 'var(--charcoal)',
            }}>
              {task.title}
            </div>
            {/* Meta — identical format to TaskCard */}
            <div className="task-meta">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="mono tiny">{task.userEstimatedTime}m</span>
              <span className="muted tiny">→</span>
              <span className="mono tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 600 }}>~{task.appRecommendedTime}m adjusted</span>
              <span className="muted tiny">·</span>
              <span className="tiny soft">{task.bucketTag}</span>
              <span className="muted tiny">·</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: PRI_COLORS[task.priority] }}>{PRI_LABELS[task.priority]}</span>
            </div>
            {task.deadline && (
              <div style={{ fontSize: '0.7rem', color: isPast ? 'var(--danger)' : 'var(--ink-muted)', marginTop: 3 }}>
                Due {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="row" style={{ gap: 5, flexShrink: 0 }}>
            {!task.completed && (
              <button
                onClick={() => { startFocus(task.id); setScreen('focus'); }}
                style={{ padding: '5px 10px', borderRadius: 8, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
              >
                Focus
              </button>
            )}
            {/* Edit button — always visible, works on past-due and completed tasks */}
            <button
              onClick={() => setEditing(task)}
              title="Edit task"
              style={{ background: 'var(--paper2)', border: '1px solid var(--line)', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              title="Delete task"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expandedId === task.id && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)', fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            {task.description && <p style={{ marginBottom: 6 }}>{task.description}</p>}
            <div>
              ADHD-adjusted: <span style={{ color: 'var(--slate-blue-deep)', fontFamily: 'monospace', fontWeight: 600 }}>{task.appRecommendedTime}m</span>
              <span className="tiny muted"> (your {task.userEstimatedTime}m × {(task.appRecommendedTime / task.userEstimatedTime).toFixed(2)}× multiplier)</span>
            </div>
            {task.deadline && (
              <div style={{ marginTop: 3 }}>
                Deadline: {new Date(task.deadline).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {new Date(task.deadline).getTime() < Date.now() && !task.completed && (
                  <span style={{ color: 'var(--danger)', marginLeft: 8, fontWeight: 600 }}>⚠ Past due</span>
                )}
              </div>
            )}
            {task.waitingOn && <div style={{ marginTop: 3 }}>Waiting on: <strong>{task.waitingOn}</strong></div>}
            {task.recurrence !== 'once' && <div style={{ marginTop: 3 }}>Recurrence: <strong>{task.recurrence}</strong></div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar">
        <div>
          <div className="kicker">All tasks</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>Tasks</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{pending.length} pending · {done.length} done</div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f.value} className={`chip${filter === f.value ? ' active' : ''}`} onClick={() => setFilter(f.value)}>
            {f.icon && <span>{f.icon}</span>}
            {f.label}
            <span className="chip-count">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      <div className="sort-row">
        <span className="tiny muted" style={{ flexShrink: 0 }}>Sort:</span>
        {SORT_OPTIONS.map((s) => (
          <button key={s.value} className={`sort-pill${sort === s.value ? ' active' : ''}`} onClick={() => setSort(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      {filter !== 'all' && (
        <div className="filter-summary">
          <span>Showing <strong>{visible.length}</strong> of <strong>{pending.length}</strong> tasks</span>
          <button className="filter-summary-clear" onClick={() => setFilter('all')}>Clear ×</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>
        {pending.length === 0 && done.length === 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 17 }}>No tasks yet.</div>
            <div className="tiny soft" style={{ marginTop: 4 }}>Tap the ✦ button to add one.</div>
          </div>
        )}

        {visible.length === 0 && pending.length > 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 16 }}>No tasks match this filter.</div>
            <div className="tiny soft" style={{ marginTop: 4 }}>
              <button onClick={() => setFilter('all')} style={{ color: 'var(--slate-blue-deep)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Show all {pending.length} →
              </button>
            </div>
          </div>
        )}

        {visible.map((t) => <TaskRow key={t.id} task={t} />)}

        {done.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="tiny mono soft" style={{ letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
              Completed · {done.length}
            </div>
            {done.map((t) => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </div>

      {showAdd  && <CommandCenter onClose={() => setShowAdd(false)} />}
      {editing  && <EditTaskSheet task={editing} onClose={() => setEditing(null)} onSave={(u) => updateTask(editing.id, u)} />}
    </div>
  );
}
