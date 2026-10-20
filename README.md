# Kredo (Part 7: WhatsApp rating link + number check)

Your work, your proof.

## What changed
- Email is used only for worker login (Supabase emails the sign-in code). Kredo no longer emails customers.
- When a worker logs a job, Kredo creates a rating link. The worker gets **Share on WhatsApp** and **Copy link** buttons, and sends the link to the customer.
- The customer's mobile number is now required when logging a job. It opens the WhatsApp chat directly and identifies the customer for the repeat-customer and fraud checks.
- Pending jobs in the Jobs list keep the same two buttons, so a worker can share the link again any time within 7 days.
- Removed: customer email form field, "Resend email", SMTP settings, nodemailer.
- No new SQL. `supabase/part6.sql` still applies: workers cannot read `confirm_token` directly. The link is fetched by a server action (`getJobLink`) that first checks the job belongs to the signed-in worker.

- **Share on WhatsApp** is a real WhatsApp link: on phones it opens the WhatsApp app in that customer's chat with the message ready to send; on a computer it opens WhatsApp Web in a new tab.
- **Number check:** the customer's rating page asks for their mobile number below the rating. If it does not match the number the worker entered, nothing is saved (confirm or reject). Old jobs with no stored mobile number cannot be confirmed; the worker logs them again.

## Setup
1. Unzip over your existing `kredo` folder.
2. `src/lib/email.ts` is now an empty placeholder (you can delete it later).
3. Run `npm install` (nodemailer is removed from package.json).
4. In `.env.local` and Vercel keep: Supabase keys, `NEXT_PUBLIC_SITE_URL`, optional `ADMIN_EMAILS`. The SMTP_* and MAIL_FROM variables are no longer needed.
5. Supabase -> Authentication -> Emails: keep custom SMTP (Brevo) for the login code, with `{{ .Token }}` in the Magic Link and Confirm signup templates.
6. Deploy: git add . / git commit -m "Part 7" / git push

## Notes
- Set `NEXT_PUBLIC_SITE_URL` to your live address, because it is the start of every rating link.
- Because the worker now holds the rating link, a dishonest worker could open it and confirm their own job. The confidence labels (for example `fast_confirm`) and /admin/flags are the defence; tune them with real pilot data.
- Older jobs logged with a customer email still work. They have no mobile number, so WhatsApp opens the contact picker instead of a chat.
