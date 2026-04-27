import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { MoodType, JournalEntry, UserEnergy, MealType, SleepEntry, SleepQuality, MealEntry, EnergyLogEntry } from '../../types';

/* ── helpers ── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const todayKey = () => new Date().toDateString();
const dateKey  = (iso: string) => new Date(iso).toDateString();

const MOODS: { value: MoodType; emoji: string; label: string; color: string }[] = [
  { value: 'amazing',  emoji: '🤩', label: 'Amazing',  color: 'var(--amber)' },
  { value: 'good',     emoji: '😊', label: 'Good',     color: 'var(--sage-deep)' },
  { value: 'okay',     emoji: '😐', label: 'Okay',     color: 'var(--indigo)' },
  { value: 'rough',    emoji: '😔', label: 'Rough',    color: 'var(--terra)' },
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: 'var(--danger)' },
];

const ENERGY_COLORS: Record<number, string> = {
  1: 'var(--danger)', 2: 'var(--terra)', 3: 'var(--amber)', 4: 'var(--sage-deep)', 5: 'var(--sky)',
};
const ENERGY_LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};
const MEAL_INFO: Record<MealType, { icon: string; label: string }> = {
  breakfast: { icon: '🍳', label: 'Breakfast' },
  lunch:     { icon: '🥗', label: 'Lunch' },
  dinner:    { icon: '🍽️', label: 'Dinner' },
  snack:     { icon: '🍎', label: 'Snack' },
};
const SLEEP_Q: Record<SleepQuality, { label: string; color: string }> = {
  1: { label: 'Awful',  color: 'var(--danger)' },
  2: { label: 'Poor',   color: 'var(--terra)' },
  3: { label: 'OK',     color: 'var(--amber)' },
  4: { label: 'Good',   color: 'var(--sage-deep)' },
  5: { label: 'Great',  color: 'var(--sky)' },
};

/* ── Section card wrapper ── */
function Section({ icon, title, color, count, action, empty, children }: {
  icon: string; title: string; color: string; count: number;
  action?: React.ReactNode; empty?: string; children?: React.ReactNode;
}) {
  return (
    <div className="journal-section">
      <div className="journal-section-header" style={{ background: `${color}0d`, borderTop: `3px solid ${color}` }}>
        <div className="journal-section-title" style={{ color }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          {title}
          {count > 0 && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: `${color}20`, color, marginLeft: 2 }}>
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="journal-section-body">
        {children || (
          <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--ink-muted)', fontSize: 13 }}>
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function AddBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 8, display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
        background: `${color}10`, border: `1.5px dashed ${color}`,
        color, fontWeight: 600, fontSize: '0.78rem', transition: 'all 0.15s',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      {label}
    </button>
  );
}

/* ── Thought entry sheet ── */
function ThoughtSheet({ onClose, addEntry, currentEnergy }: {
  onClose: () => void;
  addEntry: (e: Omit<JournalEntry, 'id' | 'createdAt' | 'dailyEnergy'>) => void;
  currentEnergy: UserEnergy;
}) {
  const [mood, setMood]     = useState<MoodType>('okay');
  const [energy, setEnergy] = useState<UserEnergy>(currentEnergy);
  const [text, setText]     = useState('');
  const [imageUrl, setImg]  = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>MOOD &amp; THOUGHTS</div>

        {/* Mood row */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => setMood(m.value)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '10px 0', borderRadius: 12,
              background: mood === m.value ? `${m.color}18` : 'var(--paper2)',
              border: `1.5px solid ${mood === m.value ? m.color : 'var(--line)'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: mood === m.value ? m.color : 'var(--ink-muted)' }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Energy row */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>ENERGY NOW</div>
          <span className="tiny muted">auto-filled · tap to change</span>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
            <button key={n} onClick={() => setEnergy(n)} style={{
              flex: 1, padding: '9px 0', borderRadius: 10,
              background: energy === n ? ENERGY_COLORS[n] : 'var(--paper2)',
              border: `1.5px solid ${energy === n ? ENERGY_COLORS[n] : 'var(--line)'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.15s',
            }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: energy === n ? '#fff' : 'var(--ink-soft)' }}>{n}</span>
              <span style={{ fontSize: '0.57rem', color: energy === n ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', fontWeight: 500 }}>
                {ENERGY_LABELS[n].slice(0, 4)}
              </span>
            </button>
          ))}
        </div>

        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>THOUGHTS</div>
        <textarea
          className="input"
          placeholder="What's on your mind? What happened?"
          style={{ minHeight: 110, resize: 'none', lineHeight: 1.6, marginBottom: 4 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        {text.length > 0 && <div className="tiny muted" style={{ textAlign: 'right', marginBottom: 16 }}>{text.length} chars</div>}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)); }} />

        {imageUrl ? (
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <img src={imageUrl} alt="Preview" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160, display: 'block' }} />
            <button onClick={() => setImg('')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="tiny muted" style={{ marginTop: 5 }}>+3 XP for the memory 📸</div>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{
            width: '100%', padding: '14px', border: '1.5px dashed var(--line)', borderRadius: 12,
            background: 'var(--paper2)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 10, marginBottom: 18,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-soft)' }}>Add a photo · +3 XP</div>
              <div className="tiny muted">Anchor the day visually</div>
            </div>
          </button>
        )}

        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={!text.trim() && !imageUrl}
          onClick={() => { addEntry({ mood, entryText: text, memoryImageUrl: imageUrl || undefined }); onClose(); }}
        >
          Save · +{5 + (imageUrl ? 3 : 0)} XP
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Meal sheet ── */
function MealSheet({ onClose, addMeal }: { onClose: () => void; addMeal: (m: Omit<MealEntry, 'id' | 'createdAt'>) => void }) {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [desc, setDesc]         = useState('');
  const [rating, setRating]     = useState<1|2|3>(2);

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>LOG A MEAL</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {(Object.entries(MEAL_INFO) as [MealType, { icon: string; label: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => setMealType(k)} style={{
              padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              fontWeight: 600, fontSize: 13,
              background: mealType === k ? 'var(--terra-soft)' : 'var(--paper2)',
              border: `1.5px solid ${mealType === k ? 'var(--terra)' : 'var(--line)'}`,
              color: mealType === k ? 'var(--terra-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s',
            }}>{v.icon} {v.label}</button>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <label>What did you eat?</label>
          <input className="input" placeholder="e.g. oats with banana, salad…" value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus />
        </div>

        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>HOW DID IT FEEL?</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {(['😐 Meh', '😊 Good', '🌟 Great'] as const).map((label, i) => (
            <button key={label} onClick={() => setRating((i + 1) as 1|2|3)} style={{
              flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
              background: rating === i + 1 ? 'var(--terra)' : 'var(--paper2)',
              border: `1.5px solid ${rating === i + 1 ? 'var(--terra)' : 'var(--line)'}`,
              color: rating === i + 1 ? '#fff' : 'var(--ink-soft)',
              fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        <button className="btn btn-primary btn-block btn-lg" disabled={!desc.trim()}
          onClick={() => { addMeal({ mealType, description: desc, rating }); onClose(); }}>
          Log Meal
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Sleep sheet ── */
function SleepSheet({ onClose, addSleep }: { onClose: () => void; addSleep: (s: Omit<SleepEntry, 'id' | 'createdAt'>) => void }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [bedtime, setBedtime]   = useState(`${todayStr}T22:30`);
  const [wakeTime, setWakeTime] = useState(`${todayStr}T07:00`);
  const [quality, setQuality]   = useState<SleepQuality>(3);
  const [notes, setNotes]       = useState('');

  const dur = () => {
    const diff = new Date(wakeTime).getTime() - new Date(bedtime).getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  };

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>LOG SLEEP</div>

        <div className="row" style={{ gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Bedtime</label><input className="input" type="datetime-local" value={bedtime} onChange={(e) => setBedtime(e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>Wake time</label><input className="input" type="datetime-local" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></div>
        </div>

        {dur() && (
          <div style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', borderRadius: 10, padding: '8px 12px', marginBottom: 16, textAlign: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--teal-deep)', fontSize: 15 }}>💤 {dur()}</span>
          </div>
        )}

        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>SLEEP QUALITY</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {([1, 2, 3, 4, 5] as SleepQuality[]).map((q) => (
            <button key={q} onClick={() => setQuality(q)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: quality === q ? SLEEP_Q[q].color : 'var(--paper2)',
              border: `1.5px solid ${quality === q ? SLEEP_Q[q].color : 'var(--line)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.15s',
            }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: quality === q ? '#fff' : 'var(--ink-soft)' }}>{q}</span>
              <span style={{ fontSize: '0.57rem', color: quality === q ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', fontWeight: 500 }}>
                {SLEEP_Q[q].label}
              </span>
            </button>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 22 }}>
          <label>Notes <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="dreams, disturbances, meds…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block btn-lg"
          onClick={() => { addSleep({ bedtime, wakeTime, quality, notes: notes || undefined }); onClose(); }}>
          Log Sleep
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── History day card ── */
function HistoryDayCard({ dateStr, thoughts, energyItems, tasks, meals, sleep }: {
  dateStr: string;
  thoughts: JournalEntry[];
  energyItems: EnergyLogEntry[];
  tasks: { id: string; title: string; viaFocus: boolean; completedAt: string }[];
  meals: MealEntry[];
  sleep: SleepEntry[];
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(dateStr);
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const total = thoughts.length + energyItems.length + tasks.length + meals.length + sleep.length;

  if (total === 0) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="row"
        style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>{label}</div>
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            {thoughts.length > 0  && <span className="tiny" style={{ color: 'var(--rose-deep)' }}>💭{thoughts.length}</span>}
            {energyItems.length > 0 && <span className="tiny" style={{ color: 'var(--amber-deep)' }}>⚡{energyItems.length}</span>}
            {tasks.length > 0     && <span className="tiny" style={{ color: 'var(--sage-deep)' }}>✓{tasks.length}</span>}
            {meals.length > 0     && <span className="tiny" style={{ color: 'var(--terra-deep)' }}>🍽️{meals.length}</span>}
            {sleep.length > 0     && <span className="tiny" style={{ color: 'var(--teal-deep)' }}>💤</span>}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--line-soft)', padding: '12px 14px 14px' }}>
          {thoughts.map((j) => {
            const m = MOODS.find((x) => x.value === j.mood)!;
            return (
              <div key={j.id} className="journal-log-row">
                <span style={{ fontSize: 16, flexShrink: 0 }}>{m.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: m.color }}>{m.label}</span>
                  {j.entryText && <div className="tiny muted" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.entryText}</div>}
                </div>
                <span className="tiny muted" style={{ flexShrink: 0 }}>{fmtTime(j.createdAt)}</span>
              </div>
            );
          })}
          {energyItems.map((e) => (
            <div key={e.id} className="journal-log-row">
              <span style={{ fontSize: 14, color: ENERGY_COLORS[e.energy] }}>⚡</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: ENERGY_COLORS[e.energy] }}>{ENERGY_LABELS[e.energy]}</span>
              <span className="tiny muted">{fmtTime(e.createdAt)}</span>
            </div>
          ))}
          {tasks.map((t) => (
            <div key={t.id} className="journal-log-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>{t.title}</span>
              {t.viaFocus && <span className="badge slate" style={{ marginRight: 6 }}>Focus</span>}
              <span className="tiny muted">{fmtTime(t.completedAt)}</span>
            </div>
          ))}
          {meals.map((m) => (
            <div key={m.id} className="journal-log-row">
              <span style={{ fontSize: 14 }}>{MEAL_INFO[m.mealType].icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--terra-deep)' }}>{MEAL_INFO[m.mealType].label}</span>
                <span className="tiny muted" style={{ marginLeft: 8 }}>{m.description}</span>
              </div>
              <span className="tiny muted">{fmtTime(m.createdAt)}</span>
            </div>
          ))}
          {sleep.map((s) => {
            const durH = ((new Date(s.wakeTime).getTime() - new Date(s.bedtime).getTime()) / 3600000).toFixed(1);
            return (
              <div key={s.id} className="journal-log-row">
                <span style={{ fontSize: 14 }}>💤</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal-deep)' }}>{durH}h · {SLEEP_Q[s.quality].label}</span>
                  <div className="tiny muted" style={{ marginTop: 1 }}>
                    {new Date(s.bedtime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    &nbsp;→&nbsp;
                    {new Date(s.wakeTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main tab
══════════════════════════════════════════════════════════════ */
export default function JournalTab() {
  const journal            = useStore((s) => s.journal);
  const tasks              = useStore((s) => s.tasks);
  const energyLogs         = useStore((s) => s.energyLogs);
  const mealLogs           = useStore((s) => s.mealLogs);
  const sleepLogs          = useStore((s) => s.sleepLogs);
  const currentEnergy      = useStore((s) => (s.user?.currentEnergy ?? 3) as UserEnergy);
  const addJournalEntry    = useStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useStore((s) => s.deleteJournalEntry);
  const deleteEnergyLog    = useStore((s) => s.deleteEnergyLog);
  const addMealLog         = useStore((s) => s.addMealLog);
  const deleteMealLog      = useStore((s) => s.deleteMealLog);
  const addSleepLog        = useStore((s) => s.addSleepLog);
  const deleteSleepLog     = useStore((s) => s.deleteSleepLog);

  const [view, setView]         = useState<'today' | 'history'>('today');
  const [showThoughts, setShowThoughts] = useState(false);
  const [showMeal, setShowMeal]         = useState(false);
  const [showSleep, setShowSleep]       = useState(false);

  const today = todayKey();

  /* ── Today slices ── */
  const todayThoughts  = journal.filter((j) => dateKey(j.createdAt) === today);
  const todayEnergy    = energyLogs.filter((e) => dateKey(e.createdAt) === today)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const todayTasks     = tasks
    .filter((t) => t.completed && t.completedAt && dateKey(t.completedAt) === today)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
  const todayMeals     = mealLogs.filter((m) => dateKey(m.createdAt) === today)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const todaySleep     = sleepLogs.filter((s) => dateKey(s.createdAt) === today);

  /* ── History slices (all days != today) ── */
  const allDays = new Set<string>();
  [...journal, ...energyLogs, ...mealLogs, ...sleepLogs].forEach((x) => {
    const k = dateKey(x.createdAt);
    if (k !== today) allDays.add(k);
  });
  tasks.filter((t) => t.completed && t.completedAt && dateKey(t.completedAt) !== today)
    .forEach((t) => allDays.add(dateKey(t.completedAt!)));
  const historyDays = [...allDays].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Header */}
      <div className="topbar">
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Journal</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{dateLabel}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            onClick={() => setShowThoughts(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Write
          </button>
        </div>
      </div>

      {/* Today / History toggle */}
      <div style={{ padding: '0 18px 12px', display: 'flex', gap: 6 }}>
        {(['today', 'history'] as const).map((v) => (
          <button
            key={v}
            className={`chip${view === v ? ' active' : ''}`}
            onClick={() => setView(v)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {v === 'today' ? '📅 Today' : `📚 History (${historyDays.length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>

        {/* ═══ TODAY VIEW ═══ */}
        {view === 'today' && (
          <>
            {/* 1. Mood & Thoughts */}
            <Section
              icon="💭" title="Mood &amp; Thoughts" color="var(--rose)"
              count={todayThoughts.length}
              empty="No thoughts yet — tap Write to capture your mood."
              action={<AddBtn label="Write" color="var(--rose)" onClick={() => setShowThoughts(true)} />}
            >
              {todayThoughts.length > 0 && (
                <>
                  {todayThoughts.map((j) => {
                    const m = MOODS.find((x) => x.value === j.mood)!;
                    const [expanded, setExpanded] = useState(false);
                    return (
                      <div key={j.id} className="journal-log-row" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
                        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: `${m.color}18`, border: `2px solid ${m.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                          {m.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row" style={{ gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13.5, color: m.color }}>{m.label}</span>
                            <span className="tiny muted">{fmtTime(j.createdAt)}</span>
                          </div>
                          {j.entryText && (
                            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.5,
                              ...(expanded ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>
                              {j.entryText}
                            </div>
                          )}
                          {expanded && j.memoryImageUrl && (
                            <img src={j.memoryImageUrl} alt="Memory" style={{ width: '100%', borderRadius: 10, marginTop: 8, objectFit: 'cover', maxHeight: 160 }} />
                          )}
                          {expanded && (
                            <button onClick={(e) => { e.stopPropagation(); deleteJournalEntry(j.id); }}
                              style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', padding: 0 }}>
                              Delete entry
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </Section>

            {/* 2. Energy Levels */}
            <Section
              icon="⚡" title="Energy Levels" color="var(--amber)"
              count={todayEnergy.length}
              empty="No energy readings yet — set your level from Today view."
            >
              {todayEnergy.length > 0 && (
                <>
                  {/* Mini timeline bar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'flex-end', height: 36 }}>
                    {todayEnergy.map((e, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ width: '100%', borderRadius: 4, background: ENERGY_COLORS[e.energy], height: `${(e.energy / 5) * 100}%`, minHeight: 6 }} />
                      </div>
                    ))}
                  </div>
                  {todayEnergy.map((e) => (
                    <div key={e.id} className="journal-log-row">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ENERGY_COLORS[e.energy]}18`, border: `2px solid ${ENERGY_COLORS[e.energy]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: ENERGY_COLORS[e.energy] }}>{e.energy}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: ENERGY_COLORS[e.energy] }}>{ENERGY_LABELS[e.energy]}</span>
                        {e.note && <span className="tiny muted" style={{ marginLeft: 8 }}>{e.note}</span>}
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="tiny muted">{fmtTime(e.createdAt)}</span>
                        <button onClick={() => deleteEnergyLog(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, padding: '0 2px' }}>×</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Section>

            {/* 3. Tasks Completed */}
            <Section
              icon="✓" title="Tasks Completed" color="var(--sage)"
              count={todayTasks.length}
              empty="No tasks completed today yet."
            >
              {todayTasks.length > 0 && (
                <>
                  {todayTasks.map((t) => (
                    <div key={t.id} className="journal-log-row">
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--sage-soft)', border: '1.5px solid var(--sage)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sage-deep)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>{t.title}</span>
                      {t.completedViaFocus && <span className="badge slate" style={{ marginRight: 8 }}>Focus</span>}
                      {t.completedAt && <span className="tiny muted" style={{ flexShrink: 0 }}>{fmtTime(t.completedAt)}</span>}
                    </div>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--sage-soft)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (todayTasks.length / Math.max(tasks.filter(t => !t.completed).length + todayTasks.length, 1)) * 100)}%`, background: 'var(--sage)', borderRadius: 99 }} />
                    </div>
                    <span className="tiny soft">{todayTasks.length} done</span>
                  </div>
                </>
              )}
            </Section>

            {/* 4. Meals */}
            <Section
              icon="🍽️" title="Meals" color="var(--terra)"
              count={todayMeals.length}
              empty="No meals logged today."
              action={<AddBtn label="Log meal" color="var(--terra)" onClick={() => setShowMeal(true)} />}
            >
              {todayMeals.length > 0 && (
                <>
                  {todayMeals.map((m) => (
                    <div key={m.id} className="journal-log-row">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--terra-soft)', border: '1.5px solid var(--terra)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                        {MEAL_INFO[m.mealType].icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--terra-deep)' }}>{MEAL_INFO[m.mealType].label}</span>
                          {m.rating && <span style={{ fontSize: 11 }}>{m.rating === 1 ? '😐' : m.rating === 2 ? '😊' : '🌟'}</span>}
                          <span className="tiny muted">{fmtTime(m.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
                      </div>
                      <button onClick={() => deleteMealLog(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, padding: '0 4px', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                  <AddBtn label="Log another meal" color="var(--terra)" onClick={() => setShowMeal(true)} />
                </>
              )}
            </Section>

            {/* 5. Sleep */}
            <Section
              icon="💤" title="Sleep" color="var(--teal)"
              count={todaySleep.length}
              empty="No sleep logged."
              action={todaySleep.length === 0 ? <AddBtn label="Log sleep" color="var(--teal)" onClick={() => setShowSleep(true)} /> : undefined}
            >
              {todaySleep.length > 0 && (
                <>
                  {todaySleep.map((s) => {
                    const durMs = new Date(s.wakeTime).getTime() - new Date(s.bedtime).getTime();
                    const durH  = durMs > 0 ? (durMs / 3600000).toFixed(1) : '?';
                    return (
                      <div key={s.id} className="journal-log-row">
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--teal-soft)', border: '1.5px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          💤
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="row" style={{ gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal-deep)' }}>{durH}h</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${SLEEP_Q[s.quality].color}18`, color: SLEEP_Q[s.quality].color }}>
                              {SLEEP_Q[s.quality].label}
                            </span>
                          </div>
                          <div className="tiny muted" style={{ marginTop: 3 }}>
                            {new Date(s.bedtime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} → {new Date(s.wakeTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {s.notes && ` · ${s.notes}`}
                          </div>
                        </div>
                        <button onClick={() => deleteSleepLog(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, padding: '0 4px', flexShrink: 0 }}>×</button>
                      </div>
                    );
                  })}
                </>
              )}
            </Section>
          </>
        )}

        {/* ═══ HISTORY VIEW ═══ */}
        {view === 'history' && (
          <>
            {historyDays.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
                <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>No history yet.</div>
                <div className="tiny soft">Your past days will appear here.</div>
              </div>
            ) : (
              historyDays.map((d) => (
                <HistoryDayCard
                  key={d}
                  dateStr={d}
                  thoughts={journal.filter((j) => dateKey(j.createdAt) === d)}
                  energyItems={energyLogs.filter((e) => dateKey(e.createdAt) === d)}
                  tasks={tasks.filter((t) => t.completed && t.completedAt && dateKey(t.completedAt) === d)
                    .map((t) => ({ id: t.id, title: t.title, viaFocus: t.completedViaFocus, completedAt: t.completedAt! }))}
                  meals={mealLogs.filter((m) => dateKey(m.createdAt) === d)}
                  sleep={sleepLogs.filter((s) => dateKey(s.createdAt) === d)}
                />
              ))
            )}
          </>
        )}
      </div>

      {showThoughts && <ThoughtSheet onClose={() => setShowThoughts(false)} addEntry={addJournalEntry} currentEnergy={currentEnergy} />}
      {showMeal     && <MealSheet    onClose={() => setShowMeal(false)}     addMeal={addMealLog} />}
      {showSleep    && <SleepSheet   onClose={() => setShowSleep(false)}    addSleep={addSleepLog} />}
    </div>
  );
}
