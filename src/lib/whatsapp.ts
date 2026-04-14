/**
 * Build wa.me URL (opens WhatsApp with prefilled message).
 * Server-side WhatsApp delivery requires Meta/Twilio; this is the practical free option.
 */
export function normalizeWhatsAppDigits(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  // India: 10-digit mobile → prefix 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  const text = encodeURIComponent(message);
  return `${base}?text=${text}`;
}
