-- Part 4: run in Supabase Dashboard -> SQL Editor -> New query -> Run

alter table jobs add column if not exists confidence text
  check (confidence in ('high','medium','low'));
alter table jobs add column if not exists flags text[] not null default '{}';

create table if not exists statements (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  month text not null,
  job_count int not null,
  total_income int not null,
  avg_rating numeric(3,2),
  high_conf_pct int not null default 0,
  snapshot_hash text not null,
  issued_at timestamptz default now()
);


alter table statements enable row level security;
