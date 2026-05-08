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
    <div className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin Debug</h1>
            <p className="text-sm text-stone-400">
              Persisted records from JSON mock database.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-medium transition hover:bg-stone-800"
          >
            Back to landing
          </Link>
        </header>

        <section className="space-y-3 rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <h2 className="text-xl font-semibold">
            Transactions ({transactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-stone-400">
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
                    className="border-t border-stone-800"
                  >
                    <td className="py-2 pr-3 text-xs">{transaction.id}</td>
                    <td className="py-2">{transaction.productId}</td>
                    <td className="py-2">
                      ${transaction.amount} {transaction.currency}
                    </td>
                    <td className="py-2">{transaction.paymentStatus}</td>
                    <td className="py-2">{transaction.qrId ?? "-"}</td>
                    <td className="py-2 text-xs text-stone-400">
                      {transaction.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <h2 className="text-xl font-semibold">
            QR Records ({qrRecords.length})
          </h2>
          <div className="space-y-3">
            {qrRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-stone-800 bg-stone-950 p-3"
              >
                <p className="text-xs text-stone-400">ID: {record.id}</p>
                <p className="text-sm">Transaction: {record.transactionId}</p>
                <p className="text-sm">Decision: {record.decisionStatus}</p>
                <p className="truncate text-xs text-stone-400">
                  URL: {record.qrUrl}
                </p>
                <Link
                  href={`/qr/${record.id}`}
                  className="mt-2 inline-block text-sm text-orange-300 underline"
                >
                  Open details
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <h2 className="text-xl font-semibold">
            Email Logs ({emailLogs.length})
          </h2>
          <div className="space-y-2">
            {emailLogs.map((log) => (
              <p key={log.id} className="rounded-lg bg-stone-950 p-3 text-sm">
                {log.createdAt} | {log.to} | QR {log.qrId} | {log.status}
              </p>
            ))}
            {emailLogs.length === 0 ? (
              <p className="text-sm text-stone-400">No email sends yet.</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
