import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";
const localFallbackUrl = `file:${process.cwd()}/data/app.db`;
const configuredUrl = process.env.DATABASE_URL?.trim();

if ((isProduction || isVercel) && !configuredUrl) {
  throw new Error(
    "DATABASE_URL is required in production/Vercel. Refusing to fall back to local SQLite.",
  );
}

const databaseUrl = configuredUrl || localFallbackUrl;

if ((isProduction || isVercel) && databaseUrl.startsWith("file:")) {
  throw new Error(
    "DATABASE_URL points to a local file in production/Vercel. Set Turso/libSQL URL instead.",
  );
}

const authToken = process.env.DATABASE_AUTH_TOKEN;

if (
  (isProduction || isVercel) &&
  databaseUrl.startsWith("libsql://") &&
  !authToken
) {
  throw new Error(
    "DATABASE_AUTH_TOKEN is required for libsql:// connections in production/Vercel.",
  );
}

const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(client, { schema });
