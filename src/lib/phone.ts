// Reduce any phone format (+91 98765 43210, 919876543210, 9876543210) to the last 10 digits.
export function normalizePhone(input: string | null | undefined): string {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

// Valid Indian mobile numbers are 10 digits starting with 6-9.
export function isValidIndianMobile(tenDigits: string): boolean {
  return /^[6-9]\d{9}$/.test(tenDigits);
}
