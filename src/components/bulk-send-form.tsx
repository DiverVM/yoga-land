"use client";

import { useMemo, useState } from "react";
import { t } from "@/i18n";
import type { Product } from "@/lib/types";
import { validateBulkSendItems } from "@/lib/validation";

type BulkSendResponse = {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    email: string;
    ok: boolean;
    transactionId?: string;
    qrId?: string;
    error?: string;
  }>;
};

type BulkSendFormProps = {
  products: Product[];
};

type BulkSendRow = {
  email: string;
  productId: string;
  firstName: string;
  lastName: string;
};

const INITIAL_EMAIL_COUNT = 3;
const MIN_EMAIL_COUNT = 1;
const MAX_EMAIL_COUNT = 10;

function createInitialRows(defaultProductId: string): BulkSendRow[] {
  return Array.from({ length: INITIAL_EMAIL_COUNT }, () => ({
    email: "",
    productId: defaultProductId,
    firstName: "",
    lastName: "",
  }));
}

export function BulkSendForm({ products }: BulkSendFormProps) {
  const [rows, setRows] = useState<BulkSendRow[]>(() =>
    createInitialRows(products[0]?.id ?? ""),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSendResponse | null>(null);

  const defaultProductId = useMemo(() => products[0]?.id ?? "", [products]);

  function updateRow(index: number, field: keyof BulkSendRow, value: string) {
    setRows((current) =>
      current.map((row, currentIndex) =>
        currentIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addEmailInput() {
    setRows((current) =>
      current.length >= MAX_EMAIL_COUNT
        ? current
        : [
            ...current,
            {
              email: "",
              productId: defaultProductId,
              firstName: "",
              lastName: "",
            },
          ],
    );
  }

  function removeEmailInput(index: number) {
    setRows((current) =>
      current.length <= MIN_EMAIL_COUNT
        ? current
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const validation = validateBulkSendItems(rows);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/bulk-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: validation.items,
        }),
      });

      const data = (await response.json()) as BulkSendResponse & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.details ?? data.error ?? t("bulkSend.error"));
      }

      setResult(data);
      setRows(createInitialRows(defaultProductId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("bulkSend.error"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">
          {t("bulkSend.emails")}
        </h2>
        <button
          type="button"
          className="btn-secondary px-4 py-2"
          onClick={addEmailInput}
          disabled={rows.length >= MAX_EMAIL_COUNT}
        >
          {t("bulkSend.addEmail")}
        </button>
      </div>

      <p className="text-xs text-stone-500">{t("bulkSend.resetHint")}</p>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_minmax(9rem,12rem)_minmax(12rem,16rem)_auto] md:items-center"
          >
            <label className="block">
              <input
                id={`bulk-email-${index}`}
                type="email"
                value={row.email}
                onChange={(event) =>
                  updateRow(index, "email", event.target.value)
                }
                placeholder={`email${index + 1}@example.com`}
                aria-label={`Email ${index + 1}`}
                className="w-full min-w-0 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
                required
              />
            </label>

            <label className="block">
              <input
                id={`bulk-first-name-${index}`}
                type="text"
                value={row.firstName}
                onChange={(event) =>
                  updateRow(index, "firstName", event.target.value)
                }
                placeholder={t("bulkSend.firstName")}
                aria-label={`${t("bulkSend.firstName")} ${index + 1}`}
                className="w-full min-w-0 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
              />
            </label>

            <label className="block">
              <input
                id={`bulk-last-name-${index}`}
                type="text"
                value={row.lastName}
                onChange={(event) =>
                  updateRow(index, "lastName", event.target.value)
                }
                placeholder={t("bulkSend.lastName")}
                aria-label={`${t("bulkSend.lastName")} ${index + 1}`}
                className="w-full min-w-0 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
              />
            </label>

            <label className="block space-y-2">
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-orange-500 transition focus:ring"
                value={row.productId}
                onChange={(event) =>
                  updateRow(index, "productId", event.target.value)
                }
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn-secondary px-3 py-2 text-sm"
              onClick={() => removeEmailInput(index)}
              disabled={rows.length <= MIN_EMAIL_COUNT}
            >
              {t("bulkSend.removeEmail")}
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="btn-primary px-5 py-3 text-sm"
        disabled={isLoading}
      >
        {isLoading ? t("bulkSend.sending") : t("bulkSend.send")}
      </button>

      {result ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-wrap gap-3 text-sm text-stone-700">
            <span>{t("bulkSend.total", { count: result.total })}</span>
            <span>{t("bulkSend.success", { count: result.sent })}</span>
            <span>{t("bulkSend.failed", { count: result.failed })}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2 pr-3">Transaction</th>
                  <th className="py-2 pr-3">QR</th>
                  <th className="py-2">Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row) => (
                  <tr
                    key={`${row.email}-${row.transactionId ?? "x"}`}
                    className="border-t border-stone-100"
                  >
                    <td className="py-2 pr-3 text-stone-700">{row.email}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {row.ok ? t("bulkSend.sent") : t("bulkSend.error")}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-stone-500">
                      {row.transactionId ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-stone-500">
                      {row.qrId ?? "—"}
                    </td>
                    <td className="py-2 text-stone-600">{row.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="text-sm text-stone-500">{t("bulkSend.emptyResult")}</p>
      )}
    </form>
  );
}
