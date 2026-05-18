import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { MoodType, JournalEntry, UserEnergy, MealType, SleepEntry, SleepQuality, MealEntry, EnergyLogEntry, Appointment } from '../../types';

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
  1: { label: 'Awful', color: 'var(--danger)' },
  2: { label: 'Poor',  color: 'var(--terra)' },
  3: { label: 'OK',    color: 'var(--amber)' },
  4: { label: 'Good',  color: 'var(--sage-deep)' },
  5: { label: 'Great', color: 'var(--sky)' },
};

/* ── Expandable thought row (own state so no hook-in-loop) ── */
function ThoughtRow({ j, onDelete }: { j: JournalEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const m = MOODS.find((x) => x.value === j.mood)!;
  return (
    <div className="bj-row" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
      <span className="bj-bullet">~</span>
      <div className="bj-row-main">
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', marginRight: 6 }}>
          {m.emoji} {m.label}
        </span>
        {j.entryText && (
          <span style={{ color: 'var(--ink-muted)', ...(expanded ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }) }}>
            {j.entryText}
          </span>
        )}
        {expanded && j.memoryImageUrl && (
          <img src={j.memoryImageUrl} alt="Memory" style={{ width: '100%', borderRadius: 8, marginTop: 6, objectFit: 'cover', maxHeight: 140, display: 'block' }} />
        )}
        {expanded && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 10, padding: 0, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
            delete entry
          </button>
        )}
      </div>
      <span className="bj-row-time">{fmtTime(j.createdAt)}</span>
    </div>
  );
}

