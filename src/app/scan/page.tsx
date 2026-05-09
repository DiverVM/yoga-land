import Link from "next/link";
import { QrScanner } from "@/components/qr-scanner";
import { t } from "@/i18n";

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-amber-50 px-4 py-24">
      <main className="mx-auto w-full max-w-lg space-y-6">
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800"
          >
            ← {t("common.back")}
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">
            {t("scan.title")}
          </h1>
          <p className="text-sm text-stone-600">{t("scan.subtitle")}</p>
        </header>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl">
          <QrScanner />
        </div>
      </main>
    </div>
  );
}
