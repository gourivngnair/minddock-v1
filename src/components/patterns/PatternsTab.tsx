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

const ENERGY_COLORS = ['#c0392b', '#e07b2a', '#b88a2c', '#5a8060', '#4a65f0'];

/* ── Inline SVG energy timeline ── */
function EnergyTimeline() {
  const energyLogs = useStore((s) => s.energyLogs);

  if (energyLogs.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>⚡</div>
        <div className="tiny muted">Energy logs will appear here as you set your energy level throughout the day.</div>
      </div>
    );
  }

  // Use last 50 logs
  const recent = [...energyLogs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-50);

  // Group by day for day labels
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const inRange = recent.filter((e) => new Date(e.createdAt).getTime() >= sevenDaysAgo);
  const data = inRange.length > 0 ? inRange : recent.slice(-20);

  const W = 320, H = 90, PAD = { top: 10, bottom: 22, left: 8, right: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const n = data.length;
  const xs = data.map((_, i) => PAD.left + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2));
  const ys = data.map((e) => PAD.top + innerH - ((e.energy - 1) / 4) * innerH);

  // Smooth path
  let path = '';
  if (n === 1) {
    path = `M ${xs[0]} ${ys[0]}`;
  } else {
    path = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < n; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      path += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
  }

  // Area fill path
  const areaPath = n > 1
    ? `${path} L ${xs[n - 1]} ${H - PAD.bottom} L ${xs[0]} ${H - PAD.bottom} Z`
    : '';

  // Y-axis grid lines (1-5)
  const gridLines = [1, 2, 3, 4, 5].map((v) => ({
    y: PAD.top + innerH - ((v - 1) / 4) * innerH,
    label: String(v),
  }));

  // Time labels: first and last
  const firstDate = new Date(data[0].createdAt);
  const lastDate  = new Date(data[n - 1].createdAt);
  const fmtDate   = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 14px 10px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g.label}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke="var(--line-soft)" strokeWidth="1" />
            <text x={PAD.left - 2} y={g.y + 3.5} fill="var(--ink-muted)" fontSize="7" textAnchor="end">{g.label}</text>
          </g>
        ))}

        {/* Area */}
        {areaPath && (
          <path d={areaPath} fill="var(--slate-blue)" fillOpacity="0.07" />
        )}

        {/* Line */}
        <path d={path} fill="none" stroke="var(--slate-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {data.map((e, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r={n > 20 ? 2.5 : 4} fill={ENERGY_COLORS[e.energy - 1]} stroke="#fff" strokeWidth="1.5" />
        ))}

        {/* Time labels */}
        {n > 1 && (
          <>
            <text x={xs[0]} y={H - 2} fill="var(--ink-muted)" fontSize="7.5" textAnchor="start">{fmtDate(firstDate)}</text>
            <text x={xs[n-1]} y={H - 2} fill="var(--ink-muted)" fontSize="7.5" textAnchor="end">{fmtDate(lastDate)}</text>
          </>
        )}
      </svg>

      {/* Current energy dot legend */}
      <div className="row" style={{ gap: 8, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {['Drained', 'Low', 'Steady', 'Decent', 'Sparked'].map((label, i) => (
          <div key={label} className="row" style={{ gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ENERGY_COLORS[i] }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--ink-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 7-day bar chart (tasks-based) ── */
function SevenDayBars({ history }: { history: { date: string; energyLevel: number }[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
        {history.map((e, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', borderRadius: 4,
              background: ENERGY_COLORS[e.energyLevel - 1] ?? 'var(--slate-blue)',
              height: `${(e.energyLevel / 5) * 100}%`, minHeight: 4,
            }} />
            <div className="tiny muted">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PatternsTab() {
  const user = useStore((s) => s.user);
  const tasks = useStore((s) => s.tasks);
  const energyLogs = useStore((s) => s.energyLogs);
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

  // Recent energy log average (last 20)
  const recentLogs = energyLogs.slice(0, 20);
  const logAvg = recentLogs.length > 0
    ? (recentLogs.reduce((s, e) => s + e.energy, 0) / recentLogs.length).toFixed(1)
    : null;

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

            {/* Symptom cards */}
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
                  { label: 'Avg Energy',    value: logAvg ?? avgEnergy,                 sub: logAvg ? `${recentLogs.length} logs`  : 'last 7 days', color: 'var(--sage-deep)' },
                  { label: 'Scaffolds',     value: String(scaffoldedDone),              sub: 'scaffolds done',                      color: 'var(--lavender-deep)' },
                ].map((m) => (
                  <div key={m.label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px' }}>
                    <div className="tiny mono soft" style={{ letterSpacing: '0.05em', marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                    <div className="serif mono" style={{ fontSize: 22, fontWeight: 600, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Energy timeline (from explicit logs) */}
            <div>
              <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Energy Timeline · {energyLogs.length} readings
              </div>
              <EnergyTimeline />
            </div>

            {/* 7-day history bars (from pattern entries) */}
            {history.length > 0 && (
              <div>
                <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>7-Day Daily Energy</div>
                <SevenDayBars history={history} />
              </div>
            )}
          </div>
        )}

        {/* ══ XP GUIDE section ══ */}
        {activeSection === 'guide' && (
          <div className="col" style={{ gap: 14 }}>

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
