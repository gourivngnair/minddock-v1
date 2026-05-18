import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import ScaffoldEditor from './ScaffoldEditor';
import type { Task, Priority, ScaffoldMaster } from '../../types';

type TaskFilter = 'all' | 'high-priority' | 'easy' | 'due-soon' | 'waiting';
type TaskSort   = 'newest' | 'priority' | 'energy' | 'bucket';

const PRI_COLORS: Record<Priority,   string> = { 1: 'var(--ink-muted)', 2: 'var(--amber)', 3: 'var(--danger)' };
const PRI_LABELS: Record<Priority,   string> = { 1: 'Low', 2: 'Medium', 3: 'High' };

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'priority', label: 'Highest priority' },
  { value: 'energy',   label: 'Easiest first' },
  { value: 'bucket',   label: 'By bucket' },
];


function isDueSoon(task: Task): boolean {
  if (!task.deadline) return false;
  const h = (new Date(task.deadline).getTime() - Date.now()) / 36e5;
  return h >= -24 && h <= 24;
}


export default function TasksTab() {
  const tasks                = useStore((s) => s.tasks);
  const deleteTask           = useStore((s) => s.deleteTask);
  const updateTask           = useStore((s) => s.updateTask);
  const completeTask         = useStore((s) => s.completeTask);
  const startFocus           = useStore((s) => s.startFocus);
  const setScreen            = useStore((s) => s.setScreen);
  const scaffoldMasters      = useStore((s) => s.scaffoldMasters);
  const addScaffoldMaster    = useStore((s) => s.addScaffoldMaster);
  const updateScaffoldMaster = useStore((s) => s.updateScaffoldMaster);
  const deleteScaffoldMaster = useStore((s) => s.deleteScaffoldMaster);
  const startScaffold        = useStore((s) => s.startScaffold);

  const scaffoldDeepLink    = useStore((s) => s.scaffoldDeepLink);
  const clearScaffoldDeepLink = useStore((s) => s.clearScaffoldDeepLink);

  const [view,       setView]       = useState<'tasks' | 'scaffolds'>('tasks');

  useEffect(() => {
    if (scaffoldDeepLink) { setView('scaffolds'); clearScaffoldDeepLink(); }
  }, [scaffoldDeepLink, clearScaffoldDeepLink]);
  const [filter,     setFilter]     = useState<TaskFilter>('all');
  const [sort,       setSort]       = useState<TaskSort>('newest');
  const [showAdd,    setShowAdd]    = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing,    setEditing]    = useState<Task | null>(null);
  const [scaffoldExpandedId, setScaffoldExpandedId] = useState<string | null>(null);
  const [editingScaffold,    setEditingScaffold]    = useState<ScaffoldMaster | null>(null);
  const [showNewScaffold,    setShowNewScaffold]    = useState(false);

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
              {task.scaffoldMasterId && (() => {
                const m = scaffoldMasters.find((x) => x.id === task.scaffoldMasterId);
                if (!m) return null;
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '1px 8px', borderRadius: 99,
                    background: `${m.color}18`, border: `1px solid ${m.color}40`,
                    fontSize: 11, fontWeight: 700, color: m.color,
                  }}>
                    {m.icon} {m.name} · {(task.scaffoldStepIdx ?? 0) + 1}/{m.steps.length}
                  </span>
                );
              })()}
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
          <div className="kicker">{view === 'tasks' ? 'All tasks' : 'Scaffold templates'}</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>
            {view === 'tasks' ? 'Tasks' : 'Scaffolds'}
          </div>
          <div className="tiny muted" style={{ marginTop: 2 }}>
            {view === 'tasks' ? `${pending.length} pending · ${done.length} done` : `${scaffoldMasters.length} template${scaffoldMasters.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          onClick={() => view === 'tasks' ? setShowAdd(true) : setShowNewScaffold(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {view === 'tasks' ? 'Add' : 'New'}
        </button>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 6, padding: '0 18px 10px', flexShrink: 0 }}>
        {(['tasks', 'scaffolds'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${view === v ? 'var(--slate-blue)' : 'var(--line)'}`,
            background: view === v ? 'var(--slate-blue-soft)' : 'var(--paper2)',
            color: view === v ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
            transition: 'all 0.12s',
          }}>
            {v === 'tasks' ? '✦ Tasks' : '🗂 Scaffolds'}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ display: view === 'tasks' ? undefined : 'none' }}>
        {FILTERS.map((f) => (
          <button key={f.value} className={`chip${filter === f.value ? ' active' : ''}`} onClick={() => setFilter(f.value)}>
            {f.icon && <span>{f.icon}</span>}
            {f.label}
            <span className="chip-count">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      <div className="sort-row" style={{ display: view === 'tasks' ? undefined : 'none' }}>
        <span className="tiny muted" style={{ flexShrink: 0 }}>Sort:</span>
        {SORT_OPTIONS.map((s) => (
          <button key={s.value} className={`sort-pill${sort === s.value ? ' active' : ''}`} onClick={() => setSort(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      {view === 'tasks' && filter !== 'all' && (
        <div className="filter-summary">
          <span>Showing <strong>{visible.length}</strong> of <strong>{pending.length}</strong> tasks</span>
          <button className="filter-summary-clear" onClick={() => setFilter('all')}>Clear ×</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>

      {/* ══ SCAFFOLDS VIEW ══ */}
      {view === 'scaffolds' && (
        <>
          {scaffoldMasters.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗂</div>
              <div className="serif" style={{ fontSize: 17 }}>No scaffolds yet.</div>
              <div className="tiny soft" style={{ marginTop: 4 }}>Create a scaffold to break a multi-step routine into sequential tasks.</div>
            </div>
          )}
          {scaffoldMasters.map((master) => {
            const activeTasks   = tasks.filter((t) => t.scaffoldMasterId === master.id && !t.completed);
            const activeStep    = activeTasks.length > 0 ? activeTasks[0] : null;
            const activeStepIdx = activeStep?.scaffoldStepIdx ?? -1;
            const isExpanded    = scaffoldExpandedId === master.id;

            return (
              <div key={master.id} style={{
                background: '#fff', border: `1.5px solid ${master.color}30`,
                borderRadius: 14, marginBottom: 10, overflow: 'hidden',
              }}>
                {/* Card header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                    background: `${master.color}0a`, cursor: 'pointer',
                    borderBottom: isExpanded ? `1px solid ${master.color}20` : 'none',
                  }}
                  onClick={() => setScaffoldExpandedId(isExpanded ? null : master.id)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${master.color}20`, fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{master.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--charcoal)' }}>{master.name}</div>
                    <div className="tiny muted" style={{ marginTop: 1 }}>
                      {master.steps.length} steps · {master.steps.reduce((a, s) => a + s.estimatedMinutes, 0)}m total
                    </div>
                  </div>
                  {activeStep && (
                    <span style={{
                      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: `${master.color}20`, color: master.color, flexShrink: 0,
                    }}>Step {activeStepIdx + 1}/{master.steps.length}</span>
                  )}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingScaffold(master); }} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--line)', background: 'var(--paper2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${master.name}"?`)) deleteScaffoldMaster(master.id); }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>

                {/* Expanded step list */}
                {isExpanded && (
                  <div style={{ padding: '10px 14px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                      {master.steps.map((step, i) => {
                        const isCurrent = i === activeStepIdx;
                        const isDone    = activeStepIdx > i;
                        return (
                          <div key={step.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '7px 10px', borderRadius: 9,
                            background: isCurrent ? `${master.color}10` : 'var(--paper2)',
                            border: `1px solid ${isCurrent ? master.color + '40' : 'var(--line)'}`,
                            opacity: isDone ? 0.45 : 1,
                          }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              background: isCurrent ? master.color : isDone ? 'var(--sage)' : 'var(--paper3)',
                              border: `2px solid ${isCurrent ? master.color : isDone ? 'var(--sage)' : 'var(--line)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {isDone
                                ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                : <span style={{ fontSize: 9, fontWeight: 700, color: isCurrent ? '#fff' : 'var(--ink-muted)' }}>{i + 1}</span>
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: 'var(--charcoal)', textDecoration: isDone ? 'line-through' : 'none' }}>
                                {step.title}
                              </div>
                            </div>
                            <span className="tiny muted">{step.estimatedMinutes}m</span>
                            {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: master.color }}>← now</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Start / in-progress button */}
                    {activeStep ? (
                      <button
                        onClick={() => { setView('tasks'); }}
                        style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1.5px solid ${master.color}`, background: `${master.color}10`, color: master.color, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                      >
                        ▶ Step {activeStepIdx + 1} in progress — view task →
                      </button>
                    ) : (
                      <button
                        onClick={() => { startScaffold(master.id); setView('tasks'); }}
                        style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: master.color, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                      >
                        ▶ Start scaffold
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
      {/* ══ TASKS VIEW ══ */}
      {view === 'tasks' && <>
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
      </>}

      </div>

      {showAdd         && <AddTaskModal onClose={() => setShowAdd(false)} />}
      {editing         && <EditTaskModal task={editing} onClose={() => setEditing(null)} onSave={(u) => updateTask(editing.id, u)} />}
      {showNewScaffold && <ScaffoldEditor onClose={() => setShowNewScaffold(false)} onSave={addScaffoldMaster} />}
      {editingScaffold && (
        <ScaffoldEditor
          master={editingScaffold}
          onClose={() => setEditingScaffold(null)}
          onSave={(data) => updateScaffoldMaster(editingScaffold.id, data)}
        />
      )}
    </div>
  );
}
