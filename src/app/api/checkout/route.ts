import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { fail, ok, parseJsonBody } from "@/lib/api";
import {
  simulatePayment,
  type PaymentSimulationMode,
} from "@/lib/payment-service";
import {
  buildQrDetailsUrl,
  buildQrPayload,
  serializeQrPayload,
} from "@/lib/qr-service";
import {
  createQrRecord,
  createTransaction,
  updateTransaction,
} from "@/lib/repositories";
import { validateProductId } from "@/lib/validation.server";

type CheckoutBody = {
  productId?: string;
  mode?: PaymentSimulationMode;
};

function resolveOrigin(host: string | null): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (!host) {
    return "http://localhost:3000";
  }

  // Reject hosts with unexpected characters to prevent header injection.
  if (!/^[a-zA-Z0-9._:-]+$/.test(host)) {
    return "http://localhost:3000";
  }

  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return `http://${host}`;
  }

  return `https://${host}`;
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CheckoutBody>(request);
  if (!body) {
    return fail("Некорректное JSON-тело запроса", 400);
  }

  const validation = await validateProductId(body.productId);
  if (!validation.valid) {
    return fail("Ошибка валидации", 400, validation.message);
  }

  const mode = body.mode ?? "auto";
  if (!["auto", "success", "failed"].includes(mode)) {
    return fail(
      "Ошибка валидации",
      400,
      "mode должен быть одним из: auto, success, failed",
    );
  }

  const product = validation.product;

  const transaction = await createTransaction({
    productId: product.id,
    amount: product.price,
    currency: product.currency,
    paymentStatus: "pending",
  });

  const paymentResult = await simulatePayment({ mode });

  if (paymentResult.status === "failed") {
    const failedTransaction = await updateTransaction(transaction.id, {
      paymentStatus: "failed",
    });

    return ok(
      {
        status: "failed",
        message: "Оплата не прошла",
        details:
          "Платеж отклонен. Ничего не списано, можно попробовать еще раз.",
        transactionId: transaction.id,
        transaction: failedTransaction,
      },
      201,
    );
  }

  const successTransaction = await updateTransaction(transaction.id, {
    paymentStatus: "success",
  });

  if (!successTransaction) {
    return fail("Ошибка состояния транзакции", 500);
  }

  const origin = resolveOrigin((await headers()).get("host"));
  const qrId = randomUUID();
  const qrUrl = buildQrDetailsUrl(origin, qrId);
  const payload = serializeQrPayload(
    buildQrPayload({
      transaction: successTransaction,
      productName: product.name,
    }),
  );

  const qrRecord = await createQrRecord({
    id: qrId,
    transactionId: successTransaction.id,
    qrUrl,
    payload,
  });

  await updateTransaction(successTransaction.id, {
    qrId: qrRecord.id,
  });

  return ok(
    {
      status: "success",
      redirectUrl: `/payment/success?transactionId=${successTransaction.id}&qrId=${qrRecord.id}`,
      transactionId: successTransaction.id,
      qrId: qrRecord.id,
    },
    201,
  );
}
