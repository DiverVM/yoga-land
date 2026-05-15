import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { t } from "@/i18n";

export default function LoginPage() {
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

        <LoginForm />

        <div className="text-center text-sm">
          <Link href="/" className="link-strong">
            {t("login.backHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
