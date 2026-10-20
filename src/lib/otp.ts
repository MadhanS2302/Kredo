// Customer OTP for job confirmation. Pick a provider with OTP_PROVIDER in your environment:
//   dev     fixed code 123456, no SMS (testing only, NOT secure)
//   twilio  Twilio Verify (needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)
// To add another provider (e.g. MSG91), implement the same two functions below.

export type OtpResult = { ok: true } | { ok: false; error: string };

const provider = () => (process.env.OTP_PROVIDER ?? "dev").toLowerCase();

let warned = false;

export async function sendOtp(phone10: string): Promise<OtpResult> {
  if (provider() === "twilio") return twilioSend(phone10);
  if (!warned && process.env.NODE_ENV === "production") {
    warned = true;
    console.warn("OTP_PROVIDER is 'dev': codes are not sent and 123456 is accepted. Not secure.");
  }
  return { ok: true };
}

export async function checkOtp(phone10: string, code: string): Promise<OtpResult> {
  if (provider() === "twilio") return twilioCheck(phone10, code);
  return code === "123456" ? { ok: true } : { ok: false, error: "That code is not correct." };
}

// ---------- Twilio Verify ----------
function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) return null;
  return {
    base: `https://verify.twilio.com/v2/Services/${service}`,
    auth: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
  };
}

async function twilioPost(path: string, body: Record<string, string>) {
  const c = twilioConfig();
  if (!c) return null;
  return fetch(`${c.base}/${path}`, {
    method: "POST",
    headers: {
      Authorization: c.auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
}

async function twilioSend(phone10: string): Promise<OtpResult> {
  try {
    const res = await twilioPost("Verifications", { To: `+91${phone10}`, Channel: "sms" });
    if (!res) return { ok: false, error: "SMS is not configured yet." };
    if (res.status === 201 || res.status === 200) return { ok: true };
    if (res.status === 429) return { ok: false, error: "Too many codes requested. Try again later." };
    return { ok: false, error: "Could not send the code. Please try again." };
  } catch {
    return { ok: false, error: "Could not reach the SMS service. Please try again." };
  }
}

async function twilioCheck(phone10: string, code: string): Promise<OtpResult> {
  try {
    const res = await twilioPost("VerificationCheck", { To: `+91${phone10}`, Code: code });
    if (!res) return { ok: false, error: "SMS is not configured yet." };
    if (res.ok) {
      const json = (await res.json()) as { status?: string };
      if (json.status === "approved") return { ok: true };
    }
    return { ok: false, error: "That code is not correct or has expired." };
  } catch {
    return { ok: false, error: "Could not check the code. Please try again." };
  }
}
