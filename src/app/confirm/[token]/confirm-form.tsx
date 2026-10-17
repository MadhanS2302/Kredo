"use client";

import { useActionState, useState } from "react";
import { confirmJob, type ConfirmState } from "./actions";

export default function ConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(
    confirmJob.bind(null, token),
    null
  );
  const [rating, setRating] = useState(0);

  if (state?.done === "confirmed")
    return (
      <p className="text-green-500 text-center font-medium">
        Thank you! The job is confirmed.
      </p>
    );
  if (state?.done === "rejected")
    return (
      <p className="text-center text-gray-500">
        Noted. The job was marked as not done.
      </p>
    );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm text-gray-500">
          Enter your mobile number to verify it&apos;s you
        </label>
        <input
          name="phone"
          inputMode="numeric"
          placeholder="10-digit mobile number"
          className="w-full border rounded p-2 bg-transparent mt-1"
          required
        />
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">Rate the work</p>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={n <= rating ? "text-yellow-400" : "text-gray-600"}
              aria-label={`${n} star`}
            >
              ★
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      <div className="flex gap-2">
        <button
          name="decision"
          value="confirm"
          disabled={pending}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded p-2"
        >
          Yes, confirm
        </button>
        <button
          name="decision"
          value="reject"
          disabled={pending}
          className="flex-1 border rounded p-2 disabled:opacity-50"
        >
          No, not done
        </button>
      </div>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
    </form>
  );
}
