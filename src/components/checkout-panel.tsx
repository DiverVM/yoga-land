"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

type CheckoutResponse = {
  status: "success" | "failed";
  redirectUrl?: string;
  message?: string;
  details?: string;
  transactionId?: string;
};

type CheckoutPanelProps = {
  products: Product[];
};

export function CheckoutPanel({ products }: CheckoutPanelProps) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [mode, setMode] = useState<"auto" | "success" | "failed">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentFailure, setPaymentFailure] = useState<{
    message: string;
    transactionId?: string;
  } | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  async function handlePay() {
    if (!selectedProduct) {
      setError(t("checkout.selectCourse"));
      return;
    }

    setError(null);
    setPaymentFailure(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          mode,
        }),
      });

      const data = (await response.json()) as CheckoutResponse & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.details ?? data.error ?? t("checkout.checkoutFailed"),
        );
      }

      if (data.status === "failed") {
        setPaymentFailure({
          message:
            data.details ?? data.message ?? t("checkout.paymentFailedBanner"),
          transactionId: data.transactionId,
        });
        return;
      }

      if (!data.redirectUrl) {
        throw new Error(t("checkout.checkoutFailed"));
      }

      router.push(data.redirectUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("checkout.checkoutFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">{t("checkout.title")}</h2>
        <p className="mt-1 text-sm text-stone-600">{t("checkout.subtitle")}</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">
          {t("checkout.course")}
        </span>
        {products.length === 0 ? (
          <div className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-400">
            {t("checkout.noCourses")}
          </div>
        ) : (
          <select
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-orange-500 transition focus:ring"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {formatMoney(product.price, product.currency)}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">
          {t("checkout.paymentSimulation")}
        </span>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-orange-500 transition focus:ring"
          value={mode}
          onChange={(event) =>
            setMode(event.target.value as "auto" | "success" | "failed")
          }
        >
          <option value="auto">{t("checkout.simulationAuto")}</option>
          <option value="success">{t("checkout.simulationSuccess")}</option>
          <option value="failed">{t("checkout.simulationFailed")}</option>
        </select>
      </label>

      {selectedProduct ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
          <p className="mb-1 text-stone-600">{selectedProduct.description}</p>
          {t("checkout.total")}:{" "}
          <span className="font-bold">
            {formatMoney(selectedProduct.price, selectedProduct.currency)}
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {paymentFailure ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">{t("checkout.paymentFailedTitle")}</p>
          <p className="mt-1">{paymentFailure.message}</p>
          {paymentFailure.transactionId ? (
            <p className="mt-1 text-xs text-red-700">
              {t("checkout.paymentFailedTransaction", {
                id: paymentFailure.transactionId,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePay}
        disabled={isLoading || products.length === 0}
        className="btn-primary w-full px-4 py-3 text-sm"
      >
        {isLoading ? t("checkout.processing") : t("checkout.payNow")}
      </button>
    </div>
  );
}
