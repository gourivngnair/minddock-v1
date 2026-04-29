import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getLevel, LEVELS } from '../../utils/levels';

const SYMPTOM_LABELS: Record<string, string> = {
  'time-blindness':       'Time Blindness',
  'exec-dysfunction':     'Executive Dysfunction',
  'hyperfocus':           'Hyperfocus',
  'working-memory':       'Working Memory Issues',
  'rejection-sensitivity':'Rejection Sensitivity',
  'overwhelm':            'Overwhelm',
};

export default function SettingsTab() {
  const user           = useStore((s) => s.user);
  const setScreen      = useStore((s) => s.setScreen);
  const clearCompleted = useStore((s) => s.clearCompleted);
  const resetAll       = useStore((s) => s.resetAll);
  const updateUserName = useStore((s) => s.updateUserName);
  const signOut        = useStore((s) => s.signOut);

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]         = useState(user?.name ?? '');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [signingOut, setSigningOut]     = useState(false);

  if (!user) return null;

  const lv           = getLevel(user.xp);
  const doneTasks    = useStore.getState().tasks.filter((t) => t.completed).length;
  const nextLevel    = LEVELS[lv.level]; // the level after current
  const xpToNext     = nextLevel ? nextLevel.minXP - user.xp : 0;

  const saveName = () => {
    if (nameVal.trim()) updateUserName(nameVal.trim());
    setEditingName(false);
  };

  /* ── section wrapper ── */
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div className="tiny mono soft" style={{ letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, onPress, danger = false, chevron = false, children }: {
    label: string; value?: string; onPress?: () => void; danger?: boolean; chevron?: boolean; children?: React.ReactNode;
  }) => (
    <button
      onClick={onPress}
      disabled={!onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '13px 16px',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--line-soft)',
        cursor: onPress ? 'pointer' : 'default',
        textAlign: 'left', transition: 'background 0.12s',
      }}
      className={onPress ? 'settings-row' : ''}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14.5, color: danger ? 'var(--danger)' : 'var(--charcoal)' }}>{label}</div>
        {value && <div className="tiny muted" style={{ marginTop: 2 }}>{value}</div>}
        {children}
      </div>
      {chevron && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* header */}
      <div className="topbar">
        <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Me</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 110px' }}>

        {/* Profile card */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px', marginBottom: 20 }}>
          <div className="row" style={{ gap: 14, marginBottom: 14 }}>
            {/* Avatar */}
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--charcoal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>{user.name.charAt(0).toUpperCase()}</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div className="row" style={{ gap: 8 }}>
                  <input
                    className="input"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    autoFocus
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.9rem' }}
                  />
                  <button
                    onClick={saveName}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <div className="serif" style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.02em' }}>{user.name}</div>
                  <button
                    onClick={() => { setNameVal(user.name); setEditingName(true); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 2 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              )}
              <div className="row" style={{ gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '1rem' }}>{lv.emoji}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-blue-deep)' }}>Lv {lv.level} — {lv.name}</span>
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 5 }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-blue-deep)' }}>{user.xp} XP</span>
              {nextLevel && <span className="tiny muted">{xpToNext} to {nextLevel.emoji} Lv {nextLevel.level}</span>}
            </div>
            <div style={{ height: 6, background: 'var(--paper3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lv.progress * 100}%`, background: 'var(--slate-blue)', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="row" style={{ gap: 0, background: 'var(--paper2)', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
            {[
              { label: 'Multiplier', value: `${user.multiplierB.toFixed(2)}×` },
              { label: 'Done', value: String(doneTasks) },
              { label: 'Symptoms', value: String(user.symptoms.length) },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--charcoal)' }}>{s.value}</div>
                <div className="tiny muted" style={{ marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ADHD profile */}
        {user.symptoms.length > 0 && (
          <Section title="ADHD Profile">
            {user.symptoms.map((s, i) => (
              <div
                key={s}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < user.symptoms.length - 1 ? '1px solid var(--line-soft)' : 'none' }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--slate-blue)', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--charcoal)' }}>{SYMPTOM_LABELS[s] ?? s}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Navigation shortcuts */}
        <Section title="Quick Links">
          <Row label="View Patterns & Insights" value="XP guide, energy trends, multiplier history" onPress={() => setScreen('patterns')} chevron />
          <Row label="Open Calendar" value="Tasks with deadlines + appointments" onPress={() => setScreen('calendar')} chevron />
          <div style={{ borderBottom: 'none' }}>
            <Row label="Browse All Tasks" value="Filter, sort, and focus on tasks" onPress={() => setScreen('tasks')} chevron />
          </div>
        </Section>

        {/* Data */}
        <Section title="Data">
          {!confirmClear ? (
            <Row
              label="Clear completed tasks"
              value={doneTasks > 0 ? `${doneTasks} completed task${doneTasks > 1 ? 's' : ''} will be removed` : 'No completed tasks to clear'}
              onPress={doneTasks > 0 ? () => setConfirmClear(true) : undefined}
            />
          ) : (
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Remove {doneTasks} completed tasks?</div>
              <div className="tiny muted" style={{ marginTop: 3, marginBottom: 10 }}>This cannot be undone.</div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  onClick={() => { clearCompleted(); setConfirmClear(false); }}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  Clear them
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--paper2)', color: 'var(--ink-soft)', border: '1px solid var(--line)', cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!confirmReset ? (
            <div style={{ borderBottom: 'none' }}>
              <Row label="Reset all app data" value="Wipes everything — name, tasks, journal, XP" onPress={() => setConfirmReset(true)} danger />
            </div>
          ) : (
            <div style={{ padding: '13px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--danger)' }}>Are you sure?</div>
              <div className="tiny muted" style={{ marginTop: 3, marginBottom: 10 }}>This deletes all data permanently and restarts the app.</div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  onClick={resetAll}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  Yes, reset everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--paper2)', color: 'var(--ink-soft)', border: '1px solid var(--line)', cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Sign out */}
        <Section title="Account">
          <div style={{ borderBottom: 'none' }}>
            {signingOut ? (
              <div className="row" style={{ gap: 12, padding: '14px 16px' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--line)', borderTopColor: 'var(--charcoal)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Saving your data…</div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>Syncing to cloud before signing out</div>
                </div>
              </div>
            ) : (
              <Row
                label="Sign out"
                value="Data is saved to cloud before sign-out"
                onPress={async () => {
                  setSigningOut(true);
                  try {
                    await signOut();
                  } catch {
                    setSigningOut(false);
                  }
                }}
                danger
                chevron
              />
            )}
          </div>
        </Section>

        {/* About */}
        <Section title="About">
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 5 }}>MindDock v1.1</div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
              An external brain for ADHD adults. MindDock filters the world based on your current cognitive capacity — no more choice paralysis, no more backlog shame.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="badge slate">Capacity-First</span>
              <span className="badge sage">Time-Blindness Coach</span>
              <span className="badge gold">Focus Mode XP</span>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
