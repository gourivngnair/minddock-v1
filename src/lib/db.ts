/**
 * All Supabase data-layer functions.
 * Each function maps between the snake_case DB columns and the
 * camelCase TypeScript types used everywhere else in the app.
 */
import { supabase } from './supabase';
import type { Task, Appointment, JournalEntry, UserProfile, EnergyLogEntry, MealEntry, SleepEntry } from '../types';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    name:               data.name,
    multiplierB:        data.multiplier_b,
    xp:                 data.xp,
    symptoms:           data.symptoms ?? [],
    currentEnergy:      data.current_energy,
    stuckMode:          data.stuck_mode,
    lastActive:         data.last_active,
    onboardingComplete: data.onboarding_complete,
    tutorialSeen:       data.tutorial_seen,
    patternHistory:     data.pattern_history ?? [],
  };
}

export async function upsertProfile(userId: string, profile: Partial<UserProfile>) {
  const row: Record<string, unknown> = { id: userId };
  if (profile.name               !== undefined) row.name                = profile.name;
  if (profile.multiplierB        !== undefined) row.multiplier_b        = profile.multiplierB;
  if (profile.xp                 !== undefined) row.xp                  = profile.xp;
  if (profile.symptoms           !== undefined) row.symptoms             = profile.symptoms;
  if (profile.currentEnergy      !== undefined) row.current_energy       = profile.currentEnergy;
  if (profile.stuckMode          !== undefined) row.stuck_mode           = profile.stuckMode;
  if (profile.lastActive         !== undefined) row.last_active          = profile.lastActive;
  if (profile.onboardingComplete !== undefined) row.onboarding_complete  = profile.onboardingComplete;
  if (profile.tutorialSeen       !== undefined) row.tutorial_seen        = profile.tutorialSeen;
  if (profile.patternHistory     !== undefined) row.pattern_history      = profile.patternHistory;

  await supabase.from('profiles').upsert(row);
}


// ─── Tasks ────────────────────────────────────────────────────────────────────

function rowToTask(r: Record<string, unknown>): Task {
  return {
    id:                 r.id as string,
    title:              r.title as string,
    description:        (r.description as string) ?? '',
    priority:           r.priority as 1 | 2 | 3,
    energyRequired:     r.energy_required as 1 | 2 | 3,
    location:           r.location as 'home' | 'away',
    deadline:           r.deadline as string | undefined,
    userEstimatedTime:  r.user_estimated_time as number,
    appRecommendedTime: r.app_recommended_time as number,
    waitingOn:          r.waiting_on as string | undefined,
    bucketTag:          r.bucket_tag as Task['bucketTag'],
    recurrence:         r.recurrence as Task['recurrence'],
    isScaffolded:       r.is_scaffolded as boolean,
    completed:          r.completed as boolean,
    completedViaFocus:  r.completed_via_focus as boolean,
    actualTime:         r.actual_time as number | undefined,
    completedAt:        r.completed_at as string | undefined,
    createdAt:          r.created_at as string,
  };
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(rowToTask);
}

export async function insertTask(userId: string, task: Task) {
  await supabase.from('tasks').insert({
    id:                   task.id,
    user_id:              userId,
    title:                task.title,
    description:          task.description,
    priority:             task.priority,
    energy_required:      task.energyRequired,
    location:             task.location,
    deadline:             task.deadline ?? null,
    user_estimated_time:  task.userEstimatedTime,
    app_recommended_time: task.appRecommendedTime,
    waiting_on:           task.waitingOn ?? null,
    bucket_tag:           task.bucketTag,
    recurrence:           task.recurrence,
    is_scaffolded:        task.isScaffolded,
    completed:            task.completed,
    completed_via_focus:  task.completedViaFocus,
    actual_time:          task.actualTime ?? null,
    completed_at:         task.completedAt ?? null,
    created_at:           task.createdAt,
  });
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const row: Record<string, unknown> = {};
  if (updates.title              !== undefined) row.title                = updates.title;
  if (updates.description        !== undefined) row.description          = updates.description;
  if (updates.priority           !== undefined) row.priority             = updates.priority;
  if (updates.energyRequired     !== undefined) row.energy_required      = updates.energyRequired;
  if (updates.location           !== undefined) row.location             = updates.location;
  if (updates.deadline           !== undefined) row.deadline             = updates.deadline ?? null;
  if (updates.userEstimatedTime  !== undefined) row.user_estimated_time  = updates.userEstimatedTime;
  if (updates.appRecommendedTime !== undefined) row.app_recommended_time = updates.appRecommendedTime;
  if (updates.waitingOn          !== undefined) row.waiting_on           = updates.waitingOn ?? null;
  if (updates.bucketTag          !== undefined) row.bucket_tag           = updates.bucketTag;
  if (updates.recurrence         !== undefined) row.recurrence           = updates.recurrence;
  if (updates.completed          !== undefined) row.completed            = updates.completed;
  if (updates.completedViaFocus  !== undefined) row.completed_via_focus  = updates.completedViaFocus;
  if (updates.actualTime         !== undefined) row.actual_time          = updates.actualTime ?? null;
  if (updates.completedAt        !== undefined) row.completed_at         = updates.completedAt ?? null;
  await supabase.from('tasks').update(row).eq('id', taskId);
}

