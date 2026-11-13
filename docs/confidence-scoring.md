# Confidence scoring

Every confirmed job gets a confidence label: **high**, **medium** or **low**. It is calculated in `src/lib/confidence.ts` when the customer confirms.

A job starts at **60**. Suspicious patterns subtract points and independent corroboration adds points. The result is limited to 0 to 100.

| Score | Label |
|---|---|
| 70 or more | high |
| 45 to 69 | medium |
| below 45 | low |

## Rules

| Flag or signal | When it applies | Points |
|---|---|---|
| `fast_confirm` | The customer confirmed less than 60 seconds after the job was logged | -25 |
| `repeat_pair_burst` | This worker already has 5 or more confirmed jobs with the same customer in the last 30 days | -20 |
| `same_amount_repeat` | 3 or more of the worker's recent jobs have exactly the same amount | -10 |
| `amount_outlier` | The amount is more than 5 times the worker's median (needs at least 5 recent jobs) | -15 |
| `same_device_as_worker` | The confirming browser is one the worker logged jobs from | -45 |
| `same_network_as_worker` | The confirming IP is one the worker logged jobs from | -15 |
| `device_reuse` | The same browser already confirmed 2 or more other jobs of this worker for different customers | -25 |
| Repeat customer (no flag) | 1 to 4 earlier confirmed jobs with the same customer | +10 |
| Corroboration (no flag) | The customer also confirmed jobs for 1 other worker (+10) or 2 or more (+20) | +10 / +20 |

"Recent" means the last 30 days.

## Notes

- Flags only lower the label. They never stop a customer from confirming.
- Flagged jobs can be reviewed at `/admin/flags`.
- Shared Wi-Fi can cause `same_network_as_worker` for an honest customer, which is why it is a small penalty.
- To change a rule, edit `src/lib/confidence.ts` and update this page in the same commit.