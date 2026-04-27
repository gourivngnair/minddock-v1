import type { Task, UserEnergy } from '../types';

/** Capacity budgets in minutes for each energy level */
const CAPACITY_BUDGET: Record<UserEnergy, number> = {
  1: 45,
  2: 75,
  3: 105,
  4: 150,
  5: 210,
};

export function calcUrgency(deadline?: string): number {
  if (!deadline) return 0;
  const hoursRemaining = (new Date(deadline).getTime() - Date.now()) / 36e5;
  if (hoursRemaining <= 0) return 10; // overdue — max urgency
  return Math.min(24 / hoursRemaining, 10);
}

export function calcEnergyMatch(taskEnergy: number, userEnergy: UserEnergy): number {
  return taskEnergy <= userEnergy ? 2 : 0;
}

export function calcScore(task: Task, userEnergy: UserEnergy): number {
  const urgency = calcUrgency(task.deadline);
  const energyMatch = calcEnergyMatch(task.energyRequired, userEnergy);
  return task.priority * 1.5 + urgency + energyMatch;
}

/** Fill capacity bucket: returns ordered tasks that fit in the energy budget */
export function fillCapacityBucket(tasks: Task[], userEnergy: UserEnergy): Task[] {
  const pending = tasks.filter((t) => !t.completed);
  const scored = pending
    .map((t) => ({ task: t, score: calcScore(t, userEnergy) }))
    .sort((a, b) => b.score - a.score);

  const budget = CAPACITY_BUDGET[userEnergy];
  let remaining = budget;
  const result: Task[] = [];

  for (const { task } of scored) {
    const time = task.appRecommendedTime || task.userEstimatedTime;
    if (remaining >= time || result.length === 0) {
      result.push(task);
      remaining -= time;
      if (remaining <= 0) break;
    }
  }
  return result;
}

/** Stuck mode: single low-effort task (energy=1, time<=15m) */
export function getStuckModeTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => !t.completed && t.energyRequired === 1 && t.userEstimatedTime <= 15
  );
}

/** Update multiplier B using weighted moving average */
export function updateMultiplierB(currentB: number, actualTime: number, estimatedTime: number): number {
  if (estimatedTime <= 0) return currentB;
  const currentRatio = actualTime / estimatedTime;
  return currentB * 0.7 + currentRatio * 0.3;
}

export function getCapacityBudget(energy: UserEnergy): number {
  return CAPACITY_BUDGET[energy];
}

export function calcAppRecommendedTime(userEstimate: number, multiplierB: number): number {
  return Math.round(userEstimate * multiplierB);
}
