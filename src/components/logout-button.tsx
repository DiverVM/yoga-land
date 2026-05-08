"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
    >
      Log out
    </button>
  );
}
