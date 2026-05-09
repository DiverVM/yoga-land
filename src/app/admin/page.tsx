import Link from "next/link";
import {
  getAllProducts,
  listEmailLogsPaginated,
  listQrRecordsPaginated,
  listTransactionsPaginated,
} from "@/lib/repositories";
import { isDecisionStatus, isPaymentStatus } from "@/lib/validation";

type AdminSearchParams = {
  txPage?: string;
  txStatus?: string;
  qrPage?: string;
  qrDecision?: string;
  emailPage?: string;
  emailStatus?: string;
};

function parsePage(v?: string) {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function adminHref(
  current: AdminSearchParams,
  overrides: Partial<AdminSearchParams>,
): string {
  const merged = { ...current, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== "1") {
      qs.set(k, v);
    } else if (
      v === "1" &&
      (k === "txPage" || k === "qrPage" || k === "emailPage")
    ) {
      // omit page=1 to keep URLs clean
    } else if (v !== undefined && v !== "") {
      qs.set(k, v);
    }
  }
  const str = qs.toString();
  return `/admin${str ? `?${str}` : ""}`;
}

function Pagination({
  page,
  totalPages,
  pageParam,
  current,
}: {
  page: number;
  totalPages: number;
  pageParam: keyof AdminSearchParams;
  current: AdminSearchParams;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center gap-3 text-sm">
      {page > 1 ? (
        <Link
          href={adminHref(current, { [pageParam]: String(page - 1) })}
          className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100"
        >
          ← Prev
        </Link>
      ) : (
        <span className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-400">
          ← Prev
        </span>
      )}
      <span className="text-stone-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={adminHref(current, { [pageParam]: String(page + 1) })}
          className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100"
        >
          Next →
        </Link>
      ) : (
        <span className="rounded-lg border border-stone-200 px-3 py-1.5 text-stone-400">
          Next →
        </span>
      )}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  const txPage = parsePage(params.txPage);
  const qrPage = parsePage(params.qrPage);
  const emailPage = parsePage(params.emailPage);

  const txStatus = isPaymentStatus(params.txStatus)
    ? params.txStatus
    : undefined;
  const qrDecision = isDecisionStatus(params.qrDecision)
    ? params.qrDecision
    : undefined;
  const emailStatus =
    params.emailStatus === "sent" || params.emailStatus === "failed"
      ? params.emailStatus
      : undefined;

  const current: AdminSearchParams = {
    txPage: String(txPage),
    txStatus,
    qrPage: String(qrPage),
    qrDecision,
    emailPage: String(emailPage),
    emailStatus,
  };

  const [txResult, qrResult, emailResult, allProducts] = await Promise.all([
    listTransactionsPaginated({ page: txPage, paymentStatus: txStatus }),
    listQrRecordsPaginated({ page: qrPage, decisionStatus: qrDecision }),
    listEmailLogsPaginated({ page: emailPage, status: emailStatus }),
    getAllProducts(),
  ]);

  const productNames = new Map(allProducts.map((p) => [p.id, p.name]));

  const txTotalPages = Math.ceil(txResult.total / txResult.limit) || 1;
  const qrTotalPages = Math.ceil(qrResult.total / qrResult.limit) || 1;
  const emailTotalPages = Math.ceil(emailResult.total / emailResult.limit) || 1;

  const statusBadge: Record<string, string> = {
    pending: "bg-stone-100 text-stone-700",
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    sent: "bg-green-100 text-green-700",
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff7ed_0%,#ffedd5_35%,#fed7aa_70%,#fdba74_100%)] px-4 py-24 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="relative rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Admin Panel</h1>
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

        {/* ── Transactions ─────────────────────────────────────────────── */}
        <section className="relative rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-900">
              Transactions ({txResult.total})
            </h2>
            <form method="GET" className="flex items-center gap-2 text-sm">
              <input type="hidden" name="txPage" value="1" />
              <input type="hidden" name="qrPage" value={String(qrPage)} />
              {qrDecision && (
                <input type="hidden" name="qrDecision" value={qrDecision} />
              )}
              <input type="hidden" name="emailPage" value={String(emailPage)} />
              {emailStatus && (
                <input type="hidden" name="emailStatus" value={emailStatus} />
              )}
              <select
                name="txStatus"
                defaultValue={txStatus ?? ""}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none ring-orange-500 focus:ring"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium hover:bg-stone-100"
              >
                Filter
              </button>
              {txStatus && (
                <Link
                  href={adminHref(current, {
                    txStatus: undefined,
                    txPage: "1",
                  })}
                  className="text-xs text-stone-500 underline"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">QR</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {txResult.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 text-center text-sm text-stone-400"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : null}
                {txResult.data.map((tx) => (
                  <tr key={tx.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3 font-mono text-xs text-stone-400">
                      {tx.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3">
                      {productNames.get(tx.productId) ?? tx.productId}
                    </td>
                    <td className="py-2 pr-3">
                      ${tx.amount} {tx.currency}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[tx.paymentStatus] ?? "bg-stone-100 text-stone-600"}`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {tx.qrId ? (
                        <Link
                          href={`/qr/${tx.qrId}`}
                          className="font-mono text-xs text-amber-700 underline"
                        >
                          {tx.qrId.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-stone-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={txPage}
            totalPages={txTotalPages}
            pageParam="txPage"
            current={current}
          />
        </section>

        {/* ── QR Records ───────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-900">
              QR Records ({qrResult.total})
            </h2>
            <form method="GET" className="flex items-center gap-2 text-sm">
              <input type="hidden" name="txPage" value={String(txPage)} />
              {txStatus && (
                <input type="hidden" name="txStatus" value={txStatus} />
              )}
              <input type="hidden" name="qrPage" value="1" />
              <input type="hidden" name="emailPage" value={String(emailPage)} />
              {emailStatus && (
                <input type="hidden" name="emailStatus" value={emailStatus} />
              )}
              <select
                name="qrDecision"
                defaultValue={qrDecision ?? ""}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none ring-orange-500 focus:ring"
              >
                <option value="">All decisions</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium hover:bg-stone-100"
              >
                Filter
              </button>
              {qrDecision && (
                <Link
                  href={adminHref(current, {
                    qrDecision: undefined,
                    qrPage: "1",
                  })}
                  className="text-xs text-stone-500 underline"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Transaction</th>
                  <th className="py-2 pr-3">Decision</th>
                  <th className="py-2 pr-3">Decided at</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2">Link</th>
                </tr>
              </thead>
              <tbody>
                {qrResult.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 text-center text-sm text-stone-400"
                    >
                      No QR records found.
                    </td>
                  </tr>
                ) : null}
                {qrResult.data.map((qr) => (
                  <tr key={qr.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3 font-mono text-xs text-stone-400">
                      {qr.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-stone-500">
                      {qr.transactionId.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[qr.decisionStatus] ?? "bg-stone-100 text-stone-600"}`}
                      >
                        {qr.decisionStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-stone-500">
                      {qr.decisionAt
                        ? new Date(qr.decisionAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-stone-500">
                      {new Date(qr.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/qr/${qr.id}`}
                        className="text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={qrPage}
            totalPages={qrTotalPages}
            pageParam="qrPage"
            current={current}
          />
        </section>

        {/* ── Email Logs ───────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-stone-800/10 bg-white/85 p-4 shadow-lg shadow-stone-900/5 md:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-900">
              Email Logs ({emailResult.total})
            </h2>
            <form method="GET" className="flex items-center gap-2 text-sm">
              <input type="hidden" name="txPage" value={String(txPage)} />
              {txStatus && (
                <input type="hidden" name="txStatus" value={txStatus} />
              )}
              <input type="hidden" name="qrPage" value={String(qrPage)} />
              {qrDecision && (
                <input type="hidden" name="qrDecision" value={qrDecision} />
              )}
              <input type="hidden" name="emailPage" value="1" />
              <select
                name="emailStatus"
                defaultValue={emailStatus ?? ""}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none ring-orange-500 focus:ring"
              >
                <option value="">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium hover:bg-stone-100"
              >
                Filter
              </button>
              {emailStatus && (
                <Link
                  href={adminHref(current, {
                    emailStatus: undefined,
                    emailPage: "1",
                  })}
                  className="text-xs text-stone-500 underline"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2 pr-3">Recipient</th>
                  <th className="py-2 pr-3">QR</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {emailResult.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-sm text-stone-400"
                    >
                      No email logs found.
                    </td>
                  </tr>
                ) : null}
                {emailResult.data.map((log) => (
                  <tr key={log.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3">{log.to}</td>
                    <td className="py-2 pr-3">
                      <Link
                        href={`/qr/${log.qrId}`}
                        className="font-mono text-xs text-amber-700 underline underline-offset-2"
                      >
                        {log.qrId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[log.status] ?? "bg-stone-100 text-stone-600"}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-stone-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={emailPage}
            totalPages={emailTotalPages}
            pageParam="emailPage"
            current={current}
          />
        </section>
      </main>
    </div>
  );
}
