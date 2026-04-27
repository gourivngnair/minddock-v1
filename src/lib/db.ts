/**
 * All Supabase data-layer functions.
 * Each function maps between the snake_case DB columns and the
 * camelCase TypeScript types used everywhere else in the app.
 */
import { supabase } from './supabase';
import type { Task, Appointment, JournalEntry, UserProfile } from '../types';

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


// ─── Full data load ───────────────────────────────────────────────────────────

export async function loadAllUserData(userId: string) {
  const [profile, tasks, appointments, journal] = await Promise.all([
    fetchProfile(userId),
    fetchTasks(userId),
    fetchAppointments(userId),
    fetchJournal(userId),
  ]);
  return { profile, tasks, appointments, journal };
}
