"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatMoneyMinor } from "@/lib/format";

type Item = {
  id: string;
  name: string;
  price: number;
};

export default function StallPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/items");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError("Could not load menu.");
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
  }, [router]);

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

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not add item.");
      return;
    }
    setName("");
    setPrice("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this item from the menu?")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not remove.");
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-ink/70">Loading…</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">My stall menu</h1>
        <p className="mt-1 text-sm text-ink/70">
          Add dish or product names with price (INR). Stock is not tracked — the admin enters quantities when billing
          customers.
        </p>
      </div>

      <section className="rounded-2xl border border-secondary/20 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Add menu item</h2>
        <form onSubmit={addItem} className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-ink/80">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base sm:min-h-0 sm:text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink/80">Price (₹)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base sm:min-h-0 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
            >
              Add to menu
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-peach/40 bg-peach/15 shadow-sm">
        <div className="border-b border-peach/40 bg-white/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-primary">Menu</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="bg-white/80 text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-ink/60">
                    No items yet. Add your first menu entry above.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id} className="border-t border-peach/30 bg-white/40">
                    <td className="px-4 py-3 font-medium text-ink">{i.name}</td>
                    <td className="px-4 py-3">{formatMoneyMinor(i.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(i.id)}
                        className="text-xs font-medium text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
