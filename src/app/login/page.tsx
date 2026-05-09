"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? t("login.failed"));
      }

      window.dispatchEvent(new Event("auth-changed"));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffedd5_35%,_#fed7aa_70%,_#fdba74_100%)] px-4 py-12 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />

      <main className="relative w-full max-w-sm space-y-6 rounded-3xl border border-stone-800/10 bg-white/85 p-8 shadow-2xl shadow-orange-950/20 backdrop-blur">
        <div className="space-y-3">
          <p className="inline-block rounded-full border border-stone-900/20 bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
            {t("login.badge")}
          </p>
          <h1 className="text-2xl font-bold text-stone-900">
            {t("login.title")}
          </h1>
          <p className="text-sm text-stone-600">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">
              {t("login.loginLabel")}
            </span>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full px-4 py-3 text-sm"
          >
            {isLoading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/" className="link-strong">
            {t("login.backHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
