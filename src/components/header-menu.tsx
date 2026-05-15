import Link from "next/link";
import { MobileHeaderMenuToggle } from "@/components/mobile-header-menu-toggle";
import { LogoutButton } from "@/components/logout-button";
import { t } from "@/i18n";

type HeaderMenuProps = {
  isAdmin: boolean;
};

export function HeaderMenu({ isAdmin }: HeaderMenuProps) {
  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        {isAdmin ? (
          <Link href="/admin/scan" className="btn-secondary px-3 py-2 text-sm">
            {t("header.scanQr")}
          </Link>
        ) : null}
        <MobileHeaderMenuToggle>
          <nav className="flex flex-col gap-2 text-sm">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/scan"
                  className="btn-secondary px-3 py-2 text-center"
                >
                  {t("header.scanQr")}
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="btn-secondary px-3 py-2 text-center"
                >
                  {t("header.admin")}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="btn-secondary px-3 py-2 text-center"
              >
                {t("common.login")}
              </Link>
            )}
          </nav>
        </MobileHeaderMenuToggle>
      </div>

      <nav className="hidden items-center gap-2 text-sm md:flex">
        {isAdmin ? (
          <>
            <Link href="/admin/scan" className="btn-secondary px-3 py-1.5">
              {t("header.scanQr")}
            </Link>
            <Link href="/admin/dashboard" className="btn-secondary px-3 py-1.5">
              {t("header.admin")}
            </Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login" className="btn-secondary px-3 py-1.5">
            {t("common.login")}
          </Link>
        )}
      </nav>
    </>
  );
}
