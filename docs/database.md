# Database

Kredo uses Supabase (Postgres). Run the SQL files in `supabase/` in this order: `schema.sql`, `part4.sql`, `part6.sql`, `part8.sql`.

## Tables

### `workers`

One row per worker. `id` is the same as the Supabase auth user id.

| Column | Notes |
|---|---|
| `id` | primary key, references `auth.users` |
| `name`, `trade`, `area` | shown on the public profile |
| `phone` | optional |
| `public_slug` | unique short id used in `/w/<slug>` |
| `created_at` | |

### `jobs`

One row per logged job.

| Column | Notes |
|---|---|
| `id`, `worker_id` | the worker who logged the job |
| `customer_name`, `customer_phone` | `customer_phone` is the customer's identity for the checks (nullable since part 6, for older email-based jobs) |
| `customer_email` | only on older jobs from before the WhatsApp flow |
| `job_type`, `amount`, `job_date` | what was done, in rupees, and when |
| `status` | `pending`, `confirmed`, `rejected` or `expired` (also used when a link is locked) |
| `confirm_token` | secret used in the customer's rating link |
| `rating`, `confirmed_at` | set when the customer confirms |
| `confidence`, `flags` | result of the scoring, see confidence-scoring.md |
| `verify_code_hash`, `verify_code_expires_at`, `verify_code_sent_at`, `verify_sends`, `verify_attempts` | SMS code and lockout state |
| `created_ip_hash`, `created_device_hash` | hashed network and browser the worker logged the job from |
| `confirm_ip_hash`, `confirm_device_hash` | hashed network and browser the customer confirmed from |

### `statements`

One row per PDF income statement issued: month, job count, total income, average rating, share of high-confidence jobs, and a `snapshot_hash` used by the verification page.

## Access rules

- Row Level Security is on for every table.
- Workers can read only their own rows.
- Workers cannot insert jobs directly. The server writes them with the service-role key.
- Workers cannot read `confirm_token`, the verification columns or the device and network hashes. Only the columns listed in the grant in `part6.sql` are readable from the browser.

## Functions (called by the server only)

| Function | Purpose |
|---|---|
| `register_failed_attempt(p_job, p_max)` | Counts one wrong code or number. On the last allowed try the job becomes `expired`, which locks the link. |
| `reserve_code_send(...)` | Reserves one "send code" slot and enforces the limit on codes and the wait between them. |

Both are restricted to the `service_role`.