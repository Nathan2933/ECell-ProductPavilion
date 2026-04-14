export function formatMoneyMinor(minor: number, currency = "INR") {
  const major = minor / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(major);
}

/** ASCII-safe for PDF (Helvetica WinAnsi) — no ₹ symbol */
export function formatMoneyMinorPdf(minor: number) {
  const major = minor / 100;
  const s = major.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `Rs. ${s}`;
}

export function parseMoneyInput(value: string) {
  const n = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
