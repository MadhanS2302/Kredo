"use client";

import { useState } from "react";

export type JobRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  job_type: string;
  amount: number;
  job_date: string;
  status: "pending" | "confirmed" | "rejected" | "expired";
  confirm_token: string;
  rating: number | null;
};

const badge: Record<JobRow["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  confirmed: "bg-green-500/20 text-green-500",
  rejected: "bg-red-500/20 text-red-500",
  expired: "bg-gray-500/20 text-gray-400",
};

export default function JobList({
  jobs,
  workerName,
}: {
  jobs: JobRow[];
  workerName: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function linkFor(job: JobRow) {
    return `${window.location.origin}/confirm/${job.confirm_token}`;
  }

  function whatsapp(job: JobRow) {
    const text =
      `Hello ${job.customer_name}, this is ${workerName}. ` +
      `Please confirm the ${job.job_type} work (₹${job.amount}) I did for you: ${linkFor(job)}`;
    window.open(
      `https://wa.me/91${job.customer_phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  async function copy(job: JobRow) {
    await navigator.clipboard.writeText(linkFor(job));
    setCopied(job.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (jobs.length === 0)
    return <p className="text-gray-500 text-sm">No jobs yet. Log your first job above.</p>;

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li key={job.id} className="border rounded p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{job.job_type}</p>
              <p className="text-sm text-gray-500">
                {job.customer_name} · {job.job_date}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{job.amount.toLocaleString("en-IN")}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${badge[job.status]}`}>
                {job.status}
                {job.rating ? ` · ${job.rating}★` : ""}
              </span>
            </div>
          </div>
          {job.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => whatsapp(job)}
                className="text-sm border rounded px-3 py-1 hover:bg-green-600/20"
              >
                Send on WhatsApp
              </button>
              <button
                onClick={() => copy(job)}
                className="text-sm border rounded px-3 py-1 hover:bg-white/10"
              >
                {copied === job.id ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
