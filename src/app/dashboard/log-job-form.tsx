"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "./actions";

export default function LogJobForm() {
  const [state, action, pending] = useActionState<CreateJobState, FormData>(
    createJob,
    null
  );
  const today = new Date().toISOString().slice(0, 10);

  const input = "w-full border rounded p-2 bg-transparent";

  return (
    <form action={action} className="space-y-3 border rounded p-4">
      <h2 className="text-lg font-semibold">Log a job</h2>
      <input name="customer_name" className={input} placeholder="Customer name" required />
      <input
        name="customer_phone"
        className={input}
        placeholder="Customer mobile (10 digits)"
        inputMode="numeric"
        required
      />
      <input name="job_type" className={input} placeholder="Job (e.g. Fan repair)" required />
      <input
        name="amount"
        type="number"
        className={input}
        placeholder="Amount in ₹"
        min={50}
        max={100000}
        required
      />
      <input name="job_date" type="date" className={input} defaultValue={today} max={today} required />
      <button
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded p-2"
      >
        {pending ? "Saving..." : "Save job"}
      </button>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-500 text-sm">{state.success}</p>}
    </form>
  );
}
