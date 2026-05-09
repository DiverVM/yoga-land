import Link from "next/link";
import { t } from "@/i18n";

type Props = {
  searchParams: Promise<{ transactionId?: string }>;
};

export default async function FailedPage({ searchParams }: Props) {
  const { transactionId } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-200 px-4 py-24">
      <main className="w-full max-w-xl space-y-5 rounded-3xl bg-white p-8 shadow-xl">
        <p className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold tracking-wide text-red-700 uppercase">
          {t("payment.failedBadge")}
        </p>
        <h1 className="text-3xl font-bold text-stone-900">
          {t("payment.failedTitle")}
        </h1>
        <p className="text-sm text-stone-600">
          {transactionId
            ? t("payment.transactionId", { id: transactionId })
            : t("payment.noTransactionId")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            {t("payment.tryAgain")}
          </Link>
        </div>
      </main>
    </div>
  );
}
