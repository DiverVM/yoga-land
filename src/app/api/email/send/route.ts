import { fail, ok, parseJsonBody } from "@/lib/api";
import { sendQrEmail } from "@/lib/email-service";
import { getProductById } from "@/lib/products";
import { createEmailLog, getQrRecordById } from "@/lib/repositories";
import { isEmail } from "@/lib/validation";
import { getTransactionById } from "@/lib/repositories";

type SendEmailBody = {
  qrId?: string;
  to?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<SendEmailBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (!body.qrId || !body.to) {
    return fail("Validation failed", 400, "qrId and to are required");
  }

  if (!isEmail(body.to)) {
    return fail("Validation failed", 400, "Invalid email address");
  }

  const qrRecord = await getQrRecordById(body.qrId);
  if (!qrRecord) {
    return fail("QR record not found", 404);
  }

  const transaction = await getTransactionById(qrRecord.transactionId);
  if (!transaction) {
    return fail("Transaction not found", 404);
  }

  const product = getProductById(transaction.productId);
  if (!product) {
    return fail("Product not found", 404);
  }

  const sendResult = await sendQrEmail({
    qrId: qrRecord.id,
    to: body.to,
    qrUrl: qrRecord.qrUrl,
    transactionId: transaction.id,
    transactionDate: transaction.createdAt,
    productName: product.name,
    amount: transaction.amount,
    currency: transaction.currency,
  });

  const emailLog = await createEmailLog({
    qrId: qrRecord.id,
    to: body.to,
    status: sendResult.ok ? "sent" : "failed",
  });

  if (!sendResult.ok) {
    return fail("Email delivery failed", 502, sendResult.error);
  }

  return ok({ emailLog, providerId: sendResult.providerId }, 201);
}
