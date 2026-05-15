import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { finalizePayment } from "@/lib/payment-finalization-service";
import { getProductById, getTransactionById } from "@/lib/repositories";
import { getRequestOrigin } from "@/lib/request-origin";

type CheckStatusBody = {
  orderId: string;
  transactionId: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<CheckStatusBody>(request);
  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const { orderId, transactionId } = body;

  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    return fail(t("common.notFound"), 404, t("payment.transactionNotFound"));
  }

  try {
    const product = await getProductById(transaction.productId);
    if (!product) {
      return fail(t("common.notFound"), 404, t("payment.productNotFound"));
    }

    const origin = await getRequestOrigin();
    const result = await finalizePayment({
      transaction,
      product,
      orderId,
      origin,
    });

    return ok(result);
  } catch (error) {
    return fail(
      t("payment.statusCheckFailed"),
      502,
      error instanceof Error ? error.message : t("common.unknownError"),
    );
  }
}
