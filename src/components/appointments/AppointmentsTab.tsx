import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Appointment, LocationType, EnergyLevel, BucketTag } from '../../types';

type ApptFilter = 'all' | 'today' | 'this-week' | 'past' | 'home' | 'away';

const hoursUntil = (deadline: string) => (new Date(deadline).getTime() - Date.now()) / 36e5;
const isToday    = (a: Appointment) => { const h = hoursUntil(a.deadline); return h >= -24 && h <= 24; };
const isThisWeek = (a: Appointment) => { const h = hoursUntil(a.deadline); return h >= 0 && h <= 168; };

/* ── Edit / Add sheet ── */
function ApptSheet({ appt, onClose, onSave }: {
  appt?: Appointment;
  onClose: () => void;
  onSave: (data: Omit<Appointment, 'id' | 'createdAt'>) => void;
}) {
  const [title,    setTitle]    = useState(appt?.title    ?? '');
  const [deadline, setDeadline] = useState(
    appt?.deadline
      ? new Date(appt.deadline).toISOString().slice(0, 16)
      : ''
  );
  const [location, setLocation] = useState<LocationType>(appt?.location ?? 'away');
  const [energy,   setEnergy]   = useState<EnergyLevel>(appt?.energyRequired ?? 2);
  const [notes,    setNotes]    = useState(appt?.description ?? '');
  const [bucket,   setBucket]   = useState<BucketTag>(appt?.bucketTag ?? 'Life');

  const isEdit = !!appt;

  const BUCKETS: BucketTag[] = ['Work', 'Life', 'Health', 'Social', 'Admin', 'Finance', 'Other'];

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
            <label>Date &amp; time</label>
            <input
              className="input"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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

/* ── Card ── */
function ApptCard({ appt, onEdit, onDelete }: {
  appt: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deadline = new Date(appt.deadline);
  const h        = hoursUntil(appt.deadline);
  const isPast   = h < 0;
  const urgent   = h >= 0 && h <= 3;
  const today    = Math.abs(h) <= 24;

  let timeLabel = '';
  if (isPast) {
    const ago = Math.abs(h);
    timeLabel = ago < 1 ? `${Math.round(ago * 60)}m ago` : ago < 24 ? `${Math.round(ago)}h ago` : `${Math.floor(ago / 24)}d ago`;
  } else if (h < 1) {
    timeLabel = `${Math.round(h * 60)}m away`;
  } else if (h < 24) {
    timeLabel = `${Math.round(h)}h away`;
  } else {
    const days = Math.floor(h / 24);
    timeLabel = days === 1 ? 'Tomorrow' : `In ${days} days`;
  }

  return (
    <div style={{
      background: isPast ? 'var(--paper2)' : '#fff',
      border: `1px solid ${urgent ? 'var(--danger)' : today ? '#e8d5a0' : isPast ? 'var(--line-soft)' : 'var(--line)'}`,
      borderLeft: `3px solid ${urgent ? 'var(--danger)' : today && !isPast ? 'var(--gold)' : isPast ? 'var(--ink-muted)' : 'var(--slate-blue)'}`,
      borderRadius: 14,
      padding: '14px',
    }}>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        {/* icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isPast ? 'var(--paper3)' : appt.location === 'away' ? 'var(--coral-soft)' : 'var(--sage-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {appt.location === 'away'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPast ? 'var(--ink-muted)' : 'var(--coral)'} strokeWidth="2"><path d="M19 17h2v-3.28a2 2 0 0 0-.59-1.42l-2.65-2.65A2 2 0 0 0 16.34 9H7.66a2 2 0 0 0-1.42.59L3.59 12.3A2 2 0 0 0 3 13.72V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPast ? 'var(--ink-muted)' : 'var(--sage-deep)'} strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: isPast ? 'var(--ink-muted)' : 'var(--charcoal)', lineHeight: 1.3, marginBottom: 5 }}>
            {appt.title}
          </div>

          <div className="row" style={{ gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: urgent ? 'var(--danger)' : isPast ? 'var(--ink-muted)' : today ? 'var(--gold)' : 'var(--ink-soft)', fontWeight: 500 }}>
              {deadline.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>

          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 99,
              background: isPast ? 'var(--paper3)' : urgent ? 'var(--danger-soft)' : today ? 'var(--gold-soft)' : 'var(--paper2)',
              border: `1px solid ${isPast ? 'var(--line)' : urgent ? '#fca5a5' : today ? '#e8d5a0' : 'var(--line)'}`,
              fontSize: '0.68rem', fontWeight: 600,
              color: isPast ? 'var(--ink-muted)' : urgent ? 'var(--danger)' : today ? 'var(--gold)' : 'var(--ink-muted)',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {timeLabel}
            </span>
            {appt.location === 'away' && !isPast && <span className="badge gold">🚗 +25m</span>}
            {isPast && <span className="badge" style={{ background: 'var(--paper3)', color: 'var(--ink-muted)' }}>Past</span>}
            {appt.location === 'home' && !isPast && <span className="badge sage">🏠 Home</span>}
          </div>

          {appt.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 7, lineHeight: 1.5 }}>{appt.description}</div>
          )}
        </div>

        {/* Actions */}
        <div className="col" style={{ gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={onEdit}
            title="Edit appointment"
            style={{ background: 'var(--paper2)', border: '1px solid var(--line)', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)', transition: 'all 0.15s' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Delete appointment"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsTab() {
  const appointments     = useStore((s) => s.appointments);
  const addAppointment   = useStore((s) => s.addAppointment);
  const updateAppt       = useStore((s) => s.updateAppointment);
  const deleteAppt       = useStore((s) => s.deleteAppointment);

  const [filter,   setFilter]   = useState<ApptFilter>('all');
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState<Appointment | null>(null);

  const upcoming = appointments.filter((a) => hoursUntil(a.deadline) >= 0);
  const past     = appointments.filter((a) => hoursUntil(a.deadline) < 0);

  const counts: Record<ApptFilter, number> = {
    'all':       appointments.length,
    'today':     appointments.filter(isToday).length,
    'this-week': upcoming.filter(isThisWeek).length,
    'past':      past.length,
    'home':      appointments.filter((a) => a.location === 'home').length,
    'away':      appointments.filter((a) => a.location === 'away').length,
  };

  const visible = [...appointments]
    .filter((a) => {
      if (filter === 'today')     return isToday(a);
      if (filter === 'this-week') return isThisWeek(a);
      if (filter === 'past')      return hoursUntil(a.deadline) < 0;
      if (filter === 'home')      return a.location === 'home';
      if (filter === 'away')      return a.location === 'away';
      return true;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const FILTERS: { value: ApptFilter; label: string; icon?: string }[] = [
    { value: 'all',       label: 'All'       },
    { value: 'today',     label: 'Today',     icon: '📅' },
    { value: 'this-week', label: 'This week', icon: '🗓' },
    { value: 'past',      label: 'Past',      icon: '🕐' },
    { value: 'home',      label: 'Home',      icon: '🏠' },
    { value: 'away',      label: 'Away',      icon: '🚗' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar">
        <div>
          <div className="kicker">Schedule</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>Appointments</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{upcoming.length} upcoming · {past.length} past</div>
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 17, marginBottom: 6 }}>
              {filter === 'all' ? 'Nothing scheduled.' : 'No appointments match.'}
            </div>
            <div className="tiny soft">
              {filter === 'all'
                ? 'Tap Add to put something in the calendar.'
                : <button onClick={() => setFilter('all')} style={{ color: 'var(--slate-blue-deep)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Show all →</button>
              }
            </div>
          </div>
        )}
        {visible.map((a) => (
          <ApptCard
            key={a.id}
            appt={a}
            onEdit={() => setEditing(a)}
            onDelete={() => deleteAppt(a.id)}
          />
        ))}
      </div>

      {showAdd && (
        <ApptSheet
          onClose={() => setShowAdd(false)}
          onSave={(data) => addAppointment(data)}
        />
      )}
      {editing && (
        <ApptSheet
          appt={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateAppt(editing.id, data)}
        />
      )}
    </div>
  );
}
