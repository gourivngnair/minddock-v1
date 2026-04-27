import { useState } from 'react';
import { useStore } from '../../store/useStore';
import FrictionAudit from './FrictionAudit';
import TaskPreview from './TaskPreview';
import type { Task } from '../../types';

const SYMPTOMS = [
  { id: 'time-blindness',        label: 'Time Blindness',         icon: '⏰', desc: 'Tasks always take longer than expected' },
  { id: 'exec-dysfunction',      label: 'Executive Dysfunction',  icon: '🧠', desc: 'Trouble starting or switching tasks' },
  { id: 'hyperfocus',            label: 'Hyperfocus',              icon: '🔍', desc: 'Over-investing in one thing at the expense of others' },
  { id: 'working-memory',        label: 'Working Memory Issues',  icon: '💭', desc: 'Forgetting steps mid-task' },
  { id: 'rejection-sensitivity', label: 'Rejection Sensitivity',  icon: '💔', desc: 'Avoidance due to fear of failure' },
  { id: 'overwhelm',             label: 'Overwhelm',               icon: '🌊', desc: 'Too many options cause paralysis' },
];

const FEATURES = [
  { icon: '⚡', title: 'Capacity-First',       desc: 'Only shows tasks you can realistically do right now' },
  { icon: '🎯', title: 'Focus Mode',            desc: 'Learns how long tasks really take you — not how long you guess' },
  { icon: '⏱', title: 'Time-Blindness Coach',  desc: 'Adjusts your estimates using your real patterns' },
  { icon: '🧩', title: 'Friction Scaffolds',    desc: 'Breaks overwhelming tasks into tiny, completable steps' },
];

type Step = 'welcome' | 'symptoms' | 'friction' | 'preview';

/* ── Progress dots ── */
function Dots({ step }: { step: Step }) {
  const ORDER: Step[] = ['welcome', 'symptoms', 'friction', 'preview'];
  const idx = ORDER.indexOf(step);
  return (
    <div className="row" style={{ gap: 6, justifyContent: 'center', padding: '0 0 4px' }}>
      {ORDER.map((s, i) => (
        <div
          key={s}
          style={{
            width: i === idx ? 20 : 6,
            height: 6,
            borderRadius: 99,
            background: i === idx ? 'var(--charcoal)' : i < idx ? 'var(--slate-blue)' : 'var(--line)',
            transition: 'all 0.25s',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[]>([]);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const toggleSymptom = (id: string) =>
    setSelectedSymptoms((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  if (step === 'friction') return <FrictionAudit onDone={(t) => { setPendingTasks(t); setStep('preview'); }} />;
  if (step === 'preview')  return <TaskPreview tasks={pendingTasks} onSubmit={(t) => completeOnboarding(selectedSymptoms, t)} />;

  /* ── Welcome ── */
  if (step === 'welcome') {
    return (
      <div className="onboard-wrap fade-in">
        <Dots step="welcome" />

        <div>
          <div className="serif" style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--charcoal)' }}>
            Let's set up<br />your brain.
          </div>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: 14.5, lineHeight: 1.65 }}>
            MindDock adapts to how your mind works — not the other way around.
          </p>
        </div>

        <div className="col" style={{ gap: 8 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="row"
              style={{ gap: 14, padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12 }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 'auto' }} onClick={() => setStep('symptoms')}>
          Get started →
        </button>
      </div>
    );
  }

  /* ── Symptoms ── */
  return (
    <div className="onboard-wrap fade-in">
      <Dots step="symptoms" />

      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 1 OF 3</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          What challenges do you face?
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Select all that apply — this personalises your Patterns tab.
        </p>
      </div>

      <div className="col" style={{ gap: 8, flex: 1 }}>
        {SYMPTOMS.map((s) => {
          const active = selectedSymptoms.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggleSymptom(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                background: active ? 'var(--slate-blue-soft)' : '#fff',
                border: `1.5px solid ${active ? 'var(--slate-blue-deep)' : 'var(--line)'}`,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: active ? 'var(--slate-blue-deep)' : 'var(--charcoal)' }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2, lineHeight: 1.45 }}>{s.desc}</div>
              </div>
              {active && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate-blue-deep)" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={() => setStep('welcome')}
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={() => setStep('friction')}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
