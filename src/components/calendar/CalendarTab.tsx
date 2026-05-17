import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Task, Appointment } from '../../types';

/* ── helpers ── */
function getCalendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const pad   = first.getDay();
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

const MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];
const DAY_INITIALS = ['S','M','T','W','T','F','S'];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/* ── Detail panel event rows ── */
function ApptRow({ appt }: { appt: Appointment }) {
  const t = new Date(appt.deadline);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '11px 0',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--gold)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.3 }}>{appt.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
          <span className="mono">{t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          {appt.location === 'away' && <span>🚗 +25m</span>}
          {appt.description && <span style={{ color: 'var(--ink-muted)' }}>· {truncate(appt.description, 28)}</span>}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--gold-soft)', color: 'var(--ochre-deep)', letterSpacing: '0.04em', flexShrink: 0, marginTop: 1 }}>APPT</span>
    </div>
  );
}

function TaskDetailRow({ task }: { task: Task }) {
  const t       = new Date(task.deadline!);
  const overdue = t < new Date();
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '11px 0',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: overdue ? 'var(--danger)' : 'var(--accent)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: overdue ? 'var(--danger)' : 'var(--charcoal)', lineHeight: 1.3 }}>{task.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
          <span>Due {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <span className="mono">~{task.appRecommendedTime}m</span>
          {overdue && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Overdue</span>}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: overdue ? 'var(--danger-soft)' : 'var(--accent-soft)', color: overdue ? 'var(--danger)' : 'var(--accent-deep)', letterSpacing: '0.04em', flexShrink: 0, marginTop: 1 }}>TASK</span>
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

  const tasksOnDay = (d: Date) => tasks.filter((t) => !t.completed && t.deadline && sameDay(new Date(t.deadline), d));
  const apptsOnDay = (d: Date) => appointments.filter((a) => sameDay(new Date(a.deadline), d));

  const selTasks = tasksOnDay(selectedDate).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  const selAppts = apptsOnDay(selectedDate).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const hasEvents = selTasks.length + selAppts.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div>
          <div className="kicker">{MONTHS[month]} {year}</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>Calendar</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={navBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={goToday}
            style={{ padding: '5px 12px', borderRadius: 7, background: sameDay(selectedDate, today) ? 'var(--charcoal)' : 'transparent', border: `1px solid ${sameDay(selectedDate, today) ? 'var(--charcoal)' : 'var(--line)'}`, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: sameDay(selectedDate, today) ? '#fff' : 'var(--ink-soft)', transition: 'all 0.15s' }}
          >
            Today
          </button>
          <button onClick={nextMonth} style={navBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Day-of-week header ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1.5px solid var(--charcoal)',
        background: '#fff',
        flexShrink: 0,
      }}>
        {DAY_INITIALS.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            padding: '6px 0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--accent-deep)' : 'var(--ink-muted)',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Jibun Techo grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${calDays.length / 7}, 1fr)`,
        flex: 1,
        overflow: 'hidden',
        borderLeft: '1px solid var(--line)',
        background: 'var(--line)',
        gap: '1px',
      }}>
        {calDays.map((day, i) => {
          const appts   = apptsOnDay(day);
          const tdTasks = tasksOnDay(day);
          const events  = [
            ...appts.map(a  => ({ label: truncate(a.title, 12), type: 'appt' as const })),
            ...tdTasks.map(t => ({ label: truncate(t.title, 12), type: 'task' as const })),
          ];
          const shown    = events.slice(0, 2);
          const overflow = events.length - shown.length;

          const isOther   = day.getMonth() !== month;
          const isToday   = sameDay(day, today);
          const isSel     = sameDay(day, selectedDate);
          const isSun     = day.getDay() === 0;
          const isSat     = day.getDay() === 6;

          return (
            <button
              key={i}
              onClick={() => { if (!isOther) setSelectedDate(new Date(day)); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '4px 4px 3px',
                background: isSel && !isOther ? 'var(--accent-paper)' : '#fff',
                cursor: isOther ? 'default' : 'pointer',
                border: 'none',
                textAlign: 'left',
                gap: 2,
                overflow: 'hidden',
                opacity: isOther ? 0.25 : 1,
                transition: 'background 0.12s',
                minHeight: 0,
              }}
            >
              {/* Date number */}
              <div style={{
                width: 22, height: 22,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                background: isToday ? 'var(--charcoal)' : isSel && !isOther ? 'var(--accent-deep)' : 'transparent',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: isToday || isSel ? 700 : 500,
                color: isToday || isSel ? '#fff'
                     : isSun ? 'var(--danger)'
                     : isSat ? 'var(--accent-deep)'
                     : 'var(--charcoal)',
                letterSpacing: 0,
              }}>
                {day.getDate()}
              </div>

              {/* Inline events */}
              {shown.map((ev, j) => (
                <div key={j} style={{
                  width: '100%',
                  fontSize: 9,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  padding: '1px 4px',
                  borderRadius: 3,
                  background: ev.type === 'appt' ? 'var(--gold-soft)' : 'var(--accent-soft)',
                  color: ev.type === 'appt' ? 'var(--ochre-deep)' : 'var(--accent-deep)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  letterSpacing: 0,
                }}>
                  {ev.label}
                </div>
              ))}
              {overflow > 0 && (
                <div style={{
                  fontSize: 9, fontWeight: 700,
                  color: 'var(--ink-faint)',
                  fontFamily: "'JetBrains Mono', monospace",
                  paddingLeft: 2,
                }}>
                  +{overflow}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 14, padding: '6px 16px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold-soft)', border: '1px solid var(--gold)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 500 }}>Appointment</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontWeight: 500 }}>Task deadline</span>
        </div>
      </div>

      {/* ── Selected day detail ── */}
      <div style={{
        borderTop: '1.5px solid var(--charcoal)',
        padding: '12px 18px 110px',
        overflowY: 'auto',
        flexShrink: 0,
        maxHeight: '36%',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: hasEvents ? 4 : 0 }}>
          <div className="serif" style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--charcoal)' }}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          {sameDay(selectedDate, today) && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--charcoal)', color: '#fff', letterSpacing: '0.06em' }}>TODAY</span>
          )}
        </div>

        {!hasEvents && (
          <div style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 6 }}>Nothing scheduled.</div>
        )}

        {selAppts.map((a) => <ApptRow key={a.id} appt={a} />)}
        {selTasks.map((t) => <TaskDetailRow key={t.id} task={t} />)}
      </div>

    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%',
  background: 'var(--paper2)', border: '1px solid var(--line)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-soft)', transition: 'background 0.12s',
};
