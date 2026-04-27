import { useStore } from '../../store/useStore';

const TIPS = [
  { icon: 'ℹ️', text: 'Tap the ℹ on any task card to see how the ADHD-adjusted time was calculated.' },
  { icon: '🎯', text: 'Use Focus Mode to start a session — it\'s the only way to train your Time-Blindness Multiplier.' },
  { icon: '⚡', text: 'Set your energy level each morning — it filters tasks to only what you can realistically do.' },
  { icon: '🧠', text: 'Tap the brain icon at the bottom to quickly dump a task, journal entry, or appointment.' },
];

export default function TutorialOverlay() {
  const setTutorialSeen = useStore((s) => s.setTutorialSeen);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(38,35,30,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 24 }}
    >
      <div style={{ background: 'var(--paper)', borderRadius: 20, padding: '22px 20px 20px', width: '100%', maxWidth: 380 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div className="tiny mono soft" style={{ letterSpacing: '0.08em', marginBottom: 6 }}>QUICK START</div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>A few things to know</div>
        </div>

        <div className="col" style={{ gap: 10, marginBottom: 18 }}>
          {TIPS.map((tip, i) => (
            <div key={i} className="row" style={{ gap: 12, padding: '11px 13px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={setTutorialSeen}>
          Got it, let's go
        </button>
      </div>
    </div>
  );
}
