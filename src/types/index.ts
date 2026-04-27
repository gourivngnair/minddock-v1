export type Priority = 1 | 2 | 3;
export type EnergyLevel = 1 | 2 | 3;
export type UserEnergy = 1 | 2 | 3 | 4 | 5;
export type LocationType = 'home' | 'away';
export type Recurrence = 'once' | 'daily' | 'weekly' | 'once-3-days';
export type MoodType = 'amazing' | 'good' | 'okay' | 'rough' | 'terrible';
export type BucketTag = 'Work' | 'Life' | 'Health' | 'Social' | 'Admin' | 'Finance' | 'Other';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  energyRequired: EnergyLevel;
  location: LocationType;
  deadline?: string;
  userEstimatedTime: number;
  appRecommendedTime: number;
  waitingOn?: string;
  bucketTag: BucketTag;
  recurrence: Recurrence;
  isScaffolded: boolean;
  completed: boolean;
  completedViaFocus: boolean;
  actualTime?: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  location: LocationType;
  deadline: string;
  energyRequired: EnergyLevel;
  bucketTag: BucketTag;
  waitingOn?: string;
  completed: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  mood: MoodType;
  dailyEnergy: UserEnergy;
  entryText: string;
  memoryImageUrl?: string;
  createdAt: string;
}

export interface PatternEntry {
  date: string;
  tasksCompleted: number;
  focusTasksCompleted: number;
  energyLevel: UserEnergy;
  stuckModeActivated: boolean;
  multiplierB: number;
}

export interface UserProfile {
  name: string;
  multiplierB: number;
  xp: number;
  symptoms: string[];
  currentEnergy: UserEnergy;
  stuckMode: boolean;
  lastActive: string;
  onboardingComplete: boolean;
  tutorialSeen: boolean;
  patternHistory: PatternEntry[];
}

export interface FrictionItem {
  id: string;
  label: string;
  icon: string;
  defaultTasks: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedViaFocus' | 'appRecommendedTime'>[];
}

export type Screen =
  | 'auth'
  | 'resurrection'
  | 'onboarding'
  | 'today'
  | 'focus'
  | 'tasks'
  | 'appointments'
  | 'calendar'
  | 'patterns'
  | 'journal'
  | 'settings';
