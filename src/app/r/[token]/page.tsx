import { RedeemClient } from "./RedeemClient";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function RedeemPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (session.user?.role !== "STALL") {
    return redirect("/login");
  }

  const { token } = await params;
  
  const invoice = await prisma.invoice.findUnique({
    where: { token },
    select: { status: true }
  });

  const isInvalid = !invoice;
  const isRedeemed = invoice?.status === "REDEEMED";

  return <RedeemClient token={token} isInvalid={isInvalid} isRedeemed={isRedeemed} />;
}
