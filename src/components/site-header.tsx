import Link from "next/link";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/logout-button";
import { t } from "@/i18n";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function SiteHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAdmin = session?.role === "admin";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-stone-900/10 bg-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-semibold tracking-tight text-stone-900">
          {t("brand")}
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-100"
          >
            {t("common.home")}
          </Link>

          {isAdmin ? (
            <>
              <Link
                href="/scan"
                className="rounded-full border border-amber-600 px-3 py-1.5 font-medium text-amber-700 transition hover:bg-amber-50"
              >
                {t("header.scanQr")}
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-amber-600 px-3 py-1.5 font-medium text-amber-700 transition hover:bg-amber-50"
              >
                {t("header.admin")}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-stone-900 px-3 py-1.5 font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              {t("common.login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
