import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Appointment, LocationType, EnergyLevel, BucketTag } from '../../types';

type ApptFilter = 'all' | 'today' | 'this-week' | 'home' | 'away';

const now = () => Date.now();
const hoursUntil = (deadline: string) => (new Date(deadline).getTime() - now()) / 36e5;
const isToday    = (a: Appointment) => { const h = hoursUntil(a.deadline); return h >= 0 && h <= 24; };
const isThisWeek = (a: Appointment) => { const h = hoursUntil(a.deadline); return h >= 0 && h <= 168; };

function ApptCard({ appt, onDelete }: { appt: Appointment; onDelete: () => void }) {
  const deadline = new Date(appt.deadline);
  const h        = hoursUntil(appt.deadline);
  const isPast   = h < 0;
  const urgent   = h >= 0 && h <= 3;
  const today    = h >= 0 && h <= 24;
  const isAway   = appt.location === 'away';

  let timeLabel = '';
  if (isPast) {
    timeLabel = 'Past';
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
      background: '#fff',
      border: `1px solid ${urgent ? 'var(--danger)' : today ? '#e8d5a0' : 'var(--line)'}`,
      borderRadius: 14,
      padding: '14px',
      opacity: isPast ? 0.55 : 1,
    }}>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        {/* icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isAway ? 'var(--danger-soft)' : 'var(--sage-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isAway
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M19 17h2v-3.28a2 2 0 0 0-.59-1.42l-2.65-2.65A2 2 0 0 0 16.34 9H7.66a2 2 0 0 0-1.42.59L3.59 12.3A2 2 0 0 0 3 13.72V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage-deep)" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--charcoal)', lineHeight: 1.3, marginBottom: 5 }}>
            {appt.title}
          </div>

          {/* date/time row */}
          <div className="row" style={{ gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: urgent ? 'var(--danger)' : today ? 'var(--gold)' : 'var(--ink-soft)', fontWeight: 500 }}>
              {deadline.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>

          {/* badge row */}
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 99,
              background: urgent ? 'var(--danger-soft)' : today ? 'var(--gold-soft)' : 'var(--paper2)',
              border: `1px solid ${urgent ? '#fca5a5' : today ? '#e8d5a0' : 'var(--line)'}`,
              fontSize: '0.68rem', fontWeight: 600,
              color: urgent ? 'var(--danger)' : today ? 'var(--gold)' : 'var(--ink-muted)',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {timeLabel}
            </span>
            {isAway && <span className="badge gold">🚗 +25m travel</span>}
            {isPast && <span className="badge red">Past</span>}
            {appt.location === 'home' && <span className="badge sage">🏠 Home</span>}
          </div>

          {appt.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 7, lineHeight: 1.5 }}>{appt.description}</div>
          )}
        </div>

        <button
          onClick={onDelete}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4, flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function AppointmentsTab() {
  const appointments   = useStore((s) => s.appointments);
  const addAppointment = useStore((s) => s.addAppointment);
  const deleteAppt     = useStore((s) => s.deleteAppointment);

  const [filter, setFilter] = useState<ApptFilter>('all');
  const [showAdd, setShowAdd] = useState(false);

  const upcoming = appointments.filter((a) => hoursUntil(a.deadline) >= 0);
  const past     = appointments.filter((a) => hoursUntil(a.deadline) <  0);

  const counts: Record<ApptFilter, number> = {
    'all':       upcoming.length,
    'today':     upcoming.filter(isToday).length,
    'this-week': upcoming.filter(isThisWeek).length,
    'home':      upcoming.filter((a) => a.location === 'home').length,
    'away':      upcoming.filter((a) => a.location === 'away').length,
  };

  const visible = [...upcoming]
    .filter((a) => {
      if (filter === 'today')     return isToday(a);
      if (filter === 'this-week') return isThisWeek(a);
      if (filter === 'home')      return a.location === 'home';
      if (filter === 'away')      return a.location === 'away';
      return true;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const FILTERS: { value: ApptFilter; label: string; icon?: string }[] = [
    { value: 'all',       label: 'Upcoming'   },
    { value: 'today',     label: 'Today',     icon: '📅' },
    { value: 'this-week', label: 'This week', icon: '🗓' },
    { value: 'home',      label: 'Home',      icon: '🏠' },
    { value: 'away',      label: 'Away',      icon: '🚗' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar">
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Appointments</div>
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

      {filter !== 'all' && (
        <div className="filter-summary">
          <span>
            {visible.length === 0
              ? 'No appointments match'
              : <><strong>{visible.length}</strong> appointment{visible.length !== 1 ? 's' : ''}
                {filter === 'today'     && ' today'}
                {filter === 'this-week' && ' this week'}
                {filter === 'home'      && ' at home / virtual'}
                {filter === 'away'      && ' requiring travel'}
              </>
            }
          </span>
          <button className="filter-summary-clear" onClick={() => setFilter('all')}>Clear ×</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && past.length === 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 17, marginBottom: 6 }}>Nothing scheduled.</div>
            <div className="tiny soft">Tap Add to put something in the calendar.</div>
          </div>
        )}

        {visible.length === 0 && upcoming.length > 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 16 }}>No appointments match.</div>
            <div className="tiny soft" style={{ marginTop: 4 }}>
              <button onClick={() => setFilter('all')} style={{ color: 'var(--slate-blue-deep)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Show all {upcoming.length} →
              </button>
            </div>
          </div>
        )}

        {visible.map((a) => (
          <ApptCard key={a.id} appt={a} onDelete={() => deleteAppt(a.id)} />
        ))}

        {past.length > 0 && filter === 'all' && (
          <div style={{ marginTop: 8 }}>
            <div className="tiny mono soft" style={{ letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
              Past · {past.length}
            </div>
            {past
              .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
              .map((a) => <ApptCard key={a.id} appt={a} onDelete={() => deleteAppt(a.id)} />)
            }
          </div>
        )}
      </div>

      {showAdd && <AddApptSheet onClose={() => setShowAdd(false)} addAppointment={addAppointment} />}
    </div>
  );
}

function AddApptSheet({ onClose, addAppointment }: {
  onClose: () => void;
  addAppointment: (a: Omit<Appointment, 'id' | 'createdAt'>) => void;
}) {
  const [title,    setTitle]    = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState<LocationType>('away');
  const [energy,   setEnergy]   = useState<EnergyLevel>(2);
  const [notes,    setNotes]    = useState('');

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>NEW APPOINTMENT</div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="field">
            <label>What is it?</label>
            <input className="input" placeholder="e.g. Therapy at 2:30 PM" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Date & time</label>
            <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="field">
            <label>Location</label>
            <div className="seg">
              <button className={`seg-btn${location === 'home' ? ' active' : ''}`} onClick={() => setLocation('home')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                Home / virtual
              </button>
              <button className={`seg-btn${location === 'away' ? ' active' : ''}`} onClick={() => setLocation('away')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2v-3.28a2 2 0 0 0-.59-1.42l-2.65-2.65A2 2 0 0 0 16.34 9H7.66a2 2 0 0 0-1.42.59L3.59 12.3A2 2 0 0 0 3 13.72V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                Out / travel
              </button>
            </div>
            {location === 'away' && (
              <div className="adhd-hint" style={{ marginTop: 8 }}>
                <span className="tiny soft">Travel buffer automatically added</span>
                <span className="mono" style={{ color: 'var(--slate-blue-deep)', fontWeight: 700 }}>+25m</span>
              </div>
            )}
          </div>
          <div className="field">
            <label>Energy needed</label>
            <div className="seg">
              {([1, 2, 3] as EnergyLevel[]).map((e) => (
                <button key={e} className={`seg-btn${energy === e ? ' active' : ''}`} onClick={() => setEnergy(e)}>
                  {e === 1 ? '🟢 Easy' : e === 2 ? '🟡 Moderate' : '🔴 Heavy'}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <textarea className="input" placeholder="What to remember, bring, or prepare" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 72 }} />
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: (!title.trim() || !deadline) ? 0.35 : 1 }}
            disabled={!title.trim() || !deadline}
            onClick={() => {
              addAppointment({ title, description: notes, location, deadline, energyRequired: energy, bucketTag: 'Life' as BucketTag, completed: false });
              onClose();
            }}
          >
            Save appointment · +3 XP
          </button>
        </div>

        <button className="modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
