import Link from "next/link";
import {
  listEmailLogs,
  listQrRecords,
  listTransactions,
} from "@/lib/repositories";

export default async function AdminPage() {
  const [transactions, qrRecords, emailLogs] = await Promise.all([
    listTransactions(),
    listQrRecords(),
    listEmailLogs(),
  ]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffedd5_35%,_#fed7aa_70%,_#fdba74_100%)] px-4 py-10 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="relative rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Admin Debug</h1>
            <p className="text-sm text-stone-600">
              Persisted records from your database.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white"
          >
            Back to landing
          </Link>
          </div>
        </header>

        <section className="relative rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            Transactions ({transactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-stone-500">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Product</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2">QR</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-t border-stone-200"
                  >
                    <td className="py-2 pr-3 text-xs">{transaction.id}</td>
                    <td className="py-2">{transaction.productId}</td>
                    <td className="py-2">
                      ${transaction.amount} {transaction.currency}
                    </td>
                    <td className="py-2">{transaction.paymentStatus}</td>
                    <td className="py-2">{transaction.qrId ?? "-"}</td>
                    <td className="py-2 text-xs text-stone-500">
                      {transaction.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            QR Records ({qrRecords.length})
          </h2>
          <div className="space-y-3">
            {qrRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-stone-200 bg-white p-3"
              >
                <p className="text-xs text-stone-500">ID: {record.id}</p>
                <p className="text-sm">Transaction: {record.transactionId}</p>
                <p className="text-sm">Decision: {record.decisionStatus}</p>
                <p className="truncate text-xs text-stone-500">
                  URL: {record.qrUrl}
                </p>
                <Link
                  href={`/qr/${record.id}`}
                  className="mt-2 inline-block text-sm font-medium text-amber-700 underline"
                >
                  Open details
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            Email Logs ({emailLogs.length})
          </h2>
          <div className="space-y-2">
            {emailLogs.map((log) => (
              <p
                key={log.id}
                className="rounded-lg border border-stone-200 bg-white p-3 text-sm"
              >
                {log.createdAt} | {log.to} | QR {log.qrId} | {log.status}
              </p>
            ))}
            {emailLogs.length === 0 ? (
              <p className="text-sm text-stone-500">No email sends yet.</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
