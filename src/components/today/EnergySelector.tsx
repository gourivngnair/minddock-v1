import type { UserEnergy } from '../../types';

const LEVELS: {
  level: UserEnergy;
  label: string;
  bg: string;
  bgActive: string;
  color: string;
}[] = [
  { level: 1, label: 'Drained', bg: 'var(--coral-soft)',       bgActive: 'var(--coral)',          color: 'var(--coral)' },
  { level: 2, label: 'Low',     bg: 'var(--amber-soft)',       bgActive: 'var(--amber)',           color: 'var(--amber-deep)' },
  { level: 3, label: 'Steady',  bg: 'var(--sage-soft)',        bgActive: 'var(--sage)',            color: 'var(--sage-deep)' },
  { level: 4, label: 'Good',    bg: 'var(--slate-blue-soft)',  bgActive: 'var(--slate-blue)',      color: 'var(--slate-blue-deep)' },
  { level: 5, label: 'Sparked', bg: 'var(--lavender-soft)',    bgActive: 'var(--lavender)',        color: 'var(--lavender-deep)' },
];

interface Props { value: UserEnergy; onChange: (e: UserEnergy) => void; }

export default function EnergySelector({ value, onChange }: Props) {
  const current = LEVELS.find((l) => l.level === value)!;

  return (
    <div className="capacity-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div className="kicker">Capacity · now</div>
          <div className="capacity-label" style={{ marginTop: 3 }}>
            Feeling <span className="em">{current.label.toLowerCase()}.</span>
          </div>
        </div>
        <div className="kicker" style={{ color: current.color }}>{value}/5</div>
      </div>

      {/* Colored level tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {LEVELS.map(({ level, label, bg, bgActive, color }) => {
          const active = level === value;
          return (
            <button
              key={level}
              onClick={() => onChange(level)}
              style={{
                padding: '10px 4px',
                borderRadius: 10,
                border: `1.5px solid ${active ? bgActive : 'transparent'}`,
                background: active ? bgActive : bg,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
                opacity: active ? 1 : 0.72,
              }}
              aria-label={label}
              title={label}
            >
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: active ? '#fff' : color,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="capacity-explain" style={{ marginTop: 10 }}>
        Today's list is tuned to{' '}
        <span className="em">{current.label.toLowerCase()}</span>
        {value <= 2 ? ' — small wins only.' : value >= 4 ? ' — go ahead, pick something heavy.' : ' — a balanced mix.'}
      </div>
    </div>
  );
}
