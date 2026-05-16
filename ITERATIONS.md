# MindDock — Iteration Log

A running record of every feature, fix, and design decision made during development.
Each entry explains *what* was built and *why* it works the way it does.

---

## v1.1 — Initial Release

### Stack & Architecture
- **React 19 + Vite 8 + TypeScript** — SPA, mobile-first, max-width 480 px on mobile
- **Zustand v5** — global state with `persist` middleware (localStorage backup)
- **Supabase** — PostgreSQL database + Row-Level Security + Auth (email/password & Google OAuth)
- **Tailwind CSS v4 / custom CSS variables** — warm editorial design system
- **Vercel** — production deployment with environment variables

### Core Design System
The visual language is deliberately warm and editorial rather than a typical productivity-app blue-and-white. Key decisions:

| Token | Value | Use |
|---|---|---|
| `--paper` | `#faf8f5` | Page background (off-white, not stark) |
| `--charcoal` | `#26231e` | Primary text |
| `--slate-blue` | `#4a65f0` | Primary interactive colour |
| `--gold` | `#b88a2c` | Deadlines, appointments, warnings |
| `--sage` | `#5a8060` | Completed items, easy tasks |

Typography: **Lora** (serif headings) + **JetBrains Mono** (numbers/timestamps) + **Inter** (body).

---

## Iteration 1 — Capacity-First Task Engine

### What it does
The Today view does not show all tasks. It fills a "capacity bucket" based on the user's current energy level (1–5) and their ADHD-adjusted time multiplier. Tasks are scored:

```
Score = (Priority × 1.5) + Urgency + EnergyMatch
```

Only tasks that fit within the available time window are surfaced. This prevents the overwhelm of seeing a 40-item list.

### Time-Blindness Multiplier (B)
Each user has a multiplier B (default 1.5). After every Focus Mode session:

```
B_new = B_old × 0.7 + (actual_time / estimated_time) × 0.3
```

This means the app learns how long things *actually* take you versus how long you *guessed*, and adjusts future estimates accordingly. The adjusted estimate is always shown as `{user estimate}m → ~{adjusted}m`.

### Stuck Mode
When the user taps "I feel stuck", the task list is filtered to items with `energyRequired = 1` and `userEstimatedTime ≤ 15 min`. The idea is to present exactly one frictionless task to get momentum started.

---

## Iteration 2 — Focus Mode

### What it does
A full-screen timer that tracks a single task. When the session ends, the app records the actual time taken and updates the multiplier B. Completions via Focus Mode earn **20 XP** (vs 10 XP for quick-complete) and are the *only* way to train the time-blindness multiplier.

### Break tracking
The user can add break time mid-session. Break minutes are subtracted from the actual time so the multiplier reflects pure working time, not including rest.

---

## Iteration 3 — Supabase Backend & Auth

### What it does
All data (tasks, appointments, journal, energy logs, meal logs, sleep logs) is stored in Supabase PostgreSQL with Row-Level Security — each user only ever sees their own rows.

### Optimistic updates
Every store action updates the local Zustand store immediately (instant UI), then fires a Supabase write in the background. This keeps the UI responsive even on slow networks.

### Sign-out data guarantee
Before signing out, the app runs `fullSync()` — a complete upsert of every item in the local store to Supabase. This ensures that any writes that may have failed during the session (e.g. during poor network) are flushed before localStorage is cleared.

```
Sign-out button clicked
  → "Saving your data…" spinner
  → fullSync() upserts all tasks / journal / energy / meals / sleep to Supabase
  → supabase.auth.signOut()
  → clearSession() wipes localStorage (safe because data is in Supabase)
```

### Data loss fix (critical)
A race condition existed where `clearSession()` fired on *every* app mount because `authUser` starts as `null` before `getSession()` resolves. This wiped localStorage before auth was even checked. Fixed by guarding `clearSession()` behind `!authLoading`.

### Loading strategy
On refresh, if localStorage already has a user (persisted from last session), the app renders immediately with local data. Supabase syncs in the background — no spinner, no flash of empty state.

### Google OAuth
Configured with `access_type: 'offline'` and `prompt: 'consent'` to ensure refresh tokens are issued. The redirect URI points to the app root.

---

## Iteration 4 — Onboarding Flow

Three-step onboarding captures user context before they see the main app:

