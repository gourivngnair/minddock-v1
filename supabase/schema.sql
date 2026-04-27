-- ─────────────────────────────────────────
-- MindDock v1.1 — Supabase Schema
-- Run this once in your Supabase SQL Editor
-- ─────────────────────────────────────────

-- ── 1. Profiles (extends auth.users) ─────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  name                text not null default '',
  multiplier_b        float8 not null default 1.5,
  xp                  integer not null default 0,
  symptoms            text[] not null default '{}',
  current_energy      integer not null default 3,
  stuck_mode          boolean not null default false,
  last_active         timestamptz not null default now(),
  onboarding_complete boolean not null default false,
  tutorial_seen       boolean not null default false,
  pattern_history     jsonb not null default '[]'::jsonb,
  updated_at          timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();


-- ── 2. Tasks ──────────────────────────────
create table if not exists public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade,
  title                text not null,
  description          text not null default '',
  priority             integer not null check (priority between 1 and 3),
  energy_required      integer not null check (energy_required between 1 and 3),
  location             text not null default 'home' check (location in ('home','away')),
  deadline             timestamptz,
  user_estimated_time  integer not null,
  app_recommended_time integer not null,
  waiting_on           text,
  bucket_tag           text not null default 'Life',
  recurrence           text not null default 'once',
  is_scaffolded        boolean not null default false,
  completed            boolean not null default false,
  completed_via_focus  boolean not null default false,
  actual_time          integer,
  created_at           timestamptz not null default now()
);


-- ── 3. Appointments ──────────────────────
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  title           text not null,
  description     text not null default '',
  location        text not null default 'home' check (location in ('home','away')),
  deadline        timestamptz not null,
  energy_required integer not null check (energy_required between 1 and 3),
  bucket_tag      text not null default 'Life',
  waiting_on      text,
  completed       boolean not null default false,
  created_at      timestamptz not null default now()
);


-- ── 4. Journal entries ───────────────────
create table if not exists public.journal_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  mood             text not null check (mood in ('amazing','good','okay','rough','terrible')),
  daily_energy     integer not null check (daily_energy between 1 and 5),
  entry_text       text not null default '',
  memory_image_url text,
  created_at       timestamptz not null default now()
);


-- ── 5. Row-Level Security ────────────────
alter table public.profiles         enable row level security;
alter table public.tasks            enable row level security;
alter table public.appointments     enable row level security;
alter table public.journal_entries  enable row level security;

-- Profiles: user can only access their own row
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- Tasks: user can only access their own rows
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Appointments
create policy "own appointments" on public.appointments
  for all using (auth.uid() = user_id);

-- Journal
create policy "own journal" on public.journal_entries
  for all using (auth.uid() = user_id);


-- ── 6. Indexes ───────────────────────────
create index if not exists tasks_user_id_idx        on public.tasks(user_id);
create index if not exists tasks_deadline_idx        on public.tasks(deadline) where deadline is not null;
create index if not exists appts_user_id_idx         on public.appointments(user_id);
create index if not exists appts_deadline_idx        on public.appointments(deadline);
create index if not exists journal_user_id_idx       on public.journal_entries(user_id);
create index if not exists journal_created_at_idx    on public.journal_entries(created_at desc);
