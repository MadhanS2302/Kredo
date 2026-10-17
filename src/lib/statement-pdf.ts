import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export interface StatementData {
  id: string;
  workerName: string;
  trade: string;
  area: string;
  monthLabel: string;
  issuedAt: Date;
  verifyUrl: string;
  jobs: {
    job_date: string;
    job_type: string;
    amount: number;
    rating: number | null;
    confidence: string | null;
  }[];
  totalIncome: number;
  avgRating: number | null;
  highConfPct: number;
}

// Standard PDF fonts only support basic Latin; replace anything else so generation never fails.
const safe = (s: string) => s.replace(/[^\x20-\x7E]/g, "?");
const inr = (n: number) => "Rs. " + n.toLocaleString("en-IN");

export async function buildStatementPdf(d: StatementData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595;
  const H = 842;
  const M = 40;
  const green = rgb(0.09, 0.55, 0.25);
  const grey = rgb(0.4, 0.4, 0.4);
  const rowsPerPage = 28;

  const qrPng = await QRCode.toBuffer(d.verifyUrl, { margin: 1, width: 240 });
  const qr = await pdf.embedPng(qrPng);

  let page = pdf.addPage([W, H]);
  let y = H - M;

  // Header
  page.drawText("Kredo", { x: M, y: y - 18, size: 22, font: bold, color: green });
  page.drawText("Income Statement", { x: M, y: y - 40, size: 14, font: bold });
  page.drawImage(qr, { x: W - M - 90, y: y - 90, width: 90, height: 90 });
  page.drawText("Scan to verify", { x: W - M - 80, y: y - 102, size: 8, font, color: grey });

  y -= 70;
  const info: [string, string][] = [
    ["Name", d.workerName],
    ["Trade / Area", `${d.trade} / ${d.area}`],
    ["Period", d.monthLabel],
    ["Issued", d.issuedAt.toISOString().slice(0, 10)],
  ];
  for (const [k, v] of info) {
    page.drawText(k, { x: M, y, size: 10, font, color: grey });
    page.drawText(safe(v), { x: M + 90, y, size: 10, font: bold });
    y -= 15;
  }

  y -= 15;
  // Summary box
  page.drawRectangle({
    x: M, y: y - 52, width: W - 2 * M - 110, height: 52,
    borderColor: green, borderWidth: 1,
  });
  const summary: [string, string][] = [
    ["Verified jobs", String(d.jobs.length)],
    ["Verified income", inr(d.totalIncome)],
    ["Avg rating", d.avgRating ? d.avgRating.toFixed(1) + " / 5" : "-"],
    ["High-confidence", d.highConfPct + "%"],
  ];
  const colW = (W - 2 * M - 110) / 4;
  summary.forEach(([k, v], idx) => {
    const x = M + 10 + idx * colW;
    page.drawText(v, { x, y: y - 24, size: 12, font: bold });
    page.drawText(k, { x, y: y - 40, size: 8, font, color: grey });
  });
  y -= 85;

  const header = () => {
    page.drawText("Date", { x: M, y, size: 9, font: bold, color: grey });
    page.drawText("Job", { x: M + 70, y, size: 9, font: bold, color: grey });
    page.drawText("Amount", { x: M + 300, y, size: 9, font: bold, color: grey });
    page.drawText("Rating", { x: M + 380, y, size: 9, font: bold, color: grey });
    page.drawText("Confidence", { x: M + 430, y, size: 9, font: bold, color: grey });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: grey });
    y -= 14;
  };
  header();

  let onPage = 0;
  for (const j of d.jobs) {
    if (onPage >= rowsPerPage || y < 80) {
      page = pdf.addPage([W, H]);
      y = H - M;
      onPage = 0;
      header();
    }
    page.drawText(j.job_date, { x: M, y, size: 9, font });
    page.drawText(safe(j.job_type).slice(0, 42), { x: M + 70, y, size: 9, font });
    page.drawText(inr(j.amount), { x: M + 300, y, size: 9, font });
    page.drawText(j.rating ? String(j.rating) : "-", { x: M + 380, y, size: 9, font });
    page.drawText(j.confidence ?? "-", { x: M + 430, y, size: 9, font });
    y -= 15;
    onPage++;
  }

  // Footer on the last page
  const foot = [
    `Statement ID: ${d.id}`,
    "Every job above was confirmed by the customer through Kredo. This is not an audited income record.",
    "Confirm this statement is genuine by scanning the QR code or opening: " + d.verifyUrl,
  ];
  let fy = 50;
  for (const line of foot.reverse()) {
    page.drawText(safe(line), { x: M, y: fy, size: 7.5, font, color: grey });
    fy += 11;
  }

  return pdf.save();
}
