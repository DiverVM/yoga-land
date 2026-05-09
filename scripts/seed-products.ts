/**
 * Idempotent seed: upserts default products.
 * Run via: npm run db:seed:products
 */
import { db } from "../src/lib/db";
import { products } from "../src/lib/db/schema";

type SeedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "BYN";
  active: boolean;
};

const seedProducts: SeedProduct[] = [
  {
    id: "starter-pass",
    name: "Стартовый абонемент",
    description:
      "Отличный старт в мире йоги. Подходит новичкам, которые хотят начать регулярную практику.",
    price: 19,
    currency: "BYN",
    active: true,
  },
  {
    id: "full-retreat",
    name: "Ретрит выходного дня",
    description:
      "Двухдневный ретрит для глубокого погружения в практику и восстановления баланса.",
    price: 79,
    currency: "BYN",
    active: true,
  },
  {
    id: "premium-plan",
    name: "Премиум-план на месяц",
    description:
      "Безлимитные занятия на целый месяц. Полный доступ к возможностям Yoga Land.",
    price: 129,
    currency: "BYN",
    active: true,
  },
];

async function seed() {
  const now = new Date().toISOString();

  await Promise.all(
    seedProducts.map(async (product) => {
      await db
        .insert(products)
        .values({
          ...product,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            active: product.active,
            updatedAt: now,
          },
        })
        .run();
    }),
  );

  console.log(`Products seeded: ${seedProducts.length}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
