import { useState } from 'react';
import DateTimePicker from '../shared/DateTimePicker';
import type { Task, Priority, EnergyLevel, LocationType, BucketTag, Recurrence } from '../../types';

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}

const BUCKETS: { value: BucketTag; color: string }[] = [
  { value: 'Work',    color: 'var(--slate-blue)' },
  { value: 'Life',    color: 'var(--sage)' },
  { value: 'Health',  color: 'var(--coral)' },
  { value: 'Social',  color: 'var(--lavender)' },
  { value: 'Admin',   color: 'var(--gold)' },
  { value: 'Finance', color: 'var(--teal)' },
  { value: 'Other',   color: 'var(--ink-muted)' },
];

const PRI_COLORS: Record<Priority, string> = { 1: 'var(--ink-muted)', 2: 'var(--amber)', 3: 'var(--danger)' };
const PRI_LABELS: Record<Priority, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
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

export default function EditTaskModal({ task, onClose, onSave }: Props) {
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
  const [showWaiting, setShowWaiting] = useState(!!task.waitingOn);

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
            <div className="tiny muted" style={{ marginTop: 3, textAlign: 'center' }}>{PRI_LABELS[priority]}</div>
          </div>

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
            <div className="tiny muted" style={{ marginTop: 3, textAlign: 'center' }}>{E_LABELS[energy]}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Est. time (min)</label>
            <input className="input" type="number" min={1} value={estTime}
              onChange={(e) => setEstTime(parseInt(e.target.value) || 1)} />
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
                }}>{l === 'home' ? '🏠' : '🚗'}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Recurrence</label>
          <select className="input" value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
            {RECURRENCES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {divider}

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Deadline <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <DateTimePicker value={deadline} onChange={setDeadline} timeOptional />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: showWaiting ? 6 : 0 }}>
            <label style={{ marginBottom: 0 }}>Waiting on</label>
            <button
              onClick={() => { setShowWaiting(v => !v); if (showWaiting) setWaitingOn(''); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: showWaiting ? 'var(--danger)' : 'var(--slate-blue-deep)', padding: 0 }}
            >
              {showWaiting ? 'Remove' : '+ Blocked by someone'}
            </button>
          </div>
          {showWaiting && (
            <input className="input" placeholder="Who or what is blocking this?"
              value={waitingOn} onChange={(e) => setWaitingOn(e.target.value)} autoFocus />
          )}
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
