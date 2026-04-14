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
  });
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
  const from = process.env.MAIL_FROM;
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

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject,
      text,
      attachments: [
        {
          filename: "invoice.pdf",
          content: Buffer.from(opts.pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    return { ok: false, message: msg };
  }
}
