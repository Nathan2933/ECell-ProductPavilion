import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Product Pavilion · E-Cell, TCE — override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in `.env`. */
const DEFAULT_ADMIN_EMAIL = "admin@productpavilion.tce";
const DEFAULT_ADMIN_PASSWORD = "Pavilion#ECell2026!TCE";

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const plainPassword = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const legacyEmail = "admin@event.local";
  const legacy = await prisma.user.findUnique({ where: { email: legacyEmail } });
  if (legacy?.role === "ADMIN") {
    const otherHasTargetEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: legacy.id } },
    });
    if (!otherHasTargetEmail) {
      await prisma.user.update({
        where: { id: legacy.id },
        data: { email, passwordHash },
      });
    } else {
      await prisma.user.update({
        where: { id: legacy.id },
        data: { passwordHash },
      });
    }
  }

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      stallName: null,
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin upserted: ${email}`);
  console.log("Password: set SEED_ADMIN_PASSWORD in .env, or use the default in prisma/seed.ts (not printed here).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
