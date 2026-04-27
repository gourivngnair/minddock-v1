import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Task, Appointment } from '../../types';

/* ── helpers ── */
function getCalendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const pad   = first.getDay(); // 0=Sun
  const days: Date[] = [];
  for (let i = pad; i > 0; i--)        days.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0)        days.push(new Date(year, month + 1, days.length - last.getDate() - pad + 1));
  return days;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()         === b.getMonth()    &&
    a.getDate()          === b.getDate();
}

const WEEKDAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ── sub-components ── */
function ApptRow({ appt }: { appt: Appointment }) {
  const t = new Date(appt.deadline);
  return (
    <div className="cal-event-row" style={{ border: '1px solid #e8d5a0' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>{appt.title}</div>
        <div className="tiny soft" style={{ marginTop: 3 }}>
          {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {appt.location === 'away' && <span style={{ marginLeft: 6 }}>🚗 +25m travel</span>}
        </div>
        {appt.description && <div className="tiny muted" style={{ marginTop: 2 }}>{appt.description}</div>}
      </div>
      <span className="badge gold" style={{ flexShrink: 0, marginTop: 2 }}>Appt</span>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const t        = new Date(task.deadline!);
  const overdue  = t < new Date();
  return (
    <div className="cal-event-row" style={{ border: `1px solid ${overdue ? '#fca5a5' : 'var(--line)'}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--slate-blue)', flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>{task.title}</div>
        <div className="row" style={{ gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span className="tiny soft">Due {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <span className="tiny muted">·</span>
          <span className="tiny mono soft">{task.appRecommendedTime}m</span>
          {overdue && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 600 }}>Overdue</span>}
        </div>
      </div>
      <span className={`badge ${overdue ? 'red' : 'slate'}`} style={{ flexShrink: 0, marginTop: 2 }}>Task</span>
    </div>
  );
}

/* ── main ── */
export default function CalendarTab() {
  const tasks        = useStore((s) => s.tasks);
  const appointments = useStore((s) => s.appointments);

  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate]         = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calDays = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday   = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today));
  };

  const tasksOnDay  = (d: Date) => tasks.filter((t) => !t.completed && t.deadline && sameDay(new Date(t.deadline), d));
  const apptsOnDay  = (d: Date) => appointments.filter((a) => sameDay(new Date(a.deadline), d));

  const selTasks = tasksOnDay(selectedDate).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  const selAppts = apptsOnDay(selectedDate).sort((a, b) => new Date(a.deadline).getTime()  - new Date(b.deadline).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* header */}
      <div className="topbar">
        <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Calendar</div>
        <button
          onClick={goToday}
          style={{ padding: '6px 14px', borderRadius: 8, background: sameDay(selectedDate, today) ? 'var(--charcoal)' : 'var(--paper2)', border: `1px solid ${sameDay(selectedDate, today) ? 'var(--charcoal)' : 'var(--line)'}`, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: sameDay(selectedDate, today) ? '#fff' : 'var(--ink-soft)', transition: 'all 0.15s' }}
        >
          Today
        </button>
      </div>

      {/* month nav */}
      <div className="cal-month-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="serif" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.015em' }}>
          {MONTHS[month]} {year}
        </div>
        <button className="cal-nav-btn" onClick={nextMonth}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* weekday headers */}
      <div className="cal-weekdays">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className={`cal-weekday${i === 0 || i === 6 ? ' weekend' : ''}`}>
            {d.charAt(0)}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="cal-grid">
        {calDays.map((day, i) => {
          const tList  = tasksOnDay(day);
          const aList  = apptsOnDay(day);
          const total  = tList.length + aList.length;
          const overflow = Math.max(0, total - 3);
          const dots = [...aList.map(() => 'appt'), ...tList.map(() => 'task')].slice(0, 3);

          const isOther    = day.getMonth() !== month;
          const isTodayDay = sameDay(day, today);
          const isSel      = sameDay(day, selectedDate);

          return (
            <button
              key={i}
              className={`cal-day${isTodayDay ? ' today' : ''}${isSel ? ' selected' : ''}${isOther ? ' other-month' : ''}`}
              onClick={() => { if (!isOther) setSelectedDate(new Date(day)); }}
            >
              <div className="cal-day-num">{day.getDate()}</div>
              {total > 0 && (
                <div className="cal-dots">
                  {dots.map((type, j) => <div key={j} className={`cal-dot ${type}`} />)}
                  {overflow > 0 && <span className="cal-overflow">+{overflow}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div className="row" style={{ gap: 14, padding: '8px 18px 6px', borderTop: '1px solid var(--line-soft)' }}>
        <div className="row" style={{ gap: 5 }}>
          <div className="cal-dot appt" style={{ width: 7, height: 7 }} />
          <span className="tiny muted">Appointment</span>
        </div>
        <div className="row" style={{ gap: 5 }}>
          <div className="cal-dot task" style={{ width: 7, height: 7 }} />
          <span className="tiny muted">Task deadline</span>
        </div>
      </div>

      {/* selected day panel */}
      <div className="cal-panel">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {selAppts.length + selTasks.length > 0 ? (
              <div className="tiny muted" style={{ marginTop: 2 }}>
                {selAppts.length > 0 && `${selAppts.length} appointment${selAppts.length > 1 ? 's' : ''}`}
                {selAppts.length > 0 && selTasks.length > 0 && ' · '}
                {selTasks.length > 0 && `${selTasks.length} task${selTasks.length > 1 ? 's' : ''} due`}
              </div>
            ) : (
              <div className="tiny muted" style={{ marginTop: 2 }}>Nothing scheduled</div>
            )}
          </div>
          {isSameDay(selectedDate, today) && <span className="badge slate">Today</span>}
        </div>

        {selAppts.length === 0 && selTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>📭</div>
            <div className="tiny">Nothing here — enjoy the space.</div>
          </div>
        )}

        {selAppts.map((a)  => <ApptRow key={a.id} appt={a} />)}
        {selTasks.map((t)  => <TaskRow key={t.id} task={t} />)}
      </div>
    </div>
  );
}

// needed at module level since it's used inside JSX but not imported
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()         === b.getMonth()    &&
    a.getDate()          === b.getDate();
}
