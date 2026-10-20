import { createAdminClient } from "@/lib/supabase/admin";
import ConfirmFlow from "./confirm-flow";
import Wordmark from "@/components/Wordmark";
import Stamp from "@/components/Stamp";

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select("job_type, amount, job_date, status, workers(name, trade)")
    .eq("confirm_token", token)
    .single();

  if (!job)
    return (
      <main className="mx-auto w-full max-w-md px-5 pt-6">
        <Wordmark />
        <h1 className="font-display mt-12 text-3xl font-extrabold">This link does not work</h1>
        <p className="mt-2 text-mute">
          Check that you opened the full link from the message, or ask the worker to send it again.
        </p>
      </main>
    );

  const worker = (Array.isArray(job.workers) ? job.workers[0] : job.workers) as
    | { name: string; trade: string }
    | null;
  const workerName = worker?.name ?? "The worker";

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6 pb-12">
      <Wordmark />
      <h1 className="font-display mt-10 text-3xl font-extrabold leading-tight tracking-tight">
        Did {workerName} do this work for you?
      </h1>

      <div className="sheet mt-6 p-5">
        <p className="hint">Job slip</p>
        <div className="ledger mt-2">
          <span className="font-display text-xl font-bold capitalize">{job.job_type}</span>
          <span className="dots" />
          <span className="font-display text-xl font-bold">
            ₹{job.amount.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="hint mt-1">{job.job_date}</p>

        <div className="tear">
          {job.status === "pending" ? (
            <>
              <p className="mb-4 text-mute">
                {workerName} sent you this link to confirm this job. Rate the work and answer
                below. If you do not know {workerName}, just close this page.
              </p>
              <ConfirmFlow token={token} workerName={workerName} />
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-mute">
                This job was already answered ({job.status}).
              </p>
              {job.status === "confirmed" && <Stamp count={1} size={84} />}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
