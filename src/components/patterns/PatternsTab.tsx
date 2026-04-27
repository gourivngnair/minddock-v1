import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getLevel, XP_ACTIONS, XP_CATEGORIES, LEVELS } from '../../utils/levels';

const SYMPTOM_LABELS: Record<string, { label: string; icon: string }> = {
  'time-blindness':       { label: 'Time Blindness',        icon: '⏰' },
  'exec-dysfunction':     { label: 'Executive Dysfunction', icon: '🧠' },
  'hyperfocus':           { label: 'Hyperfocus',             icon: '🔍' },
  'working-memory':       { label: 'Working Memory Issues', icon: '💭' },
  'rejection-sensitivity':{ label: 'Rejection Sensitivity', icon: '💔' },
  'overwhelm':            { label: 'Overwhelm',              icon: '🌊' },
};

export default function PatternsTab() {
  const user = useStore((s) => s.user);
  const tasks = useStore((s) => s.tasks);
  const [activeSection, setActiveSection] = useState<'insights' | 'guide'>('insights');
  const [openCat, setOpenCat] = useState<string | null>(null);

  if (!user) return null;

  const lv = getLevel(user.xp);
  const focusDone  = tasks.filter((t) => t.completed && t.completedViaFocus).length;
  const totalDone  = tasks.filter((t) => t.completed).length;
  const focusRate  = totalDone > 0 ? Math.round((focusDone / totalDone) * 100) : 0;
  const history    = user.patternHistory.slice(-7);
  const avgEnergy  = history.length > 0
    ? (history.reduce((s, e) => s + e.energyLevel, 0) / history.length).toFixed(1) : '—';
  const stuckCount = history.filter((e) => e.stuckModeActivated).length;
  const scaffoldedDone = tasks.filter((t) => t.completed && t.isScaffolded).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div className="topbar" style={{ paddingBottom: 0 }}>
        <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Patterns</div>
      </div>

      {/* ── Level card ── */}
      <div style={{ padding: '12px 18px 0' }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ fontSize: 28 }}>{lv.emoji}</span>
              <div>
                <div className="tiny mono soft" style={{ letterSpacing: '0.06em' }}>LEVEL {lv.level}</div>
                <div className="serif" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 1 }}>{lv.name}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-blue-deep)' }}>{user.xp}</div>
              <div className="tiny muted">XP total</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: 'var(--paper3)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${lv.progress * 100}%`, background: 'var(--slate-blue)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="tiny muted">{lv.xpIntoLevel} / {lv.xpNeeded} XP into level</span>
            {lv.level < 10 && (
              <span className="tiny soft">
                {LEVELS[lv.level]?.emoji} {LEVELS[lv.level]?.name} at {lv.nextXP} XP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section toggle ── */}
      <div style={{ padding: '12px 18px 0', display: 'flex', gap: 8 }}>
        {(['insights', 'guide'] as const).map((s) => (
          <button
            key={s}
            className={`chip${activeSection === s ? ' active' : ''}`}
            onClick={() => setActiveSection(s)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {s === 'insights' ? '📊 Insights' : '📖 XP Guide'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 110px' }}>

        {/* ══ INSIGHTS section ══ */}
        {activeSection === 'insights' && (
          <div className="col" style={{ gap: 14 }}>

            {/* Symptom alignment */}
            {user.symptoms.length > 0 && (
              <div>
                <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your ADHD Profile</div>
                <div className="col" style={{ gap: 8 }}>
                  {user.symptoms.map((s) => {
                    const info = SYMPTOM_LABELS[s];
                    if (!info) return null;
                    let insight = '';
                    if (s === 'time-blindness')        insight = `Multiplier: ${user.multiplierB.toFixed(2)}× — tasks take ${user.multiplierB > 1.5 ? 'notably' : 'slightly'} longer than estimated.`;
                    else if (s === 'exec-dysfunction') insight = `${stuckCount > 0 ? `Used Stuck Mode ${stuckCount}× this week.` : 'No Stuck Mode needed this week!'} Tasks ≤15 min reduce friction.`;
                    else if (s === 'overwhelm')        insight = `Focus adoption: ${focusRate}% — Focus Mode reduces overwhelm by creating a single point of attention.`;
                    else if (s === 'hyperfocus')       insight = 'The Focus Mode timer helps you notice when you\'ve over-run an estimated time.';
                    else if (s === 'working-memory')   insight = 'Task descriptions give you a "how" reference mid-task so you don\'t lose the thread.';
                    else insight = 'Tracking your patterns helps build self-awareness over time.';
                    return (
                      <div key={s} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '1.05rem' }}>{info.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{info.label}</span>
                        </div>
                        <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>{insight}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metrics grid */}
            <div>
              <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Key Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Focus Rate',    value: `${focusRate}%`,                    sub: `${focusDone}/${totalDone} via Focus`, color: 'var(--slate-blue-deep)' },
                  { label: 'Multiplier',    value: `${user.multiplierB.toFixed(2)}×`,  sub: 'Time-Blindness B',                    color: 'var(--gold)' },
                  { label: 'Avg Energy',    value: avgEnergy,                           sub: 'last 7 days',                         color: 'var(--sage-deep)' },
                  { label: 'Scaffolds',     value: String(scaffoldedDone),              sub: 'scaffolds done',                      color: '#c070d0' },
                ].map((m) => (
                  <div key={m.label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px' }}>
                    <div className="tiny mono soft" style={{ letterSpacing: '0.05em', marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                    <div className="serif mono" style={{ fontSize: 22, fontWeight: 600, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Energy chart */}
            {history.length > 0 && (
              <div>
                <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>7-Day Energy</div>
                <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 14px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                    {history.map((e, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', borderRadius: 4, background: `hsl(${e.energyLevel * 22 + 20}, 60%, 58%)`, height: `${(e.energyLevel / 5) * 100}%`, minHeight: 4 }} />
                        <div className="tiny muted">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ XP GUIDE section ══ */}
        {activeSection === 'guide' && (
          <div className="col" style={{ gap: 14 }}>

            {/* Level roadmap */}
            <div>
              <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Level Roadmap</div>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
                {LEVELS.map((l, i) => {
                  const isCurrent = lv.level === l.level;
                  const isPast    = user.xp >= l.minXP;
                  const isLast    = i === LEVELS.length - 1;
                  return (
                    <div
                      key={l.level}
                      className="row"
                      style={{
                        gap: 12,
                        padding: '11px 14px',
                        borderBottom: isLast ? 'none' : '1px solid var(--line-soft)',
                        background: isCurrent ? 'var(--slate-blue-soft)' : 'transparent',
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0, opacity: isPast ? 1 : 0.35 }}>{l.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 13.5, color: isCurrent ? 'var(--slate-blue-deep)' : isPast ? 'var(--charcoal)' : 'var(--ink-muted)' }}>
                          Lv {l.level} — {l.name}
                        </div>
                        <div className="tiny muted" style={{ marginTop: 1 }}>{l.minXP.toLocaleString()} XP</div>
                      </div>
                      {isCurrent && <span className="badge slate">You are here</span>}
                      {!isCurrent && isPast && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* XP action categories */}
            <div>
              <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>How to Earn XP</div>
              <div className="col" style={{ gap: 8 }}>
                {XP_CATEGORIES.map((cat) => {
                  const actions = XP_ACTIONS.filter((a) => a.category === cat);
                  const isOpen = openCat === cat;
                  return (
                    <div key={cat} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                      <button
                        onClick={() => setOpenCat(isOpen ? null : cat)}
                        className="row"
                        style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'space-between' }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{cat}</span>
                        <div className="row" style={{ gap: 8 }}>
                          <span className="badge slate">{actions.length} actions</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div style={{ borderTop: '1px solid var(--line-soft)' }}>
                          {actions.map((a, i) => (
                            <div
                              key={i}
                              className="row"
                              style={{ padding: '10px 14px', borderBottom: i < actions.length - 1 ? '1px solid var(--line-soft)' : 'none', gap: 10, alignItems: 'flex-start' }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--charcoal)' }}>{a.label}</div>
                                {a.note && <div className="tiny muted" style={{ marginTop: 2, lineHeight: 1.4 }}>{a.note}</div>}
                              </div>
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                {a.xp > 0
                                  ? <span className="mono" style={{ fontWeight: 700, color: 'var(--slate-blue-deep)', fontSize: 14 }}>+{a.xp} XP</span>
                                  : <span className="tiny muted">—</span>
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick tip */}
            <div style={{ background: 'var(--gold-soft)', border: '1px solid #e8d5a0', borderRadius: 12, padding: '13px 14px' }}>
              <div className="tiny mono" style={{ color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 4 }}>PRO TIP</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                Focus Mode completions earn <strong style={{ color: 'var(--charcoal)' }}>double XP (20 vs 10)</strong> and are the <em>only</em> way to train your Time-Blindness Multiplier. One Focus session per task pays off more than quick-completing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
