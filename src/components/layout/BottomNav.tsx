import { useStore } from '../../store/useStore';
import LogoMark from '../shared/LogoMark';
import type { Screen } from '../../types';

interface Props {
  onOpenDump: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

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
    screen: 'appointments', label: 'Appts',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
  },
  {
    screen: 'settings', label: 'Me',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  },
];

const LEFT  = ALL_NAV.slice(0, 3);
const RIGHT = ALL_NAV.slice(3, 6);

const BRAIN_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

export default function BottomNav({ onOpenDump, collapsed = false, onToggle }: Props) {
  const screen    = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);

  const Tab = ({ t }: { t: typeof ALL_NAV[0] }) => (
    <button
      className={`tab-btn${screen === t.screen ? ' active' : ''}`}
      onClick={() => setScreen(t.screen)}
      title={collapsed ? t.label : undefined}
    >
      {t.icon}
      <span>{t.label}</span>
    </button>
  );

  return (
    <div className={`bottom-dock${collapsed ? ' collapsed' : ''}`}>

      {/* ── Sidebar header (desktop only) — logo + collapse toggle ── */}
      <div className="sidebar-header">
        {collapsed ? (
          /* Collapsed: just logo mark, clickable to expand */
          <button
            className="sidebar-logo-btn"
            onClick={onToggle}
            title="Expand sidebar"
          >
            <LogoMark size={30} variant="white" />
          </button>
        ) : (
          /* Expanded: logo + wordmark + collapse chevron */
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <LogoMark size={30} variant="white" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-brand">MindDock</div>
              <div className="sidebar-sub">ADHD Coach</div>
            </div>
            {onToggle && (
              <button className="nav-collapse-btn" onClick={onToggle} title="Collapse sidebar">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile: LEFT + FAB + RIGHT */}
      <div className="nav-tabs-mobile">
        {LEFT.map((t) => <Tab key={t.screen} t={t} />)}
      </div>
      <button className="fab" onClick={onOpenDump} aria-label="Brain dump">{BRAIN_ICON}</button>
      <div className="nav-tabs-mobile">
        {RIGHT.map((t) => <Tab key={t.screen} t={t} />)}
      </div>

      {/* Desktop: all items vertical */}
      <div className="nav-tabs-desktop">
        {ALL_NAV.map((t) => <Tab key={t.screen} t={t} />)}
      </div>

      {/* Collapsed: expand button at bottom */}
      {collapsed && onToggle && (
        <button
          className="nav-collapse-btn"
          onClick={onToggle}
          title="Expand sidebar"
          style={{ margin: '8px auto', width: 40 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
    </div>
  );
}
