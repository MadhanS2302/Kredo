const LEVELS = {
  high: { filled: 3, color: "var(--ok)", label: "High confidence" },
  medium: { filled: 2, color: "var(--warn)", label: "Medium confidence" },
  low: { filled: 1, color: "var(--bad)", label: "Low confidence" },
} as const;

export default function ConfidenceDots({
  level,
}: {
  level: "high" | "medium" | "low" | null;
}) {
  if (!level) return null;
  const l = LEVELS[level];
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={l.label} title={l.label}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{
            background: n <= l.filled ? l.color : "transparent",
            border: `1.5px solid ${l.color}`,
          }}
        />
      ))}
    </span>
  );
}
