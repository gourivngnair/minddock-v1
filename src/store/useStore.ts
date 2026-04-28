import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid';
import { calcAppRecommendedTime, updateMultiplierB } from '../utils/scoring';
import * as db from '../lib/db';
import type {
  Task, Appointment, JournalEntry, UserProfile, UserEnergy, Screen, PatternEntry,
  EnergyLogEntry, MealEntry, SleepEntry
} from '../types';

interface AppState {
  screen: Screen;
  user: UserProfile | null;
  userId: string | null;
  tasks: Task[];
  appointments: Appointment[];
  journal: JournalEntry[];
  energyLogs: EnergyLogEntry[];
  mealLogs: MealEntry[];
  sleepLogs: SleepEntry[];
  focusTaskId: string | null;
  focusStartTime: number | null;
  focusBreakTime: number;
  stuckModeIndex: number;
  dataLoading: boolean;

  hydrateFromSupabase: (userId: string) => Promise<void>;
  clearSession: () => void;

  checkResurrection: () => boolean;
  freshStart: () => void;

  completeOnboarding: (symptoms: string[], tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[]) => void;
  setTutorialSeen: () => void;

  setScreen: (screen: Screen) => void;

  setUserEnergy: (energy: UserEnergy) => void;
  toggleStuckMode: () => void;
  setStuckModeIndex: (idx: number) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, viaFocus?: boolean) => void;

  addAppointment: (appt: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  startFocus: (taskId: string) => void;
  addFocusBreak: (minutes: number) => void;
  completeFocus: (taskId: string, totalActualMinutes: number) => void;
  cancelFocus: () => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'dailyEnergy'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  addEnergyLog: (energy: UserEnergy, note?: string) => void;
  deleteEnergyLog: (id: string) => void;

  addMealLog: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void;
  deleteMealLog: (id: string) => void;

  addSleepLog: (sleep: Omit<SleepEntry, 'id' | 'createdAt'>) => void;
  deleteSleepLog: (id: string) => void;

  clearCompleted: () => void;
  resetAll: () => void;
  updateUserName: (name: string) => void;
}

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
      energyLogs: [],
      mealLogs: [],
      sleepLogs: [],
      focusTaskId: null,
      focusStartTime: null,
      focusBreakTime: 0,
      stuckModeIndex: 0,
      dataLoading: false,

      hydrateFromSupabase: async (userId) => {
        set({ dataLoading: true, userId });

        const { profile, tasks, appointments, journal, energyLogs, mealLogs, sleepLogs } =
          await db.loadAllUserData(userId);

        if (!profile) {
          set({
            userId,
            dataLoading: false,
            screen: 'onboarding',
            energyLogs: [],
            mealLogs: [],
            sleepLogs: [],
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
          energyLogs,
          mealLogs,
          sleepLogs,
          dataLoading: false,
          screen: !profile.onboardingComplete
            ? 'onboarding'
            : needsResurrection
            ? 'resurrection'
            : 'today',
        });

        db.upsertProfile(userId, { lastActive: now }).catch(console.error);
      },

      clearSession: () =>
        set({
          screen: 'auth', user: null, userId: null,
          tasks: [], appointments: [], journal: [],
          energyLogs: [], mealLogs: [], sleepLogs: [],
        }),

      checkResurrection: () => {
        const user = get().user;
        if (!user) return false;
        return Date.now() - new Date(user.lastActive).getTime() > 48 * 60 * 60 * 1000;
      },

      freshStart: () => {
        const uid = get().userId;
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
        const { userId } = get();
        set((s) => ({ user: s.user ? { ...s.user, currentEnergy: energy } : s.user }));

        // Auto-log the energy change with timestamp
        const log: EnergyLogEntry = { id: nanoid(), energy, createdAt: new Date().toISOString() };
        set((s) => ({ energyLogs: [log, ...s.energyLogs] }));
        if (userId) db.insertEnergyLog(userId, log).catch(console.error);

        const { user } = get();
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
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: true, completedViaFocus: viaFocus, completedAt: now } : t),
          user: s.user ? { ...s.user, xp: s.user.xp + (viaFocus ? 20 : 10) } : s.user,
        }));
        db.updateTask(id, { completed: true, completedViaFocus: viaFocus, completedAt: now }).catch(console.error);
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      addAppointment: (appt) => {
        const { userId } = get();
        const full: Appointment = { ...appt, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ appointments: [...s.appointments, full] }));
        if (userId) db.insertAppointment(userId, full).catch(console.error);
        set((s) => ({ user: s.user ? { ...s.user, xp: s.user.xp + 3 } : s.user }));
        const { user } = get();
        syncProfile(userId, user);
      },

      updateAppointment: (id, updates) => {
        set((s) => ({ appointments: s.appointments.map((a) => a.id === id ? { ...a, ...updates } : a) }));
        db.updateAppointment(id, updates).catch(console.error);
      },

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

        const completedAt = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true, completedViaFocus: true, actualTime: totalActualMinutes, completedAt } : t
          ),
          user: s.user ? {
            ...s.user, multiplierB: newB, xp: s.user.xp + 20,
            patternHistory: [...s.user.patternHistory.slice(-29), entry],
          } : s.user,
          focusTaskId: null, focusStartTime: null, focusBreakTime: 0, screen: 'today',
        }));

        db.updateTask(taskId, { completed: true, completedViaFocus: true, actualTime: totalActualMinutes, completedAt }).catch(console.error);
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

      addEnergyLog: (energy, note) => {
        const { userId } = get();
        const log: EnergyLogEntry = { id: nanoid(), energy, note, createdAt: new Date().toISOString() };
        set((s) => ({ energyLogs: [log, ...s.energyLogs] }));
        if (userId) db.insertEnergyLog(userId, log).catch(console.error);
      },

      deleteEnergyLog: (id) => {
        set((s) => ({ energyLogs: s.energyLogs.filter((e) => e.id !== id) }));
        db.deleteEnergyLog(id).catch(console.error);
      },

      addMealLog: (meal) => {
        const { userId } = get();
        const full: MealEntry = { ...meal, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ mealLogs: [full, ...s.mealLogs] }));
        if (userId) db.insertMealLog(userId, full).catch(console.error);
      },

      deleteMealLog: (id) => {
        set((s) => ({ mealLogs: s.mealLogs.filter((m) => m.id !== id) }));
        db.deleteMealLog(id).catch(console.error);
      },

      addSleepLog: (sleep) => {
        const { userId } = get();
        const full: SleepEntry = { ...sleep, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ sleepLogs: [full, ...s.sleepLogs] }));
        if (userId) db.insertSleepLog(userId, full).catch(console.error);
      },

      deleteSleepLog: (id) => {
        set((s) => ({ sleepLogs: s.sleepLogs.filter((s2) => s2.id !== id) }));
        db.deleteSleepLog(id).catch(console.error);
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
      partialize: (s) => ({
        user: s.user, tasks: s.tasks, appointments: s.appointments, journal: s.journal,
        energyLogs: s.energyLogs, mealLogs: s.mealLogs, sleepLogs: s.sleepLogs,
      }),
    }
  )
);
