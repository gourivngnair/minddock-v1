import { useState, useMemo, useRef, useCallback } from 'react';
import TimePicker from './TimePicker';

interface Props {
  value: string;          // "YYYY-MM-DDTHH:mm" or ""
  onChange: (v: string) => void;
  timeOptional?: boolean;
}

/* ── date helpers ── */
function toDateStr(d: Date) {
  return d.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
}
function comingSunday(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 7 : 7 - day));
  return d;
}
function fmtPresetLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtDateDisplay(dateStr: string): string {
  return new Date(dateStr + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['S','M','T','W','T','F','S'];

function calGrid(year: number, month: number): { date: string; day: number; cur: boolean }[] {
  const first = new Date(year, month, 1).getDay();
  const last  = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; day: number; cur: boolean }[] = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = first - 1; i >= 0; i--)
    cells.push({ date: toDateStr(new Date(year, month - 1, prevLast - i)), day: prevLast - i, cur: false });
  for (let d = 1; d <= last; d++)
    cells.push({ date: toDateStr(new Date(year, month, d)), day: d, cur: true });
  let next = 1;
  while (cells.length % 7 !== 0)
    cells.push({ date: toDateStr(new Date(year, month + 1, next++)), day: next - 1, cur: false });
  return cells;
}

/* ── calendar widget (used inside the popover) ── */
function CalendarPicker({ value, min, onChange }: {
  value: string; min: string; onChange: (v: string) => void;
}) {
  const initD    = value ? new Date(value + 'T00:00') : new Date();
  const [vYear,  setVYear]  = useState(initD.getFullYear());
  const [vMonth, setVMonth] = useState(initD.getMonth());
  const today    = toDateStr(new Date());
  const cells    = useMemo(() => calGrid(vYear, vMonth), [vYear, vMonth]);

  const prev = () => { if (vMonth === 0) { setVYear(y => y - 1); setVMonth(11); } else setVMonth(m => m - 1); };
  const next = () => { if (vMonth === 11) { setVYear(y => y + 1); setVMonth(0); } else setVMonth(m => m + 1); };

  return (
    <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10, marginTop: 8 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={prev} style={navBtn}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', letterSpacing: '-0.01em' }}>
          {MONTHS[vMonth]} {vYear}
        </span>
        <button onClick={next} style={navBtn}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DAYS.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 8.5, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
            color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--slate-blue)' : 'var(--ink-muted)',
            paddingBottom: 3,
          }}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px 0' }}>
        {cells.map((cell, i) => {
          const isSelected = cell.date === value;
          const isToday    = cell.date === today;
          const isPast     = cell.date < min;
          const isOther    = !cell.cur;
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => !isPast && onChange(cell.date)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                border: isToday && !isSelected ? '1.5px solid var(--slate-blue)' : '1.5px solid transparent',
                background: isSelected ? 'var(--slate-blue)' : 'transparent',
                color: isSelected ? '#fff' : isToday ? 'var(--slate-blue-deep)' : isOther ? 'var(--ink-faint)' : isPast ? 'var(--ink-faint)' : 'var(--charcoal)',
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize: 10.5, cursor: isPast ? 'default' : 'pointer',
                opacity: isPast ? 0.35 : 1, transition: 'background 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
              onMouseEnter={(e) => { if (!isSelected && !isPast) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)'; }}
              onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── chip button style ── */
function triggerChip(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 13px', borderRadius: 99,
    border: `1.5px solid ${active ? 'var(--slate-blue)' : 'var(--line)'}`,
    background: active ? 'var(--slate-blue-soft)' : 'var(--paper3)',
    color: active ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'all 0.12s', whiteSpace: 'nowrap' as const,
    userSelect: 'none' as const,
  };
}

function presetChip(active: boolean): React.CSSProperties {
  return {
    padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--slate-blue)' : 'var(--line)'}`,
    background: active ? 'var(--slate-blue-soft)' : 'var(--paper2)',
    color: active ? 'var(--slate-blue-deep)' : 'var(--ink-soft)',
    cursor: 'pointer', transition: 'all 0.1s',
  };
}

const navBtn: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 6,
  border: '1.5px solid var(--line)', background: 'var(--paper2)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-soft)',
};

/* ── hover-popover wrapper ── */
function Popover({ trigger, children, open, onOpen, onClose, compact = false }: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  compact?: boolean;
}) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => { closeTimer.current = setTimeout(onClose, 160); };
  const cancelClose   = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };

  const calcPos = useCallback(() => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 5, left: r.left });
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { calcPos(); cancelClose(); onOpen(); }}
      onMouseLeave={scheduleClose}
    >
      <div onClick={() => { if (open) onClose(); else { calcPos(); onOpen(); } }}>
        {trigger}
      </div>
      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: '#fff',
            border: '1.5px solid var(--line)',
            borderRadius: 16,
            boxShadow: '0 8px 28px rgba(23,32,51,0.14), 0 2px 8px rgba(23,32,51,0.07)',
            padding: compact ? '8px 10px' : '12px 14px',
            minWidth: compact ? 'unset' : 260,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════ */
