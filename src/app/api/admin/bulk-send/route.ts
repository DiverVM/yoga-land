import { randomUUID } from "node:crypto";
import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { sendQrEmail } from "@/lib/email-service";
import {
  buildQrDetailsUrl,
  buildQrPayload,
  serializeQrPayload,
} from "@/lib/qr-service";
import {
  createEmailLog,
  createQrRecord,
  createTransaction,
  getProductById,
  updateTransaction,
} from "@/lib/repositories";
import { getRequestOrigin } from "@/lib/request-origin";
import {
  isEmail,
  normalizeEmail,
  validateBulkSendItems,
} from "@/lib/validation";

export const runtime = "nodejs";

type BulkSendBody = {
  items?: Array<{
    email?: string;
    productId?: string;
  }>;
};

type BulkSendResult = {
  email: string;
  ok: boolean;
  transactionId?: string;
  qrId?: string;
  error?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<BulkSendBody>(request);
  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const itemValidation = validateBulkSendItems(body.items);
  if (!itemValidation.valid) {
    return fail(t("common.validationFailed"), 400, itemValidation.message);
  }

  const origin = await getRequestOrigin();
  const results: BulkSendResult[] = [];

  for (const item of itemValidation.items) {
    try {
      if (!isEmail(item.email)) {
        throw new Error(t("validation.invalidEmail", { email: item.email }));
      }

      const product = await getProductById(item.productId);
      if (!product) {
        throw new Error(
          t("validation.unknownProductId", { productId: item.productId }),
        );
      }

      const transaction = await createTransaction({
        productId: product.id,
        amount: product.price,
        currencyCode: product.currencyCode,
        paymentStatus: "success",
      });

      const qrId = randomUUID();
      const qrUrl = buildQrDetailsUrl(origin, qrId);
      const payload = serializeQrPayload(
        buildQrPayload({ transaction, productName: product.name }),
      );

      const qrRecord = await createQrRecord({
        id: qrId,
        transactionId: transaction.id,
        qrUrl,
        payload,
      });

      await updateTransaction(transaction.id, { qrId: qrRecord.id });

      const sendResult = await sendQrEmail({
        qrId: qrRecord.id,
        to: item.email,
        qrUrl: qrRecord.qrUrl,
        transactionId: transaction.id,
        transactionDate: transaction.createdAt,
        productName: product.name,
        amount: transaction.amount,
        currencyCode: transaction.currencyCode,
      });

      await createEmailLog({
        qrId: qrRecord.id,
        to: item.email,
        status: sendResult.ok ? "sent" : "failed",
      });

      if (!sendResult.ok) {
        results.push({
          email: item.email,
          ok: false,
          transactionId: transaction.id,
          qrId: qrRecord.id,
          error: sendResult.error,
        });
        continue;
      }

      results.push({
        email: item.email,
        ok: true,
        transactionId: transaction.id,
        qrId: qrRecord.id,
      });
    } catch (error) {
      results.push({
        email: normalizeEmail(item.email ?? ""),
        ok: false,
        error:
          error instanceof Error ? error.message : t("common.unknownError"),
      });
    }
  }

  return ok(
    {
      total: results.length,
      sent: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).length,
      results,
    },
    200,
  );
}