/* ── BjSection ── */
function BjSection({ marker, title, action, children, empty }: {
  marker: string; title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="bj-section">
      <div className="bj-section-head">
        <span className="bj-section-marker">{marker} {title}</span>
        <div className="bj-section-line" />
        {action}
      </div>
      {children || (
        <div className="bj-row">
          <span className="bj-bullet">·</span>
          <span className="bj-row-main" style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>{empty}</span>
        </div>
      )}
    </div>
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
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: mood === m.value ? m.color : 'var(--ink-muted)' }}>{m.label}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>ENERGY NOW</div>
          <span className="tiny muted">tap to change</span>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
            <button key={n} onClick={() => setEnergy(n)} style={{
              flex: 1, padding: '9px 0', borderRadius: 10,
              background: energy === n ? ENERGY_COLORS[n] : 'var(--paper2)',
              border: `1.5px solid ${energy === n ? ENERGY_COLORS[n] : 'var(--line)'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s',
            }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: energy === n ? '#fff' : 'var(--ink-soft)' }}>{n}</span>
              <span style={{ fontSize: '0.57rem', color: energy === n ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', fontWeight: 500 }}>{ENERGY_LABELS[n].slice(0,4)}</span>
            </button>
          ))}
        </div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>THOUGHTS</div>
        <textarea className="input" placeholder="What's on your mind?" style={{ minHeight: 110, resize: 'none', lineHeight: 1.6, marginBottom: 4 }}
          value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        {text.length > 0 && <div className="tiny muted" style={{ textAlign: 'right', marginBottom: 16 }}>{text.length} chars</div>}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)); }} />
        {imageUrl ? (
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <img src={imageUrl} alt="Preview" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160, display: 'block' }} />
            <button onClick={() => setImg('')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '13px', border: '1.5px dashed var(--line)', borderRadius: 12, background: 'var(--paper2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-soft)' }}>Add a photo · +3 XP</div>
              <div className="tiny muted">Anchor the day visually</div>
            </div>
          </button>
        )}
        <button className="btn btn-primary btn-block btn-lg" disabled={!text.trim() && !imageUrl}
          onClick={() => { addEntry({ mood, entryText: text, memoryImageUrl: imageUrl || undefined }); onClose(); }}>
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
            <button key={k} onClick={() => setMealType(k)} style={{ padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: 13, background: mealType === k ? 'var(--terra-soft)' : 'var(--paper2)', border: `1.5px solid ${mealType === k ? 'var(--terra)' : 'var(--line)'}`, color: mealType === k ? 'var(--terra-deep)' : 'var(--ink-soft)', transition: 'all 0.15s' }}>{v.icon} {v.label}</button>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>What did you eat?</label>
          <input className="input" placeholder="e.g. oats with banana…" value={desc} onChange={(e) => setDesc(e.target.value)} autoFocus />
        </div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>HOW DID IT FEEL?</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {(['😐 Meh', '😊 Good', '🌟 Great'] as const).map((label, i) => (
            <button key={label} onClick={() => setRating((i + 1) as 1|2|3)} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: rating === i + 1 ? 'var(--terra)' : 'var(--paper2)', border: `1.5px solid ${rating === i + 1 ? 'var(--terra)' : 'var(--line)'}`, color: rating === i + 1 ? '#fff' : 'var(--ink-soft)', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>{label}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={!desc.trim()} onClick={() => { addMeal({ mealType, description: desc, rating }); onClose(); }}>Log Meal</button>
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
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
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
        {dur() && <div style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', borderRadius: 10, padding: '8px 12px', marginBottom: 16, textAlign: 'center' }}><span style={{ fontWeight: 700, color: 'var(--teal-deep)', fontSize: 15 }}>💤 {dur()}</span></div>}
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>SLEEP QUALITY</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {([1, 2, 3, 4, 5] as SleepQuality[]).map((q) => (
            <button key={q} onClick={() => setQuality(q)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', background: quality === q ? SLEEP_Q[q].color : 'var(--paper2)', border: `1.5px solid ${quality === q ? SLEEP_Q[q].color : 'var(--line)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: quality === q ? '#fff' : 'var(--ink-soft)' }}>{q}</span>
              <span style={{ fontSize: '0.57rem', color: quality === q ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', fontWeight: 500 }}>{SLEEP_Q[q].label}</span>
            </button>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 22 }}>
          <label>Notes <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="dreams, disturbances, meds…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => { addSleep({ bedtime, wakeTime, quality, notes: notes || undefined }); onClose(); }}>Log Sleep</button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── History day card ── */
function HistoryDayCard({ dateStr, thoughts, energyItems, tasks, meals, sleep, appts }: {
  dateStr: string;
  thoughts: JournalEntry[];
  energyItems: EnergyLogEntry[];
  tasks: { id: string; title: string; viaFocus: boolean; completedAt: string }[];
  meals: MealEntry[];
  sleep: SleepEntry[];
  appts: Appointment[];
}) {
  const [open, setOpen] = useState(false);
  const date  = new Date(dateStr);
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const total = thoughts.length + energyItems.length + tasks.length + meals.length + sleep.length + appts.length;
  if (total === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 0' }}>
        <div className="bj-section-head">
          <span className="bj-section-marker">{label}</span>
          <div className="bj-section-line" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-muted)', letterSpacing: '0.1em' }}>
            {open ? '▲' : '▼'} {total} entries
          </span>
        </div>
      </button>

      {open && (
        <div style={{ paddingLeft: 13 }}>
          {appts.map((a) => (
            <div key={a.id} className="bj-row">
              <span className="bj-bullet">@</span>
              <span className="bj-row-main">{a.title}</span>
              <span className="bj-row-time">{new Date(a.deadline).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          ))}
          {thoughts.map((j) => {
            const m = MOODS.find((x) => x.value === j.mood)!;
            return (
              <div key={j.id} className="bj-row">
                <span className="bj-bullet">~</span>
                <span className="bj-row-main"><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{m.emoji} {m.label}</span>{j.entryText && ` — ${j.entryText.slice(0, 50)}${j.entryText.length > 50 ? '…' : ''}`}</span>
                <span className="bj-row-time">{fmtTime(j.createdAt)}</span>
              </div>
            );
          })}
          {energyItems.map((e) => (
            <div key={e.id} className="bj-row">
              <span className="bj-bullet">!</span>
              <span className="bj-row-main" style={{ color: ENERGY_COLORS[e.energy] }}>{ENERGY_LABELS[e.energy]}</span>
              <span className="bj-row-time">{fmtTime(e.createdAt)}</span>
            </div>
          ))}
          {tasks.map((t) => (
            <div key={t.id} className="bj-row">
              <span className="bj-bullet">✓</span>
              <span className="bj-row-main" style={{ textDecoration: 'line-through', color: 'var(--ink-muted)' }}>{t.title}</span>
              <span className="bj-row-time">{fmtTime(t.completedAt)}</span>
            </div>
          ))}
          {meals.map((m) => (
            <div key={m.id} className="bj-row">
              <span className="bj-bullet">▸</span>
              <span className="bj-row-main">{MEAL_INFO[m.mealType].label} — {m.description}</span>
              <span className="bj-row-time">{fmtTime(m.createdAt)}</span>
            </div>
          ))}
          {sleep.map((s) => {
            const durH = ((new Date(s.wakeTime).getTime() - new Date(s.bedtime).getTime()) / 3600000).toFixed(1);
            return (
              <div key={s.id} className="bj-row">
                <span className="bj-bullet">z</span>
                <span className="bj-row-main">{durH}h · {SLEEP_Q[s.quality].label} · {new Date(s.bedtime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} → {new Date(s.wakeTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
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
  const appointments       = useStore((s) => s.appointments);
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

  const [view, setView]               = useState<'today' | 'history'>('today');
  const [showThoughts, setShowThoughts] = useState(false);
  const [showMeal, setShowMeal]         = useState(false);
  const [showSleep, setShowSleep]       = useState(false);

  const today = todayKey();

  /* Today slices */
  const todayThoughts = journal.filter((j) => dateKey(j.createdAt) === today);
  const todayEnergy   = energyLogs.filter((e) => dateKey(e.createdAt) === today)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const todayTasks    = tasks
    .filter((t) => t.completed && t.completedAt && dateKey(t.completedAt) === today)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
  const todayAppts    = appointments
    .filter((a) => dateKey(a.deadline) === today)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const todayMeals    = mealLogs.filter((m) => dateKey(m.createdAt) === today)
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const todaySleep    = sleepLogs.filter((s) => dateKey(s.createdAt) === today);

  /* History slices */
  const allDays = new Set<string>();
  [...journal, ...energyLogs, ...mealLogs, ...sleepLogs].forEach((x) => {
    const k = dateKey(x.createdAt); if (k !== today) allDays.add(k);
  });
  tasks.filter((t) => t.completed && t.completedAt && dateKey(t.completedAt) !== today)
    .forEach((t) => allDays.add(dateKey(t.completedAt!)));
  appointments.filter((a) => dateKey(a.deadline) !== today)
    .forEach((a) => allDays.add(dateKey(a.deadline)));
  const historyDays = [...allDays].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());


  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div>
          <div className="kicker">Daily log</div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 2 }}>Journal</div>
        </div>
        <button
          onClick={() => setShowThoughts(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Write
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>
        <div>

            {/* Tabs */}
            <div className="bj-tabs">
              <button className={`bj-tab${view === 'today' ? ' active' : ''}`} onClick={() => setView('today')}>
                📅 today
              </button>
              <button className={`bj-tab${view === 'history' ? ' active' : ''}`} onClick={() => setView('history')}>
                🗂 history ({historyDays.length})
              </button>
            </div>

            {/* ═══ TODAY VIEW ═══ */}
            {view === 'today' && (
              <>
                {/* 1. Mood & Thoughts */}
                <BjSection
                  marker="~" title="mood &amp; thoughts"
                  action={<button className="bj-section-action" onClick={() => setShowThoughts(true)}>+ write</button>}
                  empty="no thoughts yet — tap write to capture your mood."
                >
                  {todayThoughts.length > 0 && (
                    <>
                      {todayThoughts.map((j) => (
                        <ThoughtRow key={j.id} j={j} onDelete={() => deleteJournalEntry(j.id)} />
                      ))}
                    </>
                  )}
                </BjSection>

                {/* 2. Energy */}
                <BjSection
                  marker="!" title="energy levels"
                  empty="no readings yet — set from today view."
                >
                  {todayEnergy.length > 0 && (
                    <>
                      {todayEnergy.map((e) => (
                        <div key={e.id} className="bj-row">
                          <span className="bj-bullet">!</span>
                          <span className="bj-row-main" style={{ color: ENERGY_COLORS[e.energy] }}>
                            {ENERGY_LABELS[e.energy]}
                            {e.note && <span style={{ color: 'var(--ink-muted)', marginLeft: 8 }}>{e.note}</span>}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="bj-row-time">{fmtTime(e.createdAt)}</span>
                            <button onClick={() => deleteEnergyLog(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12, padding: 0 }}>×</button>
                          </div>
                        </div>
                      ))}
                      {/* Pip track */}
                      <div className="bj-pips">
                        {todayEnergy.map((e, i) => (
                          <div key={i} className="bj-pip" style={{ background: ENERGY_COLORS[e.energy], border: `1px solid ${ENERGY_COLORS[e.energy]}`, opacity: 0.75 }} title={ENERGY_LABELS[e.energy]} />
                        ))}
                      </div>
                    </>
                  )}
                </BjSection>

                {/* 3+4. Appointments & Tasks — two columns */}
                <div className="bj-cols">
                  <BjSection marker="@" title="appointments" empty="no appointments today.">
                    {todayAppts.length > 0 && todayAppts.map((a) => {
                      const t = new Date(a.deadline).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      return (
                        <div key={a.id} className="bj-row">
                          <span className="bj-bullet">@</span>
                          <span className="bj-row-main">{a.title}</span>
                          <span className="bj-row-time">{t}</span>
                        </div>
                      );
                    })}
                  </BjSection>

                  <BjSection marker="✓" title="tasks done" empty="no tasks completed yet.">
                    {todayTasks.length > 0 && todayTasks.map((t) => (
                      <div key={t.id} className="bj-row">
                        <span className="bj-bullet">✓</span>
                        <span className="bj-row-main" style={{ textDecoration: 'line-through', color: 'var(--ink-muted)' }}>{t.title}</span>
                        {t.completedAt && <span className="bj-row-time">{fmtTime(t.completedAt)}</span>}
                      </div>
                    ))}
                  </BjSection>
                </div>

                {/* 5+6. Meals & Sleep — two columns */}
                <div className="bj-cols">
                  <BjSection
                    marker="▸" title="meals"
                    action={<button className="bj-section-action" onClick={() => setShowMeal(true)}>+ log</button>}
                    empty="no meals logged today."
                  >
                    {todayMeals.length > 0 && (
                      <>
                        {todayMeals.map((m) => (
                          <div key={m.id} className="bj-row">
                            <span className="bj-bullet">▸</span>
                            <span className="bj-row-main">
                              {MEAL_INFO[m.mealType].icon} {m.description.slice(0, 20)}{m.description.length > 20 ? '…' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <span className="bj-row-time">{fmtTime(m.createdAt)}</span>
                              <button onClick={() => deleteMealLog(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12, padding: 0 }}>×</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </BjSection>

                  <BjSection
                    marker="z" title="sleep"
                    action={todaySleep.length === 0 ? <button className="bj-section-action" onClick={() => setShowSleep(true)}>+ log</button> : undefined}
                    empty="no sleep logged."
                  >
                    {todaySleep.length > 0 && todaySleep.map((s) => {
                      const durMs = new Date(s.wakeTime).getTime() - new Date(s.bedtime).getTime();
                      const durH  = durMs > 0 ? (durMs / 3600000).toFixed(1) : '?';
                      return (
                        <div key={s.id} className="bj-row">
                          <span className="bj-bullet">z</span>
                          <span className="bj-row-main">
                            {durH}h · {SLEEP_Q[s.quality].label}
                            <br />
                            <span style={{ color: 'var(--ink-muted)' }}>
                              {new Date(s.bedtime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} → {new Date(s.wakeTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </span>
                          <button onClick={() => deleteSleepLog(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12, padding: 0, marginTop: 3 }}>×</button>
                        </div>
                      );
                    })}
                  </BjSection>
                </div>

                {/* Signifier key */}
                <div className="bj-key">
                  <div className="bj-key-item"><span className="bj-key-sym">·</span> note</div>
                  <div className="bj-key-item"><span className="bj-key-sym">~</span> mood</div>
                  <div className="bj-key-item"><span className="bj-key-sym">!</span> energy</div>
                  <div className="bj-key-item"><span className="bj-key-sym">@</span> event</div>
                  <div className="bj-key-item"><span className="bj-key-sym">✓</span> done</div>
                  <div className="bj-key-item"><span className="bj-key-sym">▸</span> meal</div>
                  <div className="bj-key-item"><span className="bj-key-sym">z</span> sleep</div>
                </div>
              </>
            )}

            {/* ═══ HISTORY VIEW ═══ */}
            {view === 'history' && (
              <>
                {historyDays.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, color: 'var(--ink-faint)', lineHeight: 1 }}>…</div>
                    <div className="kicker" style={{ marginTop: 10 }}>no past entries</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6 }}>Start writing to fill your log.</div>
                  </div>
                ) : (
                  historyDays.map((d) => (
                    <HistoryDayCard
                      key={d} dateStr={d}
                      appts={appointments.filter((a) => dateKey(a.deadline) === d)}
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
      </div>

      {showThoughts && <ThoughtSheet onClose={() => setShowThoughts(false)} addEntry={addJournalEntry} currentEnergy={currentEnergy} />}
      {showMeal     && <MealSheet    onClose={() => setShowMeal(false)}     addMeal={addMealLog} />}
      {showSleep    && <SleepSheet   onClose={() => setShowSleep(false)}    addSleep={addSleepLog} />}
    </div>
  );
}