export async function deleteTask(taskId: string) {
  await supabase.from('tasks').delete().eq('id', taskId);
}


// ─── Appointments ─────────────────────────────────────────────────────────────

function rowToAppt(r: Record<string, unknown>): Appointment {
  return {
    id:             r.id as string,
    title:          r.title as string,
    description:    (r.description as string) ?? '',
    location:       r.location as 'home' | 'away',
    deadline:       r.deadline as string,
    energyRequired: r.energy_required as 1 | 2 | 3,
    bucketTag:      r.bucket_tag as Appointment['bucketTag'],
    waitingOn:      r.waiting_on as string | undefined,
    completed:      r.completed as boolean,
    createdAt:      r.created_at as string,
  };
}

export async function fetchAppointments(userId: string): Promise<Appointment[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('deadline', { ascending: true });
  return (data ?? []).map(rowToAppt);
}

export async function insertAppointment(userId: string, appt: Appointment) {
  await supabase.from('appointments').insert({
    id:              appt.id,
    user_id:         userId,
    title:           appt.title,
    description:     appt.description,
    location:        appt.location,
    deadline:        appt.deadline,
    energy_required: appt.energyRequired,
    bucket_tag:      appt.bucketTag,
    waiting_on:      appt.waitingOn ?? null,
    completed:       appt.completed,
    created_at:      appt.createdAt,
  });
}

export async function updateAppointment(apptId: string, updates: Partial<Appointment>) {
  const row: Record<string, unknown> = {};
  if (updates.title          !== undefined) row.title           = updates.title;
  if (updates.description    !== undefined) row.description     = updates.description;
  if (updates.location       !== undefined) row.location        = updates.location;
  if (updates.deadline       !== undefined) row.deadline        = updates.deadline;
  if (updates.energyRequired !== undefined) row.energy_required = updates.energyRequired;
  if (updates.bucketTag      !== undefined) row.bucket_tag      = updates.bucketTag;
  if (updates.waitingOn      !== undefined) row.waiting_on      = updates.waitingOn ?? null;
  if (updates.completed      !== undefined) row.completed       = updates.completed;
  await supabase.from('appointments').update(row).eq('id', apptId);
}

export async function deleteAppointment(apptId: string) {
  await supabase.from('appointments').delete().eq('id', apptId);
}


// ─── Journal ──────────────────────────────────────────────────────────────────

function rowToEntry(r: Record<string, unknown>): JournalEntry {
  return {
    id:             r.id as string,
    mood:           r.mood as JournalEntry['mood'],
    dailyEnergy:    r.daily_energy as JournalEntry['dailyEnergy'],
    entryText:      (r.entry_text as string) ?? '',
    memoryImageUrl: r.memory_image_url as string | undefined,
    createdAt:      r.created_at as string,
  };
}

export async function fetchJournal(userId: string): Promise<JournalEntry[]> {
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(rowToEntry);
}

export async function insertJournalEntry(userId: string, entry: JournalEntry) {
  await supabase.from('journal_entries').insert({
    id:               entry.id,
    user_id:          userId,
    mood:             entry.mood,
    daily_energy:     entry.dailyEnergy,
    entry_text:       entry.entryText,
    memory_image_url: entry.memoryImageUrl ?? null,
    created_at:       entry.createdAt,
  });
}

