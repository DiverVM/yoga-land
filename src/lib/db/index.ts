import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ?? `file:${process.cwd()}/data/app.db`;
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(client, { schema });