export default function DateTimePicker({ value, onChange, timeOptional = false }: Props) {
  const today    = useMemo(() => toDateStr(new Date()), []);
  const tomorrow = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d); }, []);
  const sunday   = useMemo(() => toDateStr(comingSunday()), []);

  const initDate = value ? value.slice(0, 10) : '';
  const initTime = value && value.length > 10 ? value.slice(11, 16) : '09:00';

  const [selectedDate, setSelectedDate] = useState(initDate);
  const [showCustom,   setShowCustom]   = useState(
    initDate !== '' && initDate !== today && initDate !== tomorrow && initDate !== sunday
  );
  const [timeStr, setTimeStr] = useState(initTime);
  const [timeOn,  setTimeOn]  = useState(!!value && value.length > 10);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const emitFull = (date: string, time: string, hasTime: boolean) => {
    if (!date) { onChange(''); return; }
    onChange(date + 'T' + (hasTime ? time : '00:00'));
  };

  const selectDate = (d: string, custom = false) => {
    setSelectedDate(d);
    setShowCustom(custom);
    emitFull(d, timeStr, timeOptional ? timeOn : true);
    if (!custom) setDateOpen(false);
  };

  const handleTimeChange = (t: string) => {
    setTimeStr(t);
    if (selectedDate) emitFull(selectedDate, t, true);
    if (!timeOn) setTimeOn(true);
  };

  const presets = [
    { label: 'Today',    date: today },
    { label: 'Tomorrow', date: tomorrow },
    { label: `Sun ${fmtPresetLabel(comingSunday())}`, date: sunday },
  ];

  const calIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
  const clockIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

      {/* ── Date trigger ── */}
      <Popover
        open={dateOpen}
        onOpen={() => setDateOpen(true)}
        onClose={() => setDateOpen(false)}
        trigger={
          <button style={triggerChip(!!selectedDate)}>
            {calIcon}
            {selectedDate ? fmtDateDisplay(selectedDate) : 'Set date'}
            <span style={{ fontSize: 8, opacity: 0.55 }}>▾</span>
          </button>
        }
      >
        {/* Preset chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: showCustom ? 0 : 2 }}>
          {presets.map((p) => (
            <button key={p.label} style={presetChip(selectedDate === p.date && !showCustom)}
              onClick={() => selectDate(p.date, false)}>
              {p.label}
            </button>
          ))}
          <button style={presetChip(showCustom)} onClick={() => setShowCustom(true)}>Custom</button>
        </div>

        {showCustom && (
          <CalendarPicker value={selectedDate} min={today}
            onChange={(d) => selectDate(d, true)} />
        )}
      </Popover>

      {/* ── Time trigger ── */}
      {selectedDate && (
        timeOptional && !timeOn ? (
          /* "+ Add time" link when time is optional and not yet set */
          <button
            onClick={() => { setTimeOn(true); setTimeOpen(true); emitFull(selectedDate, timeStr, true); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11.5, fontWeight: 700, color: 'var(--slate-blue-deep)',
              letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 4px',
            }}
          >
            + Add time
          </button>
        ) : (
          <Popover
            open={timeOpen}
            onOpen={() => setTimeOpen(true)}
            onClose={() => setTimeOpen(false)}
            compact
            trigger={
              <button style={triggerChip(true)}>
                {clockIcon}
                {fmtTimeDisplay(timeStr)}
                {timeOptional && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setTimeOn(false); setTimeOpen(false); emitFull(selectedDate, timeStr, false); }}
                    style={{ fontSize: 11, opacity: 0.55, cursor: 'pointer', marginLeft: 2 }}
                    title="Remove time"
                  >×</span>
                )}
                <span style={{ fontSize: 8, opacity: 0.55 }}>▾</span>
              </button>
            }
          >
            <TimePicker value={timeStr} onChange={handleTimeChange} />
          </Popover>
        )
      )}

    </div>
  );
}
