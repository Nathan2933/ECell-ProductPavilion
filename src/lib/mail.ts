import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { EVENT_FULL_TITLE } from "@/lib/brand";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Prefer TLS on port 587 (common with Gmail / providers).
    requireTLS: port === 587,
  });
}

/** True if MAIL_FROM already looks like `"Name" <a@b>` or `Name <a@b>`. */
function isFormattedFrom(s: string) {
  return /<[^>\s]+@[^>]+\.[^>]+>\s*$/.test(s.trim());
}

function escapeDisplayName(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Builds RFC5322 From. Prefer MAIL_FROM matching SMTP_USER domain (e.g. same Gmail address) for best deliverability.
 * Optional MAIL_FROM_NAME overrides the display name (default: event title).
 */
function buildFromHeader(): string {
  const raw = (process.env.MAIL_FROM ?? "").trim();
  const display = (process.env.MAIL_FROM_NAME ?? EVENT_FULL_TITLE).trim();
  if (!raw) return "";
  if (isFormattedFrom(raw)) return raw;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return `"${escapeDisplayName(display)}" <${raw}>`;
  }
  return raw;
}

function messageIdDomain(): string {
  const explicit = process.env.MAIL_MESSAGE_ID_DOMAIN?.trim();
  if (explicit && !explicit.includes("@")) return explicit.replace(/^https?:\/\//, "").split("/")[0] ?? "localhost";
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (app) {
    try {
      const h = new URL(app).hostname;
      if (h && h !== "localhost") return h;
    } catch {
      /* ignore */
    }
  }
  return "localhost";
}

function buildInvoiceHtml(opts: {
  customerName: string;
  totalLabel: string;
  redeemUrl: string;
}): string {
  const safeName = escapeHtml(opts.customerName);
  const safeTotal = escapeHtml(opts.totalLabel);
  const safeUrl = escapeHtml(opts.redeemUrl);
  const safeTitle = escapeHtml(EVENT_FULL_TITLE);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#111;max-width:36rem;margin:0;padding:1rem">
<p>Hi ${safeName},</p>
<p>Thank you for visiting <strong>${safeTitle}</strong>.</p>
<p><strong>Total:</strong> ${safeTotal}</p>
<p>Redeem your purchase once at pickup using the link below (or scan the QR in the attached PDF).</p>
<p><a href="${safeUrl}" style="color:#c2410c">${safeUrl}</a></p>
<p style="color:#444;font-size:0.9rem">If you have questions, reply to this email or contact the event desk.</p>
<p style="color:#666;font-size:0.85rem">— E-Cell, TCE</p>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM
  );
}

export async function sendInvoiceEmail(opts: {
  to: string;
  customerName: string | null;
  pdfBytes: Uint8Array;
  redeemUrl: string;
  totalLabel: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const transport = getTransport();
  const from = buildFromHeader();
  if (!transport || !from) {
    return { ok: false, message: "Email not configured (set SMTP_* and MAIL_FROM in .env)." };
  }

  const subject = `${EVENT_FULL_TITLE} — Invoice ${opts.totalLabel}`;
  const name = opts.customerName?.trim() || "Customer";
  const text = [
    `Hi ${name},`,
    "",
    `Thank you for visiting ${EVENT_FULL_TITLE}.`,
    "",
    `Total: ${opts.totalLabel}`,
    "",
    `Redeem your purchase once at pickup using this link (or the QR in the PDF):`,
    opts.redeemUrl,
    "",
    "If you have questions, reply to this email or contact the event desk.",
    "",
    "— E-Cell, TCE",
  ].join("\n");

  const html = buildInvoiceHtml({
    customerName: name,
    totalLabel: opts.totalLabel,
    redeemUrl: opts.redeemUrl,
  });

  const replyTo = (process.env.MAIL_REPLY_TO ?? "").trim() || undefined;
  const domain = messageIdDomain();
  const messageId = `${randomBytes(16).toString("hex")}@${domain}`;

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      replyTo,
      subject,
      text,
      html,
      messageId,
      attachments: [
        {
          filename: "invoice-product-pavilion.pdf",
          content: Buffer.from(opts.pdfBytes),
          contentType: "application/pdf",
          contentDisposition: "attachment",
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    return { ok: false, message: msg };
  }
}
