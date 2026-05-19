import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../utils/nanoid';
import { calcAppRecommendedTime, updateMultiplierB } from '../utils/scoring';
import * as db from '../lib/db';
import { supabase } from '../lib/supabase';
import { track } from '@vercel/analytics';
import type {
  Task, Appointment, JournalEntry, UserProfile, UserEnergy, Screen, PatternEntry,
  EnergyLogEntry, MealEntry, SleepEntry, ParkedItem, ScaffoldMaster, ScaffoldRecurrence
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
  parkedItems: ParkedItem[];
  scaffoldMasters: ScaffoldMaster[];
  scaffoldDeepLink: boolean;
  focusTaskId: string | null;
  focusStartTime: number | null;
  focusBreakTime: number;
  stuckModeIndex: number;
  dataLoading: boolean;

  hydrateFromSupabase: (userId: string) => Promise<void>;
  clearSession: () => void;

  checkResurrection: () => boolean;
  freshStart: () => void;

  completeOnboarding: (symptoms: string[], tasks: Omit<Task, 'id' | 'createdAt' | 'appRecommendedTime'>[], wakeTime?: string, sleepTime?: string) => void;
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

  addEnergyLog: (energy: UserEnergy, note?: string, createdAt?: string) => void;
  deleteEnergyLog: (id: string) => void;

  addMealLog: (meal: Omit<MealEntry, 'id' | 'createdAt'>) => void;
  deleteMealLog: (id: string) => void;

  addSleepLog: (sleep: Omit<SleepEntry, 'id' | 'createdAt'>) => void;
  deleteSleepLog: (id: string) => void;

  addParkedItem: (text: string) => void;
  removeParkedItem: (id: string) => void;
  noteParkedItem: (id: string) => void;

  addScaffoldMaster: (m: Omit<ScaffoldMaster, 'id' | 'createdAt'>) => void;
  updateScaffoldMaster: (id: string, updates: Partial<Omit<ScaffoldMaster, 'id' | 'createdAt'>>) => void;
  deleteScaffoldMaster: (id: string) => void;
  startScaffold: (masterId: string) => void;
  setScaffoldDeepLink: () => void;
  clearScaffoldDeepLink: () => void;
  checkScheduledScaffolds: () => void;

  clearCompleted: () => void;
  resetAll: () => Promise<void>;
  updateUserName: (name: string) => void;
  signOut: () => Promise<void>;
}

