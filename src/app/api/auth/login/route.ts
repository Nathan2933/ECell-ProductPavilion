import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { parseStallNumber } from "@/lib/stall-numbers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");
    const stallNumber = parseStallNumber(body.stallNumber);
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    let user = null;

    if (stallNumber != null) {
      user = await prisma.user.findFirst({
        where: { role: "STALL", stallNumber },
      });
    } else if (email) {
      user = await prisma.user.findFirst({
        where: { email },
      });
    } else {
      return NextResponse.json(
        { error: "Enter admin email or stall number with password." },
        { status: 400 }
      );
    }

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "STALL") {
      return NextResponse.json({ error: "Invalid account." }, { status: 403 });
    }

    const session = await getSession();
    session.user = {
      id: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "STALL",
      stallName: user.stallName,
      stallNumber: user.stallNumber ?? null,
    };
    await session.save();

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        stallName: user.stallName,
        stallNumber: user.stallNumber,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
