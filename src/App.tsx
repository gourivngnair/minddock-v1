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
import ErrorBoundary from './components/shared/ErrorBoundary';

const TAB_SCREENS = ['tasks', 'appointments', 'calendar', 'patterns', 'journal', 'settings'] as const;

export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase);
  const clearSession        = useStore((s) => s.clearSession);
  const screen              = useStore((s) => s.screen);
  const dataLoading         = useStore((s) => s.dataLoading);
  const [showDump, setShowDump] = useState(false);

  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!authUser) {
      hydratedFor.current = null;
      clearSession();
      return;
    }
    // Only hydrate once per user id (avoid double-call on tab focus)
    if (hydratedFor.current === authUser.id) return;
    hydratedFor.current = authUser.id;
    hydrateFromSupabase(authUser.id);
  }, [authUser, hydrateFromSupabase, clearSession]);

  const isTab = TAB_SCREENS.includes(screen as typeof TAB_SCREENS[number]);

  // ── Full-screen loading spinner ──────────────────────────────────────────
  if (authLoading || dataLoading) {
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
        {/* Not authenticated — show login/signup */}
        {!authUser && <AuthScreen />}

        {authUser && (
          <>
            {screen === 'resurrection' && <ResurrectionScreen />}
            {screen === 'onboarding'   && <OnboardingFlow />}
            {screen === 'focus'        && <FocusMode />}
            {screen === 'today'        && <TodayView />}

            {isTab && (
              <>
                {screen === 'tasks'        && <TasksTab />}
                {screen === 'appointments' && <AppointmentsTab />}
                {screen === 'calendar'     && <CalendarTab />}
                {screen === 'patterns'     && <PatternsTab />}
                {screen === 'journal'      && <JournalTab />}
                {screen === 'settings'     && <SettingsTab />}
                <BottomNav onOpenDump={() => setShowDump(true)} />
                {showDump && <CommandCenter onClose={() => setShowDump(false)} />}
              </>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
