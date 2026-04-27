import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { MoodType, JournalEntry, UserEnergy } from '../../types';

/* ── constants ── */
const MOODS: { value: MoodType; emoji: string; label: string; color: string }[] = [
  { value: 'amazing',  emoji: '🤩', label: 'Amazing',  color: '#f59e0b' },
  { value: 'good',     emoji: '😊', label: 'Good',     color: '#22c55e' },
  { value: 'okay',     emoji: '😐', label: 'Okay',     color: '#94a3b8' },
  { value: 'rough',    emoji: '😔', label: 'Rough',    color: '#f97316' },
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: '#ef4444' },
];

const ENERGY_LABELS: Record<UserEnergy, string> = {
  1: 'Drained', 2: 'Low', 3: 'Steady', 4: 'Decent', 5: 'Sparked',
};

type Filter = 'all' | MoodType | 'energy-high' | 'energy-low';
type AddEntryFn = (e: Omit<JournalEntry, 'id' | 'createdAt' | 'dailyEnergy'>) => void;

const FILTERS: { value: Filter; label: string; icon: string }[] = [
  { value: 'all',         label: 'All entries', icon: '📓' },
  { value: 'amazing',     label: 'Amazing',     icon: '🤩' },
  { value: 'good',        label: 'Good',        icon: '😊' },
  { value: 'okay',        label: 'Okay',        icon: '😐' },
  { value: 'rough',       label: 'Rough',       icon: '😔' },
  { value: 'energy-high', label: 'High energy', icon: '⚡' },
  { value: 'energy-low',  label: 'Low energy',  icon: '😴' },
];

/* ── Journal entry card ── */
function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const mood  = MOODS.find((m) => m.value === entry.mood)!;
  const date  = new Date(entry.createdAt);

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        className="row"
        style={{ padding: '13px 14px', cursor: 'pointer', gap: 10 }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{mood.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: mood.color }}>{mood.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--paper2)', borderRadius: 99, padding: '1px 7px' }}>
              <span style={{ fontSize: 9 }}>⚡</span>
              <span className="mono tiny" style={{ fontWeight: 600 }}>{entry.dailyEnergy}/5</span>
            </span>
          </div>
          <div
            style={{
              fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {entry.entryText || <em style={{ color: 'var(--ink-muted)' }}>No text</em>}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div className="tiny muted">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className="tiny muted">{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--line-soft)', padding: '12px 14px 14px' }}>
          {entry.entryText && (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.65, margin: '0 0 10px' }}>
              {entry.entryText}
            </p>
          )}
          {entry.memoryImageUrl && (
            <img
              src={entry.memoryImageUrl}
              alt="Memory"
              style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 200, display: 'block', marginBottom: 10 }}
            />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.78rem', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Delete entry
          </button>
        </div>
      )}
    </div>
  );
}

