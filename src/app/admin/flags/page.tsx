import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export default async function FlagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Admins = 10-digit numbers listed in ADMIN_PHONES (comma separated) in your environment.
  const admins = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => normalizePhone(p))
    .filter(Boolean);
  if (!admins.includes(normalizePhone(user.phone))) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("jobs")
    .select(
      "id, job_type, amount, job_date, confidence, flags, rating, confirmed_at, workers(name, area)"
    )
    .eq("status", "confirmed")
    .order("confirmed_at", { ascending: false })
    .limit(300);

  const flagged = (data ?? []).filter(
    (j) => j.confidence === "low" || (j.flags ?? []).length > 0
  );

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Flag review</h1>
      <p className="text-sm text-gray-500">
        Confirmed jobs scored low or carrying a flag (latest 300 checked): {flagged.length}
      </p>
      {flagged.length === 0 && <p className="text-gray-500">Nothing flagged. 🎉</p>}
      <ul className="space-y-2">
        {flagged.map((j) => {
          const w = (Array.isArray(j.workers) ? j.workers[0] : j.workers) as
            | { name: string; area: string | null }
            | null;
          return (
            <li key={j.id} className="border rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">
                  {w?.name} · {j.job_type}
                </span>
                <span>₹{j.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-gray-500">
                {j.job_date} · confidence: {j.confidence ?? "-"}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(j.flags ?? []).map((f: string) => (
                  <span key={f} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                    {f}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
