import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session.user || session.user.role !== "STALL") {
    return NextResponse.json({ error: "Stall account required." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.item.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : existing.name;
    const price = body.price != null ? Number(body.price) : existing.price / 100;

    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid fields." }, { status: 400 });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        price: Math.round(price * 100),
      },
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Could not update item." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session.user || session.user.role !== "STALL") {
    return NextResponse.json({ error: "Stall account required." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.item.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
