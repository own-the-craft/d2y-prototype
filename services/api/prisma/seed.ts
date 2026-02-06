import "dotenv/config";
import { PrismaClient, Role, SlotType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function amsterdamYYYYMMDD(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(date);
}

async function upsertUser(email: string, role: Role, name: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, name },
    create: { email, passwordHash, role, name },
  });
}

async function main() {
  await upsertUser("consumer@demo.com", Role.CONSUMER, "Consumer Demo");
  const merchantUser = await upsertUser("merchant@demo.com", Role.MERCHANT, "Merchant Demo");
  await upsertUser("admin@demo.com", Role.ADMIN, "Admin Demo");
  await upsertUser("support@demo.com", Role.SUPPORT, "Support Demo");

  const merchant = await prisma.merchant.upsert({
    where: { id: "bakery-one" },
    update: {
      name: "Bakery One",
      active: true,
      addressJson: { city: "Amsterdam", country: "NL", street: "Bakerstraat", number: "1", postalCode: "1011AA" },
    },
    create: {
      id: "bakery-one",
      name: "Bakery One",
      active: true,
      addressJson: { city: "Amsterdam", country: "NL", street: "Bakerstraat", number: "1", postalCode: "1011AA" },
      openingHoursJson: {
        mon: "08:00-18:00",
        tue: "08:00-18:00",
        wed: "08:00-18:00",
        thu: "08:00-18:00",
        fri: "08:00-18:00",
        sat: "09:00-17:00",
        sun: "closed",
      },
    },
  });

  await prisma.merchantStaff.upsert({
    where: { userId_merchantId: { userId: merchantUser.id, merchantId: merchant.id } },
    update: {},
    create: { userId: merchantUser.id, merchantId: merchant.id },
  });

  await prisma.product.deleteMany({ where: { merchantId: merchant.id } });

  const products: Array<[string, number]> = [
    ["Sourdough Bread", 495],
    ["Baguette", 295],
    ["Croissant", 250],
    ["Pain au chocolat", 275],
    ["Cinnamon Roll", 325],
    ["Apple Pie Slice", 450],
    ["Cheesecake Slice", 475],
    ["Brownie", 325],
    ["Banana Bread", 395],
    ["Muffin Blueberry", 275],
    ["Muffin Chocolate", 275],
    ["Espresso", 220],
    ["Americano", 260],
    ["Cappuccino", 320],
    ["Latte", 350],
    ["Flat White", 350],
    ["Iced Latte", 380],
    ["Tea Earl Grey", 240],
    ["Tea Mint", 240],
    ["Orange Juice", 310],
    ["Sandwich Ham & Cheese", 525],
    ["Sandwich Veggie", 495],
    ["Quiche Lorraine Slice", 550],
    ["Quiche Veggie Slice", 550],
    ["Focaccia", 420],
    ["Brioche", 360],
    ["Donut", 290],
    ["Macaron (single)", 180],
    ["Macaron box (6)", 990],
    ["Granola Cup", 420],
  ];

  await prisma.product.createMany({
    data: products.map(([name, priceCents], i) => ({
      merchantId: merchant.id,
      name,
      description: "Demo product",
      priceCents,
      inStockBool: true,
      sku: `SKU-${i + 1}`,
      imageUrl: null,
    })),
  });

  const today = amsterdamYYYYMMDD(new Date());
  await prisma.slot.deleteMany({ where: { date: today } });

  await prisma.slot.createMany({
    data: [
      { date: today, type: SlotType.DELIVERY, startTime: "17:30", endTime: "22:00", capacity: 20, remaining: 20 },
      { date: today, type: SlotType.CNC, startTime: "17:30", endTime: "22:00", capacity: 20, remaining: 20 },
    ],
  });

  console.log("✅ Seed complete");
  console.log("Slots date:", today);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
