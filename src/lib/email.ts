import nodemailer from "nodemailer";

export type MailResult = { ok: true } | { ok: false; error: string };

const configured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<MailResult> {
  if (!configured()) {
    if (process.env.NODE_ENV !== "production") {
      // Local development: print the email instead of sending it.
      console.log(`\n--- EMAIL (not sent, SMTP not configured) ---\nTo: ${opts.to}\n${opts.subject}\n${opts.text}\n---\n`);
      return { ok: true };
    }
    return { ok: false, error: "Email sending is not set up yet." };
  }
  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: process.env.MAIL_FROM, ...opts });
    return { ok: true };
  } catch (e) {
    console.error("sendEmail failed:", e);
    return { ok: false, error: "The email could not be sent. Check the address and try again." };
  }
}

export function confirmationEmail(args: {
  workerName: string;
  jobType: string;
  amount: number;
  jobDate: string;
  link: string;
}) {
  const { workerName, jobType, amount, jobDate, link } = args;
  const subject = `Please confirm the work ${workerName} did for you`;
  const text =
    `${workerName} says they did this work for you:\n\n` +
    `${jobType}, Rs. ${amount.toLocaleString("en-IN")}, on ${jobDate}\n\n` +
    `Please confirm whether this is correct (takes 20 seconds):\n${link}\n\n` +
    `The link works for 7 days. If you do not know ${workerName}, ignore this email.\n— Kredo`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#14161f">
  <h2 style="margin:0 0 8px">Did ${escapeHtml(workerName)} do this work for you?</h2>
  <div style="border:1px solid #d8dce8;border-radius:6px;padding:14px;margin:14px 0">
    <div style="font-size:18px;font-weight:bold">${escapeHtml(jobType)}</div>
    <div>Rs. ${amount.toLocaleString("en-IN")} · ${escapeHtml(jobDate)}</div>
  </div>
  <p><a href="${link}" style="display:inline-block;background:#1b2ba8;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">Review and confirm</a></p>
  <p style="color:#566074;font-size:13px">The link works for 7 days. If you do not know ${escapeHtml(workerName)}, ignore this email.</p>
</div>`;
  return { subject, text, html };
}
