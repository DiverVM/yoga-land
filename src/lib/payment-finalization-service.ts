import { randomUUID } from "node:crypto";
import { getOrderStatus } from "@/lib/payment-service";
import {
  buildQrDetailsUrl,
  buildQrPayload,
  serializeQrPayload,
  toQrDataUrl,
} from "@/lib/qr-service";
import {
  createQrRecord,
  getQrRecordById,
  updateTransaction,
} from "@/lib/repositories";
import type { Product, QrRecord, Transaction } from "@/lib/types";

export type FinalizePaymentInput = {
  transaction: Transaction;
  product: Product;
  origin: string;
};

export type FinalizePaymentResult = {
  orderStatus: number;
  qrRecord?: QrRecord;
  imageUrl?: string;
};

export async function finalizePayment(
  input: FinalizePaymentInput,
): Promise<FinalizePaymentResult> {
  const { transaction, product, origin } = input;

  if (!transaction.orderId) {
    throw new Error("Missing orderId for payment finalization");
  }

  const { orderStatus } = await getOrderStatus(transaction.orderId);

  if (orderStatus !== 2) {
    return { orderStatus };
  }

  if (transaction.qrId) {
    const qrRecord = await getQrRecordById(transaction.qrId);
    if (!qrRecord) {
      return { orderStatus };
    }

    const imageUrl = await toQrDataUrl(qrRecord.qrUrl);
    return {
      orderStatus,
      qrRecord,
      imageUrl,
    };
  }

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
    transactionId: transaction.id,
    qrUrl,
    payload,
  });

  await updateTransaction(transaction.id, {
    paymentStatus: "success",
    qrId: qrRecord.id,
  });

  const imageUrl = await toQrDataUrl(qrUrl);

  return {
    orderStatus,
    qrRecord,
    imageUrl,
  };
}
