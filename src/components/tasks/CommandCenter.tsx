import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { Priority, EnergyLevel, BucketTag } from '../../types';

interface Props { onClose: () => void; }

type Path = null | 'task' | 'journal' | 'appointment';
type TaskAction = null | 'overlay' | 'delegate';  // 'delegate' = show the name form

const TIME_OPTS = [5, 10, 15, 30, 45, 60, 90];

export default function CommandCenter({ onClose }: Props) {
  const addTask         = useStore((s) => s.addTask);
  const addJournalEntry = useStore((s) => s.addJournalEntry);
  const addAppointment  = useStore((s) => s.addAppointment);
  const startFocus      = useStore((s) => s.startFocus);
  const setScreen       = useStore((s) => s.setScreen);
  const multiplierB     = useStore((s) => s.user?.multiplierB ?? 1.5);

  const [path, setPath]           = useState<Path>(null);
  const [taskAction, setTaskAction] = useState<TaskAction>(null);
  const [title, setTitle]         = useState('');
  const [est, setEst]             = useState(15);
  const [priority, setPriority]   = useState<Priority>(2);
  const [energy, setEnergy]       = useState<EnergyLevel>(2);
  const [bucket]                  = useState<BucketTag>('Life');
  const [location, setLocation]   = useState<'home' | 'away'>('home');
  const [deadline, setDeadline]   = useState('');
  const [showDeadline, setShowDeadline] = useState(false);
  const [journal, setJournal]     = useState('');
  const [aptTitle, setAptTitle]   = useState('');
  const [delegateTo, setDelegateTo] = useState('');

  useEffect(() => {
    setPath(null); setTaskAction(null); setTitle(''); setJournal('');
    setAptTitle(''); setDeadline(''); setShowDeadline(false); setDelegateTo('');
  }, []);

  // Use real multiplierB so the preview matches what actually gets stored
  const adjusted = (mins: number) => Math.round(mins * multiplierB);

  const taskPayload = () => ({
    title, description: '', priority, energyRequired: energy,
    location: 'home' as const, userEstimatedTime: est, bucketTag: bucket,
    recurrence: 'once' as const, isScaffolded: false, completed: false,
    completedViaFocus: false,
    ...(deadline ? { deadline } : {}),
  });

  const doNow = () => {
    addTask(taskPayload());
    setTimeout(() => {
      const tasks = useStore.getState().tasks;
      const last = tasks[tasks.length - 1];
      if (last) { startFocus(last.id); setScreen('focus'); }
    }, 50);
    onClose();
  };

  const doLater = () => { addTask(taskPayload()); onClose(); };

  const doDelegate = () => {
    addTask({ ...taskPayload(), priority: 1, energyRequired: 1, waitingOn: delegateTo.trim() || undefined });
    onClose();
  };

  return (
    <div className="modal-back fade-in" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />

        {/* ── Root path selection ── */}
        {!path && (
          <>
            <div style={{ textAlign: 'center', padding: '4px 4px 18px' }}>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>BRAIN DUMP</div>
              <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginTop: 4, letterSpacing: '-0.025em' }}>What's in there?</div>
            </div>
            <div className="col" style={{ gap: 10 }}>
              {[
                { key: 'task', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, bg: 'var(--slate-blue-soft)', color: 'var(--slate-blue-deep)', title: 'Task', sub: 'Something to do, eventually or now' },
                { key: 'journal', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, bg: 'var(--sage-soft)', color: 'var(--sage-deep)', title: 'Journal', sub: 'A feeling, a thought, a worry — held safely' },
                { key: 'appointment', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, bg: 'var(--gold-soft)', color: 'var(--gold)', title: 'Appointment', sub: 'Something at a time. We\'ll buffer travel.' },
              ].map((item) => (
                <button key={item.key} className="path-btn" onClick={() => setPath(item.key as Path)}>
                  <div className="path-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</div>
                    <div className="tiny soft" style={{ marginTop: 2 }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Task form ── */}
        {path === 'task' && !taskAction && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn-ghost small" onClick={() => setPath(null)}>← Back</button>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>NEW TASK</div>
            </div>
            <div className="col" style={{ gap: 16 }}>
              <div className="field">
                <label>What is it?</label>
                <input className="input" placeholder="e.g. Email landlord about leak" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              </div>

              <div className="field">
                <label>How long, in your head?</label>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {TIME_OPTS.map((n) => (
                    <button key={n} className={`mini-chip${est === n ? ' active' : ''}`} onClick={() => setEst(n)}>{n}m</button>
                  ))}
                </div>
                <div className="adhd-hint">
                  <span className="row" style={{ gap: 6, fontSize: '0.78rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
                    ADHD-adjusted ({multiplierB.toFixed(2)}×)
                  </span>
                  <span className="mono" style={{ color: 'var(--slate-blue-deep)', fontWeight: 700 }}>~{adjusted(est)}m</span>
                </div>
              </div>

              <div className="field">
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ marginBottom: 0 }}>Deadline</label>
                  <button
                    onClick={() => { setShowDeadline((v) => !v); if (showDeadline) setDeadline(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: showDeadline ? 'var(--danger)' : 'var(--slate-blue-deep)', padding: 0 }}
                  >
                    {showDeadline ? 'Remove' : '+ Set deadline'}
                  </button>
                </div>
                {showDeadline
                  ? <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} autoFocus />
                  : <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', paddingTop: 4 }}>Optional — adds urgency scoring and shows on the calendar.</div>
                }
              </div>

              <div className="field">
                <label>Priority</label>
                <div className="seg">
                  {([1, 2, 3] as Priority[]).map((p) => (
                    <button key={p} className={`seg-btn${priority === p ? ' active' : ''}`} onClick={() => setPriority(p)}>
                      {p === 1 ? 'Low' : p === 2 ? 'Medium' : 'High'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Energy cost</label>
                <div className="seg">
                  {([1, 2, 3] as EnergyLevel[]).map((e) => (
                    <button key={e} className={`seg-btn${energy === e ? ' active' : ''}`} onClick={() => setEnergy(e)}>
                      {e === 1 ? '🟢 Easy' : e === 2 ? '🟡 Moderate' : '🔴 Heavy'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={!title.trim()} style={{ marginTop: 18 }} onClick={() => setTaskAction('overlay')}>
              Continue
            </button>
          </>
        )}

        {/* ── Task action picker ── */}
        {path === 'task' && taskAction === 'overlay' && (
          <>
            <div style={{ textAlign: 'center', padding: '4px 4px 14px' }}>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>WHAT NOW WITH</div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 4, letterSpacing: '-0.025em', padding: '0 16px', lineHeight: 1.2 }}>
                "{title}"
              </div>
            </div>
            <div className="col" style={{ gap: 10 }}>
              <button className="action-btn now" onClick={doNow}>
                <div className="action-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Do now</div>
                  <div className="tiny" style={{ opacity: 0.8, marginTop: 2 }}>Launches focus mode. Timer starts.</div>
                </div>
              </button>
              <button className="action-btn postpone" onClick={doLater}>
                <div className="action-icon" style={{ background: 'rgba(52,81,214,0.12)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Add to list</div>
                  <div className="tiny soft" style={{ marginTop: 2 }}>Save for when energy fits.</div>
                </div>
              </button>
              {/* Delegate: tap to go to the name-entry step */}
              <button className="action-btn delegate" onClick={() => setTaskAction('delegate')}>
                <div className="action-icon" style={{ background: 'rgba(184,138,44,0.12)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Delegate</div>
                  <div className="tiny soft" style={{ marginTop: 2 }}>Mark "Waiting on" — out of your hands.</div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── Delegate name form (step 3) ── */}
        {path === 'task' && taskAction === 'delegate' && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn-ghost small" onClick={() => setTaskAction('overlay')}>← Back</button>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>DELEGATE</div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.3, color: 'var(--charcoal)', padding: '0 8px' }}>
                "{title}"
              </div>
              <div className="tiny muted" style={{ marginTop: 6 }}>This will be marked as waiting on someone else.</div>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Who are you delegating to?</label>
              <input
                className="input"
                placeholder="e.g. Alex, the team, my accountant…"
                value={delegateTo}
                onChange={(e) => setDelegateTo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doDelegate()}
                autoFocus
              />
              <div className="tiny muted" style={{ marginTop: 6 }}>Optional — leave blank to just mark it as blocked.</div>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={doDelegate}
            >
              {delegateTo.trim() ? `Delegate to ${delegateTo.trim()}` : 'Mark as waiting on someone'}
            </button>
          </>
        )}

        {/* ── Journal ── */}
        {path === 'journal' && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <button className="btn-ghost small" onClick={() => setPath(null)}>← Back</button>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>JOURNAL</div>
            </div>
            <p className="soft" style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>
              Park it here. We won't make it a task unless you ask.
            </p>
            <textarea className="input" rows={6} placeholder="What's loud right now?" value={journal} onChange={(e) => setJournal(e.target.value)} style={{ minHeight: 140 }} autoFocus />
            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 14 }}
              disabled={!journal.trim()}
              onClick={() => { addJournalEntry({ mood: 'okay', entryText: journal }); onClose(); }}
            >
              Park it
            </button>
          </>
        )}

        {/* ── Appointment ── */}
        {path === 'appointment' && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <button className="btn-ghost small" onClick={() => setPath(null)}>← Back</button>
              <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>APPOINTMENT</div>
            </div>
            <div className="col" style={{ gap: 14 }}>
              <div className="field">
                <label>What's the appointment?</label>
                <input className="input" placeholder="e.g. Therapy, 2:30 PM" value={aptTitle} onChange={(e) => setAptTitle(e.target.value)} autoFocus />
              </div>
              <div className="field">
                <label>Date &amp; time</label>
                <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="field">
                <label>Where</label>
                <div className="seg">
                  <button className={`seg-btn${location === 'home' ? ' active' : ''}`} onClick={() => setLocation('home')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    Home / virtual
                  </button>
                  <button className={`seg-btn${location === 'away' ? ' active' : ''}`} onClick={() => setLocation('away')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2v-3.28a2 2 0 0 0-.59-1.42l-2.65-2.65A2 2 0 0 0 16.34 9H7.66a2 2 0 0 0-1.42.59L3.59 12.3A2 2 0 0 0 3 13.72V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                    Out / travel
                  </button>
                </div>
                {location === 'away' && (
                  <div className="adhd-hint" style={{ marginTop: 10 }}>
                    <span className="row" style={{ gap: 6, fontSize: '0.78rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2v-3.28a2 2 0 0 0-.59-1.42l-2.65-2.65A2 2 0 0 0 16.34 9H7.66a2 2 0 0 0-1.42.59L3.59 12.3A2 2 0 0 0 3 13.72V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                      Travel buffer added
                    </span>
                    <span className="mono" style={{ color: 'var(--slate-blue-deep)', fontWeight: 700 }}>+25m</span>
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 18 }}
              disabled={!aptTitle.trim() || !deadline}
              onClick={() => {
                addAppointment({ title: aptTitle, description: '', location, deadline, energyRequired: 2, bucketTag: 'Life', completed: false });
                onClose();
              }}
            >
              Save appointment
            </button>
          </>
        )}

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
