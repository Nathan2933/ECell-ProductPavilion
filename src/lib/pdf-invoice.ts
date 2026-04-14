import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { EVENT_NAME, ORG_NAME } from "@/lib/brand";
import { formatMoneyMinorPdf } from "@/lib/format";

const PRIMARY = rgb(56 / 255, 82 / 255, 180 / 255);
const MUTED = rgb(0.35, 0.38, 0.45);
const INK = rgb(0.12, 0.14, 0.2);

export type InvoicePdfLine = {
  name: string;
  stallName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type BuildInvoicePdfInput = {
  invoiceId: string;
  createdAt: Date;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  redeemUrl: string;
  lines: InvoicePdfLine[];
  total: number;
};

function clip(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function buildInvoicePdf(input: BuildInvoicePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const h = page.getHeight();
  const margin = 48;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = h - margin;

  page.drawText(EVENT_NAME, {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: PRIMARY,
  });
  y -= 26;
  page.drawText(ORG_NAME, {
    x: margin,
    y,
    size: 11,
    font,
    color: MUTED,
  });
  y -= 22;
  page.drawText("Invoice / Bill", {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: INK,
  });
  y -= 22;

  const idShort = input.invoiceId.slice(-8).toUpperCase();
  const when = input.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  page.drawText(`Invoice ref: ${idShort}`, { x: margin, y, size: 10, font, color: INK });
  y -= 14;
  page.drawText(`Date: ${when}`, { x: margin, y, size: 10, font, color: INK });
  y -= 22;

  if (input.customerName || input.customerEmail || input.customerPhone) {
    page.drawText("Customer", { x: margin, y, size: 11, font: fontBold, color: INK });
    y -= 16;
    if (input.customerName) {
      page.drawText(clip(input.customerName, 80), { x: margin, y, size: 10, font, color: INK });
      y -= 14;
    }
    if (input.customerEmail) {
      page.drawText(clip(input.customerEmail, 80), { x: margin, y, size: 10, font, color: INK });
      y -= 14;
    }
    if (input.customerPhone) {
      page.drawText(`WhatsApp: ${clip(input.customerPhone, 40)}`, { x: margin, y, size: 10, font, color: INK });
      y -= 14;
    }
    y -= 8;
  }

  page.drawText("Line items (rate x qty = amount)", { x: margin, y, size: 11, font: fontBold, color: INK });
  y -= 18;

  const colItem = margin;
  const colStall = margin + 200;
  const colQty = margin + 360;
  const colRate = margin + 400;
  const colAmt = margin + 470;

  page.drawText("Item", { x: colItem, y, size: 9, font: fontBold, color: MUTED });
  page.drawText("Stall", { x: colStall, y, size: 9, font: fontBold, color: MUTED });
  page.drawText("Qty", { x: colQty, y, size: 9, font: fontBold, color: MUTED });
  page.drawText("Rate", { x: colRate, y, size: 9, font: fontBold, color: MUTED });
  page.drawText("Amount", { x: colAmt, y, size: 9, font: fontBold, color: MUTED });
  y -= 14;

  for (const line of input.lines) {
    if (y < 200) break; // leave room for QR + total
    page.drawText(clip(line.name, 28), { x: colItem, y, size: 9, font, color: INK });
    page.drawText(clip(line.stallName, 18), { x: colStall, y, size: 9, font, color: INK });
    page.drawText(String(line.quantity), { x: colQty, y, size: 9, font, color: INK });
    page.drawText(formatMoneyMinorPdf(line.unitPrice), { x: colRate, y, size: 9, font, color: INK });
    page.drawText(formatMoneyMinorPdf(line.lineTotal), { x: colAmt, y, size: 9, font, color: INK });
    y -= 14;
  }

  y -= 8;
  page.drawText(`Total: ${formatMoneyMinorPdf(input.total)}`, {
    x: margin,
    y,
    size: 13,
    font: fontBold,
    color: PRIMARY,
  });
  y -= 28;

  const qrPng = await QRCode.toBuffer(input.redeemUrl, {
    type: "png",
    width: 220,
    margin: 2,
    color: { dark: "#3852B4", light: "#ffffff" },
  });
  const qrImage = await pdf.embedPng(qrPng);
  const qrSize = 160;
  page.drawImage(qrImage, { x: margin, y: y - qrSize, width: qrSize, height: qrSize });
  y -= qrSize + 8;

  page.drawText("Redeem once at pickup (QR):", { x: margin, y, size: 9, font: fontBold, color: INK });
  y -= 12;
  const urlParts = input.redeemUrl.match(/.{1,85}/g) ?? [input.redeemUrl];
  for (const part of urlParts.slice(0, 3)) {
    page.drawText(part, { x: margin, y, size: 8, font, color: MUTED });
    y -= 10;
  }

  const bytes = await pdf.save();
  return bytes;
}
