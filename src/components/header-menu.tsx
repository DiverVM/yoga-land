"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { t } from "@/i18n";

type HeaderMenuProps = {
  isAdmin: boolean;
};

export function HeaderMenu({ isAdmin }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        {isAdmin ? (
          <Link href="/scan" className="btn-secondary px-3 py-2 text-sm">
            {t("header.scanQr")}
          </Link>
        ) : null}
        <button
          type="button"
          className="btn-secondary inline-flex h-10 w-10 items-center justify-center"
          aria-label={isOpen ? t("header.closeMenu") : t("header.openMenu")}
          aria-expanded={isOpen}
          aria-controls="mobile-header-menu"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="text-lg leading-none">{isOpen ? "X" : "="}</span>
        </button>
      </div>

      <nav className="hidden items-center gap-2 text-sm md:flex">
        {isAdmin ? (
          <>
            <Link href="/scan" className="btn-secondary px-3 py-1.5">
              {t("header.scanQr")}
            </Link>
            <Link href="/admin" className="btn-secondary px-3 py-1.5">
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

      {isOpen ? (
        <div
          id="mobile-header-menu"
          className="absolute left-0 right-0 top-full z-50 border-b border-stone-900/10 bg-white p-4 shadow-lg md:hidden"
        >
          <nav className="flex flex-col gap-2 text-sm">
            {isAdmin ? (
              <>
                <Link
                  href="/scan"
                  className="btn-secondary px-3 py-2 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t("header.scanQr")}
                </Link>
                <Link
                  href="/admin"
                  className="btn-secondary px-3 py-2 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t("header.admin")}
                </Link>
                <LogoutButton onLoggedOut={() => setIsOpen(false)} />
              </>
            ) : (
              <Link
                href="/login"
                className="btn-secondary px-3 py-2 text-center"
                onClick={() => setIsOpen(false)}
              >
                {t("common.login")}
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
