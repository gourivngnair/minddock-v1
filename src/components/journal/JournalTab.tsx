import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { MoodType, JournalEntry, UserEnergy, MealType, SleepEntry, SleepQuality, MealEntry } from '../../types';

/* ── constants ── */
const MOODS: { value: MoodType; emoji: string; label: string; color: string }[] = [
  { value: 'amazing',  emoji: '🤩', label: 'Amazing',  color: '#e07b2a' },
  { value: 'good',     emoji: '😊', label: 'Good',     color: '#5a8060' },
  { value: 'okay',     emoji: '😐', label: 'Okay',     color: '#7a7daa' },
  { value: 'rough',    emoji: '😔', label: 'Rough',    color: '#c07070' },
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: '#c0392b' },
];

const ENERGY_COLORS: Record<number, string> = {
  1: '#c0392b', 2: '#e07b2a', 3: '#b88a2c', 4: '#5a8060', 5: '#4a65f0',
};
const ENERGY_LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎',
};
const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  1: 'Awful', 2: 'Poor', 3: 'OK', 4: 'Good', 5: 'Great',
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const dateKey = (iso: string) => new Date(iso).toDateString();

/* ── Daily log item types ── */
type LogItem =
  | { kind: 'thought'; data: JournalEntry }
  | { kind: 'energy'; id: string; energy: UserEnergy; note?: string; createdAt: string }
  | { kind: 'task-done'; id: string; title: string; viaFocus: boolean; createdAt: string }
  | { kind: 'meal'; data: MealEntry }
  | { kind: 'sleep'; data: SleepEntry };

