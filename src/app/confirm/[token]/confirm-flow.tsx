"use client";

import { useActionState, useState } from "react";
import { confirmJob, type ConfirmState } from "./actions";
import Stamp from "@/components/Stamp";

export default function ConfirmFlow({
  token,
  workerName,
}: {
  token: string;
  workerName: string;
}) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(
    confirmJob.bind(null, token),
    null
  );
  const [rating, setRating] = useState(0);

  if (state?.done === "confirmed")
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Stamp count={1} size={150} press />
        <h2 className="font-display text-2xl font-bold">Thank you</h2>
        <p className="text-mute">
          {workerName} now has proof of this job. You can close this page.
        </p>
      </div>
    );

  if (state?.done === "rejected")
    return (
      <div className="py-6 text-center">
        <h2 className="font-display text-2xl font-bold">Noted</h2>
        <p className="mt-1 text-mute">This job was marked as not done. You can close this page.</p>
      </div>
    );

  return (
    <form action={action} className="space-y-5">
      <div>
        <p className="label">How was the work?</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onClick={() => setRating(n)}
              className="p-1 text-4xl leading-none"
              style={{ color: n <= rating ? "var(--tape)" : "var(--line)" }}
            >
              ★
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      <div className="space-y-2">
        <button name="decision" value="confirm" disabled={pending} className="btn">
          Yes, this work was done
        </button>
        <button name="decision" value="reject" disabled={pending} className="btn btn-quiet">
          No, this did not happen
        </button>
      </div>

      {state?.error && <p className="error" role="alert">{state.error}</p>}
    </form>
  );
}
