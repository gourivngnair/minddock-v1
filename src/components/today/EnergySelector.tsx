import type { UserEnergy } from '../../types';

const LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};

const BAR_HEIGHTS = [18, 33, 52, 73, 100];

interface Props { value: UserEnergy; onChange: (e: UserEnergy) => void; }

export default function EnergyBattery({ value, onChange }: Props) {
  return (
    <div className="capacity-card">
      <div>
        <div className="kicker">Capacity · now</div>
        <div className="capacity-label">
          Feeling <span className="em">{LABELS[value].toLowerCase()}</span>.
        </div>
      </div>

      <div className="capacity-ticks">
        {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
          <button
            key={n}
            className={`tick${n <= value ? ' lit' : ''}${n === value ? ' current' : ''}`}
            onClick={() => onChange(n)}
            aria-label={LABELS[n]}
          >
            <div className="tick-bar" style={{ height: BAR_HEIGHTS[n - 1] / 2.5 + '%' }} />
            <span>{n}</span>
          </button>
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
