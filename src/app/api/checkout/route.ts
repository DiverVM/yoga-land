import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { registerOrder } from "@/lib/payment-service";
import { getRequestOrigin } from "@/lib/request-origin";
import { createTransaction, updateTransaction } from "@/lib/repositories";
import { validateProductId } from "@/lib/validation.server";

type CheckoutBody = {
  productId?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<CheckoutBody>(request);
  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const validation = await validateProductId(body.productId);
  if (!validation.valid) {
    return fail(t("common.validationFailed"), 400, validation.message);
  }

  const product = validation.product;
  const origin = await getRequestOrigin();

  // Create pending transaction
  const transaction = await createTransaction({
    productId: product.id,
    amount: product.price,
    currencyCode: product.currencyCode,
    paymentStatus: "pending",
  });

  // Register order with Alfa Bank
  const returnUrl = `${origin}/payment/success?transactionId=${transaction.id}`;
  const failUrl = `${origin}/payment/failed?transactionId=${transaction.id}`;
  const description = t("paymentGateway.paymentDescription", {
    productName: product.name,
  });

  let orderResult;
  try {
    orderResult = await registerOrder({
      amount: product.price,
      currencyCode: product.currencyCode,
      orderNumber: transaction.orderNumber,
      returnUrl,
      failUrl,
      description,
    });
  } catch (error) {
    return fail(
      t("paymentGateway.registerFailed"),
      502,
      error instanceof Error ? error.message : t("common.unknownError"),
    );
  }

  // Store orderId in transaction for status polling later
  await updateTransaction(transaction.id, {
    orderId: orderResult.orderId,
  });

  return ok(
    {
      status: "pending",
      formUrl: orderResult.formUrl,
      orderId: orderResult.orderId,
      transactionId: transaction.id,
    },
    201,
  );
}
