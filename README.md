# Kredo (Part 6: email verification)

Your work, your proof.

## What changed
- Workers sign in with an emailed code (no phone OTP, no SMS cost).
- When a worker logs a job, Kredo emails the customer a confirmation link. The worker never sees the link, so only someone with access to that inbox can confirm. That is the verification.
- Optional customer mobile is used only for a WhatsApp reminder ("check your email").
- "Resend email" on pending jobs (max 3 sends per job).
- Security fix: the database now stops workers from reading confirmation tokens or inserting jobs directly (see supabase/part6.sql).

## Setup (do these in order)
1. Unzip over your existing `kredo` folder, then run `npm install`.
2. Supabase -> SQL Editor -> paste `supabase/part6.sql` -> Run.
3. Free email sender (Brevo, 300 emails/day, no card): create an account, verify a sender address, then SMTP & API -> SMTP -> create an SMTP key.
4. Add to `.env.local` AND Vercel -> Settings -> Environment Variables (see `.env.example`):
   NEXT_PUBLIC_SITE_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
5. Supabase -> Authentication -> Emails -> SMTP Settings -> Enable custom SMTP with the same Brevo details.
   Then Authentication -> Emails -> Templates: in BOTH "Magic Link" and "Confirm signup", put {{ .Token }} in the body (for example: Your Kredo code is {{ .Token }}).
   Optionally raise Authentication -> Rate Limits -> emails per hour.
6. Deploy: git add . / git commit -m "Part 6" / git push

## Local testing without email
If the SMTP variables are empty, `npm run dev` prints the customer email (with the link) in the terminal instead of sending it. Worker login still needs step 5 (Supabase must be able to send the code).

## Notes
- Existing phone-based test accounts are separate from email accounts: signing in by email creates a new worker account.
- Email is free to fake, so a dishonest worker can invent customer emails. The confidence labels and /admin/flags are the defence; tune them with real pilot data.
- Free email plans have daily limits (Brevo free: 300/day).
