"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"admin" | "stall">("stall");
  const [email, setEmail] = useState("");
  const [stallNumber, setStallNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body =
        mode === "admin"
          ? { email: email.trim(), password }
          : { stallNumber: Number.parseInt(stallNumber.trim(), 10), password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      if (data.user?.role === "ADMIN") router.push("/admin");
      else router.push("/stall");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-0 sm:px-0">
      <div className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-primary">Log in</h1>
        <p className="mt-1 text-sm text-ink/70">Product Pavilion · E-Cell, TCE</p>

        <div className="mt-4 flex gap-2 rounded-lg bg-page p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("stall")}
            className={`flex-1 rounded-md py-2 font-medium ${
              mode === "stall" ? "bg-white shadow text-primary" : "text-ink/70"
            }`}
          >
            Stall
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 rounded-md py-2 font-medium ${
              mode === "admin" ? "bg-white shadow text-primary" : "text-ink/70"
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "admin" ? (
            <div>
              <label className="block text-sm font-medium text-ink">Admin email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@event.local"
                className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ink">Stall number (1–30)</label>
              <input
                type="number"
                required
                min={1}
                max={30}
                value={stallNumber}
                onChange={(e) => setStallNumber(e.target.value)}
                className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange py-2.5 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          New stall?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-2 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
