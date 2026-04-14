"use client";

import { useState } from "react";
import { formatMoneyMinor } from "@/lib/format";

type Props = { token: string };

export function RedeemClient({ token }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [lines, setLines] = useState<
    { name: string; quantity: number; lineTotal: number; stallName: string }[] | null
  >(null);
  const [total, setTotal] = useState<number | null>(null);

  async function redeem() {
    setStatus("loading");
    setMessage(null);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not redeem.");
      return;
    }
    setStatus("done");
    setTotal(data.invoice?.total ?? null);
    setLines(data.invoice?.lines ?? null);
    setMessage("Redeemed successfully.");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-secondary/25 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Product Pavilion · E-Cell, TCE</p>
        <h1 className="mt-1 text-xl font-semibold text-primary">Redeem invoice</h1>
        <p className="mt-2 text-sm text-ink/70">
          Stall staff: tap once when the customer picks up. This code works only once.
        </p>
        {status === "idle" || status === "loading" ? (
          <button
            type="button"
            onClick={redeem}
            disabled={status === "loading"}
            className="mt-6 min-h-12 w-full rounded-lg bg-orange py-3 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
          >
            {status === "loading" ? "Checking…" : "Confirm redemption"}
          </button>
        ) : null}

        {message && (
          <p
            className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-primary"}`}
            role="status"
          >
            {message}
          </p>
        )}

        {status === "done" && lines && total != null && (
          <div className="mt-6 rounded-xl border border-peach/50 bg-peach/20 p-4 text-left text-sm">
            <p className="font-semibold text-primary">Invoice details</p>
            <ul className="mt-3 space-y-2">
              {lines.map((l) => (
                <li key={l.name + l.stallName} className="flex justify-between gap-2 border-b border-peach/30 pb-2 last:border-0">
                  <span>
                    {l.quantity}× {l.name}{" "}
                    <span className="text-xs text-ink/55">({l.stallName})</span>
                  </span>
                  <span className="tabular-nums">{formatMoneyMinor(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoneyMinor(total)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
