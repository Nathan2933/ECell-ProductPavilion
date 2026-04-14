import QRCode from "qrcode";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = `${base}/r/${encodeURIComponent(token)}`;

  try {
    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: 280,
      margin: 2,
      color: {
        dark: "#3852B4",
        light: "#ffffff",
      },
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("QR failed", { status: 500 });
  }
}
