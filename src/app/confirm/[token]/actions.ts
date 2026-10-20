"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreJob } from "@/lib/confidence";

const EXPIRY_DAYS = 7;

export type ConfirmState = { error?: string; done?: "confirmed" | "rejected" } | null;

export async function confirmJob(
  token: string,
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  const decision = String(formData.get("decision") ?? "");
  const rating = Number(formData.get("rating") ?? 0);

  if (decision !== "confirm" && decision !== "reject") return { error: "Choose Yes or No." };

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id, status, customer_email, customer_phone, created_at, worker_id, amount")
    .eq("confirm_token", token)
    .single();

  if (!job) return { error: "This link is not valid." };
  if (job.status !== "pending") return { error: "This job was already answered." };

  const ageDays = (Date.now() - new Date(job.created_at).getTime()) / 86_400_000;
  if (ageDays > EXPIRY_DAYS) {
    await admin.from("jobs").update({ status: "expired" }).eq("id", job.id);
    return { error: "This link has expired. Ask the worker to log the job again." };
  }

  if (decision === "confirm" && !(rating >= 1 && rating <= 5))
    return { error: "Tap the stars to rate the work from 1 to 5." };

  let update: Record<string, unknown>;
  if (decision === "confirm") {
    const confirmedAt = new Date().toISOString();
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const customerKey = (job.customer_email ?? job.customer_phone ?? "").toLowerCase();

    const historyQuery = admin
      .from("jobs")
      .select("worker_id")
      .eq("status", "confirmed")
      .neq("id", job.id);

    const [{ data: workerRecent }, { data: customerHistory }] = await Promise.all([
      admin
        .from("jobs")
        .select("amount, customer_email, customer_phone")
        .eq("worker_id", job.worker_id)
        .eq("status", "confirmed")
        .gte("confirmed_at", since)
        .neq("id", job.id),
      job.customer_email
        ? historyQuery.eq("customer_email", job.customer_email)
        : historyQuery.eq("customer_phone", job.customer_phone ?? ""),
    ]);

    const result = scoreJob({
      job: {
        amount: job.amount,
        createdAt: job.created_at,
        confirmedAt,
        customerKey,
        workerId: job.worker_id,
      },
      workerRecent: (workerRecent ?? []).map((j) => ({
        amount: j.amount,
        customerKey: (j.customer_email ?? j.customer_phone ?? "").toLowerCase(),
      })),
      customerHistory: customerHistory ?? [],
    });

    update = {
      status: "confirmed",
      rating,
      confirmed_at: confirmedAt,
      confidence: result.confidence,
      flags: result.flags,
    };
  } else {
    update = { status: "rejected" };
  }

  const { error } = await admin
    .from("jobs")
    .update(update)
    .eq("id", job.id)
    .eq("status", "pending");
  if (error) return { error: "Could not save. Please try again." };

  return { done: decision === "confirm" ? "confirmed" : "rejected" };
}
