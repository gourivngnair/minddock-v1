import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/auth/AuthScreen';
import ResurrectionScreen from './components/auth/ResurrectionScreen';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import TodayView from './components/today/TodayView';
import FocusMode from './components/focus/FocusMode';
import TasksTab from './components/tasks/TasksTab';
import AppointmentsTab from './components/appointments/AppointmentsTab';
import CalendarTab from './components/calendar/CalendarTab';
import PatternsTab from './components/patterns/PatternsTab';
import JournalTab from './components/journal/JournalTab';
import SettingsTab from './components/settings/SettingsTab';
import BottomNav from './components/layout/BottomNav';
import CommandCenter from './components/tasks/CommandCenter';
import BrainDumpSidebar from './components/tasks/BrainDumpSidebar';
import ErrorBoundary from './components/shared/ErrorBoundary';

const TAB_SCREENS = ['tasks', 'appointments', 'calendar', 'patterns', 'journal', 'settings'] as const;

export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const hydrateFromSupabase     = useStore((s) => s.hydrateFromSupabase);
  const clearSession            = useStore((s) => s.clearSession);
  const checkScheduledScaffolds = useStore((s) => s.checkScheduledScaffolds);
  const screen                  = useStore((s) => s.screen);
  const dataLoading         = useStore((s) => s.dataLoading);
  const hasLocalUser        = useStore((s) => s.user !== null);
  const [showDump, setShowDump]           = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const hydratedFor = useRef<string | null>(null);

  // Re-check scheduled scaffolds when user returns to the tab (handles overnight cases)
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') checkScheduledScaffolds(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [checkScheduledScaffolds]);

  useEffect(() => {
    // Wait until Supabase has confirmed the session before acting.
    // Without this guard, clearSession() fires on mount (authUser = null)
    // and wipes localStorage before getSession() even resolves.
    if (authLoading) return;

    if (!authUser) {
      hydratedFor.current = null;
      clearSession();
      return;
    }
    if (hydratedFor.current === authUser.id) return;
    hydratedFor.current = authUser.id;
    hydrateFromSupabase(authUser.id);
  }, [authUser, authLoading, hydrateFromSupabase, clearSession]);

  const isTab = TAB_SCREENS.includes(screen as typeof TAB_SCREENS[number]);

  // Show full-screen spinner only on a true first load (no persisted data).
  // If localStorage already has data, render immediately and let Supabase
  // sync silently in the background — no flash of empty state.
  const showSpinner = authLoading || (dataLoading && !hasLocalUser);

  if (showSpinner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
        <div className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--charcoal)' }}>
          MindDock
        </div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--charcoal)', animation: 'spin 0.8s linear infinite' }} />
        <span className="tiny muted">{authLoading ? 'Checking session…' : 'Loading your data…'}</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-shell">
        {!authUser && <AuthScreen />}

        {authUser && (
          <>
            {screen === 'resurrection' && <ResurrectionScreen />}
            {screen === 'onboarding'   && <OnboardingFlow />}
            {screen === 'focus'        && <FocusMode />}

            {(screen === 'today' || isTab) && (
              <>
                <BottomNav
                  onOpenDump={() => setShowDump(true)}
                  collapsed={leftCollapsed}
                  onToggle={() => setLeftCollapsed((v) => !v)}
                />
                <div className="app-main">
                  {screen === 'today'        && <TodayView />}
                  {screen === 'tasks'        && <TasksTab />}
                  {screen === 'appointments' && <AppointmentsTab />}
                  {screen === 'calendar'     && <CalendarTab />}
                  {screen === 'patterns'     && <PatternsTab />}
                  {screen === 'journal'      && <JournalTab />}
                  {screen === 'settings'     && <SettingsTab />}
                </div>
                <BrainDumpSidebar
                  collapsed={rightCollapsed}
                  onToggle={() => setRightCollapsed((v) => !v)}
                />
                {showDump && <CommandCenter onClose={() => setShowDump(false)} />}
              </>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
