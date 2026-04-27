import { useState } from 'react';
import { useStore } from '../../store/useStore';
import CommandCenter from './CommandCenter';
import type { Task, Priority, EnergyLevel } from '../../types';

type TaskFilter = 'all' | 'high-priority' | 'easy' | 'due-soon' | 'waiting';
type TaskSort   = 'newest' | 'priority' | 'energy' | 'bucket';

const PRI_COLORS: Record<Priority,   string> = { 1: 'var(--ink-muted)', 2: 'var(--gold)', 3: 'var(--danger)' };
const PRI_LABELS: Record<Priority,   string> = { 1: 'Low',  2: 'Medium', 3: 'High' };
const E_ICONS:   Record<EnergyLevel, string> = { 1: '🟢', 2: '🟡', 3: '🔴' };
const E_LABELS:  Record<EnergyLevel, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Heavy' };

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'priority', label: 'Highest priority' },
  { value: 'energy',   label: 'Easiest first' },
  { value: 'bucket',   label: 'By bucket' },
];

function isDueSoon(task: Task): boolean {
  if (!task.deadline) return false;
  const h = (new Date(task.deadline).getTime() - Date.now()) / 36e5;
  return h <= 24;
}

export default function TasksTab() {
  const tasks       = useStore((s) => s.tasks);
  const deleteTask  = useStore((s) => s.deleteTask);
  const completeTask = useStore((s) => s.completeTask);
  const startFocus  = useStore((s) => s.startFocus);
  const setScreen   = useStore((s) => s.setScreen);

  const [filter, setFilter]   = useState<TaskFilter>('all');
  const [sort,   setSort]     = useState<TaskSort>('newest');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = tasks.filter((t) => !t.completed);
  const done    = tasks.filter((t) => t.completed);

  // counts for each filter chip (pending only)
  const counts: Record<TaskFilter, number> = {
    'all':           pending.length,
    'high-priority': pending.filter((t) => t.priority === 3).length,
    'easy':          pending.filter((t) => t.energyRequired === 1).length,
    'due-soon':      pending.filter(isDueSoon).length,
    'waiting':       pending.filter((t) => !!t.waitingOn).length,
  };

  // 1. filter
  const afterFilter = pending.filter((t) => {
    if (filter === 'high-priority') return t.priority === 3;
    if (filter === 'easy')          return t.energyRequired === 1;
    if (filter === 'due-soon')      return isDueSoon(t);
    if (filter === 'waiting')       return !!t.waitingOn;
    return true;
  });

  // 2. sort
  const visible = [...afterFilter].sort((a, b) => {
    if (sort === 'priority') return b.priority - a.priority;
    if (sort === 'energy')   return a.energyRequired - b.energyRequired;
    if (sort === 'bucket')   return a.bucketTag.localeCompare(b.bucketTag);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const FILTERS: { value: TaskFilter; label: string; icon?: string }[] = [
    { value: 'all',           label: 'All tasks'       },
    { value: 'high-priority', label: 'High priority',  icon: '🔴' },
    { value: 'easy',          label: 'Easy to start',  icon: '🟢' },
    { value: 'due-soon',      label: 'Due soon',       icon: '⏰' },
    { value: 'waiting',       label: 'Waiting on',     icon: '⏳' },
  ];

  const TaskRow = ({ task }: { task: Task }) => {
    const urgent = isDueSoon(task);
    return (
      <div style={{
        background: '#fff',
        border: `1px solid ${urgent ? '#e8d5a0' : 'var(--line)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
      }}>
        <div className="row" style={{ gap: 10 }}>
          {/* checkbox */}
          <button
            onClick={() => completeTask(task.id)}
            style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${PRI_COLORS[task.priority]}`,
              background: task.completed ? PRI_COLORS[task.priority] : 'transparent',
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {task.completed && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>

          {/* main content */}
          <div
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
          >
            <div style={{
              fontWeight: 600, fontSize: 14,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'var(--ink-muted)' : 'var(--charcoal)',
              lineHeight: 1.35,
            }}>
              {task.title}
            </div>
            <div className="row" style={{ gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: PRI_COLORS[task.priority] }}>
                {PRI_LABELS[task.priority]}
              </span>
              <span style={{ color: 'var(--line)' }}>·</span>
              <span className="tiny soft">{E_ICONS[task.energyRequired]} {E_LABELS[task.energyRequired]}</span>
              <span style={{ color: 'var(--line)' }}>·</span>
              <span className="tiny mono soft">{task.userEstimatedTime}m → <strong style={{ color: 'var(--slate-blue-deep)' }}>{task.appRecommendedTime}m</strong></span>
              {task.bucketTag && (
                <span className="badge slate" style={{ padding: '1px 7px' }}>{task.bucketTag}</span>
              )}
              {task.waitingOn && (
                <span className="badge gold">⏳ {task.waitingOn}</span>
              )}
              {urgent && <span className="badge gold">⏰ due soon</span>}
            </div>
          </div>

          {/* actions */}
          <div className="row" style={{ gap: 6, flexShrink: 0 }}>
            {!task.completed && (
              <button
                onClick={() => { startFocus(task.id); setScreen('focus'); }}
                style={{ padding: '5px 10px', borderRadius: 8, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}
              >
                Focus
              </button>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* expanded detail */}
        {expandedId === task.id && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)', fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            {task.description && <p style={{ marginBottom: 4 }}>{task.description}</p>}
            <div>
              ADHD-adjusted time: <span style={{ color: 'var(--slate-blue-deep)', fontFamily: 'monospace', fontWeight: 600 }}>{task.appRecommendedTime}m</span>
              <span style={{ color: 'var(--ink-muted)' }}> (your {task.userEstimatedTime}m × {(task.appRecommendedTime / task.userEstimatedTime).toFixed(2)}× multiplier)</span>
            </div>
            {task.deadline && (
              <div>Deadline: {new Date(task.deadline).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
            )}
            {task.waitingOn && <div>Waiting on: <strong>{task.waitingOn}</strong></div>}
            {task.location === 'away' && <div>📍 Requires going out</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* header */}
      <div className="topbar">
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Tasks</div>
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

      {/* filter chips */}
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.icon && <span>{f.icon}</span>}
            {f.label}
            <span className="chip-count">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* sort pills */}
      <div className="sort-row">
        <span className="tiny muted" style={{ flexShrink: 0 }}>Sort:</span>
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.value}
            className={`sort-pill${sort === s.value ? ' active' : ''}`}
            onClick={() => setSort(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* active filter summary (when not "all") */}
      {filter !== 'all' && (
        <div className="filter-summary">
          <span>
            Showing <strong>{visible.length}</strong> of <strong>{pending.length}</strong> tasks
            {filter === 'high-priority' && ' · high priority only'}
            {filter === 'easy'          && ' · low energy only'}
            {filter === 'due-soon'      && ' · due within 24 hours'}
            {filter === 'waiting'       && ' · waiting on someone else'}
          </span>
          <button className="filter-summary-clear" onClick={() => setFilter('all')}>Clear ×</button>
        </div>
      )}

      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>
        {pending.length === 0 && done.length === 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 17 }}>No tasks yet.</div>
            <div className="tiny soft" style={{ marginTop: 4 }}>Tap the brain icon at the bottom to add one.</div>
          </div>
        )}

        {visible.length === 0 && pending.length > 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 16 }}>No tasks match this filter.</div>
            <div className="tiny soft" style={{ marginTop: 4 }}>
              <button onClick={() => setFilter('all')} style={{ color: 'var(--slate-blue-deep)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Show all {pending.length} tasks →
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

      {showAdd && <CommandCenter onClose={() => setShowAdd(false)} />}
    </div>
  );
}
