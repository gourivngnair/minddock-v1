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

// Energy colors per spec (1–5)
const EC: Record<number, string> = {
  1: '#E24B4A', 2: '#EF9F27', 3: '#97C459', 4: '#378ADD', 5: '#534AB7',
};

const fmtH  = (h: number) => h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
const fmtHF = (h: number) => h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;

/* ── helpers ── */
function parseWakeHour(t?: string)  { return t ? parseInt(t) : 6; }
function parseSleepHour(t?: string) {
  if (!t) return 22;
  const h = parseInt(t);
  return h < 5 ? h + 24 : h; // "00:00" (midnight) → 24, "01:00" → 25
}

/* ── Energy vs Time-of-Day chart ── */
function EnergyTimeChart({ logs, wakeTime, sleepTime }: { logs: EnergyLogEntry[]; wakeTime?: string; sleepTime?: string }) {
  const [view, setView] = useState<'average' | 'scatter'>('average');

  if (logs.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚡</div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)', marginBottom: 4 }}>No energy data yet</div>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          Set your energy level in Today view throughout the day<br />to build this chart.
        </div>
      </div>
    );
  }

  /* ── Exponential decay aggregation ── */
  const now   = new Date();
  const wakeH  = parseWakeHour(wakeTime);
  const sleepH = parseSleepHour(sleepTime);
  const chartEnd = Math.min(sleepH, 23);
  const HOURS  = Array.from({ length: chartEnd - wakeH + 1 }, (_, i) => wakeH + i);

  const byHour: Record<number, { wsum: number; wtotal: number }> = {};
  for (const log of logs) {
    const h       = new Date(log.createdAt).getHours();
    if (h < wakeH || h > chartEnd) continue;
    const daysAgo = (now.getTime() - new Date(log.createdAt).getTime()) / 86_400_000;
    const w       = Math.pow(0.9, daysAgo);
    if (!byHour[h]) byHour[h] = { wsum: 0, wtotal: 0 };
    byHour[h].wsum   += log.energy * w;
    byHour[h].wtotal += w;
  }

  const hourlyAvgs = HOURS.map((h) => ({
    hour: h,
    avg: byHour[h] ? Math.round((byHour[h].wsum / byHour[h].wtotal) * 10) / 10 : null,
  }));

  const withData = hourlyAvgs.filter((p) => p.avg !== null) as { hour: number; avg: number }[];
  if (withData.length === 0) return null;

  /* ── Derived insights ── */
  const peakHour = withData.reduce((a, b) => a.avg > b.avg ? a : b).hour;
  const dipHour  = withData.reduce((a, b) => a.avg < b.avg ? a : b).hour;
  const peakAvg  = withData.reduce((a, b) => a.avg > b.avg ? a : b).avg;

  /* ── Stat cards ── */
  const totalW    = Object.values(byHour).reduce((s, h) => s + h.wtotal, 0);
  const totalWS   = Object.values(byHour).reduce((s, h) => s + h.wsum, 0);
  const avgEnergy = Math.round((totalWS / totalW) * 10) / 10;

  /* ── SVG geometry ── */
  const W = 340, H = 130;
  const PAD = { t: 14, b: 28, l: 28, r: 12 };
  const iW  = W - PAD.l - PAD.r;
  const iH  = H - PAD.t - PAD.b;
  const xOf = (h: number) => PAD.l + ((h - wakeH) / (chartEnd - wakeH)) * iW;
  const yOf = (v: number) => PAD.t + iH - ((v - 1) / 4) * iH;
  const bot  = PAD.t + iH;

  /* ── Smooth bezier through ALL data points (single continuous curve) ── */
  const buildLine = (pts: { hour: number; avg: number }[]) => {
    if (pts.length < 2) return '';
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const x = xOf(pts[i].hour), y = yOf(pts[i].avg);
      if (i === 0) { d = `M ${x} ${y}`; continue; }
      const cpx = (xOf(pts[i-1].hour) + x) / 2;
      d += ` C ${cpx} ${yOf(pts[i-1].avg)}, ${cpx} ${y}, ${x} ${y}`;
    }
    return d;
  };

  const avgLinePath = buildLine(withData);
  const avgAreaPath = withData.length > 1
    ? `${avgLinePath} L ${xOf(withData[withData.length-1].hour)} ${bot} L ${xOf(withData[0].hour)} ${bot} Z`
    : '';

  /* ── Scatter points ── */
  const scatter = logs.flatMap((log) => {
    const h = new Date(log.createdAt).getHours();
    if (h < wakeH || h > chartEnd) return [];
    return [{ x: xOf(h), y: yOf(log.energy), e: log.energy }];
  });

  // X labels: show ~5 evenly spaced labels within wakeH–chartEnd
  const step = Math.ceil((chartEnd - wakeH) / 4);
  const LABEL_H = Array.from({ length: 5 }, (_, i) => wakeH + i * step).filter((h) => h <= chartEnd);
  const gradTop = yOf(5);
  const gradBot = yOf(1);

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: `1.5px solid ${active ? 'var(--slate-blue)' : 'var(--line)'}`,
    background: active ? 'var(--slate-blue-soft)' : 'var(--paper2)',
    color: active ? 'var(--slate-blue-deep)' : 'var(--ink-soft)',
    transition: 'all 0.1s',
  });

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 14px 12px' }}>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button style={chipStyle(view === 'average')} onClick={() => setView('average')}>Average</button>
        <button style={chipStyle(view === 'scatter')} onClick={() => setView('scatter')}>All readings</button>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          {/* Vertical energy gradient: level 5 purple (top) → level 1 red (bottom) */}
          <linearGradient id="ec-line" gradientUnits="userSpaceOnUse" x1={0} y1={gradTop} x2={0} y2={gradBot}>
            <stop offset="0%"   stopColor="#534AB7" />
            <stop offset="25%"  stopColor="#378ADD" />
            <stop offset="50%"  stopColor="#97C459" />
            <stop offset="75%"  stopColor="#EF9F27" />
            <stop offset="100%" stopColor="#E24B4A" />
          </linearGradient>
          <linearGradient id="ec-fill" gradientUnits="userSpaceOnUse" x1={0} y1={gradTop} x2={0} y2={gradBot}>
            <stop offset="0%"   stopColor="#534AB7" stopOpacity={0.22} />
            <stop offset="40%"  stopColor="#97C459" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#E24B4A" stopOpacity={0.03} />
          </linearGradient>
        </defs>

        {/* Y grid lines + EC-colored labels */}
        {[1, 2, 3, 4, 5].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                stroke={v === 3 ? '#dedad4' : '#eeecea'}
                strokeWidth="1" strokeDasharray={v === 3 ? '0' : '3,3'} />
              <text x={PAD.l - 5} y={y + 3.5} fill={EC[v]} fontSize="8" fontWeight="700" textAnchor="end">{v}</text>
            </g>
          );
        })}

        {/* Average view: single continuous gradient bezier line + filled area */}
        {view === 'average' && (
          <g>
            {avgAreaPath && <path d={avgAreaPath} fill="url(#ec-fill)" />}
            {avgLinePath && <path d={avgLinePath} fill="none" stroke="url(#ec-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {withData.map((p) => (
              <circle key={p.hour} cx={xOf(p.hour)} cy={yOf(p.avg)} r={5}
                fill={EC[Math.round(p.avg)]} stroke="#fff" strokeWidth="2" />
            ))}
          </g>
        )}

        {/* Scatter view */}
        {view === 'scatter' && scatter.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4}
            fill={EC[p.e]} fillOpacity={0.85} stroke="#fff" strokeWidth="1.5" />
        ))}

        {/* X-axis labels */}
        {LABEL_H.map((h) => (
          <text key={h} x={xOf(h)} y={H - 7} fill="var(--ink-muted)" fontSize="8" fontWeight="500" textAnchor="middle">
            {fmtH(h)}
          </text>
        ))}
      </svg>

      {/* Insight chips — spec labels */}
      {withData.length >= 2 && (
        <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '4px 10px', borderRadius: 99, background: `${EC[Math.round(peakAvg)]}18`, border: `1px solid ${EC[Math.round(peakAvg)]}50`, fontSize: 11.5, fontWeight: 700, color: EC[Math.round(peakAvg)] }}>
            ↑ Peak window: {fmtHF(peakHour)}–{fmtHF(Math.min(23, peakHour + 2))}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 99, background: `${EC[1]}15`, border: `1px solid ${EC[1]}40`, fontSize: 11.5, fontWeight: 700, color: EC[1] }}>
            ↓ Typical dip: {fmtHF(dipHour)}–{fmtHF(Math.min(23, dipHour + 2))}
          </div>
        </div>
      )}

      {/* Stat cards — each tinted with its relevant color */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
        {[
          { label: 'Avg Energy', value: avgEnergy.toFixed(1), color: EC[Math.round(avgEnergy)] ?? EC[3], bg: `${EC[Math.round(avgEnergy)] ?? EC[3]}14` },
          { label: 'Peak',       value: fmtHF(peakHour),       color: EC[5],                              bg: `${EC[5]}14` },
          { label: 'Dip',        value: fmtHF(dipHour),         color: EC[1],                              bg: `${EC[1]}14` },
          { label: 'Readings',   value: String(logs.length),    color: '#378ADD',                          bg: '#378ADD14' },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}35`, borderRadius: 10, padding: '8px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div className="tiny muted" style={{ marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
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

      <div className="page-scroll" style={{ paddingTop: 14 }}>

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
              <EnergyTimeChart logs={energyLogs} wakeTime={user.wakeTime} sleepTime={user.sleepTime} />
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
