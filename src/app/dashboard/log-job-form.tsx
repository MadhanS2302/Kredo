"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "./actions";

export default function LogJobForm({ onSaved }: { onSaved: () => void }) {
  const [state, action, pending] = useActionState<CreateJobState, FormData>(
    async (prev, formData) => {
      const result = await createJob(prev, formData);
      if (result?.success) onSaved();
      return result;
    },
    null
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="customer_name" className="label">Customer name</label>
        <input id="customer_name" name="customer_name" className="field" autoComplete="off" required />
      </div>

      <div>
        <label htmlFor="customer_email" className="label">Customer email</label>
        <input
          id="customer_email"
          name="customer_email"
          type="email"
          inputMode="email"
          className="field"
          placeholder="customer@example.com"
          autoComplete="off"
          required
        />
        <p className="hint mt-1">
          We email them a link to confirm the job. You never see the link, which is what makes the
          confirmation count.
        </p>
      </div>

      <div>
        <label htmlFor="customer_phone" className="label">Customer mobile (optional)</label>
        <div className="flex gap-2">
          <span className="field flex w-20 items-center justify-center bg-paper font-semibold">+91</span>
          <input
            id="customer_phone"
            name="customer_phone"
            className="field"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit number"
          />
        </div>
        <p className="hint mt-1">Only used so you can remind them on WhatsApp to check their email.</p>
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
        {pending ? "Saving and emailing…" : "Save job and email customer"}
      </button>
    </form>
  );
}
