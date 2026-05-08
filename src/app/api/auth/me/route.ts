import { cookies } from "next/headers";
import { fail, ok } from "@/lib/api";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return fail("Unauthorized", 401);
  }

  return ok({ role: session.role });
}
