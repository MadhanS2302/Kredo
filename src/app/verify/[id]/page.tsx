import { createAdminClient } from "@/lib/supabase/admin";
import Wordmark from "@/components/Wordmark";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFound = (
    <main className="mx-auto w-full max-w-md px-5 pt-6">
      <Wordmark />
      <h1 className="font-display mt-12 text-3xl font-extrabold text-bad">Not verified</h1>
      <p className="mt-2 text-mute">
        Kredo has no statement with this ID. Treat the document you were given as unverified.
      </p>
    </main>
  );
  if (!UUID.test(id)) return notFound;

  const admin = createAdminClient();
  const { data: s } = await admin
    .from("statements")
    .select(
      "id, month, job_count, total_income, avg_rating, high_conf_pct, snapshot_hash, issued_at, workers(name, trade, area)"
    )
    .eq("id", id)
    .single();
  if (!s) return notFound;

  const w = (Array.isArray(s.workers) ? s.workers[0] : s.workers) as
    | { name: string; trade: string; area: string | null }
    | null;

  const rows: [string, string][] = [
    ["Worker", w?.name ?? "-"],
    ["Trade and area", `${w?.trade ?? "-"}, ${w?.area ?? "-"}`],
    ["Month", s.month],
    ["Verified jobs", String(s.job_count)],
    ["Verified income", `₹${s.total_income.toLocaleString("en-IN")}`],
    ["Average rating", s.avg_rating ? `${s.avg_rating} out of 5` : "-"],
    ["High-confidence jobs", `${s.high_conf_pct}%`],
    ["Issued on", new Date(s.issued_at).toLocaleDateString("en-IN")],
    ["Fingerprint", s.snapshot_hash.slice(0, 16)],
  ];

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-14 pt-5">
      <Wordmark />
      <h1 className="font-display mt-8 text-3xl font-extrabold tracking-tight text-ok">
        This statement is genuine
      </h1>
      <p className="mt-1 text-mute">
        Kredo issued it. Compare these figures with the document you were given.
      </p>
      <div className="sheet mt-5 space-y-2 p-5">
        {rows.map(([k, v]) => (
          <div key={k} className="ledger">
            <span className="text-mute">{k}</span>
            <span className="dots" />
            <span className="font-semibold text-right break-all">{v}</span>
          </div>
        ))}
      </div>
      <p className="hint mt-4">
        Every job was confirmed by the customer. This is not an audited income record.
      </p>
    </main>
  );
}