export async function deleteJournalEntry(entryId: string) {
  await supabase.from('journal_entries').delete().eq('id', entryId);
}


// ─── Energy Logs ──────────────────────────────────────────────────────────────

export async function fetchEnergyLogs(userId: string): Promise<EnergyLogEntry[]> {
  const { data } = await supabase
    .from('energy_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id as string,
    energy:    r.energy as EnergyLogEntry['energy'],
    note:      r.note as string | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function insertEnergyLog(userId: string, entry: EnergyLogEntry) {
  await supabase.from('energy_logs').insert({
    id:         entry.id,
    user_id:    userId,
    energy:     entry.energy,
    note:       entry.note ?? null,
    created_at: entry.createdAt,
  });
}

export async function deleteEnergyLog(id: string) {
  await supabase.from('energy_logs').delete().eq('id', id);
}


// ─── Meal Logs ────────────────────────────────────────────────────────────────

export async function fetchMealLogs(userId: string): Promise<MealEntry[]> {
  const { data } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:          r.id as string,
    mealType:    r.meal_type as MealEntry['mealType'],
    description: (r.description as string) ?? '',
    rating:      r.rating as MealEntry['rating'],
    createdAt:   r.created_at as string,
  }));
}

export async function insertMealLog(userId: string, entry: MealEntry) {
  await supabase.from('meal_logs').insert({
    id:          entry.id,
    user_id:     userId,
    meal_type:   entry.mealType,
    description: entry.description,
    rating:      entry.rating ?? null,
    created_at:  entry.createdAt,
  });
}

export async function deleteMealLog(id: string) {
  await supabase.from('meal_logs').delete().eq('id', id);
}


// ─── Sleep Logs ───────────────────────────────────────────────────────────────

