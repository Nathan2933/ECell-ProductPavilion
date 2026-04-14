# ECell: Product Pavilion

Stall registration (numbers 1–30), menus, admin billing with PDF invoices and one-time QR redemption — built for **E-Cell, TCE**.

## Quick start

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure `.env` (see comments there) for database, session secret, `NEXT_PUBLIC_APP_URL`, and optional Gmail SMTP.

## Stack

Next.js, Prisma (SQLite), Tailwind CSS.

## License

Use for your event as needed.
