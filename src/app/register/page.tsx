"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { STALL_NUMBER_MAX, STALL_NUMBER_MIN } from "@/lib/stall-numbers";

export default function RegisterPage() {
  const router = useRouter();
  const [stallName, setStallName] = useState("");
  const [stallNumber, setStallNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numberOptions = useMemo(
    () =>
      Array.from({ length: STALL_NUMBER_MAX - STALL_NUMBER_MIN + 1 }, (_, i) => STALL_NUMBER_MIN + i),
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stallName,
          stallNumber: Number.parseInt(stallNumber, 10),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push("/stall");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-primary">Register your stall</h1>
        <p className="mt-1 text-sm text-ink/70">Product Pavilion — choose your stall number (1–30), name, and password.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Stall name</label>
            <input
              type="text"
              required
              value={stallName}
              onChange={(e) => setStallName(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Stall number</label>
            <select
              required
              value={stallNumber}
              onChange={(e) => setStallNumber(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-lg border border-secondary/35 bg-page px-3 py-2 text-base outline-none ring-primary/30 focus:ring-2 sm:min-h-0 sm:text-sm"
            >
              <option value="">Select 1–30</option>
              {numberOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={6}
            />
            <p className="mt-1 text-xs text-ink/55">At least 6 characters.</p>
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
            {loading ? "Creating account…" : "Create stall account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
