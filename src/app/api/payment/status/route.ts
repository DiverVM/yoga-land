import { randomUUID } from "node:crypto";
import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { getOrderStatus } from "@/lib/payment-service";
import {
  buildQrDetailsUrl,
  buildQrPayload,
  serializeQrPayload,
} from "@/lib/qr-service";
import {
  createQrRecord,
  getProductById,
  getTransactionById,
  updateTransaction,
} from "@/lib/repositories";
import { getRequestOrigin } from "@/lib/request-origin";
import { toQrDataUrl } from "@/lib/qr-service";

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

  // Get order status from Alfa
  let orderStatus;
  try {
    const result = await getOrderStatus(orderId);
    orderStatus = result.orderStatus;
  } catch (error) {
    return fail(
      t("payment.statusCheckFailed"),
      502,
      error instanceof Error ? error.message : t("common.unknownError"),
    );
  }

  // Status: 0 = pending (keep polling), 2 = authorized+completed (success), other = failed
  const response: Record<string, unknown> = {
    orderStatus,
  };

  if (orderStatus === 2) {
    // Payment successful - create QR if not already created
    if (!transaction.qrId) {
      try {
        const product = await getProductById(transaction.productId);
        if (!product) {
          return fail(t("common.notFound"), 404, t("payment.productNotFound"));
        }

        const origin = await getRequestOrigin();
        const qrId = randomUUID();
        const qrUrl = buildQrDetailsUrl(origin, qrId);
        const payload = serializeQrPayload(
          buildQrPayload({
            transaction,
            productName: product.name,
          }),
        );

        const qrRecord = await createQrRecord({
          id: qrId,
          transactionId,
          qrUrl,
          payload,
        });

        await updateTransaction(transactionId, {
          paymentStatus: "success",
          qrId: qrRecord.id,
        });

        const imageUrl = await toQrDataUrl(qrUrl);

        response.qrRecord = qrRecord;
        response.imageUrl = imageUrl;
      } catch (error) {
        return fail(
          t("payment.qrCreateFailed"),
          500,
          error instanceof Error ? error.message : t("common.unknownError"),
        );
      }
    } else {
      // QR already exists, just fetch and return
      try {
        const qrRecord = await getTransactionById(transactionId);
        if (qrRecord?.qrId) {
          const imageUrl = await toQrDataUrl(qrRecord.qrId);
          response.imageUrl = imageUrl;
        }
      } catch {
        // Continue without image URL if it fails
      }
    }
  }

  return ok(response);
}
