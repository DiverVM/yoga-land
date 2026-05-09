import Link from "next/link";
import { cookies } from "next/headers";
import { HeaderMenu } from "@/components/header-menu";
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
        <div className="flex items-baseline gap-2">
          <Link
            href="/"
            className="font-semibold tracking-tight text-stone-900"
          >
            {t("brand")}
          </Link>
          <span className="hidden text-xs text-stone-400 sm:inline">
            v{process.env.NEXT_PUBLIC_APP_VERSION}{" "}
            <span className="font-mono">{process.env.NEXT_PUBLIC_GIT_SHA}</span>
          </span>
        </div>

        <HeaderMenu isAdmin={isAdmin} />
      </div>
    </header>
  );
}
