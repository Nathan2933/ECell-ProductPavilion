import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-secondary/25 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Image
            src="/logo/logo.png"
            alt=""
            width={200}
            height={56}
            className="h-14 w-auto max-w-full object-contain sm:h-16"
            priority
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">E-Cell, TCE</p>
            <h1 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">Product Pavilion</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
          Each stall picks a number from 1–30 and builds a price menu. Admin enters a stall number to load that menu,
          sets customer quantities and required contact details, then issues PDF + QR. Redeem once — second scan is
          invalid.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-orange px-5 py-2.5 text-sm font-medium text-white shadow hover:opacity-95"
          >
            Register your stall
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-secondary/40 bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-peach/20"
          >
            Log in
          </Link>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center rounded-lg border border-secondary/40 bg-peach/30 px-5 py-2.5 text-sm font-medium text-primary hover:bg-peach/50"
          >
            Scan invoice QR
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Stalls", text: "Add products, quantities, and prices from one dashboard." },
          { title: "Admin POS", text: "Build carts with required customer name & email; invoice + PDF + QR." },
          { title: "One scan", text: "Customers redeem once at pickup; duplicate scans are rejected." },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-peach/50 bg-peach/25 p-5 text-sm shadow-sm"
          >
            <h2 className="font-semibold text-primary">{c.title}</h2>
            <p className="mt-2 text-ink/75">{c.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
