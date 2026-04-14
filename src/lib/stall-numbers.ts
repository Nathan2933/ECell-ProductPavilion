/** Stalls are numbered 1–30 (Product Pavilion). */
export const STALL_NUMBER_MIN = 1;
export const STALL_NUMBER_MAX = 30;

export function parseStallNumber(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return null;
  if (n < STALL_NUMBER_MIN || n > STALL_NUMBER_MAX) return null;
  return n;
}
