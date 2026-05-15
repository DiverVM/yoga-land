import Link from "next/link";
import { notFound } from "next/navigation";
import { QrDecisionPanel } from "@/components/qr-decision-panel";
import { t } from "@/i18n";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getQrRecordById, getTransactionById } from "@/lib/repositories";

function localizeStatus(value: string) {
  const map: Record<string, string> = {
    pending: t("admin.pending"),
    success: t("admin.success"),
    failed: t("admin.failed"),
    accepted: t("admin.accepted"),
    declined: t("admin.declined"),
  };

  return map[value] ?? value;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QrDetailsPage({ params }: Props) {
  const { id } = await params;
  const qrRecord = await getQrRecordById(id);
  if (!qrRecord) {
    notFound();
  }

  const transaction = await getTransactionById(qrRecord.transactionId);
  if (!transaction) {
    notFound();
  }

  let decodedPayload: Record<string, unknown> | null = null;
  try {
    decodedPayload = JSON.parse(qrRecord.payload) as Record<string, unknown>;
  } catch {
    decodedPayload = null;
  }

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-24">
      <main className="mx-auto w-full max-w-4xl space-y-5 rounded-3xl bg-white p-6 shadow-xl">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-stone-900">
            {t("qrDetails.title")}
          </h1>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 p-4 overflow-x-auto">
            <div className="min-w-[20rem] space-y-2">
              <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
                {t("qrDetails.transactionInfo")}
              </h2>
              <p className="text-sm text-stone-900 whitespace-nowrap">
                {t("qrDetails.productId")}: {transaction.productId}
              </p>
              <p className="text-sm text-stone-900 whitespace-nowrap">
                {t("qrDetails.amount")}:{" "}
                {formatMoney(transaction.amount, transaction.currencyCode)}
              </p>
              <p className="text-sm text-stone-900 whitespace-nowrap">
                {t("qrDetails.paymentStatus")}:{" "}
                {localizeStatus(transaction.paymentStatus)}
              </p>
              <p className="text-sm text-stone-900 whitespace-nowrap">
                {t("qrDetails.created")}:{" "}
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 p-4 overflow-x-auto">
            <div className="min-w-[20rem] space-y-2">
              <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
                {t("qrDetails.decodedPayload")}
              </h2>
              {decodedPayload ? (
                <pre className="max-h-56 overflow-auto rounded-lg bg-stone-100 p-3 text-xs text-stone-700">
                  {JSON.stringify(decodedPayload, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-red-700">
                  {t("qrDetails.decodeFailed")}
                </p>
              )}
            </div>
          </div>
        </section>

        <QrDecisionPanel
          qrId={qrRecord.id}
          initialStatus={qrRecord.decisionStatus}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/dashboard" className="btn-secondary px-4 py-2 text-sm">
            {t("qrDetails.backToAdmin")}
          </Link>
          <Link href="/" className="btn-secondary px-4 py-2 text-sm">
            {t("common.backToLanding")}
          </Link>
        </div>
      </main>
    </div>
  );
}
