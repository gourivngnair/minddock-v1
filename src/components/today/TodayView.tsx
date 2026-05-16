import { useStore } from '../../store/useStore';
import { fillCapacityBucket } from '../../utils/scoring';
import { getLevel } from '../../utils/levels';
import TaskCard from './TaskCard';
import StuckMode from './StuckMode';
import EnergyBattery from './EnergySelector';
import TutorialOverlay from '../shared/TutorialOverlay';
import type { UserEnergy } from '../../types';

export default function TodayView() {
  const user = useStore((s) => s.user);
  const tasks = useStore((s) => s.tasks);
  const setUserEnergy = useStore((s) => s.setUserEnergy);
  const setScreen = useStore((s) => s.setScreen);
  const toggleStuckMode = useStore((s) => s.toggleStuckMode);

  if (!user) return null;
  // StuckMode renders as a full-screen replacement for the task list.
  // BottomNav is handled by App.tsx for all screens including this one.
  if (user.stuckMode) return <StuckMode />;

  const energy = user.currentEnergy as UserEnergy;
  const bucketTasks = fillCapacityBucket(tasks, energy);
  const doneTasks = tasks.filter((t) => t.completed);
  const blindPct = Math.round((user.multiplierB - 1) * 100);
  const lv = getLevel(user.xp);

  return (
    <>
      {!user.tutorialSeen && <TutorialOverlay />}

      <div className="topbar">
        <div>
          <div className="kicker">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="hello-heading">
            Hi, <span className="em">{user.name}.</span>
          </h1>
        </div>
        <button
          onClick={() => setScreen('patterns')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16 }}>{lv.emoji}</span>
          <div style={{ textAlign: 'right' }}>
            <div className="tiny mono" style={{ color: 'var(--slate-blue-deep)', fontWeight: 700, letterSpacing: '0.04em' }}>Lv {lv.level}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>{user.xp} XP</div>
          </div>
        </button>
      </div>

      <div className="screen-scroll">
        <EnergyBattery value={energy} onChange={setUserEnergy} />

        {/* Time-blindness strip */}
        {blindPct > 0 && (
          <button className="blindness-strip" onClick={() => setScreen('patterns')}>
            <div style={{ flexShrink: 0 }}>
              <div className="blindness-num">{blindPct}<span className="pct">%</span></div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="kicker" style={{ marginBottom: 3 }}>Heads up</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink)' }}>
                Things take you about that much longer than you guess. Estimates are quietly padded.
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Summary chips */}
        <div className="summary-strip">
          <button className="summary-chip" onClick={() => setScreen('appointments')}>
            <div className="summary-icon" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Appointments</div>
              <div className="tiny soft" style={{ marginTop: 1 }}>this week →</div>
            </div>
          </button>
          <button className="summary-chip" onClick={() => setScreen('tasks')}>
            <div className="summary-icon" style={{ background: 'var(--sage-soft)', color: 'var(--sage-deep)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{tasks.filter((t) => !t.completed).length} tasks left</div>
              <div className="tiny soft" style={{ marginTop: 1 }}>full list →</div>
            </div>
          </button>
        </div>

        {/* Stuck toggle */}
        <button
          className={`stuck-toggle${user.stuckMode ? ' on' : ''}`}
          onClick={toggleStuckMode}
        >
          <div className={`stuck-switch${user.stuckMode ? ' on glow' : ''}`}>
            <div className="stuck-thumb" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {user.stuckMode ? 'Showing tiny, low-resistance only' : 'I feel stuck'}
            </div>
            <div className="tiny" style={{ opacity: 0.7, marginTop: 2 }}>
              {user.stuckMode ? 'Filtered to ≤15 min, low energy.' : 'Tap when starting feels impossible.'}
            </div>
          </div>
        </button>

        {/* Task list */}
        <div className="section-head">
          <div className="h">For <span className="em">today.</span></div>
          <span className="kicker">{bucketTasks.length} items</span>
        </div>

        <div className="col" style={{ gap: 10 }}>
          {bucketTasks.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>Nothing left.</div>
              <div className="tiny soft">That's allowed. Rest counts.</div>
            </div>
          ) : (
            bucketTasks.map((t) => <TaskCard key={t.id} task={t} />)
          )}
        </div>

        {/* Done section */}
        {doneTasks.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 24 }}>
              <div className="h">Done <span className="em">today.</span></div>
              <span className="kicker">{doneTasks.length}</span>
            </div>
            <div className="col" style={{ gap: 6 }}>
              {doneTasks.map((t) => (
                <div key={t.id} className="done-row">
                  <div style={{ width: 18, height: 18, borderRadius: 6, background: 'var(--sage-soft)', display: 'grid', placeItems: 'center', color: 'var(--sage-deep)', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ flex: 1, textDecoration: 'line-through', color: 'var(--ink-muted)', fontSize: 13.5 }}>{t.title}</span>
                  {t.completedViaFocus && t.actualTime && (
                    <span className="tiny mono soft">{t.actualTime}m</span>
                  )}
                </div>
              ))}
            </div>

            {/* Journal link */}
            <button
              onClick={() => setScreen('journal')}
              style={{
                marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: 'var(--lavender-soft)', border: '1px solid var(--lavender)',
                transition: 'background 0.15s',
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontSize: 18 }}>📓</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--lavender-deep)' }}>Today's Journal</div>
                  <div className="tiny" style={{ color: 'var(--ink-muted)', marginTop: 1 }}>Tasks, energy, meals &amp; more →</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lavender-deep)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}

        {/* Journal entry point when nothing is done yet */}
        {doneTasks.length === 0 && (
          <button
            onClick={() => setScreen('journal')}
            style={{
              marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'var(--lavender-soft)', border: '1px solid var(--lavender)',
            }}
          >
            <div className="row" style={{ gap: 10 }}>
              <span style={{ fontSize: 18 }}>📓</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--lavender-deep)' }}>Today's Journal</div>
                <div className="tiny" style={{ color: 'var(--ink-muted)', marginTop: 1 }}>Log energy, meals, sleep &amp; thoughts →</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lavender-deep)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>

    </>
  );
}
