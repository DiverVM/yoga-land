"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";

type MobileHeaderMenuToggleProps = {
  children: React.ReactNode;
};

export function MobileHeaderMenuToggle({
  children,
}: MobileHeaderMenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", onEscape);
      return () => {
        window.removeEventListener("keydown", onEscape);
      };
    }
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="btn-secondary inline-flex h-10 w-10 items-center justify-center md:hidden"
        aria-label={isOpen ? t("header.closeMenu") : t("header.openMenu")}
        aria-expanded={isOpen}
        aria-controls="mobile-header-menu"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="text-lg leading-none">{isOpen ? "X" : "="}</span>
      </button>

      {isOpen ? (
        <div
          id="mobile-header-menu"
          className="absolute left-0 right-0 top-full z-50 border-b border-stone-900/10 bg-white p-4 shadow-lg md:hidden"
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
