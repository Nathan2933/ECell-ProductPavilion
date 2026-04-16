import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    const stallNum = session.user.stallNumber;
    if (stallNum == null) {
      return NextResponse.json(
        { error: "Your stall account is missing a stall number. Contact an admin.", invalid: true },
        { status: 403 }
      );
    }

    const lineStallNumbers = invoice.lines.map((l) => l.item.user.stallNumber);
    if (lineStallNumbers.some((n) => n == null)) {
      return NextResponse.json({ error: "This invoice has invalid line data.", invalid: true }, { status: 400 });
    }
    const distinctStalls = new Set(lineStallNumbers);
    if (distinctStalls.size !== 1) {
      return NextResponse.json(
        {
          error:
            "This invoice mixes multiple stalls and cannot be redeemed here. Ask an admin to reissue separate bills per stall.",
          invalid: true,
          multiStall: true,
        },
        { status: 409 }
      );
    }
    const invoiceStall = lineStallNumbers[0]!;
    if (invoiceStall !== stallNum) {
      return NextResponse.json(
        {
          error: `This pickup is for Stall ${invoiceStall}. Log in as that stall to redeem.`,
          invalid: true,
          wrongStall: true,
          invoiceStall,
        },
        { status: 403 }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        const pending = await tx.invoice.findFirst({
          where: { id: invoice.id, status: "PENDING" },
          include: {
            lines: {
              include: { item: { select: { name: true } } },
            },
          },
        });
        if (!pending) {
          throw new Error("ALREADY_REDEEMED");
        }

        for (const line of pending.lines) {
          const dec = await tx.$queryRaw<Array<{ id: string }>>(
            Prisma.sql`UPDATE Item SET stock = stock - ${line.quantity} WHERE id = ${line.itemId} AND stock >= ${line.quantity} RETURNING id`
          );
          if (!dec.length) {
            throw new Error(`INSUFFICIENT_STOCK_REDEEM:${line.item.name}`);
          }
        }

        await tx.invoice.update({
          where: { id: pending.id },
          data: { status: "REDEEMED" },
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ALREADY_REDEEMED") {
        return NextResponse.json({
          error: "This invoice was already redeemed.",
          invalid: true,
          alreadyRedeemed: true,
        });
      }
      if (msg.startsWith("INSUFFICIENT_STOCK_REDEEM:")) {
        const name = msg.split(":")[1] ?? "item";
        return NextResponse.json(
          {
            error: `Not enough stock to complete pickup (${name}). Adjust inventory or contact an admin.`,
            invalid: true,
            insufficientStock: true,
          },
          { status: 409 }
        );
      }
      throw e;
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
