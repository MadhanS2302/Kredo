import { createAdminClient } from "@/lib/supabase/admin";
import ConfirmForm from "./confirm-form";

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
      <main className="mx-auto max-w-sm p-6">
        <h1 className="text-xl font-bold">Link not valid</h1>
        <p className="text-gray-500 mt-2">Please check the link you received.</p>
      </main>
    );

  const worker = (Array.isArray(job.workers) ? job.workers[0] : job.workers) as
    | { name: string; trade: string }
    | null;

  return (
    <main className="mx-auto max-w-sm p-6 space-y-5">
      <h1 className="text-2xl font-bold">Kredo</h1>
      <div className="border rounded p-4 space-y-1">
        <p className="text-sm text-gray-500">{worker?.name} says they did this job for you:</p>
        <p className="text-lg font-semibold capitalize">{job.job_type}</p>
        <p>₹{job.amount.toLocaleString("en-IN")} · {job.job_date}</p>
      </div>

      {job.status === "pending" ? (
        <ConfirmForm token={token} />
      ) : (
        <p className="text-gray-500 text-center">
          This job was already answered ({job.status}).
        </p>
      )}
    </main>
  );
}
