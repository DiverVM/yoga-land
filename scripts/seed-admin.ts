/**
 * Idempotent seed: creates the predefined admin user if it doesn't exist.
 * Run via:  npm run db:seed
 *
 * The DATABASE_URL / DATABASE_AUTH_TOKEN env vars are loaded by dotenv-cli
 * from .env.local before this script executes (see package.json).
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

async function seed() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.login, "admin"))
    .all();

  if (existing.length > 0) {
    console.log("Admin user already exists — skipping.");
    return;
  }

  const passwordHash = await hashPassword("admin");

  await db
    .insert(users)
    .values({
      id: randomUUID(),
      login: "admin",
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    })
    .run();

  console.log("Admin user created.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
