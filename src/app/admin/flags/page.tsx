import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function FlagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Admins = emails listed in ADMIN_EMAILS (comma separated) in your environment.
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.includes((user.email ?? "").toLowerCase())) notFound();

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
    <main className="mx-auto w-full max-w-2xl px-5 py-8 space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Flag review</h1>
      <p className="hint">
        Confirmed jobs scored low or carrying a flag (latest 300 checked): {flagged.length}
      </p>
      {flagged.length === 0 && <p className="text-mute">Nothing flagged. 🎉</p>}
      <ul className="space-y-2">
        {flagged.map((j) => {
          const w = (Array.isArray(j.workers) ? j.workers[0] : j.workers) as
            | { name: string; area: string | null }
            | null;
          return (
            <li key={j.id} className="sheet p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">
                  {w?.name} · {j.job_type}
                </span>
                <span>₹{j.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-mute">
                {j.job_date} · confidence: {j.confidence ?? "-"}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(j.flags ?? []).map((f: string) => (
                  <span key={f} className="text-xs px-2 py-0.5 rounded bg-bad/10 text-bad">
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
