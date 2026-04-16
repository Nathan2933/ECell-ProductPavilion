import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

async function logoutAction() {
  "use server";
  const { getSession } = await import("@/lib/session");
  const s = await getSession();
  s.destroy();
  redirect("/");
}

export async function SiteHeader() {
  const session = await getSession();
  const u = session.user;

  return (
    <header className="bg-primary text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <Image
            src="/logo/logo.png"
            alt="Product Pavilion"
            width={160}
            height={40}
            className="h-8 w-auto max-h-9 object-contain sm:h-9"
            priority
          />
          <span className="leading-tight">
            <span className="block text-base font-semibold tracking-tight sm:text-lg">Product Pavilion</span>
            <span className="block text-[10px] font-normal text-white/80 sm:text-[11px]">E-Cell, TCE</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          {u ? (
            <>
              {u.role === "STALL" && (
                <>
                  <Link href="/scan" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Scan QR
                  </Link>
                  <Link href="/stall" className="rounded-md px-2 py-1 hover:bg-white/10">
                    My stall
                  </Link>
                </>
              )}
              {u.role === "ADMIN" && (
                <>
                  <Link href="/admin" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Billing
                  </Link>
                  <Link href="/admin/invoices" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Invoices
                  </Link>
                  <Link href="/admin/stalls" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Stalls
                  </Link>
                </>
              )}
              <span className="max-w-[14rem] truncate text-white/85">
                {u.role === "STALL"
                  ? `${u.stallName ?? "Stall"} · #${u.stallNumber ?? "?"}`
                  : (u.email ?? "Admin")}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-white/40 bg-white/10 px-3 py-1.5 hover:bg-white/20"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-2 py-1 hover:bg-white/10">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-orange px-3 py-1.5 font-medium text-white shadow hover:opacity-95"
              >
                Register stall
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
