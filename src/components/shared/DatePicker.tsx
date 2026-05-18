import { useState, useMemo, useRef, useCallback } from 'react';

interface Props {
  value: string;          // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  allowPast?: boolean;
}

/* ── helpers ── */
function toDateStr(d: Date) { return d.toLocaleDateString('en-CA'); }
function comingMonday(): Date {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() + ((8 - day) % 7 || 7)); return d;
}
function fmtDateDisplay(s: string) {
  return new Date(s + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['S','M','T','W','T','F','S'];

function calGrid(year: number, month: number) {
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

function CalendarPicker({ value, min, onChange }: { value: string; min: string; onChange: (v: string) => void }) {
  const init = value ? new Date(value + 'T00:00') : new Date();
  const [vYear,  setVYear]  = useState(init.getFullYear());
  const [vMonth, setVMonth] = useState(init.getMonth());
  const today = toDateStr(new Date());
  const cells = useMemo(() => calGrid(vYear, vMonth), [vYear, vMonth]);
  const prev = () => { if (vMonth === 0) { setVYear(y => y-1); setVMonth(11); } else setVMonth(m => m-1); };
  const next = () => { if (vMonth === 11) { setVYear(y => y+1); setVMonth(0); } else setVMonth(m => m+1); };

  return (
    <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={prev} style={NAV_BTN}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', letterSpacing: '-0.01em' }}>
          {MONTHS[vMonth]} {vYear}
        </span>
        <button onClick={next} style={NAV_BTN}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px 0' }}>
        {cells.map((cell, i) => {
          const sel = cell.date === value, isToday = cell.date === today;
          const past = cell.date < min, other = !cell.cur;
          return (
            <button key={i} disabled={past} onClick={() => !past && onChange(cell.date)} style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              border: isToday && !sel ? '1.5px solid var(--slate-blue)' : '1.5px solid transparent',
              background: sel ? 'var(--slate-blue)' : 'transparent',
              color: sel ? '#fff' : isToday ? 'var(--slate-blue-deep)' : other || past ? 'var(--ink-faint)' : 'var(--charcoal)',
              fontWeight: sel || isToday ? 700 : 400, fontSize: 10.5,
              cursor: past ? 'default' : 'pointer', opacity: past ? 0.35 : 1,
              transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
            onMouseEnter={(e) => { if (!sel && !past) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)'; }}
            onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >{cell.day}</button>
          );
        })}
      </div>
    </div>
  );
}

const NAV_BTN: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 6,
  border: '1.5px solid var(--line)', background: 'var(--paper2)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-soft)',
};

function triggerChip(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 13px', borderRadius: 99,
    border: `1.5px solid ${active ? 'var(--slate-blue)' : 'var(--line)'}`,
    background: active ? 'var(--slate-blue-soft)' : 'var(--paper3)',
    color: active ? 'var(--slate-blue-deep)' : 'var(--ink-muted)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'all 0.12s', whiteSpace: 'nowrap' as const, userSelect: 'none' as const,
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

function Popover({ trigger, children, open, onOpen, onClose }: {
  trigger: React.ReactNode; children: React.ReactNode;
  open: boolean; onOpen: () => void; onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = () => { timer.current = setTimeout(onClose, 160); };
  const cancel   = () => { if (timer.current) clearTimeout(timer.current); };

  const calcPos = useCallback(() => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 5, left: r.left });
    }
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { calcPos(); cancel(); onOpen(); }} onMouseLeave={schedule}>
      <div onClick={() => { if (open) onClose(); else { calcPos(); onOpen(); } }}>{trigger}</div>
      {open && (
        <div onMouseEnter={cancel} onMouseLeave={schedule} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          background: '#fff', border: '1.5px solid var(--line)', borderRadius: 16,
          boxShadow: '0 8px 28px rgba(23,32,51,0.14), 0 2px 8px rgba(23,32,51,0.07)',
          padding: '12px 14px', minWidth: 260,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── public component ── */
export default function DatePicker({ value, onChange, allowPast = false }: Props) {
  const today    = toDateStr(new Date());
  const tomorrow = toDateStr(new Date(Date.now() + 86_400_000));
  const monday   = toDateStr(comingMonday());

  const [open,       setOpen]       = useState(false);
  const [showCustom, setShowCustom] = useState(
    !!value && value !== today && value !== tomorrow && value !== monday
  );

  const calIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );

  const selectDate = (d: string, custom = false) => {
    onChange(d); setShowCustom(custom);
    if (!custom) setOpen(false);
  };

  const presets = [
    { label: 'Today',    date: today },
    { label: 'Tomorrow', date: tomorrow },
    { label: `Mon ${fmtDateDisplay(monday)}`, date: monday },
  ];

  return (
    <Popover open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
      trigger={
        <button style={triggerChip(!!value)}>
          {calIcon}
          {value ? fmtDateDisplay(value) : 'Set date'}
          <span style={{ fontSize: 8, opacity: 0.55 }}>▾</span>
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: showCustom ? 0 : 2 }}>
        {presets.map((p) => (
          <button key={p.label} style={presetChip(value === p.date && !showCustom)}
            onClick={() => selectDate(p.date, false)}>
            {p.label}
          </button>
        ))}
        <button style={presetChip(showCustom)} onClick={() => setShowCustom(true)}>Custom</button>
      </div>
      {showCustom && (
        <CalendarPicker value={value} min={allowPast ? '' : today}
          onChange={(d) => selectDate(d, true)} />
      )}
    </Popover>
  );
}
