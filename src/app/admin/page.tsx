"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoneyMinor } from "@/lib/format";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  stallName: string;
  stallNumber: number;
};

type StallInfo = { stallNumber: number; stallName: string } | null;

type CartLine = {
  itemId: string;
  quantity: number;
  name: string;
  price: number;
  stallName: string;
  stallNumber: number;
};

type LastInvoice = {
  id: string;
  token: string;
  total: number;
  redeemUrl: string;
  pdfUrl: string;
  notifications: {
    emailSent: boolean | null;
    emailError: string | null;
  };
};

export default function AdminPage() {
  const [stallInput, setStallInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentStall, setCurrentStall] = useState<StallInfo>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [lastInvoice, setLastInvoice] = useState<LastInvoice | null>(null);

  const [addQtyDraft, setAddQtyDraft] = useState<Record<string, string>>({});

  async function loadStallMenu() {
    setMenuError(null);
    const n = Number.parseInt(stallInput.trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > 30) {
      setMenuError("Enter a stall number between 1 and 30.");
      return;
    }
    setMenuLoading(true);
    try {
      const res = await fetch(`/api/items?stallNumber=${n}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMenuItems([]);
        setCurrentStall(null);
        setMenuError(data.error ?? "Could not load menu.");
        return;
      }
      setCurrentStall(data.stall ?? null);
      setMenuItems(data.items ?? []);
      setAddQtyDraft({});
    } finally {
      setMenuLoading(false);
    }
  }

  function getDraftQty(itemId: string): number {
    const raw = addQtyDraft[itemId];
    if (raw === undefined || raw === "") return 1;
    const q = Number.parseInt(raw, 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }

  function addFromMenu(item: MenuItem) {
    const q = getDraftQty(item.id);
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id);
      if (idx === -1) {
        if (q > item.stock) {
          alert(`Cannot add ${q}. Only ${item.stock} in stock.`);
          return prev;
        }
        return [
          ...prev,
          {
            itemId: item.id,
            quantity: q,
            name: item.name,
            price: item.price,
            stallName: item.stallName,
            stallNumber: item.stallNumber,
          },
        ];
      }
      const next = [...prev];
      const newQty = next[idx].quantity + q;
      if (newQty > item.stock) {
        alert(`Cannot add. Total exceeds ${item.stock} in stock.`);
        return prev;
      }
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  }

  function setLineQuantity(itemId: string, qty: number) {
    if (qty < 1) {
      setCart((prev) => prev.filter((l) => l.itemId !== itemId));
      return;
    }
    const itemStock = menuItems.find(i => i.id === itemId)?.stock ?? Number.MAX_SAFE_INTEGER;
    if (qty > itemStock) {
      alert(`Cannot set to ${qty}. Only ${itemStock} in stock.`);
      return;
    }
    setCart((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, quantity: qty } : l)));
  }

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity * l.price, 0),
    [cart]
  );

  const customerOk = customerName.trim().length > 0 && customerEmail.trim().length > 0;

  async function checkout() {
    setCheckoutError(null);
    if (cart.length === 0) {
      setCheckoutError("Add at least one line to the cart.");
      return;
    }
    if (!customerName.trim()) {
      setCheckoutError("Customer name is required.");
      return;
    }
    if (!customerEmail.trim()) {
      setCheckoutError("Customer email is required.");
      return;
    }
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extra = data.details ? ` (${data.details})` : "";
      setCheckoutError((data.error ?? "Checkout failed.") + extra);
      return;
    }
    setCart([]);
    setLastInvoice({
      ...data.invoice,
      notifications: data.notifications ?? {
        emailSent: null,
        emailError: null,
      },
    });
    void loadStallMenu(); // Refresh menu after checkout to update stock lengths!
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Product Pavilion · E-Cell, TCE</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-primary sm:text-2xl">Admin — billing</h1>
          <Link
            href="/admin/invoices"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            View recent invoices →
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink/70">
          Enter stall #1–30 to load a menu. Set quantities, add customer name and email (required), then generate the
          bill.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <section className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-secondary/25 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Load stall menu</h2>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1 sm:flex-initial">
                <label className="text-xs text-ink/70">Stall # (1–30)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={stallInput}
                  onChange={(e) => setStallInput(e.target.value)}
                  className="mt-0.5 w-full max-w-[10rem] rounded-lg border border-secondary/35 bg-page px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadStallMenu()}
                disabled={menuLoading}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 disabled:opacity-60"
              >
                {menuLoading ? "Loading…" : "Show menu"}
              </button>
            </div>
            {menuError && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {menuError}
              </p>
            )}
            {currentStall && (
              <p className="mt-2 text-sm text-primary">
                <span className="font-semibold">#{currentStall.stallNumber}</span> {currentStall.stallName}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Menu</h2>
            {menuItems.length === 0 ? (
              <p className="text-sm text-ink/60">
                Enter a stall number and tap Show menu, or choose another stall.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-secondary/25 bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {item.name}
                        {item.stock !== undefined && (
                          <span className="ml-2 text-xs font-normal text-secondary">
                            ({item.stock} left)
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-ink/80">{formatMoneyMinor(item.price)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-xs text-ink/60">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={addQtyDraft[item.id] ?? "1"}
                        onChange={(e) =>
                          setAddQtyDraft((d) => ({ ...d, [item.id]: e.target.value }))
                        }
                        className="w-16 rounded border border-secondary/35 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addFromMenu(item)}
                        className="rounded-lg bg-secondary/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-secondary"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="space-y-4 rounded-2xl border border-peach/50 bg-peach/20 p-4 shadow-sm sm:sticky sm:top-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Cart & total</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-ink/65">Cart is empty. Load a stall menu and add items.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {cart.map((line) => (
                  <li
                    key={line.itemId}
                    className="rounded-lg border border-peach/40 bg-white/80 px-3 py-2"
                  >
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{line.name}</p>
                        <p className="text-xs text-ink/55">
                          Stall #{line.stallNumber} · {line.stallName}
                        </p>
                        <p className="text-xs text-ink/55">{formatMoneyMinor(line.price)} each</p>
                      </div>
                      <p className="shrink-0 font-medium">{formatMoneyMinor(line.quantity * line.price)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-xs text-ink/60">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => {
                          const v = Number.parseInt(e.target.value, 10);
                          if (!Number.isFinite(v)) return;
                          setLineQuantity(line.itemId, v);
                        }}
                        className="w-20 rounded border border-secondary/35 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-700 hover:underline"
                        onClick={() => setCart((p) => p.filter((l) => l.itemId !== line.itemId))}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-peach/40 pt-3 text-sm">
              <span className="font-medium text-ink">Total</span>
              <span className="text-lg font-semibold text-primary">{formatMoneyMinor(cartTotal)}</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-ink/60 hover:text-ink"
              >
                Clear cart
              </button>
            )}

            <div className="space-y-2 rounded-xl border border-secondary/20 bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Customer (required)</p>
              <div>
                <label className="text-xs text-ink/70">Name</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="mt-0.5 w-full min-h-11 rounded-lg border border-secondary/35 bg-white px-2 py-2 text-base sm:text-sm"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-xs text-ink/70">Email (PDF sent when SMTP is configured)</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-0.5 w-full min-h-11 rounded-lg border border-secondary/35 bg-white px-2 py-2 text-base sm:text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            {checkoutError && (
              <p className="text-sm text-red-700" role="alert">
                {checkoutError}
              </p>
            )}
            <button
              type="button"
              onClick={() => void checkout()}
              disabled={cart.length === 0 || !customerOk}
              className="w-full min-h-12 rounded-lg bg-orange py-2.5 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate invoice, PDF & QR
            </button>

            {lastInvoice && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-white p-4 text-left">
                <p className="text-center text-xs font-medium uppercase tracking-wide text-secondary">
                  Latest invoice
                </p>
                <p className="text-center text-sm text-ink/70">Total {formatMoneyMinor(lastInvoice.total)}</p>

                {lastInvoice.notifications.emailSent === true && (
                  <p className="text-center text-sm text-primary">Email with PDF sent to the customer.</p>
                )}
                {lastInvoice.notifications.emailSent === false && (
                  <p className="text-center text-sm text-red-700">
                    Email not sent: {lastInvoice.notifications.emailError ?? "Check SMTP settings."}
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                  <a
                    href={lastInvoice.pdfUrl}
                    className="inline-flex rounded-lg border border-primary/30 bg-peach/30 px-3 py-2 text-sm font-medium text-primary hover:bg-peach/50"
                  >
                    Download PDF
                  </a>
                </div>

                <div className="flex justify-center">
                  <Image
                    src={`/api/qr/${encodeURIComponent(lastInvoice.token)}`}
                    alt="Invoice QR"
                    width={280}
                    height={280}
                    className="max-w-full h-auto"
                    unoptimized
                  />
                </div>
                <p className="break-all text-center text-xs text-ink/55">{lastInvoice.redeemUrl}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
