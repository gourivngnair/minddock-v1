import type { UserEnergy } from '../../types';

const LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};

interface Props { value: UserEnergy; onChange: (e: UserEnergy) => void; }

export default function EnergyBattery({ value, onChange }: Props) {
  return (
    <div className="capacity-card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="kicker">Capacity · now</div>
          <div className="capacity-label" style={{ marginTop: 3 }}>
            Feeling <span className="em">{LABELS[value].toLowerCase()}.</span>
          </div>
        </div>
        <div className="kicker" style={{ marginBottom: 4 }}>{value}/5</div>
      </div>

      <div className="energy-bar">
        {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
          <button
            key={n}
            className={n === value ? 'bar-current' : n < value ? 'bar-lit' : ''}
            onClick={() => onChange(n)}
            aria-label={LABELS[n]}
            title={LABELS[n]}
          />
        ))}
      </div>

      <div className="capacity-explain">
        Today's list is tuned to{' '}
        <span className="em">{LABELS[value].toLowerCase()}</span>
        {value <= 2 ? ' — small wins only.' : value >= 4 ? ' — go ahead, pick something heavy.' : ' — a balanced mix.'}
      </div>
    </div>
  );
}
