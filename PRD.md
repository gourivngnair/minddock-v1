# MindDock — Product Requirements Document

**Version:** 1.1  
**Status:** Live  
**URL:** https://minddock.vercel.app  
**Repo:** https://github.com/gourivngnair/minddock-v1

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target User](#2-target-user)
3. [Core Design Philosophy](#3-core-design-philosophy)
4. [Information Architecture](#4-information-architecture)
5. [Authentication & Onboarding](#5-authentication--onboarding)
6. [Today View](#6-today-view)
7. [Focus Mode](#7-focus-mode)
8. [Stuck Mode](#8-stuck-mode)
9. [Brain Dump (Command Centre)](#9-brain-dump-command-centre)
10. [Tasks](#10-tasks)
11. [Appointments](#11-appointments)
12. [Calendar](#12-calendar)
13. [Journal](#13-journal)
14. [Patterns](#14-patterns)
15. [Settings](#15-settings)
16. [Data Model](#16-data-model)
17. [User Flows](#17-user-flows)
18. [Non-Functional Requirements](#18-non-functional-requirements)

---

## 1. Product Vision

MindDock is a **capacity-aware ADHD coach** for adults. It does not ask you to manage a list of 40 tasks. It asks: *what can you actually do right now, given how you feel today?*

The app adapts to the user's real cognitive patterns over time — learning how long tasks actually take them, when their energy is highest, and what kinds of tasks they tend to avoid. Every feature is designed around the specific executive-function challenges that accompany ADHD.

**One-line pitch:** The to-do app that works with your brain instead of against it.

---

## 2. Target User

### Primary Persona — "The Overwhelmed Professional"

| Attribute | Detail |
|---|---|
| Age | 22–42 |
| Diagnosis | ADHD (combined or inattentive type), diagnosed or self-identified |
| Context | Working adult — employed, freelancing, or studying |
| Core pain | Has tried every productivity app; always ends up with a 300-item backlog |
| Emotional state | Shame around unfinished tasks; anxiety when looking at a full to-do list |

### ADHD Challenges Addressed

| Challenge | How MindDock addresses it |
|---|---|
| **Time blindness** | Tracks actual vs estimated time; multiplies estimates by user's real pattern |
| **Executive dysfunction** | Capacity bucket shows only what fits today; one-tap Focus Mode removes decision overhead |
| **Hyperfocus** | Focus timer surfaces when you've over-run your estimate |
| **Working memory** | Task descriptions hold the "how"; journal holds the "what happened" |
| **Rejection sensitivity** | Reframes undone tasks as capacity issues, not failures |
| **Overwhelm / paralysis** | Stuck Mode reduces the visible list to exactly one tiny task |

---

## 3. Core Design Philosophy

### 3.1 Capacity First
The app never shows all tasks at once. It surfaces only the tasks that fit the user's current energy and available time window. A user at energy level 2 (Low) sees only low-energy tasks. A user who has already spent 3 hours working sees shorter tasks.

### 3.2 Warm Editorial Aesthetic
Most productivity apps use a cold, clinical blue-and-white palette that amplifies anxiety. MindDock uses a warm, paper-toned editorial design (cream backgrounds, serif headings, ink-soft text) to feel calming rather than demanding.

### 3.3 No Judgement Architecture
There is no "overdue" shaming banner. There is no streak counter that resets on a missed day. Past-due tasks show a small label but remain fully editable and usable. The language is gentle: "Nothing left. That's allowed. Rest counts."

### 3.4 Scaffolded, Not Prescriptive
The app breaks tasks into micro-steps (scaffolds) when the user asks — but never forces it. The user decides the granularity of their own to-do list.

---

## 4. Information Architecture

```
MindDock
├── Auth
│   ├── Sign In (email/password)
│   ├── Sign Up
│   ├── Forgot Password (email reset link)
│   └── Google OAuth
│
├── Onboarding (first login only)
│   ├── Welcome — feature overview
│   ├── Symptoms — ADHD challenge selection
│   ├── Friction Audit — life areas that pile up
│   └── Task Preview — review & edit scaffolded tasks
│
└── Main App (6 tabs + FAB)
    ├── Today
    ├── Tasks
    ├── Calendar
    ├── Journal
    ├── Patterns
    ├── Settings (Me)
    └── [FAB] Brain Dump
```

### Navigation
- **Mobile / Tablet:** Fixed bottom navigation bar. Left group: Today, Tasks, Calendar. Centre: Brain Dump FAB. Right group: Journal, Patterns, Me.
- **Desktop (≥ 1024 px):** Left sidebar (230 px) with wordmark, all nav items listed vertically, and a wide "Brain Dump" pill button.

---

## 5. Authentication & Onboarding

### 5.1 Auth Screen

**Modes:** Sign In · Create Account · Reset Password

**Email/password flow:**
1. User enters email + password and taps Sign In / Create Account.
2. On sign-up, a confirmation email may be sent (Supabase default).
3. On sign-in, session is established and the app navigates to onboarding (first time) or Today (returning).

**Google OAuth flow:**
1. User taps "Continue with Google" — redirects to Google's OAuth consent screen.
2. On return, Supabase exchanges the code for a session.
3. App navigates to onboarding or Today.

**Password reset:**
1. User switches to Reset mode, enters email, taps "Send reset link".
2. Confirmation screen shown; link sent via Supabase email.

**Visual design:** Identical warm editorial theme as the main app — serif wordmark, paper backgrounds, same input styling.

---

### 5.2 Onboarding Flow

Runs once on first login. Four steps with animated progress dots.

**Step: Welcome**
- Feature cards: Capacity-First · Focus Mode · Time-Blindness Coach · Friction Scaffolds
- CTA: "Get started →"

**Step 1 of 3: What challenges do you face?**
- Six ADHD symptoms shown as tappable cards with icons and descriptions:
  - ⏰ Time Blindness — Tasks always take longer than expected
  - 🧠 Executive Dysfunction — Trouble starting or switching tasks
  - 🔍 Hyperfocus — Over-investing in one thing
  - 💭 Working Memory Issues — Forgetting steps mid-task
  - 💔 Rejection Sensitivity — Avoidance due to fear of failure
  - 🌊 Overwhelm — Too many options cause paralysis
- User selects any combination. Selection is stored as `symptoms[]` on the profile and drives personalised insights on the Patterns tab.
- Back / Next navigation.

**Step 2 of 3: What's been piling up?**
- 2-column grid of 8 life areas:
  - 🧺 Laundry · 📋 Admin · 🍽️ Dishes · 🛒 Groceries
  - 🏃 Exercise · 💳 Bills & Finance · 💬 Social Catch-up · 🛁 Self-Care
- Each area has 2–3 pre-defined micro-tasks (e.g. Laundry → Sort laundry / Put load in washing machine / Move to dryer).
- Selected areas show a task count badge.
- CTA: "Skip — I'll add tasks myself →" or "Preview N areas →"

**Step 3 of 3: Your scaffolded tasks**
- Lists all micro-tasks generated from the friction audit.
- Each task card is tappable to expand an inline edit form: title, estimated time, recurrence.
- CTA: "Start my day →" — saves all tasks to the store and navigates to Today.

---

## 6. Today View

The primary screen. Shown every time the app opens after onboarding.

### 6.1 Header
- Date label (e.g. MON, MAY 16)
- Greeting: "Hi, {name}."
- Level badge (top right): shows current XP level emoji + number. Taps through to Patterns tab.

### 6.2 Energy Battery
The most important interaction on the screen. User sets their energy level (1–5) by tapping one of five segments:

| Level | Label | Meaning |
|---|---|---|
| 1 | Drained | Barely functional — only basic self-care |
| 2 | Low | Can do simple, low-stakes tasks |
| 3 | Steady | Normal working capacity |
| 4 | Decent | Good focus available |
| 5 | Sparked | High energy, tackle the hard stuff |

**Every time the user changes their energy level, an energy log entry is automatically created** with the current timestamp. This data feeds the Patterns tab's Energy vs Time of Day chart.

### 6.3 Time-Blindness Strip
Shown when the user's multiplier B is > 1.0. Displays: "Things take you about **X%** longer than you guess. We've padded today's estimates." Taps through to Patterns.

### 6.4 Summary Chips
Two quick-access chips:
- **Appointments** — taps to Appointments tab
- **N tasks left** — taps to Tasks tab

### 6.5 Stuck Toggle
A toggle button: "I feel stuck / Tap when starting feels impossible." When active, the task list filters to Stuck Mode (see Section 8).

### 6.6 Task List — Capacity Bucket
The main task list. **Not all tasks are shown** — only those that fit the user's capacity:
- Tasks filtered by `energyRequired ≤ currentEnergy`
- Sorted by composite score: `(priority × 1.5) + urgency + energyMatch`
- Each task card shows:
  - Bucket-colour dot (category indicator)
  - Badge row: scaffold / easy / waiting / urgent
  - Task title
  - Time meta: `{user estimate}m → ~{adjusted}m · {bucket} · {priority}`
  - Deadline (if set)
  - **Checkbox** (left) — marks task complete without entering Focus Mode
  - **Tap body/arrow** — enters Focus Mode for this task

### 6.7 Done Today Section
Appears below the task list when any tasks have been completed today. Shows:
- Each completed task title (strikethrough) with Focus time if applicable
- **"📓 Today's Journal" button** — navigates to Journal tab. Always visible (even when no tasks are done) so the journal is one tap away from Today.

---

## 7. Focus Mode

Entered by tapping a task card body or the Brain Dump "Do now" option.

### 7.1 Screen Layout
Full-screen dark background (#120e2e). Elements:
- **Task title** (large serif, centred)
- **Ring timer** — SVG circular progress showing elapsed time vs adjusted estimate
- **Elapsed time** (mono, centre)
- **Adjusted estimate** label
- **Break button** — opens break time picker (5 / 10 / 15 / 30 min)
- **Done** button — opens Reality Check
- **Cancel** button — discards session, returns to Today

### 7.2 Break Tracking
Break minutes are recorded and subtracted from the elapsed time before the multiplier is updated. A separate "In break" screen is shown with its own timer.

### 7.3 Reality Check (completion)
Before marking complete, the app asks: "How long did that really take?" with the elapsed time pre-filled. User can adjust. Tapping "Save" triggers:
1. Task marked complete with `completedViaFocus = true`, `actualTime = minutes`
2. Multiplier B updated: `B_new = B_old × 0.7 + (actual / estimated) × 0.3`
3. Pattern entry logged to `patternHistory`
4. **+20 XP** awarded
5. Return to Today view

### 7.4 Quick Complete (no multiplier update)
Tapping the checkbox on a task card in Today view marks it complete without entering Focus Mode. **+10 XP** awarded. The multiplier is *not* updated — only Focus Mode sessions train the time-blindness model.

---

## 8. Stuck Mode

Activated by the "I feel stuck" toggle on the Today view.

### 8.1 Filtering logic
Shows only tasks where:
- `energyRequired = 1` (Easy)
- `userEstimatedTime ≤ 15 min`

### 8.2 One-task UI
Displays exactly one task at a time with:
- Large title in a blue-bordered card
- "YOUR ONE TASK" label
- Focus button → starts Focus Mode
- Skip button → cycles to the next candidate task
- Exit (×) → returns to normal Today view

### 8.3 Purpose
Addresses executive dysfunction and paralysis. When the user can't decide where to start, presenting a single tiny task removes the decision overhead entirely.

---

## 9. Brain Dump (Command Centre)

Accessed via the FAB (floating action button) from any screen.

### 9.1 Root menu
Three options:
- **Task** — something to do
- **Journal** — a thought or feeling to park
- **Appointment** — something at a specific time

### 9.2 Task flow

**Step 1 — Task details:**
- Title (free text)
- Estimate (chip picker: 5 / 10 / 15 / 30 / 45 / 60 / 90 min)
- ADHD-adjusted preview: shows `~{estimate × multiplierB}m` using the user's real multiplier so the preview matches what the task card will display
- Optional deadline (datetime-local input, toggled by "+ Set deadline")
- Priority (Low / Medium / High)
- Energy cost (Easy / Moderate / Heavy)

**Step 2 — Action picker:**
- **Do now** — adds task and immediately enters Focus Mode
- **Add to list** — adds to the task list for later
- **Delegate** — advances to the delegate step

**Step 3 — Delegate (conditional):**
- Input: "Who are you delegating to?" (optional)
- Submit button reads "Delegate to {name}" or "Mark as waiting on someone"
- Stores `waitingOn: name` on the task with `priority = Low`, `energyRequired = Easy`

### 9.3 Journal quick-capture
Text area: "Park it here. We won't make it a task unless you ask."
Saves as a journal entry with `mood: 'okay'` and no energy override.

### 9.4 Appointment quick-add
Title + datetime-local + location (Home / Out with travel buffer note).
Saves with default energy = Moderate, bucket = Life.

---

## 10. Tasks

Full task management view. Accessible from the bottom nav or the "N tasks left" chip on Today.

### 10.1 Layout
- Header: task count (pending · done)
- "+ Add" button → opens the full Add Task modal
- Filter chips: All tasks · High priority · Easy to start · Due soon · Waiting on
- Sort pills: Newest first · Highest priority · Easiest first · By bucket
- Task list (pending)
- Completed section (collapsed header, expandable)

### 10.2 Task row
Each row shows (identical format to Today's TaskCard):
- Bucket-colour dot + checkbox (left)
- Badge row: scaffold / easy / waiting / urgent / past due
- Title
- Meta: `{estimate}m → ~{adjusted}m adjusted · {bucket} · {priority}`
- Deadline line (if set)
- **Focus** button (pending tasks only)
- **Edit** button (pencil icon) — always visible, works on all states
- **Delete** button

### 10.3 Add Task modal
Full-featured form:
- Title + description
- Category (colour-coded pill picker: Work / Life / Health / Social / Admin / Finance / Other)
- Priority (↓ / → / ↑ visual buttons)
- Energy cost (colour-coded: green/amber/coral)
- Estimated time (number input)
- Location (🏠 Home / 🚗 Away)
- Recurrence (Once / Daily / Alternate days / Weekly / Biweekly / Monthly / Quarterly)
- Deadline (datetime-local, optional)
- Waiting on (free text, optional)

### 10.4 Edit Task sheet
Same fields as Add Task, pre-populated with current values. Available on every task regardless of completion state or deadline status.

### 10.5 Expanded detail
Tapping a task row body expands an inline detail panel:
- Description text
- ADHD-adjusted time with multiplier shown: `22m (your 15m × 1.47× multiplier)`
- Formatted deadline with past-due warning
- Waiting on
- Recurrence

### 10.6 Category colours (bucket tags)

| Category | Colour |
|---|---|
| Work | Slate blue |
| Life | Sage |
| Health | Coral |
| Social | Lavender |
| Admin | Gold |
| Finance | Teal |
| Other | Ink muted |

---

## 11. Appointments

Time-bound commitments that appear on the Calendar and in Today's Journal.

### 11.1 Layout
- Header: upcoming count · past count
- "+ Add" button
- Filter chips: All · Today · This week · Past · Home · Away
- Appointment cards (sorted by deadline)

### 11.2 Appointment card
- Location icon (🏠 sage / 🚗 coral)
- Title + formatted date/time
- Time badge: "In 3h" / "Today" / "Tomorrow" / "In N days" / "Xh ago"
- Past badge on past appointments
- Travel buffer badge (+25m) for Away appointments
- Description (if set)
- **Edit** (pencil) + **Delete** buttons — always visible, including on past items

### 11.3 Add / Edit appointment sheet
Same form for both add and edit (pre-populated for edit):
- Title
- Date & time (datetime-local)
- Location (Home / Out) with travel buffer note
- Energy needed (Easy / Moderate / Heavy colour buttons)
- Category (bucket pill picker)
- Notes

### 11.4 Travel buffer
Away appointments get a visual note "+25m travel" to remind the user to start preparing earlier. The 25 min is advisory — it appears as a badge but does not automatically adjust the deadline.

---

## 12. Calendar

Visual overview of the month with tasks and appointments.

### 12.1 Month grid
- Sunday-first column layout
- Today highlighted
- **Gold dots** — appointments on that day
- **Blue dots** — tasks with a deadline on that day
- Overflow indicator (+N) for days with more than 3 items

### 12.2 Day detail panel
Tapping a day expands a panel below the grid showing:
- Appointments for that day (title + time)
- Tasks due that day (title + estimated time)

---

## 13. Journal

A daily log that automatically aggregates everything that happened in a day.

### 13.1 Navigation
- **Today tab** — structured 6-section view for the current day
- **History tab** — collapsible day cards for all previous days

### 13.2 Today tab — six sections

Each section has a coloured label, a count badge, and an inline add button where applicable.

#### 💭 Mood & Thoughts (rose)
User-written entries. Each entry has:
- Mood selector: Amazing 🤩 / Good 😊 / Okay 😐 / Rough 😔 / Terrible 😞
- Energy reading at time of writing (pre-filled from current level, adjustable)
- Free-text thoughts field
- Optional photo attachment (+3 XP)

Tap any entry to expand full text and photo. Tap again to reveal a Delete option.

#### ⚡ Energy Levels (amber)
Auto-populated. Every time the user changes their energy in the Today view, an entry is created here with the timestamp and level label. Shows a mini bar chart of energy readings for the day followed by a timestamped list.

User can delete individual energy log entries by tapping them.

#### 📅 Appointments (sky)
Auto-populated from today's appointments. Shows:
- Location icon (🏠 / 🚗)
- Title (strikethrough if past, with "done" label)
- Appointment time

#### ✓ Tasks Completed (sage)
Auto-populated when tasks are marked complete today (uses `completedAt` timestamp, not `createdAt`, so tasks created in the past that are completed today appear correctly). Shows:
- Task title (strikethrough)
- "Focus" badge if completed via Focus Mode
- Completion time
- Progress bar showing done / total

#### 🍽️ Meals (terra)
User-logged. Each meal entry has:
- Meal type: Breakfast 🍳 / Lunch 🥗 / Dinner 🍽️ / Snack 🍎
- Description (what they ate)
- How it felt: Meh 😐 / Good 😊 / Great 🌟

Multiple meals can be logged per day. Tap × to delete.

#### 💤 Sleep (teal)
User-logged. One sleep entry per log. Fields:
- Bedtime (datetime-local)
- Wake time (datetime-local)
- Duration calculated automatically and displayed
- Quality (1 = Awful → 5 = Great, colour-coded)
- Optional notes (dreams, disturbances, medications)

Tap × to delete.

### 13.3 History tab
All previous days listed newest-first as collapsible day cards. Each card header shows:
- Date label
- Summary icons: 📅 N · 💭 N · ⚡ N · ✓ N · 🍽️ N · 💤

Tapping expands all entries for that day in a timeline format.

### 13.4 Write button
Persistent button in the header. Opens a bottom sheet asking "What do you want to log?" with three options: Mood & Thoughts / Meal / Sleep.

---

## 14. Patterns

Insights about the user's behaviour over time, plus XP progress.

### 14.1 Level card
- Current level emoji + name + level number
- XP progress bar (XP into this level / XP needed)
- Total XP number
- Next level name and required XP

10 levels from "Overwhelmed" (0 XP) to "Flow State" (7 500 XP).

### 14.2 Section toggle
Insights / XP Guide

### 14.3 Insights section

**ADHD Profile**
For each symptom the user selected during onboarding, a personalised insight card is shown:
- Time Blindness → current multiplier B value, interpretation
- Executive Dysfunction → Stuck Mode usage count
- Overwhelm → Focus Mode adoption rate
- Hyperfocus → reminder about the focus timer
- Working Memory → reminder about task descriptions
- Rejection Sensitivity → general self-awareness note

**Key Metrics (2×2 grid)**
| Metric | Source |
|---|---|
| Focus Rate | % of completed tasks done via Focus Mode |
| Multiplier | Current B value (time-blindness factor) |
| Avg Energy | Average of last 20 energy log readings |
| Scaffolds Done | Count of completed scaffolded tasks |

**Energy vs Time of Day chart**
SVG line + area chart. X-axis: hours of day (5 am – 11 pm). Y-axis: energy level 1–5.
- Each hour that has readings shows a coloured bar
- A smooth bezier line connects average readings per hour
- Dots are colour-coded by energy level (red = drained → blue = sparked)
- Shows the user's natural energy rhythm across the day
- Below: legend and total reading count

**7-Day Daily Energy bars**
From `patternHistory` (daily snapshots). Shows energy level for each of the last 7 days as a bar chart, colour-coded.

### 14.4 XP Guide section

**Level Roadmap**
All 10 levels listed with emoji, name, required XP. Current level highlighted in slate-blue. Past levels shown with a checkmark.

**How to Earn XP**
Collapsible categories of XP actions — Tasks, Focus, Journal, etc. — each expanding to show individual actions with their XP values.

**Pro Tip card**
"Focus Mode completions earn double XP (20 vs 10) and are the only way to train your Time-Blindness Multiplier."

---

## 15. Settings

### 15.1 Profile card
- Avatar (initials, slate-blue background)
- Editable name (tap pencil to edit inline)
- Level + XP bar
- Stats row: tasks done · focus sessions · journal entries

### 15.2 ADHD Profile
Read-only list of selected symptoms from onboarding.

### 15.3 Quick Links
- Patterns · Focus Guide · About

### 15.4 Data Management
- **Clear completed tasks** — removes all completed tasks from the store and Supabase (with confirmation)
- **Reset everything** — clears localStorage and reloads (nuclear option, with confirmation)

### 15.5 Account
**Sign out** — shows "Saving your data…" spinner while running `fullSync()` (upserts all local state to Supabase), then calls `supabase.auth.signOut()`. Data is safe in Supabase before localStorage is cleared.

---

## 16. Data Model

### Profiles
```
id                  uuid (= auth.users.id)
name                text
multiplier_b        float8 (default 1.5)
xp                  integer
symptoms            text[]
current_energy      integer 1–5
stuck_mode          boolean
last_active         timestamptz
onboarding_complete boolean
tutorial_seen       boolean
pattern_history     jsonb[]
```

### Tasks
```
id                   uuid
user_id              uuid
title                text
description          text
priority             integer 1–3
energy_required      integer 1–3
location             text (home | away)
deadline             timestamptz?
user_estimated_time  integer (minutes)
app_recommended_time integer (minutes = estimate × multiplier_b)
waiting_on           text?
bucket_tag           text (Work | Life | Health | Social | Admin | Finance | Other)
recurrence           text (once | daily | alternate-days | weekly | biweekly | monthly | quarterly)
is_scaffolded        boolean
completed            boolean
completed_via_focus  boolean
actual_time          integer?
completed_at         timestamptz?
created_at           timestamptz
```

### Appointments
```
id              uuid
user_id         uuid
title           text
description     text
location        text (home | away)
deadline        timestamptz
energy_required integer 1–3
bucket_tag      text
waiting_on      text?
completed       boolean
created_at      timestamptz
```

### Journal Entries
```
id               uuid
user_id          uuid
mood             text (amazing | good | okay | rough | terrible)
daily_energy     integer 1–5
entry_text       text
memory_image_url text?
created_at       timestamptz
```

### Energy Logs
```
id         uuid
user_id    uuid
energy     integer 1–5
note       text?
created_at timestamptz
```

### Meal Logs
```
id          uuid
user_id     uuid
meal_type   text (breakfast | lunch | dinner | snack)
description text
rating      integer 1–3?
created_at  timestamptz
```

### Sleep Logs
```
id         uuid
user_id    uuid
bedtime    timestamptz
wake_time  timestamptz
quality    integer 1–5
notes      text?
created_at timestamptz
```

---

## 17. User Flows

### Flow A — New User First Session

```
Open app
  └─ Auth screen
       └─ "Create account" → email + password
            └─ (or) "Continue with Google"
                 └─ Onboarding: Welcome
                      └─ Select symptoms (1+ of 6)
                           └─ Friction audit (pick life areas)
                                └─ Task preview (edit scaffolded tasks)
                                     └─ "Start my day →"
                                          └─ Today view (with scaffolded tasks loaded)
```

### Flow B — Returning User Daily Session

```
Open app
  └─ Auth check (Supabase getSession)
       └─ Session valid → hydrate from Supabase
            ├─ Last active < 48h ago → Today view
            └─ Last active > 48h ago → Resurrection screen
                 └─ "Fresh start" or "Keep my tasks" → Today view
```

### Flow C — Completing a Task via Focus Mode

```
Today view
  └─ Tap task card body (or arrow)
       └─ Focus Mode (full-screen timer starts)
            ├─ [Optional] Tap "Add break" → break timer → resume
            └─ Tap "Done"
                 └─ Reality Check: "How long did that really take?" (pre-filled)
                      └─ Confirm
                           └─ Task marked complete (completedAt = now)
                                Task appears in Journal "Tasks Completed" section
                                Multiplier B updated
                                +20 XP
                                → Return to Today
```

### Flow D — Quick Complete (no Focus Mode)

```
Today view (or Tasks view)
  └─ Tap checkbox on task card
       └─ Task marked complete (completedAt = now)
            Task appears in Journal "Tasks Completed" section
            +10 XP (multiplier NOT updated)
```

### Flow E — Brain Dump → Delegate

```
FAB (any screen)
  └─ "Task"
       └─ Enter title, estimate, priority, energy → "Continue"
            └─ Action picker
                 └─ "Delegate"
                      └─ Delegate step: "Who are you handing this to?"
                           └─ Type name (or leave blank)
                                └─ "Delegate to Alex" button
                                     └─ Task created: priority=Low, energy=Easy, waitingOn="Alex"
                                          → Sheet closes
```

### Flow F — Journal Daily Log

```
Journal tab → Today
  └─ View auto-populated sections:
       - Appointments (from today's calendar)
       - Energy readings (auto-logged from Today view energy changes)
       - Completed tasks (auto-logged on completion)
  └─ Tap "Write" button
       └─ Log picker: Mood & Thoughts | Meal | Sleep
            ├─ Mood & Thoughts → mood selector + energy + text + optional photo → Save
            ├─ Meal → meal type + what + how it felt → Log Meal
            └─ Sleep → bedtime + wake time + quality + notes → Log Sleep
```

### Flow G — Sign Out

```
Settings (Me tab)
  └─ "Sign out"
       └─ "Saving your data…" spinner
            └─ fullSync() — upserts all store data to Supabase
                 └─ supabase.auth.signOut()
                      └─ clearSession() — clears local state + localStorage
                           └─ Auth screen
```

### Flow H — Stuck and Overwhelmed

```
Today view
  └─ Tap "I feel stuck"
       └─ Stuck Mode activates
            └─ One task shown (energy=1, ≤15 min)
                 ├─ Tap "Focus" → Focus Mode for that task
                 ├─ Tap "Skip" → next candidate task
                 └─ Tap ✕ → return to normal Today view
```

### Flow I — Editing a Past-Due Task

```
Tasks tab
  └─ Scroll to task (may have "past due" badge)
       └─ Tap pencil icon (edit — always visible)
            └─ Edit Task sheet opens pre-populated
                 └─ Update deadline / title / waiting-on / etc.
                      └─ "Save changes" → Zustand update + Supabase sync
```

### Flow J — Understanding Energy Patterns

```
Patterns tab → Insights
  └─ "Energy vs Time of Day" chart
       └─ Chart shows hourly energy averages from all energy_logs
            └─ User sees when they're typically high energy (e.g. 9–11am)
                 and when they crash (e.g. 2–4pm)
                      └─ User can schedule high-priority tasks in their peak window
```

---

## 18. Non-Functional Requirements

### Performance
- App mounts and shows local data immediately on return visits (localStorage hydration before Supabase sync)
- Supabase writes are optimistic — UI never waits for a network response during normal use
- Bundle split: vendor-react (~195 KB) · vendor-supabase (~180 KB) · vendor-zustand (~3 KB) · app (~154 KB)

### Offline resilience
- All writes are fire-and-forget with silent retry-on-sign-out via `fullSync()`
- `loadAllUserData` uses `Promise.allSettled` — a missing table returns `[]` and never crashes login
- `clearSession()` is guarded behind `!authLoading` to prevent wiping data before auth resolves

### Security
- All data access via Supabase Row-Level Security: `auth.uid() = user_id`
- No server-side code — all writes go directly from browser to Supabase over HTTPS
- Supabase anon key is public (read: rate-limited, RLS-protected) — not a security risk

### Responsive design
| Breakpoint | Behaviour |
|---|---|
| `< 640 px` | 480 px max-width, bottom nav |
| `640–1023 px` | 640 px max-width, wider padding |
| `≥ 1024 px` | Full-width, left sidebar navigation (230 px) |
| `≥ 1400 px` | Sidebar widens to 260 px |

### Accessibility
- All interactive elements are `<button>` or `<a>` (never `<div onClick>`) except where HTML nesting constraints require a `<div>` outer wrapper with inner buttons (e.g. TaskCard)
- All icon-only buttons have `aria-label` or `title`
- `color-scheme: light` on date inputs prevents OS dark-mode from inverting native pickers
- Focus ring preserved on all interactive elements

### Data persistence guarantee
On sign-out, `fullSync()` upserts the complete store state to Supabase before clearing localStorage, ensuring no data is lost even if real-time writes failed due to network issues.
