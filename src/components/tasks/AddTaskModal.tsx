import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Priority, EnergyLevel, LocationType, BucketTag, Recurrence } from '../../types';

interface Props { onClose: () => void; }

const BUCKETS: { value: BucketTag; color: string }[] = [
  { value: 'Work',    color: 'var(--slate-blue)' },
  { value: 'Life',    color: 'var(--sage)' },
  { value: 'Health',  color: 'var(--coral)' },
  { value: 'Social',  color: 'var(--lavender)' },
  { value: 'Admin',   color: 'var(--gold)' },
  { value: 'Finance', color: 'var(--teal)' },
  { value: 'Other',   color: 'var(--ink-muted)' },
];

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'once',          label: 'Once' },
  { value: 'daily',         label: 'Daily' },
  { value: 'alternate-days',label: 'Alternate days' },
  { value: 'weekly',        label: 'Weekly' },
  { value: 'biweekly',      label: 'Biweekly' },
  { value: 'monthly',       label: 'Monthly' },
  { value: 'quarterly',     label: 'Quarterly' },
];

export default function AddTaskModal({ onClose }: Props) {
  const addTask = useStore((s) => s.addTask);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 2 as Priority,
    energyRequired: 2 as EnergyLevel,
    location: 'home' as LocationType,
    deadline: '',
    userEstimatedTime: 15,
    waitingOn: '',
    bucketTag: 'Life' as BucketTag,
    recurrence: 'once' as Recurrence,
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addTask({
      ...form,
      deadline: form.deadline || undefined,
      waitingOn: form.waitingOn || undefined,
      isScaffolded: false,
      completed: false,
      completedViaFocus: false,
    });
    onClose();
  };

  const patch = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const divider = <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0 6px' }} />;

  return (
    <div
      className="modal-back fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        <div className="sheet-grip" />

        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>New Task</div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Title *</label>
          <input
            className="input"
            placeholder="What needs to get done?"
            value={form.title}
            onChange={(e) => patch('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Description <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            className="input"
            placeholder="Any notes on the 'how'…"
            style={{ minHeight: 72, resize: 'none', lineHeight: 1.55 }}
            value={form.description}
            onChange={(e) => patch('description', e.target.value)}
          />
        </div>

        {divider}

        {/* Bucket picker */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" style={{ marginBottom: 8, display: 'block' }}>Category</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BUCKETS.map((b) => (
              <button
                key={b.value}
                onClick={() => patch('bucketTag', b.value)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: `1.5px solid ${form.bucketTag === b.value ? b.color : 'var(--line)'}`,
                  background: form.bucketTag === b.value ? `${b.color}18` : 'var(--paper2)',
                  color: form.bucketTag === b.value ? b.color : 'var(--ink-muted)',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {b.value}
              </button>
            ))}
          </div>
        </div>

        {divider}

        {/* Priority + Energy */}
        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([1, 2, 3] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => patch('priority', p)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 600, fontSize: 13,
                    background: form.priority === p ? 'var(--charcoal)' : 'var(--paper2)',
                    border: `1.5px solid ${form.priority === p ? 'var(--charcoal)' : 'var(--line)'}`,
                    color: form.priority === p ? '#fff' : 'var(--ink-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p === 1 ? '↓' : p === 2 ? '→' : '↑'}
                </button>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 4, textAlign: 'center' }}>
              {form.priority === 1 ? 'Low' : form.priority === 2 ? 'Medium' : 'High'}
            </div>
          </div>

          <div className="field" style={{ flex: 1 }}>
            <label>Energy cost</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { v: 1 as EnergyLevel, label: 'Easy',   color: 'var(--sage)' },
                { v: 2 as EnergyLevel, label: 'Mod',    color: 'var(--amber)' },
                { v: 3 as EnergyLevel, label: 'Heavy',  color: 'var(--coral)' },
              ]).map((e) => (
                <button
                  key={e.v}
                  onClick={() => patch('energyRequired', e.v)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 700, fontSize: 11,
                    background: form.energyRequired === e.v ? e.color : 'var(--paper2)',
                    border: `1.5px solid ${form.energyRequired === e.v ? e.color : 'var(--line)'}`,
                    color: form.energyRequired === e.v ? '#fff' : 'var(--ink-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time + Location */}
        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Est. time (min)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.userEstimatedTime}
              onChange={(e) => patch('userEstimatedTime', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Location</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['home', 'away'] as LocationType[]).map((l) => (
                <button
                  key={l}
                  onClick={() => patch('location', l)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    background: form.location === l ? 'var(--slate-blue-soft)' : 'var(--paper2)',
                    border: `1.5px solid ${form.location === l ? 'var(--slate-blue)' : 'var(--line)'}`,
                    color: form.location === l ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {l === 'home' ? '🏠 Home' : '🚗 Away'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recurrence */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Recurrence</label>
          <select
            className="input"
            value={form.recurrence}
            onChange={(e) => patch('recurrence', e.target.value as Recurrence)}
          >
            {RECURRENCES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {divider}

        {/* Deadline */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Deadline <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            className="input"
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => patch('deadline', e.target.value)}
          />
        </div>

        {/* Waiting on */}
        <div className="field" style={{ marginBottom: 20 }}>
          <label>Waiting on <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            className="input"
            placeholder="Who or what is blocking this?"
            value={form.waitingOn}
            onChange={(e) => patch('waitingOn', e.target.value)}
          />
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            Add Task
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
