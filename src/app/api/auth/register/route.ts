import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { parseStallNumber } from "@/lib/stall-numbers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stallName = String(body.stallName ?? "").trim();
    const password = String(body.password ?? "");
    const stallNumber = parseStallNumber(body.stallNumber);

    if (!stallName) {
      return NextResponse.json({ error: "Stall name is required." }, { status: 400 });
    }
    if (!stallNumber) {
      return NextResponse.json({ error: "Choose a stall number from 1 to 30." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const taken = await prisma.user.findFirst({
      where: { role: "STALL", stallNumber },
    });
    if (taken) {
      return NextResponse.json({ error: "That stall number is already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: null,
        passwordHash,
        role: "STALL",
        stallName,
        stallNumber,
      },
    });

    const session = await getSession();
    session.user = {
      id: user.id,
      email: null,
      role: "STALL",
      stallName: user.stallName,
      stallNumber: user.stallNumber,
    };
    await session.save();

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        stallName: user.stallName,
        stallNumber: user.stallNumber,
        role: "STALL",
      },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
