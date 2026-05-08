import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? `file:${process.cwd()}/data/app.db`;
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url, authToken },
});
