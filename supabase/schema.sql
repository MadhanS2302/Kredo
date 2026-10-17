-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run

create table workers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  trade text not null default 'electrician',
  area text,
  public_slug text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  job_type text not null,
  amount integer not null check (amount > 0),
  job_date date not null default current_date,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','expired')),
  confirm_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  rating smallint check (rating between 1 and 5),
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

alter table workers enable row level security;
alter table jobs enable row level security;

create policy "worker reads own profile" on workers
  for select using (auth.uid() = id);
create policy "worker creates own profile" on workers
  for insert with check (auth.uid() = id);
create policy "worker updates own profile" on workers
  for update using (auth.uid() = id);

create policy "worker reads own jobs" on jobs
  for select using (auth.uid() = worker_id);
create policy "worker creates own jobs" on jobs
  for insert with check (auth.uid() = worker_id);
