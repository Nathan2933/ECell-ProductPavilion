import type { Metadata } from "next";
import { ScanClient } from "./ScanClient";

export const metadata: Metadata = {
  title: "Scan invoice QR — Product Pavilion",
  description: "Scan a bill QR code to redeem an invoice once.",
};

export default function ScanPage() {
  return <ScanClient />;
}
