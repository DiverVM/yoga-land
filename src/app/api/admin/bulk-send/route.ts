import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
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

function resolveOrigin(host: string | null): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (!host) {
    return "http://localhost:3000";
  }

  if (!/^[a-zA-Z0-9._:-]+$/.test(host)) {
    return "http://localhost:3000";
  }

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return `http://${host}`;
  }

  return `https://${host}`;
}

export async function POST(request: Request) {
  const body = await parseJsonBody<BulkSendBody>(request);
  if (!body) {
    return fail("Некорректное JSON-тело запроса", 400);
  }

  const itemValidation = validateBulkSendItems(body.items);
  if (!itemValidation.valid) {
    return fail("Ошибка валидации", 400, itemValidation.message);
  }

  const origin = resolveOrigin((await headers()).get("host"));
  const results: BulkSendResult[] = [];

  for (const item of itemValidation.items) {
    try {
      if (!isEmail(item.email)) {
        throw new Error(`Некорректный email: ${item.email}`);
      }

      const product = await getProductById(item.productId);
      if (!product) {
        throw new Error(`Неизвестный productId: ${item.productId}`);
      }

      const transaction = await createTransaction({
        productId: product.id,
        amount: product.price,
        currency: product.currency,
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
        currency: transaction.currency,
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
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
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
