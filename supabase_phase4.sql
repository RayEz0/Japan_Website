-- ─────────────────────────────────────────────────────────────────
-- PHASE 4 — Run this entire block in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- ── EXPENSES ─────────────────────────────────────────────────────
create table if not exists expenses (
  id             uuid        default gen_random_uuid() primary key,
  created_by     uuid        references auth.users not null,
  name           text        not null,
  amount         numeric     not null,
  category       text        not null default 'Food',
  date           date,
  notes          text        default '',
  paid_by        text        not null,          -- 'aman' | 'rithwik' | 'vishal'
  split_between  text[]      not null default '{}',
  is_personal    boolean     default false,
  created_at     timestamptz default now()
);

alter table expenses enable row level security;

-- Anyone logged in can read all expenses (shared trip)
create policy "All members can read expenses"
  on expenses for select
  using (auth.role() = 'authenticated');

-- Any logged-in user can insert (they become the creator)
create policy "Members can insert expenses"
  on expenses for insert
  with check (auth.uid() = created_by);

-- Only the creator can delete their own expense
create policy "Creator can delete own expense"
  on expenses for delete
  using (auth.uid() = created_by);

-- ── SAVINGS ──────────────────────────────────────────────────────
create table if not exists savings (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users not null,
  person     text        not null,   -- 'aman' | 'rithwik' | 'vishal'
  month      text        not null,   -- 'Apr2026' … 'Sep2027'
  amount     numeric     default 0,
  updated_at timestamptz default now(),
  unique (person, month)
);

alter table savings enable row level security;

-- Anyone logged in can read all savings
create policy "All members can read savings"
  on savings for select
  using (auth.role() = 'authenticated');

-- Users can only insert/update rows where user_id matches their own id
create policy "Members can upsert own savings"
  on savings for insert
  with check (auth.uid() = user_id);

create policy "Members can update own savings"
  on savings for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
