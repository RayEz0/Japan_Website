-- Run this in Supabase → SQL Editor

create table if not exists visited (
  id         uuid    default gen_random_uuid() primary key,
  user_id    uuid    references auth.users not null,
  place_key  text    not null,
  visited    boolean default false,
  notes      text    default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, place_key)
);

-- Enable Row Level Security
alter table visited enable row level security;

-- Each user can only read/write their own rows
create policy "Users manage own visited"
  on visited for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
