import Link from "next/link";
import { notFound } from "next/navigation";
import { QrDecisionPanel } from "@/components/qr-decision-panel";
import { getQrRecordById, getTransactionById } from "@/lib/repositories";

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
          <h1 className="text-3xl font-bold text-stone-900">QR Details</h1>
          <p className="text-sm text-stone-600">
            QR record {qrRecord.id} linked to transaction {transaction.id}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
              Transaction info
            </h2>
            <p className="text-sm">Product ID: {transaction.productId}</p>
            <p className="text-sm">
              Amount: ${transaction.amount} {transaction.currency}
            </p>
            <p className="text-sm">
              Payment status: {transaction.paymentStatus}
            </p>
            <p className="text-sm">Created: {transaction.createdAt}</p>
          </div>

          <div className="space-y-2 rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
              Decoded QR payload
            </h2>
            {decodedPayload ? (
              <pre className="max-h-56 overflow-auto rounded-lg bg-stone-100 p-3 text-xs text-stone-700">
                {JSON.stringify(decodedPayload, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-red-700">
                Unable to decode payload JSON.
              </p>
            )}
            <p className="text-xs text-stone-500">QR URL: {qrRecord.qrUrl}</p>
          </div>
        </section>

        <QrDecisionPanel
          qrId={qrRecord.id}
          initialStatus={qrRecord.decisionStatus}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white"
          >
            Back to admin panel
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Back to landing
          </Link>
        </div>
      </main>
    </div>
  );
}
