"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth";
import { getUserByLogin } from "@/lib/repositories";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";
import { t } from "@/i18n";

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const login = formData.get("login");
  const password = formData.get("password");

  if (
    typeof login !== "string" ||
    typeof password !== "string" ||
    !login ||
    !password
  ) {
    return { error: t("login.failed") };
  }

  const user = await getUserByLogin(login);
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : false;
  if (!user || !valid) {
    return { error: t("login.failed") };
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

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
