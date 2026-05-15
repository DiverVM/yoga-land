"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { t } from "@/i18n";

type LoginFormState = { error?: string } | null;

export function LoginForm() {
  const [state, action, isPending] = useActionState<LoginFormState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {t("login.loginLabel")}
        </span>
        <input
          type="text"
          name="login"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {t("login.passwordLabel")}
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
        />
      </label>

      {state?.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full px-4 py-3 text-sm"
      >
        {isPending ? t("login.signingIn") : t("login.signIn")}
      </button>
    </form>
  );
}
