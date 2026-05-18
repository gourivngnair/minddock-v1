import { useState } from 'react';
import { nanoid } from '../../utils/nanoid';
import DatePicker from '../shared/DatePicker';
import type { ScaffoldMaster, ScaffoldStep, ScaffoldRecurrence } from '../../types';

const todayStr = () => new Date().toLocaleDateString('en-CA');

const ICONS  = ['🧺','🏠','📋','💼','🍳','🚗','💊','📚','🧹','🛒','💻','📧','🎯','🏋️','🌿','✨','🎨','🧪'];
const COLORS = [
  { label: 'Blue',   val: '#6a82c4' }, { label: 'Green',  val: '#56a86a' },
  { label: 'Terra',  val: '#d97862' }, { label: 'Amber',  val: '#c9993c' },
  { label: 'Teal',   val: '#4ca9a0' }, { label: 'Purple', val: '#9f82c4' },
  { label: 'Pink',   val: '#c46a7a' }, { label: 'Gold',   val: '#b8932c' },
];
const RECURRENCE_OPTS: { value: ScaffoldRecurrence; label: string }[] = [
  { value: 'once',     label: 'Once' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 wks' },
  { value: 'monthly',  label: 'Monthly' },
];

interface Props {
  master?: ScaffoldMaster;
  onSave: (data: Omit<ScaffoldMaster, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function ScaffoldEditor({ master, onSave, onClose }: Props) {
  const [name,       setName]       = useState(master?.name  ?? '');
  const [icon,       setIcon]       = useState(master?.icon  ?? '🧺');
  const [color,      setColor]      = useState(master?.color ?? '#6a82c4');
  const [steps,      setSteps]      = useState<ScaffoldStep[]>(
    master?.steps.length ? master.steps : [{ id: nanoid(), title: '', estimatedMinutes: 10 }]
  );
  const [recurrence, setRecurrence] = useState<ScaffoldRecurrence | undefined>(master?.recurrence);
  const [startDate,  setStartDate]  = useState(master?.startDate ?? todayStr());

  const addStep    = () => setSteps((s) => [...s, { id: nanoid(), title: '', estimatedMinutes: 10 }]);
  const removeStep = (id: string) => setSteps((s) => s.filter((x) => x.id !== id));
  const patchStep  = (id: string, key: keyof ScaffoldStep, val: string | number) =>
    setSteps((s) => s.map((x) => x.id === id ? { ...x, [key]: val } : x));
  const moveUp   = (i: number) => { if (i === 0) return; setSteps((s) => { const a = [...s]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; }); };
  const moveDown = (i: number) => setSteps((s) => { if (i >= s.length-1) return s; const a=[...s]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });

  const valid = name.trim().length > 0 && steps.length > 0 && steps.every((s) => s.title.trim().length > 0);

  const arrowBtn = (label: string, onClick: () => void, disabled: boolean) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 22, height: 22, borderRadius: 5, border: '1px solid var(--line)',
      background: disabled ? 'transparent' : 'var(--paper2)',
      cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: disabled ? 'var(--ink-faint)' : 'var(--ink-soft)', fontSize: 11,
    }}>{label}</button>
  );

  const chip = (active: boolean, label: string, onClick: () => void) => (
    <button onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: `1.5px solid ${active ? color : 'var(--line)'}`,
      background: active ? `${color}18` : 'var(--paper2)',
      color: active ? color : 'var(--ink-soft)', transition: 'all 0.1s',
    }}>{label}</button>
  );

  return (
    <div className="modal-back fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="sheet-grip" />
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 16 }}>
          {master ? 'EDIT SCAFFOLD' : 'NEW SCAFFOLD'}
        </div>

        {/* Name */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Name</label>
          <input className="input" placeholder="e.g. Laundry, Admin, Morning routine…"
            value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        {/* Icon */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 36, height: 36, borderRadius: 9, cursor: 'pointer', fontSize: 17,
                border: `2px solid ${icon === ic ? color : 'var(--line)'}`,
                background: icon === ic ? `${color}18` : 'var(--paper2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{ic}</button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c.val} onClick={() => setColor(c.val)} title={c.label} style={{
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                border: `3px solid ${color === c.val ? c.val : 'transparent'}`,
                background: c.val, outline: color === c.val ? `2px solid ${c.val}40` : 'none', outlineOffset: 1,
              }} />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="field" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ marginBottom: 0 }}>Steps <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(in order)</span></label>
            <span className="tiny muted">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--paper2)', borderRadius: 10, padding: '8px 10px', border: '1px solid var(--line)' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input className="input" placeholder={`Step ${i + 1} title…`} value={step.title}
                    onChange={(e) => patchStep(step.id, 'title', e.target.value)}
                    style={{ padding: '5px 8px', fontSize: 13 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <input type="number" min={1} max={240} className="input" value={step.estimatedMinutes}
                      onChange={(e) => patchStep(step.id, 'estimatedMinutes', Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: 56, padding: '4px 7px', fontSize: 12, textAlign: 'center' }} />
                    <span className="tiny muted">min</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                  {arrowBtn('↑', () => moveUp(i),   i === 0)}
                  {arrowBtn('↓', () => moveDown(i), i === steps.length - 1)}
                  <button onClick={() => removeStep(step.id)} disabled={steps.length === 1} style={{
                    width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', flexShrink: 0,
                    cursor: steps.length === 1 ? 'default' : 'pointer',
                    color: steps.length === 1 ? 'var(--ink-faint)' : 'var(--danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addStep} style={{
            width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, cursor: 'pointer',
            border: `1.5px dashed ${color}80`, background: `${color}08`, color,
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>+</span> Add step
          </button>
        </div>

        {/* ── Schedule ── */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Schedule <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(optional)</span></label>

          {/* Recurrence */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {chip(!recurrence, 'Manual only', () => setRecurrence(undefined))}
            {RECURRENCE_OPTS.map((o) => chip(recurrence === o.value, o.label, () => setRecurrence(o.value)))}
          </div>

          {/* Start date — only when recurrence is set */}
          {recurrence && (
            <div>
              <div className="tiny muted" style={{ marginBottom: 6 }}>Starts</div>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
          )}
        </div>

        {/* Preview */}
        {name.trim() && (
          <div style={{ marginTop: 6, marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: `${color}10`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color }}>{name}</div>
              <div className="tiny muted">
                {steps.length} step{steps.length !== 1 ? 's' : ''} · {steps.reduce((a, s) => a + s.estimatedMinutes, 0)}m
                {recurrence && ` · ${RECURRENCE_OPTS.find(o => o.value === recurrence)?.label} from ${new Date(startDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2, background: color }} disabled={!valid}
            onClick={() => {
              onSave({ name: name.trim(), icon, color, steps, recurrence, startDate: recurrence ? startDate : undefined });
              onClose();
            }}
          >
            {master ? 'Save changes' : 'Create scaffold'}
          </button>
        </div>

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
