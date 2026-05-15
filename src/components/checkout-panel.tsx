"use client";

import { useActionState, useEffect, useState } from "react";
import {
  checkoutAction,
  type CheckoutActionState,
} from "@/lib/actions/checkout";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

type CheckoutPanelProps = {
  products: Product[];
};

export function CheckoutPanel({ products }: CheckoutPanelProps) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  const [state, dispatch, isPending] = useActionState<
    CheckoutActionState,
    FormData
  >(checkoutAction, null);

  // Redirect to external Alfa payment form once we have a formUrl
  useEffect(() => {
    if (state?.formUrl) {
      window.location.href = state.formUrl;
    }
  }, [state?.formUrl]);

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <form action={dispatch} className="space-y-5">
      {/* hidden field carries the selected productId */}
      <input type="hidden" name="productId" value={productId} />

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

      {state?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || products.length === 0}
        className="btn-primary w-full px-4 py-3 text-sm"
      >
        {isPending ? t("checkout.processing") : t("checkout.payNow")}
      </button>
    </form>
  );
}