1. **Welcome** — feature highlights (Capacity-First, Focus Mode, Time-Blindness Coach, Friction Scaffolds)
2. **Symptoms** — user selects which ADHD challenges apply to them (Time Blindness, Executive Dysfunction, Hyperfocus, Working Memory, Rejection Sensitivity, Overwhelm). These personalise the Patterns tab insights.
3. **Friction Audit** → **Task Preview** — user picks life areas that pile up (Laundry, Admin, Dishes, etc.) and the app breaks each into tiny, completable scaffolded tasks that go straight into their first day.

---

## Iteration 5 — XP & Level System

### Levels
10 levels from 0 XP (Overwhelmed) to 7 500 XP (Flow State). Displayed on the Patterns tab with emoji, name, and an XP progress bar.

### XP Actions
| Action | XP |
|---|---|
| Complete a task (quick) | +10 |
| Complete via Focus Mode | +20 |
| Add a journal entry | +5 |
| Add a journal photo | +3 |
| Add an appointment | +3 |

The XP system is purely motivational — it has no gameplay effect on task scoring.

---

## Iteration 6 — Extended Colour Palette

The initial palette was extended to cover all new data types in the Journal:

| Token | Hex | Used for |
|---|---|---|
| `--terra` | `#c05a2a` | Meals |
| `--teal` | `#3a8a8a` | Sleep |
| `--lavender` | `#8878c8` | Mood & Thoughts, Journal nav |
| `--rose` | `#b84060` | Mood section headers |
| `--amber` | `#c07820` | Energy levels |
| `--sky` | `#2e90c0` | Appointments in journal |
| `--indigo` | `#5060d0` | Metrics cards |
| `--plum` | `#8840a0` | Miscellaneous accents |
| `--coral` | `#d9604a` | Health bucket tag |
| `--mint` | `#4aaa80` | Positive accents |

Each colour comes with `-deep` (darker, for text) and `-soft` (pastel, for backgrounds) variants.

---

## Iteration 7 — Extended Recurrence Options

Task recurrence expanded from 4 options to 7:

| Value | Label |
|---|---|
| `once` | Once |
| `daily` | Daily |
| `alternate-days` | Alternate days |
| `weekly` | Weekly |
| `biweekly` | Biweekly |
| `monthly` | Monthly |
| `quarterly` | Quarterly |

Available in the Brain Dump, Add Task modal, Edit Task sheet, and Onboarding task preview.

---

## Iteration 8 — Daily Journal with Structured Sections

### Design philosophy
The journal is not a standalone notes app — it is a daily log that weaves together *everything* that happened in a day. All entries are grouped by calendar date.

### Today view — five sections
Each section has its own colour identity and an inline add button:

| Section | Colour | Source |
|---|---|---|
| 💭 Mood & Thoughts | Rose | User writes via "Write" button |
| ⚡ Energy Levels | Amber | Auto-logged when user changes energy in Today view |
| 📅 Appointments | Sky | Auto-populated from today's appointments |
| ✓ Tasks Completed | Sage | Auto-populated when tasks are marked complete |
| 🍽️ Meals | Terra | User logs via "Log meal" |
| 💤 Sleep | Teal | User logs via "Log sleep" |

### History view
All previous days are listed as collapsible day cards showing a summary row (📅 2 · 💭 1 · ✓ 3 · 🍽️ 2 · 💤).

### completedAt timestamp
Tasks now record when they were *completed* (not just when they were *created*). Without this, a task created last week but finished today would appear under last week's journal entry. `completedAt` is set on every `completeTask()` and `completeFocus()` call and stored in Supabase.

### Energy vs Time of Day chart (Patterns tab)
All energy readings (auto-logged throughout the day) are grouped by hour. An SVG line chart plots the user's energy level against time-of-day, averaged across all readings. This reveals the user's natural energy rhythm — when they're typically high-energy and when they crash.

---

## Iteration 9 — Edit Tasks & Appointments

### Why this matters for ADHD
Deadlines change. Delegation changes. Energy estimates are often wrong. Locking items after creation would force workarounds; the edit sheet should be accessible at any time.

### Edit sheet (tasks)
Full edit form: title, description, category (colour-coded pill picker), priority (↓ / → / ↑ buttons), energy cost (colour-coded green/amber/coral), estimate, location, recurrence, deadline, waiting-on. Available on every task row including completed and past-due tasks.

### Edit sheet (appointments)
Title, date & time, location (Home/Out), energy, category, notes. Past appointments are fully editable — no opacity lock, no disabled state.

### updateAppointment Supabase sync
Previously `updateAppointment` only updated local state. The DB layer now has a proper `updateAppointment(id, updates)` function that maps camelCase fields to snake_case columns and writes to Supabase.

