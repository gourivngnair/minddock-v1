export interface LevelDef {
  level: number;
  name: string;
  emoji: string;
  minXP: number;
}

export const LEVELS: LevelDef[] = [
  { level: 1,  name: 'First Steps',     emoji: '🌱', minXP: 0     },
  { level: 2,  name: 'Getting Warmed',  emoji: '🔥', minXP: 100   },
  { level: 3,  name: 'Building Spark',  emoji: '⚡', minXP: 300   },
  { level: 4,  name: 'Finding Focus',   emoji: '🎯', minXP: 600   },
  { level: 5,  name: 'In the Flow',     emoji: '🌊', minXP: 1000  },
  { level: 6,  name: 'Real Momentum',   emoji: '🚀', minXP: 1600  },
  { level: 7,  name: 'Pattern Setter',  emoji: '🔄', minXP: 2500  },
  { level: 8,  name: 'Deep Thinker',    emoji: '🧠', minXP: 3700  },
  { level: 9,  name: 'Mind Architect',  emoji: '🏆', minXP: 5000  },
  { level: 10, name: 'ADHD Champion',   emoji: '✨', minXP: 7500  },
];

export interface LevelStatus extends LevelDef {
  nextXP: number;
  xpIntoLevel: number;
  xpNeeded: number;
  progress: number; // 0–1
}

export function getLevel(xp: number): LevelStatus {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1];
  const nextXP = next ? next.minXP : current.minXP + 3000;
  const xpIntoLevel = xp - current.minXP;
  const xpNeeded = nextXP - current.minXP;
  const progress = Math.min(1, xpIntoLevel / xpNeeded);
  return { ...current, nextXP, xpIntoLevel, xpNeeded, progress };
}

export interface XPAction {
  category: string;
  label: string;
  xp: number;
  note?: string;
}

export const XP_ACTIONS: XPAction[] = [
  // Tasks
  { category: 'Tasks',        label: 'Complete a task (standard)',      xp: 10 },
  { category: 'Tasks',        label: 'Complete via Focus Mode',          xp: 20, note: 'Also trains your Time-Blindness Multiplier' },
  { category: 'Tasks',        label: 'Complete a Stuck Mode task',       xp: 20 },
  { category: 'Tasks',        label: 'Complete a scaffolded task',       xp: 15, note: 'From Friction Audit' },
  // Focus
  { category: 'Focus',        label: 'Finish a Focus session',           xp: 20, note: 'Completing earns XP — not just starting' },
  { category: 'Focus',        label: 'Reality Check completed',          xp: 0,  note: 'Free — it\'s part of the session reward' },
  // Journal
  { category: 'Journal',      label: 'Write a journal entry',            xp: 5  },
  { category: 'Journal',      label: 'Add a memory photo',               xp: 3  },
  // Appointments
  { category: 'Appointments', label: 'Add an appointment',               xp: 3  },
  // Onboarding
  { category: 'Setup',        label: 'Complete onboarding',              xp: 50, note: 'One-time bonus' },
  { category: 'Setup',        label: 'Complete a Fresh Start',           xp: 10, note: 'Courage counts' },
];

export const XP_CATEGORIES = [...new Set(XP_ACTIONS.map((a) => a.category))];
