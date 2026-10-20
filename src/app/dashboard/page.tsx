import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient, { type MonthRow } from "./dashboard-client";
import type { JobRow } from "./job-list";

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
        "id, customer_name, customer_phone, job_type, amount, job_date, status, rating, confidence"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("jobs").select("amount, job_date").eq("status", "confirmed"),
  ]);

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
      jobs={(jobs ?? []) as JobRow[]}
      months={months}
      confirmedCount={confirmed.length}
      income={income}
    />
  );
}
