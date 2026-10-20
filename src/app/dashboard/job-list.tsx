"use client";

import ConfidenceDots from "@/components/ConfidenceDots";
import ShareButtons from "./share-buttons";
import type { ShareInfo } from "@/lib/share";

export type JobRow = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  job_type: string;
  amount: number;
  job_date: string;
  status: "pending" | "confirmed" | "rejected" | "expired";
  rating: number | null;
  confidence: "high" | "medium" | "low" | null;
  /** Rating link + WhatsApp message. Only for pending jobs whose link is still valid. */
  share: ShareInfo | null;
};

const statusStyle: Record<JobRow["status"], { text: string; label: string }> = {
  pending: { text: "text-warn", label: "Waiting for customer" },
  confirmed: { text: "text-ok", label: "Confirmed" },
  rejected: { text: "text-bad", label: "Customer said no" },
  expired: { text: "text-mute", label: "Link expired" },
};

export default function JobList({
  jobs,
  onLogJob,
}: {
  jobs: JobRow[];
  workerName?: string;
  onLogJob: () => void;
}) {
  if (jobs.length === 0)
    return (
      <div className="sheet p-6 text-center">
        <p className="font-display text-xl font-bold">No jobs yet</p>
        <p className="mt-1 text-mute">
          After your next visit, log the job here. You send the customer a rating link on WhatsApp.
        </p>
        <div className="mx-auto mt-4 max-w-xs">
          <button onClick={onLogJob} className="btn">Log your first job</button>
        </div>
      </div>
    );

  return (
    <ul className="sheet divide-y divide-line">
      {jobs.map((job) => {
        const s = statusStyle[job.status];
        return (
          <li key={job.id} className="space-y-2 p-4">
            <div className="ledger">
              <span className="font-display text-lg font-bold capitalize">{job.job_type}</span>
              <span className="dots" />
              <span className="font-display text-lg font-bold">
                ₹{job.amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-mute">
                {job.customer_name} · {job.job_date}
              </span>
              <span className={`flex shrink-0 items-center gap-2 font-semibold ${s.text}`}>
                {job.status === "confirmed" && <ConfidenceDots level={job.confidence} />}
                {s.label}
                {job.rating ? ` · ${job.rating}★` : ""}
              </span>
            </div>
            {job.status === "pending" && (
              <div className="pt-1">
                {job.share ? (
                  <ShareButtons info={job.share} />
                ) : (
                  <p className="hint">This link has expired. Log the job again.</p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
