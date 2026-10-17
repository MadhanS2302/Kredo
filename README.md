# Kredo (Part 2)

Your work, your proof. A trust passport for informal workers.

## What's in Part 2
- Dashboard: log a job, see your jobs, verified income, logout
- Customer confirmation page `/confirm/<token>` (no login)
- Public profile `/w/<slug>` with stats and QR code
- Fraud rules on job creation: no own-number, max 10 jobs/day, no exact duplicates

## Setup
1. Copy these files over your existing `kredo` folder (your `.env.local` is not touched).
2. In Supabase: Project Settings -> API Keys -> copy the **service_role** (or **secret**) key.
3. Add one line to `.env.local`:
   `SUPABASE_SERVICE_ROLE_KEY=your_secret_key`
   Never add NEXT_PUBLIC_ to it and never commit it.
4. Stop the server (Ctrl+C) and run `npm run dev` again.

No new database changes are needed.