/* ── New entry sheet ── */
function NewEntrySheet({ onClose, addEntry, currentEnergy }: {
  onClose: () => void;
  addEntry: AddEntryFn;
  currentEnergy: UserEnergy;
}) {
  const [mood, setMood]       = useState<MoodType>('okay');
  const [energy, setEnergy]   = useState<UserEnergy>(currentEnergy);
  const [text, setText]       = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  };

  const handleSave = () => {
    addEntry({ mood, entryText: text, memoryImageUrl: imageUrl || undefined });
    onClose();
  };

  const divider = <div style={{ height: 1, background: 'var(--line-soft)', margin: '20px 0' }} />;

  return (
    <div
      className="modal-back fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        <div className="sheet-grip" />

        {/* ── Section 1: Mood ── */}
        <div>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 12 }}>MOOD</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 0',
                  borderRadius: 12,
                  background: mood === m.value ? `${m.color}18` : 'var(--paper2)',
                  border: `1.5px solid ${mood === m.value ? m.color : 'var(--line)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: mood === m.value ? m.color : 'var(--ink-muted)' }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {divider}

        {/* ── Section 2: Energy ── */}
        <div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="tiny mono soft" style={{ letterSpacing: '0.08em' }}>ENERGY</div>
            <span style={{ background: 'var(--slate-blue-soft)', color: 'var(--slate-blue-deep)', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
              ⚡ auto-filled from Today
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2, 3, 4, 5] as UserEnergy[]).map((n) => (
              <button
                key={n}
                onClick={() => setEnergy(n)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  background: energy === n ? 'var(--charcoal)' : 'var(--paper2)',
                  border: `1.5px solid ${energy === n ? 'var(--charcoal)' : 'var(--line)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s',
                }}
              >
                <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: energy === n ? '#fff' : 'var(--ink-soft)' }}>{n}</span>
                <span style={{ fontSize: '0.58rem', color: energy === n ? 'rgba(255,255,255,0.7)' : 'var(--ink-muted)', fontWeight: 500 }}>
                  {ENERGY_LABELS[n].split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {divider}

        {/* ── Section 3: Entry text ── */}
        <div>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 12 }}>YOUR THOUGHTS</div>
          <textarea
            className="input"
            placeholder="What's on your mind? What happened? How did it feel?"
            style={{ minHeight: 130, resize: 'none', lineHeight: 1.6 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          {text.length > 0 && (
            <div className="tiny muted" style={{ marginTop: 5, textAlign: 'right' }}>{text.length} chars</div>
          )}
        </div>

        {divider}

        {/* ── Section 4: Memory image ── */}
        <div>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 12 }}>MEMORY IMAGE</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img
                src={imageUrl}
                alt="Preview"
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 180, display: 'block' }}
              />
              <button
                onClick={() => setImageUrl('')}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#fff', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="tiny muted" style={{ marginTop: 6 }}>+3 XP for the memory 📸</div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '22px', border: '1.5px dashed var(--line)', borderRadius: 12,
                background: 'var(--paper2)', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink-soft)' }}>Add a photo from today</div>
                <div className="tiny muted" style={{ marginTop: 2 }}>Anchor the day visually — earns +3 XP</div>
              </div>
            </button>
          )}
        </div>

        {/* ── Save ── */}
        <button
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 22 }}
          disabled={!text.trim() && !imageUrl}
          onClick={handleSave}
        >
          Save Entry · +{5 + (imageUrl ? 3 : 0)} XP
        </button>

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Main tab ── */
export default function JournalTab() {
  const journal            = useStore((s) => s.journal);
  const currentEnergy      = useStore((s) => (s.user?.currentEnergy ?? 3) as UserEnergy);
  const addJournalEntry    = useStore((s) => s.addJournalEntry);
  const deleteJournalEntry = useStore((s) => s.deleteJournalEntry);

  const [filter, setFilter] = useState<Filter>('all');
  const [showNew, setShowNew] = useState(false);

  // counts for every filter option
  const counts: Record<Filter, number> = {
    'all':         journal.length,
    'amazing':     journal.filter((j) => j.mood === 'amazing').length,
    'good':        journal.filter((j) => j.mood === 'good').length,
    'okay':        journal.filter((j) => j.mood === 'okay').length,
    'rough':       journal.filter((j) => j.mood === 'rough').length,
    'terrible':    journal.filter((j) => j.mood === 'terrible').length,
    'energy-high': journal.filter((j) => j.dailyEnergy >= 4).length,
    'energy-low':  journal.filter((j) => j.dailyEnergy <= 2).length,
  };

  const filtered = journal.filter((j) => {
    if (filter === 'all')          return true;
    if (filter === 'energy-high')  return j.dailyEnergy >= 4;
    if (filter === 'energy-low')   return j.dailyEnergy <= 2;
    return j.mood === filter;
  });

  const activeFilter = FILTERS.find((f) => f.value === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="topbar">
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em' }}>Journal</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{journal.length} {journal.length === 1 ? 'entry' : 'entries'}</div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--charcoal)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Write
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            <span>{f.icon}</span>
            {f.label}
            <span className="chip-count">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Active filter summary */}
      {filter !== 'all' && (
        <div className="filter-summary">
          <span>
            {filtered.length === 0
              ? `No ${activeFilter?.label.toLowerCase()} entries`
              : <><strong>{filtered.length}</strong> {activeFilter?.icon} {activeFilter?.label.toLowerCase()} {filtered.length === 1 ? 'entry' : 'entries'}</>
            }
          </span>
          <button className="filter-summary-clear" onClick={() => setFilter('all')}>Clear ×</button>
        </div>
      )}

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 110px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="serif" style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Nothing yet.</div>
            <div className="tiny soft">Press Write to capture today.</div>
          </div>
        )}
        {filtered.map((e) => (
          <EntryCard key={e.id} entry={e} onDelete={() => deleteJournalEntry(e.id)} />
        ))}
      </div>

      {showNew && (
        <NewEntrySheet
          onClose={() => setShowNew(false)}
          addEntry={addJournalEntry}
          currentEnergy={currentEnergy}
        />
      )}
    </div>
  );
}
