import { cookies } from "next/headers";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { getUserByLogin } from "@/lib/repositories";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<LoginBody>(request);
  if (!body?.login || !body?.password) {
    return fail("Требуются логин и пароль", 400);
  }

  const user = await getUserByLogin(body.login);
  if (!user) {
    return fail("Неверные учетные данные", 401);
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return fail("Неверные учетные данные", 401);
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return ok({ ok: true });
}
