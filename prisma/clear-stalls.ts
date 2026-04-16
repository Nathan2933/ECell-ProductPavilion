import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stalls = await prisma.user.findMany({
    where: { role: "STALL" },
    select: { id: true, stallNumber: true, stallName: true },
  });

  if (stalls.length === 0) {
    console.log("No stall accounts found.");
    return;
  }

  const stallIds = stalls.map((s) => s.id);
  const items = await prisma.item.findMany({
    where: { userId: { in: stallIds } },
    select: { id: true },
  });
  const itemIds = items.map((i) => i.id);

  let linesRemoved = 0;
  if (itemIds.length > 0) {
    const r = await prisma.invoiceLine.deleteMany({
      where: { itemId: { in: itemIds } },
    });
    linesRemoved = r.count;
  }

  const inv = await prisma.invoice.deleteMany({
    where: { lines: { none: {} } },
  });

  const users = await prisma.user.deleteMany({
    where: { role: "STALL" },
  });

  console.log(
    `Removed ${stalls.length} stall account(s), ${items.length} menu item(s), ${linesRemoved} invoice line(s), ${inv.count} empty invoice(s).`
  );
  stalls.forEach((s) => {
    console.log(`  - Stall #${s.stallNumber ?? "?"} ${s.stallName ? `(${s.stallName})` : ""}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
