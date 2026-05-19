import { useState } from 'react';
import { useStore } from '../../store/useStore';
import FrictionAudit from './FrictionAudit';
import DatePicker from '../shared/DatePicker';
import type { ScaffoldMaster, ScaffoldRecurrence, UserEnergy } from '../../types';

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
  { icon: '🧩', title: 'Friction Scaffolds',    desc: 'Breaks overwhelming routines into sequential, completable steps' },
];

type Step = 'welcome' | 'symptoms' | 'friction' | 'energy' | 'preview';

function Dots({ step }: { step: Step }) {
  const ORDER: Step[] = ['welcome', 'symptoms', 'friction', 'preview', 'energy'];
  const idx = ORDER.indexOf(step);
  return (
    <div className="row" style={{ gap: 6, justifyContent: 'center', padding: '0 0 4px' }}>
      {ORDER.map((s, i) => (
        <div key={s} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 99, background: i === idx ? 'var(--charcoal)' : i < idx ? 'var(--slate-blue)' : 'var(--line)', transition: 'all 0.25s' }} />
      ))}
    </div>
  );
}

const getToday = () => new Date().toLocaleDateString('en-CA');

const RECUR_OPTS: { value: ScaffoldRecurrence; label: string }[] = [
  { value: 'once', label: 'Once' }, { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Every 2 wks' },
  { value: 'monthly', label: 'Monthly' },
];

/* ── Scaffold preview step ── */
function ScaffoldPreview({
  scaffolds, onSubmit, onBack,
}: {
  scaffolds: Omit<ScaffoldMaster, 'id' | 'createdAt'>[];
  onSubmit: (scheduled: Omit<ScaffoldMaster, 'id' | 'createdAt'>[]) => void;
  onBack: () => void;
}) {
  type Sched = { recurrence: ScaffoldRecurrence; startDate: string };

  const [schedules, setSchedules] = useState<Sched[]>(
    scaffolds.map(() => ({ recurrence: 'weekly', startDate: getToday() }))
  );

  const setRec  = (i: number, r: ScaffoldRecurrence) =>
    setSchedules((s) => s.map((x, idx) => idx === i ? { ...x, recurrence: r } : x));
  const setDate = (i: number, d: string) =>
    setSchedules((s) => s.map((x, idx) => idx === i ? { ...x, startDate: d } : x));

  const chip = (active: boolean, label: string, onClick: () => void, color: string) => (
    <button onClick={onClick} style={{
      padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      border: `1.5px solid ${active ? color : 'var(--line)'}`,
      background: active ? `${color}18` : 'var(--paper2)',
      color: active ? color : 'var(--ink-soft)', transition: 'all 0.1s',
    }}>{label}</button>
  );

  return (
    <div className="onboard-wrap onboard-wrap--scroll-inner fade-in">
      <Dots step="preview" />
      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 3 OF 4</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          Schedule your scaffolds
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Set when each scaffold runs. Each step unlocks automatically after the previous is done.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scaffolds.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink-muted)', fontSize: 14 }}>
            No scaffolds selected — you can create them later in the Scaffolds tab.
          </div>
        )}
        {scaffolds.map((m, i) => (
          <div key={i} style={{ flexShrink: 0, background: '#fff', border: `1.5px solid ${m.color}30`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: `${m.color}0a` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color}20`, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--charcoal)' }}>{m.name}</div>
                <div className="tiny muted">{m.steps.length} steps · {m.steps.reduce((a, s) => a + s.estimatedMinutes, 0)}m</div>
              </div>
            </div>

            {/* Schedule controls */}
            <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Recurrence */}
              <div>
                <div className="tiny muted" style={{ marginBottom: 5 }}>Repeat</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {RECUR_OPTS.map((o) => chip(schedules[i].recurrence === o.value, o.label, () => setRec(i, o.value), m.color))}
                </div>
              </div>
              {/* Start date */}
              <div>
                <div className="tiny muted" style={{ marginBottom: 5 }}>Starts</div>
                <DatePicker small value={schedules[i].startDate} onChange={(d) => setDate(i, d)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>← Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }}
          onClick={() => onSubmit(scaffolds.map((s, i) => ({ ...s, recurrence: schedules[i].recurrence, startDate: schedules[i].startDate })))}>
          {scaffolds.length > 0 ? `Save ${scaffolds.length} scaffold${scaffolds.length > 1 ? 's' : ''} →` : 'Finish setup →'}
        </button>
      </div>
    </div>
  );
}

const EC_COLORS: Record<number, string> = { 1: '#E24B4A', 2: '#EF9F27', 3: '#97C459', 4: '#378ADD', 5: '#534AB7' };
const EC_LABELS: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };
const BASELINE_SLOTS = [
  { hour: 5,  label: '5 am' },
  { hour: 9,  label: '9 am' },
  { hour: 13, label: '1 pm' },
  { hour: 17, label: '5 pm' },
  { hour: 21, label: '9 pm' },
];

function EnergyBaseline({
  baseline, onChange, onNext, onBack,
}: {
  baseline: Record<number, UserEnergy>;
  onChange: (hour: number, val: UserEnergy) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="onboard-wrap fade-in">
      <Dots step="energy" />
      <div>
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 4 OF 4</div>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--charcoal)' }}>
          How's your energy usually?
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>
          Pick your typical energy at these times. This seeds your Patterns graph so it's useful from day one.
        </p>
      </div>

      <div className="col" style={{ gap: 14, flex: 1 }}>
        {BASELINE_SLOTS.map(({ hour, label }) => {
          const val = baseline[hour];
          return (
            <div key={hour} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', textAlign: 'right' }}>{label}</div>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                {([1, 2, 3, 4, 5] as UserEnergy[]).map((lvl) => {
                  const active = val === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => onChange(hour, lvl)}
                      title={EC_LABELS[lvl]}
                      style={{
                        flex: 1, height: 36, borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${active ? EC_COLORS[lvl] : 'var(--line)'}`,
                        background: active ? EC_COLORS[lvl] : 'var(--paper2)',
                        color: active ? '#fff' : EC_COLORS[lvl],
                        fontSize: 12, fontWeight: 700, transition: 'all 0.12s',
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
              <div style={{ width: 54, flexShrink: 0, fontSize: 12, color: EC_COLORS[val], fontWeight: 600 }}>{EC_LABELS[val]}</div>
            </div>
          );
        })}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>← Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={onNext}>Finish setup →</button>
      </div>
    </div>
  );
}

