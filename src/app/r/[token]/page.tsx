import { RedeemClient } from "./RedeemClient";
import { prisma } from "@/lib/prisma";

export default async function RedeemPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const invoice = await prisma.invoice.findUnique({
    where: { token },
    select: { status: true }
  });

  const isInvalid = !invoice;
  const isRedeemed = invoice?.status === "REDEEMED";

  return <RedeemClient token={token} isInvalid={isInvalid} isRedeemed={isRedeemed} />;
}
