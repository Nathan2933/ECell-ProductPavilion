import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseStallNumber } from "@/lib/stall-numbers";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (session.user.role === "ADMIN") {
    const { searchParams } = new URL(request.url);
    const snRaw = searchParams.get("stallNumber");
    if (!snRaw) {
      return NextResponse.json({ items: [], stall: null });
    }
    const stallNumber = parseStallNumber(snRaw);
    if (!stallNumber) {
      return NextResponse.json({ error: "Stall number must be between 1 and 30." }, { status: 400 });
    }

    const stallUser = await prisma.user.findFirst({
      where: { role: "STALL", stallNumber },
    });

    if (!stallUser) {
      return NextResponse.json(
        { error: "No stall is registered with this number.", items: [], stall: null },
        { status: 404 }
      );
    }

    const items = await prisma.item.findMany({
      where: { userId: stallUser.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      stall: {
        stallNumber,
        stallName: stallUser.stallName ?? `Stall ${stallNumber}`,
      },
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        stock: i.stock,
        stallName: stallUser.stallName ?? `Stall ${stallNumber}`,
        stallNumber,
      })),
    });
  }

  const items = await prisma.item.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user || session.user.role !== "STALL") {
    return NextResponse.json({ error: "Stall account required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price);
    const stockRaw = Number(body.stock);
    const stock = Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 0;

    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Valid name and price required." }, { status: 400 });
    }

    const priceMinor = Math.round(price * 100);

    const item = await prisma.item.create({
      data: {
        userId: session.user.id,
        name,
        price: priceMinor,
        stock,
      },
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Could not add item." }, { status: 500 });
  }
}