export default function OnboardingFlow() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [pendingScaffolds, setPendingScaffolds]   = useState<Omit<ScaffoldMaster, 'id' | 'createdAt'>[]>([]);
  const [scheduledScaffolds, setScheduledScaffolds] = useState<Omit<ScaffoldMaster, 'id' | 'createdAt'>[]>([]);
  const [baseline, setBaseline] = useState<Record<number, UserEnergy>>({ 5: 2, 9: 4, 13: 3, 17: 3, 21: 2 });

  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const addScaffoldMaster  = useStore((s) => s.addScaffoldMaster);
  const addEnergyLog       = useStore((s) => s.addEnergyLog);

  const toggleSymptom = (id: string) =>
    setSelectedSymptoms((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const finish = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    BASELINE_SLOTS.forEach(({ hour }) => {
      const ts = new Date(yesterday);
      ts.setHours(hour, 0, 0, 0);
      addEnergyLog(baseline[hour], 'baseline', ts.toISOString());
    });
    scheduledScaffolds.forEach((m) => addScaffoldMaster(m));
    completeOnboarding(selectedSymptoms, []);
  };

  if (step === 'friction') return (
    <FrictionAudit onDone={(scaffolds) => { setPendingScaffolds(scaffolds); setStep('preview'); }} />
  );

  if (step === 'preview') return (
    <ScaffoldPreview
      scaffolds={pendingScaffolds}
      onSubmit={(scheduled) => { setScheduledScaffolds(scheduled); setStep('energy'); }}
      onBack={() => setStep('friction')}
    />
  );

  if (step === 'energy') return (
    <EnergyBaseline
      baseline={baseline}
      onChange={(hour, val) => setBaseline((b) => ({ ...b, [hour]: val }))}
      onNext={finish}
      onBack={() => setStep('preview')}
    />
  );

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
            <div key={f.title} className="row" style={{ gap: 14, padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12 }}>
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
        <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>STEP 1 OF 4</div>
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
              {active && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate-blue-deep)" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          );
        })}
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('welcome')}>← Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep('friction')}>Next →</button>
      </div>
    </div>
  );
}
