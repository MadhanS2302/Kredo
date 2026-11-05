<div align="center">

# Kredo

**Your work, your proof.**

Verifiable proof of income for informal workers: electricians, plumbers, painters, carpenters and more.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)](https://kredo-sigma.vercel.app)

[Live demo](https://kredo-sigma.vercel.app)

</div>

---

## The problem

Millions of skilled workers earn a good living in cash, but they have no paperwork to show for it. Banks, landlords and loan officers see "no income" and say no.

## The idea

Kredo turns finished jobs into proof. A worker logs a job, the **customer confirms and rates it**, and Kredo builds a verified work history the worker can share as a public profile or a PDF income statement with a QR code anyone can check.

Customers never need an account. They only open a link.

## How it works

```
Worker logs a job  ->  Rating link is created  ->  Worker shares it on WhatsApp
                                                              |
Verified income  <-  Customer rates + verifies their number  <-
      |
Public profile (/w/name)  +  PDF statement with QR (/verify/id)
```

1. **Sign in.** Workers sign in with an email code. Email is used for login only.
2. **Log a job.** Customer name and mobile, what was done, amount, date.
3. **Share the rating link.** One tap opens WhatsApp in the customer's chat with the message ready to send, or copy the link.
4. **Customer confirms.** They rate the work from 1 to 5 stars and prove they own the mobile number, with an SMS code (or by typing the number).
5. **Proof is built.** Confirmed jobs add up to verified income, a confidence level, a public profile and a downloadable statement.

## Features

- **No customer account.** Confirmation is a single link, with no app install and no sign-up.
- **WhatsApp-first sharing.** Opens the customer's chat with the message ready, plus a copy-link fallback.
- **Public worker profile** at `/w/<slug>` with a stamp showing the number of verified jobs, verified income, and a QR code.
- **PDF income statement** with a QR code that links to a verification page, so a bank can check it is real.
- **Confidence levels** (high / medium / low) on every confirmed job, based on fraud signals.
- **Admin review page** at `/admin/flags` for jobs that look suspicious.

## Anti-fraud

Proof is only worth something if it is hard to fake.

| Layer | What it does |
|---|---|
| **Customer verification** | The customer must prove they own the mobile number the worker entered: an SMS code (Fast2SMS) or, until SMS is set up, typing the number. |
| **Attempt lockout** | The 5th wrong code or number locks the link. The worker has to log the job again. |
| **Code limits** | At most 3 codes per job, 60 seconds apart, each valid for 10 minutes. |
| **Device and network flags** | Flags a confirmation from the same browser or network the worker logs jobs from, or one browser confirming many jobs for different customers. |
| **Behaviour scoring** | Fast confirmations, repeat-pair bursts, repeated amounts, amount outliers and cross-worker corroboration all adjust the confidence level. |
| **Limits at logging** | Max 10 jobs a day, max 3 per customer per day, and no exact duplicates. |

Flags lower a job's confidence. They never block an honest customer.

## Security model

- **Row Level Security** is on for every table. Workers can read and edit only their own data.
- **Column-level grants** hide `confirm_token`, verification codes and device hashes from the browser. Only the server, using the service-role key, can read them.
- **Jobs are written by the server only.** Workers have no direct insert permission on `jobs`.
- **Verification codes are stored hashed** and compared in constant time.
- **Attempt counting is atomic** (Postgres functions only the service role can call), so parallel guessing cannot get past the limit.
- **Raw IP addresses are never stored**, only salted hashes. Kredo sets one random cookie, `kredo_did`, to recognise a browser.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Database and auth | Supabase (Postgres, Row Level Security, email OTP login) |
| Styling | Tailwind CSS 4 |
| PDF and QR | `pdf-lib`, `qrcode`, `qrcode.react` |
| SMS | Fast2SMS OTP route (swappable in `src/lib/sms.ts`) |
| Hosting | Vercel |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A free [Supabase](https://supabase.com) project
- (Optional) A [Fast2SMS](https://www.fast2sms.com) account for SMS codes

### 1. Clone and install

```bash
git clone https://github.com/MadhanS2302/kredo.git
cd kredo
npm install
```

### 2. Set up the database

In Supabase, open **SQL Editor** and run these files **in this order**:

1. `supabase/schema.sql`
2. `supabase/part4.sql`
3. `supabase/part6.sql`
4. `supabase/part8.sql`

### 3. Configure login emails

In Supabase, go to **Authentication -> Emails** and add `{{ .Token }}` to the **Magic Link** and **Confirm signup** templates, so workers receive a 6-digit code. For real use, add a custom SMTP provider (for example Brevo) so emails are not rate-limited.

### 4. Add environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server-only** secret. Never prefix it with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your public address. Rating links start with this |
| `ADMIN_EMAILS` | No | Comma-separated emails allowed to open `/admin/flags` |
| `FAST2SMS_API_KEY` | No | Turns on SMS code verification. Empty means the customer types their number |
| `SMS_DEV_CONSOLE` | No | Set to `1` in development to print codes in the terminal |
| `FRAUD_SALT` | No | Random text used to hash device and network signals |

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Testing tip:** if you use one phone as both worker and customer, Kredo will correctly flag `same_device_as_worker`. Open the rating link in a different browser or phone for a clean test.

## Deploying to Vercel

1. Push the repository to GitHub and import it in [Vercel](https://vercel.com).
2. Add the same environment variables in **Project -> Settings -> Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` to your live address, then redeploy.
4. In Supabase, add that address to **Authentication -> URL Configuration**.

## Project structure

```
src/
  app/
    page.tsx                 Landing page
    login/                   Email-code sign in
    onboarding/              Worker profile setup
    dashboard/               Jobs, log a job, share proof (+ server actions)
    confirm/[token]/         Customer rating + verification page
    w/[slug]/                Public worker profile
    verify/[id]/             Statement verification page (QR target)
    api/statement/           PDF income statement
    admin/flags/             Review of flagged jobs
  lib/
    confidence.ts            Fraud scoring -> high / medium / low
    fraud.ts                 Device and network signals (hashed)
    verify.ts                Verification limits
    sms.ts                   SMS code sender (Fast2SMS)
    share.ts                 WhatsApp link and message builder
    statement-pdf.ts         PDF generation
    supabase/                Browser, server and admin clients
supabase/                    SQL files, run in order
```

## Roadmap

- [ ] Tamil and English interface
- [ ] Voice job logging
- [ ] Offline-first mode that syncs later
- [ ] Kredo Score and a loan-ready report (3, 6 and 12 months)
- [ ] Shareable proof card for WhatsApp Status
- [ ] "Request this worker" button on public profiles
- [ ] WhatsApp delivery for verification codes

## Known limitations

- A worker who controls a second SIM can enter that number and receive the code. The device and network flags and `/admin/flags` are the next line of defence.
- Shared Wi-Fi or mobile networks can trigger a `same_network_as_worker` flag for an honest customer, so it carries only a small penalty.

## Author

**Madhan S**

- GitHub: [@MadhanS2302](https://github.com/MadhanS2302)
- Portfolio: [madhans.is-a.dev](https://madhans.is-a.dev)

---

<div align="center">

Built so that honest work can be seen.

</div>
