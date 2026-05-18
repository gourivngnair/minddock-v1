import { useState } from 'react';
import { nanoid } from '../../utils/nanoid';
import type { ScaffoldMaster } from '../../types';

interface Props {
  onDone: (scaffolds: Omit<ScaffoldMaster, 'id' | 'createdAt'>[]) => void;
}

const FRICTION_ITEMS: {
  id: string; label: string; icon: string; color: string;
  steps: { title: string; estimatedMinutes: number }[];
}[] = [
  { id: 'laundry',   label: 'Laundry',        icon: '🧺', color: '#6a82c4',
    steps: [{ title: 'Sort laundry', estimatedMinutes: 5 }, { title: 'Put load in washing machine', estimatedMinutes: 5 }, { title: 'Move to dryer / hang clothes', estimatedMinutes: 5 }] },
  { id: 'admin',     label: 'Admin',           icon: '📋', color: '#9f82c4',
    steps: [{ title: 'Check & respond to important emails', estimatedMinutes: 15 }, { title: 'File one pending document', estimatedMinutes: 10 }] },
  { id: 'dishes',    label: 'Dishes',          icon: '🍽️', color: '#4ca9a0',
    steps: [{ title: 'Clear dishes from sink', estimatedMinutes: 5 }, { title: 'Wash / load dishwasher', estimatedMinutes: 10 }] },
  { id: 'groceries', label: 'Groceries',       icon: '🛒', color: '#56a86a',
    steps: [{ title: 'Write grocery list', estimatedMinutes: 5 }, { title: 'Go grocery shopping', estimatedMinutes: 45 }] },
  { id: 'exercise',  label: 'Exercise',        icon: '🏃', color: '#d97862',
    steps: [{ title: 'Put on workout clothes', estimatedMinutes: 5 }, { title: '10-minute movement break', estimatedMinutes: 10 }] },
  { id: 'bills',     label: 'Bills & Finance', icon: '💳', color: '#c9993c',
    steps: [{ title: 'Check bank balance', estimatedMinutes: 5 }, { title: 'Pay one pending bill', estimatedMinutes: 10 }] },
  { id: 'social',    label: 'Social Catch-up', icon: '💬', color: '#c46a7a',
    steps: [{ title: 'Reply to one pending message', estimatedMinutes: 5 }] },
  { id: 'self-care', label: 'Self-Care',       icon: '🛁', color: '#b8932c',
    steps: [{ title: 'Shower / freshen up', estimatedMinutes: 15 }, { title: 'Take medications / vitamins', estimatedMinutes: 2 }] },
];

export default function FrictionAudit({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleContinue = () => {
    const scaffolds: Omit<ScaffoldMaster, 'id' | 'createdAt'>[] = FRICTION_ITEMS
      .filter((item) => selected.includes(item.id))
      .map((item) => ({
        name: item.label,
        icon: item.icon,
        color: item.color,
        steps: item.steps.map((s) => ({ id: nanoid(), title: s.title, estimatedMinutes: s.estimatedMinutes })),
      }));
    onDone(scaffolds);
  };

  return (
    <div className="onboard-wrap fade-in">
      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 2 OF 3</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          What's been piling up?
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Select areas and we'll create scaffolds — step-by-step routines you can start anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, overflowY: 'auto' }}>
        {FRICTION_ITEMS.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '16px 10px',
                background: active ? `${item.color}15` : '#fff',
                border: `1.5px solid ${active ? item.color : 'var(--line)'}`,
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                minHeight: 88,
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? item.color : 'var(--charcoal)', textAlign: 'center' }}>
                {item.label}
              </span>
              {active && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: item.color, color: '#fff' }}>
                  {item.steps.length} steps
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={handleContinue}>
        {selected.length === 0 ? "Skip — I'll add tasks myself →" : `Preview ${selected.length} scaffold${selected.length > 1 ? 's' : ''} →`}
      </button>
    </div>
  );
}
