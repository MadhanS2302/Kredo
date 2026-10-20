"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "./actions";
import ShareButtons from "./share-buttons";

export default function LogJobForm({ onSaved }: { onSaved: () => void }) {
  const [state, action, pending] = useActionState<CreateJobState, FormData>(createJob, null);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.created)
    return (
      <div className="space-y-4">
        <div>
          <p className="font-display text-xl font-bold text-ok">Job saved</p>
          <p className="mt-1 text-mute">
            Send this rating link to the customer. When they open it, confirm the job and rate your
            work, the job counts.
          </p>
        </div>
        <p className="sheet break-all p-3 text-sm">{state.created.link}</p>
        <ShareButtons info={state.created} />
        <button type="button" onClick={onSaved} className="btn btn-quiet">
          Done
        </button>
      </div>
    );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="customer_name" className="label">Customer name</label>
        <input id="customer_name" name="customer_name" className="field" autoComplete="off" required />
      </div>

      <div>
        <label htmlFor="customer_phone" className="label">Customer mobile</label>
        <div className="flex gap-2">
          <span className="field flex w-20 items-center justify-center bg-paper font-semibold">+91</span>
          <input
            id="customer_phone"
            name="customer_phone"
            className="field"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit number"
            autoComplete="off"
            required
          />
        </div>
        <p className="hint mt-1">
          We make a rating link for this customer. You send it on WhatsApp in the next step.
        </p>
      </div>

      <div>
        <label htmlFor="job_type" className="label">What did you do?</label>
        <input id="job_type" name="job_type" className="field" placeholder="For example fan repair" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="amount" className="label">Amount (₹)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            className="field"
            min={50}
            max={100000}
            required
          />
        </div>
        <div>
          <label htmlFor="job_date" className="label">Date</label>
          <input
            id="job_date"
            name="job_date"
            type="date"
            className="field"
            defaultValue={today}
            max={today}
            required
          />
        </div>
      </div>

      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn">
        {pending ? "Saving…" : "Save job and get link"}
      </button>
    </form>
  );
}
