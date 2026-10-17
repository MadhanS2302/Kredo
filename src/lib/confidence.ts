export type Confidence = "high" | "medium" | "low";

export interface ConfidenceInput {
  job: {
    amount: number;
    createdAt: string;
    confirmedAt: string;
    customerPhone: string;
    workerId: string;
  };
  /** This worker's other confirmed jobs in the last 30 days (excluding this job). */
  workerRecent: { amount: number; customer_phone: string }[];
  /** Confirmed jobs by this same customer phone with any worker (excluding this job). */
  customerHistory: { worker_id: string }[];
}

export interface ConfidenceResult {
  confidence: Confidence;
  flags: string[];
  score: number;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Rule-based confidence for a customer-confirmed job.
 * Starts at 60 (medium). Suspicious patterns subtract, independent corroboration adds.
 * high >= 70, medium >= 45, low < 45.
 */
export function scoreJob(i: ConfidenceInput): ConfidenceResult {
  let score = 60;
  const flags: string[] = [];

  const seconds =
    (new Date(i.job.confirmedAt).getTime() - new Date(i.job.createdAt).getTime()) / 1000;
  if (seconds < 120) {
    flags.push("fast_confirm");
    score -= 25;
  }

  const pairCount = i.workerRecent.filter(
    (j) => j.customer_phone === i.job.customerPhone
  ).length;
  if (pairCount >= 5) {
    flags.push("repeat_pair_burst");
    score -= 20;
  } else if (pairCount >= 1) {
    score += 10; // a genuine repeat customer is a good sign
  }

  const sameAmount = i.workerRecent.filter((j) => j.amount === i.job.amount).length;
  if (sameAmount >= 3) {
    flags.push("same_amount_repeat");
    score -= 10;
  }

  if (i.workerRecent.length >= 5) {
    const med = median(i.workerRecent.map((j) => j.amount));
    if (med > 0 && i.job.amount > med * 5) {
      flags.push("amount_outlier");
      score -= 15;
    }
  }

  const otherWorkers = new Set(
    i.customerHistory.map((j) => j.worker_id).filter((id) => id !== i.job.workerId)
  ).size;
  if (otherWorkers >= 2) score += 20;
  else if (otherWorkers >= 1) score += 10;

  score = Math.max(0, Math.min(100, score));
  const confidence: Confidence = score >= 70 ? "high" : score >= 45 ? "medium" : "low";
  return { confidence, flags, score };
}
