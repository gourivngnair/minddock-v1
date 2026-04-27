import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid';
import { calcAppRecommendedTime, updateMultiplierB } from '../utils/scoring';
import * as db from '../lib/db';
import type {
  Task, Appointment, JournalEntry, UserProfile, UserEnergy, Screen, PatternEntry
} from '../types';

interface AppState {
  screen: Screen;
  user: UserProfile | null;
  userId: string | null;        // Supabase auth user id
  tasks: Task[];
  appointments: Appointment[];
  journal: JournalEntry[];
  focusTaskId: string | null;
  focusStartTime: number | null;
  focusBreakTime: number;
  stuckModeIndex: number;
  dataLoading: boolean;

  // Called by App after Supabase auth resolves
  hydrateFromSupabase: (userId: string) => Promise<void>;
  clearSession: () => void;

  // Auth helpers (local-only, Supabase auth handled in the UI)
  checkResurrection: () => boolean;
  freshStart: () => void;

  // Onboarding
  completeOnboarding: (symptoms: string[], tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[]) => void;
  setTutorialSeen: () => void;

  // Navigation
  setScreen: (screen: Screen) => void;

  // Energy & Stuck
  setUserEnergy: (energy: UserEnergy) => void;
  toggleStuckMode: () => void;
  setStuckModeIndex: (idx: number) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, viaFocus?: boolean) => void;

  // Appointments
  addAppointment: (appt: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Focus Mode
  startFocus: (taskId: string) => void;
  addFocusBreak: (minutes: number) => void;
  completeFocus: (taskId: string, totalActualMinutes: number) => void;
  cancelFocus: () => void;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'dailyEnergy'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Data management
  clearCompleted: () => void;
  resetAll: () => void;
  updateUserName: (name: string) => void;
}

