import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStatementPdf } from "@/lib/statement-pdf";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return new Response("Invalid month. Use YYYY-MM.", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Please log in.", { status: 401 });

  const { data: worker } = await supabase
    .from("workers")
    .select("id, name, trade, area")
    .eq("id", user.id)
    .single();
  if (!worker) return new Response("Finish onboarding first.", { status: 400 });

  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_date, job_type, amount, rating, confidence")
    .eq("status", "confirmed")
    .gte("job_date", start)
    .lt("job_date", next)
    .order("job_date", { ascending: true });

  const list = jobs ?? [];
  if (list.length === 0)
    return new Response("No confirmed jobs in that month.", { status: 404 });

  const totalIncome = list.reduce((s, j) => s + j.amount, 0);
  const rated = list.filter((j) => j.rating);
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, j) => s + (j.rating ?? 0), 0) / rated.length) * 100) / 100
    : null;
  const highConfPct = Math.round(
    (list.filter((j) => j.confidence === "high").length / list.length) * 100
  );

  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        worker: worker.id,
        month,
        jobs: list.map((j) => [j.id, j.amount, j.job_date]),
        totalIncome,
      })
    )
    .digest("hex");

  const admin = createAdminClient();
  const { data: stmt, error } = await admin
    .from("statements")
    .insert({
      worker_id: worker.id,
      month,
      job_count: list.length,
      total_income: totalIncome,
      avg_rating: avgRating,
      high_conf_pct: highConfPct,
      snapshot_hash: hash,
    })
    .select("id, issued_at")
    .single();
  if (error || !stmt) return new Response("Could not issue statement.", { status: 500 });

  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const pdf = await buildStatementPdf({
    id: stmt.id,
    workerName: worker.name,
    trade: worker.trade,
    area: worker.area ?? "-",
    monthLabel,
    issuedAt: new Date(stmt.issued_at),
    verifyUrl: `${req.nextUrl.origin}/verify/${stmt.id}`,
    jobs: list,
    totalIncome,
    avgRating,
    highConfPct,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kredo-statement-${month}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
