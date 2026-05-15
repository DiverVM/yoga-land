import Link from "next/link";
import { BulkSendForm } from "@/components/bulk-send-form";
import { t } from "@/i18n";
import { getAllProducts } from "@/lib/repositories";

export const runtime = "nodejs";

export default async function BulkSendPage() {
  const products = await getAllProducts();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff7ed_0%,#ffedd5_35%,#fed7aa_70%,#fdba74_100%)] px-4 py-24 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-3 inline-block rounded-full border border-stone-900/20 bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
                {t("bulkSend.badge")}
              </p>
              <h1 className="text-3xl font-bold text-stone-900">
                {t("bulkSend.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                {t("bulkSend.subtitle")}
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="btn-secondary px-4 py-2 text-sm"
            >
              {t("admin.backToDashboard")}
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-800/10 bg-white/85 p-5 shadow-lg shadow-stone-900/5 md:p-6">
          <BulkSendForm products={products} />
        </section>
      </main>
    </div>
  );
}
