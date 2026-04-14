"use client";

import type { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function extractToken(text: string): string | null {
  const t = text.trim();
  try {
    const u = new URL(t);
    const m = u.pathname.match(/\/r\/([^/?#]+)/);
    return m?.[1] ?? null;
  } catch {
    const m = t.match(/\/r\/([^/?#\s]+)/);
    return m?.[1] ?? null;
  }
}

export function ScanClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

  const goRedeem = useCallback(
    (token: string) => {
      setError(null);
      router.push(`/r/${encodeURIComponent(token)}`);
    },
    [router]
  );

  const onDecoded = useCallback(
    (text: string) => {
      if (decodedRef.current) return;
      const token = extractToken(text);
      if (!token) {
        setError("This QR is not a Product Pavilion invoice link.");
        return;
      }
      decodedRef.current = true;
      const h = html5Ref.current;
      if (h) {
        void h.stop().then(() => h.clear()).finally(() => goRedeem(token));
      } else {
        goRedeem(token);
      }
    },
    [goRedeem]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const html5 = new Html5Qrcode("qr-reader", { verbose: false });
        html5Ref.current = html5;
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          onDecoded,
          () => {}
        );
        if (!cancelled) setCameraOk(true);
      } catch (e) {
        if (!cancelled) {
          setCameraOk(false);
          setError(
            e instanceof Error
              ? e.message
              : "Camera unavailable. Allow access or paste the invoice link below."
          );
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      const h = html5Ref.current;
      html5Ref.current = null;
      if (h) {
        void h.stop().then(() => h.clear()).catch(() => {});
      }
    };
  }, [onDecoded]);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = extractToken(manual);
    if (token) goRedeem(token);
    else setError("Paste the full link from the invoice (contains /r/…).");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Product Pavilion · E-Cell, TCE</p>
        <h1 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">Scan invoice QR</h1>
        <p className="mt-2 text-sm text-ink/75">
          Point the camera at the QR on the customer&apos;s bill. After scanning, you&apos;ll open the redemption
          screen (one-time use).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-secondary/25 bg-white p-3 shadow-sm">
        <div id="qr-reader" className="min-h-[260px] w-full bg-ink/5" />
        {cameraOk === false && (
          <p className="mt-2 text-center text-xs text-ink/60">Camera preview will appear here when allowed.</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={submitManual} className="space-y-2 rounded-xl border border-peach/50 bg-peach/20 p-4">
        <label className="text-sm font-medium text-ink">Or paste invoice link</label>
        <input
          type="url"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="https://…/r/…"
          className="w-full min-h-11 rounded-lg border border-secondary/35 bg-white px-3 py-2 text-base sm:text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-orange py-2.5 text-sm font-medium text-white shadow hover:opacity-95"
        >
          Open redemption
        </button>
      </form>

      <p className="text-center text-sm text-ink/65">
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
