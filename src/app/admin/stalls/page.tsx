import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatMoneyMinor } from "@/lib/format";

export const metadata = {
  title: "Stalls Revenue Breakdown",
};

export default async function StallsRevenuePage() {
  const session = await getSession();
  if (session.user?.role !== "ADMIN") return redirect("/login");

  const stalls = await prisma.user.findMany({
    where: { role: "STALL" },
    select: {
      id: true,
      stallName: true,
      stallNumber: true,
      items: {
        select: {
          lines: {
            select: { lineTotal: true },
          },
        },
      },
    },
    orderBy: { stallNumber: "asc" },
  });

  const stallData = stalls.map((stall) => {
    let totalRevenue = 0;
    stall.items.forEach((item) => {
      item.lines.forEach((line) => {
        totalRevenue += line.lineTotal;
      });
    });
    return { ...stall, totalRevenue };
  });

  // Sort descending by revenue
  stallData.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalSystemRevenue = stallData.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Stalls Revenue Evaluation</h1>
        <p className="mt-1 text-sm text-ink/70">
          Total system revenue: <span className="font-semibold text-ink">{formatMoneyMinor(totalSystemRevenue)}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary/25 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-peach/30 border-b border-secondary/25 text-xs text-ink/75">
            <tr>
              <th className="px-4 py-3 font-semibold">Stall</th>
              <th className="px-4 py-3 text-right font-semibold">Total Revenue</th>
              <th className="px-4 py-3 text-right font-semibold">Revenue Share</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/15">
            {stallData.map((s) => {
              const ratio = totalSystemRevenue > 0 ? (s.totalRevenue / totalSystemRevenue) * 100 : 0;
              return (
                <tr key={s.id} className="hover:bg-peach/10 transition-colors">
                  <td className="w-full max-w-0 px-4 py-3 align-top">
                    <p className="truncate font-medium text-primary">
                      {s.stallName || `Stall #${s.stallNumber}`}
                    </p>
                    <p className="truncate text-xs text-ink/65">
                      Stall #{s.stallNumber ?? "?"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right align-top tabular-nums font-medium text-ink">
                    {formatMoneyMinor(s.totalRevenue)}
                  </td>
                  <td className="px-4 py-3 text-right align-top tabular-nums text-ink/80">
                    {ratio.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link
                      href={`/admin/stalls/${s.id}`}
                      className="inline-block rounded-md bg-white border border-secondary/30 px-3 py-1.5 text-xs font-medium text-primary shadow-sm hover:bg-peach/20"
                    >
                      Invoices
                    </Link>
                  </td>
                </tr>
              );
            })}
            {stallData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/60">
                  No stalls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
