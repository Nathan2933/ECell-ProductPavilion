import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (session.user?.role !== "STALL") {
    return NextResponse.json({ error: "Only stalls can redeem invoices.", invalid: true }, { status: 403 });
  }

  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token required." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { token },
      include: {
        lines: {
          include: {
            item: { include: { user: { select: { stallName: true, email: true, stallNumber: true } } } },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invalid invoice.", invalid: true }, { status: 404 });
    }

    if (invoice.status === "REDEEMED") {
      return NextResponse.json({
        error: "This invoice was already redeemed.",
        invalid: true,
        alreadyRedeemed: true,
      });
    }

    const updated = await prisma.invoice.updateMany({
      where: { id: invoice.id, status: "PENDING" },
      data: { status: "REDEEMED" },
    });

    if (updated.count === 0) {
      return NextResponse.json({
        error: "This invoice was already redeemed.",
        invalid: true,
        alreadyRedeemed: true,
      });
    }

    return NextResponse.json({
      ok: true,
      invoice: {
        id: invoice.id,
        total: invoice.total,
        lines: invoice.lines.map((l) => ({
          name: l.item.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
          stallName:
            l.item.user.stallName ??
            (l.item.user.stallNumber != null ? `Stall ${l.item.user.stallNumber}` : "Stall"),
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Redeem failed." }, { status: 500 });
  }
}