// ── Helper: sync profile to Supabase after local update ──────────────────────
function syncProfile(userId: string | null, profile: UserProfile | null) {
  if (!userId || !profile) return;
  db.upsertProfile(userId, profile).catch(console.error);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'auth',
      user: null,
      userId: null,
      tasks: [],
      appointments: [],
      journal: [],
      focusTaskId: null,
      focusStartTime: null,
      focusBreakTime: 0,
      stuckModeIndex: 0,
      dataLoading: false,

      // ── Called by App once Supabase auth resolves ───────────────────────────
      hydrateFromSupabase: async (userId) => {
        set({ dataLoading: true, userId });

        const { profile, tasks, appointments, journal } = await db.loadAllUserData(userId);

        if (!profile) {
          // New user — no profile yet (trigger will create it shortly)
          set({
            userId,
            dataLoading: false,
            screen: 'onboarding',
            user: {
              name: '', multiplierB: 1.5, xp: 0, symptoms: [],
              currentEnergy: 3, stuckMode: false,
              lastActive: new Date().toISOString(),
              onboardingComplete: false, tutorialSeen: false, patternHistory: [],
            },
          });
          return;
        }

        const now = new Date().toISOString();
        const diff = Date.now() - new Date(profile.lastActive).getTime();
        const needsResurrection = diff > 48 * 60 * 60 * 1000;

        set({
          userId,
          user: { ...profile, lastActive: now },
          tasks,
          appointments,
          journal,
          dataLoading: false,
          screen: !profile.onboardingComplete
            ? 'onboarding'
            : needsResurrection
            ? 'resurrection'
            : 'today',
        });

        // Touch lastActive in DB
        db.upsertProfile(userId, { lastActive: now }).catch(console.error);
      },

      clearSession: () =>
        set({ screen: 'auth', user: null, userId: null, tasks: [], appointments: [], journal: [] }),

      checkResurrection: () => {
        const user = get().user;
        if (!user) return false;
        return Date.now() - new Date(user.lastActive).getTime() > 48 * 60 * 60 * 1000;
      },

      freshStart: () => {
        const uid = get().userId;
        // Delete all tasks in DB for this user (fire and forget)
        if (uid) {
          get().tasks.forEach((t) => db.deleteTask(t.id).catch(console.error));
        }
        set((s) => ({
          tasks: [],
          user: s.user ? { ...s.user, lastActive: new Date().toISOString() } : s.user,
          screen: 'onboarding',
        }));
      },

      completeOnboarding: (symptoms, rawTasks) => {
        const { userId } = get();
        const b   = get().user?.multiplierB ?? 1.5;
        const now = new Date().toISOString();
        const tasks: Task[] = rawTasks.map((t) => ({
          ...t,
          id: nanoid(),
          createdAt: now,
          appRecommendedTime: calcAppRecommendedTime(t.userEstimatedTime, b),
        }));

        set((s) => ({
          user: s.user ? { ...s.user, symptoms, onboardingComplete: true, lastActive: now } : s.user,
          tasks: [...s.tasks, ...tasks],
          screen: 'today',
        }));

        if (userId) {
          db.upsertProfile(userId, { symptoms, onboardingComplete: true, lastActive: now }).catch(console.error);
          tasks.forEach((t) => db.insertTask(userId, t).catch(console.error));
        }
      },

      setTutorialSeen: () => {
        set((s) => ({ user: s.user ? { ...s.user, tutorialSeen: true } : s.user }));
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      setScreen: (screen) => set({ screen }),

      setUserEnergy: (energy) => {
        set((s) => ({ user: s.user ? { ...s.user, currentEnergy: energy } : s.user }));
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      toggleStuckMode: () => {
        set((s) => ({
          user: s.user ? { ...s.user, stuckMode: !s.user.stuckMode } : s.user,
          stuckModeIndex: 0,
        }));
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      setStuckModeIndex: (idx) => set({ stuckModeIndex: idx }),

      addTask: (rawTask) => {
        const { userId } = get();
        const b    = get().user?.multiplierB ?? 1.5;
        const task: Task = {
          ...rawTask,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          appRecommendedTime: calcAppRecommendedTime(rawTask.userEstimatedTime, b),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        if (userId) db.insertTask(userId, task).catch(console.error);
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, ...updates };
            if (updates.userEstimatedTime !== undefined)
              updated.appRecommendedTime = calcAppRecommendedTime(updates.userEstimatedTime, s.user?.multiplierB ?? 1.5);
            return updated;
          }),
        }));
        db.updateTask(id, updates).catch(console.error);
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        db.deleteTask(id).catch(console.error);
      },

      completeTask: (id, viaFocus = false) => {
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: true, completedViaFocus: viaFocus } : t),
          user: s.user ? { ...s.user, xp: s.user.xp + (viaFocus ? 20 : 10) } : s.user,
        }));
        db.updateTask(id, { completed: true, completedViaFocus: viaFocus }).catch(console.error);
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      addAppointment: (appt) => {
        const { userId } = get();
        const full: Appointment = { ...appt, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ appointments: [...s.appointments, full] }));
        if (userId) db.insertAppointment(userId, full).catch(console.error);
        // +3 XP
        set((s) => ({ user: s.user ? { ...s.user, xp: s.user.xp + 3 } : s.user }));
        const { user } = get();
        syncProfile(userId, user);
      },

      updateAppointment: (id, updates) =>
        set((s) => ({ appointments: s.appointments.map((a) => a.id === id ? { ...a, ...updates } : a) })),

      deleteAppointment: (id) => {
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }));
        db.deleteAppointment(id).catch(console.error);
      },

      startFocus: (taskId) =>
        set({ focusTaskId: taskId, focusStartTime: Date.now(), focusBreakTime: 0 }),

      addFocusBreak: (minutes) =>
        set((s) => ({ focusBreakTime: s.focusBreakTime + minutes })),

      completeFocus: (taskId, totalActualMinutes) => {
        const state = get();
        const task  = state.tasks.find((t) => t.id === taskId);
        if (!task || !state.user) return;

        const newB = updateMultiplierB(state.user.multiplierB, totalActualMinutes, task.userEstimatedTime);
        const entry: PatternEntry = {
          date: new Date().toDateString(),
          tasksCompleted: state.tasks.filter((t) => t.completed).length + 1,
          focusTasksCompleted: state.tasks.filter((t) => t.completed && t.completedViaFocus).length + 1,
          energyLevel: state.user.currentEnergy,
          stuckModeActivated: state.user.stuckMode,
          multiplierB: newB,
        };

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true, completedViaFocus: true, actualTime: totalActualMinutes } : t
          ),
          user: s.user ? {
            ...s.user, multiplierB: newB, xp: s.user.xp + 20,
            patternHistory: [...s.user.patternHistory.slice(-29), entry],
          } : s.user,
          focusTaskId: null, focusStartTime: null, focusBreakTime: 0, screen: 'today',
        }));

        db.updateTask(taskId, { completed: true, completedViaFocus: true, actualTime: totalActualMinutes }).catch(console.error);
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      cancelFocus: () =>
        set({ focusTaskId: null, focusStartTime: null, focusBreakTime: 0, screen: 'today' }),

      addJournalEntry: (entry) => {
        const { userId } = get();
        const energy    = get().user?.currentEnergy ?? 3;
        const hasImage  = !!entry.memoryImageUrl;
        const full: JournalEntry = {
          ...entry,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          dailyEnergy: energy as JournalEntry['dailyEnergy'],
        };
        set((s) => ({
          journal: [full, ...s.journal],
          user: s.user ? { ...s.user, xp: s.user.xp + 5 + (hasImage ? 3 : 0) } : s.user,
        }));
        if (userId) db.insertJournalEntry(userId, full).catch(console.error);
        const { user } = get();
        syncProfile(userId, user);
      },

      updateJournalEntry: (id, updates) =>
        set((s) => ({ journal: s.journal.map((j) => j.id === id ? { ...j, ...updates } : j) })),

      deleteJournalEntry: (id) => {
        set((s) => ({ journal: s.journal.filter((j) => j.id !== id) }));
        db.deleteJournalEntry(id).catch(console.error);
      },

      clearCompleted: () => {
        const toDelete = get().tasks.filter((t) => t.completed).map((t) => t.id);
        set((s) => ({ tasks: s.tasks.filter((t) => !t.completed) }));
        toDelete.forEach((id) => db.deleteTask(id).catch(console.error));
      },

      resetAll: () => {
        localStorage.removeItem('minddock-v1');
        window.location.reload();
      },

      updateUserName: (name) => {
        set((s) => ({ user: s.user ? { ...s.user, name } : s.user }));
        const { userId, user } = get();
        syncProfile(userId, user);
      },
    }),
    {
      name: 'minddock-v1',
      // Don't persist userId — always re-auth from Supabase session
      partialize: (s) => ({
        user: s.user, tasks: s.tasks, appointments: s.appointments, journal: s.journal,
      }),
    }
  )
);
