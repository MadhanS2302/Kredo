"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidIndianMobile, normalizePhone } from "@/lib/phone";
import { confirmationEmail, sendEmail } from "@/lib/email";
import { getOrigin } from "@/lib/origin";

export type CreateJobState = { error?: string; success?: string } | null;
export type ResendState = { error?: string; ok?: boolean };

const MAX_JOBS_PER_DAY = 10;
const MAX_EMAILS_PER_JOB = 3;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    .select("id, name")
    .eq("id", user.id)
    .single();
  if (!worker) return { error: "Finish setting up your profile first." };

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("customer_phone") ?? "").trim();
  const customerPhone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const jobType = String(formData.get("job_type") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const jobDate = String(formData.get("job_date") ?? "");

  if (customerName.length < 2) return { error: "Enter the customer's name." };
  if (customerEmail.length > 254 || !EMAIL_RE.test(customerEmail))
    return { error: "Enter a valid customer email address." };
  if (customerPhone && !isValidIndianMobile(customerPhone))
    return { error: "The mobile number must be 10 digits, or leave it empty." };
  if (jobType.length < 3) return { error: "Describe the job, for example fan repair." };
  if (!Number.isInteger(amount) || amount < 50 || amount > 100000)
    return { error: "Amount must be a whole number between 50 and 100000." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jobDate)) return { error: "Pick the job date." };
  if (new Date(jobDate) > new Date()) return { error: "The job date cannot be in the future." };

  // Fraud rule 1: you cannot confirm your own job
  if (customerEmail === (user.email ?? "").toLowerCase())
    return { error: "The customer email cannot be your own email." };

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
    .eq("customer_email", customerEmail)
    .gte("created_at", startOfDay.toISOString());
  if ((pairToday ?? 0) >= 3) return { error: "Max 3 jobs per day for the same customer." };

  // Fraud rule 3: no exact duplicates
  const { count: dup } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id)
    .eq("customer_email", customerEmail)
    .eq("job_type", jobType)
    .eq("amount", amount)
    .eq("job_date", jobDate)
    .in("status", ["pending", "confirmed"]);
  if ((dup ?? 0) > 0) return { error: "This exact job is already logged." };

  // Insert on the server. Workers cannot read the confirmation token, so only the
  // customer's inbox ever receives the link.
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      worker_id: user.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      job_type: jobType,
      amount,
      job_date: jobDate,
    })
    .select("confirm_token")
    .single();
  if (error || !job) return { error: "Could not save the job. Please try again." };

  const link = `${await getOrigin()}/confirm/${job.confirm_token}`;
  const mail = await sendEmail({
    to: customerEmail,
    ...confirmationEmail({ workerName: worker.name, jobType, amount, jobDate, link }),
  });

  revalidatePath("/dashboard");
  return mail.ok
    ? { success: `Saved. We emailed ${customerEmail} a link to confirm this job.` }
    : { success: `Saved, but the email failed: ${mail.error} Open the job and tap "Resend email".` };
}

export async function resendEmail(jobId: string): Promise<ResendState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // Reads go through the worker's own session, so they can only touch their own jobs.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, customer_email, job_type, amount, job_date, email_sends, created_at")
    .eq("id", jobId)
    .single();
  const { data: worker } = await supabase.from("workers").select("name").eq("id", user.id).single();

  if (!job || !worker || !job.customer_email) return { error: "Job not found." };
  if (job.status !== "pending") return { error: "This job was already answered." };
  if ((Date.now() - new Date(job.created_at).getTime()) / 86_400_000 > 7)
    return { error: "This job is older than 7 days. Please log it again." };
  if (job.email_sends >= MAX_EMAILS_PER_JOB)
    return { error: "You have already sent this email 3 times." };

  const admin = createAdminClient();
  const { data: secret } = await admin
    .from("jobs")
    .select("confirm_token")
    .eq("id", job.id)
    .single();
  if (!secret) return { error: "Job not found." };

  const link = `${await getOrigin()}/confirm/${secret.confirm_token}`;
  const mail = await sendEmail({
    to: job.customer_email,
    ...confirmationEmail({
      workerName: worker.name,
      jobType: job.job_type,
      amount: job.amount,
      jobDate: job.job_date,
      link,
    }),
  });
  if (!mail.ok) return { error: mail.error };

  await admin.from("jobs").update({ email_sends: job.email_sends + 1 }).eq("id", job.id);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
