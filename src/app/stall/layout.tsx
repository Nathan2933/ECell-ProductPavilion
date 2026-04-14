import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function StallLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  if (session.user.role !== "STALL") redirect("/admin");
  return children;
}
