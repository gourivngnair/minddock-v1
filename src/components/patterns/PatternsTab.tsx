import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getLevel, XP_ACTIONS, XP_CATEGORIES, LEVELS } from '../../utils/levels';
import type { EnergyLogEntry } from '../../types';

const SYMPTOM_LABELS: Record<string, { label: string; icon: string }> = {
  'time-blindness':        { label: 'Time Blindness',        icon: '⏰' },
  'exec-dysfunction':      { label: 'Executive Dysfunction', icon: '🧠' },
  'hyperfocus':            { label: 'Hyperfocus',             icon: '🔍' },
  'working-memory':        { label: 'Working Memory Issues', icon: '💭' },
  'rejection-sensitivity': { label: 'Rejection Sensitivity', icon: '💔' },
  'overwhelm':             { label: 'Overwhelm',              icon: '🌊' },
};

// Energy colors keyed 1-5
const EC: Record<number, string> = {
  1: '#c0392b', 2: '#c07820', 3: '#b88a2c', 4: '#3d6b4a', 5: '#2e90c0',
};

/* ── Energy vs Time-of-Day chart ── */
function EnergyTimeChart({ logs }: { logs: EnergyLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>⚡</div>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          Set your energy level in Today view throughout the day<br/>to build this chart.
        </div>
      </div>
    );
  }

  // Aggregate: for each hour 5–23, collect all readings
  const byHour: Record<number, number[]> = {};
  for (const log of logs) {
    const h = new Date(log.createdAt).getHours();
    if (h < 5 || h > 23) continue;
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(log.energy);
  }

  const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5–23
  const points = HOURS.map((h) => ({
    h,
    avg: byHour[h] ? byHour[h].reduce((s, v) => s + v, 0) / byHour[h].length : null,
    count: byHour[h]?.length ?? 0,
  }));

  const hasAny = points.some((p) => p.avg !== null);
  if (!hasAny) return null;

  // SVG dimensions
  const W = 300, H = 90;
  const PAD = { t: 8, b: 22, l: 18, r: 8 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const xOf = (i: number) => PAD.l + (i / (HOURS.length - 1)) * iW;
  const yOf = (v: number) => PAD.t + iH - ((v - 1) / 4) * iH;

  // Build smooth line through non-null points
  const pts = points.map((p, i) => p.avg !== null ? { x: xOf(i), y: yOf(p.avg), avg: p.avg } : null).filter(Boolean) as { x: number; y: number; avg: number }[];
  let linePath = '';
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      linePath = `M ${pts[0].x} ${pts[0].y}`;
    } else {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      linePath += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
  }
  const areaPath = pts.length > 1
    ? `${linePath} L ${pts[pts.length - 1].x} ${H - PAD.b} L ${pts[0].x} ${H - PAD.b} Z`
    : '';

  // Time labels
  const labelHours = [6, 9, 12, 15, 18, 21];
  const fmtH = (h: number) => h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 14px 10px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Y grid lines */}
        {[1, 2, 3, 4, 5].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#f0ece6" strokeWidth="1" />
              <text x={PAD.l - 3} y={y + 3} fill="#9c9690" fontSize="6.5" textAnchor="end">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="var(--slate-blue)" fillOpacity="0.07" />}

        {/* Bar columns for hours with data */}
        {points.map((p, i) => {
          if (p.avg === null) return null;
          const x = xOf(i);
          const bW = Math.max(3, iW / HOURS.length - 3);
          const bH = ((p.avg - 1) / 4) * iH;
          return (
            <rect
              key={i}
              x={x - bW / 2}
              y={yOf(p.avg)}
              width={bW}
              height={bH}
              fill={EC[Math.round(p.avg)]}
              fillOpacity="0.22"
              rx="2"
            />
          );
        })}

        {/* Smooth line */}
        {pts.length > 1 && (
          <path d={linePath} fill="none" stroke="var(--slate-blue)" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={pts.length > 15 ? 2.5 : 3.5}
            fill={EC[Math.round(p.avg)]} stroke="#fff" strokeWidth="1.5" />
        ))}

        {/* X-axis time labels */}
        {points.map((p, i) => {
          if (!labelHours.includes(p.h)) return null;
          return (
            <text key={i} x={xOf(i)} y={H - 4} fill="#9c9690" fontSize="7" textAnchor="middle">
              {fmtH(p.h)}
            </text>
          );
        })}
      </svg>

      {/* Legend row */}
      <div className="row" style={{ gap: 10, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} className="row" style={{ gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: EC[v] }} />
            <span style={{ fontSize: '0.63rem', color: 'var(--ink-muted)' }}>
              {['Drained', 'Low', 'Steady', 'Decent', 'Sparked'][v - 1]}
            </span>
          </div>
        ))}
      </div>

      <div className="tiny muted" style={{ marginTop: 6, textAlign: 'center' }}>
        Based on {logs.length} reading{logs.length !== 1 ? 's' : ''} · bars show hours with data
      </div>
    </div>
  );
}

