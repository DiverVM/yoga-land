import { cookies } from "next/headers";
import { ok } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return ok({ ok: true });
}
