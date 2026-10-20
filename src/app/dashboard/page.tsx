import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient, { type MonthRow } from "./dashboard-client";
import type { JobRow } from "./job-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrigin } from "@/lib/origin";
import { shareMessage } from "@/lib/share";

const LINK_VALID_MS = 7 * 86_400_000;
const linkStillValid = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() <= LINK_VALID_MS;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: worker } = await supabase
    .from("workers")
    .select("name, trade, area, public_slug")
    .eq("id", user.id)
    .single();
  if (!worker) redirect("/onboarding");

  const [{ data: jobs }, { data: confirmedRows }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, customer_name, customer_phone, job_type, amount, job_date, status, rating, confidence, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("jobs").select("amount, job_date").eq("status", "confirmed"),
  ]);

  // Build the rating link for each pending job here on the server, so the WhatsApp button
  // is a plain link that is ready before the worker taps it.
  const pendingIds = (jobs ?? [])
    .filter((j) => j.status === "pending" && linkStillValid(j.created_at))
    .map((j) => j.id);
  const tokens = new Map<string, string>();
  if (pendingIds.length > 0) {
    const { data: secrets } = await createAdminClient()
      .from("jobs")
      .select("id, confirm_token")
      .eq("worker_id", user.id)
      .in("id", pendingIds);
    (secrets ?? []).forEach((r) => tokens.set(r.id, r.confirm_token));
  }
  const origin = await getOrigin();
  const jobRows: JobRow[] = (jobs ?? []).map((j) => {
    const token = tokens.get(j.id);
    const link = token ? `${origin}/confirm/${token}` : null;
    return {
      id: j.id,
      customer_name: j.customer_name,
      customer_phone: j.customer_phone,
      job_type: j.job_type,
      amount: j.amount,
      job_date: j.job_date,
      status: j.status,
      rating: j.rating,
      confidence: j.confidence,
      share: link
        ? {
            link,
            phone: j.customer_phone,
            message: shareMessage({
              customerName: j.customer_name,
              workerName: worker.name,
              jobType: j.job_type,
              amount: j.amount,
              link,
            }),
          }
        : null,
    };
  });

  const confirmed = confirmedRows ?? [];
  const income = confirmed.reduce((s, j) => s + j.amount, 0);

  const byMonth = new Map<string, { count: number; total: number }>();
  for (const j of confirmed) {
    const key = j.job_date.slice(0, 7);
    const cur = byMonth.get(key) ?? { count: 0, total: 0 };
    byMonth.set(key, { count: cur.count + 1, total: cur.total + j.amount });
  }
  const months: MonthRow[] = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([value, v]) => ({
      value,
      label: new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      ...v,
    }));

  return (
    <DashboardClient
      worker={worker}
      jobs={jobRows}
      months={months}
      confirmedCount={confirmed.length}
      income={income}
    />
  );
}
