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

function digitsOf(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

// Phones: opens the WhatsApp app directly in the customer's chat, message ready to send.
// If an old job has no mobile number, WhatsApp opens its contact picker instead.
export function whatsappAppUrl(phone: string | null | undefined, text: string): string {
  const d = digitsOf(phone);
  return `whatsapp://send?${d.length === 10 ? `phone=91${d}&` : ""}text=${encodeURIComponent(text)}`;
}

// Computers: WhatsApp Web in a new tab.
export function whatsappWebUrl(phone: string | null | undefined, text: string): string {
  const d = digitsOf(phone);
  return `https://api.whatsapp.com/send?${d.length === 10 ? `phone=91${d}&` : ""}text=${encodeURIComponent(text)}`;
}
