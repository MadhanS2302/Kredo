"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidIndianMobile, normalizePhone } from "@/lib/phone";
import { getOrigin } from "@/lib/origin";
import { shareMessage, type ShareInfo } from "@/lib/share";

export type CreateJobState = { error?: string; created?: ShareInfo } | null;
export type JobLinkResult = { error?: string; share?: ShareInfo };

const MAX_JOBS_PER_DAY = 10;
const LINK_VALID_DAYS = 7;

export async function createJob(
  _prev: CreateJobState,
  formData: FormData
): Promise<CreateJobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: worker } = await supabase
    .from("workers")
    .select("id, name, phone")
    .eq("id", user.id)
    .single();
  if (!worker) return { error: "Finish setting up your profile first." };

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = normalizePhone(String(formData.get("customer_phone") ?? ""));
  const jobType = String(formData.get("job_type") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const jobDate = String(formData.get("job_date") ?? "");

  if (customerName.length < 2) return { error: "Enter the customer's name." };
  if (!isValidIndianMobile(customerPhone))
    return { error: "Enter the customer's 10-digit mobile number." };
  if (jobType.length < 3) return { error: "Describe the job, for example fan repair." };
  if (!Number.isInteger(amount) || amount < 50 || amount > 100000)
    return { error: "Amount must be a whole number between 50 and 100000." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jobDate)) return { error: "Pick the job date." };
  if (new Date(jobDate) > new Date()) return { error: "The job date cannot be in the future." };

  // Fraud rule 1: you cannot confirm your own job
  if (worker.phone && normalizePhone(worker.phone) === customerPhone)
    return { error: "The customer number cannot be your own number." };

  // Fraud rule 2: daily limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id)
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= MAX_JOBS_PER_DAY)
    return { error: `You can log up to ${MAX_JOBS_PER_DAY} jobs a day.` };

  // Fraud rule 2b: same customer at most 3 jobs per day
  const { count: pairToday } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id)
    .eq("customer_phone", customerPhone)
    .gte("created_at", startOfDay.toISOString());
  if ((pairToday ?? 0) >= 3) return { error: "Max 3 jobs per day for the same customer." };

  // Fraud rule 3: no exact duplicates
  const { count: dup } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id)
    .eq("customer_phone", customerPhone)
    .eq("job_type", jobType)
    .eq("amount", amount)
    .eq("job_date", jobDate)
    .in("status", ["pending", "confirmed"]);
  if ((dup ?? 0) > 0) return { error: "This exact job is already logged." };

  // Insert on the server (workers have no direct insert permission on jobs).
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      worker_id: user.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      job_type: jobType,
      amount,
      job_date: jobDate,
    })
    .select("confirm_token")
    .single();
  if (error || !job) return { error: "Could not save the job. Please try again." };

  const link = `${await getOrigin()}/confirm/${job.confirm_token}`;
  revalidatePath("/dashboard");
  return {
    created: {
      link,
      phone: customerPhone,
      message: shareMessage({
        customerName,
        workerName: worker.name,
        jobType,
        amount,
        link,
      }),
    },
  };
}

// Returns the rating link of one of the worker's own pending jobs, so it can be copied or
// shared on WhatsApp. The token is read with the server key; the session client first proves
// the job belongs to this worker.
export async function getJobLink(jobId: string): Promise<JobLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, customer_name, customer_phone, job_type, amount, created_at")
    .eq("id", jobId)
    .single();
  const { data: worker } = await supabase.from("workers").select("name").eq("id", user.id).single();

  if (!job || !worker) return { error: "Job not found." };
  if (job.status !== "pending") return { error: "This job was already answered." };
  if ((Date.now() - new Date(job.created_at).getTime()) / 86_400_000 > LINK_VALID_DAYS)
    return { error: "This link has expired. Please log the job again." };

  const admin = createAdminClient();
  const { data: secret } = await admin
    .from("jobs")
    .select("confirm_token")
    .eq("id", job.id)
    .single();
  if (!secret) return { error: "Job not found." };

  const link = `${await getOrigin()}/confirm/${secret.confirm_token}`;
  return {
    share: {
      link,
      phone: job.customer_phone,
      message: shareMessage({
        customerName: job.customer_name,
        workerName: worker.name,
        jobType: job.job_type,
        amount: job.amount,
        link,
      }),
    },
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
