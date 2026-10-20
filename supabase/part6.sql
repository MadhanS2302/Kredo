-- Part 6: email verification. Run in Supabase Dashboard -> SQL Editor -> New query -> Run

alter table jobs add column if not exists customer_email text;
alter table jobs alter column customer_phone drop not null;
alter table jobs add column if not exists email_sends smallint not null default 1;
create index if not exists jobs_customer_email_idx on jobs (customer_email);

-- SECURITY: the confirmation link must reach only the customer's inbox.
-- Workers can no longer read confirm_token (or fraud flags), and can no longer
-- insert jobs directly (the app inserts them on the server after checks).
revoke select on jobs from anon, authenticated;
grant select (id, worker_id, customer_name, customer_phone, customer_email, job_type,
              amount, job_date, status, rating, confirmed_at, created_at, confidence, email_sends)
  on jobs to authenticated;
revoke insert on jobs from anon, authenticated;