export async function fetchSleepLogs(userId: string): Promise<SleepEntry[]> {
  const { data } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id as string,
    bedtime:   r.bedtime as string,
    wakeTime:  r.wake_time as string,
    quality:   r.quality as SleepEntry['quality'],
    notes:     r.notes as string | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function insertSleepLog(userId: string, entry: SleepEntry) {
  await supabase.from('sleep_logs').insert({
    id:         entry.id,
    user_id:    userId,
    bedtime:    entry.bedtime,
    wake_time:  entry.wakeTime,
    quality:    entry.quality,
    notes:      entry.notes ?? null,
    created_at: entry.createdAt,
  });
}

export async function deleteSleepLog(id: string) {
  await supabase.from('sleep_logs').delete().eq('id', id);
}


// ─── Full data load ───────────────────────────────────────────────────────────
// Uses allSettled so a missing table (e.g. energy_logs not yet created)
// doesn't abort the whole load — profile and tasks still come through.

export async function loadAllUserData(userId: string) {
  const results = await Promise.allSettled([
    fetchProfile(userId),
    fetchTasks(userId),
    fetchAppointments(userId),
    fetchJournal(userId),
    fetchEnergyLogs(userId),
    fetchMealLogs(userId),
    fetchSleepLogs(userId),
  ]);
  return {
    profile:      results[0].status === 'fulfilled' ? results[0].value : null,
    tasks:        results[1].status === 'fulfilled' ? (results[1].value as Task[]) : [],
    appointments: results[2].status === 'fulfilled' ? (results[2].value as Appointment[]) : [],
    journal:      results[3].status === 'fulfilled' ? (results[3].value as JournalEntry[]) : [],
    energyLogs:   results[4].status === 'fulfilled' ? (results[4].value as EnergyLogEntry[]) : [],
    mealLogs:     results[5].status === 'fulfilled' ? (results[5].value as MealEntry[]) : [],
    sleepLogs:    results[6].status === 'fulfilled' ? (results[6].value as SleepEntry[]) : [],
  };
}


// ─── Full sync (upsert everything) ───────────────────────────────────────────
// Called before sign-out to guarantee all local state is persisted.
// Uses upsert (insert + update on conflict) so it's safe to call at any time.

export async function fullSync(userId: string, state: {
  user: UserProfile;
  tasks: Task[];
  appointments: Appointment[];
  journal: JournalEntry[];
  energyLogs: EnergyLogEntry[];
  mealLogs: MealEntry[];
  sleepLogs: SleepEntry[];
}) {
  const { user, tasks, appointments, journal, energyLogs, mealLogs, sleepLogs } = state;

  await Promise.allSettled([
    // Profile
    supabase.from('profiles').upsert({
      id: userId,
      name: user.name,
      multiplier_b: user.multiplierB,
      xp: user.xp,
      symptoms: user.symptoms,
      current_energy: user.currentEnergy,
      stuck_mode: user.stuckMode,
      last_active: user.lastActive,
      onboarding_complete: user.onboardingComplete,
      tutorial_seen: user.tutorialSeen,
      pattern_history: user.patternHistory,
    }),

    // Tasks (upsert by id)
    tasks.length > 0 && supabase.from('tasks').upsert(
      tasks.map((t) => ({
        id: t.id, user_id: userId,
        title: t.title, description: t.description,
        priority: t.priority, energy_required: t.energyRequired,
        location: t.location, deadline: t.deadline ?? null,
        user_estimated_time: t.userEstimatedTime, app_recommended_time: t.appRecommendedTime,
        waiting_on: t.waitingOn ?? null, bucket_tag: t.bucketTag,
        recurrence: t.recurrence, is_scaffolded: t.isScaffolded,
        completed: t.completed, completed_via_focus: t.completedViaFocus,
        actual_time: t.actualTime ?? null, completed_at: t.completedAt ?? null,
        created_at: t.createdAt,
      })),
      { onConflict: 'id' }
    ),

    // Appointments
    appointments.length > 0 && supabase.from('appointments').upsert(
      appointments.map((a) => ({
        id: a.id, user_id: userId,
        title: a.title, description: a.description,
        location: a.location, deadline: a.deadline,
        energy_required: a.energyRequired, bucket_tag: a.bucketTag,
        waiting_on: a.waitingOn ?? null, completed: a.completed,
        created_at: a.createdAt,
      })),
      { onConflict: 'id' }
    ),

    // Journal entries
    journal.length > 0 && supabase.from('journal_entries').upsert(
      journal.map((j) => ({
        id: j.id, user_id: userId,
        mood: j.mood, daily_energy: j.dailyEnergy,
        entry_text: j.entryText, memory_image_url: j.memoryImageUrl ?? null,
        created_at: j.createdAt,
      })),
      { onConflict: 'id' }
    ),

    // Energy logs
    energyLogs.length > 0 && supabase.from('energy_logs').upsert(
      energyLogs.map((e) => ({
        id: e.id, user_id: userId,
        energy: e.energy, note: e.note ?? null,
        created_at: e.createdAt,
      })),
      { onConflict: 'id' }
    ),

    // Meal logs
    mealLogs.length > 0 && supabase.from('meal_logs').upsert(
      mealLogs.map((m) => ({
        id: m.id, user_id: userId,
        meal_type: m.mealType, description: m.description,
        rating: m.rating ?? null, created_at: m.createdAt,
      })),
      { onConflict: 'id' }
    ),

    // Sleep logs
    sleepLogs.length > 0 && supabase.from('sleep_logs').upsert(
      sleepLogs.map((s) => ({
        id: s.id, user_id: userId,
        bedtime: s.bedtime, wake_time: s.wakeTime,
        quality: s.quality, notes: s.notes ?? null,
        created_at: s.createdAt,
      })),
      { onConflict: 'id' }
    ),
  ]);
}

// ─── Nuclear reset ────────────────────────────────────────────────────────────
// Deletes all user content from every table and resets the profile to
// its factory state so the next app load routes to onboarding.

export async function nukeUserData(userId: string, userName: string) {
  await Promise.allSettled([
    supabase.from('tasks').delete().eq('user_id', userId),
    supabase.from('appointments').delete().eq('user_id', userId),
    supabase.from('journal_entries').delete().eq('user_id', userId),
    supabase.from('energy_logs').delete().eq('user_id', userId),
    supabase.from('meal_logs').delete().eq('user_id', userId),
    supabase.from('sleep_logs').delete().eq('user_id', userId),
    supabase.from('profiles').upsert({
      id: userId,
      name: userName,
      multiplier_b: 1.5,
      xp: 0,
      symptoms: [],
      current_energy: 3,
      stuck_mode: false,
      last_active: new Date().toISOString(),
      onboarding_complete: false,
      tutorial_seen: false,
      pattern_history: [],
    }),
  ]);
}
