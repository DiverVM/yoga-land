"use server";

import { t } from "@/i18n";
import { registerOrder } from "@/lib/payment-service";
import { getRequestOrigin } from "@/lib/request-origin";
import { createTransaction, updateTransaction } from "@/lib/repositories";
import { normalizeOptionalName } from "@/lib/validation";
import { validateProductId } from "@/lib/validation.server";

export type CheckoutActionState = {
  formUrl?: string;
  error?: string;
} | null;

export async function checkoutAction(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const productId = formData.get("productId");
  const firstName = normalizeOptionalName(formData.get("firstName"));
  const lastName = normalizeOptionalName(formData.get("lastName"));

  const validation = await validateProductId(
    typeof productId === "string" ? productId : undefined,
  );
  if (!validation.valid) {
    return { error: validation.message ?? t("common.validationFailed") };
  }

  const product = validation.product;
  const origin = await getRequestOrigin();

  const transaction = await createTransaction({
    productId: product.id,
    firstName,
    lastName,
    amount: product.price,
    currencyCode: product.currencyCode,
    paymentStatus: "pending",
  });

  const returnUrl = `${origin}/payment/success?transactionId=${transaction.id}`;
  const failUrl = `${origin}/payment/failed?transactionId=${transaction.id}`;
  const description = t("paymentGateway.paymentDescription", {
    productName: product.name,
  });

  let orderResult;
  try {
    orderResult = await registerOrder({
      amountRubles: product.price,
      currencyCode: product.currencyCode,
      orderNumber: transaction.orderNumber,
      returnUrl,
      failUrl,
      description,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : t("paymentGateway.registerFailed"),
    };
  }

  await updateTransaction(transaction.id, { orderId: orderResult.orderId });

  return { formUrl: orderResult.formUrl };
}
