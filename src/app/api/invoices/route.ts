import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { formatMoneyMinor } from "@/lib/format";
import { buildInvoicePdf } from "@/lib/pdf-invoice";
import { sendInvoiceEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type LineInput = { itemId: string; quantity: number };

function looseEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function GET() {
  const session = await getSession();
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lines: {
        include: { item: { include: { user: { select: { stallName: true } } } } },
      },
    },
  });

  return NextResponse.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      token: inv.token,
      status: inv.status,
      total: inv.total,
      createdAt: inv.createdAt,
      customerName: inv.customerName,
      customerEmail: inv.customerEmail,
      customerPhone: inv.customerPhone,
      lines: inv.lines.map((l) => ({
        name: l.item.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        stallName: l.item.user.stallName ?? "Stall",
      })),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const lines = body.lines as LineInput[] | undefined;
    const customerName = body.customerName != null ? String(body.customerName).trim() : "";
    const customerEmailRaw = body.customerEmail != null ? String(body.customerEmail).trim() : "";

    if (!customerName) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }
    if (!customerEmailRaw) {
      return NextResponse.json({ error: "Customer email is required." }, { status: 400 });
    }

    const customerEmail = customerEmailRaw.toLowerCase();
    if (!looseEmail(customerEmail)) {
      return NextResponse.json({ error: "Please enter a valid customer email." }, { status: 400 });
    }

    if (!lines?.length) {
      return NextResponse.json({ error: "Add at least one line." }, { status: 400 });
    }

    const token = randomBytes(24).toString("base64url");

    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const prepared: {
        itemId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const line of lines) {
        const qty = Math.floor(Number(line.quantity));
        if (!line.itemId || qty < 1) {
          throw new Error("BAD_LINE");
        }
        // Stock is reduced on redemption only; here we only ensure enough is available to sell.
        const rows = await tx.$queryRaw<Array<{ id: string; name: string; price: number; stock: number }>>(
          Prisma.sql`SELECT id, name, price, stock FROM Item WHERE id = ${line.itemId}`
        );
        const item = rows[0];
        if (!item) {
          throw new Error("BAD_ITEM");
        }
        if (item.stock < qty) {
          throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
        }

        const lineTotal = qty * item.price;
        total += lineTotal;
        prepared.push({
          itemId: item.id,
          quantity: qty,
          unitPrice: item.price,
          lineTotal,
        });
      }

      const sellers = await tx.item.findMany({
        where: { id: { in: prepared.map((p) => p.itemId) } },
        select: {
          id: true,
          user: { select: { stallNumber: true, role: true } },
        },
      });
      if (sellers.length !== prepared.length) {
        throw new Error("BAD_ITEM");
      }
      for (const row of sellers) {
        if (row.user.role !== "STALL" || row.user.stallNumber == null) {
          throw new Error("BAD_SELLER");
        }
      }
      const stallNumbers = new Set(sellers.map((s) => s.user.stallNumber!));
      if (stallNumbers.size !== 1) {
        throw new Error("MULTI_STALL");
      }

      const invoice = await tx.invoice.create({
        data: {
          token,
          total,
          createdById: session.user!.id,
          status: "PENDING",
          customerName,
          customerEmail,
          customerPhone: null,
          lines: {
            create: prepared.map((p) => ({
              itemId: p.itemId,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              lineTotal: p.lineTotal,
            })),
          },
        },
      });

      return invoice;
    });

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const redeemUrl = `${base}/r/${result.token}`;

    const full = await prisma.invoice.findUnique({
      where: { id: result.id },
      include: {
        lines: {
          include: { item: { include: { user: { select: { stallName: true } } } } },
        },
      },
    });

    if (!full) {
      return NextResponse.json({ error: "Invoice not found after create." }, { status: 500 });
    }

    const pdfLines = full.lines.map((l) => ({
      name: l.item.name,
      stallName: l.item.user.stallName ?? "Stall",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    }));

    const pdfBytes = await buildInvoicePdf({
      invoiceId: full.id,
      createdAt: full.createdAt,
      customerName: full.customerName,
      customerEmail: full.customerEmail,
      customerPhone: full.customerPhone,
      redeemUrl,
      lines: pdfLines,
      total: full.total,
    });

    const totalLabel = formatMoneyMinor(full.total);
    let emailSent: boolean | null = null;
    let emailError: string | null = null;

    const mail = await sendInvoiceEmail({
      to: customerEmail,
      customerName: full.customerName,
      pdfBytes,
      redeemUrl,
      totalLabel,
    });
    if (mail.ok) {
      emailSent = true;
    } else {
      emailSent = false;
      emailError = mail.message;
    }

    return NextResponse.json({
      invoice: {
        id: result.id,
        token: result.token,
        total: result.total,
        redeemUrl,
        pdfUrl: `/api/invoices/${result.id}/pdf`,
        customerEmail: full.customerEmail,
      },
      notifications: {
        emailSent,
        emailError,
      },
    });
  } catch (e) {
    console.error("invoice POST", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json({ error: `Not enough stock for ${msg.split(":")[1]}.` }, { status: 409 });
    }
    if (msg === "BAD_LINE") {
      return NextResponse.json({ error: "Invalid line in invoice." }, { status: 400 });
    }
    if (msg === "BAD_ITEM") {
      return NextResponse.json({ error: "One or more items are no longer available." }, { status: 409 });
    }
    if (msg === "MULTI_STALL") {
      return NextResponse.json(
        {
          error: "All items in one bill must be from the same stall so the correct stall can redeem the QR.",
        },
        { status: 400 }
      );
    }
    if (msg === "BAD_SELLER") {
      return NextResponse.json({ error: "One or more items are not linked to a stall menu." }, { status: 400 });
    }
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Could not create invoice.", details: process.env.NODE_ENV === "development" ? detail : undefined },
      { status: 500 }
    );
  }
}
