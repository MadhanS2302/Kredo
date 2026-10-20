"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import Stamp from "@/components/Stamp";
import LogoutButton from "./logout-button";
import LogJobForm from "./log-job-form";
import JobList, { type JobRow } from "./job-list";

type Tab = "jobs" | "log" | "statements";

export type MonthRow = { value: string; label: string; count: number; total: number };

type Props = {
  worker: { name: string; trade: string; area: string | null; public_slug: string };
  jobs: JobRow[];
  months: MonthRow[];
  confirmedCount: number;
  income: number;
};

const icon = {
  jobs: "M5 4h14v16H5zM9 9h6M9 13h6",
  log: "M12 5v14M5 12h14",
  statements: "M7 3h8l4 4v14H7zM15 3v4h4M10 13h6M10 17h6",
};

function Icon({ path }: { path: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function DashboardClient({ worker, jobs, months, confirmedCount, income }: Props) {
  const [tab, setTab] = useState<Tab>("jobs");
  const [copied, setCopied] = useState(false);

  async function copyProfile() {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${worker.public_slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <Wordmark href="/dashboard" />
        <LogoutButton />
      </header>

      {tab === "jobs" && (
      <section className="sheet mt-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="hint">Vanakkam</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
              {worker.name}
            </h1>
            <p className="text-mute capitalize">
              {worker.trade}, {worker.area}
            </p>
          </div>
          {confirmedCount > 0 && <Stamp count={confirmedCount} size={88} />}
        </div>
        <div className="tear">
          <div className="ledger">
            <span className="text-mute">Verified income</span>
            <span className="dots" />
            <span className="font-display text-xl font-bold">₹{income.toLocaleString("en-IN")}</span>
          </div>
          <div className="ledger mt-1">
            <span className="text-mute">Confirmed jobs</span>
            <span className="dots" />
            <span className="font-display text-xl font-bold">{confirmedCount}</span>
          </div>
        </div>
      </section>
      )}

      <div className="mt-6">
        {tab === "jobs" && (
          <section aria-labelledby="jobs-h" className="space-y-3">
            <h2 id="jobs-h" className="font-display text-xl font-bold">Your jobs</h2>
            <JobList jobs={jobs} workerName={worker.name} onLogJob={() => setTab("log")} />
          </section>
        )}

        {tab === "log" && (
          <section aria-labelledby="log-h" className="space-y-4">
            <h2 id="log-h" className="font-display text-xl font-bold">Log a job</h2>
            <div className="sheet p-5">
              <LogJobForm onSaved={() => setTab("jobs")} />
            </div>
          </section>
        )}

        {tab === "statements" && (
          <section aria-labelledby="st-h" className="space-y-4">
            <h2 id="st-h" className="font-display text-xl font-bold">Share your proof</h2>

            <div className="sheet space-y-3 p-5">
              <p className="font-semibold">Your public profile</p>
              <p className="hint">
                Anyone with the link or QR code can see your verified jobs. They never see customer names or numbers.
              </p>
              <div className="flex gap-2">
                <Link href={`/w/${worker.public_slug}`} className="btn btn-small">Open profile</Link>
                <button onClick={copyProfile} className="btn btn-quiet btn-small">
                  {copied ? "Link copied" : "Copy link"}
                </button>
              </div>
            </div>

            <div className="sheet p-5">
              <p className="font-semibold">Monthly income statements</p>
              <p className="hint">A PDF with a QR code that anyone can scan to check it is genuine.</p>
              {months.length === 0 ? (
                <p className="mt-3 text-mute">
                  Statements appear here once a customer confirms a job.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {months.map((m) => (
                    <li key={m.value} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold">{m.label}</p>
                        <p className="hint">
                          {m.count} {m.count === 1 ? "job" : "jobs"} · ₹{m.total.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <a href={`/api/statement?month=${m.value}`} className="btn btn-quiet btn-small">
                        Download PDF
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-sheet"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {(
            [
              ["jobs", "Jobs"],
              ["log", "Log a job"],
              ["statements", "Share proof"],
            ] as [Tab, string][]
          ).map(([key, label]) => {
            const active = tab === key;
            const isLog = key === "log";
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold"
                style={{ color: active ? "var(--stamp)" : "var(--mute)" }}
              >
                {active && (
                  <span aria-hidden="true" className="absolute inset-x-6 top-0 h-1 rounded-b bg-tape" />
                )}
                {isLog ? (
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-tape text-ink">
                    <Icon path={icon.log} />
                  </span>
                ) : (
                  <Icon path={icon[key]} />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
