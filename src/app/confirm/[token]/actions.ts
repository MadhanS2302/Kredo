"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export type ConfirmState = { error?: string; done?: "confirmed" | "rejected" } | null;

const EXPIRY_DAYS = 7;

export async function confirmJob(
  token: string,
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  const decision = String(formData.get("decision") ?? "");
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const rating = Number(formData.get("rating") ?? 0);

  if (decision !== "confirm" && decision !== "reject")
    return { error: "Choose Confirm or Reject." };

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id, status, customer_phone, created_at")
    .eq("confirm_token", token)
    .single();

  if (!job) return { error: "This link is not valid." };
  if (job.status !== "pending") return { error: "This job was already answered." };

  const ageDays = (Date.now() - new Date(job.created_at).getTime()) / 86_400_000;
  if (ageDays > EXPIRY_DAYS) {
    await admin.from("jobs").update({ status: "expired" }).eq("id", job.id);
    return { error: "This link has expired. Ask the worker to log the job again." };
  }

  // MVP identity check: customer must type the phone number the worker entered.
  // (Replace with a real SMS/WhatsApp OTP before the pilot.)
  if (phone !== job.customer_phone)
    return { error: "That number doesn't match the one on this job." };

  if (decision === "confirm" && !(rating >= 1 && rating <= 5))
    return { error: "Please give a rating from 1 to 5 stars." };

  const update =
    decision === "confirm"
      ? { status: "confirmed", rating, confirmed_at: new Date().toISOString() }
      : { status: "rejected" };

  const { error } = await admin
    .from("jobs")
    .update(update)
    .eq("id", job.id)
    .eq("status", "pending");
  if (error) return { error: "Could not save. Please try again." };

  return { done: decision === "confirm" ? "confirmed" : "rejected" };
}
