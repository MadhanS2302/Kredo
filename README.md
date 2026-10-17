# Kredo (Part 4)

Your work, your proof.

## New in Part 4
- **Confidence label** (high / medium / low) on every confirmed job, from rule-based checks
- **Income statement PDF** per month, with a QR code that opens `/verify/<id>`
- **Verify page** `/verify/<id>` showing the figures stored when the statement was issued
- **Flag review** at `/admin/flags` (admins only)
- New fraud rule: max 3 jobs per day for the same customer

## Setup
1. Unzip over your existing `kredo` folder (`.env.local` is not touched).
2. Run `npm install` (new packages: pdf-lib, qrcode).
3. Supabase -> SQL Editor -> paste `supabase/part4.sql` -> Run.
4. Optional, for the flag review page, add to `.env.local` AND to Vercel -> Settings -> Environment Variables:
   `ADMIN_PHONES=9999999999`  (10-digit numbers, comma separated)
5. Local test: `npm run dev`. To deploy: `git add .`, `git commit -m "Part 4"`, `git push`.

## How confidence is scored
Start at 60. Then:
- confirmed within 2 minutes of logging: -25 (flag fast_confirm)
- 5+ confirmed jobs with the same customer in 30 days: -20 (repeat_pair_burst)
- 1-4 earlier jobs with the same customer: +10 (genuine repeat customer)
- same amount 3+ times in 30 days: -10 (same_amount_repeat)
- amount over 5x the worker's median (needs 5+ jobs): -15 (amount_outlier)
- customer has also confirmed jobs for 1 other worker: +10, for 2+ others: +20
High is 70 or more, medium 45 or more, low below 45. Tune these numbers with pilot data.

## Known limits
- Statement PDFs use a basic Latin font: Tamil text in names or job descriptions prints as "?". Embedding a Tamil font is a later task.
- Customer confirmation still uses the phone-number match. Real OTP is next, once your SMS provider and DLT registration are sorted.
