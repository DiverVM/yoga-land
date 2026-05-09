import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrActions } from "@/components/qr-actions";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import { getQrRecordById, getTransactionById } from "@/lib/repositories";
import { toQrDataUrl } from "@/lib/qr-service";

type Props = {
  searchParams: Promise<{ transactionId?: string; qrId?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const { transactionId, qrId } = await searchParams;
  if (!transactionId || !qrId) {
    notFound();
  }

  const [transaction, qrRecord] = await Promise.all([
    getTransactionById(transactionId),
    getQrRecordById(qrId),
  ]);

  if (!transaction || !qrRecord) {
    notFound();
  }

  const qrDataUrl = await toQrDataUrl(qrRecord.qrUrl);

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-24">
      <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
        <header className="space-y-2">
          <p className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold tracking-wide text-green-700 uppercase">
            {t("payment.successBadge")}
          </p>
          <h1 className="text-3xl font-bold text-stone-900">
            {t("payment.successTitle")}
          </h1>
          <p className="text-sm text-stone-600">
            {t("payment.transactionFor", {
              id: transaction.id,
              amount: formatMoney(transaction.amount, transaction.currency),
            })}
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="rounded-2xl border border-stone-200 p-4">
            <Image
              src={qrDataUrl}
              alt="Generated QR code"
              width={220}
              height={220}
              className="h-auto w-full"
              unoptimized
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-stone-700">{t("payment.qrOpensUrl")}</p>
            <p className="break-all rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
              {qrRecord.qrUrl}
            </p>
            <QrActions qrId={qrRecord.id} qrUrl={qrRecord.qrUrl} />
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/qr/${qrRecord.id}`}
            className="rounded-lg border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white"
          >
            {t("payment.openQrDetails")}
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            {t("common.backToLanding")}
          </Link>
        </div>
      </main>
    </div>
  );
}
