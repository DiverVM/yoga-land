import { getProductById } from "@/lib/repositories";
import type { DecisionStatus, PaymentStatus, Product } from "@/lib/types";

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    ["pending", "success", "failed"].includes(value)
  );
}

export function isDecisionStatus(value: unknown): value is DecisionStatus {
  return (
    typeof value === "string" &&
    ["pending", "accepted", "declined"].includes(value)
  );
}

export async function validateProductId(productId: unknown) {
  if (!isNonEmptyString(productId)) {
    return {
      valid: false as const,
      message: "Требуется productId",
    };
  }

  const product = await getProductById(productId);
  if (!product) {
    return {
      valid: false as const,
      message: "Неизвестный productId",
    };
  }

  return {
    valid: true as const,
    product: product as Product,
  };
}
