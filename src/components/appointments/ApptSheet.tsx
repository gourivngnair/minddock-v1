import { useState } from 'react';
import DateTimePicker from '../shared/DateTimePicker';
import type { Appointment, LocationType, EnergyLevel, BucketTag } from '../../types';

interface Props {
  appt?: Appointment;
  initialTitle?: string;
  onClose: () => void;
  onSave: (data: Omit<Appointment, 'id' | 'createdAt'>) => void;
}

const BUCKETS: BucketTag[] = ['Work', 'Life', 'Health', 'Social', 'Admin', 'Finance', 'Other'];

export default function ApptSheet({ appt, initialTitle = '', onClose, onSave }: Props) {
  const [title,    setTitle]    = useState(appt?.title ?? initialTitle);
  const [deadline, setDeadline] = useState(
    appt?.deadline ? new Date(appt.deadline).toISOString().slice(0, 16) : ''
  );
  const [location, setLocation] = useState<LocationType>(appt?.location    ?? 'away');
  const [energy,   setEnergy]   = useState<EnergyLevel>(appt?.energyRequired ?? 2);
  const [notes,    setNotes]    = useState(appt?.description ?? '');
  const [bucket,   setBucket]   = useState<BucketTag>(appt?.bucketTag ?? 'Life');

  const isEdit = !!appt;

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {isEdit ? 'Edit Appointment' : 'New Appointment'}
          </div>
        </div>

        <div className="col" style={{ gap: 14 }}>
          <div className="field">
            <label>What is it?</label>
            <input
              className="input"
              placeholder="e.g. Dentist at 2:30 PM"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <DateTimePicker value={deadline} onChange={setDeadline} />
          </div>

          <div className="field">
            <label>Location</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { v: 'home' as LocationType, icon: '🏠', label: 'Home / virtual' },
                { v: 'away' as LocationType, icon: '🚗', label: 'Out / travel' },
              ]).map((l) => (
                <button key={l.v} onClick={() => setLocation(l.v)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: location === l.v ? 'var(--slate-blue-soft)' : 'var(--paper2)',
                  border: `1.5px solid ${location === l.v ? 'var(--slate-blue)' : 'var(--line)'}`,
                  color: location === l.v ? 'var(--slate-blue-deep)' : 'var(--ink-soft)',
                  transition: 'all 0.15s',
                }}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>
            {location === 'away' && (
              <div className="row" style={{ gap: 6, marginTop: 8, padding: '7px 10px', background: 'var(--gold-soft)', borderRadius: 8, border: '1px solid #e8d5a0' }}>
                <span style={{ fontSize: 12 }}>⏰</span>
                <span className="tiny soft">Travel buffer of +25 min automatically added</span>
              </div>
            )}
          </div>

          <div className="field">
            <label>Energy needed</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { v: 1 as EnergyLevel, label: '🟢 Easy',     color: 'var(--sage)' },
                { v: 2 as EnergyLevel, label: '🟡 Moderate', color: 'var(--amber)' },
                { v: 3 as EnergyLevel, label: '🔴 Heavy',    color: 'var(--coral)' },
              ]).map((e) => (
                <button key={e.v} onClick={() => setEnergy(e.v)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: 12,
                  background: energy === e.v ? e.color : 'var(--paper2)',
                  border: `1.5px solid ${energy === e.v ? e.color : 'var(--line)'}`,
                  color: energy === e.v ? '#fff' : 'var(--ink-soft)',
                  transition: 'all 0.15s',
                }}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Category</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUCKETS.map((b) => (
                <button key={b} onClick={() => setBucket(b)} style={{
                  padding: '5px 12px', borderRadius: 99,
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                  background: bucket === b ? 'var(--slate-blue-soft)' : 'var(--paper2)',
                  border: `1.5px solid ${bucket === b ? 'var(--slate-blue)' : 'var(--line)'}`,
                  color: bucket === b ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Notes <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="input"
              placeholder="What to remember, bring, or prepare"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ minHeight: 72, resize: 'none' }}
            />
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={!title.trim() || !deadline}
            onClick={() => {
              onSave({ title, description: notes, location, deadline, energyRequired: energy, bucketTag: bucket, completed: appt?.completed ?? false });
              onClose();
            }}
          >
            {isEdit ? 'Save changes' : 'Add · +3 XP'}
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