/* ── 7-day bar chart (from patternHistory) ── */
function SevenDayBars({ history }: { history: { date: string; energyLevel: number }[] }) {
  if (history.length === 0) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>
        {history.map((e, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', borderRadius: 4,
              background: EC[e.energyLevel] ?? 'var(--slate-blue)',
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
  const user       = useStore((s) => s.user);
  const tasks      = useStore((s) => s.tasks);
  const energyLogs = useStore((s) => s.energyLogs);
  const [activeSection, setActiveSection] = useState<'insights' | 'guide'>('insights');
  const [openCat, setOpenCat] = useState<string | null>(null);

  if (!user) return null;

  const lv            = getLevel(user.xp);
  const focusDone     = tasks.filter((t) => t.completed && t.completedViaFocus).length;
  const totalDone     = tasks.filter((t) => t.completed).length;
  const focusRate     = totalDone > 0 ? Math.round((focusDone / totalDone) * 100) : 0;
  const history       = user.patternHistory.slice(-7);
  const stuckCount    = history.filter((e) => e.stuckModeActivated).length;
  const scaffoldedDone = tasks.filter((t) => t.completed && t.isScaffolded).length;

  const recentLogs = energyLogs.slice(0, 30);
  const logAvg     = recentLogs.length > 0
    ? (recentLogs.reduce((s, e) => s + e.energy, 0) / recentLogs.length).toFixed(1)
    : null;
  const histAvg = history.length > 0
    ? (history.reduce((s, e) => s + e.energyLevel, 0) / history.length).toFixed(1)
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar" style={{ paddingBottom: 0 }}>
        <div>
          <div className="kicker">Your insights</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>Patterns</div>
        </div>
      </div>

      {/* Level card */}
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

      {/* Toggle */}
      <div style={{ padding: '12px 18px 0', display: 'flex', gap: 8 }}>
        {(['insights', 'guide'] as const).map((s) => (
          <button key={s} className={`chip${activeSection === s ? ' active' : ''}`}
            onClick={() => setActiveSection(s)} style={{ flex: 1, justifyContent: 'center' }}>
            {s === 'insights' ? '📊 Insights' : '📖 XP Guide'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 110px' }}>

        {activeSection === 'insights' && (
          <div className="col" style={{ gap: 14 }}>

            {/* ADHD profile */}
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
                      <div key={s} style={{ background: '#fff', border: '1px solid var(--line)', borderLeft: '3px solid var(--slate-blue)', borderRadius: 12, padding: '12px 14px' }}>
                        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '1.05rem' }}>{info.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{info.label}</span>
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
                  { label: 'Focus Rate',  value: `${focusRate}%`,                   sub: `${focusDone}/${totalDone} via Focus`, color: 'var(--slate-blue-deep)', bg: 'var(--indigo-soft)' },
                  { label: 'Multiplier',  value: `${user.multiplierB.toFixed(2)}×`, sub: 'Time-Blindness B',                    color: 'var(--amber-deep)',       bg: 'var(--amber-soft)' },
                  { label: 'Avg Energy',  value: logAvg ?? histAvg,                  sub: logAvg ? `${recentLogs.length} logs` : '7-day avg', color: 'var(--sage-deep)', bg: 'var(--sage-soft)' },
                  { label: 'Scaffolds',   value: String(scaffoldedDone),              sub: 'scaffolds done',                      color: 'var(--lavender-deep)',    bg: 'var(--lavender-soft)' },
                ].map((m) => (
                  <div key={m.label} style={{ background: m.bg, border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px' }}>
                    <div className="tiny mono" style={{ letterSpacing: '0.05em', marginBottom: 4, color: m.color, fontWeight: 600 }}>{m.label.toUpperCase()}</div>
                    <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: m.color, letterSpacing: '-0.02em' }}>{m.value}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ⚡ Energy vs Time of Day */}
            <div>
              <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Energy vs Time of Day</div>
              <div className="tiny muted" style={{ marginBottom: 8, lineHeight: 1.5 }}>
                Your energy pattern across the hours — averaged from all readings.
              </div>
              <EnergyTimeChart logs={energyLogs} />
            </div>

            {/* 7-day history */}
            {history.length > 0 && (
              <div>
                <div className="tiny mono soft" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>7-Day Daily Energy</div>
                <SevenDayBars history={history} />
              </div>
            )}
          </div>
        )}

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
                    <div key={l.level} className="row" style={{
                      gap: 12, padding: '11px 14px',
                      borderBottom: isLast ? 'none' : '1px solid var(--line-soft)',
                      background: isCurrent ? 'var(--slate-blue-soft)' : 'transparent',
                    }}>
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

            {/* XP actions */}
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ borderTop: '1px solid var(--line-soft)' }}>
                          {actions.map((a, i) => (
                            <div key={i} className="row" style={{ padding: '10px 14px', borderBottom: i < actions.length - 1 ? '1px solid var(--line-soft)' : 'none', gap: 10, alignItems: 'flex-start' }}>
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

            <div style={{ background: 'var(--amber-soft)', border: '1px solid #e8d5a0', borderRadius: 12, padding: '13px 14px' }}>
              <div className="tiny mono" style={{ color: 'var(--amber)', letterSpacing: '0.06em', marginBottom: 4 }}>PRO TIP</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                Focus Mode completions earn <strong style={{ color: 'var(--charcoal)' }}>double XP (20 vs 10)</strong> and are the <em>only</em> way to train your Time-Blindness Multiplier.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
