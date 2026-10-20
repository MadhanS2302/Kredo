// Helpers for sharing the customer's rating link. Safe to import from client components.

export type ShareInfo = {
  link: string;
  message: string;
  /** 10-digit customer mobile, or null for older jobs that have none. */
  phone: string | null;
};

export function shareMessage(a: {
  customerName: string;
  workerName: string;
  jobType: string;
  amount: number;
  link: string;
}): string {
  return (
    `Hello ${a.customerName}, this is ${a.workerName}. Please confirm the ${a.jobType} work ` +
    `(₹${a.amount.toLocaleString("en-IN")}) I did for you and rate it here: ${a.link}`
  );
}

// Opens the WhatsApp chat with the customer (number filled in) and the message ready to send.
// If an old job has no mobile number, WhatsApp opens its contact picker instead.
export function whatsappUrl(phone: string | null | undefined, text: string): string {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  const to = digits.length === 10 ? `phone=91${digits}&` : "";
  return `https://api.whatsapp.com/send?${to}text=${encodeURIComponent(text)}`;
}
