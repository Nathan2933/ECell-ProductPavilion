import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Pavilion — E-Cell, TCE",
  description:
    "Product Pavilion by E-Cell, TCE: stall menus, invoicing, PDF bills with QR, and email delivery.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3852b4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