const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

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
      parkedItems: [],
      scaffoldMasters: [],
      scaffoldDeepLink: false,
      focusTaskId: null,
      focusStartTime: null,
      focusBreakTime: 0,
      stuckModeIndex: 0,
      dataLoading: false,

      hydrateFromSupabase: async (userId) => {
        set({ dataLoading: true, userId });

        // Snapshot local state BEFORE Supabase responds — this is our safety net
        const local = get();

        const { profile, tasks, appointments, journal, energyLogs, mealLogs, sleepLogs } =
          await db.loadAllUserData(userId);

        // Union of two arrays, keyed by id — local item wins on conflict
        const merge = <T extends { id: string }>(a: T[], b: T[]): T[] => {
          const m = new Map(b.map((x) => [x.id, x]));
          a.forEach((x) => m.set(x.id, x));
          return [...m.values()];
        };

        if (!profile) {
          if (local.user?.onboardingComplete) {
            // Completed onboarding locally but not yet synced — restore and push up
            const now = new Date().toISOString();
            set({ userId, dataLoading: false,
              screen: (local.screen === 'auth' || local.screen === 'onboarding') ? 'today' : local.screen });
            db.fullSync(userId, {
              user: local.user, tasks: local.tasks, appointments: local.appointments,
              journal: local.journal, energyLogs: local.energyLogs,
              mealLogs: local.mealLogs, sleepLogs: local.sleepLogs,
            }).catch(console.error);
            db.upsertProfile(userId, { ...local.user, lastActive: now }).catch(console.error);
          } else {
            set({
              userId, dataLoading: false, screen: 'onboarding',
              energyLogs: [], mealLogs: [], sleepLogs: [],
              user: {
                name: '', multiplierB: 1.5, xp: 0, symptoms: [],
                currentEnergy: 3, stuckMode: false,
                lastActive: new Date().toISOString(),
                onboardingComplete: false, tutorialSeen: false, patternHistory: [],
              },
            });
          }
          return;
        }

        const now  = new Date().toISOString();
        const diff = Date.now() - new Date(profile.lastActive).getTime();
        const needsResurrection = diff > 48 * 60 * 60 * 1000;

        // Merge: local data takes priority (handles failed writes to Supabase)
        const mergedTasks   = merge(local.tasks,        tasks);
        const mergedAppts   = merge(local.appointments,  appointments);
        const mergedJournal = merge(local.journal,       journal);
        const mergedEnergy  = merge(local.energyLogs,    energyLogs);
        const mergedMeals   = merge(local.mealLogs,      mealLogs);
        const mergedSleep   = merge(local.sleepLogs,     sleepLogs);

        set({
          userId,
          user: { ...profile, lastActive: now },
          tasks:       mergedTasks,
          appointments: mergedAppts,
          journal:     mergedJournal,
          energyLogs:  mergedEnergy,
          mealLogs:    mergedMeals,
          sleepLogs:   mergedSleep,
          dataLoading: false,
          screen: !profile.onboardingComplete ? 'onboarding'
            : needsResurrection ? 'resurrection'
            : 'today',
        });

        // Background sync: push any locally-created items that didn't reach Supabase
        db.fullSync(userId, {
          user: { ...profile, lastActive: now },
          tasks: mergedTasks, appointments: mergedAppts, journal: mergedJournal,
          energyLogs: mergedEnergy, mealLogs: mergedMeals, sleepLogs: mergedSleep,
        }).catch(console.error);
        db.upsertProfile(userId, { lastActive: now }).catch(console.error);

        // Auto-start any scaffolds that are due today
        setTimeout(() => get().checkScheduledScaffolds(), 0);
      },

      clearSession: () =>
        set({
          screen: 'auth', user: null, userId: null,
          tasks: [], appointments: [], journal: [],
          energyLogs: [], mealLogs: [], sleepLogs: [], parkedItems: [],
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

      completeOnboarding: (symptoms, rawTasks, wakeTime, sleepTime) => {
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
          user: s.user ? { ...s.user, symptoms, onboardingComplete: true, lastActive: now, wakeTime, sleepTime } : s.user,
          tasks: [...s.tasks, ...tasks],
          screen: 'today',
        }));

        if (userId) {
          db.upsertProfile(userId, { symptoms, onboardingComplete: true, lastActive: now, wakeTime, sleepTime }).catch(console.error);
          tasks.forEach((t) => db.insertTask(userId, t).catch(console.error));
        }
        track('onboarding_completed', { symptom_count: symptoms.length });
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
        const now  = new Date().toISOString();
        const task = get().tasks.find((t) => t.id === id);
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: true, completedViaFocus: viaFocus, completedAt: now } : t),
          user: s.user ? { ...s.user, xp: s.user.xp + (viaFocus ? 20 : 10) } : s.user,
        }));
        db.updateTask(id, { completed: true, completedViaFocus: viaFocus, completedAt: now }).catch(console.error);
        track('task_completed', { via_focus: viaFocus });

        // Refresh last_active so this counts toward the 5-day active user window
        const { userId: uid0, user: u0 } = get();
        if (u0) { set((s) => ({ user: s.user ? { ...s.user, lastActive: now } : s.user })); syncProfile(uid0, get().user); }

        // Auto-create the next scaffold step
        if (task?.scaffoldMasterId && task.scaffoldStepIdx !== undefined) {
          const { scaffoldMasters, userId: uid, user } = get();
          const master  = scaffoldMasters.find((m) => m.id === task.scaffoldMasterId);
          const nextIdx = task.scaffoldStepIdx + 1;
          if (master && nextIdx < master.steps.length) {
            const step = master.steps[nextIdx];
            const b    = user?.multiplierB ?? 1.5;
            const next: Task = {
              id: nanoid(), createdAt: now,
              title: step.title, description: '',
              priority: task.priority, energyRequired: task.energyRequired,
              location: task.location, userEstimatedTime: step.estimatedMinutes,
              appRecommendedTime: calcAppRecommendedTime(step.estimatedMinutes, b),
              bucketTag: task.bucketTag, recurrence: 'once',
              isScaffolded: true, completed: false, completedViaFocus: false,
              scaffoldMasterId: master.id, scaffoldStepIdx: nextIdx,
            };
            set((s) => ({ tasks: [...s.tasks, next] }));
            if (uid) db.insertTask(uid, next).catch(console.error);
          }
        }

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
        track('focus_session_completed', { duration_mins: totalActualMinutes });
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
        track('journal_entry_created', { has_image: hasImage });
        const now2 = new Date().toISOString();
        set((s) => ({ user: s.user ? { ...s.user, lastActive: now2 } : s.user }));
        const { user } = get();
        syncProfile(userId, user);
      },

      updateJournalEntry: (id, updates) =>
        set((s) => ({ journal: s.journal.map((j) => j.id === id ? { ...j, ...updates } : j) })),

      deleteJournalEntry: (id) => {
        set((s) => ({ journal: s.journal.filter((j) => j.id !== id) }));
        db.deleteJournalEntry(id).catch(console.error);
      },

      addEnergyLog: (energy, note, createdAt) => {
        const { userId } = get();
        const log: EnergyLogEntry = { id: nanoid(), energy, note, createdAt: createdAt ?? new Date().toISOString() };
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

      addScaffoldMaster: (m) => {
        const master: ScaffoldMaster = { ...m, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ scaffoldMasters: [...s.scaffoldMasters, master] }));
      },
      updateScaffoldMaster: (id, updates) =>
        set((s) => ({ scaffoldMasters: s.scaffoldMasters.map((m) => m.id === id ? { ...m, ...updates } : m) })),
      deleteScaffoldMaster: (id) =>
        set((s) => ({ scaffoldMasters: s.scaffoldMasters.filter((m) => m.id !== id) })),
      setScaffoldDeepLink: () => set({ scaffoldDeepLink: true }),
      clearScaffoldDeepLink: () => set({ scaffoldDeepLink: false }),

      startScaffold: (masterId) => {
        const { scaffoldMasters, user, userId } = get();
        const master = scaffoldMasters.find((m) => m.id === masterId);
        if (!master || master.steps.length === 0) return;
        const b     = user?.multiplierB ?? 1.5;
        const step  = master.steps[0];
        const now   = new Date().toISOString();
        const today = new Date().toLocaleDateString('en-CA');
        const task: Task = {
          id: nanoid(), createdAt: now,
          title: step.title, description: '',
          priority: 2, energyRequired: 2,
          location: 'home', userEstimatedTime: step.estimatedMinutes,
          appRecommendedTime: calcAppRecommendedTime(step.estimatedMinutes, b),
          bucketTag: 'Life', recurrence: 'once',
          isScaffolded: true, completed: false, completedViaFocus: false,
          scaffoldMasterId: master.id, scaffoldStepIdx: 0,
        };
        set((s) => ({
          tasks: [...s.tasks, task],
          scaffoldMasters: s.scaffoldMasters.map((m) =>
            m.id === masterId ? { ...m, lastStartedDate: today } : m
          ),
        }));
        if (userId) db.insertTask(userId, task).catch(console.error);
        track('scaffold_started', { scaffold_name: master.name, total_steps: master.steps.length });
      },

      checkScheduledScaffolds: () => {
        const { scaffoldMasters, tasks, user, userId } = get();
        const today = new Date().toLocaleDateString('en-CA');
        const b     = user?.multiplierB ?? 1.5;
        const now   = new Date().toISOString();

        const daysApart = (a: string, b: string) =>
          Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

        const isDue = (m: ScaffoldMaster): boolean => {
          if (!m.recurrence || !m.startDate) return false;
          if (m.startDate > today) return false;
          const hasActive = tasks.some((t) => t.scaffoldMasterId === m.id && !t.completed);
          if (hasActive) return false;
          if (!m.lastStartedDate) return true; // never started yet
          if (m.recurrence === 'once') return false; // only runs once
          const days = daysApart(m.lastStartedDate, today);
          const needed: Record<ScaffoldRecurrence, number> = {
            once: Infinity, daily: 1, weekly: 7, biweekly: 14,
            monthly: daysInMonth(new Date(m.lastStartedDate)),
          };
          return days >= needed[m.recurrence];
        };

        const due = scaffoldMasters.filter(isDue);
        if (due.length === 0) return;

        const newTasks: Task[] = due.map((m) => {
          const step = m.steps[0];
          return {
            id: nanoid(), createdAt: now,
            title: step.title, description: '',
            priority: 2, energyRequired: 2,
            location: 'home' as const, userEstimatedTime: step.estimatedMinutes,
            appRecommendedTime: calcAppRecommendedTime(step.estimatedMinutes, b),
            bucketTag: 'Life' as const, recurrence: 'once' as const,
            isScaffolded: true, completed: false, completedViaFocus: false,
            scaffoldMasterId: m.id, scaffoldStepIdx: 0,
          };
        });

        set((s) => ({
          tasks: [...s.tasks, ...newTasks],
          scaffoldMasters: s.scaffoldMasters.map((m) =>
            due.find((d) => d.id === m.id) ? { ...m, lastStartedDate: today } : m
          ),
        }));
        if (userId) newTasks.forEach((t) => db.insertTask(userId, t).catch(console.error));
      },

      addParkedItem: (text) => {
        const item: ParkedItem = { id: nanoid(), text, status: 'parked', createdAt: new Date().toISOString() };
        set((s) => ({ parkedItems: [item, ...s.parkedItems] }));
      },
      removeParkedItem: (id) => set((s) => ({ parkedItems: s.parkedItems.filter((p) => p.id !== id) })),
      noteParkedItem: (id) => set((s) => ({
        parkedItems: s.parkedItems.map((p) => p.id === id ? { ...p, status: 'noted' } : p),
      })),

      clearCompleted: () => {
        const toDelete = get().tasks.filter((t) => t.completed).map((t) => t.id);
        set((s) => ({ tasks: s.tasks.filter((t) => !t.completed) }));
        toDelete.forEach((id) => db.deleteTask(id).catch(console.error));
      },

      resetAll: async () => {
        const { userId, user } = get();
        const userName = user?.name ?? '';
        // Wipe all Supabase content and reset profile to factory state
        if (userId) {
          await db.nukeUserData(userId, userName);
        }
        // Clear persisted localStorage
        localStorage.removeItem('minddock-v1');
        // Reset in-memory state — keep userId so the user stays logged in
        set({
          tasks: [], appointments: [], journal: [],
          energyLogs: [], mealLogs: [], sleepLogs: [], parkedItems: [],
          scaffoldMasters: [],
          screen: 'onboarding',
          user: {
            name: userName,
            multiplierB: 1.5,
            xp: 0,
            symptoms: [],
            currentEnergy: 3,
            stuckMode: false,
            lastActive: new Date().toISOString(),
            onboardingComplete: false,
            tutorialSeen: false,
            patternHistory: [],
          },
        });
      },

      updateUserName: (name) => {
        set((s) => ({ user: s.user ? { ...s.user, name } : s.user }));
        const { userId, user } = get();
        syncProfile(userId, user);
      },

      signOut: async () => {
        const { userId, user, tasks, appointments, journal, energyLogs, mealLogs, sleepLogs } = get();

        // Flush all local state to Supabase before clearing the session.
        // Uses Promise.allSettled so a missing table (e.g. new schema not yet run)
        // doesn't block the sign-out.
        if (userId && user) {
          try {
            await db.fullSync(userId, { user, tasks, appointments, journal, energyLogs, mealLogs, sleepLogs });
          } catch (e) {
            console.error('Pre-sign-out sync failed:', e);
          }
        }

        await supabase.auth.signOut();
        // App.tsx useEffect will call clearSession() once auth state resolves to null
      },
    }),
    {
      name: 'minddock-v1',
      partialize: (s) => ({
        user: s.user, tasks: s.tasks, appointments: s.appointments, journal: s.journal,
        energyLogs: s.energyLogs, mealLogs: s.mealLogs, sleepLogs: s.sleepLogs,
        parkedItems: s.parkedItems, scaffoldMasters: s.scaffoldMasters,
      }),
    }
  )
);