---

## Iteration 10 — Delegate Flow

### Three-step brain dump for delegation
1. User fills in task title, estimate, priority, energy → "Continue"
2. Action picker: **Do now** / **Add to list** / **Delegate**
3. *Delegate* step: focused input asking "Who are you delegating to?" (optional). Submit button reads *"Delegate to Alex"* or *"Mark as waiting on someone"* if left blank.

Previously the `waitingOn` field was hardcoded to the string `'someone'` — the user had no way to specify who. The fix stores `delegateTo.trim() || undefined` so the field is only set when a name is provided.

---

## Iteration 11 — Responsive Layout

### Breakpoints
| Breakpoint | Layout |
|---|---|
| `< 640 px` (mobile) | 480 px max-width, bottom navigation bar |
| `640 px – 1023 px` (tablet) | 640 px max-width, wider padding |
| `≥ 1024 px` (desktop/laptop) | Left sidebar (230 px) + content fills remaining space |
| `≥ 1400 px` (large desktop) | Sidebar widens to 260 px |

### Key architecture decision
The responsive flex-direction change (`column` → `row`) must be applied to `.app-shell` — the direct parent of the sidebar and content area — not to `#root`. Applying it to `#root` had no effect because `#root` is not the direct parent of those elements.

### Bottom nav → sidebar
On desktop, the bottom dock converts to a left sidebar: nav items render horizontally with labels, the FAB becomes a wide "Brain Dump" pill, and a MindDock wordmark appears at the top. The mobile groups (`display: contents`) and desktop group (`display: flex column`) are controlled by CSS media queries that live at the *end* of the stylesheet — they must come after all component base styles or the cascade will override them.

---

## Iteration 12 — Supabase Schema Additions

New tables added to support the journal features:

```sql
energy_logs  (id, user_id, energy 1–5, note, created_at)
meal_logs    (id, user_id, meal_type, description, rating 1–3, created_at)
sleep_logs   (id, user_id, bedtime, wake_time, quality 1–5, notes, created_at)
```

Column added to `tasks`:
```sql
completed_at  timestamptz  -- when the task was marked done
```

The schema file (`supabase/schema.sql`) is fully idempotent — safe to run on a fresh or existing database:
- `CREATE TABLE IF NOT EXISTS` for all tables
- `DROP TRIGGER IF EXISTS` before every trigger
- `DROP POLICY IF EXISTS` inside a `DO $$` block before recreating policies
- A `DO $$` conditional block for the `completed_at` migration (no-op if column exists)

`loadAllUserData` uses `Promise.allSettled` so a missing table (e.g. new schema not yet applied) returns an empty array for that type rather than crashing the entire login flow.

---

## Bug Fixes Log

| Bug | Root Cause | Fix |
|---|---|---|
| Blank screen after onboarding | `#root` had `min-height` not `height` | Used `height: 100dvh` on html/body/#root |
| Maximum update depth (Zustand v5) | Object selectors `(s) => ({a, b})` create new references every render | Switched all 11 files to flat individual selectors |
| Blank screen in production | `supabase.ts` threw at module load when env vars missing | Graceful fallback to placeholder strings |
| Data loss on refresh | `clearSession()` fired on mount before `getSession()` resolved | Guard with `!authLoading` check |
| Sidebar showing as bottom bar | Desktop `@media` override was earlier in CSS than base `.bottom-dock` styles | Moved all responsive overrides to end of stylesheet |
| TodayView glitchy on desktop | TodayView rendered its own `<BottomNav>` alongside App.tsx's BottomNav | Removed nav chrome from TodayView |
| Delegate hardcoded 'someone' | `doDelegate()` hardcoded `waitingOn: 'someone'` | 3-step flow with editable name input |
| Time estimate mismatch | CommandCenter used hardcoded 1.2× multiplier for preview | Now reads real `multiplierB` from store |
| Nested checkbox in button | TaskCard was a `<button>` — can't put interactive elements inside | Converted outer wrapper to `<div>` |

---

## Pending / Future Considerations

- **Recurring task scheduling** — currently recurrence type is stored but the app doesn't auto-create the next instance when a recurring task is completed.
- **Offline support** — a Service Worker + background sync queue would make the app reliable with no connection.
- **Notification scheduling** — deadline reminders via the Web Notifications API or push notifications.
- **Data export** — a CSV/JSON export of tasks and journal entries.
- **Analytics dashboard** — the energy-by-time-of-day chart could be extended to show weekly/monthly patterns and correlate energy with task completion rate.
