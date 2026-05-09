"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

type CheckoutResponse = {
  status: "success" | "failed";
  redirectUrl: string;
};

export function CheckoutPanel() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [mode, setMode] = useState<"auto" | "success" | "failed">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: { products?: Product[] }) => {
        const list = data.products ?? [];
        setProducts(list);
        setProductId(list[0]?.id ?? "");
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  async function handlePay() {
    if (!selectedProduct) {
      setError("Please select a course.");
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
          mode,
        }),
      });

      const data = (await response.json()) as CheckoutResponse & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.details ?? data.error ?? "Checkout failed");
      }

      router.push(data.redirectUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Checkout failed",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Buy a Course</h2>
        <p className="mt-1 text-sm text-stone-600">
          Select a course below and complete your purchase to receive a QR code.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">Course</span>
        {productsLoading ? (
          <div className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-400">
            Loading courses…
          </div>
        ) : (
          <select
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-orange-500 transition focus:ring"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — ${product.price} {product.currency}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-stone-700">
          Payment simulation
        </span>
        <select
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none ring-orange-500 transition focus:ring"
          value={mode}
          onChange={(event) =>
            setMode(event.target.value as "auto" | "success" | "failed")
          }
        >
          <option value="auto">Auto</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      {selectedProduct ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
          <p className="mb-1 text-stone-600">{selectedProduct.description}</p>
          Total: <span className="font-bold">
            ${selectedProduct.price}
          </span>{" "}
          {selectedProduct.currency}
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
        disabled={isLoading || productsLoading}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Processing…" : "Pay now"}
      </button>
    </div>
  );
}
