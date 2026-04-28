import { useStore } from '../../store/useStore';
import type { Screen } from '../../types';

interface Props { onOpenDump: () => void; }

const ALL_NAV: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  {
    screen: 'today', label: 'Today',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    screen: 'tasks', label: 'Tasks',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    screen: 'calendar', label: 'Calendar',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>,
  },
  {
    screen: 'journal', label: 'Journal',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    screen: 'patterns', label: 'Patterns',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  },
  {
    screen: 'appointments', label: 'Appointments',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
  },
  {
    screen: 'settings', label: 'Me',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  },
];

// Bottom nav only shows 6 items (3+fab+3); on desktop sidebar shows all 7
const LEFT  = ALL_NAV.slice(0, 3);
const RIGHT = ALL_NAV.slice(3, 6);

const BRAIN = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

export default function BottomNav({ onOpenDump }: Props) {
  const screen    = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);

  const Tab = ({ t }: { t: typeof ALL_NAV[0] }) => (
    <button
      className={`tab-btn${screen === t.screen ? ' active' : ''}`}
      onClick={() => setScreen(t.screen)}
    >
      {t.icon}
      <span>{t.label}</span>
    </button>
  );

  return (
    <div className="bottom-dock">
      {/* Desktop-only sidebar header */}
      <div className="sidebar-header">
        <div className="serif" style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--charcoal)' }}>
          MindDock
        </div>
        <div className="tiny muted" style={{ marginTop: 1 }}>ADHD Coach</div>
      </div>

      {/* Brain dump FAB */}
      <button className="fab" onClick={onOpenDump} aria-label="Brain dump">{BRAIN}</button>

      {/* Mobile: left tabs, then right tabs with FAB in between (handled by CSS order) */}
      {/* Desktop: all tabs listed vertically */}
      <div className="nav-tabs-mobile">
        {LEFT.map((t) => <Tab key={t.screen} t={t} />)}
      </div>
      <div className="nav-tabs-mobile">
        {RIGHT.map((t) => <Tab key={t.screen} t={t} />)}
      </div>
      <div className="nav-tabs-desktop">
        {ALL_NAV.map((t) => <Tab key={t.screen} t={t} />)}
      </div>
    </div>
  );
}
