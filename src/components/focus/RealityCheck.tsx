import { useStore } from '../../store/useStore';
import { updateMultiplierB } from '../../utils/scoring';
import type { Task } from '../../types';

const fmtMs = (s: number) => {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

interface Props { task: Task; totalActualMinutes: number; }

export default function RealityCheck({ task, totalActualMinutes }: Props) {
  const completeFocus = useStore((s) => s.completeFocus);
  const user = useStore((s) => s.user);

  if (!user) return null;

  const oldB = user.multiplierB;
  const newB = updateMultiplierB(oldB, totalActualMinutes, task.userEstimatedTime);
  const bUp = newB > oldB;

  return (
    <div className="focus-screen reality fade-in">
      <div className="screen-scroll" style={{ paddingTop: 48 }}>
        <div className="tiny mono" style={{ letterSpacing: '0.1em', color: 'var(--ink-muted)', textAlign: 'center' }}>REALITY CHECK</div>
        <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 500, textAlign: 'center', margin: '10px 24px 24px', letterSpacing: '-0.025em' }}>
          How time actually went.
        </h1>

        <div className="reality-card">
          <div className="reality-row">
            <span className="soft">Work time</span>
            <span className="mono">{fmtMs((totalActualMinutes) * 60)}</span>
          </div>
          <div className="reality-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 6 }}>
            <span style={{ fontWeight: 600 }}>Total actual</span>
            <span className="mono" style={{ fontWeight: 700 }}>{totalActualMinutes}m</span>
          </div>
          <div className="reality-row">
            <span className="muted tiny">Your estimate</span>
            <span className="mono tiny muted">{task.userEstimatedTime}m</span>
          </div>
          <div className="reality-row">
            <span className="muted tiny">App recommended</span>
            <span className="mono tiny muted">{task.appRecommendedTime}m</span>
          </div>
        </div>

        <div className="blindness-card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="tiny mono" style={{ color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>TIME-BLINDNESS MULTIPLIER</span>
            <span className={`pill ${bUp ? 'gold' : 'sage'}`}>{bUp ? '↑' : '↓'} updated</span>
          </div>
          <div className="row" style={{ gap: 14, alignItems: 'baseline', marginTop: 8 }}>
            <div>
              <div className="muted tiny">Was</div>
              <div className="serif" style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink-muted)' }}>{oldB.toFixed(2)}×</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <div>
              <div className="tiny" style={{ color: 'var(--slate-blue-deep)', fontWeight: 600 }}>Now</div>
              <div className="serif" style={{ fontSize: 30, fontWeight: 500, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>{newB.toFixed(2)}×</div>
            </div>
          </div>
          <div className="muted tiny" style={{ marginTop: 10, lineHeight: 1.5 }}>
            Formula: <span className="mono">(old × 0.7) + (actual / estimate × 0.3)</span>. Your future estimates are silently tuned.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--sage-soft)', border: '1px solid #b8d8c0', borderRadius: 12, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sage-deep)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <div style={{ color: 'var(--sage-deep)', fontWeight: 600, fontSize: '0.85rem' }}>+20 XP earned!</div>
            <div className="muted tiny">Focus sessions give double XP.</div>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => completeFocus(task.id, totalActualMinutes)}>
          Done. Save & exit.
        </button>
      </div>
    </div>
  );
}
