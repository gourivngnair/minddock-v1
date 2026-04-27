import { useState } from 'react';
import type { Task } from '../../types';

interface Props {
  onDone: (tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[]) => void;
}

const FRICTION_ITEMS = [
  { id: 'laundry',   label: 'Laundry',         icon: '🧺', tasks: [{ title: 'Sort laundry', userEstimatedTime: 5, energyRequired: 1 }, { title: 'Put load in washing machine', userEstimatedTime: 5, energyRequired: 1 }, { title: 'Move to dryer / hang clothes', userEstimatedTime: 5, energyRequired: 1 }] },
  { id: 'admin',     label: 'Admin',            icon: '📋', tasks: [{ title: 'Check & respond to important emails', userEstimatedTime: 15, energyRequired: 2 }, { title: 'File one pending document', userEstimatedTime: 10, energyRequired: 1 }] },
  { id: 'dishes',    label: 'Dishes',           icon: '🍽️', tasks: [{ title: 'Clear dishes from sink', userEstimatedTime: 5, energyRequired: 1 }, { title: 'Wash / load dishwasher', userEstimatedTime: 10, energyRequired: 1 }] },
  { id: 'groceries', label: 'Groceries',        icon: '🛒', tasks: [{ title: 'Write grocery list', userEstimatedTime: 5, energyRequired: 1 }, { title: 'Go grocery shopping', userEstimatedTime: 45, energyRequired: 2 }] },
  { id: 'exercise',  label: 'Exercise',         icon: '🏃', tasks: [{ title: 'Put on workout clothes', userEstimatedTime: 5, energyRequired: 1 }, { title: '10-minute movement break', userEstimatedTime: 10, energyRequired: 2 }] },
  { id: 'bills',     label: 'Bills & Finance',  icon: '💳', tasks: [{ title: 'Check bank balance', userEstimatedTime: 5, energyRequired: 1 }, { title: 'Pay one pending bill', userEstimatedTime: 10, energyRequired: 2 }] },
  { id: 'social',    label: 'Social Catch-up',  icon: '💬', tasks: [{ title: 'Reply to one pending message', userEstimatedTime: 5, energyRequired: 1 }] },
  { id: 'self-care', label: 'Self-Care',        icon: '🛁', tasks: [{ title: 'Shower / freshen up', userEstimatedTime: 15, energyRequired: 1 }, { title: 'Take medications / vitamins', userEstimatedTime: 2, energyRequired: 1 }] },
];

export default function FrictionAudit({ onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleContinue = () => {
    const tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[] = [];
    for (const item of FRICTION_ITEMS) {
      if (!selected.includes(item.id)) continue;
      for (const t of item.tasks) {
        tasks.push({ title: t.title, description: '', priority: 1, energyRequired: t.energyRequired as 1|2|3, location: 'home', userEstimatedTime: t.userEstimatedTime, bucketTag: 'Life', recurrence: 'once', isScaffolded: true, completed: false, completedViaFocus: false });
      }
    }
    onDone(tasks);
  };

  return (
    <div className="onboard-wrap fade-in">
      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 2 OF 3</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          What's been piling up?
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Select areas and we'll break them into tiny, completable tasks.
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
                background: active ? 'var(--slate-blue-soft)' : '#fff',
                border: `1.5px solid ${active ? 'var(--slate-blue-deep)' : 'var(--line)'}`,
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                minHeight: 88,
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--slate-blue-deep)' : 'var(--charcoal)', textAlign: 'center' }}>{item.label}</span>
              {active && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--slate-blue-deep)', color: '#fff' }}>
                  {item.tasks.length} tasks
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={handleContinue}>
        {selected.length === 0 ? 'Skip — I\'ll add tasks myself →' : `Preview ${selected.length} area${selected.length > 1 ? 's' : ''} →`}
      </button>
    </div>
  );
}
