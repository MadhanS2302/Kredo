import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFound = (
    <main className="mx-auto max-w-sm p-6 space-y-2">
      <h1 className="text-2xl font-bold text-red-500">Not verified</h1>
      <p className="text-gray-500">
        No Kredo statement with this ID exists. Treat the document as unverified.
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
    ["Worker", `${w?.name ?? "-"} (${w?.trade ?? "-"}, ${w?.area ?? "-"})`],
    ["Period", s.month],
    ["Verified jobs", String(s.job_count)],
    ["Verified income", `₹${s.total_income.toLocaleString("en-IN")}`],
    ["Avg rating", s.avg_rating ? `${s.avg_rating} / 5` : "-"],
    ["High-confidence jobs", `${s.high_conf_pct}%`],
    ["Issued", new Date(s.issued_at).toLocaleString("en-IN")],
    ["Fingerprint", s.snapshot_hash.slice(0, 16)],
  ];

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <div>
        <p className="text-sm text-green-500 font-medium">Kredo</p>
        <h1 className="text-2xl font-bold text-green-500">Statement is genuine</h1>
        <p className="text-sm text-gray-500">
          Issued by Kredo. Compare these figures with the document you were given.
        </p>
      </div>
      <dl className="border rounded divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 p-2 text-sm">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-right font-medium break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500">
        Every job was confirmed by the customer. This is not an audited income record.
      </p>
    </main>
  );
}
