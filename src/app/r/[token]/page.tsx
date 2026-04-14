import { RedeemClient } from "./RedeemClient";

export default async function RedeemPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RedeemClient token={token} />;
}
