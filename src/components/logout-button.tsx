import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/i18n";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn-secondary px-3 py-1.5 text-sm">
        {t("common.logout")}
      </button>
    </form>
  );
}
