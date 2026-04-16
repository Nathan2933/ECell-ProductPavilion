import type { Metadata } from "next";
import { ScanClient } from "./ScanClient";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Scan invoice QR — Product Pavilion",
  description: "Scan a bill QR code to redeem an invoice once.",
};

export default async function ScanPage() {
  const session = await getSession();
  if (session.user?.role !== "STALL") {
    return redirect("/login");
  }
  return <ScanClient />;
}
