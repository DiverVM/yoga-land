"use client";

import { useRouter } from "next/navigation";
import { t } from "@/i18n";

type LogoutButtonProps = {
  onLoggedOut?: () => void;
};

export function LogoutButton({ onLoggedOut }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth-changed"));
    onLoggedOut?.();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-secondary px-3 py-1.5 text-sm"
    >
      {t("common.logout")}
    </button>
  );
}
