import { NextResponse } from "next/server";
import { buildInvoicePdf } from "@/lib/pdf-invoice";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: {
        include: { item: { include: { user: { select: { stallName: true } } } } },
      },
    },
  });

  if (!inv) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const redeemUrl = `${base}/r/${inv.token}`;

  const pdfBytes = await buildInvoicePdf({
    invoiceId: inv.id,
    createdAt: inv.createdAt,
    customerName: inv.customerName,
    customerEmail: inv.customerEmail,
    customerPhone: inv.customerPhone,
    redeemUrl,
    total: inv.total,
    lines: inv.lines.map((l) => ({
      name: l.item.name,
      stallName: l.item.user.stallName ?? "Stall",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
  });

  const filename = `invoice-${inv.id.slice(-8)}.pdf`;
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
