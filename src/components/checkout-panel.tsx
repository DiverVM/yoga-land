"use client";

import { useMemo, useState } from "react";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

type CheckoutResponse = {
  status: "pending";
  formUrl: string;
  orderId: string;
  transactionId: string;
};

type CheckoutPanelProps = {
  products: Product[];
};

export function CheckoutPanel({ products }: CheckoutPanelProps) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
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

      if (!data.formUrl) {
        throw new Error(t("checkout.checkoutFailed"));
      }

      // Redirect to Alfa payment form
      window.location.href = data.formUrl;
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
                {product.name} —{" "}
                {formatMoney(product.price, product.currencyCode)}
              </option>
            ))}
          </select>
        )}
      </label>

      {selectedProduct ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
          <p className="mb-1 text-stone-600">{selectedProduct.description}</p>
          {t("checkout.total")}:{" "}
          <span className="font-bold">
            {formatMoney(selectedProduct.price, selectedProduct.currencyCode)}
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