/* ── Thought Entry Sheet ── */
function ThoughtSheet({ onClose, addEntry, currentEnergy }: {
  onClose: () => void;
  addEntry: (e: Omit<JournalEntry, 'id' | 'createdAt' | 'dailyEnergy'>) => void;
  currentEnergy: UserEnergy;
}) {
  const [mood, setMood]     = useState<MoodType>('okay');
  const [energy, setEnergy] = useState<UserEnergy>(currentEnergy);
  const [text, setText]     = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  };

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>MOOD & THOUGHTS</div>

        {/* Mood */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => setMood(m.value)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '10px 0', borderRadius: 12,
              background: mood === m.value ? `${m.color}1a` : 'var(--paper2)',
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

        {/* Energy */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>ENERGY NOW</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>auto-filled · tap to change</span>
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
                {ENERGY_LABELS[n].split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Text */}
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

        {/* Image */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        {imageUrl ? (
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <img src={imageUrl} alt="Preview" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 160, display: 'block' }} />
            <button onClick={() => setImageUrl('')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="tiny muted" style={{ marginTop: 5 }}>+3 XP for the memory 📸</div>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{
            width: '100%', padding: '16px', border: '1.5px dashed var(--line)', borderRadius: 12,
            background: 'var(--paper2)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 10, marginBottom: 18, transition: 'border-color 0.15s',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <div style={{ textAlign: 'left' }}>
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

/* ── Meal Log Sheet ── */
function MealSheet({ onClose, addMeal }: {
  onClose: () => void;
  addMeal: (m: Omit<MealEntry, 'id' | 'createdAt'>) => void;
}) {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [desc, setDesc]         = useState('');
  const [rating, setRating]     = useState<1|2|3>(2);

  const meals: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: '🍳 Breakfast' },
    { value: 'lunch',     label: '🥗 Lunch' },
    { value: 'dinner',    label: '🍽️ Dinner' },
    { value: 'snack',     label: '🍎 Snack' },
  ];

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>LOG A MEAL</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {meals.map((m) => (
            <button key={m.value} onClick={() => setMealType(m.value)} style={{
              padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              fontWeight: 600, fontSize: 13,
              background: mealType === m.value ? 'var(--terra-soft)' : 'var(--paper2)',
              border: `1.5px solid ${mealType === m.value ? 'var(--terra)' : 'var(--line)'}`,
              color: mealType === m.value ? 'var(--terra-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s',
            }}>{m.label}</button>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <label>What did you eat?</label>
          <input
            className="input"
            placeholder="e.g. oats with banana, salad..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            autoFocus
          />
        </div>

        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>HOW DID IT FEEL?</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {([1, 2, 3] as const).map((r) => (
            <button key={r} onClick={() => setRating(r)} style={{
              flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
              background: rating === r ? 'var(--terra)' : 'var(--paper2)',
              border: `1.5px solid ${rating === r ? 'var(--terra)' : 'var(--line)'}`,
              color: rating === r ? '#fff' : 'var(--ink-soft)',
              fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
            }}>
              {r === 1 ? '😐 Meh' : r === 2 ? '😊 Good' : '🌟 Great'}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={!desc.trim()}
          onClick={() => { addMeal({ mealType, description: desc, rating }); onClose(); }}
        >
          Log Meal
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Sleep Log Sheet ── */
function SleepSheet({ onClose, addSleep }: {
  onClose: () => void;
  addSleep: (s: Omit<SleepEntry, 'id' | 'createdAt'>) => void;
}) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const [bedtime, setBedtime]   = useState(`${todayStr}T22:00`);
  const [wakeTime, setWakeTime] = useState(`${todayStr}T07:00`);
  const [quality, setQuality]   = useState<SleepQuality>(3);
  const [notes, setNotes]       = useState('');

  const durationMins = () => {
    const bed  = new Date(bedtime).getTime();
    const wake = new Date(wakeTime).getTime();
    const diff = wake - bed;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  };
  const dur = durationMins();

  const qualityColors: Record<SleepQuality, string> = {
    1: '#c0392b', 2: '#e07b2a', 3: '#b88a2c', 4: '#5a8060', 5: '#4a65f0',
  };

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 14 }}>LOG SLEEP</div>

        <div className="row" style={{ gap: 12, marginBottom: 18 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Bedtime</label>
            <input className="input" type="datetime-local" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Wake time</label>
            <input className="input" type="datetime-local" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
        </div>

        {dur && (
          <div style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', borderRadius: 10, padding: '8px 12px', marginBottom: 18, textAlign: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--teal-deep)', fontSize: 15 }}>💤 {dur}</span>
          </div>
        )}

        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 10 }}>SLEEP QUALITY</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
          {([1, 2, 3, 4, 5] as SleepQuality[]).map((q) => (
            <button key={q} onClick={() => setQuality(q)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: quality === q ? qualityColors[q] : 'var(--paper2)',
              border: `1.5px solid ${quality === q ? qualityColors[q] : 'var(--line)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all 0.15s',
            }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: quality === q ? '#fff' : 'var(--ink-soft)' }}>{q}</span>
              <span style={{ fontSize: '0.57rem', color: quality === q ? 'rgba(255,255,255,0.8)' : 'var(--ink-muted)', fontWeight: 500 }}>
                {SLEEP_QUALITY_LABELS[q]}
              </span>
            </button>
          ))}
        </div>

        <div className="field" style={{ marginBottom: 22 }}>
          <label>Notes (optional)</label>
          <input className="input" placeholder="dreams, disturbances, meds..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => { addSleep({ bedtime, wakeTime, quality, notes: notes || undefined }); onClose(); }}
        >
          Log Sleep
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Action picker ── */
function AddMenu({ onClose, onThoughts, onMeal, onSleep }: {
  onClose: () => void; onThoughts: () => void; onMeal: () => void; onSleep: () => void;
}) {
  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ paddingBottom: 28 }}>
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 16 }}>WHAT DO YOU WANT TO LOG?</div>
        <div className="col" style={{ gap: 10 }}>
          {[
            { icon: '💭', label: 'Mood & Thoughts', sub: 'Write, reflect, capture a moment', fn: onThoughts, bg: 'var(--lavender-soft)', border: 'var(--lavender)', color: 'var(--lavender-deep)' },
            { icon: '🍽️', label: 'Meal',            sub: 'Breakfast, lunch, dinner or snack', fn: onMeal,     bg: 'var(--terra-soft)', border: 'var(--terra)', color: 'var(--terra-deep)' },
            { icon: '💤', label: 'Sleep',            sub: 'Bedtime, wake time, quality',        fn: onSleep,    bg: 'var(--teal-soft)', border: 'var(--teal)', color: 'var(--teal-deep)' },
          ].map((item) => (
            <button key={item.label} onClick={() => { onClose(); item.fn(); }} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
              background: item.bg, border: `1.5px solid ${item.border}`,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 26 }}>{item.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.label}</div>
                <div className="tiny" style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Single log item row in day view ── */
function LogItemRow({ item, onDelete }: { item: LogItem; onDelete?: () => void }) {
  const [showDelete, setShowDelete] = useState(false);

  if (item.kind === 'energy') {
    const color = ENERGY_COLORS[item.energy];
    return (
      <div className="row" style={{ gap: 10, padding: '8px 0' }} onClick={() => setShowDelete((v) => !v)}>
        <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color }}>⚡</span>
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--line-soft)', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color }}>{ENERGY_LABELS[item.energy]}</span>
          {item.note && <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 6 }}>{item.note}</span>}
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <span className="tiny muted">{fmtTime(item.createdAt)}</span>
          {showDelete && onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}>×</button>
          )}
        </div>
      </div>
    );
  }

  if (item.kind === 'task-done') {
    return (
      <div className="row" style={{ gap: 10, padding: '8px 0' }}>
        <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sage-soft)', border: '2px solid var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sage-deep)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--line-soft)', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>{item.title}</span>
          {item.viaFocus && (
            <span style={{ marginLeft: 8, fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--slate-blue-soft)', color: 'var(--slate-blue-deep)' }}>Focus</span>
          )}
        </div>
        <span className="tiny muted" style={{ flexShrink: 0 }}>{fmtTime(item.createdAt)}</span>
      </div>
    );
  }

  if (item.kind === 'meal') {
    const d = item.data;
    return (
      <div className="row" style={{ gap: 10, padding: '8px 0' }} onClick={() => setShowDelete((v) => !v)}>
        <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--terra-soft)', border: '2px solid var(--terra)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
            {MEAL_ICONS[d.mealType]}
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--line-soft)', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--terra-deep)', textTransform: 'capitalize' }}>{d.mealType}</span>
            {d.rating && <span style={{ fontSize: 11 }}>{d.rating === 1 ? '😐' : d.rating === 2 ? '😊' : '🌟'}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{d.description}</div>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <span className="tiny muted">{fmtTime(d.createdAt)}</span>
          {showDelete && onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}>×</button>
          )}
        </div>
      </div>
    );
  }

  if (item.kind === 'sleep') {
    const d = item.data;
    const bedD  = new Date(d.bedtime);
    const wakeD = new Date(d.wakeTime);
    const durMs = wakeD.getTime() - bedD.getTime();
    const durH  = durMs > 0 ? (durMs / 3600000).toFixed(1) : null;
    const qColor = ({ 1: '#c0392b', 2: '#e07b2a', 3: '#b88a2c', 4: '#5a8060', 5: '#4a65f0' } as Record<number, string>)[d.quality];
    return (
      <div className="row" style={{ gap: 10, padding: '8px 0' }} onClick={() => setShowDelete((v) => !v)}>
        <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal-soft)', border: '2px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            💤
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--line-soft)', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--teal-deep)' }}>
              {durH ? `${durH}h sleep` : 'Sleep'}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: `${qColor}18`, color: qColor, border: `1px solid ${qColor}40` }}>
              {SLEEP_QUALITY_LABELS[d.quality]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
            {bedD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} → {wakeD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {d.notes && ` · ${d.notes}`}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <span className="tiny muted">{fmtTime(d.createdAt)}</span>
          {showDelete && onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'var(--danger-soft)', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}>×</button>
          )}
        </div>
      </div>
    );
  }

  // kind === 'thought'
  const d = item.data;
  const mood = MOODS.find((m) => m.value === d.mood)!;
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div className="row" style={{ gap: 10, padding: '8px 0', cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${mood.color}18`, border: `2px solid ${mood.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            {mood.emoji}
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--line-soft)', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: mood.color }}>{mood.label}</span>
          {d.entryText && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2, whiteSpace: expanded ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.45 }}>
              {d.entryText}
            </div>
          )}
          {expanded && d.memoryImageUrl && (
            <img src={d.memoryImageUrl} alt="Memory" style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 160, display: 'block', marginTop: 8 }} />
          )}
          {expanded && onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Delete
            </button>
          )}
        </div>
        <span className="tiny muted" style={{ flexShrink: 0 }}>{fmtTime(d.createdAt)}</span>
      </div>
    </div>
  );
}

/* ── Day card ── */
function DayCard({ dateStr, items, onDelete }: {
  dateStr: string;
  items: LogItem[];
  onDelete: (item: LogItem) => void;
}) {
  const date  = new Date(dateStr);
  const today = new Date().toDateString();
  const isToday = dateStr === today;
  const label = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const sortedItems = [...items].sort(
    (a, b) => new Date(getItemTime(a)).getTime() - new Date(getItemTime(b)).getTime()
  );

  const thoughtCount = items.filter((i) => i.kind === 'thought').length;
  const taskCount    = items.filter((i) => i.kind === 'task-done').length;
  const mealCount    = items.filter((i) => i.kind === 'meal').length;
  const hasSleep     = items.some((i) => i.kind === 'sleep');
  const energyItems  = items.filter((i) => i.kind === 'energy');

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
      {/* Day header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line-soft)', background: isToday ? 'var(--slate-blue-soft)' : 'var(--paper2)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: isToday ? 'var(--slate-blue-deep)' : 'var(--charcoal)' }}>
            {label}
          </div>
          <div className="row" style={{ gap: 6 }}>
            {hasSleep && <span style={{ fontSize: 12 }}>💤</span>}
            {mealCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--terra-deep)' }}>🍽️{mealCount}</span>}
            {taskCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sage-deep)' }}>✓{taskCount}</span>}
            {thoughtCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lavender-deep)' }}>💭{thoughtCount}</span>}
            {energyItems.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>⚡{energyItems.length}</span>}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '8px 14px 12px' }}>
        {sortedItems.map((item, i) => (
          <LogItemRow
            key={`${item.kind}-${i}`}
            item={item}
            onDelete={() => onDelete(item)}
          />
        ))}
      </div>
    </div>
  );
}

function getItemTime(item: LogItem): string {
  if (item.kind === 'thought')  return item.data.createdAt;
  if (item.kind === 'energy')   return item.createdAt;
  if (item.kind === 'task-done') return item.createdAt;
  if (item.kind === 'meal')     return item.data.createdAt;
  if (item.kind === 'sleep')    return item.data.createdAt;
  return '';
}

/* ── Main tab ── */
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

  const [showMenu, setShowMenu]       = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);
  const [showMeal, setShowMeal]       = useState(false);
  const [showSleep, setShowSleep]     = useState(false);

  // Completed tasks (treat as log items)
  const completedTasks = tasks.filter((t) => t.completed);

  // Build all log items grouped by date
  const allItems: LogItem[] = [
    ...journal.map((j): LogItem => ({ kind: 'thought', data: j })),
    ...energyLogs.map((e): LogItem => ({ kind: 'energy', id: e.id, energy: e.energy, note: e.note, createdAt: e.createdAt })),
    ...completedTasks.map((t): LogItem => ({ kind: 'task-done', id: t.id, title: t.title, viaFocus: t.completedViaFocus, createdAt: t.completedAt ?? t.createdAt })),
    ...mealLogs.map((m): LogItem => ({ kind: 'meal', data: m })),
    ...sleepLogs.map((s): LogItem => ({ kind: 'sleep', data: s })),
  ];

  // Group by date
  const byDate = new Map<string, LogItem[]>();
  for (const item of allItems) {
    const key = dateKey(getItemTime(item));
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(item);
  }

  // Sort dates newest-first
  const sortedDates = [...byDate.keys()].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDelete = (item: LogItem) => {
    if (item.kind === 'thought')   deleteJournalEntry(item.data.id);
    if (item.kind === 'energy')    deleteEnergyLog(item.id);
    if (item.kind === 'meal')      deleteMealLog(item.data.id);
    if (item.kind === 'sleep')     deleteSleepLog(item.data.id);
    // task-done items can't be deleted here (would require uncompleting task)
  };

  const totalDays = sortedDates.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar">
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Journal</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{totalDays} {totalDays === 1 ? 'day' : 'days'} logged</div>
        </div>
        <button
          onClick={() => setShowMenu(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log
        </button>
      </div>

      {/* Legend */}
      <div className="row" style={{ gap: 10, padding: '4px 18px 10px', flexWrap: 'wrap' }}>
        {[
          { icon: '💭', label: 'Thoughts', color: 'var(--lavender-soft)', border: 'var(--lavender)' },
          { icon: '⚡', label: 'Energy',   color: 'var(--gold-soft)',     border: '#e8d590' },
          { icon: '✓',  label: 'Tasks',    color: 'var(--sage-soft)',     border: 'var(--sage)' },
          { icon: '🍽️', label: 'Meals',    color: 'var(--terra-soft)',    border: 'var(--terra)' },
          { icon: '💤', label: 'Sleep',    color: 'var(--teal-soft)',     border: 'var(--teal)' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: l.color, border: `1px solid ${l.border}` }}>
            <span style={{ fontSize: 11 }}>{l.icon}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Daily log */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px' }}>
        {sortedDates.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📓</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Nothing logged yet.</div>
            <div className="tiny soft">Tap Log to capture mood, meals, sleep or thoughts.</div>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <DayCard
              key={dateStr}
              dateStr={dateStr}
              items={byDate.get(dateStr)!}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showMenu     && <AddMenu onClose={() => setShowMenu(false)} onThoughts={() => setShowThoughts(true)} onMeal={() => setShowMeal(true)} onSleep={() => setShowSleep(true)} />}
      {showThoughts && <ThoughtSheet onClose={() => setShowThoughts(false)} addEntry={addJournalEntry} currentEnergy={currentEnergy} />}
      {showMeal     && <MealSheet    onClose={() => setShowMeal(false)}     addMeal={addMealLog} />}
      {showSleep    && <SleepSheet   onClose={() => setShowSleep(false)}    addSleep={addSleepLog} />}
    </div>
  );
}
