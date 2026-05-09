"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";

type AuthState = "loading" | "guest" | "admin";

export function SiteHeader() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!isMounted) return;
        if (!res.ok) {
          setAuthState("guest");
          return;
        }

        const data = (await res.json()) as { role?: string };
        setAuthState(data.role === "admin" ? "admin" : "guest");
      } catch {
        if (isMounted) setAuthState("guest");
      }
    }

    void loadMe();

    function handleAuthChanged() {
      void loadMe();
    }

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-stone-900/10 bg-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-semibold tracking-tight text-stone-900">
          Yoga Land
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-full border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Home
          </Link>

          {authState === "admin" ? (
            <>
              <Link
                href="/admin"
                className="rounded-full border border-amber-600 px-3 py-1.5 font-medium text-amber-700 transition hover:bg-amber-50"
              >
                Admin
              </Link>
              <LogoutButton />
            </>
          ) : authState === "guest" ? (
            <Link
              href="/login"
              className="rounded-full border border-stone-900 px-3 py-1.5 font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              Log in
            </Link>
          ) : (
            <span className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-400">
              Checking...
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
