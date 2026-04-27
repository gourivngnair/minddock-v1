import type { UserEnergy } from '../../types';

const LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};

interface Props { value: UserEnergy; onChange: (e: UserEnergy) => void; }

export default function EnergyBattery({ value, onChange }: Props) {
  return (
    <div className="energy-card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>ENERGY · NOW</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>
            {LABELS[value]}
          </div>
        </div>
        <div className="battery">
          <div className="battery-cap" />
          {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
            <div key={n} className={`battery-cell${n <= value ? ' on' : ''}`} />
          ))}
        </div>
      </div>

      <div className="energy-track">
        {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
          <button
            key={n}
            className={`energy-dot${n === value ? ' active' : n < value ? ' filled' : ''}`}
            onClick={() => onChange(n)}
          >
            <span>{n}</span>
          </button>
        ))}
      </div>

      <div className="muted tiny" style={{ marginTop: 10, lineHeight: 1.4 }}>
        Showing tasks tuned to <strong style={{ color: 'var(--ink-soft)' }}>{LABELS[value].toLowerCase()}</strong>
        {value <= 2 ? ' — small wins only.' : value >= 4 ? ' — go ahead, pick something heavy.' : ' — a balanced mix.'}
      </div>
    </div>
  );
}
