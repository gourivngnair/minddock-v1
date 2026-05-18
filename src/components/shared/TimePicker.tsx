import { useRef, useEffect } from 'react';

/* ── constants ── */
const ITEM_H  = 30;   // px per row
const VISIBLE = 3;    // rows visible
const PAD     = Math.floor(VISIBLE / 2);  // 1 spacer row top + bottom

const HOURS   = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const AMPM    = ['AM','PM'];

/* ── helpers ── */
function to12(h24: number): { hour: string; ampm: 'AM' | 'PM' } {
  if (h24 === 0)  return { hour: '12', ampm: 'AM' };
  if (h24 < 12)  return { hour: String(h24).padStart(2, '0'), ampm: 'AM' };
  if (h24 === 12) return { hour: '12', ampm: 'PM' };
  return { hour: String(h24 - 12).padStart(2, '0'), ampm: 'PM' };
}
function to24(hour: string, ampm: 'AM' | 'PM'): number {
  const h = parseInt(hour);
  if (ampm === 'AM') return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}
function snapMinute(raw: number): string {
  return String(Math.round(raw / 5) * 5 % 60).padStart(2, '0');
}
function parse(value: string): { hour: string; minute: string; ampm: 'AM' | 'PM' } {
  const parts = value.split(':');
  const h24   = parseInt(parts[0]) || 0;
  const m     = parseInt(parts[1]) || 0;
  const { hour, ampm } = to12(h24);
  return { hour, minute: snapMinute(m), ampm };
}

/* ── single drum column ── */
interface ColProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width?: number;
}

function DrumCol({ items, value, onChange, width = 38 }: ColProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fromUser = useRef(false);

  const scrollTo = (idx: number, smooth = false) => {
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
  };

  // Initial position (no animation)
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) requestAnimationFrame(() => scrollTo(idx, false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync if value changes from outside
  useEffect(() => {
    if (fromUser.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) scrollTo(idx, true);
  }, [value, items]);

  const handleScroll = () => {
    if (!ref.current) return;
    fromUser.current = true;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) onChange(items[clamped]);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      scrollTo(clamped, true);
      fromUser.current = false;
    }, 80);
  };

  const bg = 'var(--paper3)';

  return (
    <div style={{ position: 'relative', width, height: ITEM_H * VISIBLE, flexShrink: 0, overflow: 'hidden' }}>
      {/* Top gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * PAD,
        background: `linear-gradient(to bottom, ${bg} 30%, transparent 100%)`,
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * PAD,
        background: `linear-gradient(to top, ${bg} 30%, transparent 100%)`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      <div
        ref={ref}
        className="drum-scroll"
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
        }}
      >
        {/* Top spacers */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`ts${i}`} style={{ height: ITEM_H }} />
        ))}

        {items.map((item) => (
          <div
            key={item}
            style={{
              height: ITEM_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center',
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: item === value ? 700 : 400,
              color: item === value ? 'var(--charcoal)' : 'var(--ink-muted)',
              cursor: 'pointer',
              userSelect: 'none',
              position: 'relative', zIndex: 3,
              transition: 'color 0.1s',
            }}
            onClick={() => {
              const idx = items.indexOf(item);
              scrollTo(idx, true);
              onChange(item);
            }}
          >
            {item}
          </div>
        ))}

        {/* Bottom spacers */}
        {Array.from({ length: PAD }).map((_, i) => (
          <div key={`bs${i}`} style={{ height: ITEM_H }} />
        ))}
      </div>
    </div>
  );
}

/* ── public component ── */
interface Props {
  value: string;        // "HH:MM" 24-hour
  onChange: (v: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: Props) {
  const { hour, minute, ampm } = parse(value || '09:00');

  const emit = (h: string, m: string, ap: 'AM' | 'PM') => {
    onChange(`${String(to24(h, ap)).padStart(2, '0')}:${m}`);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {label && <div className="kicker" style={{ marginBottom: 6 }}>{label}</div>}

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        background: 'var(--paper3)',
        border: '1.5px solid var(--line)',
        borderRadius: 11,
        padding: '0 8px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(23,32,51,0.05)',
      }}>
        {/* Selection highlight */}
        <div style={{
          position: 'absolute',
          top: '50%', transform: 'translateY(-50%)',
          left: 4, right: 4,
          height: ITEM_H,
          background: '#fff',
          border: '1.5px solid var(--line)',
          borderRadius: 7,
          pointerEvents: 'none',
          boxShadow: '0 1px 3px rgba(23,32,51,0.08)',
          zIndex: 1,
        }} />

        {/* Hour */}
        <DrumCol items={HOURS} value={hour} onChange={(h) => emit(h, minute, ampm)} width={36} />

        {/* Colon */}
        <div style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13, fontWeight: 700,
          color: 'var(--ink-muted)',
          zIndex: 4, padding: '0 2px',
          lineHeight: 1,
        }}>:</div>

        {/* Minute */}
        <DrumCol items={MINUTES} value={minute} onChange={(m) => emit(hour, m, ampm)} width={36} />

        {/* Divider */}
        <div style={{ width: 6, zIndex: 4 }} />

        {/* AM / PM */}
        <DrumCol items={AMPM} value={ampm} onChange={(ap) => emit(hour, minute, ap as 'AM' | 'PM')} width={30} />
      </div>
    </div>
  );
}
