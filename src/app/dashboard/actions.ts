"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidIndianMobile, normalizePhone } from "@/lib/phone";

export type CreateJobState = { error?: string; success?: string } | null;

const MAX_JOBS_PER_DAY = 10;

export async function createJob(
  _prev: CreateJobState,
  formData: FormData
): Promise<CreateJobState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { data: worker } = await supabase
    .from("workers")
    .select("id, phone")
    .eq("id", user.id)
    .single();
  if (!worker) return { error: "Finish onboarding first." };

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = normalizePhone(String(formData.get("customer_phone") ?? ""));
  const jobType = String(formData.get("job_type") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const jobDate = String(formData.get("job_date") ?? "");

  // Basic validation
  if (customerName.length < 2) return { error: "Enter the customer's name." };
  if (!isValidIndianMobile(customerPhone))
    return { error: "Enter a valid 10-digit customer mobile number." };
  if (jobType.length < 3) return { error: "Describe the job (e.g. Fan repair)." };
  if (!Number.isInteger(amount) || amount < 50 || amount > 100000)
    return { error: "Amount must be a whole number between 50 and 100000." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jobDate)) return { error: "Pick the job date." };
  if (new Date(jobDate) > new Date()) return { error: "Job date can't be in the future." };

  // Fraud rule 1: can't confirm your own job
  if (customerPhone === normalizePhone(worker.phone))
    return { error: "Customer number can't be your own number." };

  // Fraud rule 2: daily limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("worker_id", user.id)
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= MAX_JOBS_PER_DAY)
    return { error: `Daily limit of ${MAX_JOBS_PER_DAY} jobs reached.` };

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

  const { error } = await supabase.from("jobs").insert({
    worker_id: user.id,
    customer_name: customerName,
    customer_phone: customerPhone,
    job_type: jobType,
    amount,
    job_date: jobDate,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Job logged. Send the confirmation link to your customer below." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
