import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatMoneyMinor } from "@/lib/format";

export default async function StallSpecificInvoicesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.user?.role !== "ADMIN") return redirect("/login");

  const { id } = await params;

  const stall = await prisma.user.findUnique({
    where: { id },
    select: { stallName: true, stallNumber: true },
  });

  if (!stall) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-ink/60">
        Stall not found.
      </div>
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      lines: {
        some: {
          item: { userId: id },
        },
      },
    },
    include: {
      lines: {
        where: {
          item: { userId: id },
        },
        include: {
          item: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = invoices.reduce((sum, inv) => {
    return sum + inv.lines.reduce((lSum, line) => lSum + line.lineTotal, 0);
  }, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
            <Link href="/admin/stalls" className="hover:underline">&larr; Back to Stalls</Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary">
            {stall.stallName || `Stall #${stall.stallNumber}`} Invoices
          </h1>
          <p className="mt-1 text-sm text-ink/70">
            Total Stall Revenue: <span className="font-semibold text-ink">{formatMoneyMinor(totalRevenue)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 ? (
          <p className="text-sm text-ink/65">No invoices found for this stall.</p>
        ) : (
          invoices.map((inv) => {
            const stallSubtotal = inv.lines.reduce((sum, l) => sum + l.lineTotal, 0);
            return (
              <div key={inv.id} className="rounded-xl border border-secondary/25 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary/15 pb-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Invoice <span className="font-mono text-xs text-ink/60 bg-peach/30 px-1 py-0.5 rounded">{inv.token}</span></p>
                    <p className="text-xs text-ink/65 mt-0.5">
                      {new Date(inv.createdAt).toLocaleString()} · {inv.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink/70 mb-0.5">Stall&apos;s cut</p>
                    <p className="font-semibold text-ink">{formatMoneyMinor(stallSubtotal)}</p>
                  </div>
                </div>
                <div className="pt-3">
                  <ul className="space-y-2 text-sm">
                    {inv.lines.map(line => (
                      <li key={line.id} className="flex justify-between gap-2">
                        <span>{line.quantity}× {line.item.name}</span>
                        <span className="tabular-nums text-ink/80">{formatMoneyMinor(line.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  {inv.customerName && (
                    <p className="mt-3 text-xs text-ink/70 bg-peach/20 inline-block px-2 py-1 rounded">
                      Customer: {inv.customerName} {inv.customerPhone && `(${inv.customerPhone})`}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
