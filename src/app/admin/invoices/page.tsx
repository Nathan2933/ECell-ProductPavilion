"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatMoneyMinor } from "@/lib/format";

type InvoiceRow = {
  id: string;
  token: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  lines: { name: string; quantity: number; unitPrice: number; lineTotal: number; stallName: string }[];
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const ir = await fetch("/api/invoices");
    if (ir.status === 401 || ir.status === 403) {
      setError("Sign in as admin.");
      return;
    }
    if (!ir.ok) {
      setError("Could not load invoices.");
      return;
    }
    const d = await ir.json();
    setInvoices(d.invoices ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) {
    return <p className="text-sm text-ink/70">Loading…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Product Pavilion · E-Cell, TCE</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-primary sm:text-2xl">Recent invoices</h1>
          <Link
            href="/admin"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            ← Back to billing
          </Link>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto rounded-xl border border-secondary/20 bg-white shadow-sm sm:mx-0">
        <table className="w-full min-w-[min(100%,42rem)] text-left text-sm">
          <thead className="bg-page text-xs uppercase text-ink/55">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 sm:px-4">When</th>
              <th className="px-3 py-2 sm:px-4">Customer</th>
              <th className="whitespace-nowrap px-3 py-2 sm:px-4">Status</th>
              <th className="whitespace-nowrap px-3 py-2 sm:px-4">Total</th>
              <th className="min-w-[8rem] px-3 py-2 sm:px-4">Lines</th>
              <th className="whitespace-nowrap px-3 py-2 sm:px-4">PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/55">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-secondary/15">
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-ink/80 sm:px-4 sm:text-sm">
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                  <td className="max-w-[10rem] px-3 py-3 text-xs text-ink/80 sm:max-w-none sm:px-4">
                    <span className="line-clamp-2 sm:line-clamp-none">
                      {inv.customerName || inv.customerEmail || inv.customerPhone || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <span
                      className={
                        inv.status === "REDEEMED"
                          ? "rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-orange/15 px-2 py-0.5 text-xs font-medium text-orange"
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                    {formatMoneyMinor(inv.total)}
                  </td>
                  <td className="px-3 py-3 text-xs text-ink/70 sm:px-4">
                    {inv.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ")}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      className="text-xs font-medium text-primary hover:underline sm:text-sm"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
